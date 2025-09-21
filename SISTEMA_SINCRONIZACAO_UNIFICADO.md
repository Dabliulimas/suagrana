# Sistema de Sincronização Unificado - SuaGrana

## 📋 Resumo da Implementação

Este documento descreve a implementação completa do sistema de sincronização unificado que resolve os problemas de dados sumindo e inconsistências no cache do React Query.

## 🎯 Problemas Resolvidos

### Antes da Implementação
- ❌ Dados sumindo após mutações
- ❌ Cache inconsistente entre componentes
- ❌ Múltiplos sistemas de cache conflitantes
- ❌ Invalidação incompleta de queries
- ❌ Falta de sincronização global

### Depois da Implementação
- ✅ Sincronização automática e robusta
- ✅ Cache unificado e consistente
- ✅ Invalidação inteligente e abrangente
- ✅ Sistema de middleware para sincronização global
- ✅ Hooks unificados para todas as operações

## 🏗️ Arquitetura Implementada

### 1. Query Client Unificado
**Arquivo:** `lib/react-query/unified-query-client.ts`

- **Configuração centralizada** do React Query
- **Chaves de query padronizadas** para evitar conflitos
- **Sistema de invalidação inteligente** que atualiza dados relacionados
- **Configurações otimizadas** de `staleTime` e `gcTime`

```typescript
// Exemplo de uso das chaves padronizadas
unifiedQueryKeys.transactions.all()
unifiedQueryKeys.accounts.summary()
unifiedQueryKeys.reports.dashboard()
```

### 2. Middleware de Sincronização Global
**Arquivo:** `lib/middleware/sync-middleware.ts`

- **Fila de eventos de sincronização** para processar mudanças
- **Agrupamento inteligente** de eventos similares
- **Invalidação automática** baseada no tipo de operação
- **Listeners globais** para foco de janela e conectividade

```typescript
// Eventos de sincronização automática
syncMiddleware.addSyncEvent({
  type: 'transaction',
  action: 'create',
  entityId: newTransaction.id,
  metadata: { transaction: newTransaction }
});
```

### 3. Hooks Unificados

#### Transações (`hooks/unified/use-unified-transactions.ts`)
- `useUnifiedTransactions()` - Listar transações
- `useUnifiedCreateTransaction()` - Criar transação
- `useUnifiedUpdateTransaction()` - Atualizar transação
- `useUnifiedDeleteTransaction()` - Deletar transação

#### Contas (`hooks/unified/use-unified-accounts.ts`)
- `useUnifiedAccounts()` - Listar contas
- `useUnifiedCreateAccount()` - Criar conta
- `useUnifiedUpdateAccount()` - Atualizar conta
- `useUnifiedDeleteAccount()` - Deletar conta

#### Relatórios (`hooks/unified/use-unified-reports.ts`)
- `useUnifiedDashboard()` - Dados do dashboard
- `useUnifiedMonthlyReport()` - Relatório mensal
- `useUnifiedCategoryBreakdown()` - Breakdown por categoria
- `useUnifiedRefreshReports()` - Forçar atualização

#### Sincronização Global (`hooks/unified/use-global-sync.ts`)
- `useGlobalSync()` - Controle de sincronização global
- `useSyncStatus()` - Status do cache e sincronização

### 4. Provider Atualizado
**Arquivo:** `providers/react-query-provider.tsx`

- Integração com o sistema unificado
- Inicialização automática do middleware
- React Query Devtools habilitado

## 🔄 Fluxo de Sincronização

### 1. Operação de Mutação
```
Usuário executa ação → Hook unificado → API call → Sucesso
                                                      ↓
                                              Middleware notificado
                                                      ↓
                                              Evento adicionado à fila
                                                      ↓
                                              Processamento em lote
                                                      ↓
                                              Invalidação inteligente
                                                      ↓
                                              UI atualizada automaticamente
```

### 2. Sincronização Global
```
Evento de foco/conectividade → Middleware detecta → Processa fila
                                                          ↓
                                                  Invalida queries stale
                                                          ↓
                                                  Refetch dados críticos
                                                          ↓
                                                  UI sincronizada
```

## 🧪 Página de Teste

**URL:** `http://localhost:3000/test-sync`

A página de teste inclui:
- **Status do cache** em tempo real
- **Contadores de dados** carregados
- **Botões de teste** para operações
- **Log de eventos** de sincronização
- **Controles de sincronização** manual

### Testes Disponíveis
1. **Criar Transação** - Testa sincronização após criação
2. **Criar Conta** - Testa sincronização após criação de conta
3. **Sincronização Global** - Força sincronização completa
4. **Atualizar Página** - Invalida queries ativas
5. **Limpar Cache** - Reset completo do cache

