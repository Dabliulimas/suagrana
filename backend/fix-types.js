const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');

// Função para corrigir tipos em um arquivo
function fixTypesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Adicionar imports se não existirem
    if (!content.includes('Request, Response')) {
      content = content.replace(
        /import { Router } from "express";/,
        'import { Router, Request, Response, NextFunction } from "express";'
      );
    }
    
    // Corrigir asyncHandler com tipos
    content = content.replace(
      /asyncHandler\(async \(req, res\)/g,
      'asyncHandler(async (req: Request, res: Response)'
    );
    
    // Corrigir outras funções middleware
    content = content.replace(
      /\(req: any, res: any, next: any\)/g,
      '(req: Request, res: Response, next: NextFunction)'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corrigido: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
  }
}

// Listar todos os arquivos .ts na pasta routes
const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.ts'));

console.log('🔧 Corrigindo tipos TypeScript...');

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  fixTypesInFile(filePath);
});

console.log('✅ Correção de tipos concluída!');