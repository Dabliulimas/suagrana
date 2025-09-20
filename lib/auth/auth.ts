import { AuthUser, LoginCredentials, RegisterData, AuthResponse } from '@/types';

import { logComponents } from "../logger";
/**
 * Serviço de autenticação
 * Gerencia login, registro e sessões de usuário
 */
export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private token: string | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Obtém a instância singleton
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Carrega dados de autenticação do localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.token = storedToken;
      }
    } catch (error) {
      logComponents.error("Erro ao carregar dados de autenticação:", error);
      this.clearStorage();
    }
  }

  /**
   * Salva dados de autenticação no localStorage
   */
  private saveToStorage(user: AuthUser, token: string): void {
    try {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
    } catch (error) {
      logComponents.error("Erro ao salvar dados de autenticação:", error);
    }
  }

  /**
   * Limpa dados de autenticação do localStorage
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    } catch (error) {
      logComponents.error("Erro ao limpar dados de autenticação:", error);
    }
  }

  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.mockApiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.success) {
        const { user, token } = response.data;
        this.currentUser = user;
        this.token = token;
        this.saveToStorage(user, token);
        
        return { user, token };
      } else {
        throw new Error(response.error || 'Erro no login');
      }
    } catch (error) {
      logComponents.error("Erro no login:", error);
      throw error;
    }
  }

  /**
   * Realiza registro de novo usuário
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.mockApiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (response.success) {
        const { user, token } = response.data;
        this.currentUser = user;
        this.token = token;
        this.saveToStorage(user, token);
        
        return { user, token };
      } else {
        throw new Error(response.error || 'Erro no registro');
      }
    } catch (error) {
      logComponents.error("Erro no registro:", error);
      throw error;
    }
  }

  /**
   * Realiza logout do usuário
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.mockApiCall('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + this.token
          }
        });
      }
    } catch (error) {
      logComponents.error("Erro no logout:", error);
    } finally {
      this.currentUser = null;
      this.token = null;
      this.clearStorage();
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.token !== null;
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Obtém o token atual
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Simulação de chamada de API
   */
  private async mockApiCall(endpoint: string, options: any = {}): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/auth/login') {
          const { email, password } = JSON.parse(options.body || '{}');
          if (email === 'demo@suagrana.com' && password === 'demo123') {
            resolve({
              success: true,
              data: {
                user: {
                  id: '1',
                  email: 'demo@suagrana.com',
                  name: 'Usuário Demo',
                  avatar: undefined
                },
                token: 'mock-jwt-token-' + Date.now()
              }
            });
          } else {
            resolve({
              success: false,
              error: 'Credenciais inválidas'
            });
          }
        } else if (endpoint === '/auth/register') {
          const { email, name } = JSON.parse(options.body || '{}');
          resolve({
            success: true,
            data: {
              user: {
                id: Date.now().toString(),
                email,
                name,
                avatar: undefined
              },
              token: 'mock-jwt-token-' + Date.now()
            }
          });
        } else {
          resolve({ success: true, data: {} });
        }
      }, 500);
    });
  }
}

// Instância singleton
const authService = AuthService.getInstance();

// Funções de conveniência
export const login = (credentials: LoginCredentials) => authService.login(credentials);
export const register = (data: RegisterData) => authService.register(data);
export const logout = () => authService.logout();
export const isAuthenticated = () => authService.isAuthenticated();
export const getCurrentUser = () => authService.getCurrentUser();
export const getToken = () => authService.getToken();

// Exportação padrão
export default authService;
