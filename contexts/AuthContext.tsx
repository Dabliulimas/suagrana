'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Criar um usuário padrão para acesso direto
  const [user, setUser] = useState<User | null>({
    id: 'demo-user',
    name: 'Usuário Demo',
    email: 'demo@suagrana.com'
  });
  const [token, setToken] = useState<string | null>('demo-token');
  const [isLoading, setIsLoading] = useState(false);

  // Não verificar autenticação - permitir acesso direto
  useEffect(() => {
    // Simular carregamento rápido
    setIsLoading(false);
  }, []);

  // Função para verificar se o token ainda é válido
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.user) {
          setUser(data.data.user);
          setToken(tokenToVerify);
        } else {
          // Token inválido, limpar
          localStorage.removeItem('sua-grana-token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Token inválido, limpar
        localStorage.removeItem('sua-grana-token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      localStorage.removeItem('sua-grana-token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Função de login simplificada - sempre retorna sucesso
  const login = async (email: string, password: string): Promise<boolean> => {
    // Simular login bem-sucedido
    return true;
  };

  // Função de logout simplificada - não faz nada
  const logout = async () => {
    // Não fazer logout real - manter usuário logado
    console.log('Logout desabilitado - acesso direto ativo');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Hook para fazer requisições autenticadas
export function useAuthenticatedFetch() {
  const { token } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  return authenticatedFetch;
}