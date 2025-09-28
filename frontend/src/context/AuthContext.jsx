/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));

  const isAuthenticated = !!token;

  useEffect(() => {
    // Opcjonalnie: przy starcie aplikacji ponownie zweryfikuj token i pobierz profil
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      setToken(access);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  const register = async (formData) => {
    try {
        const response = await authAPI.register(formData);
        return {success:true};
    } catch (error) {
        console.error('An error occured:', error);
        return {
            success:false,
            error: error.response?.data || 'Registeration failed.'
        }
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, register, isAuthenticated, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
