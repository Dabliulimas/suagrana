"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { logComponents } from "../../lib/logger";
import { authService, type User, type Session } from "../../lib/auth";
import { LoginForm } from "./login-form";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<any>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const currentSession = authService.getCurrentSession();

      if (currentUser && currentSession) {
        setUser(currentUser);
        setSession(currentSession);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      logComponents.error("Auth check failed:", error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, mfaCode?: string) => {
    const result = await authService.login(email, password, mfaCode);

    if (result.success && result.session && result.user) {
      authService.setCurrentSession(result.session.id);
      setUser(result.user);
      setSession(result.session);
      setIsAuthenticated(true);
    }

    return result;
  };

  const logout = () => {
    if (session) {
      authService.logout(session.id);
    }
    authService.clearCurrentSession();
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return authService.hasPermission(user, permission);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={checkAuthStatus} />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
