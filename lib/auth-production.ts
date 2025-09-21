import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Configuração simplificada para produção/build
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-client-secret",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    // Email/Password
    CredentialsProvider({
      id: "credentials",
      name: "credentials", 
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "seu@email.com"
        },
        password: { 
          label: "Senha", 
          type: "password" 
        }
      },
      async authorize(credentials) {
        // Implementação simplificada para build
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Em produção, isso seria conectado ao banco de dados
        return {
          id: "1",
          email: credentials.email,
          name: "Demo User",
        };
      }
    })
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register", 
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/welcome"
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Permite redirecionamentos relativos
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Permite redirecionamentos para o mesmo domínio
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-build",
  
  debug: process.env.NODE_ENV === "development",
};

export default authOptions;