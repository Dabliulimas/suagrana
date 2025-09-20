# 🧪 INSTRUÇÕES PARA TESTE DO SISTEMA FINANCEIRO

## 📋 Passos para Testar o Sistema Completo

### 1. Acesse a Página de Teste
Abra: `http://localhost:3000/test-data`

### 2. Crie Dados de Teste
Clique no botão **"Criar Dados de Teste"**

Isso irá criar:
- ✅ 2 transações (1 receita + 1 despesa)
- ✅ 1 conta bancária
- ✅ 1 meta financeira

### 3. Verifique os Dados Carregados
Na mesma página, você verá:
- **LocalStorage (Direto)**: Dados salvos diretamente no navegador
- **Dados do Hook**: Dados carregados pelos hooks React
- **Resumo Financeiro**: Cálculos automáticos

### 4. Navegue para o Dashboard
Acesse: `http://localhost:3000`

Agora você deve ver:
- ✅ **Receitas (Mês)**: R$ 5.000,00 (1 transação)
- ✅ **Despesas (Mês)**: R$ 300,00 (1 transação)  
- ✅ **Saldo do Mês**: R$ 4.700,00 (superávit)
- ✅ **Patrimônio Líquido**: R$ 4.700,00

### 5. Teste Outras Páginas

#### 📊 Transações (`/transactions`)
- Deve mostrar as 2 transações criadas
- Insights inteligentes baseados nos dados reais
- Análise por categoria funcionando

#### 🏦 Contas (`/accounts`) 
- Deve mostrar a conta criada
- Saldo calculado automaticamente
- Cards de resumo com valores reais

#### 🎯 Metas (`/goals`)
- Deve mostrar a meta criada
- Progresso calculado corretamente
- Estatísticas baseadas em dados reais

#### 💰 Orçamento (`/budget`)
- Gastos calculados das transações reais
- Categorias baseadas nas transações criadas
- Análises de economia funcionando

### 6. Teste Criação de Novos Dados

#### Criar Nova Transação:
1. No dashboard, clique no botão de adicionar transação
2. Preencha os dados
3. Salve
4. Verifique se aparece no dashboard imediatamente

#### Criar Nova Conta:
1. Acesse `/accounts`
2. Clique em "Nova Conta"
3. Preencha os dados
4. Verifique se aparece na lista

#### Criar Nova Meta:
1. Acesse `/goals`
2. Clique em "Nova Meta"
3. Preencha os dados
4. Verifique se aparece na lista

## 🔍 Verificações Importantes

### ✅ Dashboard deve mostrar:
- Valores reais (não R$ 0,00)
- Número correto de transações
- Cálculos automáticos funcionando
- Cards atualizando em tempo real

### ✅ Todas as páginas devem:
- Carregar dados reais do localStorage
- Mostrar listas e tabelas populadas
- Calcular métricas corretamente
- Atualizar quando novos dados são adicionados

### ✅ Interconexões funcionando:
- Criar transação → Atualiza dashboard
- Adicionar à meta → Mostra progresso  
- Gastos → Aparecem no orçamento
- Saldos → Calculados automaticamente

## 🛠️ Comandos de Debug no Console

Abra o Console do Navegador (F12) e execute:

```javascript
// Ver dados no localStorage
console.log("Transações:", JSON.parse(localStorage.getItem('sua-grana-transactions') || '[]'));
console.log("Contas:", JSON.parse(localStorage.getItem('sua-grana-accounts') || '[]'));
console.log("Metas:", JSON.parse(localStorage.getItem('sua-grana-goals') || '[]'));

// Criar dados de teste rapidamente
localStorage.setItem('sua-grana-transactions', JSON.stringify([
  {
    id: 'quick-1',
    description: 'Teste Rápido Receita',
    amount: 3000,
    type: 'income',
    category: 'Salário',
    account: 'acc-1',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]));

// Recarregar a página para ver as mudanças
location.reload();
```

## 📈 Resultados Esperados

Após seguir estes passos, você deve ter:

1. **Dashboard funcional** com dados reais
2. **Todas as páginas** mostrando informações corretas
3. **Cálculos automáticos** funcionando
4. **Interconexão completa** entre funcionalidades
5. **Sistema offline** funcionando perfeitamente

## ❌ Se algo não funcionar

1. Verifique o console do navegador por erros
2. Acesse `/test-data` para diagnosticar
3. Use o botão "Limpar Dados" e tente novamente
4. Recarregue a página após criar dados

## 🎯 Objetivo Final

O sistema deve funcionar como um **controle financeiro pessoal real**, onde:
- ✅ Todos os dados são persistentes
- ✅ Cálculos são automáticos e precisos
- ✅ Interface responde imediatamente às mudanças
- ✅ Funciona offline sem problemas
- ✅ Todas as páginas são interconectadas
