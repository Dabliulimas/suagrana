#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

console.log("📊 Starting build performance monitoring...\n");

// Configurações
const MONITOR_CONFIG = {
  maxBuilds: 10,
  alertThresholds: {
    buildTime: 15000, // 15 segundos
    bundleSize: 2 * 1024 * 1024, // 2MB
    hotReload: 3000, // 3 segundos
  },
};

// Estado do monitor
let buildHistory = [];
let currentBuild = null;

// Carregar histórico existente
function loadHistory() {
  try {
    if (fs.existsSync("build-history.json")) {
      buildHistory = JSON.parse(fs.readFileSync("build-history.json", "utf8"));
      console.log(`📚 Loaded ${buildHistory.length} previous builds`);
    }
  } catch (error) {
    console.log("⚠️  Could not load build history");
    buildHistory = [];
  }
}

// Salvar histórico
function saveHistory() {
  try {
    // Manter apenas os últimos builds
    if (buildHistory.length > MONITOR_CONFIG.maxBuilds) {
      buildHistory = buildHistory.slice(-MONITOR_CONFIG.maxBuilds);
    }

    fs.writeFileSync(
      "build-history.json",
      JSON.stringify(buildHistory, null, 2),
    );
  } catch (error) {
    console.log("⚠️  Could not save build history");
  }
}

// Medir tamanho do bundle
function measureBundleSize() {
  try {
    const nextDir = ".next";
    if (!fs.existsSync(nextDir)) {
      return { total: 0, chunks: {} };
    }

    let totalSize = 0;
    const chunks = {};

    // Medir arquivos estáticos
    const staticDir = path.join(nextDir, "static");
    if (fs.existsSync(staticDir)) {
      const measureDir = (dir, prefix = "") => {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
          const filePath = path.join(dir, file.name);

          if (file.isDirectory()) {
            measureDir(filePath, `${prefix}${file.name}/`);
          } else if (file.isFile()) {
            const stats = fs.statSync(filePath);
            const size = stats.size;
            totalSize += size;

            const chunkName = `${prefix}${file.name}`;
            chunks[chunkName] = size;
          }
        }
      };

      measureDir(staticDir);
    }

    return { total: totalSize, chunks };
  } catch (error) {
    console.log("⚠️  Could not measure bundle size");
    return { total: 0, chunks: {} };
  }
}

// Iniciar monitoramento de build
function startBuild() {
  currentBuild = {
    startTime: Date.now(),
    timestamp: new Date().toISOString(),
    type: "manual",
  };

  console.log("🏗️  Build started...");
}

// Finalizar monitoramento de build
function endBuild(success = true) {
  if (!currentBuild) return;

  const endTime = Date.now();
  const buildTime = endTime - currentBuild.startTime;
  const bundleInfo = measureBundleSize();

  const buildResult = {
    ...currentBuild,
    endTime,
    buildTime,
    bundleSize: bundleInfo.total,
    chunks: bundleInfo.chunks,
    success,
    memoryUsage: process.memoryUsage().heapUsed,
  };

  buildHistory.push(buildResult);
  saveHistory();

  // Log resultados
  console.log("\n📊 Build completed:");
  console.log(
    `   Duration: ${buildTime}ms (${(buildTime / 1000).toFixed(2)}s)`,
  );
  console.log(`   Bundle size: ${formatBytes(bundleInfo.total)}`);
  console.log(`   Memory used: ${formatBytes(process.memoryUsage().heapUsed)}`);

  // Verificar alertas
  checkAlerts(buildResult);

  // Mostrar estatísticas
  showStatistics();

  currentBuild = null;
  return buildResult;
}

