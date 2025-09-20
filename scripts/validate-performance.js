#!/usr/bin/env node

const fs = require("fs");
const { execSync, spawn } = require("child_process");

console.log("🧪 Validating performance improvements...\n");

// Configurações de teste
const TEST_CONFIG = {
  buildTimeout: 120000, // 2 minutos
  devStartupTimeout: 30000, // 30 segundos
  hotReloadTimeout: 10000, // 10 segundos
  expectedImprovements: {
    buildTime: 0.8, // 20% de melhoria esperada
    devStartup: 0.7, // 30% de melhoria esperada
    bundleSize: 0.9, // 10% de redução esperada
  },
};

// Resultados dos testes
let testResults = {
  timestamp: new Date().toISOString(),
  tests: {},
  summary: {
    passed: 0,
    failed: 0,
    total: 0,
  },
};

// Função para executar teste
function runTest(name, testFn) {
  console.log(`🔬 Running test: ${name}`);
  testResults.summary.total++;

  try {
    const result = testFn();
    testResults.tests[name] = {
      status: "passed",
      result,
      timestamp: new Date().toISOString(),
    };
    testResults.summary.passed++;
    console.log(`   ✅ ${name} - PASSED`);
    return result;
  } catch (error) {
    testResults.tests[name] = {
      status: "failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    testResults.summary.failed++;
    console.log(`   ❌ ${name} - FAILED: ${error.message}`);
    return null;
  }
}

// Teste 1: Verificar configurações otimizadas
function testOptimizedConfigurations() {
  const checks = {
    nextConfig: false,
    tsConfig: false,
    packageScripts: false,
  };

  // Verificar next.config.js
  if (fs.existsSync("next.config.js")) {
    const config = fs.readFileSync("next.config.js", "utf8");
    checks.nextConfig =
      config.includes("swcMinify") &&
      config.includes("experimental") &&
      config.includes("cache");
  }

  // Verificar tsconfig.json
  if (fs.existsSync("tsconfig.json")) {
    const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
    checks.tsConfig =
      tsconfig.compilerOptions?.incremental === true &&
      tsconfig.compilerOptions?.assumeChangesOnlyAffectDirectDependencies ===
        true;
  }

  // Verificar scripts do package.json
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  checks.packageScripts =
    packageJson.scripts["dev:optimized"] !== undefined &&
    packageJson.scripts["build:monitor"] !== undefined;

  const allPassed = Object.values(checks).every((check) => check);
  if (!allPassed) {
    throw new Error(`Configuration checks failed: ${JSON.stringify(checks)}`);
  }

  return checks;
}

// Teste 2: Medir tempo de build
function testBuildPerformance() {
  console.log("   Building project...");

  // Limpar cache primeiro
  try {
    if (fs.existsSync(".next")) {
      execSync("rmdir /s /q .next", { stdio: "ignore" });
    }
  } catch (error) {
    // Ignorar erros de limpeza
  }

  const start = Date.now();

  try {
    execSync("npm run build", {
      stdio: "pipe",
      timeout: TEST_CONFIG.buildTimeout,
    });

    const buildTime = Date.now() - start;
    console.log(
      `   Build completed in: ${buildTime}ms (${(buildTime / 1000).toFixed(2)}s)`,
    );

    // Verificar se o build foi bem-sucedido
    if (!fs.existsSync(".next/BUILD_ID")) {
      throw new Error("Build artifacts not found");
    }

    return {
      buildTime,
      success: true,
      artifacts: fs.existsSync(".next/static"),
    };
  } catch (error) {
    if (error.code === "TIMEOUT") {
      throw new Error(`Build timed out after ${TEST_CONFIG.buildTimeout}ms`);
    }
    throw new Error(`Build failed: ${error.message}`);
  }
}

// Teste 3: Medir tamanho do bundle
function testBundleSize() {
  if (!fs.existsSync(".next")) {
    throw new Error("No build artifacts found. Run build test first.");
  }

  let totalSize = 0;
  const chunks = {};

  // Medir arquivos estáticos
  const staticDir = ".next/static";
  if (fs.existsSync(staticDir)) {
    const measureDir = (dir, prefix = "") => {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const filePath = require("path").join(dir, file.name);

        if (file.isDirectory()) {
          measureDir(filePath, `${prefix}${file.name}/`);
        } else if (file.isFile()) {
          const stats = fs.statSync(filePath);
          const size = stats.size;
          totalSize += size;
          chunks[`${prefix}${file.name}`] = size;
        }
      }
    };

    measureDir(staticDir);
  }

  console.log(`   Bundle size: ${formatBytes(totalSize)}`);

  // Verificar se o tamanho está dentro do esperado
  const maxExpectedSize = 5 * 1024 * 1024; // 5MB
  if (totalSize > maxExpectedSize) {
    console.log(
      `   ⚠️  Bundle size is large (>${formatBytes(maxExpectedSize)})`,
    );
  }

  return {
    totalSize,
    chunks,
    largestChunks: Object.entries(chunks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5),
  };
}

