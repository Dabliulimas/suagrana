# Sistema de Cache Redis - SuaGrana

## Visão Geral

O sistema de cache Redis foi implementado para otimizar a performance dos relatórios e reduzir a carga no banco de dados PostgreSQL. O sistema inclui cache inteligente com invalidação automática, versionamento e estatísticas detalhadas.

## Arquitetura

### Componentes Principais

1. **CacheService** (`src/services/cacheService.ts`)
   - Serviço principal de cache com funcionalidades avançadas
   - Suporte a TTL, prefixos, tags e versionamento
   - Estatísticas de uso e monitoramento

2. **Cache Invalidation Middleware** (`src/middleware/cacheInvalidation.ts`)
   - Invalidação automática após operações de escrita
   - Middlewares específicos por tipo de recurso
   - Suporte a cabeçalhos HTTP de cache

3. **ReportService** (`src/services/reportService.ts`)
   - Integração com cache para relatórios
   - Cache por usuário e tipo de relatório
   - Invalidação inteligente por tags

## Funcionalidades

### 1. Cache com TTL Dinâmico

```typescript
// Cache com TTL de 5 minutos
const data = await cacheService.remember(
  "user:123:dashboard",
  async () => await generateDashboard(userId),
  300, // 5 minutos
  ["user:123", "dashboard"],
);
```

### 2. Invalidação por Tags

```typescript
// Invalida todos os caches relacionados ao usuário
await cacheService.invalidateByTags(["user:123"]);

// Invalida todos os dashboards
await cacheService.invalidateByTags(["dashboard"]);
```

### 3. Versionamento de Cache

```typescript
// Cache versionado para evitar dados obsoletos
const data = await cacheService.setVersioned(
  "reports:monthly",
  reportData,
  600,
  "v2.1",
);
```

### 4. Middleware de Invalidação Automática

```typescript
// Nas rotas, adicione o middleware apropriado
router.post(
  "/transactions",
  authMiddleware,
  invalidateTransactionCache, // Invalida cache automaticamente
  asyncHandler(async (req, res) => {
    // Lógica da rota
  }),
);
```

## Configuração

### Variáveis de Ambiente

```env
# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=sua_senha_redis

# Cache
CACHE_TTL=300
CACHE_MAX_ITEMS=10000
```

### Configuração do Redis

O Redis é configurado em `src/config/database.ts`:

```typescript
export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});
```

## Uso nos Relatórios

### Cache de Dashboard

- **TTL**: 5 minutos (300s)
- **Tags**: `['user:{userId}', 'dashboard']`
- **Invalidação**: Automática quando transações/contas são modificadas

### Cache de Relatórios

- **Cash Flow**: TTL 10 minutos, tags `['user:{userId}', 'cash-flow']`
- **Expenses**: TTL 10 minutos, tags `['user:{userId}', 'expenses']`
- **Investments**: TTL 15 minutos, tags `['user:{userId}', 'investments']`
- **Goals**: TTL 10 minutos, tags `['user:{userId}', 'goals']`

## Endpoints de Gerenciamento

### Invalidar Cache

```http
POST /api/reports/cache/invalidate
Content-Type: application/json
Authorization: Bearer {token}

{
  "type": "dashboard" // opcional: dashboard, cash-flow, expenses, investments, goals
}
```

### Estatísticas do Cache

```http
GET /api/reports/cache/stats
Authorization: Bearer {token}
```

Resposta:

```json
{
  "success": true,
  "data": {
    "cache": {
      "hits": 1250,
      "misses": 180,
      "sets": 200,
      "deletes": 45,
      "errors": 2
    },
    "redis": {
      "connected": true,
      "uptime": 86400,
      "memory": {
        "used": "2.5M",
        "peak": "3.1M",
        "rss": "4.2M"
      },
      "clients": 5,
      "version": "7.0.0"
    }
  }
}
```

### Limpar Todo o Cache

```http
DELETE /api/reports/cache
Authorization: Bearer {token}
```

## Monitoramento

### Logs de Cache

O sistema registra todas as operações de cache:

