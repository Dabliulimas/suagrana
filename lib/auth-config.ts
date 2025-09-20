import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthSchemas } from "@/lib/validations/schemas";
import { getServerSession } from "next-auth/next";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        // Validar dados com Zod
        const validation = AuthSchemas.login.safeParse({
          email: credentials.email,
          password: credentials.password
        });

        if (!validation.success) {
          throw new Error("Dados inválidos");
        }

        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        // Verificar se o usuário está ativo
        if (!user.isActive) {
          throw new Error("Conta desativada");
        }

        // Verificar senha (assumindo que você tem um campo password)
        // Note: Você precisará adicionar o campo password no schema
        const passwordHash = (user as any).password;
        if (!passwordHash) {
          throw new Error("Senha não configurada. Use login social.");
        }

        const isValid = await bcrypt.compare(credentials.password, passwordHash);
        if (!isValid) {
          throw new Error("Senha incorreta");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Verificar se o usuário já existe
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });

        if (!existingUser) {
          // Criar usuário se não existe
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              avatar: user.image,
              emailVerified: true,
              isActive: true
            }
          });
        }
      }
      return true;
    },
    
    async jwt({ token, user, account }) {
      // Primeira vez fazendo login
      if (user) {
        token.userId = user.id;
        token.isActive = (user as any).isActive ?? true;
      }
      
      // Verificar se o usuário ainda está ativo
      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string }
        });
        
        if (!dbUser?.isActive) {
          throw new Error("Conta desativada");
        }
        
        token.isActive = dbUser.isActive;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.isActive = token.isActive as boolean;
        
        // Buscar dados atualizados do usuário
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isActive: true,
            preferences: true
          }
        });
        
        if (dbUser) {
          session.user = {
            ...session.user,
            ...dbUser,
            image: dbUser.avatar
          };
        }
      }
      
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Permite redirecionamentos relativos
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Permite redirecionamentos para o mesmo host  
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
      
      // Log de auditoria
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "SIGN_IN",
            table: "users",
            recordId: user.id,
            newData: {
              provider: account?.provider,
              isNewUser
            }
          }
        }).catch(console.error);
      }
    },
    
    async signOut({ session }) {
      console.log(`User signed out: ${session?.user?.email}`);
      
      // Log de auditoria
      if (session?.user?.id) {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "SIGN_OUT", 
            table: "users",
            recordId: session.user.id
          }
        }).catch(console.error);
      }
    }
  },
  
  debug: process.env.NODE_ENV === "development",
};

// Utilitários para autenticação
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Hook para servidor
export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

// Middleware para verificar autenticação
export function requireAuth() {
  return async (req: any, res: any, next: any) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return res.status(401).json({ 
        error: "Não autorizado" 
      });
    }
    
    if (!session.user.isActive) {
      return res.status(403).json({ 
        error: "Conta desativada" 
      });
    }
    
    req.user = session.user;
    next();
  };
}

// Função para registrar usuário
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  // Validar dados
  const validation = AuthSchemas.register.safeParse({
    ...data,
    confirmPassword: data.password,
    terms: true
  });

  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }

  // Verificar se usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new Error("Usuário já existe");
  }

  // Hash da senha
  const hashedPassword = await hashPassword(data.password);

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      isActive: true,
      emailVerified: false
    } as any
  });

  // Log de auditoria
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "USER_REGISTERED",
      table: "users", 
      recordId: user.id,
      newData: {
        email: user.email,
        name: user.name
      }
    }
  });

  return user;
}
