#!/usr/bin/env node

/**
 * Script de migração automática
 * Migra automaticamente todos os arquivos que ainda usam o sistema de storage antigo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Transformações a serem aplicadas
const transformations = [
  // 1. Imports - substituir imports do storage antigo
  {
    pattern: /import\s+{\s*storage\s*}\s+from\s+['"]\.\.\/lib\/storage['"];?/g,
    replacement: 'import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";'
  },
  
  // 2. Imports com tipos - substituir imports com tipos
  {
    pattern: /import\s+{\s*storage,\s*type\s+(\w+)(?:\s*,\s*type\s+(\w+))?\s*}\s+from\s+['"]\.\.\/lib\/storage['"];?/g,
    replacement: (match, type1, type2) => {
      let types = [type1];
      if (type2) types.push(type2);
      return `import { type ${types.join(', type ')} } from "../lib/data-layer/types";\nimport { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";`
    }
  },

  // 3. Imports apenas tipos
  {
    pattern: /import\s+{\s*type\s+(\w+)(?:\s*,\s*type\s+(\w+))?\s*}\s+from\s+['"]\.\.\/lib\/storage['"];?/g,
    replacement: (match, type1, type2) => {
      let types = [type1];
      if (type2) types.push(type2);
      return `import { type ${types.join(', type ')} } from "../lib/data-layer/types";`
    }
  },

  // 4. Console.error com padrões antigos
  {
    pattern: /console\.error\(\s*`\[(\w+)\]([^`]+)`\s*,\s*([^)]+)\)/g,
    replacement: 'logComponents.error("$2", $3)'
  },

  // 5. Console.warn com padrões antigos  
  {
    pattern: /console\.warn\(\s*`\[(\w+)\]([^`]+)`\s*,\s*([^)]+)\)/g,
    replacement: 'logComponents.warn("$2", $3)'
  },

  // 6. Console.error simples
  {
    pattern: /console\.error\(\s*(['"`])([^'"`]+)\1\s*,\s*([^)]+)\)/g,
    replacement: 'logComponents.error("$2", $3)'
  },

  // 7. Storage.get* methods - substituir por hooks
  {
    pattern: /storage\.getAccounts\(\)/g,
    replacement: 'accounts'
  },
  
  {
    pattern: /storage\.getTransactions\(\)/g,
    replacement: 'transactions'
  },
  
  {
    pattern: /storage\.getGoals\(\)/g,
    replacement: 'goals'
  },

  {
    pattern: /storage\.getContacts\(\)/g,
    replacement: 'contacts'
  },

  // 8. Storage.add* methods
  {
    pattern: /storage\.addAccount\(([^)]+)\)/g,
    replacement: 'await createAccount($1)'
  },
  
  {
    pattern: /storage\.addTransaction\(([^)]+)\)/g,
    replacement: 'await createTransaction($1)'
  },
  
  {
    pattern: /storage\.addGoal\(([^)]+)\)/g,
    replacement: 'await createGoal($1)'
  },

  // 9. Storage.update* methods
  {
    pattern: /storage\.updateAccount\(([^,]+),\s*([^)]+)\)/g,
    replacement: 'await updateAccount($1, $2)'
  },
  
  {
    pattern: /storage\.updateTransaction\(([^,]+),\s*([^)]+)\)/g,
    replacement: 'await updateTransaction($1, $2)'
  },

  // 10. Storage.delete* methods
  {
    pattern: /storage\.deleteAccount\(([^)]+)\)/g,
    replacement: 'await deleteAccount($1)'
  },
  
  {
    pattern: /storage\.deleteTransaction\(([^)]+)\)/g,
    replacement: 'await deleteTransaction($1)'
  }
];

// Transformações específicas para adicionar hooks nos componentes React
const reactTransformations = [
  // Adicionar hooks após imports se for componente React
  {
    pattern: /(export\s+(?:default\s+)?function\s+\w+|export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{)/,
    replacement: '$1\n  const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();\n  const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();',
    onlyIfContains: ['storage.get', 'storage.add', 'storage.update', 'storage.delete']
  }
];

function shouldSkipFile(filePath) {
  const skipPatterns = [
    'node_modules',
    '.next',
    'dist',
    '.git',
    'coverage',
    'build',
    // Arquivos já migrados ou que não devem ser migrados
    'unified-context.tsx',
    'data-layer.ts',
    'sync-manager.ts',
    'logger.ts',
    'auto-migrate.js',
    'check-migration-status.js'
  ];
  
  return skipPatterns.some(pattern => filePath.includes(pattern));
}

function addLoggingImport(content, filePath) {
  // Se já tem logging import, não adicionar novamente
  if (content.includes('logComponents') || content.includes('logDataLayer')) {
    return content;
  }

  // Se usa console.error ou console.warn, adicionar import do logger
  if (content.includes('console.error') || content.includes('console.warn')) {
    // Encontrar onde adicionar o import
    const importMatch = content.match(/import[^;]+from[^;]+;/);
    if (importMatch) {
      const insertPoint = content.indexOf(importMatch[0]) + importMatch[0].length;
      return content.slice(0, insertPoint) + 
             '\nimport { logComponents } from "../lib/utils/logger";' +
             content.slice(insertPoint);
    }
  }
  
  return content;
}

function transformFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    console.log(`🔄 Migrando: ${path.relative(projectRoot, filePath)}`);
    
    // Aplicar transformações básicas
    for (const transform of transformations) {
      if (typeof transform.replacement === 'function') {
        content = content.replace(transform.pattern, transform.replacement);
      } else {
        content = content.replace(transform.pattern, transform.replacement);
      }
    }
    
    // Aplicar transformações específicas do React se aplicável
    const isReactComponent = content.includes('export function') || 
                           content.includes('export const') ||
                           content.includes('export default function');
    
    if (isReactComponent) {
      for (const transform of reactTransformations) {
        if (transform.onlyIfContains) {
          const hasPattern = transform.onlyIfContains.some(pattern => content.includes(pattern));
          if (!hasPattern) continue;
        }
        
        if (typeof transform.replacement === 'function') {
          content = content.replace(transform.pattern, transform.replacement);
        } else {
          content = content.replace(transform.pattern, transform.replacement);
        }
      }
    }
    
    // Adicionar import do logger se necessário
    content = addLoggingImport(content, filePath);
    
    // Só escrever se houve mudanças
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Migrado com sucesso: ${path.relative(projectRoot, filePath)}`);
      return true;
    } else {
      console.log(`⏭️  Nenhuma mudança necessária: ${path.relative(projectRoot, filePath)}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Erro ao migrar ${filePath}:`, error.message);
    return false;
  }
}

function migrateDirectory(dirPath, extensions = ['.tsx', '.ts', '.js']) {
  let migratedCount = 0;
  let totalCount = 0;
  
  try {
    const files = fs.readdirSync(dirPath, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      // Pular se não for arquivo ou não tiver extensão desejada
      if (!fs.statSync(filePath).isFile()) continue;
      if (!extensions.some(ext => filePath.endsWith(ext))) continue;
      if (shouldSkipFile(filePath)) continue;
      
      totalCount++;
      if (transformFile(filePath)) {
        migratedCount++;
      }
    }
  } catch (error) {
    console.error(`Erro ao migrar diretório ${dirPath}:`, error.message);
  }
  
  return { migrated: migratedCount, total: totalCount };
}

function main() {
  console.log('🚀 INICIANDO MIGRAÇÃO AUTOMÁTICA COMPLETA\n');
  console.log('==========================================\n');

  const directories = ['components', 'lib', 'hooks', 'contexts', 'app'];
  let totalMigrated = 0;
  let totalFiles = 0;

  for (const dir of directories) {
    if (fs.existsSync(path.join(projectRoot, dir))) {
      console.log(`\n📁 Migrando diretório: ${dir}/`);
      console.log('-'.repeat(50));
      
      const result = migrateDirectory(path.join(projectRoot, dir));
      totalMigrated += result.migrated;
      totalFiles += result.total;
      
      console.log(`📊 ${dir}: ${result.migrated}/${result.total} arquivos migrados`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 RESUMO FINAL DA MIGRAÇÃO');
  console.log('='.repeat(50));
  console.log(`✅ Total de arquivos migrados: ${totalMigrated}`);
  console.log(`📁 Total de arquivos processados: ${totalFiles}`);
  console.log(`📊 Taxa de sucesso: ${totalFiles > 0 ? Math.round((totalMigrated / totalFiles) * 100) : 100}%`);

  if (totalMigrated > 0) {
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n🔍 Executando verificação de status...\n');
    
    // Importar e executar script de verificação
    import('./check-migration-status.js').then(() => {
      console.log('\n✨ Processo de migração automática finalizado!');
    });
  } else {
    console.log('\n💡 Nenhum arquivo precisou ser migrado.');
  }
}

// Executar migração
main();
