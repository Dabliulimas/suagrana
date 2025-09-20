"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { logComponents } from "../lib/utils/logger";
import { supabase, isDemoMode, mockAuth } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<{ error: any }>;
  isDemoMode: boolean;
}

interface MockUser {
  id: string;
  email: string;
  app_metadata?: any;
  user_metadata?: any;
  aud?: string;
  created_at?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function EnhancedAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        if (isDemoMode) {
          // In demo mode, set a mock user
          const mockUser: MockUser = {
            id: "demo-user",
            email: "demo@example.com",
            app_metadata: {},
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          };
          setUser(mockUser as User);
        } else {
          // Try to get current user from Supabase
          const {
            data: { user },
          } = await supabase.auth.getUser();
          setUser(user);
        }
      } catch (error) {
        console.warn("Auth initialization failed, using demo mode:", error);
        const mockUser: MockUser = {
          id: "demo-user",
          email: "demo@example.com",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        };
        setUser(mockUser as User);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Set up auth state listener only if not in demo mode
    if (!isDemoMode) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (isDemoMode) {
        const result = await mockAuth.signIn(email, password);
        const mockUser: MockUser = {
          ...result.user,
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        };
        setUser(mockUser as User);
        return { user: mockUser as User, error: result.error };
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { user: data.user, error };
      }
    } catch (error) {
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      if (isDemoMode) {
        const result = await mockAuth.signOut();
        setUser(null);
        return result;
      } else {
        const { error } = await supabase.auth.signOut();
        return { error };
      }
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an EnhancedAuthProvider");
  }
  return context;
}
