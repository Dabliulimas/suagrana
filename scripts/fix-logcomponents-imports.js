#!/usr/bin/env node

/**
 * Script para adicionar automaticamente imports de logComponents
 * onde estão sendo usados mas não importados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Padrão para detectar uso de logComponents
const LOG_COMPONENTS_USAGE = /logComponents\./;
const EXISTING_IMPORT_PATTERN = /import.*logComponents.*from.*logger/;
const LOGGER_IMPORT_PATTERN = /from\s+["']\.\.\/lib\/logger["']/;

function hasLogComponentsUsage(content) {
  return LOG_COMPONENTS_USAGE.test(content);
}

function hasExistingImport(content) {
  return EXISTING_IMPORT_PATTERN.test(content);
}

function addLogComponentsImport(content) {
  // Se já tem import do logger, adiciona logComponents ao import existente
  if (LOGGER_IMPORT_PATTERN.test(content)) {
    // Busca por imports existentes do logger
    const loggerImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*["']\.\.\/lib\/logger["']/);
    if (loggerImportMatch) {
      const currentImports = loggerImportMatch[1];
      if (!currentImports.includes('logComponents')) {
        const newImports = currentImports.trim() + ', logComponents';
        return content.replace(
          loggerImportMatch[0], 
          `import { ${newImports} } from "../lib/logger"`
        );
      }
      return content; // Já tem o import
    }
  }

  // Se não tem import do logger, adiciona novo import
  // Procura por outros imports para posicionar corretamente
  const importMatch = content.match(/^import.*["'][^"']+["'];?\s*$/m);
  if (importMatch) {
    const importIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
    const beforeImport = content.substring(0, importIndex);
    const afterImport = content.substring(importIndex);
    
    // Determina o número correto de ../ baseado na localização do arquivo
    let importPath = '../lib/logger';
    if (content.includes('from "../../lib/')) {
      importPath = '../../lib/logger';
    } else if (content.includes('from "../../../lib/')) {
      importPath = '../../../lib/logger';
    }
    
    return beforeImport + '\nimport { logComponents } from "' + importPath + '";' + afterImport;
  }

  // Se não tem imports, adiciona no início após possíveis comentários/diretivas
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Pula diretivas "use client", comentários, etc.
  while (insertIndex < lines.length) {
    const line = lines[insertIndex].trim();
    if (line.startsWith('"use') || line.startsWith("'use") || 
        line.startsWith('//') || line.startsWith('/*') || 
        line === '') {
      insertIndex++;
    } else {
      break;
    }
  }
  
  const beforeInsert = lines.slice(0, insertIndex).join('\n');
  const afterInsert = lines.slice(insertIndex).join('\n');
  const newImport = 'import { logComponents } from "../lib/logger";';
  
  return beforeInsert + (beforeInsert ? '\n' : '') + newImport + '\n' + afterInsert;
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verifica se usa logComponents mas não tem import
    if (hasLogComponentsUsage(content) && !hasExistingImport(content)) {
      console.log(`🔧 Fixing ${filePath}`);
      const newContent = addLogComponentsImport(content);
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function scanDirectory(dirPath) {
  let fixedCount = 0;
  
  try {
    const files = fs.readdirSync(dirPath, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      // Apenas arquivos .tsx e .ts
      if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) continue;
      
      // Pular arquivos de teste e node_modules
      if (filePath.includes('node_modules') || 
          filePath.includes('.next') || 
          filePath.includes('dist') ||
          filePath.includes('.test.') ||
          filePath.includes('.spec.')) {
        continue;
      }
      
      if (!fs.statSync(filePath).isFile()) continue;
      
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error.message);
  }
  
  return fixedCount;
}

function main() {
  console.log('🚀 Fixing logComponents imports...\n');
  
  const directories = ['components', 'hooks', 'lib', 'app', 'contexts'];
  let totalFixed = 0;
  
  for (const dir of directories) {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Scanning ${dir}/...`);
      const fixed = scanDirectory(dirPath);
      totalFixed += fixed;
      console.log(`   Fixed ${fixed} files\n`);
    }
  }
  
  console.log(`✅ Total files fixed: ${totalFixed}`);
  
  if (totalFixed > 0) {
    console.log('\n🎯 Run "npm run build" to verify all imports are working correctly.');
  } else {
    console.log('\n✨ No files needed fixing!');
  }
}

main();
