'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  avatar?: string | null;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType>({ refreshProfile: async () => {} } as unknown as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = Cookies.get('token');
    if (savedToken) {
      setToken(savedToken);
      api.get('/auth/profile')
        .then(res => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, refreshToken: rt, user: u } = res.data;
    Cookies.set('token', t, { expires: 1 / 96, secure: true, sameSite: 'Strict' }); // 15min
    Cookies.set('refreshToken', rt, { expires: 7, secure: true, sameSite: 'Strict' });
    setToken(t);
    setUser(u);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data);
    const { token: t, refreshToken: rt, user: u } = res.data;
    Cookies.set('token', t, { expires: 1 / 96, secure: true, sameSite: 'Strict' }); // 15min
    Cookies.set('refreshToken', rt, { expires: 7, secure: true, sameSite: 'Strict' });
    setToken(t);
    setUser(u);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
    } catch {}
  };

  const logout = () => {
    const rt = Cookies.get('refreshToken');
    if (rt) api.post('/auth/logout', { refreshToken: rt }).catch(() => {});
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
