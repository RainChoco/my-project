import { createContext, useContext, useState, useCallback } from 'react';
import { AUTH_TOKEN_KEY } from '../lib/apiClient';
import { decodeJwt, isTokenExpired } from '../utils/jwt';

const AuthContext = createContext(null);

function readSession() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const decoded = decodeJwt(token);

  if (!decoded || isTokenExpired(decoded)) {
    if (token) localStorage.removeItem(AUTH_TOKEN_KEY);
    return { token: null, user: null };
  }

  return {
    token,
    user: { id: decoded.sub, full_name: decoded.full_name, email: decoded.email, role: decoded.role },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const login = useCallback((token) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setSession(readSession());
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setSession({ token: null, user: null });
  }, []);

  const value = {
    user: session.user,
    role: session.user?.role ?? null,
    isAuthenticated: Boolean(session.user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
