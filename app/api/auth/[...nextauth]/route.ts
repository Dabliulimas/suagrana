import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Configuração simplificada para desenvolvimento
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-client-secret",
    }),
    
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        // Autenticação simplificada para desenvolvimento
        if (credentials?.email === "admin@test.com" && credentials?.password === "123456") {
          return {
            id: "1",
            email: "admin@test.com",
            name: "Admin Test"
          };
        }
        return null;
      }
    })
  ],
  
  session: { 
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
  },
  
  callbacks: {
    async session({ session, token }: any) {
      if (token.userId) {
        session.user.id = token.userId;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
  },
  
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };