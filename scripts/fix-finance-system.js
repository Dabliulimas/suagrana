#!/usr/bin/env node
/*
  Script: fix-finance-system.js
  Objetivo: Automatizar correções para usar somente o backend (sem localStorage/storage) e remover dados mock.
  Ações:
    - Substitui mocks em dashboards (ML e budget analyzer) por chamadas à API (com fallback seguro)
    - Atualiza hooks de mutação de transações para usar POST /api/transactions e invalidar caches
    - Minimiza riscos: só altera se padrões esperados forem encontrados
*/

const fs = require("fs");
const path = require("path");

function exists(p) {
  return fs.existsSync(p);
}
function read(p) {
  return fs.readFileSync(p, "utf8");
}
function write(p, c) {
  fs.writeFileSync(p, c);
  console.log("✅ Atualizado:", p);
}
function safeEdit(relPath, editor) {
  const p = path.resolve(process.cwd(), relPath);
  if (!exists(p)) {
    console.log("⚠️  Arquivo não encontrado:", relPath);
    return;
  }
  const before = read(p);
  const after = editor(before);
  if (after && after !== before) {
    write(p, after);
  } else {
    console.log("ℹ️  Sem mudanças:", relPath);
  }
}

function ensureImport(source, importLine, removePattern) {
  let s = source;
  if (removePattern) s = s.replace(removePattern, "");
  if (!s.includes(importLine)) {
    s = importLine + "\n" + s;
  }
  return s;
}

console.log("\n🚀 Iniciando correções automáticas do sistema financeiro...\n");

// 1) hooks/queries/use-transactions.ts -> usar API no create e invalidar cache
safeEdit("hooks/queries/use-transactions.ts", (c) => {
  let out = c;
  // Remover uso direto de storage no create
  out = out.replace(
    /(mutationFn:\s*async\s*\(transaction:[\s\S]*?\)\s*=>\s*)await\s*storage\.saveTransaction\(transaction\)/,
    `$1{
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })
      if (!res.ok) throw new Error('Falha ao criar transação')
      return res.json()
    }`,
  );

  // Garantir invalidação das queries de transações/contas/cálculos
  out = out.replace(
    /(onSuccess:\s*\(\)\s*=>\s*\{[\s\S]*?)invalidateQueries\.transactions\(\);?/,
    `$1invalidateQueries.transactions(); invalidateQueries.accounts(); invalidateQueries.calculations();`,
  );

  // Garantir import de invalidateQueries e remover storage se presente
  out = ensureImport(
    out,
    `import { invalidateQueries } from '@/lib/react-query/query-client'`,
    /import\s*\{\s*storage[\s\S]*?\}\s*from\s*['"]@\/lib\/storage['"];?\n?/,
  );

  return out;
});

// 2) components/ml-analytics-dashboard.tsx -> remover mocks e usar API (fallback)
safeEdit("components/ml-analytics-dashboard.tsx", (c) => {
  let out = c;
  // Remover simulação de setTimeout e bloco de mockInsights
  out = out.replace(
    /\/\/ Simular carregamento de dados de ML[\s\S]*?mockInsights:[\s\S]*?];?[\s\S]*?setIsLoading\(false\)/,
    `
    try {
      const res = await fetch('/api/reports/insights');
      if (res.ok) {
        const data = await res.json();
        setInsights(Array.isArray(data.items) ? data.items : []);
      } else {
        setInsights([]);
      }
    } finally {
      setIsLoading(false);
    }
  `,
  );
  return out;
});

// 3) components/budget-performance-analyzer.tsx -> remover mocks e usar API de performance orçamentária
safeEdit("components/budget-performance-analyzer.tsx", (c) => {
  let out = c;
  out = out.replace(
    /\/\/ Simular carregamento de dados de performance[\s\S]*?return\s*\{[\s\S]*?\}[\s\S]*?\),[\s\S]*?setTrends\(\[[\s\S]*?\]\)/,
    `
      const res = await fetch('/api/reports/budget-performance');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || {});
        setTrends(data.trends || []);
      } else {
        setMetrics({});
        setTrends([]);
      }
    `,
  );
  return out;
});

// 4) components/examples/api-integration-demo.tsx -> desabilitar mocks visíveis
safeEdit("components/examples/api-integration-demo.tsx", (c) => {
  let out = c;
  out = out.replace(
    /\/\/ Dados mockados temporários[\s\S]*?const accountsOffline[\s\S]*?= \{[\s\S]*?\};/,
    `// Demo: remova esta tela em produção ou integre APIs reais`,
  );
  return out;
});

// 5) backend/src/routes/transactions.ts -> corrigir trecho quebrado se presente
safeEdit("backend/src/routes/transactions.ts", (c) => {
  let out = c;
  // Corrigir a linha defeituosa "} = ;" próxima do destrutor de body
  out = out.replace(
    /(const\s*\{[\s\S]*?tags\s*=\s*\[\]\s*\}\s*=\s*);/,
    `const { type, accountId, amount, category, description, date, toAccountId, tags = [] } = req.body;`,
  );
  return out;
});

console.log("\n🎉 Correções aplicadas (quando padrões foram encontrados).");
console.log("➡️  Agora rode sua aplicação e valide: npm run dev");
