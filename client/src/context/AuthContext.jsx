import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await auth.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const data = await auth.login({ email, password });
    setUser(data.user);
    return data;
  };

  const register = async (email, password, name) => {
    const data = await auth.register({ email, password, name });
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  const sendCode = async (email, name) => {
    return auth.sendCode({ email, ...(name ? { name } : {}) });
  };

  const verifyCode = async (email, code) => {
    const data = await auth.verifyCode({ email, code });
    setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, sendCode, verifyCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
