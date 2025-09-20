# 🚀 Deploy do SuaGrana no Netlify

## 📋 Pré-requisitos

- Conta no Netlify
- Repositório no GitHub: https://github.com/Dabliulimas/suagrana
- Node.js 18+ (configurado automaticamente no Netlify)

## ⚙️ Configurações de Build

### Configurações Automáticas
O Netlify detectou automaticamente que é um projeto Next.js e aplicará:
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Node Version:** 18

### Configurações Manuais (se necessário)

1. **Site Settings > Build & Deploy > Build Settings:**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

2. **Site Settings > Build & Deploy > Environment Variables:**
   ```
   NODE_VERSION=18
   NPM_FLAGS=--production=false
   ```

## 🔐 Variáveis de Ambiente

Configure as seguintes variáveis no Netlify Dashboard:

### Essenciais
```
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-app.netlify.app
DATABASE_URL=your-production-database-url
```

### Opcionais
```
BRAPI_TOKEN=your-brapi-token-for-stock-prices
ALPHA_VANTAGE_KEY=your-alpha-vantage-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📁 Estrutura do Projeto

```
SuaGrana/
├── app/                 # Next.js App Router
├── backend/            # API Backend (Node.js)
├── components/         # Componentes React
├── lib/               # Utilitários
├── prisma/            # Schema do banco
├── public/            # Assets estáticos
├── netlify.toml       # Configuração do Netlify
├── next.config.js     # Configuração do Next.js
└── package.json       # Dependências
```

## 🔧 Configurações Específicas

### 1. Backend API
O backend está na pasta `/backend` e precisa ser deployado separadamente ou configurado como função serverless.

### 2. Banco de Dados
- **Desenvolvimento:** SQLite local
- **Produção:** PostgreSQL (recomendado: Neon, Supabase)

### 3. Autenticação
- NextAuth.js configurado
- Suporte a múltiplos providers
- Sessões seguras

## 🚀 Processo de Deploy

### Deploy Automático
1. Push para o repositório GitHub
2. Netlify detecta mudanças automaticamente
3. Build é executado automaticamente
4. Site é deployado

### Deploy Manual
1. Acesse o Netlify Dashboard
2. Vá em "Deploys"
3. Clique em "Trigger deploy"
4. Selecione "Deploy site"

## 🔍 Troubleshooting

### Erro de Build
```bash
# Verificar logs no Netlify Dashboard
# Comum: dependências faltando
npm install --production=false
```

### Erro de Variáveis de Ambiente
```bash
# Verificar se todas as variáveis estão configuradas
# No Netlify: Site Settings > Environment Variables
```

### Erro de Roteamento
```bash
# Verificar netlify.toml
# Configurações de redirect estão corretas
```

## 📊 Monitoramento

### Logs
- Netlify Dashboard > Functions > View logs
- Real-time logs durante o build

### Performance
- Lighthouse CI integrado
- Core Web Vitals automáticos

### Analytics
- Netlify Analytics (opcional)
- Google Analytics (se configurado)

## 🔄 Atualizações

### Atualizações Automáticas
- Push para `master` → Deploy automático
- Pull requests → Deploy preview

### Rollback
- Netlify Dashboard > Deploys
- Clique em deploy anterior
- "Publish deploy"

## 📞 Suporte

### Recursos Úteis
- [Netlify Docs - Next.js](https://docs.netlify.com/frameworks/next-js/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Netlify Community](https://community.netlify.com/)

### Logs de Debug
```bash
# Habilitar logs detalhados
DEBUG=* npm run build
```

## ✅ Checklist de Deploy

- [ ] Repositório conectado ao Netlify
- [ ] Variáveis de ambiente configuradas
- [ ] Build command configurado
- [ ] Publish directory configurado
- [ ] Domínio customizado (opcional)
- [ ] SSL habilitado
- [ ] Redirects configurados
- [ ] Headers de segurança configurados

---

**🎉 Seu SuaGrana estará online em poucos minutos!**