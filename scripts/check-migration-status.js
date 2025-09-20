#!/usr/bin/env node

/**
 * Script para verificar o status da migração dos componentes
 * Identifica arquivos que ainda usam o sistema de storage antigo
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Padrões que indicam uso do sistema antigo
const OLD_PATTERNS = [
  /import.*storage.*from.*["']\.\.\/lib\/storage["']/,
  /storage\.get/,
  /storage\.add/,
  /storage\.update/,
  /storage\.delete/,
  /console\.error.*\[.*\]/,
  /console\.warn.*\[.*\]/,
];

// Padrões que indicam migração para o novo sistema
const NEW_PATTERNS = [
  /import.*from.*["']\.\.\/lib\/data-layer\/types["']/,
  /import.*from.*["']\.\.\/contexts\/unified-context["']/,
  /use(Accounts|Transactions|Goals|Contacts|Trips|Investments|SharedDebts)/,
  /logDataLayer|logSyncManager|logUnifiedContext|logComponents/,
];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasOldPatterns = OLD_PATTERNS.some(pattern => pattern.test(content));
    const hasNewPatterns = NEW_PATTERNS.some(pattern => pattern.test(content));
    
    return {
      hasOld: hasOldPatterns,
      hasNew: hasNewPatterns,
      content: content
    };
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error.message);
    return null;
  }
}

function scanDirectory(dirPath, extensions = ['.tsx', '.ts', '.js']) {
  const results = {
    needsMigration: [],
    partiallyMigrated: [],
    fullyMigrated: [],
    errors: []
  };

  try {
    const files = fs.readdirSync(dirPath, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      // Pular se não for arquivo ou não tiver extensão desejada
      if (!fs.statSync(filePath).isFile()) continue;
      if (!extensions.some(ext => filePath.endsWith(ext))) continue;
      
      // Pular arquivos do node_modules e .next
      if (filePath.includes('node_modules') || filePath.includes('.next') || filePath.includes('dist')) {
        continue;
      }
      
      const scanResult = scanFile(filePath);
      if (!scanResult) {
        results.errors.push(filePath);
        continue;
      }
      
      const relativePath = path.relative(projectRoot, filePath);
      
      if (scanResult.hasOld && scanResult.hasNew) {
        results.partiallyMigrated.push(relativePath);
      } else if (scanResult.hasOld) {
        results.needsMigration.push(relativePath);
      } else if (scanResult.hasNew) {
        results.fullyMigrated.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Erro ao escanear diretório ${dirPath}:`, error.message);
  }

  return results;
}

function generateReport(results) {
  console.log('\n🔍 RELATÓRIO DE STATUS DA MIGRAÇÃO\n');
  console.log('=====================================\n');

  console.log(`📊 RESUMO:`);
  console.log(`  • Arquivos que precisam migração: ${results.needsMigration.length}`);
  console.log(`  • Arquivos parcialmente migrados: ${results.partiallyMigrated.length}`);
  console.log(`  • Arquivos totalmente migrados: ${results.fullyMigrated.length}`);
  console.log(`  • Erros: ${results.errors.length}\n`);

  if (results.needsMigration.length > 0) {
    console.log('🚨 ARQUIVOS QUE PRECISAM DE MIGRAÇÃO:');
    results.needsMigration.forEach(file => {
      console.log(`  ❌ ${file}`);
    });
    console.log('');
  }

  if (results.partiallyMigrated.length > 0) {
    console.log('⚠️  ARQUIVOS PARCIALMENTE MIGRADOS:');
    results.partiallyMigrated.forEach(file => {
      console.log(`  🔄 ${file}`);
    });
    console.log('');
  }

  if (results.fullyMigrated.length > 0) {
    console.log('✅ ARQUIVOS TOTALMENTE MIGRADOS:');
    results.fullyMigrated.forEach(file => {
      console.log(`  ✅ ${file}`);
    });
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('❌ ERROS:');
    results.errors.forEach(file => {
      console.log(`  💥 ${file}`);
    });
    console.log('');
  }

  // Calcular porcentagem de migração
  const total = results.needsMigration.length + results.partiallyMigrated.length + results.fullyMigrated.length;
  const migrated = results.fullyMigrated.length + (results.partiallyMigrated.length * 0.5);
  const percentage = total > 0 ? Math.round((migrated / total) * 100) : 100;
  
  console.log(`📈 PROGRESSO DA MIGRAÇÃO: ${percentage}%`);
  
  if (percentage < 100) {
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Migrar arquivos que ainda usam storage antigo');
    console.log('2. Completar arquivos parcialmente migrados');
    console.log('3. Testar funcionalidades após migração');
    console.log('4. Executar testes para validar');
  } else {
    console.log('\n🎉 MIGRAÇÃO COMPLETA! Todos os arquivos foram migrados.');
  }
}

function main() {
  const directories = ['components', 'contexts', 'lib', 'hooks', 'app'];
  let totalResults = {
    needsMigration: [],
    partiallyMigrated: [],
    fullyMigrated: [],
    errors: []
  };

  console.log('Escaneando arquivos para verificar status da migração...\n');

  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      console.log(`Escaneando ${dir}/...`);
      const results = scanDirectory(dir);
      
      // Combinar resultados
      totalResults.needsMigration.push(...results.needsMigration);
      totalResults.partiallyMigrated.push(...results.partiallyMigrated);
      totalResults.fullyMigrated.push(...results.fullyMigrated);
      totalResults.errors.push(...results.errors);
    }
  }

  generateReport(totalResults);

  // Salvar relatório em arquivo
  const reportPath = 'migration-status-report.txt';
  const reportContent = `
RELATÓRIO DE MIGRAÇÃO - ${new Date().toISOString()}

ARQUIVOS QUE PRECISAM MIGRAÇÃO (${totalResults.needsMigration.length}):
${totalResults.needsMigration.map(f => `- ${f}`).join('\n')}

ARQUIVOS PARCIALMENTE MIGRADOS (${totalResults.partiallyMigrated.length}):
${totalResults.partiallyMigrated.map(f => `- ${f}`).join('\n')}

ARQUIVOS TOTALMENTE MIGRADOS (${totalResults.fullyMigrated.length}):
${totalResults.fullyMigrated.map(f => `- ${f}`).join('\n')}

ERROS (${totalResults.errors.length}):
${totalResults.errors.map(f => `- ${f}`).join('\n')}
`;

  try {
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
  } catch (error) {
    console.log(`\n❌ Erro ao salvar relatório: ${error.message}`);
  }
}

// Executar se este arquivo foi chamado diretamente
main();

export { scanFile, scanDirectory, generateReport };
