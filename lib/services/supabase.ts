import { createClient } from "@supabase/supabase-js";

// Use fallback values for development/demo mode
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-key";

// Create Supabase client with fallback configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence in demo mode
    autoRefreshToken: false,
  },
});

// Check if we're in demo mode (no real Supabase credentials)
export const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock auth functions for demo mode
export const mockAuth = {
  user: null as any,
  signIn: async (email: string, password: string) => {
    return { user: { id: "demo-user", email }, error: null };
  },
  signOut: async () => {
    return { error: null };
  },
  getUser: async () => {
    return {
      user: { id: "demo-user", email: "demo@example.com" },
      error: null,
    };
  },
};