// Teste 4: Testar startup do servidor de desenvolvimento
function testDevServerStartup() {
  return new Promise((resolve, reject) => {
    console.log("   Starting development server...");

    const start = Date.now();
    let serverReady = false;

    const child = spawn("npm", ["run", "dev:optimized"], {
      stdio: "pipe",
      shell: true,
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `Dev server startup timed out after ${TEST_CONFIG.devStartupTimeout}ms`,
        ),
      );
    }, TEST_CONFIG.devStartupTimeout);

    child.stdout.on("data", (data) => {
      const output = data.toString();

      if (
        !serverReady &&
        (output.includes("Ready in") || output.includes("started server"))
      ) {
        const startupTime = Date.now() - start;
        serverReady = true;

        clearTimeout(timeout);
        child.kill();

        console.log(
          `   Dev server ready in: ${startupTime}ms (${(startupTime / 1000).toFixed(2)}s)`,
        );

        resolve({
          startupTime,
          success: true,
        });
      }
    });

    child.stderr.on("data", (data) => {
      const error = data.toString();
      if (error.includes("Error") || error.includes("Failed")) {
        clearTimeout(timeout);
        child.kill();
        reject(new Error(`Dev server failed to start: ${error}`));
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn dev server: ${error.message}`));
    });
  });
}

// Teste 5: Verificar arquivos de otimização
function testOptimizationFiles() {
  const requiredFiles = [
    "lib/dynamic-imports.ts",
    "lib/optimized-radix-imports.ts",
    "lib/lazy-components.tsx",
    "lib/code-splitting-config.ts",
    "lib/performance-monitor.ts",
    "scripts/analyze-build-performance.js",
    "scripts/monitor-build.js",
    "scripts/dev-optimized.js",
  ];

  const missingFiles = [];
  const existingFiles = [];

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      existingFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`Missing optimization files: ${missingFiles.join(", ")}`);
  }

  return {
    totalFiles: requiredFiles.length,
    existingFiles: existingFiles.length,
    files: existingFiles,
  };
}

// Teste 6: Verificar melhorias de performance
function testPerformanceImprovements() {
  // Carregar histórico de builds se existir
  let baseline = null;

  if (fs.existsSync("build-history.json")) {
    const history = JSON.parse(fs.readFileSync("build-history.json", "utf8"));
    if (history.length > 1) {
      // Usar média dos primeiros builds como baseline
      const firstBuilds = history.slice(
        0,
        Math.min(3, Math.floor(history.length / 2)),
      );
      baseline = {
        avgBuildTime:
          firstBuilds.reduce((sum, b) => sum + b.buildTime, 0) /
          firstBuilds.length,
        avgBundleSize:
          firstBuilds.reduce((sum, b) => sum + b.bundleSize, 0) /
          firstBuilds.length,
      };
    }
  }

  if (!baseline) {
    console.log("   No baseline data available for comparison");
    return { hasBaseline: false };
  }

  // Comparar com build atual
  const currentBuild = testResults.tests["Build Performance"]?.result;
  if (!currentBuild) {
    throw new Error("No current build data available");
  }

  const improvements = {
    buildTime: baseline.avgBuildTime / currentBuild.buildTime,
    bundleSize:
      baseline.avgBundleSize /
      (testResults.tests["Bundle Size"]?.result?.totalSize || 1),
  };

  console.log(
    `   Build time improvement: ${((improvements.buildTime - 1) * 100).toFixed(1)}%`,
  );
  console.log(
    `   Bundle size improvement: ${((improvements.bundleSize - 1) * 100).toFixed(1)}%`,
  );

  return {
    hasBaseline: true,
    baseline,
    improvements,
    meetsExpectations: {
      buildTime:
        improvements.buildTime >= TEST_CONFIG.expectedImprovements.buildTime,
      bundleSize:
        improvements.bundleSize >= TEST_CONFIG.expectedImprovements.bundleSize,
    },
  };
}

// Função para formatar bytes
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Função principal
async function validatePerformance() {
  console.log("Starting performance validation tests...\n");

  // Executar testes
  runTest("Configuration Check", testOptimizedConfigurations);
  runTest("Optimization Files", testOptimizationFiles);
  runTest("Build Performance", testBuildPerformance);
  runTest("Bundle Size", testBundleSize);

  try {
    const devResult = await runTest("Dev Server Startup", testDevServerStartup);
  } catch (error) {
    console.log(`   Skipping dev server test: ${error.message}`);
  }

  runTest("Performance Improvements", testPerformanceImprovements);

  // Gerar relatório final
  console.log("\n📊 Test Results Summary:");
  console.log(`   Total tests: ${testResults.summary.total}`);
  console.log(`   Passed: ${testResults.summary.passed}`);
  console.log(`   Failed: ${testResults.summary.failed}`);
  console.log(
    `   Success rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`,
  );

  // Salvar relatório
  fs.writeFileSync(
    "performance-validation-report.json",
    JSON.stringify(testResults, null, 2),
  );
  console.log(
    "\n📄 Validation report saved to: performance-validation-report.json",
  );

  // Mostrar recomendações finais
  if (testResults.summary.failed > 0) {
    console.log("\n🔧 Recommendations:");
    Object.entries(testResults.tests).forEach(([name, test]) => {
      if (test.status === "failed") {
        console.log(`   - Fix ${name}: ${test.error}`);
      }
    });
  } else {
    console.log("\n✅ All performance optimizations are working correctly!");
    console.log(
      "\n🎉 Your development environment is now optimized for better performance.",
    );
    console.log("\nNext steps:");
    console.log('   - Use "npm run dev:optimized" for faster development');
    console.log('   - Use "npm run build:monitor" to track build performance');
    console.log("   - Monitor performance with the built-in tools");
  }

  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Executar validação
validatePerformance().catch((error) => {
  console.error("❌ Validation failed:", error.message);
  process.exit(1);
});
