import { database } from "./database";
import { logComponents } from "../logger";
import { hashPassword, verifyPassword, generateSessionToken } from "./crypto";
import { rateLimiter } from "./rate-limiter";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "viewer";
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin?: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  sessionToken?: string;
  error?: string;
  requiresMFA?: boolean;
  debugInfo?: any;
}

export interface RegisterResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

class EnhancedAuthService {
  private static instance: EnhancedAuthService;
  private currentUser: AuthUser | null = null;
  private currentSessionToken: string | null = null;
  private _initialized = false;
  private authStateListeners: ((state: AuthState) => void)[] = [];

  static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService();
    }
    return EnhancedAuthService.instance;
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeAuth();
    }
  }

  private async initializeAuth(): Promise<void> {
    try {
      console.log("🔐 Initializing authentication...");
      await this.loadCurrentSession();
      this._initialized = true;
      this.notifyAuthStateChange();
      console.log("✅ Authentication initialized successfully");
    } catch (error) {
      logComponents.error("❌ Failed to initialize authentication:", error);
      this.clearSession();
      this._initialized = true;
      this.notifyAuthStateChange();
    }
  }

  private async loadCurrentSession(): Promise<void> {
    if (typeof window === "undefined") return;

    const sessionToken = localStorage.getItem("sua-grana-session-token");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    console.log(
      "🔍 Loading session token:",
      sessionToken ? "Found" : "Not found",
    );

    if (!sessionToken) {
      console.log("ℹ️ No session token found");
      return;
    }

    try {
      const session = await database.getActiveSession(sessionToken);
      console.log(
        "🔍 Session lookup result:",
        session ? "Valid session" : "Invalid session",
      );

      if (session) {
        const user = await database.findById("users", session.user_id);
        console.log(
          "🔍 User lookup result:",
          user ? "User found" : "User not found",
        );

        if (user && user.is_active) {
          this.currentUser = this.mapUserToAuthUser(user);
          this.currentSessionToken = sessionToken;
          console.log("✅ Session restored successfully for user");
        } else {
          console.log("⚠️ User not found or inactive, clearing session");
          this.clearSession();
        }
      } else {
        console.log("⚠️ Session not found or expired, clearing session");
        this.clearSession();
      }
    } catch (error) {
      logComponents.error("❌ Failed to load session:", error);
      this.clearSession();
    }
  }

  private mapUserToAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || ["read:own", "write:own"],
      mfaEnabled: user.mfa_enabled || false,
      lastLogin: user.last_login,
    };
  }

  private clearSession(): void {
    console.log("🧹 Clearing session");
    this.currentUser = null;
    this.currentSessionToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("sua-grana-session-token");
    }
  }

  private notifyAuthStateChange(): void {
    const state: AuthState = {
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser,
      isLoading: !this.isInitialized(),
      error: null,
    };

    console.log("📢 Notifying auth state change:", state);
    this.authStateListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        logComponents.error("❌ Error in auth state listener:", error);
      }
    });
  }

  public onAuthStateChange(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.push(listener);

    // Immediately call with current state if initialized
    if (this.isInitialized()) {
      const state: AuthState = {
        isAuthenticated: this.isAuthenticated(),
        user: this.currentUser,
        isLoading: false,
        error: null,
      };
      listener(state);
    }

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<RegisterResult> {
    try {
      console.log("📝 Starting registration");

      // Rate limiting
      const rateLimitResult = rateLimiter.checkLimit("register");
      if (!rateLimitResult.allowed) {
        console.log("⚠️ Registration rate limited");
        return {
          success: false,
          error: "Too many registration attempts. Please try again later.",
        };
      }

      // Validate input
      if (!this.validateEmail(email)) {
        return { success: false, error: "Invalid email format" };
      }

      if (!this.validatePassword(password)) {
        return {
          success: false,
          error:
            "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
        };
      }

      if (!name.trim()) {
        return { success: false, error: "Name is required" };
      }

      // Check if user already exists
      const existingUser = await database.getUserByEmail(email);
      if (existingUser) {
        console.log("⚠️ User already exists");
        return { success: false, error: "User already exists" };
      }

      // Create user
      const passwordHash = await hashPassword(password);
      const user = await database.create("users", {
        email: email.toLowerCase(),
        name: name.trim(),
        password_hash: passwordHash,
        role: "user",
        permissions: ["read:own", "write:own"],
        mfa_enabled: false,
        login_attempts: 0,
        encryption_key: generateSessionToken(),
        is_active: true,
      });

      await database.logAudit({
        action: "USER_REGISTERED",
        user_id: user.id,
        severity: "medium",
      });

      console.log("✅ User registered successfully");
      return { success: true, user: this.mapUserToAuthUser(user) };
    } catch (error) {
      logComponents.error("❌ Registration failed:", error);
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  }

  async login(
    email: string,
    password: string,
    mfaCode?: string,
  ): Promise<LoginResult> {
    try {
      console.log("🔐 Starting login");

      // Rate limiting
      const rateLimitResult = rateLimiter.checkLimit("login");
      if (!rateLimitResult.allowed) {
        console.log("⚠️ Login rate limited");
        return {
          success: false,
          error: "Too many login attempts. Please try again later.",
          debugInfo: { rateLimited: true },
        };
      }

      const user = await database.getUserByEmail(email.toLowerCase());
      console.log("🔍 User lookup:", user ? "Found user" : "User not found");

      if (!user || !user.is_active) {
        await database.logAudit({
          action: "LOGIN_FAILED",
          severity: "high",
        });
        console.log("❌ Invalid credentials - user not found or inactive");
        return {
          success: false,
          error: "Invalid email or password",
          debugInfo: { userFound: false },
        };
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        await database.logAudit({
          action: "LOGIN_FAILED",
          user_id: user.id,
          severity: "high",
        });
        console.log("❌ Account locked until:", user.locked_until);
        return {
          success: false,
          error: "Account is temporarily locked. Please try again later.",
          debugInfo: { accountLocked: true, lockedUntil: user.locked_until },
        };
      }

      // Verify password
      console.log("🔍 Verifying password...");
      const passwordValid = await verifyPassword(password, user.password_hash);
      console.log("🔍 Password verification result:", passwordValid);

      if (!passwordValid) {
        const newAttempts = user.login_attempts + 1;
        const updates: any = { login_attempts: newAttempts };

        if (newAttempts >= 5) {
          updates.locked_until = new Date(
            Date.now() + 15 * 60 * 1000,
          ).toISOString(); // 15 minutes
        }

        await database.update("users", user.id, updates);

        await database.logAudit({
          action: "LOGIN_FAILED",
          user_id: user.id,
          severity: newAttempts >= 5 ? "critical" : "high",
        });

        console.log("❌ Invalid password, attempts:", newAttempts);
        return {
          success: false,
          error: "Invalid email or password",
          debugInfo: { passwordValid: false, attempts: newAttempts },
        };
      }

      // Check MFA if enabled
      if (user.mfa_enabled) {
        console.log("🔍 MFA enabled, checking code...");
        if (!mfaCode) {
          console.log("ℹ️ MFA code required");
          return { success: false, requiresMFA: true };
        }

        const isValidMFA = this.verifyMFACode(user.mfa_secret || "", mfaCode);
        if (!isValidMFA) {
          await database.logAudit({
            action: "LOGIN_FAILED",
            user_id: user.id,
            severity: "high",
          });
          console.log("❌ Invalid MFA code");
          return {
            success: false,
            error: "Invalid MFA code",
            debugInfo: { mfaValid: false },
          };
        }
        console.log("✅ MFA code valid");
      }

      // Reset login attempts and create session
      console.log("🔄 Resetting login attempts and creating session...");
      await database.update("users", user.id, {
        login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString(),
      });

      const sessionToken = generateSessionToken();
      const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(); // 24 hours

      console.log("💾 Creating session with token");
      await database.createSession(user.id, sessionToken, expiresAt);

      // Store session in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("sua-grana-session-token", sessionToken);
        console.log("💾 Session token stored in localStorage");
      }

      // Update internal state
      this.currentUser = this.mapUserToAuthUser(user);
      this.currentSessionToken = sessionToken;

      await database.logAudit({
        action: "USER_LOGIN",
        user_id: user.id,
        severity: "low",
      });

      console.log("✅ Login successful for user");

      // Notify listeners of auth state change
      this.notifyAuthStateChange();

      return {
        success: true,
        user: this.currentUser,
        sessionToken,
        debugInfo: {
          userId: user.id,
          sessionCreated: true,
          mfaUsed: user.mfa_enabled,
        },
      };
    } catch (error) {
      logComponents.error("❌ Login failed with error:", error);
      return {
        success: false,
        error: "Login failed. Please try again.",
        debugInfo: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async logout(): Promise<void> {
    console.log("🚪 Starting logout process...");

    if (this.currentSessionToken) {
      try {
        const session = await database.getActiveSession(
          this.currentSessionToken,
        );
        if (session) {
          await database.update("sessions", session.id, { is_active: false });
          await database.logAudit({
            action: "USER_LOGOUT",
            user_id: session.user_id,
            severity: "low",
          });
          console.log("✅ Session deactivated in database");
        }
      } catch (error) {
        logComponents.error("❌ Error during logout:", error);
      }
    }

    this.clearSession();
    this.notifyAuthStateChange();
    console.log("✅ Logout completed");
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    const authenticated =
      this.currentUser !== null && this.currentSessionToken !== null;
    console.log("🔍 Authentication check:", authenticated);
    return authenticated;
  }

  public isInitialized(): boolean {
    return this._initialized;
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === "admin") return true;
    return this.currentUser.permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  async validateAdminPassword(password: string): Promise<boolean> {
    try {
      const adminPassword = await database.getSystemConfig("admin_password");
      return password === adminPassword;
    } catch (error) {
      logComponents.error("❌ Failed to validate admin password:", error);
      return false;
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }

  private verifyMFACode(secret: string, code: string): boolean {
    // Simplified TOTP verification for demo
    const timeStep = Math.floor(Date.now() / 30000);
    const expectedCode = this.generateTOTP(secret, timeStep);
    const previousCode = this.generateTOTP(secret, timeStep - 1);
    return code === expectedCode || code === previousCode;
  }

  private generateTOTP(secret: string, timeStep: number): string {
    // Simplified TOTP generation for demo
    const hash = this.simpleHash(secret + timeStep.toString());
    return (hash % 1000000).toString().padStart(6, "0");
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Session management
  async refreshSession(): Promise<boolean> {
    if (!this.currentSessionToken) {
      console.log("⚠️ No session token to refresh");
      return false;
    }

    try {
      const session = await database.getActiveSession(this.currentSessionToken);
      if (!session) {
        console.log("⚠️ Session not found during refresh");
        this.clearSession();
        this.notifyAuthStateChange();
        return false;
      }

      // Extend session
      const newExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      await database.update("sessions", session.id, {
        expires_at: newExpiresAt,
      });
      console.log("✅ Session refreshed successfully");

      return true;
    } catch (error) {
      logComponents.error("❌ Session refresh failed:", error);
      this.clearSession();
      this.notifyAuthStateChange();
      return false;
    }
  }

  // Debug methods
  async getDebugInfo(): Promise<any> {
    return {
      isInitialized: this.isInitialized(),
      isAuthenticated: this.isAuthenticated(),
      currentUser: this.currentUser,
      hasSessionToken: !!this.currentSessionToken,
      sessionTokenPreview: this.currentSessionToken?.substring(0, 8) + "...",
      localStorageToken:
        typeof window !== "undefined"
          ? localStorage.getItem("sua-grana-session-token")?.substring(0, 8) +
            "..."
          : null,
      authStateListeners: this.authStateListeners.length,
    };
  }

  // Admin methods (existing ones remain the same)
  async getAllUsers(): Promise<AuthUser[]> {
    if (!this.hasRole("admin")) {
      throw new Error("Unauthorized: Admin access required");
    }

    const users = await database.getAll("users");
    return users
      .filter((user) => user.is_active)
      .map((user) => this.mapUserToAuthUser(user));
  }

  async updateUserRole(
    userId: string,
    role: "admin" | "user" | "viewer",
    permissions: string[],
  ): Promise<boolean> {
    if (!this.hasRole("admin")) {
      throw new Error("Unauthorized: Admin access required");
    }

    const success = await database.update("users", userId, {
      role,
      permissions,
    });
    if (success) {
      await database.logAudit({
        action: "USER_ROLE_UPDATED",
        user_id: this.currentUser?.id,
        severity: "high",
      });
    }

    return success;
  }

  async deactivateUser(userId: string): Promise<boolean> {
    if (!this.hasRole("admin")) {
      throw new Error("Unauthorized: Admin access required");
    }

    const success = await database.update("users", userId, {
      is_active: false,
    });
    if (success) {
      // Deactivate all sessions for this user
      const sessions = await database.findBy("sessions", {
        user_id: userId,
        is_active: true,
      });
      for (const session of sessions) {
        await database.update("sessions", session.id, { is_active: false });
      }

      await database.logAudit({
        action: "USER_DEACTIVATED",
        user_id: this.currentUser?.id,
        severity: "high",
      });
    }

    return success;
  }
}

export const enhancedAuth = EnhancedAuthService.getInstance();
