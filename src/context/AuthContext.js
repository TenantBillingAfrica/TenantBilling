import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  login as cognitoLogin,
  completeNewPassword,
  confirmMfaCode,
  logout as cognitoLogout,
  getCurrentSession,
} from '../services/auth.service';
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../services/whatsapp.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tb_user');
    const mfaVerified = localStorage.getItem('tb_mfa_verified');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role === 'system_admin' && mfaVerified !== 'true') return null;
      return parsed;
    } catch (_) {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('tb_id_token');
    const stored = localStorage.getItem('tb_user');
    const mfaVerified = localStorage.getItem('tb_mfa_verified');
    if (!token || !stored) return false;
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role === 'system_admin' && mfaVerified !== 'true') return false;
      return true;
    } catch (_) {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [whatsAppSession, setWhatsAppSession] = useState(null);

  // On mount, verify/refresh the session
  useEffect(() => {
    getCurrentSession()
      .then((session) => {
        if (session) {
          const isSystemAdmin = session.user?.role === 'system_admin';
          const mfaVerified = localStorage.getItem('tb_mfa_verified') === 'true';

          if (isSystemAdmin && !mfaVerified) {
            // Clear unverified system admin session
            cognitoLogout();
            localStorage.removeItem('tb_id_token');
            localStorage.removeItem('tb_user');
            localStorage.removeItem('tb_mfa_verified');
            setUser(null);
            setIsAuthenticated(false);
          } else {
            localStorage.setItem('tb_id_token', session.idToken);
            localStorage.setItem('tb_user', JSON.stringify(session.user));
            setUser(session.user);
            setIsAuthenticated(true);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const requestWhatsAppOtp = useCallback(async (phone, email) => {
    try {
      const data = await sendWhatsAppOtp(phone, email);
      setWhatsAppSession(data);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to send OTP' };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      // Clear any prior unverified session state
      localStorage.removeItem('tb_id_token');
      localStorage.removeItem('tb_user');
      localStorage.removeItem('tb_mfa_verified');
      setUser(null);
      setIsAuthenticated(false);

      const result = await cognitoLogin(email, password);

      // Handle forced password change or Cognito MFA challenges
      if (result.challengeName) {
        setPendingChallenge(result);
        return {
          success: false,
          challenge: result.challengeName,
          destination: result.destination,
        };
      }

      // Enforce 2FA for system admin accounts
      const isSystemAdmin = result.user?.role === 'system_admin';
      if (isSystemAdmin) {
        setPendingChallenge({
          challengeName: 'MFA_REQUIRED',
          user: result.user,
          idToken: result.idToken,
          email,
          destination: result.user?.phone || '',
        });
        return {
          success: false,
          challenge: 'MFA_REQUIRED',
          destination: result.user?.phone || '',
          email,
        };
      }

      localStorage.setItem('tb_id_token', result.idToken);
      localStorage.setItem('tb_user', JSON.stringify(result.user));
      localStorage.setItem('tb_mfa_verified', 'true');
      setUser(result.user);
      setIsAuthenticated(true);
      return { success: true, user: result.user };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password' };
    }
  }, []);

  const confirmMfa = useCallback(async (mfaCode) => {
    if (!pendingChallenge) {
      return { success: false, error: 'No pending MFA challenge' };
    }

    try {
      // 1. If ChatWorks OTP session exists, verify against ChatWorks first
      if (whatsAppSession?.token) {
        const targetPhone = pendingChallenge.destination || '';
        await verifyWhatsAppOtp({
          token: whatsAppSession.token,
          emailToken: whatsAppSession.emailToken || null,
          code: mfaCode,
          phone: targetPhone,
        });

        // ChatWorks OTP verified successfully! Complete login.
        localStorage.setItem('tb_id_token', pendingChallenge.idToken);
        localStorage.setItem('tb_user', JSON.stringify(pendingChallenge.user));
        localStorage.setItem('tb_mfa_verified', 'true');
        setUser(pendingChallenge.user);
        setIsAuthenticated(true);
        setPendingChallenge(null);
        setWhatsAppSession(null);
        return { success: true, user: pendingChallenge.user };
      }

      // 2. Fallback: If only Cognito MFA challenge exists
      if (pendingChallenge.cognitoUser) {
        const mfaType = pendingChallenge.challengeName === 'TOTP_REQUIRED' ? 'SOFTWARE_TOKEN_MFA' : 'SMS_MFA';
        const result = await confirmMfaCode(pendingChallenge.cognitoUser, mfaCode, mfaType);
        localStorage.setItem('tb_id_token', result.idToken);
        localStorage.setItem('tb_user', JSON.stringify(result.user));
        localStorage.setItem('tb_mfa_verified', 'true');
        setUser(result.user);
        setIsAuthenticated(true);
        setPendingChallenge(null);
        return { success: true, user: result.user };
      }

      return { success: false, error: 'Please click Resend OTP to receive a new code' };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid verification code' };
    }
  }, [pendingChallenge, whatsAppSession]);

  const changePassword = useCallback(async (newPassword) => {
    if (!pendingChallenge?.cognitoUser) {
      return { success: false, error: 'No pending challenge' };
    }
    try {
      const result = await completeNewPassword(pendingChallenge.cognitoUser, newPassword);
      localStorage.setItem('tb_id_token', result.idToken);
      localStorage.setItem('tb_user', JSON.stringify(result.user));
      localStorage.setItem('tb_mfa_verified', 'true');
      setUser(result.user);
      setIsAuthenticated(true);
      setPendingChallenge(null);
      return { success: true, user: result.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [pendingChallenge]);

  const logout = useCallback(() => {
    cognitoLogout();
    localStorage.removeItem('tb_id_token');
    localStorage.removeItem('tb_user');
    localStorage.removeItem('tb_mfa_verified');
    setUser(null);
    setIsAuthenticated(false);
    setPendingChallenge(null);
    setWhatsAppSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      changePassword,
      confirmMfa,
      requestWhatsAppOtp,
      pendingChallenge,
      whatsAppSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