```typescript
// Logs automáticos para:
- Cache hits/misses
- Operações de set/delete
- Erros de conexão
- Invalidações por tag
- Estatísticas de performance
```

### Métricas Disponíveis

1. **Hit Rate**: Taxa de acertos do cache
2. **Miss Rate**: Taxa de falhas do cache
3. **Memory Usage**: Uso de memória do Redis
4. **Key Distribution**: Distribuição de chaves por prefixo
5. **TTL Analysis**: Análise dos tempos de vida

## Estratégias de Cache

### 1. Cache-Aside (Lazy Loading)

```typescript
// Padrão usado nos relatórios
const data = await cacheService.remember(key, async () => {
  return await database.query(...);
}, ttl, tags);
```

### 2. Write-Through

```typescript
// Cache atualizado imediatamente após escrita
await database.save(data);
await cacheService.set(key, data, ttl, tags);
```

### 3. Write-Behind (Write-Back)

```typescript
// Cache atualizado, banco atualizado assincronamente
await cacheService.set(key, data, ttl, tags);
setImmediate(() => database.save(data));
```

## Boas Práticas

### 1. Nomenclatura de Chaves

```typescript
// Padrão: {service}:{entity}:{id}:{action}
"reports:user:123:dashboard";
"reports:user:123:cash-flow:2024-01";
"transactions:user:123:list:page:1";
```

### 2. Uso de Tags

```typescript
// Tags hierárquicas para invalidação granular
["user:123", "reports", "dashboard"][
  ("user:123", "transactions", "account:456")
];
```

### 3. TTL Apropriado

- **Dados em tempo real**: 30-60 segundos
- **Relatórios**: 5-15 minutos
- **Dados estáticos**: 1-24 horas
- **Configurações**: 24 horas

### 4. Tratamento de Erros

```typescript
try {
  const cached = await cacheService.get(key);
  if (cached) return cached;
} catch (error) {
  // Log erro mas continue sem cache
  logger.warn('Cache error, falling back to database', { error });
}

// Fallback para banco de dados
return await database.query(...);
```

## Troubleshooting

### Problemas Comuns

1. **Redis Desconectado**
   - Verificar configuração de conexão
   - Verificar se o Redis está rodando
   - Verificar logs de conexão

2. **Cache Miss Alto**
   - Verificar TTL muito baixo
   - Verificar invalidação excessiva
   - Analisar padrões de acesso

3. **Memória Alta**
   - Verificar TTL das chaves
   - Implementar limpeza automática
   - Analisar distribuição de chaves

### Comandos de Debug

```bash
# Conectar ao Redis
redis-cli

# Listar todas as chaves
KEYS *

# Ver informações de uma chave
TTL reports:user:123:dashboard
TYPE reports:user:123:dashboard

# Estatísticas do Redis
INFO memory
INFO keyspace
```

## Performance

### Benchmarks Esperados

- **Cache Hit**: < 1ms
- **Cache Miss + DB**: 10-50ms
- **Invalidação por Tag**: < 5ms
- **Throughput**: > 10,000 ops/sec

### Otimizações

1. **Pipeline**: Usar pipeline para operações em lote
2. **Compression**: Comprimir dados grandes
3. **Serialization**: Usar JSON.stringify/parse otimizado
4. **Connection Pooling**: Pool de conexões Redis

## Segurança

### Considerações

1. **Dados Sensíveis**: Não cachear senhas ou tokens
2. **Isolamento**: Cache por usuário/tenant
3. **Expiração**: TTL obrigatório para dados pessoais
4. **Logs**: Não logar dados sensíveis

### Implementação

```typescript
// Verificar se dados são sensíveis
if (isSensitiveData(data)) {
  // Não cachear ou usar TTL muito baixo
  return data;
}

// Cache com isolamento por usuário
const key = `user:${userId}:${resource}`;
```

## Roadmap

### Próximas Funcionalidades

1. **Cache Distribuído**: Suporte a múltiplas instâncias
2. **Cache Warming**: Pré-carregamento de dados
3. **Analytics**: Dashboard de métricas
4. **Auto-scaling**: Ajuste automático de TTL
5. **Backup**: Persistência de cache crítico
