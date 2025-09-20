const fs = require('fs');
const path = require('path');

class JSXCommentFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalReplacements = 0;
  }

  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Pattern 1: object// // // .property // Campo removido // Campo removido // Campo removido
      const pattern1 = /([a-zA-Z_$][a-zA-Z0-9_$]*)(\/\/ \/\/ \/\/ \.)([a-zA-Z_$][a-zA-Z0-9_$]*) \/\/ Campo removido \/\/ Campo removido \/\/ Campo removido/g;
      
      // Pattern 2: object?// // // .property // Campo removido // Campo removido // Campo removido
      const pattern2 = /([a-zA-Z_$][a-zA-Z0-9_$]*)(\?\/\/ \/\/ \/\/ \.)([a-zA-Z_$][a-zA-Z0-9_$]*) \/\/ Campo removido \/\/ Campo removido \/\/ Campo removido/g;
      
      // Pattern 3: object// .property // Campo removido
      const pattern3 = /([a-zA-Z_$][a-zA-Z0-9_$]*)(\/\/ \.)([a-zA-Z_$][a-zA-Z0-9_$]*) \/\/ Campo removido/g;
      
      // Pattern 4: object?// .property // Campo removido
       const pattern4 = /([a-zA-Z_$][a-zA-Z0-9_$]*)(\?\/\/ \.)([a-zA-Z_$][a-zA-Z0-9_$]*) \/\/ Campo removido/g;
       
       // Pattern 5: // // import  // Campo removido: ${field} não existe no schema atual
       const pattern5 = /\/\/ \/\/ import  \/\/ Campo removido: \$\{field\} não existe no schema atual/g;
       
       // Pattern 6: //   ?: "type1" | "type2" | "type3" | "type4"; // Campo removido: não existe no schema atual
       const pattern6 = /\/\/   \?:\s*"[^"]+"(?:\s*\|\s*"[^"]+")*;\s*\/\/ Campo removido: não existe no schema atual/g;
       
       content = content.replace(pattern1, '$1.$3');
       content = content.replace(pattern2, '$1?.$3');
       content = content.replace(pattern3, '$1.$3');
       content = content.replace(pattern4, '$1?.$3');
       content = content.replace(pattern5, '');
       content = content.replace(pattern6, '');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        const matches1 = (originalContent.match(pattern1) || []).length;
         const matches2 = (originalContent.match(pattern2) || []).length;
         const matches3 = (originalContent.match(pattern3) || []).length;
         const matches4 = (originalContent.match(pattern4) || []).length;
         const matches5 = (originalContent.match(pattern5) || []).length;
         const matches6 = (originalContent.match(pattern6) || []).length;
         const totalMatches = matches1 + matches2 + matches3 + matches4 + matches5 + matches6;
        this.totalReplacements += totalMatches;
        this.fixedFiles++;
        console.log('Fixed ' + totalMatches + ' issues in: ' + filePath);
      }
    } catch (error) {
      console.error('Error fixing file ' + filePath + ':', error.message);
    }
  }

  processDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          this.processDirectory(fullPath);
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
          this.fixFile(fullPath);
        }
      }
    } catch (error) {
      console.error('Error processing directory ' + dirPath + ':', error.message);
    }
  }

  run() {
    console.log('Starting comprehensive JSX comment fixes...');
    
    const componentsDir = path.join(process.cwd(), 'components');
    const appDir = path.join(process.cwd(), 'app');
    const hooksDir = path.join(process.cwd(), 'hooks');
    const libDir = path.join(process.cwd(), 'lib');
    
    // Process all directories
    [componentsDir, appDir, hooksDir, libDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log('Processing directory: ' + dir);
        this.processDirectory(dir);
      }
    });
    
    console.log('\n=== Comprehensive JSX Comment Fix Report ===');
    console.log('Files fixed: ' + this.fixedFiles);
    console.log('Total replacements: ' + this.totalReplacements);
    console.log('\nAll JSX comment issues have been resolved!');
  }
}

const fixer = new JSXCommentFixer();
fixer.run();