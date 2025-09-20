# Guia de Migração - Componentes usando Storage Antigo

Este documento lista os componentes que precisam ser migrados do sistema de storage antigo para o novo sistema unificado.

## Componentes que precisam de migração

### 1. accounting-dashboard.tsx
- **Problema**: Usa `import { storage } from "../lib/storage"`
- **Solução**: Migrar para `useAccounts`, `useTransactions` do `unified-context`

### 2. billing-invoices.tsx
- **Problema**: Usa `import { storage } from "../lib/storage"`
- **Solução**: Migrar para hooks unificados

### 3. budget-insights.tsx
- **Problema**: Usa `import { storage } from "../lib/storage"`
- **Solução**: Migrar para hooks unificados

### 4. card-invoice-manager-advanced.tsx
- **Problema**: Usa `import { storage, type Account, type Transaction } from "../lib/storage"`
- **Solução**: 
  - Migrar imports: `import { type Account, type Transaction } from "../lib/data-layer/types"`
  - Usar hooks: `useAccounts`, `useTransactions`

### 5. card-invoice-manager.tsx
- **Problema**: Usa `import { storage, type Account, type Transaction } from "../lib/storage"`
- **Solução**: Mesmo do item 4

## Passos para migração de cada componente:

### 1. Atualizar imports
```typescript
// ANTES
import { storage, type Account } from "../lib/storage";

// DEPOIS
import { type Account } from "../lib/data-layer/types";
import { useAccounts } from "../contexts/unified-context";
```

### 2. Substituir chamadas diretas ao storage
```typescript
// ANTES
const accounts = storage.getAccounts();
storage.addAccount(newAccount);

// DEPOIS
const { accounts, create: createAccount } = useAccounts();
await createAccount(newAccountData);
```

### 3. Atualizar para APIs assíncronas
```typescript
// ANTES
const account = storage.getAccountById(id);

// DEPOIS
const { accounts } = useAccounts();
const account = accounts.find(a => a.id === id);
// ou se precisar buscar especificamente:
// const account = await actions.read('accounts', id);
```

### 4. Usar hooks para loading states
```typescript
const { accounts, isLoading, error } = useAccounts();

if (isLoading) return <Loading />;
if (error) return <Error message={error} />;
```

### 5. Migrar tipos de dados
Verificar se os tipos de dados estão compatíveis com o novo sistema:
- `Account` pode ter propriedades diferentes
- `Transaction` pode ter estrutura atualizada
- Verificar campos obrigatórios vs opcionais

## Exemplo de migração completa:

### ANTES:
```typescript
import React, { useState, useEffect } from 'react';
import { storage, type Account } from "../lib/storage";

export function MyComponent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  useEffect(() => {
    const data = storage.getAccounts();
    setAccounts(data);
  }, []);
  
  const handleAdd = (account: Account) => {
    storage.addAccount(account);
    setAccounts(storage.getAccounts());
  };
  
  return (
    <div>
      {accounts.map(account => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  );
}
```

### DEPOIS:
```typescript
import React from 'react';
import { type Account } from "../lib/data-layer/types";
import { useAccounts } from "../contexts/unified-context";

export function MyComponent() {
  const { accounts, create, isLoading, error } = useAccounts();
  
  const handleAdd = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await create(accountData);
      // O estado será atualizado automaticamente
    } catch (err) {
      console.error('Erro ao criar conta:', err);
    }
  };
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  
  return (
    <div>
      {accounts.map(account => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  );
}
```

## Lista de verificação para cada componente:

- [ ] Remover imports do storage antigo
- [ ] Adicionar imports dos novos tipos
- [ ] Adicionar hooks unificados
- [ ] Substituir todas as chamadas diretas ao storage
- [ ] Converter para APIs assíncronas onde necessário
- [ ] Adicionar tratamento de loading/error states
- [ ] Testar funcionalidade completa
- [ ] Verificar se não há quebras de tipos

## Componentes com prioridade alta:

1. **accounting-dashboard.tsx** - Dashboard principal
2. **card-invoice-manager-advanced.tsx** - Funcionalidade avançada
3. **budget-insights.tsx** - Análises financeiras

## Notas importantes:

- Sempre verificar se o componente está dentro de um `UnifiedProvider`
- Dados podem ter estruturas ligeiramente diferentes
- Novos hooks fornecem estados de loading/error automaticamente
- APIs são assíncronas, então usar async/await onde necessário
- Logs devem usar o novo sistema centralizado quando possível
