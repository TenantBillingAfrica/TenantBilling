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

const adminPhoneMap = {
  'inashuriye@gmail.com': '+254722265670',
  'administrator@tenantbilling.africa': '+254717124662',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tb_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('tb_id_token');
  });
  const [loading, setLoading] = useState(true);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [whatsAppSession, setWhatsAppSession] = useState(null);

  // On mount, verify/refresh the session
  useEffect(() => {
    getCurrentSession()
      .then((session) => {
        if (session) {
          localStorage.setItem('tb_id_token', session.idToken);
          localStorage.setItem('tb_user', JSON.stringify(session.user));
          setUser(session.user);
          setIsAuthenticated(true);
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
      const isSystemAdmin = result.user?.role === 'system_admin' || ['inashuriye@gmail.com', 'administrator@tenantbilling.africa'].includes(email);
      if (isSystemAdmin) {
        const targetPhone = adminPhoneMap[email] || '+254722265670';
        setPendingChallenge({
          challengeName: 'MFA_REQUIRED',
          user: result.user,
          idToken: result.idToken,
          email,
          destination: targetPhone,
        });
        return {
          success: false,
          challenge: 'MFA_REQUIRED',
          destination: targetPhone,
          email,
        };
      }

      localStorage.setItem('tb_id_token', result.idToken);
      localStorage.setItem('tb_user', JSON.stringify(result.user));
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
      // 1. If ChatWorks OTP session exists, always verify against ChatWorks first
      if (whatsAppSession?.token) {
        const targetPhone = pendingChallenge.destination || adminPhoneMap[pendingChallenge.email] || '+254722265670';
        await verifyWhatsAppOtp({
          token: whatsAppSession.token,
          emailToken: whatsAppSession.emailToken || null,
          code: mfaCode,
          phone: targetPhone,
        });

        // ChatWorks OTP verified successfully! Complete login.
        localStorage.setItem('tb_id_token', pendingChallenge.idToken);
        localStorage.setItem('tb_user', JSON.stringify(pendingChallenge.user));
        setUser(pendingChallenge.user);
        setIsAuthenticated(true);
        setPendingChallenge(null);
        setWhatsAppSession(null);
        return { success: true, user: pendingChallenge.user };
      }

      // 2. Fallback: If only Cognito MFA challenge exists (no ChatWorks session)
      if (pendingChallenge.cognitoUser) {
        const mfaType = pendingChallenge.challengeName === 'TOTP_REQUIRED' ? 'SOFTWARE_TOKEN_MFA' : 'SMS_MFA';
        const result = await confirmMfaCode(pendingChallenge.cognitoUser, mfaCode, mfaType);
        localStorage.setItem('tb_id_token', result.idToken);
        localStorage.setItem('tb_user', JSON.stringify(result.user));
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
