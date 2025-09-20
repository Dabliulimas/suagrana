# 💰 SuaGrana - Sistema de Gestão Financeira Pessoal

<div align="center">

![SuaGrana Logo](public/placeholder-logo.svg)

**Sistema completo de gestão financeira pessoal com foco na experiência do usuário brasileiro**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge)](https://web.dev/progressive-web-apps/)

[🚀 Demo](#demo) • [📦 Instalação](#instalação) • [🎯 Funcionalidades](#funcionalidades) • [🔧 Desenvolvimento](#desenvolvimento)

</div>

## 📋 Índice

- [🎯 Sobre](#sobre)
- [✨ Funcionalidades](#funcionalidades)
- [🛠 Tecnologias](#tecnologias)
- [📦 Instalação](#instalação)
- [🚀 Como Usar](#como-usar)
- [🏗 Arquitetura](#arquitetura)
- [🔧 Desenvolvimento](#desenvolvimento)
- [🧪 Testes](#testes)
- [📱 PWA](#pwa)
- [🤝 Contribuindo](#contribuindo)

## 🎯 Sobre

**SuaGrana** é um sistema completo de gestão financeira pessoal desenvolvido especialmente para o público brasileiro. Com interface moderna e intuitiva, oferece todas as ferramentas necessárias para controlar suas finanças de forma eficiente.

### 🎨 Design Highlights

- **Interface Moderna**: Design limpo usando Tailwind CSS e Radix UI
- **Modo Escuro/Claro**: Suporte completo a temas
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **PWA**: Pode ser instalado como aplicativo

## ✨ Funcionalidades

### 💳 Gestão de Contas
- ✅ Contas corrente, poupança e cartão de crédito
- ✅ Múltiplas contas por banco
- ✅ Controle de saldos automático
- ✅ Transferências entre contas

### 💰 Controle de Transações
- ✅ Receitas e despesas
- ✅ Categorização automática
- ✅ Filtros avançados
- ✅ Busca inteligente
- ✅ Anexos e comprovantes

### 📊 Investimentos
- ✅ Ações (B3)
- ✅ Fundos Imobiliários (FIIs)
- ✅ Tesouro Direto
- ✅ Criptomoedas
- ✅ Relatórios de performance
- ✅ Controle de dividendos

### 🎯 Metas e Objetivos
- ✅ Definição de metas financeiras
- ✅ Acompanhamento de progresso
- ✅ Alertas de prazo
- ✅ Diferentes tipos de meta

### ✈️ Controle de Viagens
- ✅ Planejamento de orçamento
- ✅ Controle de gastos por categoria
- ✅ Conversão de moedas
- ✅ Relatórios de viagem

### 👥 Gastos Compartilhados
- ✅ Divisão de contas
- ✅ Controle de quem deve o quê
- ✅ Histórico de acertos
- ✅ Notificações de cobrança

### 📈 Relatórios e Analytics
- ✅ Dashboard completo
- ✅ Gráficos interativos
- ✅ Análise de gastos por categoria
- ✅ Projeções financeiras
- ✅ Exportação para PDF/Excel

## 🛠 Tecnologias

### Frontend
- **[Next.js 15](https://nextjs.org/)** - Framework React com App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling utility-first
- **[Radix UI](https://www.radix-ui.com/)** - Componentes acessíveis
- **[Framer Motion](https://www.framer.com/motion/)** - Animações
- **[Recharts](https://recharts.org/)** - Gráficos e charts

### State Management
- **[Zustand](https://github.com/pmndrs/zustand)** - Estado global
- **[React Query](https://tanstack.com/query)** - Cache e sincronização
- **[React Hook Form](https://react-hook-form.com/)** - Formulários

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend as a Service
- **[Prisma](https://www.prisma.io/)** - ORM para PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados

### Validação e Utilitários
- **[Zod](https://zod.dev/)** - Validação de schemas
- **[date-fns](https://date-fns.org/)** - Manipulação de datas
- **[Lucide React](https://lucide.dev/)** - Ícones

### Desenvolvimento
- **[Jest](https://jestjs.io/)** - Testes unitários
- **[Playwright](https://playwright.dev/)** - Testes E2E
- **[ESLint](https://eslint.org/)** - Linting
- **[Prettier](https://prettier.io/)** - Formatação

## 📦 Instalação

### Pré-requisitos

- Node.js 18.0 ou superior
- npm/yarn/pnpm
- Git

### 🚀 Setup Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/seuusuario/suagrana.git
cd suagrana

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local

# 4. Execute o setup do banco
npm run db:setup

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

### 🔐 Configuração de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Supabase (opcional)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

```

# APIs Externas
BRAPI_TOKEN="seu-token-brapi" # Para cotações de ações
ALPHA_VANTAGE_KEY="sua-chave" # Para dados financeiros

# NextAuth (se usar autenticação)
NEXTAUTH_SECRET="seu-secret-super-secreto"
NEXTAUTH_URL="http://localhost:3000"
```

### 🗄️ Setup do Banco de Dados

```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar migrações
npx prisma db push

# (Opcional) Popular com dados exemplo
npm run db:seed
```

## 🚀 Como Usar

### 1. **Primeiro Acesso**

1. Abra o navegador em `http://localhost:3000`
2. Crie sua conta ou faça login
3. Configure suas contas bancárias
4. Comece adicionando transações

### 2. **Adicionando Transações**

```typescript
// Exemplo de transação
{
  description: "Supermercado",
  amount: -150.50,
  type: "expense",
  category: "Alimentação",
  account: "Conta Corrente",
  date: "2024-01-15"
}
```

### 3. **Configurando Investimentos**

1. Vá para `/investments`
2. Adicione suas operações de compra/venda
3. Configure dividendos recebidos
4. Acompanhe performance nos relatórios

## 🏗 Arquitetura

### Estrutura de Pastas

```
suagrana/
├── app/                    # App Router (Next.js 13+)
│   ├── (dashboard)/       # Grupo de rotas do dashboard
│   ├── api/               # API routes
│   ├── globals.css        # Estilos globais
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn)
│   ├── dashboard/        # Componentes do dashboard
│   ├── forms/            # Formulários
│   └── charts/           # Gráficos e visualizações
├── contexts/             # Contextos React
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
│   ├── utils/           # Funções utilitárias
│   ├── validations/     # Schemas de validação
│   └── services/        # Serviços externos
├── prisma/              # Schema e migrações
│   ├── schema.prisma
│   └── migrations/
├── public/              # Assets estáticos
└── types/               # Definições de tipos TypeScript
```

### Padrões Utilizados

- **Componentes**: Functional components com hooks
- **Estado**: Context API + Zustand para estado global
- **Styling**: Tailwind CSS com CSS Variables
- **Formulários**: React Hook Form + Zod
- **Tipagem**: TypeScript strict mode

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Servidor de desenvolvimento
npm run dev:optimized      # Desenvolvimento otimizado
npm run dev:fast           # Desenvolvimento com cache limpo

# Build e Deploy
npm run build              # Build de produção
npm run start              # Servidor de produção
npm run build:analyze      # Análise do bundle

# Qualidade de Código
npm run lint               # ESLint
npm run type-check         # Verificação TypeScript

# Testes
npm run test               # Testes unitários
npm run test:watch         # Testes em modo watch
npm run test:e2e           # Testes end-to-end
npm run test:coverage      # Cobertura de testes

# Banco de Dados
npm run db:push            # Aplicar mudanças do schema
npm run db:studio          # Interface visual do banco
npm run db:generate        # Gerar cliente Prisma
```

### Workflow de Desenvolvimento

1. **Feature Branch**: Crie uma branch para cada feature
2. **Commit Convencional**: Use conventional commits
3. **Testes**: Escreva testes para novas funcionalidades
4. **Type Safety**: Mantenha tipagem rígida
5. **Code Review**: Peer review obrigatório

### Conventional Commits

```bash
feat: adiciona nova funcionalidade de investimentos
fix: corrige cálculo de saldo das contas
docs: atualiza documentação da API
style: ajusta espaçamento dos componentes
refactor: reorganiza estrutura de pastas
test: adiciona testes para componente de transações
```

## 🧪 Testes

### Estrutura de Testes

```
__tests__/
├── components/           # Testes de componentes
├── hooks/               # Testes de hooks
├── utils/               # Testes de utilitários
├── integration/         # Testes de integração
└── e2e/                # Testes end-to-end
```

### Executando Testes

```bash
# Todos os testes
npm run test:all

# Testes unitários
npm run test:unit

# Testes E2E
npm run test:e2e

# Com cobertura
npm run test:coverage
```

## 📱 PWA

O SuaGrana é um **Progressive Web App** completo:

- ✅ **Installable**: Pode ser instalado no device
- ✅ **Offline**: Funciona offline com cache
- ✅ **Push Notifications**: Notificações nativas
- ✅ **Background Sync**: Sincronização automática

### Instalação PWA

1. Acesse pelo navegador mobile
2. Toque em "Adicionar à tela inicial"
3. Use como app nativo

## 🔒 Segurança

- **Autenticação**: JWT + Supabase Auth
- **Validação**: Zod schemas em frontend e backend
- **CSRF Protection**: Tokens CSRF automáticos
- **Rate Limiting**: Proteção contra spam
- **Data Encryption**: Dados sensíveis criptografados

## 🌟 Roadmap

### v2.0 (Em desenvolvimento)
- [ ] Open Banking (Pix automático)
- [ ] IA para categorização
- [ ] Relatório de Imposto de Renda
- [ ] App mobile nativo
- [ ] Multi-tenant

### v2.1 (Futuro)
- [ ] Integração com bancos
- [ ] Carteira digital
- [ ] Marketplace de investimentos
- [ ] Social features

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! 

### Como Contribuir

1. **Fork** o projeto
2. **Clone** seu fork
3. **Crie** uma branch para sua feature
4. **Commit** suas mudanças
5. **Push** para a branch
6. **Abra** um Pull Request

### Diretrizes

- Siga os padrões de código estabelecidos
- Escreva testes para novas funcionalidades
- Mantenha a documentação atualizada
- Use conventional commits

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Shadcn/ui](https://ui.shadcn.com/) - Componentes base
- [Lucide](https://lucide.dev/) - Ícones
- [Vercel](https://vercel.com/) - Hospedagem
- [Supabase](https://supabase.com/) - Backend

---

<div align="center">

**Desenvolvido com ❤️ para o público brasileiro**

[🌟 Star no GitHub](https://github.com/seuusuario/suagrana) • [🐛 Reportar Bug](https://github.com/seuusuario/suagrana/issues) • [💡 Sugestão](https://github.com/seuusuario/suagrana/discussions)

</div>
