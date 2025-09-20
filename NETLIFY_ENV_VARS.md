# Variáveis de Ambiente para Deploy no Netlify

## Configuração Obrigatória

Para que o deploy funcione corretamente no Netlify, você deve configurar as seguintes variáveis de ambiente no painel do Netlify:

### 1. Banco de Dados (PostgreSQL/Neon)
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DIRECT_URL=postgresql://username:password@host:port/database?sslmode=require
```

### 2. NextAuth.js
```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.netlify.app
```

### 3. Configurações de Build
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=true
```

### 4. APIs Externas (Opcionais)
```
BRAPI_TOKEN=your-brapi-token
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
```

### 5. Upload/Storage (Se usado)
```
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
```

### 6. Supabase (Se usado)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 7. Email (Se usado)
```
RESEND_API_KEY=your-resend-api-key
```

### 8. Monitoring (Opcional)
```
SENTRY_DSN=your-sentry-dsn
```

## Como Configurar no Netlify

1. Acesse o painel do Netlify
2. Vá para Site settings > Environment variables
3. Adicione cada variável individualmente
4. Faça um novo deploy após configurar todas as variáveis

## Notas Importantes

- Nunca commite valores reais de variáveis sensíveis no repositório
- Use valores diferentes para produção e desenvolvimento
- O arquivo `.env.example` contém todas as variáveis necessárias como referência
- Algumas variáveis são opcionais dependendo das funcionalidades que você está usando

## Verificação

Após configurar as variáveis, verifique se o build passa executando:
```bash
npm run build:netlify
```