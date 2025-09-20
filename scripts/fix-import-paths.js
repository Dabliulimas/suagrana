const fs = require('fs');
const path = require('path');

// Função para corrigir caminhos de importação
function fixImportPaths(content) {
  let fixed = content;
  
  // Padrões de importação incorretos para corrigir
  const patterns = [
    // Corrigir ../components/ui/ para ./ui/ quando estamos em components/
    {
      from: /from ["']\.\.\/components\/ui\//g,
      to: 'from "./ui/'
    },
    // Corrigir ../components/ para ./ quando estamos em components/
    {
      from: /from ["']\.\.\/components\//g,
      to: 'from "./'
    },
    // Corrigir @/components/ui/ para ./ui/ quando estamos em components/
    {
      from: /from ["']@\/components\/ui\//g,
      to: 'from "./ui/'
    },
    // Corrigir @/components/ para ./ quando estamos em components/
    {
      from: /from ["']@\/components\//g,
      to: 'from "./'
    }
  ];
  
  patterns.forEach(pattern => {
    fixed = fixed.replace(pattern.from, pattern.to);
  });
  
  return fixed;
}

// Função para processar arquivos recursivamente
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let totalFixed = 0;
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Pular node_modules e .next
      if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
        totalFixed += processDirectory(fullPath);
      }
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const fixedContent = fixImportPaths(content);
      
      if (content !== fixedContent) {
        fs.writeFileSync(fullPath, fixedContent, 'utf8');
        console.log(`Fixed imports in: ${fullPath}`);
        totalFixed++;
      }
    }
  });
  
  return totalFixed;
}

// Processar apenas a pasta components
const componentsPath = path.join(__dirname, '..', 'components');
console.log('Fixing import paths in components directory...');

const totalFixed = processDirectory(componentsPath);

console.log(`\nFixed import paths in ${totalFixed} files.`);
console.log('Import path fixes completed!');