## 📁 Estrutura de Arquivos Criados/Modificados

```
lib/
├── react-query/
│   └── unified-query-client.ts          # ✨ NOVO - Sistema unificado
├── middleware/
│   └── sync-middleware.ts               # ✨ NOVO - Middleware global

hooks/
└── unified/
    ├── use-unified-transactions.ts      # ✨ NOVO - Hooks de transações
    ├── use-unified-accounts.ts          # ✨ NOVO - Hooks de contas
    ├── use-unified-reports.ts           # ✨ NOVO - Hooks de relatórios
    ├── use-global-sync.ts               # ✨ NOVO - Sincronização global
    └── index.ts                         # ✨ NOVO - Exports unificados

providers/
└── react-query-provider.tsx            # 🔄 MODIFICADO - Integração

components/
├── test/
│   └── sync-test-dashboard.tsx          # ✨ NOVO - Página de teste
└── examples/
    └── unified-dashboard-example.tsx    # ✨ NOVO - Exemplo de uso

app/
└── test-sync/
    └── page.tsx                         # ✨ NOVO - Rota de teste
```

## 🚀 Como Usar

### 1. Migração dos Hooks Existentes

**Antes:**
```typescript
import { useTransactions } from '../hooks/use-transactions';
const { data, isLoading } = useTransactions();
```

**Depois:**
```typescript
import { useUnifiedTransactions } from '../hooks/unified';
const { data, isLoading } = useUnifiedTransactions();
```

### 2. Criação de Transações

```typescript
import { useUnifiedCreateTransaction } from '../hooks/unified';

const createTransaction = useUnifiedCreateTransaction();

const handleCreate = async () => {
  await createTransaction.mutateAsync({
    description: "Nova transação",
    amount: 100,
    type: "expense",
    category: "alimentacao",
    accountId: "account-id",
    date: new Date().toISOString(),
  });
  // Sincronização automática acontece aqui!
};
```

### 3. Sincronização Manual

```typescript
import { useGlobalSync } from '../hooks/unified';

const { forceGlobalSync, refreshCurrentPage } = useGlobalSync();

// Forçar sincronização completa
await forceGlobalSync();

// Atualizar apenas a página atual
await refreshCurrentPage();
```

## 🔧 Configurações

### Tempos de Cache
- **Transações:** 5 minutos (staleTime), 30 minutos (gcTime)
- **Contas:** 10 minutos (staleTime), 1 hora (gcTime)
- **Dashboard:** 2 minutos (staleTime), 15 minutos (gcTime)
- **Relatórios:** 5 minutos (staleTime), 30 minutos (gcTime)

### Retry Policy
- **Queries:** 3 tentativas com backoff exponencial
- **Mutations:** 1 tentativa (falha rápida)

### Refetch Triggers
- ✅ Foco na janela
- ✅ Reconexão à internet
- ✅ Mudança de visibilidade
- ✅ Eventos de sincronização

## 🎉 Benefícios Alcançados

1. **Consistência de Dados:** Todos os componentes sempre mostram dados atualizados
2. **Performance:** Cache inteligente reduz chamadas desnecessárias à API
3. **Experiência do Usuário:** Feedback imediato e sincronização transparente
4. **Manutenibilidade:** Código organizado e padronizado
5. **Debugging:** Ferramentas de teste e monitoramento integradas

## 🔍 Monitoramento

### React Query Devtools
Habilitado automaticamente em desenvolvimento para:
- Visualizar estado das queries
- Monitorar invalidações
- Debug de problemas de cache

### Logs do Sistema
```typescript
// Logs automáticos em todas as operações
logComponents.info("Transação criada e sincronização iniciada:", id);
logComponents.error("Erro na sincronização:", error);
```

### Status de Sincronização
```typescript
const { getSyncStatus, isSyncing } = useSyncStatus();
const status = getSyncStatus(); // { total, fetching, stale, error, success }
```

## 🚨 Resolução de Problemas

### Se os dados ainda estão sumindo:
1. Verifique se está usando os hooks unificados
2. Confirme se o middleware está inicializado
3. Use a página de teste para diagnosticar
4. Verifique os logs no console

### Se a sincronização está lenta:
1. Ajuste os tempos de `staleTime` se necessário
2. Use `refreshCurrentPage()` para atualizações rápidas
3. Verifique a conectividade de rede

### Para debugging:
1. Acesse `/test-sync` para monitoramento
2. Use React Query Devtools (F12)
3. Verifique logs no console do navegador

---

**✅ Sistema implementado com sucesso!**
**🎯 Problema de dados sumindo resolvido!**
**🚀 Aplicação pronta para uso em produção!**