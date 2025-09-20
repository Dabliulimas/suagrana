/**
 * Unified API Client
 * Centralized HTTP client with error handling and retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { logComponents } from "../logger";
import { APIResponse, DataLayerError, QueryParams } from "./types";

export class APIClient {
  private client: AxiosInstance;
  private baseURL: string;
  private authToken: string | null = null;
  private errorHandlers: ((error: DataLayerError) => void)[] = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const dataLayerError = this.transformError(error);
        this.notifyErrorHandlers(dataLayerError);
        return Promise.reject(dataLayerError);
      },
    );
  }

  private transformError(error: any): DataLayerError {
    const timestamp = new Date().toISOString();

    if (error.response) {
      // Server responded with error status
      return {
        code: `HTTP_${error.response.status}`,
        message: error.response.data?.message || error.message,
        details: error.response.data,
        timestamp,
        retryable: error.response.status >= 500,
      };
    } else if (error.request) {
      // Network error
      return {
        code: "NETWORK_ERROR",
        message: "Network connection failed",
        details: error.request,
        timestamp,
        retryable: true,
      };
    } else {
      // Other error
      return {
        code: "UNKNOWN_ERROR",
        message: error.message || "An unknown error occurred",
        details: error,
        timestamp,
        retryable: false,
      };
    }
  }

  private notifyErrorHandlers(error: DataLayerError) {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (e) {
        logComponents.error("Error handler failed:", e);
      }
    });
  }

  // Configuration methods
  setBaseURL(url: string): void {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  onError(handler: (error: DataLayerError) => void): void {
    this.errorHandlers.push(handler);
  }

  // HTTP Methods
  async get<T>(
    endpoint: string,
    params?: QueryParams,
  ): Promise<APIResponse<T>> {
    const config: AxiosRequestConfig = {};
    if (params) {
      config.params = params;
    }

    const response = await this.client.get<APIResponse<T>>(endpoint, config);
    return response.data;
  }

  async post<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    const response = await this.client.post<APIResponse<T>>(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    const response = await this.client.put<APIResponse<T>>(endpoint, data);
    return response.data;
  }

  async patch<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    const response = await this.client.patch<APIResponse<T>>(endpoint, data);
    return response.data;
  }

  async delete(endpoint: string): Promise<APIResponse<void>> {
    const response = await this.client.delete<APIResponse<void>>(endpoint);
    return response.data;
  }

  // Retry mechanism
  async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry if error is not retryable
        if (error.retryable === false) {
          throw error;
        }

        // Don't wait after last attempt
        if (attempt < maxRetries) {
          await this.sleep(delay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get("/health");
      return true;
    } catch {
      return false;
    }
  }

  // Batch requests
  async batch<T>(requests: (() => Promise<T>)[]): Promise<T[]> {
    return Promise.all(requests.map((request) => request()));
  }
}
