# DOCUMENTAÇÃO COMPLETA DO SISTEMA SUAGRANA

## ÍNDICE

1. [Esquema de Cores](#esquema-de-cores)
2. [Arquitetura e Layout](#arquitetura-e-layout)
3. [Componentes de Interface](#componentes-de-interface)
4. [Formulários e Modais](#formulários-e-modais)
5. [Páginas Principais](#páginas-principais)
6. [Estrutura de Dados](#estrutura-de-dados)
7. [Tecnologias Utilizadas](#tecnologias-utilizadas)
8. [Funcionalidades Especiais](#funcionalidades-especiais)

---

## ESQUEMA DE CORES

### Variáveis CSS Principais (globals.css)

#### Modo Claro (Light Mode)

```css
:root {
  --background: 0 0% 100%; /* Branco puro para fundo principal */
  --foreground: 222.2 84% 4.9%; /* Preto quase puro para texto */
  --card: 0 0% 100%; /* Branco para cards */
  --card-foreground: 222.2 84% 4.9%; /* Texto dos cards */
  --popover: 0 0% 100%; /* Fundo de popovers */
  --popover-foreground: 222.2 84% 4.9%; /* Texto de popovers */
  --primary: 221.2 83.2% 53.3%; /* Azul primário vibrante */
  --primary-foreground: 210 40% 98%; /* Texto sobre primário */
  --secondary: 210 40% 96%; /* Cinza claro secundário */
  --secondary-foreground: 222.2 84% 4.9%; /* Texto secundário */
  --muted: 210 40% 96%; /* Cinza suave para elementos desabilitados */
  --muted-foreground: 215.4 16.3% 46.9%; /* Texto suave */
  --accent: 210 40% 96%; /* Cor de destaque */
  --accent-foreground: 222.2 84% 4.9%; /* Texto de destaque */
  --destructive: 0 84.2% 60.2%; /* Vermelho para ações destrutivas */
  --destructive-foreground: 210 40% 98%; /* Texto destrutivo */
  --border: 214.3 31.8% 91.4%; /* Cinza claro para bordas */
  --input: 214.3 31.8% 91.4%; /* Fundo de inputs */
  --ring: 221.2 83.2% 53.3%; /* Cor do foco (ring) */
  --chart-1: 12 76% 61%; /* Laranja para gráficos */
  --chart-2: 173 58% 39%; /* Verde-azulado */
  --chart-3: 197 37% 24%; /* Azul escuro */
  --chart-4: 43 74% 66%; /* Amarelo */
  --chart-5: 27 87% 67%; /* Laranja avermelhado */
  --sidebar-background: 0 0% 98%; /* Fundo da sidebar */
  --sidebar-foreground: 240 5.3% 26.1%; /* Texto da sidebar */
  --sidebar-primary: 240 5.9% 10%; /* Primário da sidebar */
  --sidebar-primary-foreground: 0 0% 98%; /* Texto primário sidebar */
  --sidebar-accent: 240 4.8% 95.9%; /* Destaque da sidebar */
  --sidebar-accent-foreground: 240 5.9% 10%; /* Texto destaque sidebar */
  --sidebar-border: 220 13% 91%; /* Borda da sidebar */
  --sidebar-ring: 217.2 91.2% 59.8%; /* Ring da sidebar */
}
```

#### Modo Escuro (Dark Mode)

```css
.dark {
  --background: 222.2 84% 4.9%; /* Preto quase puro */
  --foreground: 210 40% 98%; /* Branco para texto */
  --card: 222.2 84% 4.9%; /* Preto para cards */
  --card-foreground: 210 40% 98%; /* Texto dos cards */
  --popover: 222.2 84% 4.9%; /* Fundo de popovers */
  --popover-foreground: 210 40% 98%; /* Texto de popovers */
  --primary: 217.2 91.2% 59.8%; /* Azul mais claro */
  --primary-foreground: 222.2 84% 4.9%; /* Texto sobre primário */
  --secondary: 217.2 32.6% 17.5%; /* Cinza escuro */
  --secondary-foreground: 210 40% 98%; /* Texto secundário */
  --muted: 217.2 32.6% 17.5%; /* Cinza escuro suave */
  --muted-foreground: 215 20.2% 65.1%; /* Texto suave */
  --accent: 217.2 32.6% 17.5%; /* Destaque escuro */
  --accent-foreground: 210 40% 98%; /* Texto de destaque */
  --destructive: 0 62.8% 30.6%; /* Vermelho escuro */
  --destructive-foreground: 210 40% 98%; /* Texto destrutivo */
  --border: 217.2 32.6% 17.5%; /* Borda escura */
  --input: 217.2 32.6% 17.5%; /* Fundo de inputs */
  --ring: 224.3 76.3% 94.1%; /* Ring claro */
  --chart-1: 220 70% 50%; /* Azul para gráficos */
  --chart-2: 160 60% 45%; /* Verde */
  --chart-3: 30 80% 55%; /* Laranja */
  --chart-4: 280 65% 60%; /* Roxo */
  --chart-5: 340 75% 55%; /* Rosa */
  --sidebar-background: 240 5.9% 10%; /* Fundo sidebar escuro */
  --sidebar-foreground: 240 4.8% 95.9%; /* Texto sidebar */
  --sidebar-primary: 224.3 76.3% 94.1%; /* Primário sidebar */
  --sidebar-primary-foreground: 240 5.9% 10%; /* Texto primário */
  --sidebar-accent: 240 3.7% 15.9%; /* Destaque sidebar */
  --sidebar-accent-foreground: 240 4.8% 95.9%; /* Texto destaque */
  --sidebar-border: 240 3.7% 15.9%; /* Borda sidebar */
  --sidebar-ring: 217.2 91.2% 59.8%; /* Ring sidebar */
}
```

### Cores de Status e Categorias

- **Receita**: Verde (#10B981 ou similar)
- **Despesa**: Vermelho (#EF4444 ou similar)
- **Transferência**: Azul (#3B82F6 ou similar)
- **Investimento**: Roxo (#8B5CF6 ou similar)
- **Poupança**: Amarelo (#F59E0B ou similar)

---

## ARQUITETURA E LAYOUT

### Estrutura Principal

#### Layout Root (layout.tsx)

- **Providers**: ThemeProvider, QueryClient, Toaster
- **Fontes**: Inter (Google Fonts)
- **Metadados**: PWA configurado
- **Viewport**: Responsivo com suporte mobile

#### Header (enhanced-header.tsx)

```typescript
interface HeaderProps {
  user?: User;
  onMenuToggle?: () => void;
  className?: string;
}
```

**Elementos do Header:**

- Logo SuaGrana (lado esquerdo)
- Menu hambúrguer (mobile)
- Navegação principal (desktop)
- Avatar do usuário
- Botão de tema (claro/escuro)
- Notificações
- Menu dropdown do usuário

#### Sidebar

- **Largura**: 280px (desktop), overlay (mobile)
- **Seções**:
  - Dashboard
  - Transações
  - Contas
  - Investimentos
  - Relatórios
  - Metas
  - Configurações

### Grid System

- **Container**: max-width com padding responsivo
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Gaps**: 4, 6, 8 (Tailwind spacing)

---

## COMPONENTES DE INTERFACE

### Button Component

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}
```

**Variantes de Botão:**

- **default**: Fundo primário, texto branco
- **destructive**: Fundo vermelho, texto branco
- **outline**: Borda, fundo transparente
- **secondary**: Fundo secundário
- **ghost**: Sem fundo, hover com fundo
- **link**: Estilo de link

**Tamanhos:**

- **default**: h-10 px-4 py-2
- **sm**: h-9 px-3
- **lg**: h-11 px-8
- **icon**: h-10 w-10

### Input Component

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

**Estilos:**

- Border radius: md
- Border: input color
- Background: transparent
- Padding: 3 (12px)
- Height: 10 (40px)
- Focus: ring-2 ring-ring

### Card Component

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
```

**Estrutura:**

- **Card**: Container principal
- **CardHeader**: Cabeçalho com padding
- **CardTitle**: Título principal
- **CardDescription**: Descrição secundária
- **CardContent**: Conteúdo principal
- **CardFooter**: Rodapé

### Select Component

```typescript
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}
```

**Subcomponentes:**

- **SelectTrigger**: Botão de ativação
- **SelectContent**: Container do dropdown
- **SelectItem**: Item individual
- **SelectValue**: Valor selecionado

### Dialog Component

```typescript
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}
```

**Estrutura:**

- **DialogTrigger**: Elemento que abre o modal
- **DialogContent**: Conteúdo principal
- **DialogHeader**: Cabeçalho
- **DialogTitle**: Título
- **DialogDescription**: Descrição
- **DialogFooter**: Rodapé com ações

### Badge Component

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}
```

**Variantes:**

- **default**: Fundo primário
- **secondary**: Fundo secundário
- **destructive**: Fundo vermelho
- **outline**: Apenas borda

### Toast Component

- **Posições**: top-left, top-right, bottom-left, bottom-right
- **Tipos**: default, destructive
- **Duração**: Configurável (padrão 5s)
- **Ações**: Dismiss, action button

---

## FORMULÁRIOS E MODAIS

### Enhanced Transaction Modal

```typescript
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  transaction?: Transaction;
  accounts: Account[];
}

interface TransactionFormData {
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  account: string;
  targetAccount?: string; // Para transferências
  date: Date;
  tags?: string[];
  notes?: string;
  recurring?: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    endDate?: Date;
  };
}
```

**Campos do Formulário:**

1. **Tipo de Transação** (Radio buttons)
   - Receita (verde)
   - Despesa (vermelho)
   - Transferência (azul)

2. **Valor** (Input numérico)
   - Formatação: R$ 0,00
   - Validação: > 0

3. **Descrição** (Input texto)
   - Placeholder: "Descrição da transação"
   - Máximo: 100 caracteres

4. **Categoria** (Select)
   - Categorias padrão por tipo
   - Subcategorias dinâmicas

5. **Conta** (Select)
   - Lista de contas do usuário
   - Saldo atual exibido

6. **Data** (Date picker)
   - Padrão: hoje
   - Formato: DD/MM/AAAA

7. **Tags** (Input com chips)
   - Múltiplas tags
   - Autocomplete

8. **Observações** (Textarea)
   - Opcional
   - Máximo: 500 caracteres

9. **Recorrência** (Switch + campos)
   - Frequência
   - Data de término

**Categorias Padrão:**

**Receitas:**

- Salário
- Freelance
- Investimentos
- Vendas
- Outros

**Despesas:**

- Alimentação
- Transporte
- Moradia
- Saúde
- Educação
- Lazer
- Compras
- Contas
- Outros

### Investment Modal

```typescript
interface InvestmentFormData {
  name: string;
  type: "stocks" | "bonds" | "funds" | "crypto" | "real_estate";
  amount: number;
  quantity?: number;
  price?: number;
  broker: string;
  date: Date;
  fees?: number;
  notes?: string;
}
```

### Goal Modal

```typescript
interface GoalFormData {
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  priority: "low" | "medium" | "high";
  autoSave?: {
    enabled: boolean;
    amount: number;
    frequency: "daily" | "weekly" | "monthly";
  };
}
```

### Account Modal

```typescript
interface AccountFormData {
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  bank: string;
  initialBalance: number;
  currency: string;
  color: string;
  includeInTotal: boolean;
}
```

---

## PÁGINAS PRINCIPAIS

### Dashboard (page.tsx)

**Layout:**

- Grid 12 colunas
- Cards responsivos
- Gráficos interativos

**Seções:**

1. **Resumo Financeiro** (4 cards)
   - Saldo Total
   - Receitas do Mês
   - Despesas do Mês
   - Economia do Mês

2. **Gráfico de Fluxo de Caixa** (linha)
   - Últimos 12 meses
   - Receitas vs Despesas

3. **Distribuição por Categoria** (pizza)
   - Despesas do mês atual
   - Top 5 categorias

4. **Transações Recentes** (tabela)
   - Últimas 10 transações
   - Link para ver todas

5. **Metas em Progresso** (cards)
   - Barra de progresso
   - Valor atual/meta

### Transactions Page

**Filtros:**

- Período (date range)
- Tipo (receita/despesa/transferência)
- Categoria
- Conta
- Tags
- Valor (min/max)

**Tabela:**

- Data
- Descrição
- Categoria
- Conta
- Valor
- Ações (editar/excluir)

**Funcionalidades:**

- Ordenação por coluna
- Paginação
- Busca por texto
- Exportar CSV/PDF
- Seleção múltipla
- Ações em lote

### Analytics Page

**Gráficos:**

1. **Evolução Patrimonial** (linha)
2. **Receitas vs Despesas** (barras)
3. **Distribuição por Categoria** (pizza)
4. **Tendências Mensais** (área)
5. **Comparativo Anual** (barras agrupadas)

**Métricas:**

- Taxa de poupança
- Crescimento patrimonial
- Gasto médio por categoria
- Variação mensal

### Investments Page

**Portfolio Overview:**

- Valor total investido
- Rentabilidade
- Distribuição por tipo
- Performance vs CDI/IPCA

**Lista de Investimentos:**

- Nome/Código
- Tipo
- Quantidade
- Preço atual
- Valor total
- Rentabilidade (%)
- Ações

### Goals Page

**Cards de Metas:**

- Nome da meta
- Progresso visual
- Valor atual/meta
- Prazo restante
- Valor mensal necessário

**Filtros:**

- Status (ativa/concluída/atrasada)
- Categoria
- Prioridade

### Accounts Page

**Lista de Contas:**

- Nome
- Tipo
- Banco
- Saldo atual
- Última atualização
- Ações

**Resumo:**

- Total em contas correntes
- Total em poupança
- Total em investimentos
- Patrimônio líquido

---

## ESTRUTURA DE DADOS

### Account Interface

```typescript
interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  bank: string;
  balance: number;
  currency: string;
  color: string;
  includeInTotal: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction Interface

```typescript
interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  accountId: string;
  targetAccountId?: string;
  date: Date;
  tags: string[];
  notes?: string;
  recurring?: RecurringConfig;
  createdAt: Date;
  updatedAt: Date;
}
```

### Investment Interface

```typescript
interface Investment {
  id: string;
  name: string;
  type: "stocks" | "bonds" | "funds" | "crypto" | "real_estate";
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  broker: string;
  purchaseDate: Date;
  fees: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Goal Interface

```typescript
interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  priority: "low" | "medium" | "high";
  status: "active" | "completed" | "paused";
  autoSave?: AutoSaveConfig;
  createdAt: Date;
  updatedAt: Date;
}
```

### Contact Interface

```typescript
interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## TECNOLOGIAS UTILIZADAS

### Frontend Framework

- **Next.js 14**: App Router, SSR, SSG
- **React 18**: Hooks, Suspense, Concurrent Features
- **TypeScript**: Tipagem estática

### Styling

- **Tailwind CSS**: Utility-first CSS
- **CSS Variables**: Tema dinâmico
- **Responsive Design**: Mobile-first

### UI Components

- **Radix UI**: Componentes acessíveis
- **Lucide React**: Ícones
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas

### State Management

- **React Query**: Cache e sincronização
- **Context API**: Estado global
- **Local Storage**: Persistência local

### Charts & Visualization

- **Recharts**: Gráficos React
- **Chart.js**: Gráficos avançados

### Database & Backend

- **Supabase**: Backend as a Service
- **PostgreSQL**: Banco de dados
- **Prisma**: ORM

### Authentication

- **Supabase Auth**: Autenticação
- **JWT**: Tokens de acesso

### Development Tools

- **ESLint**: Linting
- **Prettier**: Formatação
- **Jest**: Testes unitários
- **Playwright**: Testes E2E

### Build & Deploy

- **Vercel**: Hospedagem
- **GitHub Actions**: CI/CD

---

## FUNCIONALIDADES ESPECIAIS

### Sistema de Temas

```typescript
interface ThemeConfig {
  mode: "light" | "dark" | "system";
  primaryColor: string;
  accentColor: string;
  borderRadius: number;
  fontFamily: string;
}
```

**Recursos:**

- Alternância automática (sistema)
- Persistência da preferência
- Transições suaves
- Cores customizáveis

### Notificações

```typescript
interface NotificationConfig {
  type: "info" | "success" | "warning" | "error";
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Tipos:**

- Toast notifications
- Push notifications (PWA)
- Email notifications
- In-app notifications

### PWA Features

- **Manifest**: Instalação como app
- **Service Worker**: Cache offline
- **Push Notifications**: Notificações nativas
- **Background Sync**: Sincronização offline

### Responsividade

**Breakpoints:**

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

**Adaptações:**

- Menu hambúrguer (mobile)
- Sidebar overlay (tablet)
- Grid responsivo
- Tipografia escalável

### Acessibilidade

- **ARIA Labels**: Elementos semânticos
- **Keyboard Navigation**: Navegação por teclado
- **Screen Reader**: Compatibilidade
- **Color Contrast**: WCAG AA
- **Focus Management**: Indicadores visuais

### Performance

- **Code Splitting**: Carregamento sob demanda
- **Image Optimization**: Next.js Image
- **Bundle Analysis**: Webpack Bundle Analyzer
- **Caching**: React Query + Service Worker

### Segurança

- **Input Sanitization**: XSS protection
- **CSRF Protection**: Tokens CSRF
- **Rate Limiting**: API throttling
- **Data Encryption**: Dados sensíveis

### Internacionalização

- **Locale Support**: pt-BR, en-US
- **Currency Formatting**: Real brasileiro
- **Date Formatting**: DD/MM/AAAA
- **Number Formatting**: Separadores locais

### Backup & Sync

- **Auto Backup**: Backup automático
- **Export Data**: CSV, JSON, PDF
- **Import Data**: Múltiplos formatos
- **Cloud Sync**: Sincronização em nuvem

---

## ESTRUTURA DE ARQUIVOS

```
SuaGranaoficial/
├── app/                    # Next.js App Router
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx          # Dashboard
│   ├── transactions/     # Página de transações
│   ├── analytics/        # Página de análises
│   ├── investments/      # Página de investimentos
│   ├── goals/           # Página de metas
│   └── accounts/        # Página de contas
├── components/           # Componentes React
│   ├── ui/              # Componentes base
│   ├── layout/          # Componentes de layout
│   ├── modals/          # Modais e dialogs
│   └── widgets/         # Widgets do dashboard
├── contexts/            # Contextos React
│   ├── theme/           # Contexto de tema
│   └── financial/       # Contexto financeiro
├── hooks/               # Custom hooks
│   ├── financial/       # Hooks financeiros
│   ├── ui/             # Hooks de UI
│   └── queries/        # React Query hooks
├── lib/                # Utilitários
│   ├── types/          # Definições de tipos
│   ├── utils/          # Funções utilitárias
│   ├── validation/     # Schemas de validação
│   └── services/       # Serviços de API
└── public/             # Arquivos estáticos
    ├── icons/          # Ícones PWA
    └── images/         # Imagens
```

---

## CONCLUSÃO

Este documento fornece uma visão completa e detalhada do sistema SuaGrana, incluindo todos os aspectos visuais, funcionais e técnicos necessários para replicar o sistema. Cada seção contém informações específicas sobre cores, componentes, formulários, páginas e funcionalidades, permitindo uma implementação precisa e completa.

Para implementar uma cópia exata, siga as especificações de cores, utilize os componentes descritos com suas respectivas props e estilos, implemente os formulários com os campos e validações especificados, e mantenha a estrutura de dados conforme definida nas interfaces TypeScript.

O sistema é construído com tecnologias modernas e segue as melhores práticas de desenvolvimento, garantindo performance, acessibilidade e experiência do usuário de alta qualidade.
