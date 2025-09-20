#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Colors for console output
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

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60) + "\n");
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Executando: ${command} ${args.join(" ")}`, "yellow");

    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function checkDependencies() {
  logSection("🔍 Verificando Dependências");

  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("package.json não encontrado");
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const devDeps = packageJson.devDependencies || {};

  const requiredDeps = {
    jest: "Testes unitários",
    "@playwright/test": "Testes E2E",
  };

  const missing = [];
  for (const [dep, description] of Object.entries(requiredDeps)) {
    if (!devDeps[dep]) {
      missing.push(`${dep} (${description})`);
    }
  }

  if (missing.length > 0) {
    log("❌ Dependências faltando:", "red");
    missing.forEach((dep) => log(`  - ${dep}`, "red"));
    throw new Error("Instale as dependências faltando primeiro");
  }

  log("✅ Todas as dependências estão instaladas", "green");
}

async function runUnitTests() {
  logSection("🧪 Executando Testes Unitários (Jest)");

  try {
    await runCommand("npm", [
      "run",
      "test",
      "--",
      "--coverage",
      "--watchAll=false",
    ]);
    log("✅ Testes unitários concluídos com sucesso", "green");
    return true;
  } catch (error) {
    log("❌ Testes unitários falharam", "red");
    log(error.message, "red");
    return false;
  }
}

async function runIntegrationTests() {
  logSection("🔗 Executando Testes de Integração");

  try {
    await runCommand("npm", [
      "run",
      "test",
      "--",
      "--testPathPattern=integration",
      "--watchAll=false",
    ]);
    log("✅ Testes de integração concluídos com sucesso", "green");
    return true;
  } catch (error) {
    log("❌ Testes de integração falharam", "red");
    log(error.message, "red");
    return false;
  }
}

async function runE2ETests() {
  logSection("🎭 Executando Testes E2E (Playwright)");

  try {
    // Check if Playwright is installed
    await runCommand("npx", ["playwright", "install", "--with-deps"]);

    // Run E2E tests
    await runCommand("npx", ["playwright", "test"]);
    log("✅ Testes E2E concluídos com sucesso", "green");
    return true;
  } catch (error) {
    log("❌ Testes E2E falharam", "red");
    log(error.message, "red");
    return false;
  }
}

async function generateReports() {
  logSection("📊 Gerando Relatórios");

  try {
    // Generate Jest coverage report
    if (fs.existsSync("coverage")) {
      log(
        "📈 Relatório de cobertura Jest disponível em: coverage/lcov-report/index.html",
        "blue",
      );
    }

    // Generate Playwright report
    if (fs.existsSync("playwright-report")) {
      log(
        "🎭 Relatório Playwright disponível em: playwright-report/index.html",
        "blue",
      );
    }

    log("✅ Relatórios gerados", "green");
  } catch (error) {
    log("⚠️  Erro ao gerar relatórios", "yellow");
    log(error.message, "yellow");
  }
}

async function main() {
  const startTime = Date.now();

  log("🚀 Iniciando execução completa de testes...", "bright");

  const results = {
    dependencies: false,
    unit: false,
    integration: false,
    e2e: false,
  };

  try {
    // Check dependencies
    await checkDependencies();
    results.dependencies = true;

    // Run unit tests
    results.unit = await runUnitTests();

    // Run integration tests
    results.integration = await runIntegrationTests();

    // Run E2E tests
    results.e2e = await runE2ETests();

    // Generate reports
    await generateReports();
  } catch (error) {
    log(`❌ Erro crítico: ${error.message}`, "red");
  }

  // Summary
  logSection("📋 Resumo dos Resultados");

  const testResults = [
    { name: "Dependências", status: results.dependencies },
    { name: "Testes Unitários", status: results.unit },
    { name: "Testes de Integração", status: results.integration },
    { name: "Testes E2E", status: results.e2e },
  ];

  testResults.forEach(({ name, status }) => {
    const icon = status ? "✅" : "❌";
    const color = status ? "green" : "red";
    log(`${icon} ${name}`, color);
  });

  const totalPassed = testResults.filter((r) => r.status).length;
  const totalTests = testResults.length;

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log("\n" + "=".repeat(60));

  if (totalPassed === totalTests) {
    log(`🎉 Todos os testes passaram! (${totalPassed}/${totalTests})`, "green");
    log(`⏱️  Tempo total: ${duration}s`, "blue");
    process.exit(0);
  } else {
    log(
      `❌ ${totalTests - totalPassed} teste(s) falharam (${totalPassed}/${totalTests})`,
      "red",
    );
    log(`⏱️  Tempo total: ${duration}s`, "blue");
    process.exit(1);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  log("\n🛑 Execução interrompida pelo usuário", "yellow");
  process.exit(1);
});

process.on("SIGTERM", () => {
  log("\n🛑 Execução terminada", "yellow");
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log(`💥 Erro não tratado: ${error.message}`, "red");
  process.exit(1);
});
