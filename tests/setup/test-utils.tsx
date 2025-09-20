/**
 * Utilities for testing React components
 * Provides all necessary providers and mock setup
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast';

// Create a test query client with default options optimized for testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

// All providers wrapper for components
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Mock data generators for tests
export const mockData = {
  transaction: (overrides: any = {}) => ({
    id: '1',
    amount: -150.5,
    description: 'Supermercado',
    category: 'alimentacao',
    date: '2024-01-15T10:30:00.000Z',
    type: 'expense',
    account: 'Conta Corrente',
    accountId: 'acc1',
    updatedAt: '2024-01-15T10:30:00.000Z',
    createdAt: '2024-01-15T10:30:00.000Z',
    ...overrides,
  }),

  account: (overrides: any = {}) => ({
    id: 'acc1',
    name: 'Conta Corrente',
    balance: 1500,
    type: 'checking',
    updatedAt: '2024-01-15T10:30:00.000Z',
    createdAt: '2024-01-15T10:30:00.000Z',
    ...overrides,
  }),

  goal: (overrides: any = {}) => ({
    id: '1',
    name: 'Viagem Europa',
    target: 10000,
    current: 2500,
    targetAmount: 10000,
    currentAmount: 2500,
    deadline: '2024-12-31',
    category: 'viagem',
    priority: 'high',
    updatedAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }),

  investment: (overrides: any = {}) => ({
    id: '1',
    name: 'PETR4',
    ticker: 'PETR4',
    operation: 'buy',
    quantity: 100,
    price: 25.50,
    totalValue: 2550,
    date: '2024-01-15',
    account: 'Conta Corrente',
    type: 'stock',
    fees: 0,
    updatedAt: '2024-01-15T10:30:00.000Z',
    createdAt: '2024-01-15T10:30:00.000Z',
    ...overrides,
  }),

  trip: (overrides: any = {}) => ({
    id: '1',
    name: 'Viagem Paris',
    destination: 'Paris, França',
    startDate: '2024-06-01',
    endDate: '2024-06-15',
    budget: 5000,
    spent: 0,
    status: 'planned',
    currency: 'EUR',
    updatedAt: '2024-01-15T10:30:00.000Z',
    createdAt: '2024-01-15T10:30:00.000Z',
    ...overrides,
  }),
};

// Utility to generate random test data
export const testUtils = {
  generateDate: (daysAgo: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  },

  generateCategory: () => {
    const categories = ['alimentacao', 'transporte', 'saude', 'educacao', 'lazer'];
    return categories[Math.floor(Math.random() * categories.length)];
  },

  generateAccount: () => {
    const accounts = ['Conta Corrente', 'Poupança', 'Cartão de Crédito'];
    return accounts[Math.floor(Math.random() * accounts.length)];
  },

  generateAmount: (min: number = 10, max: number = 1000) => {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  },
};

// Mock localStorage for tests
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// Setup function to run before each test
export const setupTest = () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  
  // Clear localStorage mock calls
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();
  mockLocalStorage.clear.mockClear();
};

// Cleanup function to run after each test
export const cleanupTest = () => {
  // Restore console methods
  jest.restoreAllMocks();
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the default render with our custom render
export { customRender as render };
