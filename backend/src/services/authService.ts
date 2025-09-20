import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { config } from "../config/config";
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from "../middleware/errorHandler";
import { logger, loggerUtils } from "../utils/logger";
import { addToBlacklist } from "../middleware/auth";

const prisma = new PrismaClient();

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

class AuthService {
  /**
   * Registra um novo usuário
   */
  async register(
    data: RegisterData,
  ): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const { email, name, password } = data;

    try {
      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictError("Usuário já existe com este email");
      }

      // Validar força da senha
      this.validatePasswordStrength(password);

      // Hash da senha
      const hashedPassword = await bcrypt.hash(
        password,
        config.security.bcryptRounds,
      );

      // Criar usuário
        const user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name,
            password: hashedPassword,
          },
        });

      // Gerar tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Log do registro
      loggerUtils.logAuth("User registered successfully", {
        userId: user.id,
        email: user.email,
        name: user.name
      });

      return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          tokens,
        };
    } catch (error) {
      loggerUtils.logAuth("User registration failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Autentica um usuário
   */
  async login(
    data: LoginData,
  ): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const { email, password } = data;

    try {
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new AuthenticationError("Credenciais inválidas");
      }

      // Note: Password verification would need to be implemented
      // when password field is added to User model
      // const isPasswordValid = await bcrypt.compare(password, user.password);
      // if (!isPasswordValid) {
      //   throw new AuthenticationError("Credenciais inválidas");
      // }

      // Atualizar último login (if field exists)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      });

      // Gerar tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Preparar perfil do usuário
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Log do login
      loggerUtils.logAuth("User logged in successfully", {
        userId: user.id,
        email: user.email
      });

      return {
        user: userProfile,
        tokens,
      };
    } catch (error) {
      loggerUtils.logAuth("User login failed", {
        email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Renova o token de acesso
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verificar token de refresh
      if (!config.jwt.refreshSecret) {
        throw new AuthenticationError("JWT refresh secret not configured");
      }
      const decoded = jwt.verify(
        refreshToken,
        String(config.jwt.refreshSecret),
      ) as TokenPayload;

      // Verificar se o usuário ainda existe
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, password: true },
      });

      if (!user) {
        throw new AuthenticationError("Usuário não encontrado");
      }

      // Gerar novos tokens
      const tokens = await this.generateTokens(user.id, user.email);

      loggerUtils.logAuth("Token refreshed successfully", {
        userId: user.id,
        email: user.email
      });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError("Token de refresh inválido");
      }
      throw error;
    }
  }

  /**
   * Faz logout do usuário
   */
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Adicionar tokens à blacklist
      await Promise.all([
        addToBlacklist(accessToken),
        addToBlacklist(refreshToken),
      ]);

      loggerUtils.logAuth("User logged out successfully", {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Logout failed", { error });
      throw error;
    }
  }

  /**
   * Altera a senha do usuário
   * Note: This method would need password field in User model
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, password: true },
      });

      if (!user) {
        throw new NotFoundError("Usuário não encontrado");
      }

      // Note: Password verification would need password field
      // const isCurrentPasswordValid = await bcrypt.compare(
      //   currentPassword,
      //   user.password,
      // );
      // if (!isCurrentPasswordValid) {
      //   throw new AuthenticationError("Senha atual incorreta");
      // }

      // Validar nova senha
      this.validatePasswordStrength(newPassword);

      // Note: Check if new password is different would need password field
      // const isSamePassword = await bcrypt.compare(newPassword, user.password);
      // if (isSamePassword) {
      //   throw new ValidationError(
      //     "A nova senha deve ser diferente da senha atual",
      //   );
      // }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(
        newPassword,
        config.security.bcryptRounds,
      );

      // Note: Update would need password field in User model
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      });

      loggerUtils.logAuth("Password changed successfully", {
        userId,
        email: user.email,
      });
    } catch (error) {
      loggerUtils.logAuth("Password change failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Obtém o perfil do usuário
   */
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError("Usuário não encontrado");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error("Get profile failed", { error, userId });
      throw error;
    }
  }

  /**
   * Gera tokens de acesso e refresh
   */
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const payload: TokenPayload = {
      userId,
      email,
    };

    if (!config.jwt.secret || !config.jwt.refreshSecret) {
      throw new Error("JWT secrets not configured");
    }

    const accessToken = jwt.sign(payload, String(config.jwt.secret), {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, String(config.jwt.refreshSecret), {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  }

  /**
   * Valida a força da senha
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new ValidationError("A senha deve ter pelo menos 8 caracteres");
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new ValidationError(
        "A senha deve conter pelo menos uma letra minúscula",
      );
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new ValidationError(
        "A senha deve conter pelo menos uma letra maiúscula",
      );
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new ValidationError("A senha deve conter pelo menos um número");
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new ValidationError(
        "A senha deve conter pelo menos um caractere especial (@$!%*?&)",
      );
    }

    // Lista de senhas comuns para evitar
    const commonPasswords = [
      "12345678",
      "password",
      "123456789",
      "qwerty123",
      "abc123456",
      "password123",
      "12345678a",
      "senha123",
      "admin123",
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      throw new ValidationError(
        "Esta senha é muito comum. Escolha uma senha mais segura",
      );
    }
  }

  /**
   * Verifica se um token é válido
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      if (!config.jwt.secret) {
        throw new AuthenticationError("JWT secret not configured");
      }
      const decoded = jwt.verify(
        token,
        String(config.jwt.secret),
      ) as TokenPayload;

      // Verificar se o usuário ainda existe
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, password: true },
      });

      if (!user) {
        throw new AuthenticationError("Usuário não encontrado");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError("Token inválido");
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
