# Configuração de Produção para Netlify - SuaGrana

## ✅ Status da Configuração

### Sistema de Autenticação
- ✅ NextAuth.js configurado com fallback para produção
- ✅ Configuração simplificada para build sem dependências do Prisma
- ✅ Middleware de autenticação configurado
- ✅ Rotas protegidas e públicas definidas

### Build de Produção
- ✅ Build testado e funcionando localmente
- ✅ Configuração do Next.js otimizada para Netlify
- ✅ Variáveis de ambiente documentadas

## 🔧 Configurações Necessárias no Netlify

### 1. Variáveis de Ambiente Obrigatórias

```bash
# Banco de Dados (PostgreSQL/Neon)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DIRECT_URL=postgresql://username:password@host:port/database?sslmode=require

# NextAuth.js
NEXTAUTH_SECRET=your-production-secret-key-minimum-32-characters
NEXTAUTH_URL=https://your-app-name.netlify.app

# Configurações de Build
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=true

# API Configuration
NEXT_PUBLIC_API_URL=https://your-app-name.netlify.app/api
```

### 2. Variáveis Opcionais

```bash
# Google OAuth (se usado)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# APIs Externas
BRAPI_TOKEN=your-brapi-token
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key

# Supabase (se usado)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Upload/Storage
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Email
RESEND_API_KEY=your-resend-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## 🚀 Processo de Deploy

### 1. Configurar Variáveis no Netlify
1. Acesse o painel do Netlify
2. Vá para **Site settings > Environment variables**
3. Adicione todas as variáveis obrigatórias listadas acima
4. Configure as variáveis opcionais conforme necessário

### 2. Deploy Automático
- O deploy será automático após push para o repositório
- O comando de build configurado: `npm run build:netlify`
- Pasta de publicação: `.next`

### 3. Configurações do Banco de Dados
- Configure um banco PostgreSQL (recomendado: Neon)
- Execute as migrações do Prisma após o primeiro deploy
- Configure as URLs de conexão nas variáveis de ambiente

## 📁 Arquivos de Configuração

### netlify.toml
- ✅ Configurado com otimizações para Next.js
- ✅ Headers de segurança configurados
- ✅ Redirecionamentos para SPA configurados
- ✅ Cache otimizado para assets estáticos

### next.config.js
- ✅ Configurado para build standalone
- ✅ Otimizações para produção habilitadas
- ✅ Fallbacks para dependências do servidor

### Autenticação
- ✅ Configuração dual (desenvolvimento/produção)
- ✅ Fallback automático durante build
- ✅ Suporte a múltiplos providers

## 🔍 Verificações Pós-Deploy

### 1. Funcionalidades Básicas
- [ ] Página inicial carrega corretamente
- [ ] Sistema de autenticação funciona
- [ ] Rotas protegidas redirecionam para login
- [ ] API routes respondem corretamente

### 2. Performance
- [ ] Lighthouse score > 90
- [ ] Tempo de carregamento < 3s
- [ ] Assets estáticos com cache configurado

### 3. Segurança
- [ ] Headers de segurança aplicados
- [ ] HTTPS funcionando
- [ ] Variáveis sensíveis não expostas

## 🆘 Troubleshooting

### Build Falha
1. Verificar se todas as variáveis obrigatórias estão configuradas
2. Verificar logs de build no Netlify Dashboard
3. Testar build localmente com `npm run build:netlify`

### Autenticação Não Funciona
1. Verificar NEXTAUTH_URL está correto
2. Verificar NEXTAUTH_SECRET tem pelo menos 32 caracteres
3. Verificar configuração do provider (Google OAuth, etc.)

### Banco de Dados
1. Verificar URLs de conexão
2. Executar migrações: `npx prisma db push`
3. Verificar permissões de acesso

## 📞 Suporte

Para problemas específicos:
1. Verificar logs no Netlify Dashboard
2. Consultar documentação do NextAuth.js
3. Verificar status do banco de dados (Neon/Supabase)

---

**Última atualização:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Status:** Pronto para deploy