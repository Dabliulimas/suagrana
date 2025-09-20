/**
 * Script para executar testes automatizados
 * Executa todos os testes, gera relatórios de cobertura e valida qualidade
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configurações
const CONFIG = {
  coverageThreshold: {
    global: 80,
    lib: 85,
    components: 75,
  },
  testTimeout: 30000,
  maxRetries: 3,
};

// Cores para output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

function log(message, color = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Função para executar comandos com retry
function executeCommand(command, options = {}) {
  const maxRetries = options.retries || CONFIG.maxRetries;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      logInfo(`Executando: ${command} (tentativa ${attempt}/${maxRetries})`);

      const result = execSync(command, {
        stdio: "pipe",
        encoding: "utf8",
        timeout: CONFIG.testTimeout,
        ...options,
      });

      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      logWarning(`Tentativa ${attempt} falhou, tentando novamente...`);
      attempt++;

      // Aguardar antes de tentar novamente
      const delay = Math.pow(2, attempt - 1) * 1000; // Backoff exponencial
      setTimeout(() => {}, delay);
    }
  }
}

// Função para verificar dependências
function checkDependencies() {
  logSection("Verificando Dependências");

  const requiredPackages = [
    "jest",
    "@testing-library/react",
    "@testing-library/jest-dom",
    "babel-jest",
  ];

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const missingPackages = requiredPackages.filter((pkg) => !allDeps[pkg]);

  if (missingPackages.length > 0) {
    logError(`Pacotes ausentes: ${missingPackages.join(", ")}`);
    logInfo("Instalando dependências ausentes...");

    try {
      executeCommand("npm install --save-dev " + missingPackages.join(" "));
      logSuccess("Dependências instaladas com sucesso");
    } catch (error) {
      logError("Falha ao instalar dependências");
      throw error;
    }
  } else {
    logSuccess("Todas as dependências estão instaladas");
  }
}

// Função para limpar cache e arquivos temporários
function cleanUp() {
  logSection("Limpeza de Cache e Arquivos Temporários");

  const pathsToClean = [
    ".next/cache",
    "coverage",
    ".jest-cache",
    "node_modules/.cache",
  ];

  pathsToClean.forEach((pathToClean) => {
    if (fs.existsSync(pathToClean)) {
      try {
        fs.rmSync(pathToClean, { recursive: true, force: true });
        logSuccess(`Removido: ${pathToClean}`);
      } catch (error) {
        logWarning(`Não foi possível remover: ${pathToClean}`);
      }
    }
  });
}

// Função para executar lint
function runLint() {
  logSection("Executando Lint");

  try {
    const lintResult = executeCommand("npm run lint", { stdio: "pipe" });
    logSuccess("Lint passou sem problemas");
    return true;
  } catch (error) {
    logError("Lint encontrou problemas:");
    console.log(error.stdout);
    return false;
  }
}

// Função para executar testes unitários
function runUnitTests() {
  logSection("Executando Testes Unitários");

  try {
    const testResult = executeCommand("npx jest --coverage --verbose", {
      stdio: "pipe",
    });

    logSuccess("Testes unitários concluídos");
    console.log(testResult);

    return parseTestResults(testResult);
  } catch (error) {
    logError("Testes unitários falharam:");
    console.log(error.stdout);
    console.log(error.stderr);
    throw error;
  }
}

// Função para analisar resultados dos testes
function parseTestResults(output) {
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  };

  // Extrair informações dos testes
  const testMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (testMatch) {
    results.passedTests = parseInt(testMatch[1]);
    results.totalTests = parseInt(testMatch[2]);
    results.failedTests = results.totalTests - results.passedTests;
  }

  // Extrair informações de cobertura
  const coverageMatch = output.match(
    /All files\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)\s+\|\s+(\d+\.?\d*)/,
  );
  if (coverageMatch) {
    results.coverage.statements = parseFloat(coverageMatch[1]);
    results.coverage.branches = parseFloat(coverageMatch[2]);
    results.coverage.functions = parseFloat(coverageMatch[3]);
    results.coverage.lines = parseFloat(coverageMatch[4]);
  }

  return results;
}

// Função para validar cobertura
function validateCoverage(results) {
  logSection("Validando Cobertura de Código");

  const { coverage } = results;
  const thresholds = CONFIG.coverageThreshold.global;

  const metrics = [
    { name: "Statements", value: coverage.statements, threshold: thresholds },
    { name: "Branches", value: coverage.branches, threshold: thresholds },
    { name: "Functions", value: coverage.functions, threshold: thresholds },
    { name: "Lines", value: coverage.lines, threshold: thresholds },
  ];

  let allPassed = true;

  metrics.forEach((metric) => {
    if (metric.value >= metric.threshold) {
      logSuccess(`${metric.name}: ${metric.value}% (>= ${metric.threshold}%)`);
    } else {
      logError(`${metric.name}: ${metric.value}% (< ${metric.threshold}%)`);
      allPassed = false;
    }
  });

  return allPassed;
}

// Função para gerar relatório
function generateReport(results, coveragePassed) {
  logSection("Gerando Relatório Final");

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.totalTests,
      passedTests: results.passedTests,
      failedTests: results.failedTests,
      successRate:
        results.totalTests > 0
          ? ((results.passedTests / results.totalTests) * 100).toFixed(2)
          : 0,
    },
    coverage: results.coverage,
    coveragePassed,
    quality: {
      score: calculateQualityScore(results, coveragePassed),
      status: results.failedTests === 0 && coveragePassed ? "PASSED" : "FAILED",
    },
    recommendations: generateRecommendations(results, coveragePassed),
  };

  // Salvar relatório
  const reportPath = path.join("coverage", "test-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Exibir resumo
  console.log("\n" + "=".repeat(60));
  log("RELATÓRIO FINAL DE TESTES", "magenta");
  console.log("=".repeat(60));

  log(`📊 Total de Testes: ${report.summary.totalTests}`, "blue");
  log(`✅ Testes Aprovados: ${report.summary.passedTests}`, "green");
  log(`❌ Testes Falharam: ${report.summary.failedTests}`, "red");
  log(`📈 Taxa de Sucesso: ${report.summary.successRate}%`, "cyan");

  console.log("\n📋 Cobertura de Código:");
  log(`  Statements: ${report.coverage.statements}%`, "blue");
  log(`  Branches: ${report.coverage.branches}%`, "blue");
  log(`  Functions: ${report.coverage.functions}%`, "blue");
  log(`  Lines: ${report.coverage.lines}%`, "blue");

  log(`\n🎯 Score de Qualidade: ${report.quality.score}/100`, "magenta");
  log(
    `📋 Status: ${report.quality.status}`,
    report.quality.status === "PASSED" ? "green" : "red",
  );

  if (report.recommendations.length > 0) {
    console.log("\n💡 Recomendações:");
    report.recommendations.forEach((rec) => {
      log(`  • ${rec}`, "yellow");
    });
  }

  logInfo(`Relatório salvo em: ${reportPath}`);

  return report;
}

// Função para calcular score de qualidade
function calculateQualityScore(results, coveragePassed) {
  let score = 0;

  // Score baseado em testes (40 pontos)
  if (results.totalTests > 0) {
    score += (results.passedTests / results.totalTests) * 40;
  }

  // Score baseado em cobertura (60 pontos)
  if (coveragePassed) {
    const avgCoverage =
      (results.coverage.statements +
        results.coverage.branches +
        results.coverage.functions +
        results.coverage.lines) /
      4;

    score += (avgCoverage / 100) * 60;
  }

  return Math.round(score);
}

// Função para gerar recomendações
function generateRecommendations(results, coveragePassed) {
  const recommendations = [];

  if (results.failedTests > 0) {
    recommendations.push(
      `Corrigir ${results.failedTests} teste(s) que falharam`,
    );
  }

  if (!coveragePassed) {
    recommendations.push(
      "Aumentar cobertura de código para atingir os limites mínimos",
    );
  }

  if (results.coverage.branches < 80) {
    recommendations.push(
      "Adicionar testes para cobrir mais branches do código",
    );
  }

  if (results.coverage.functions < 80) {
    recommendations.push("Adicionar testes para cobrir mais funções");
  }

  if (results.totalTests < 50) {
    recommendations.push(
      "Considerar adicionar mais testes para melhor cobertura",
    );
  }

  return recommendations;
}

// Função principal
async function main() {
  try {
    console.clear();
    logSection("🧪 EXECUTANDO SUITE DE TESTES AUTOMATIZADOS");

    const startTime = Date.now();

    // 1. Verificar dependências
    checkDependencies();

    // 2. Limpar cache
    cleanUp();

    // 3. Executar lint (opcional)
    const lintPassed = runLint();
    if (!lintPassed) {
      logWarning("Lint falhou, mas continuando com os testes...");
    }

    // 4. Executar testes
    const testResults = runUnitTests();

    // 5. Validar cobertura
    const coveragePassed = validateCoverage(testResults);

    // 6. Gerar relatório
    const report = generateReport(testResults, coveragePassed);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(60));
    log(`⏱️  Tempo total: ${duration}s`, "cyan");

    if (report.quality.status === "PASSED") {
      logSuccess("🎉 TODOS OS TESTES PASSARAM!");
      process.exit(0);
    } else {
      logError("💥 ALGUNS TESTES FALHARAM!");
      process.exit(1);
    }
  } catch (error) {
    logError("Erro durante execução dos testes:");
    console.error(error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  runUnitTests,
  validateCoverage,
  generateReport,
};
