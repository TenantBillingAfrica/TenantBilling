import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  login as cognitoLogin,
  completeNewPassword,
  confirmMfaCode,
  logout as cognitoLogout,
  getCurrentSession,
} from '../services/auth.service';

const AuthContext = createContext();

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

  const login = useCallback(async (email, password) => {
    try {
      const result = await cognitoLogin(email, password);

      // Handle forced password change or MFA challenges
      if (result.challengeName) {
        setPendingChallenge(result);
        return {
          success: false,
          challenge: result.challengeName,
          destination: result.destination,
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
    if (!pendingChallenge?.cognitoUser) {
      return { success: false, error: 'No pending MFA challenge' };
    }
    try {
      const mfaType = pendingChallenge.challengeName === 'TOTP_REQUIRED' ? 'SOFTWARE_TOKEN_MFA' : 'SMS_MFA';
      const result = await confirmMfaCode(pendingChallenge.cognitoUser, mfaCode, mfaType);
      localStorage.setItem('tb_id_token', result.idToken);
      localStorage.setItem('tb_user', JSON.stringify(result.user));
      setUser(result.user);
      setIsAuthenticated(true);
      setPendingChallenge(null);
      return { success: true, user: result.user };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid verification code' };
    }
  }, [pendingChallenge]);

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
      pendingChallenge,
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
