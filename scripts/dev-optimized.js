#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting optimized development server...\n");

// Configurações de otimização
const DEV_OPTIMIZATIONS = {
  // Variáveis de ambiente para otimização
  env: {
    ...process.env,
    // Desabilitar telemetria
    NEXT_TELEMETRY_DISABLED: "1",

    // Otimizações do Node.js
    NODE_OPTIONS: "--max-old-space-size=4096 --experimental-vm-modules",

    // Otimizações do Next.js
    NEXT_PRIVATE_SKIP_SIZE_LIMIT_CHECK: "1",

    // Desabilitar verificações desnecessárias em dev
    SKIP_ENV_VALIDATION: "1",

    // Usar SWC para compilação mais rápida
    NEXT_PRIVATE_STANDALONE: "1",
  },

  // Argumentos otimizados para o Next.js
  args: ["dev", "--port=3001"],
};

// Função para limpar cache antes de iniciar
function clearCache() {
  console.log("🧹 Clearing development cache...");

  const cachePaths = [
    ".next/cache",
    ".next/trace",
    "node_modules/.cache",
    ".swc",
  ];

  let cleared = 0;
  for (const cachePath of cachePaths) {
    try {
      if (fs.existsSync(cachePath)) {
        if (fs.statSync(cachePath).isDirectory()) {
          require("child_process").execSync(`rmdir /s /q "${cachePath}"`, {
            stdio: "ignore",
          });
        } else {
          fs.unlinkSync(cachePath);
        }
        cleared++;
        console.log(`   Cleared: ${cachePath}`);
      }
    } catch (error) {
      // Ignorar erros de limpeza
    }
  }

  if (cleared > 0) {
    console.log(`   Cleared ${cleared} cache directories\n`);
  } else {
    console.log("   No cache to clear\n");
  }
}

// Função para verificar e otimizar configurações
function checkOptimizations() {
  console.log("⚙️  Checking optimizations...");

  // Verificar se o next.config.js tem otimizações
  if (fs.existsSync("next.config.js")) {
    const config = fs.readFileSync("next.config.js", "utf8");

    const optimizations = {
      swcMinify: config.includes("swcMinify"),
      webpack: config.includes("webpack:"),
      cache: config.includes("cache"),
      experimental: config.includes("experimental"),
    };

    console.log("   Next.js optimizations:");
    Object.entries(optimizations).forEach(([key, enabled]) => {
      console.log(`   ${enabled ? "✅" : "❌"} ${key}`);
    });
  }

  // Verificar TypeScript config
  if (fs.existsSync("tsconfig.json")) {
    const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
    const hasIncremental = tsconfig.compilerOptions?.incremental;
    console.log(
      `   ${hasIncremental ? "✅" : "❌"} TypeScript incremental compilation`,
    );
  }

  console.log("");
}

// Função para monitorar performance do servidor
function monitorServerPerformance(child) {
  let startTime = Date.now();
  let serverReady = false;
  let compilationCount = 0;

  const logPerformance = (message, time) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ⚡ ${message}: ${time}ms`);
  };

  child.stdout.on("data", (data) => {
    const output = data.toString();

    // Detectar quando o servidor está pronto
    if (
      !serverReady &&
      (output.includes("Ready in") || output.includes("started server"))
    ) {
      const startupTime = Date.now() - startTime;
      logPerformance("Server startup", startupTime);
      serverReady = true;

      if (startupTime > 10000) {
        console.log(
          "⚠️  Server startup is slow (>10s). Consider optimizations.",
        );
      } else if (startupTime < 5000) {
        console.log("✅ Fast server startup!");
      }
    }

    // Detectar compilações
    if (output.includes("compiled") && serverReady) {
      compilationCount++;

      // Extrair tempo de compilação se disponível
      const timeMatch = output.match(/in (\d+(?:\.\d+)?)\s*ms/);
      if (timeMatch) {
        const compileTime = parseFloat(timeMatch[1]);
        logPerformance(`Compilation #${compilationCount}`, compileTime);

        if (compileTime > 3000) {
          console.log(
            "⚠️  Slow compilation detected. Check for large files or complex operations.",
          );
        }
      }
    }

    // Detectar erros de performance
    if (output.includes("warn") && output.includes("slow")) {
      console.log("⚠️  Performance warning detected in output");
    }

    // Passar output para o console
    process.stdout.write(output);
  });

  child.stderr.on("data", (data) => {
    const error = data.toString();

    // Detectar erros relacionados à performance
    if (error.includes("memory") || error.includes("heap")) {
      console.log("🚨 Memory issue detected!");
    }

    process.stderr.write(error);
  });
}

// Função para configurar hot reload otimizado
function setupHotReload() {
  // Criar arquivo de configuração para hot reload
  const hotReloadConfig = {
    watchOptions: {
      poll: false,
      aggregateTimeout: 200,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.next/**",
        "**/build-performance-report.json",
        "**/build-history.json",
      ],
    },
  };

  // Salvar configuração temporária
  fs.writeFileSync(
    ".next-dev-config.json",
    JSON.stringify(hotReloadConfig, null, 2),
  );
}

// Função principal para iniciar servidor otimizado
function startOptimizedServer() {
  // Preparar ambiente
  clearCache();
  checkOptimizations();
  setupHotReload();

  console.log("🚀 Starting Next.js development server with optimizations...\n");

  // Iniciar servidor
  const child = spawn("npx", ["next", ...DEV_OPTIMIZATIONS.args], {
    env: DEV_OPTIMIZATIONS.env,
    stdio: "pipe",
    shell: true,
  });

  // Monitorar performance
  monitorServerPerformance(child);

  // Lidar com encerramento
  child.on("close", (code) => {
    console.log(`\nDevelopment server stopped with code ${code}`);

    // Limpar arquivos temporários
    try {
      if (fs.existsSync(".next-dev-config.json")) {
        fs.unlinkSync(".next-dev-config.json");
      }
    } catch (error) {
      // Ignorar erros de limpeza
    }
  });

  child.on("error", (error) => {
    console.error("❌ Failed to start development server:", error.message);
    process.exit(1);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping development server...");
    child.kill("SIGINT");

    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });

  process.on("SIGTERM", () => {
    child.kill("SIGTERM");
    process.exit(0);
  });
}

// Função para mostrar dicas de otimização
function showOptimizationTips() {
  console.log("💡 Development Performance Tips:");
  console.log('   1. Use "npm run dev:fast" for fastest startup');
  console.log("   2. Close unused browser tabs to save memory");
  console.log("   3. Use TypeScript project references for large codebases");
  console.log("   4. Consider using SWC instead of Babel");
  console.log("   5. Enable incremental TypeScript compilation");
  console.log("   6. Use dynamic imports for heavy components");
  console.log("");
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node scripts/dev-optimized.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  --clear-cache    Clear all caches before starting");
  console.log("  --tips          Show optimization tips");
  console.log("  --port <port>   Specify port (default: 3000)");
  console.log("  --help          Show this help");
  process.exit(0);
}

if (args.includes("--tips")) {
  showOptimizationTips();
}

if (args.includes("--clear-cache")) {
  clearCache();
}

// Configurar porta se especificada
const portIndex = args.indexOf("--port");
if (portIndex !== -1 && args[portIndex + 1]) {
  const port = args[portIndex + 1];
  DEV_OPTIMIZATIONS.args = DEV_OPTIMIZATIONS.args.map((arg) =>
    arg.startsWith("--port=") ? `--port=${port}` : arg,
  );
}

// Iniciar servidor
startOptimizedServer();
