import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../rbac/permissions';
import type { Permission } from '../rbac/permissions';

const API_BASE = import.meta.env.VITE_API_URL ?? "";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'support' | 'readonly';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Token aus URL-Parameter laden (OAuth Redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, '/');
      fetchUserInfo(token);
    } else {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        fetchUserInfo(storedToken);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      window.location.href = '/';
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const checkPermission = (permission: Permission) => hasPermission(user?.role, permission);
  const checkAnyPermission = (permissions: Permission[]) => hasAnyPermission(user?.role, permissions);
  const checkAllPermissions = (permissions: Permission[]) => hasAllPermissions(user?.role, permissions);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAuthenticated, 
      isAdmin,
      hasPermission: checkPermission,
      hasAnyPermission: checkAnyPermission,
      hasAllPermissions: checkAllPermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth-Header mit Token
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}
