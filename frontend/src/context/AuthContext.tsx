import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  loginDemo: (role: 'DONOR' | 'RECEIVER' | 'ADMIN') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('reroute_user');
    const token = localStorage.getItem('reroute_access_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('reroute_user');
      }
    }
    // Fetch latest fresh user details if token exists
    if (token) {
      refreshCurrentUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshCurrentUser = async () => {
    try {
      const res = await apiClient.get('/auth/me/');
      setUser(res.data);
      localStorage.setItem('reroute_user', JSON.stringify(res.data));
    } catch (err) {
      // Token might be invalid
      console.warn('Could not refresh current user session');
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiClient.post('/auth/login/', { email, password });
    const { access, refresh, user: loggedInUser } = res.data;
    localStorage.setItem('reroute_access_token', access);
    localStorage.setItem('reroute_refresh_token', refresh);
    localStorage.setItem('reroute_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (userData: any) => {
    await apiClient.post('/auth/register/', userData);
    await login(userData.email, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('reroute_access_token');
    localStorage.removeItem('reroute_refresh_token');
    localStorage.removeItem('reroute_user');
    setUser(null);
  };

  const loginDemo = async (role: 'DONOR' | 'RECEIVER' | 'ADMIN') => {
    let email = 'greenbistro@reroute.ai';
    let password = 'DonorPass123!';

    if (role === 'RECEIVER') {
      email = 'hopekitchen@reroute.ai';
      password = 'ReceiverPass123!';
    } else if (role === 'ADMIN') {
      email = 'admin@reroute.ai';
      password = 'AdminPass123!';
    }

    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshCurrentUser,
        loginDemo,
      }}
    >
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

