import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authService.me();
          if (response.data.success) {
            setUser(response.data.data);
            console.log('User loaded:', response.data.data);
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        console.log('User logged in:', user);
        return { success: true, user };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de connexion';
      return { success: false, message };
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'inscription',
        errors: error.response?.data?.errors,
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const isAdmin = () => {
    return user?.role?.name === 'admin_si';
  };

  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    return user.role.permissions?.includes(permission) || false;
  };

  const hasRole = (roleName) => {
    const result = user?.role?.name === roleName;
    console.log('hasRole check:', {
      requiredRole: roleName,
      userRole: user?.role?.name,
      result: result
    });
    return result;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin,
    hasPermission,
    hasRole,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;