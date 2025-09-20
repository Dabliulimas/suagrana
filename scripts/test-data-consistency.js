/**
 * Script de teste para validação do sistema de consistência de dados
 * Executa verificações abrangentes e testa correções automáticas
 */

const { dataConsistencyFixer } = require("../lib/data-consistency-fixer");
const fs = require("fs");
const path = require("path");

// Configuração de cores para output no terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  separator: () =>
    console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}`),
};

// Dados de teste simulados
const mockData = {
  accounts: [
    { id: 1, name: "Conta Corrente", balance: 1500.0, type: "checking" },
    { id: 2, name: "Poupança", balance: 5000.0, type: "savings" },
    { id: 3, name: "Cartão de Crédito", balance: -800.0, type: "credit" },
  ],
  transactions: [
    {
      id: 1,
      accountId: 1,
      amount: -50.0,
      description: "Supermercado",
      date: "2024-01-15",
    },
    {
      id: 2,
      accountId: 1,
      amount: 2000.0,
      description: "Salário",
      date: "2024-01-01",
    },
    {
      id: 3,
      accountId: 2,
      amount: 100.0,
      description: "Transferência",
      date: "2024-01-10",
    },
    {
      id: 4,
      accountId: 999,
      amount: -25.0,
      description: "Transação órfã",
      date: "2024-01-12",
    }, // Referência órfã
  ],
  goals: [
    {
      id: 1,
      name: "Viagem Europa",
      targetAmount: 10000,
      currentAmount: 2500,
      deadline: "2024-12-31",
    },
    {
      id: 2,
      name: "Emergência",
      targetAmount: 5000,
      currentAmount: 5000,
      deadline: "2024-06-30",
    },
    {
      id: 3,
      name: "Meta inválida",
      targetAmount: -1000,
      currentAmount: 500,
      deadline: "2023-01-01",
    }, // Meta inválida
  ],
  investments: [
    {
      id: 1,
      name: "Tesouro Direto",
      amount: 15000,
      type: "government_bond",
      yield: 0.12,
    },
    { id: 2, name: "Ações PETR4", amount: 8000, type: "stock", yield: 0.08 },
    {
      id: 3,
      name: "Investimento inválido",
      amount: -5000,
      type: "invalid",
      yield: -0.5,
    }, // Investimento inválido
  ],
  trips: [
    {
      id: 1,
      name: "Férias Bahia",
      startDate: "2024-07-01",
      endDate: "2024-07-15",
      budget: 3000,
    },
    {
      id: 2,
      name: "Viagem inválida",
      startDate: "2024-12-31",
      endDate: "2024-01-01",
      budget: -1000,
    }, // Viagem inválida
  ],
};

// Função para simular dados no localStorage (para ambiente de teste)
function setupMockData() {
  log.info("Configurando dados de teste...");

  // Simular localStorage para ambiente Node.js
  global.localStorage = {
    data: {},
    getItem: function (key) {
      return this.data[key] || null;
    },
    setItem: function (key, value) {
      this.data[key] = value;
    },
    removeItem: function (key) {
      delete this.data[key];
    },
    clear: function () {
      this.data = {};
    },
  };

  // Inserir dados de teste
  localStorage.setItem("sua-grana-accounts", JSON.stringify(mockData.accounts));
  localStorage.setItem(
    "sua-grana-transactions",
    JSON.stringify(mockData.transactions),
  );
  localStorage.setItem("sua-grana-goals", JSON.stringify(mockData.goals));
  localStorage.setItem(
    "sua-grana-investments",
    JSON.stringify(mockData.investments),
  );
  localStorage.setItem("sua-grana-trips", JSON.stringify(mockData.trips));

  log.success("Dados de teste configurados com sucesso");
}

// Função para executar teste de consistência
async function runConsistencyTest() {
  log.header("TESTE DE VERIFICAÇÃO DE CONSISTÊNCIA");

  try {
    const report = await dataConsistencyFixer.checkConsistency();

    log.info(`Total de problemas encontrados: ${report.summary.totalIssues}`);
    log.info(`Problemas críticos: ${report.summary.criticalIssues}`);
    log.info(`Problemas de alta prioridade: ${report.summary.highIssues}`);
    log.info(`Problemas auto-corrigíveis: ${report.summary.autoFixableIssues}`);
    log.info(`Saúde do sistema: ${report.systemHealth}`);

    if (report.issues.length > 0) {
      log.warning("Problemas encontrados:");
      report.issues.forEach((issue, index) => {
        console.log(
          `  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`,
        );
        console.log(`     Entidade: ${issue.affectedEntity}`);
        console.log(`     Solução: ${issue.suggestedFix}`);
        console.log(
          `     Auto-corrigível: ${issue.autoFixable ? "Sim" : "Não"}`,
        );
        console.log();
      });
    } else {
      log.success("Nenhum problema de consistência encontrado!");
    }

    if (report.recommendations.length > 0) {
      log.info("Recomendações:");
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    return report;
  } catch (error) {
    log.error(`Erro durante verificação de consistência: ${error.message}`);
    throw error;
  }
}

// Função para testar correção automática
async function runAutoFixTest() {
  log.header("TESTE DE CORREÇÃO AUTOMÁTICA");

  try {
    const results = await dataConsistencyFixer.autoFixIssues();

    log.info(`Problemas corrigidos: ${results.fixed}`);
    log.info(`Erros durante correção: ${results.errors.length}`);

    if (results.errors.length > 0) {
      log.warning("Erros encontrados durante correção:");
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      log.success("Correção automática executada sem erros!");
    }

    return results;
  } catch (error) {
    log.error(`Erro durante correção automática: ${error.message}`);
    throw error;
  }
}

// Função para testar performance
async function runPerformanceTest() {
  log.header("TESTE DE PERFORMANCE");

  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await dataConsistencyFixer.checkConsistency();
    const end = Date.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  log.info(`Tempo médio de verificação: ${avgTime.toFixed(2)}ms`);
  log.info(`Tempo mínimo: ${minTime}ms`);
  log.info(`Tempo máximo: ${maxTime}ms`);

  if (avgTime < 1000) {
    log.success("Performance adequada (< 1s)");
  } else if (avgTime < 3000) {
    log.warning("Performance aceitável (1-3s)");
  } else {
    log.error("Performance inadequada (> 3s)");
  }

  return { avgTime, minTime, maxTime };
}

// Função para gerar relatório de teste
function generateTestReport(
  consistencyReport,
  autoFixResults,
  performanceResults,
) {
  const report = {
    timestamp: new Date().toISOString(),
    testSuite: "Data Consistency System",
    version: "1.0.0",
    results: {
      consistency: {
        totalIssues: consistencyReport.summary.totalIssues,
        criticalIssues: consistencyReport.summary.criticalIssues,
        autoFixableIssues: consistencyReport.summary.autoFixableIssues,
        systemHealth: consistencyReport.systemHealth,
        status:
          consistencyReport.summary.criticalIssues === 0 ? "PASS" : "FAIL",
      },
      autoFix: {
        problemsFixed: autoFixResults.fixed,
        errors: autoFixResults.errors.length,
        status: autoFixResults.errors.length === 0 ? "PASS" : "FAIL",
      },
      performance: {
        averageTime: performanceResults.avgTime,
        minTime: performanceResults.minTime,
        maxTime: performanceResults.maxTime,
        status: performanceResults.avgTime < 1000 ? "PASS" : "FAIL",
      },
    },
    summary: {
      totalTests: 3,
      passed: 0,
      failed: 0,
      overallStatus: "UNKNOWN",
    },
  };

  // Calcular resumo
  Object.values(report.results).forEach((result) => {
    if (result.status === "PASS") {
      report.summary.passed++;
    } else {
      report.summary.failed++;
    }
  });

  report.summary.overallStatus = report.summary.failed === 0 ? "PASS" : "FAIL";

  return report;
}

// Função principal
async function main() {
  log.separator();
  log.header("SUITE DE TESTES - SISTEMA DE CONSISTÊNCIA DE DADOS");
  log.separator();

  try {
    // 1. Configurar dados de teste
    setupMockData();

    // 2. Executar teste de consistência
    const consistencyReport = await runConsistencyTest();

    // 3. Executar teste de correção automática
    const autoFixResults = await runAutoFixTest();

    // 4. Executar teste de performance
    const performanceResults = await runPerformanceTest();

    // 5. Gerar relatório final
    log.header("RELATÓRIO FINAL");
    const testReport = generateTestReport(
      consistencyReport,
      autoFixResults,
      performanceResults,
    );

    log.info(`Status geral: ${testReport.summary.overallStatus}`);
    log.info(
      `Testes aprovados: ${testReport.summary.passed}/${testReport.summary.totalTests}`,
    );
    log.info(
      `Testes reprovados: ${testReport.summary.failed}/${testReport.summary.totalTests}`,
    );

    // 6. Salvar relatório
    const reportPath = path.join(
      __dirname,
      "..",
      "test-reports",
      `consistency-test-${Date.now()}.json`,
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    log.success(`Relatório salvo em: ${reportPath}`);

    if (testReport.summary.overallStatus === "PASS") {
      log.success(
        "🎉 Todos os testes passaram! Sistema de consistência funcionando corretamente.",
      );
      process.exit(0);
    } else {
      log.error(
        "❌ Alguns testes falharam. Verifique o relatório para mais detalhes.",
      );
      process.exit(1);
    }
  } catch (error) {
    log.error(`Erro crítico durante execução dos testes: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  runConsistencyTest,
  runAutoFixTest,
  runPerformanceTest,
  generateTestReport,
  setupMockData,
};
