const fs = require('fs');
const path = require('path');

// Função para corrigir importações baseado na localização do arquivo
function fixImports(filePath, content) {
  let updatedContent = content;
  let changesMade = 0;

  // Determinar a profundidade do arquivo em relação à pasta components
  const relativePath = path.relative(path.join(__dirname, '..', 'components'), filePath);
  const depth = relativePath.split(path.sep).length - 1;
  
  // Criar prefixo baseado na profundidade
  const prefix = '../'.repeat(depth);
  
  // Padrões de correção
  const patterns = [
    // UI components - corrigir para caminho relativo correto
    {
      regex: /from ["']\.\/ui\/([-\w]+)["']/g,
      replacement: `from "${prefix}ui/$1"`,
      condition: () => !filePath.includes('components\\ui\\') && !filePath.includes('components/ui/')
    },
    // Lib imports
    {
      regex: /from ["']\.\.\/(lib\/[-\w\/]+)["']/g,
      replacement: `from "${prefix}../$1"`,
      condition: () => filePath.includes('components')
    },
    // Hooks imports
    {
      regex: /from ["']\.\.\/(hooks\/[-\w\/]+)["']/g,
      replacement: `from "${prefix}../$1"`,
      condition: () => filePath.includes('components')
    },
    // Contexts imports
    {
      regex: /from ["']\.\.\/(contexts\/[-\w\/]+)["']/g,
      replacement: `from "${prefix}../$1"`,
      condition: () => filePath.includes('components')
    },
    // Storage imports
    {
      regex: /from ["']\.\.\/(lib\/storage)["']/g,
      replacement: `from "${prefix}../lib/storage"`,
      condition: () => filePath.includes('components')
    },
    // Optimization imports
    {
      regex: /from ["']\.\/optimization\/([-\w]+)["']/g,
      replacement: `from "${prefix}optimization/$1"`,
      condition: () => !filePath.includes('optimization')
    }
  ];

  patterns.forEach(pattern => {
    if (pattern.condition()) {
      const matches = content.match(pattern.regex);
      if (matches) {
        updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
        changesMade += matches.length;
      }
    }
  });

  return { content: updatedContent, changes: changesMade };
}

// Função para processar arquivos recursivamente
function processFiles(dir) {
  let totalChanges = 0;
  let filesProcessed = 0;

  function processDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);

    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const result = fixImports(fullPath, content);
        
        if (result.changes > 0) {
          fs.writeFileSync(fullPath, result.content);
          console.log(`✓ Fixed ${result.changes} imports in ${path.relative(dir, fullPath)}`);
          totalChanges += result.changes;
          filesProcessed++;
        }
      }
    });
  }

  processDirectory(dir);
  return { totalChanges, filesProcessed };
}

// Processar diretório components
const componentsDir = path.join(__dirname, '..', 'components');
console.log('Fixing all import paths...');

const result = processFiles(componentsDir);

console.log(`\n✅ Import path fixing completed!`);
console.log(`📁 Files processed: ${result.filesProcessed}`);
console.log(`🔧 Total imports fixed: ${result.totalChanges}`);

if (result.totalChanges === 0) {
  console.log('ℹ️  No import path issues found.');
}