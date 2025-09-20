const fs = require('fs');
const path = require('path');

function fixUIInternalImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex para encontrar importações './ui/' dentro da pasta ui
    const uiInternalImportRegex = /from ["']\.\/ui\//g;
    
    if (uiInternalImportRegex.test(content)) {
      // Substituir todas as importações './ui/' por './'
      const fixedContent = content.replace(/from ["']\.\/ui\/([-\w]+)["']/g, 'from "./$1"');
      
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✓ Fixed internal UI imports in: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processUIDirectory() {
  let fixedCount = 0;
  const uiPath = path.join(process.cwd(), 'components', 'ui');
  
  try {
    const items = fs.readdirSync(uiPath);
    
    for (const item of items) {
      const fullPath = path.join(uiPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        if (fixUIInternalImports(fullPath)) {
          fixedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`Error reading UI directory:`, error.message);
  }
  
  return fixedCount;
}

// Processar pasta components/ui
const fixedFiles = processUIDirectory();

console.log(`\n🎉 Fixed internal UI imports in ${fixedFiles} files!`);
console.log('All internal UI imports now use correct relative paths');