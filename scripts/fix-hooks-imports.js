const fs = require('fs');
const path = require('path');

function getDepthLevel(filePath, baseDir) {
  const relativePath = path.relative(baseDir, filePath);
  const depth = relativePath.split(path.sep).length - 1;
  return depth;
}

function fixHooksImports(filePath, baseDir) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let changesMade = 0;
    
    const depth = getDepthLevel(filePath, baseDir);
    const prefix = '../'.repeat(depth + 1);
    
    // Padrões para corrigir
    const patterns = [
      // lib imports
      {
        regex: /from ["']\.\.\/(lib\/[^"']+)["']/g,
        replacement: `from "${prefix}$1"`
      },
      // contexts imports
      {
        regex: /from ["']\.\.\/(contexts\/[^"']+)["']/g,
        replacement: `from "${prefix}$1"`
      }
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
        changesMade += matches.length;
      }
    });
    
    if (changesMade > 0) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✓ Fixed ${changesMade} imports in: ${path.relative(baseDir, filePath)}`);
    }
    
    return changesMade;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dirPath, baseDir) {
  let totalChanges = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        totalChanges += processDirectory(fullPath, baseDir);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        totalChanges += fixHooksImports(fullPath, baseDir);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return totalChanges;
}

// Processar pasta hooks
const hooksPath = path.join(process.cwd(), 'hooks');
const totalChanges = processDirectory(hooksPath, process.cwd());

console.log(`\n🎉 Fixed ${totalChanges} import paths in hooks!`);
console.log('All hooks imports now use correct relative paths');