// Verificar alertas de performance
function checkAlerts(build) {
  const alerts = [];

  if (build.buildTime > MONITOR_CONFIG.alertThresholds.buildTime) {
    alerts.push(`Build time is slow: ${(build.buildTime / 1000).toFixed(2)}s`);
  }

  if (build.bundleSize > MONITOR_CONFIG.alertThresholds.bundleSize) {
    alerts.push(`Bundle size is large: ${formatBytes(build.bundleSize)}`);
  }

  if (alerts.length > 0) {
    console.log("\n🚨 Performance Alerts:");
    alerts.forEach((alert) => console.log(`   ⚠️  ${alert}`));
  } else {
    console.log("\n✅ No performance issues detected");
  }
}

// Mostrar estatísticas
function showStatistics() {
  if (buildHistory.length < 2) return;

  const recentBuilds = buildHistory.slice(-5);
  const buildTimes = recentBuilds.map((b) => b.buildTime);
  const bundleSizes = recentBuilds.map((b) => b.bundleSize);

  const avgBuildTime =
    buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length;
  const avgBundleSize =
    bundleSizes.reduce((a, b) => a + b, 0) / bundleSizes.length;

  console.log("\n📈 Recent Performance (last 5 builds):");
  console.log(`   Average build time: ${(avgBuildTime / 1000).toFixed(2)}s`);
  console.log(`   Average bundle size: ${formatBytes(avgBundleSize)}`);

  // Tendência
  if (buildHistory.length >= 3) {
    const lastThree = buildHistory.slice(-3);
    const trend = lastThree[2].buildTime - lastThree[0].buildTime;

    if (Math.abs(trend) > 1000) {
      const direction = trend > 0 ? "slower" : "faster";
      console.log(
        `   Trend: Builds are getting ${direction} (${Math.abs(trend)}ms difference)`,
      );
    }
  }
}

// Formatar bytes
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Executar build com monitoramento
function runMonitoredBuild(command = "npm run build") {
  return new Promise((resolve, reject) => {
    startBuild();

    const child = spawn("cmd", ["/c", command], {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      const success = code === 0;
      const result = endBuild(success);

      if (success) {
        resolve(result);
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });

    child.on("error", (error) => {
      endBuild(false);
      reject(error);
    });
  });
}

// Monitorar desenvolvimento
function monitorDev() {
  console.log("🔍 Monitoring development server...");
  console.log("Press Ctrl+C to stop monitoring\n");

  const child = spawn("cmd", ["/c", "npm run dev"], {
    stdio: "pipe",
    shell: true,
  });

  let devStartTime = Date.now();
  let serverReady = false;

  child.stdout.on("data", (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Detectar quando o servidor está pronto
    if (
      !serverReady &&
      (output.includes("Ready in") || output.includes("started server"))
    ) {
      const startupTime = Date.now() - devStartTime;
      console.log(
        `\n⚡ Development server ready in: ${startupTime}ms (${(startupTime / 1000).toFixed(2)}s)`,
      );
      serverReady = true;

      if (startupTime > 10000) {
        console.log("⚠️  Development server startup is slow (>10s)");
      }
    }

    // Detectar hot reload
    if (output.includes("compiled") && serverReady) {
      console.log("🔥 Hot reload detected");
    }
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  child.on("close", (code) => {
    console.log(`\nDevelopment server stopped with code ${code}`);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nStopping development server...");
    child.kill("SIGINT");
    process.exit(0);
  });
}

// Função principal
async function main() {
  loadHistory();

  const command = process.argv[2];

  switch (command) {
    case "build":
      try {
        await runMonitoredBuild();
        console.log("\n✅ Build monitoring completed");
      } catch (error) {
        console.error("\n❌ Build failed:", error.message);
        process.exit(1);
      }
      break;

    case "dev":
      monitorDev();
      break;

    case "stats":
      showStatistics();
      break;

    default:
      console.log("Usage:");
      console.log(
        "  node scripts/monitor-build.js build   - Monitor production build",
      );
      console.log(
        "  node scripts/monitor-build.js dev     - Monitor development server",
      );
      console.log(
        "  node scripts/monitor-build.js stats   - Show build statistics",
      );
      break;
  }
}

// Executar
main().catch(console.error);
