import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

// Demo users for development
const DEMO_USERS = {
  'admin@tenantbilling.com': {
    id: 'sys-001',
    email: 'admin@tenantbilling.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'system_admin',
  },
  'landlord@demo.com': {
    id: 'll-001',
    email: 'landlord@demo.com',
    password: 'demo123',
    name: 'James Kamau',
    role: 'instance_admin',
    instanceId: 'inst-001',
    instanceName: 'Kamau Properties',
  },
  'meter@demo.com': {
    id: 'mr-001',
    email: 'meter@demo.com',
    password: 'demo123',
    name: 'Peter Ochieng',
    role: 'meter_reader',
    instanceId: 'inst-001',
    instanceName: 'Kamau Properties',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tb_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('tb_token');
  });

  const login = useCallback(async (email, password) => {
    const demoUser = DEMO_USERS[email];
    if (demoUser && demoUser.password === password) {
      const token = `demo_token_${demoUser.id}_${Date.now()}`;
      localStorage.setItem('tb_token', token);
      localStorage.setItem('tb_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setIsAuthenticated(true);
      return { success: true, user: demoUser };
    }
    return { success: false, error: 'Invalid email or password' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tb_token');
    localStorage.removeItem('tb_user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
