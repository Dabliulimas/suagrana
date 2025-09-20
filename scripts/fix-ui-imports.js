const fs = require('fs');
const path = require('path');

function fixUIImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex para encontrar importações de UI que não começam com './'
    const uiImportRegex = /from ["']ui\//g;
    
    if (uiImportRegex.test(content)) {
      // Substituir todas as importações 'ui/' por './ui/'
      const fixedContent = content.replace(/from ["']ui\//g, 'from "./ui/');
      
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✓ Fixed UI imports in: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let fixedCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        fixedCount += processDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        if (fixUIImports(fullPath)) {
          fixedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return fixedCount;
}

// Processar pasta components
const componentsPath = path.join(process.cwd(), 'components');
const fixedFiles = processDirectory(componentsPath);

console.log(`\n🎉 Fixed UI imports in ${fixedFiles} files!`);
console.log('All UI imports now use relative paths (./ui/)');