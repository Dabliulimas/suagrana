"use client";

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Tipos para autenticação
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  success: boolean;
  data: AuthTokens;
}

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Interceptor de Request - Adiciona token automaticamente
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('❌ Erro no interceptor de request:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de Response - Gerencia refresh token automático
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Se é erro 401 e não é uma tentativa de retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          
          // Se já está fazendo refresh, adiciona à fila
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            
            // Processa fila de requests que falharam
            this.failedQueue.forEach((request) => {
              request.resolve(newToken);
            });
            this.failedQueue = [];

            // Retry da request original
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);

          } catch (refreshError) {
            // Falha no refresh - limpa tudo e redireciona
            this.failedQueue.forEach((request) => {
              request.reject(refreshError);
            });
            this.failedQueue = [];
            
            this.clearTokens();
            this.redirectToLogin();
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Gerenciamento de tokens
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private redirectToLogin(): void {
    if (typeof window === 'undefined') return;
    
    // Não redireciona mais para login - acesso direto permitido
    console.log('Acesso direto permitido - sem redirecionamento para login');
  }

  // Refresh token
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      if (response.data.success && response.data.data) {
        this.setTokens(response.data.data);
        return response.data.data.accessToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('❌ Erro ao fazer refresh do token:', error);
      throw error;
    }
  }

  // Métodos públicos da API
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  // Métodos de autenticação
  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      const response = await this.client.post<{
        success: boolean;
        data: { user: any; accessToken: string; refreshToken: string };
      }>('/auth/login', { email, password });

      if (response.data.success && response.data.data) {
        const tokens = {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
        };
        this.setTokens(tokens);
        return tokens;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  }

  async register(userData: { name: string; email: string; password: string }): Promise<AuthTokens> {
    try {
      const response = await this.client.post<{
        success: boolean;
        data: { user: any; accessToken: string; refreshToken: string };
      }>('/auth/register', userData);

      if (response.data.success && response.data.data) {
        const tokens = {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
        };
        this.setTokens(tokens);
        return tokens;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Tenta fazer logout no servidor
      await this.client.post('/auth/logout');
    } catch (error) {
      console.error('❌ Erro no logout do servidor:', error);
    } finally {
      // Sempre limpa tokens locais
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Método para verificar se está autenticado
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Método para obter o cliente axios bruto (se necessário)
  getClient(): AxiosInstance {
    return this.client;
  }

  // Métodos de teste
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/test/ping');
      return true;
    } catch (error) {
      console.error('❌ Erro no teste de conectividade:', error);
      return false;
    }
  }
}

// Instância singleton
const apiClient = new ApiClient();

export default apiClient;
export type { AuthTokens };
