import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'student';
  studentId?: number;
  teacherId?: number;
  studentCode?: string;
  teacherCode?: string;
  courseId?: number;
  batchId?: number;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<User>;
  quickLogin: (role: 'admin' | 'teacher' | 'student') => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('classconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('classconnect_token');
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('classconnect_user', JSON.stringify(res.user));
          }
        } catch {
          // Token expired
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (identifier: string, pass: string): Promise<User> => {
    const res = await api.post('/auth/login', { identifier, password: pass });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('classconnect_token', res.token);
      localStorage.setItem('classconnect_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const quickLogin = async (role: 'admin' | 'teacher' | 'student'): Promise<User> => {
    const credentials = {
      admin: { id: 'admin@classconnect.com', pass: 'admin123' },
      teacher: { id: 'teacher@classconnect.com', pass: 'teacher123' },
      student: { id: 'student@classconnect.com', pass: 'student123' }
    };
    const cred = credentials[role];
    return login(cred.id, cred.pass);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('classconnect_token');
    localStorage.removeItem('classconnect_user');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('classconnect_user', JSON.stringify(res.user));
      }
    } catch (e) {
      console.error('Refresh user error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, quickLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
