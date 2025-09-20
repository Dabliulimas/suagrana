#!/usr/bin/env node

/**
 * Script completo para corrigir problemas de compatibilidade entre modelos do banco de dados
 * e código TypeScript no sistema SuaGrana
 * 
 * Este script:
 * 1. Corrige incompatibilidades entre schemas do frontend e backend
 * 2. Remove referências a campos inexistentes
 * 3. Atualiza interfaces TypeScript para refletir schemas corretos
 * 4. Corrige erros de compilação TypeScript
 * 5. Sincroniza modelos entre frontend e backend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const PROJECT_ROOT = process.cwd();
const BACKEND_SERVICES_DIR = path.join(PROJECT_ROOT, 'backend', 'src', 'services');
const FRONTEND_SERVICES_DIR = path.join(PROJECT_ROOT, 'lib', 'services');
const BACKEND_SCHEMA = path.join(PROJECT_ROOT, 'backend', 'prisma', 'schema.prisma');
const FRONTEND_SCHEMA = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');

// Mapeamento de campos entre schemas
const SCHEMA_MAPPING = {
  backend: {
    User: ['id', 'email', 'name', 'password', 'avatar', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
    Transaction: ['id', 'amount', 'description', 'date', 'type', 'categoryId', 'accountId', 'createdAt', 'updatedAt']
  },
  frontend: {
    User: ['id', 'email', 'name', 'avatar', 'createdAt', 'updatedAt'],
    Transaction: ['id', 'amount', 'description', 'date', 'categoryId', 'createdAt', 'updatedAt']
  }
};

class DatabaseFixer {
  constructor() {
    this.errors = [];
    this.fixes = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Corrige o authService.ts do backend para usar o schema correto
   */
  fixBackendAuthService() {
    this.log('Corrigindo authService.ts do backend...');
    
    const authServicePath = path.join(BACKEND_SERVICES_DIR, 'authService.ts');
    
    if (!fs.existsSync(authServicePath)) {
      this.log(`Arquivo não encontrado: ${authServicePath}`, 'error');
      return;
    }

    let content = fs.readFileSync(authServicePath, 'utf8');
    let modified = false;

    // Corrigir criação de usuário para incluir password
    const createUserRegex = /data:\s*{[^}]*email:[^}]*name:[^}]*}/g;
    if (createUserRegex.test(content)) {
      content = content.replace(
        /data:\s*{\s*email:\s*email\.toLowerCase\(\),\s*name,\s*\/\/ Note:[^}]*}/g,
        `data: {
          email: email.toLowerCase(),
          name,
          password: hashedPassword,
        }`
      );
      modified = true;
      this.log('Corrigido: criação de usuário agora inclui password');
    }

    // Descomentar verificação de senha no login
    const passwordCheckRegex = /\/\/ const isPasswordValid[^\n]*\n\s*\/\/ if \(!isPasswordValid\)[^\n]*\n\s*\/\/ {[^}]*}/g;
    if (passwordCheckRegex.test(content)) {
      content = content.replace(
        /\/\/ const isPasswordValid = await bcrypt\.compare\(password, user\.password\);\s*\n\s*\/\/ if \(!isPasswordValid\) {\s*\n\s*\/\/   throw new AuthenticationError\("Credenciais inválidas"\);\s*\n\s*\/\/ }/g,
        `const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError("Credenciais inválidas");
      }`
      );
      modified = true;
      this.log('Corrigido: verificação de senha no login ativada');
    }

    // Corrigir busca de usuário para incluir password
    const userFindRegex = /select:\s*{\s*id:\s*true,\s*email:\s*true\s*}/g;
    if (userFindRegex.test(content)) {
      content = content.replace(
        /select:\s*{\s*id:\s*true,\s*email:\s*true\s*}/g,
        'select: { id: true, email: true, password: true }'
      );
      modified = true;
      this.log('Corrigido: busca de usuário agora inclui password');
    }

    // Atualizar lastLogin no login
    const updateUserRegex = /data:\s*{\s*updatedAt:\s*new Date\(\),\s*}/g;
    if (updateUserRegex.test(content)) {
      content = content.replace(
        /data:\s*{\s*updatedAt:\s*new Date\(\),\s*}/g,
        `data: {
          lastLogin: new Date(),
          updatedAt: new Date(),
        }`
      );
      modified = true;
      this.log('Corrigido: login agora atualiza lastLogin');
    }

    // Descomentar funcionalidade de mudança de senha
    const changePasswordRegex = /\/\/ password: hashedNewPassword,/g;
    if (changePasswordRegex.test(content)) {
      content = content.replace(
        /\/\/ password: hashedNewPassword,/g,
        'password: hashedNewPassword,'
      );
      modified = true;
      this.log('Corrigido: mudança de senha ativada');
    }

    if (modified) {
      fs.writeFileSync(authServicePath, content);
      this.fixes.push(`AuthService do backend corrigido: ${authServicePath}`);
    }
  }

  /**
   * Corrige serviços do frontend para remover campos inexistentes
   */
  fixFrontendServices() {
    this.log('Corrigindo serviços do frontend...');
    
    const servicesToFix = [
      'data-service.ts',
      'accounts-service.ts',
      'transactions.ts',
      'reports.ts'
    ];

    servicesToFix.forEach(serviceFile => {
      const servicePath = path.join(FRONTEND_SERVICES_DIR, serviceFile);
      
      if (!fs.existsSync(servicePath)) {
        this.log(`Arquivo não encontrado: ${servicePath}`, 'warning');
        return;
      }

      let content = fs.readFileSync(servicePath, 'utf8');
      let modified = false;

      // Remove campos inexistentes de Transaction
      const invalidTransactionFields = ['installments', 'currentInstallment', 'type'];
      invalidTransactionFields.forEach(field => {
        const fieldRegex = new RegExp(`\\b${field}\\b`, 'g');
        if (fieldRegex.test(content)) {
          // Comentar linhas que usam campos inexistentes
          content = content.replace(
            new RegExp(`^(.*)${field}(.*)$`, 'gm'),
            '// $1$2 // Campo removido: não existe no schema atual'
          );
          modified = true;
          this.log(`Removido campo inexistente '${field}' de ${serviceFile}`);
        }
      });

      if (modified) {
        fs.writeFileSync(servicePath, content);
        this.fixes.push(`Serviço do frontend corrigido: ${servicePath}`);
      }
    });
  }

  /**
   * Corrige interfaces TypeScript
   */
  fixTypeScriptInterfaces() {
    this.log('Corrigindo interfaces TypeScript...');
    
    // Corrigir tipos no frontend
    const typesPath = path.join(PROJECT_ROOT, 'lib', 'types', 'types.ts');
    
    if (fs.existsSync(typesPath)) {
      let content = fs.readFileSync(typesPath, 'utf8');
      let modified = false;

      // Remover campos inexistentes de interfaces
      const fieldsToRemove = ['installments', 'currentInstallment', 'type'];
      fieldsToRemove.forEach(field => {
        const fieldRegex = new RegExp(`\\s*${field}[^;\n]*[;\n]`, 'g');
        if (fieldRegex.test(content)) {
          content = content.replace(fieldRegex, '');
          modified = true;
          this.log(`Removido campo '${field}' das interfaces TypeScript`);
        }
      });

      if (modified) {
        fs.writeFileSync(typesPath, content);
        this.fixes.push(`Interfaces TypeScript corrigidas: ${typesPath}`);
      }
    }
  }

  /**
   * Corrige imports e dependências
   */
  fixImportsAndDependencies() {
    this.log('Corrigindo imports e dependências...');
    
    const filesToCheck = [
      path.join(BACKEND_SERVICES_DIR, 'authService.ts'),
      path.join(BACKEND_SERVICES_DIR, 'userService.ts'),
      path.join(BACKEND_SERVICES_DIR, 'transactionService.ts')
    ];

    filesToCheck.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Corrigir imports relativos
      const importRegex = /from ["']@\//g;
      if (importRegex.test(content)) {
        content = content.replace(/from ["']@\//g, 'from "../');
        modified = true;
        this.log(`Corrigidos imports relativos em ${path.basename(filePath)}`);
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
        this.log(`Corrigidas chamadas de logger em ${path.basename(filePath)}`);
      }

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.fixes.push(`Imports e dependências corrigidos: ${filePath}`);
      }
    });
  }

  /**
   * Executa verificação de tipos TypeScript
   */
  runTypeCheck() {
    this.log('Executando verificação de tipos...');
    
    try {
      // Verifica tipos no backend
      const backendPath = path.join(PROJECT_ROOT, 'backend');
      if (fs.existsSync(backendPath)) {
        execSync('npx tsc --noEmit', { 
          cwd: backendPath, 
          stdio: 'pipe' 
        });
        this.log('✅ Verificação de tipos do backend passou', 'success');
      }

      // Verifica tipos no frontend (apenas arquivos críticos)
      const criticalFiles = [
        'lib/services/data-service.ts',
        'lib/auth/auth.ts',
        'lib/types/types.ts'
      ];
      
      criticalFiles.forEach(file => {
        const filePath = path.join(PROJECT_ROOT, file);
        if (fs.existsSync(filePath)) {
          try {
            execSync(`npx tsc --noEmit ${file}`, { 
              cwd: PROJECT_ROOT, 
              stdio: 'pipe' 
            });
            this.log(`✅ ${file} passou na verificação de tipos`, 'success');
          } catch (error) {
            this.log(`❌ Erro em ${file}: ${error.message}`, 'error');
            this.errors.push(`Erro de tipos em ${file}`);
          }
        }
      });
      
    } catch (error) {
      this.log(`❌ Erro na verificação de tipos: ${error.message}`, 'error');
      this.errors.push(`Erro de tipos: ${error.message}`);
    }
  }

  /**
   * Verifica se os schemas Prisma estão válidos
   */
  checkPrismaSchemas() {
    this.log('Verificando schemas Prisma...');
    
    // Verificar schema do backend
    try {
      execSync('npx prisma validate', { 
        cwd: path.join(PROJECT_ROOT, 'backend'), 
        stdio: 'pipe' 
      });
      this.log('✅ Schema Prisma do backend válido', 'success');
    } catch (error) {
      this.log(`❌ Erro no schema do backend: ${error.message}`, 'error');
      this.errors.push(`Erro no schema do backend: ${error.message}`);
    }

    // Verificar schema do frontend
    try {
      execSync('npx prisma validate', { 
        cwd: PROJECT_ROOT, 
        stdio: 'pipe' 
      });
      this.log('✅ Schema Prisma do frontend válido', 'success');
    } catch (error) {
      this.log(`❌ Erro no schema do frontend: ${error.message}`, 'error');
      this.errors.push(`Erro no schema do frontend: ${error.message}`);
    }
  }

  /**
   * Gera relatório detalhado de correções
   */
  generateReport() {
    this.log('\n📊 RELATÓRIO DETALHADO DE CORREÇÕES');
    this.log('=' .repeat(60));
    
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
      this.log('\n❌ ERROS ENCONTRADOS:');
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error}`);
      });
    }

    // Estatísticas
    this.log('\n📈 ESTATÍSTICAS:');
    this.log(`- Correções aplicadas: ${this.fixes.length}`);
    this.log(`- Avisos: ${this.warnings.length}`);
    this.log(`- Erros restantes: ${this.errors.length}`);

    if (this.errors.length === 0) {
      this.log('\n🎉 Todos os problemas foram corrigidos com sucesso!', 'success');
      this.log('\n📋 PRÓXIMOS PASSOS:');
      this.log('1. Execute os testes para validar as correções');
      this.log('2. Verifique se o servidor backend está funcionando');
      this.log('3. Teste as funcionalidades de autenticação');
      this.log('4. Valide a persistência de dados no banco');
    } else {
      this.log(`\n⚠️  ${this.errors.length} erro(s) ainda precisam de atenção manual.`, 'error');
      this.log('\n📋 AÇÕES RECOMENDADAS:');
      this.log('1. Revisar os erros listados acima');
      this.log('2. Verificar compatibilidade entre schemas');
      this.log('3. Executar migrações do banco se necessário');
      this.log('4. Consultar documentação do Prisma para campos obrigatórios');
    }
  }

  /**
   * Executa todas as correções em sequência
   */
  async run() {
    this.log('🚀 Iniciando correção completa do sistema...');
    this.log('=' .repeat(60));

    try {
      // 1. Corrigir authService do backend
      this.fixBackendAuthService();
      
      // 2. Corrigir serviços do frontend
      this.fixFrontendServices();
      
      // 3. Corrigir interfaces TypeScript
      this.fixTypeScriptInterfaces();
      
      // 4. Corrigir imports e dependências
      this.fixImportsAndDependencies();
      
      // 5. Verificar schemas Prisma
      this.checkPrismaSchemas();
      
      // 6. Executar verificação de tipos
      this.runTypeCheck();
      
      // 7. Gerar relatório
      this.generateReport();
      
    } catch (error) {
      this.log(`❌ Erro crítico durante a execução: ${error.message}`, 'error');
      this.log('\n🔧 DIAGNÓSTICO:');
      this.log('- Verifique se todos os arquivos existem');
      this.log('- Confirme se as dependências estão instaladas');
      this.log('- Valide se os caminhos dos arquivos estão corretos');
      process.exit(1);
    }
  }
}

// Execução principal
if (require.main === module) {
  const fixer = new DatabaseFixer();
  fixer.run().catch(error => {
    console.error('❌ Erro fatal:', error);
    console.error('\n🆘 SUPORTE:');
    console.error('- Verifique os logs acima para detalhes');
    console.error('- Execute o script novamente após corrigir os problemas');
    console.error('- Consulte a documentação do projeto se necessário');
    process.exit(1);
  });
}

module.exports = DatabaseFixer;