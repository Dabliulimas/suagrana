'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { logComponents } from "../lib/logger";
import apiClient from '../lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há token salvo ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar se há token válido (via cookies ou localStorage)
        const userData = await apiClient.getCurrentUser();
        if (userData) {
          setUser(userData);
          setToken(apiClient.getAccessTokenPublic());
        }
      } catch (error) {
        logComponents.info('Nenhum usuário autenticado encontrado');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Escutar eventos de logout automático
    const handleAutoLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:logout', handleAutoLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAutoLogout);
    };
  }, []);

  // Função para atualizar dados do usuário
  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      if (userData) {
        setUser(userData);
        setToken(apiClient.getAccessTokenPublic());
      }
    } catch (error) {
      logComponents.error('Erro ao atualizar dados do usuário:', error);
      setUser(null);
      setToken(null);
    }
  }, []);

  // Função de login usando o serviço centralizado
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const tokens = await apiClient.login(email, password);
      
      if (tokens.accessToken) {
        // Buscar dados do usuário após login bem-sucedido
        const userData = await apiClient.getCurrentUser();
        if (userData) {
          setUser(userData);
          setToken(tokens.accessToken);
          logComponents.info('✅ Login realizado com sucesso');
          return true;
        }
      }
      
      logComponents.error('Erro no login: Falha ao obter dados do usuário');
      return false;
    } catch (error) {
      logComponents.error('Erro ao fazer login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout usando o serviço centralizado
  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      logComponents.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar estado local independentemente do resultado
      setUser(null);
      setToken(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
