import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  loginAsDemo: (role: UserRole) => Promise<User | null>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS: Record<UserRole, { email: string; pass: string; label: string; role: UserRole }> = {
  farmer: {
    email: 'ramesh.farmer@agrimarket.in',
    pass: 'Farmer@123',
    label: 'Ramesh Patil (Nashik Farmer)',
    role: 'farmer',
  },
  buyer: {
    email: 'priya.buyer@itc-agri.com',
    pass: 'Buyer@123',
    label: 'Priya Sharma (ITC Wholesale Buyer)',
    role: 'buyer',
  },
  fpo: {
    email: 'sahyadri.fpo@agrimarket.in',
    pass: 'Fpo@123',
    label: 'Sahyadri Farmers Producer Co.',
    role: 'fpo',
  },
  admin: {
    email: 'admin@agrimarket.gov.in',
    pass: 'Admin@123',
    label: 'Rajesh Verma (Platform Admin)',
    role: 'admin',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (): Promise<User | null> => {
    try {
      const res = await api.getMe();
      setUser(res.data);
      localStorage.setItem('auth_user', JSON.stringify(res.data));
      return res.data;
    } catch {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      return await fetchProfile();
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (role: UserRole): Promise<User | null> => {
    const creds = DEMO_ACCOUNTS[role];
    if (creds) {
      return await login(creds.email, creds.pass);
    }
    return null;
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      await api.register(data);
      await login(data.email, data.password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsDemo, register, logout, refreshUser }}>
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
