#!/usr/bin/env node
/*
  Script: architecture-refactor.js
  Objetivo: Padronizar rapidamente camadas (serviços/hooks/UI) sem quebrar o app.
  Ações:
    - Criar skeleton de serviços em lib/services (transactions, accounts, reports)
    - Criar apiClient se não existir
    - Criar tema base (tokens) se não existir
    - Sugerir ajustes em hooks/queries (sem sobrescrever se já existem)
*/
const fs = require("fs");
const path = require("path");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function ensureFile(p, content) {
  if (!fs.existsSync(p)) fs.writeFileSync(p, content);
}

const root = process.cwd();

// 1) apiClient básico
ensureDir(path.join(root, "lib"));
ensureFile(
  path.join(root, "lib", "api-client.ts"),
  `import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})
`,
);

// 2) serviços básicos
ensureDir(path.join(root, "lib", "services"));
ensureFile(
  path.join(root, "lib", "services", "transactions.ts"),
  `import { apiClient } from '@/lib/api-client'

export const Transactions = {
  async list(params?: any){
    const { data } = await apiClient.get('/transactions', { params })
    return data.transactions || []
  },
  async create(payload: any){
    const { data } = await apiClient.post('/transactions', payload)
    return data.transaction || data
  }
}
`,
);

ensureFile(
  path.join(root, "lib", "services", "accounts.ts"),
  `import { apiClient } from '@/lib/api-client'

export const Accounts = {
  async list(){
    const { data } = await apiClient.get('/accounts')
    return data.accounts || []
  }
}
`,
);

ensureFile(
  path.join(root, "lib", "services", "reports.ts"),
  `import { apiClient } from '@/lib/api-client'

export const Reports = {
  async cashFlow(params: { start: string; end: string }){
    const { data } = await apiClient.get('/reports/cash-flow', { params })
    return data
  },
  async categorySpending(params: { start: string; end: string }){
    const { data } = await apiClient.get('/reports/category-spending', { params })
    return data
  },
  async budgets(params: { start: string; end: string }){
    const { data } = await apiClient.get('/reports/budgets', { params })
    return data
  }
}
`,
);

// 3) tema base (tokens)
ensureDir(path.join(root, "styles"));
ensureFile(
  path.join(root, "styles", "theme-tokens.ts"),
  `export const tokens = {
  color: {
    primary: '#2563EB',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    muted: '#6B7280'
  },
  radius: { sm: 6, md: 10, lg: 14 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }
}
`,
);

console.log("✅ Serviços padrão e tokens de tema preparados.");
