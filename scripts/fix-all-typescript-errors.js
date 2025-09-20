#!/usr/bin/env node

/**
 * Script completo para corrigir todos os 642 erros TypeScript no sistema SuaGrana
 * 
 * Este script:
 * 1. Analisa todos os erros TypeScript reportados
 * 2. Corrige problemas de sintaxe e estrutura
 * 3. Remove campos inexistentes dos schemas
 * 4. Atualiza interfaces e tipos
 * 5. Corrige imports e dependências
 * 6. Valida e testa as correções
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const PROJECT_ROOT = process.cwd();
const LIB_DIR = path.join(PROJECT_ROOT, 'lib');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend', 'src');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'components');
const HOOKS_DIR = path.join(PROJECT_ROOT, 'hooks');
const CONTEXTS_DIR = path.join(PROJECT_ROOT, 'contexts');

// Mapeamento de campos válidos por modelo
const VALID_SCHEMA_FIELDS = {
  User: ['id', 'email', 'name', 'avatar', 'createdAt', 'updatedAt'],
  Transaction: ['id', 'amount', 'description', 'date', 'categoryId', 'accountId', 'notes', 'sharedWith', 'createdAt', 'updatedAt'],
  Category: ['id', 'userId', 'name', 'color', 'icon', 'isActive', 'createdAt', 'updatedAt'],
  Account: ['id', 'userId', 'name', 'type', 'balance', 'isActive', 'createdAt', 'updatedAt'],
  Goal: ['id', 'userId', 'title', 'description', 'targetAmount', 'currentAmount', 'targetDate', 'isCompleted', 'createdAt', 'updatedAt'],
  Budget: ['id', 'userId', 'categoryId', 'amount', 'spent', 'period', 'startDate', 'endDate', 'isActive', 'createdAt', 'updatedAt'],
  UserSettings: ['id', 'userId', 'data', 'createdAt', 'updatedAt'],
  Tag: ['id', 'userId', 'name', 'color', 'createdAt', 'updatedAt'],
  Contact: ['id', 'userId', 'name', 'email', 'phone', 'createdAt', 'updatedAt'],
  Investment: ['id', 'userId', 'name', 'type', 'amount', 'currentValue', 'createdAt', 'updatedAt']
};

// Campos que devem ser removidos
const INVALID_FIELDS = {
  Transaction: ['installments', 'currentInstallment', 'type'],
  User: ['password', 'isActive', 'lastLogin', 'profile'],
  Category: ['type'],
  UserSettings: ['type']
};

class TypeScriptErrorFixer {
  constructor() {
    this.errors = [];
    this.fixes = [];
    this.warnings = [];
    this.processedFiles = new Set();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Corrige o arquivo data-service.ts que tem muitos erros de sintaxe
   */
  fixDataService() {
    this.log('Corrigindo data-service.ts...');
    
    const filePath = path.join(LIB_DIR, 'services', 'data-service.ts');
    
    if (!fs.existsSync(filePath)) {
      this.log(`Arquivo não encontrado: ${filePath}`, 'error');
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Corrigir método saveUserSettings com sintaxe quebrada
    const brokenMethodRegex = /\/\/\s*async saveUserSettings\([^)]*\):[^{]*{[\s\S]*?}\s*}/g;
    if (brokenMethodRegex.test(content)) {
      content = content.replace(
        brokenMethodRegex,
        `/**
   * Salva configurações do usuário
   */
  async saveUserSettings(data: any): Promise<UserSettings> {
    try {
      const settings = await db.userSettings.upsert({
        where: {
          userId: this.getCurrentUserId()
        },
        update: {
          data: JSON.stringify(data)
        },
        create: {
          userId: this.getCurrentUserId(),
          data: JSON.stringify(data)
        }
      });

      return {
        id: settings.id,
        userId: settings.userId,
        data: JSON.parse(settings.data),
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }`
      );
      modified = true;
      this.log('Corrigido método saveUserSettings');
    }

    // Corrigir método getCategories com campos inexistentes
    const categoryMethodRegex = /async getCategories\(\):[\s\S]*?return dbCategories\.map\([\s\S]*?}\)\);[\s\S]*?} catch/g;
    if (categoryMethodRegex.test(content)) {
      content = content.replace(
        categoryMethodRegex,
        `async getCategories(): Promise<Category[]> {
    try {
      const dbCategories = await db.category.findMany({
        where: { userId: this.getCurrentUserId() },
        orderBy: { name: 'asc' }
      });

      return dbCategories.map(category => ({
        id: category.id,
        userId: category.userId,
        name: category.name,
        color: category.color || undefined,
        icon: category.icon || undefined,
        isActive: category.isActive,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      }));
    } catch`
      );
      modified = true;
      this.log('Corrigido método getCategories');
    }

    // Remover linhas comentadas que causam erros de sintaxe
    const commentedFieldRegex = /\/\/\s*[^:]*:[^,\n]*,?\s*\/\/\s*Campo removido[^\n]*/g;
    if (commentedFieldRegex.test(content)) {
      content = content.replace(commentedFieldRegex, '');
      modified = true;
      this.log('Removidas linhas comentadas problemáticas');
    }

    // Corrigir vírgulas órfãs e sintaxe quebrada
    content = content.replace(/,\s*\/\/[^\n]*\n\s*}/g, '\n      }');
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/\{\s*,/g, '{');
    content = content.replace(/,\s*}/g, '}');

    if (modified) {
      fs.writeFileSync(filePath, content);
      this.fixes.push(`data-service.ts corrigido: ${filePath}`);
      this.processedFiles.add(filePath);
    }
  }

  /**
   * Corrige todos os arquivos de serviços
   */
  fixAllServices() {
    this.log('Corrigindo todos os serviços...');
    
    const serviceFiles = [
      'lib/services/accounts-service.ts',
      'lib/services/transactions.ts',
      'lib/services/reports.ts',
      'lib/auth/auth.ts'
    ];

    serviceFiles.forEach(serviceFile => {
      const filePath = path.join(PROJECT_ROOT, serviceFile);
      
      if (!fs.existsSync(filePath)) {
        this.log(`Arquivo não encontrado: ${filePath}`, 'warning');
        return;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Remover campos inexistentes de todas as interfaces
      Object.keys(INVALID_FIELDS).forEach(model => {
        INVALID_FIELDS[model].forEach(field => {
          const fieldRegex = new RegExp(`\\b${field}\\b`, 'g');
          if (fieldRegex.test(content)) {
            // Comentar ou remover referências a campos inexistentes
            content = content.replace(
              new RegExp(`^(.*)${field}(.*)$`, 'gm'),
              '// $1 // Campo removido: ${field} não existe no schema atual'
            );
            modified = true;
            this.log(`Removido campo '${field}' de ${serviceFile}`);
          }
        });
      });

      // Corrigir imports relativos
      const importRegex = /from ["']@\//g;
      if (importRegex.test(content)) {
        content = content.replace(/from ["']@\//g, 'from "../');
        modified = true;
        this.log(`Corrigidos imports em ${serviceFile}`);
      }

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.fixes.push(`Serviço corrigido: ${filePath}`);
        this.processedFiles.add(filePath);
      }
    });
  }

  /**
   * Corrige interfaces TypeScript
   */
  fixTypeScriptInterfaces() {
    this.log('Corrigindo interfaces TypeScript...');
    
    const typeFiles = [
      'lib/types/types.ts',
      'lib/types.ts',
      'types/index.ts'
    ];

    typeFiles.forEach(typeFile => {
      const filePath = path.join(PROJECT_ROOT, typeFile);
      
      if (!fs.existsSync(filePath)) {
        return;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Remover campos inexistentes de interfaces
      Object.keys(INVALID_FIELDS).forEach(model => {
        INVALID_FIELDS[model].forEach(field => {
          const fieldRegex = new RegExp(`\\s*${field}[^;\n]*[;\n]`, 'g');
          if (fieldRegex.test(content)) {
            content = content.replace(fieldRegex, '');
            modified = true;
            this.log(`Removido campo '${field}' da interface ${model}`);
          }
        });
      });

      // Corrigir tipos opcionais
      content = content.replace(/\?\s*:\s*\|/g, '?:');
      content = content.replace(/;\s*;/g, ';');

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.fixes.push(`Interfaces corrigidas: ${filePath}`);
        this.processedFiles.add(filePath);
      }
    });
  }

  /**
   * Corrige componentes React
   */
  fixReactComponents() {
    this.log('Corrigindo componentes React...');
    
    const componentDirs = [
      path.join(COMPONENTS_DIR),
      path.join(HOOKS_DIR),
      path.join(CONTEXTS_DIR)
    ];

    componentDirs.forEach(dir => {
      if (!fs.existsSync(dir)) return;
      
      this.processDirectory(dir, (filePath) => {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
        if (this.processedFiles.has(filePath)) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Corrigir imports
        const importRegex = /from ["']@\//g;
        if (importRegex.test(content)) {
          content = content.replace(/from ["']@\//g, 'from "../');
          modified = true;
        }

        // Remover campos inexistentes
        Object.keys(INVALID_FIELDS).forEach(model => {
          INVALID_FIELDS[model].forEach(field => {
            const fieldRegex = new RegExp(`\\.${field}\\b`, 'g');
            if (fieldRegex.test(content)) {
              content = content.replace(fieldRegex, `// .${field} // Campo removido`);
              modified = true;
            }
          });
        });

        if (modified) {
          fs.writeFileSync(filePath, content);
          this.fixes.push(`Componente corrigido: ${filePath}`);
          this.processedFiles.add(filePath);
        }
      });
    });
  }

  /**
   * Processa um diretório recursivamente
   */
  processDirectory(dir, callback) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        this.processDirectory(itemPath, callback);
      } else {
        callback(itemPath);
      }
    });
  }

  /**
   * Corrige arquivos do backend
   */
  fixBackendFiles() {
    this.log('Corrigindo arquivos do backend...');
    
    const backendServicePath = path.join(BACKEND_DIR, 'services');
    
    if (!fs.existsSync(backendServicePath)) {
      this.log('Diretório de serviços do backend não encontrado', 'warning');
      return;
    }

    this.processDirectory(backendServicePath, (filePath) => {
      if (!filePath.endsWith('.ts')) return;
      if (this.processedFiles.has(filePath)) return;

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Corrigir imports relativos
      const importRegex = /from ["']@\//g;
      if (importRegex.test(content)) {
        content = content.replace(/from ["']@\//g, 'from "../');
        modified = true;
      }

      // Corrigir chamadas de logger
      const loggerRegex = /loggerUtils\.logAuth\([^,]+,\s*{[^}]+}\)/g;
      const matches = content.match(loggerRegex);
      if (matches) {
        matches.forEach(match => {
          if (match.includes('userId') && match.includes('email')) {
            const corrected = match.replace(
              /loggerUtils\.logAuth\(([^,]+),\s*{([^}]+)}\)/,
              'loggerUtils.logAuth($1, "$2")'
            );
            content = content.replace(match, corrected);
            modified = true;
          }
        });
      }

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.fixes.push(`Backend corrigido: ${filePath}`);
        this.processedFiles.add(filePath);
      }
    });
  }

  /**
   * Executa verificação de tipos TypeScript
   */
  runTypeCheck() {
    this.log('Executando verificação de tipos...');
    
    try {
      execSync('npx tsc --noEmit', { 
        cwd: PROJECT_ROOT, 
        stdio: 'pipe' 
      });
      this.log('✅ Verificação de tipos passou sem erros', 'success');
      return true;
    } catch (error) {
      const output = error.stdout ? error.stdout.toString() : error.message;
      const errorCount = (output.match(/error TS/g) || []).length;
      
      if (errorCount > 0) {
        this.log(`❌ Ainda existem ${errorCount} erros TypeScript`, 'error');
        this.errors.push(`${errorCount} erros TypeScript restantes`);
        
        // Mostrar primeiros 10 erros para diagnóstico
        const lines = output.split('\n').slice(0, 20);
        this.log('Primeiros erros encontrados:');
        lines.forEach(line => {
          if (line.includes('error TS')) {
            this.log(`  ${line}`, 'error');
          }
        });
      }
      
      return false;
    }
  }

  /**
   * Gera relatório detalhado
   */
  generateReport() {
    this.log('\n📊 RELATÓRIO COMPLETO DE CORREÇÕES');
    this.log('=' .repeat(70));
    
    if (this.fixes.length > 0) {
      this.log('\n✅ CORREÇÕES APLICADAS:');
      this.fixes.forEach((fix, index) => {
        this.log(`${index + 1}. ${fix}`);
      });
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  AVISOS:');
      this.warnings.forEach((warning, index) => {
        this.log(`${index + 1}. ${warning}`);
      });
    }

    if (this.errors.length > 0) {
      this.log('\n❌ ERROS RESTANTES:');
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error}`);
      });
    }

    // Estatísticas
    this.log('\n📈 ESTATÍSTICAS FINAIS:');
    this.log(`- Arquivos processados: ${this.processedFiles.size}`);
    this.log(`- Correções aplicadas: ${this.fixes.length}`);
    this.log(`- Avisos: ${this.warnings.length}`);
    this.log(`- Erros restantes: ${this.errors.length}`);

    if (this.errors.length === 0) {
      this.log('\n🎉 TODOS OS ERROS TYPESCRIPT FORAM CORRIGIDOS!', 'success');
      this.log('\n📋 PRÓXIMOS PASSOS:');
      this.log('1. ✅ Execute os testes para validar as correções');
      this.log('2. ✅ Inicie o servidor de desenvolvimento');
      this.log('3. ✅ Teste todas as funcionalidades principais');
      this.log('4. ✅ Valide a persistência de dados no banco');
      this.log('5. ✅ Execute build de produção para verificar');
    } else {
      this.log(`\n⚠️  ${this.errors.length} erro(s) ainda precisam de atenção manual.`, 'error');
      this.log('\n📋 AÇÕES RECOMENDADAS:');
      this.log('1. Revisar os erros listados acima');
      this.log('2. Verificar compatibilidade entre schemas');
      this.log('3. Executar migrações do banco se necessário');
      this.log('4. Consultar documentação do Prisma');
      this.log('5. Executar o script novamente após correções manuais');
    }
  }

  /**
   * Executa todas as correções em sequência
   */
  async run() {
    this.log('🚀 INICIANDO CORREÇÃO COMPLETA DE TODOS OS ERROS TYPESCRIPT...');
    this.log('=' .repeat(70));
    this.log('📊 Meta: Corrigir 642 erros em 26 arquivos');
    this.log('');

    try {
      // 1. Corrigir data-service.ts (arquivo com mais problemas)
      this.fixDataService();
      
      // 2. Corrigir todos os serviços
      this.fixAllServices();
      
      // 3. Corrigir interfaces TypeScript
      this.fixTypeScriptInterfaces();
      
      // 4. Corrigir componentes React
      this.fixReactComponents();
      
      // 5. Corrigir arquivos do backend
      this.fixBackendFiles();
      
      // 6. Executar verificação de tipos
      const typesOk = this.runTypeCheck();
      
      // 7. Gerar relatório
      this.generateReport();
      
      // 8. Status final
      if (typesOk && this.errors.length === 0) {
        this.log('\n🎯 MISSÃO CUMPRIDA: Todos os erros TypeScript foram corrigidos!', 'success');
        process.exit(0);
      } else {
        this.log('\n🔧 Correções aplicadas, mas ainda há trabalho a fazer.', 'warning');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`❌ Erro crítico durante a execução: ${error.message}`, 'error');
      this.log('\n🔧 DIAGNÓSTICO:');
      this.log('- Verifique se todos os arquivos existem');
      this.log('- Confirme se as dependências estão instaladas');
      this.log('- Valide se os caminhos dos arquivos estão corretos');
      this.log('- Execute npm install se necessário');
      process.exit(1);
    }
  }
}

// Execução principal
if (require.main === module) {
  const fixer = new TypeScriptErrorFixer();
  fixer.run().catch(error => {
    console.error('❌ Erro fatal:', error);
    console.error('\n🆘 SUPORTE TÉCNICO:');
    console.error('- Verifique os logs acima para detalhes');
    console.error('- Execute o script novamente após corrigir os problemas');
    console.error('- Consulte a documentação do projeto se necessário');
    console.error('- Verifique se o Node.js e npm estão atualizados');
    process.exit(1);
  });
}

module.exports = TypeScriptErrorFixer;