#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Analyzing Build Performance...\n");

// Função para medir tempo de execução
function measureTime(label, fn) {
  const start = Date.now();
  const result = fn();
  const end = Date.now();
  const duration = end - start;
  console.log(`⏱️  ${label}: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  return { result, duration };
}

// Análise do package.json
function analyzeDependencies() {
  console.log("📦 Dependency Analysis:");
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  const deps = Object.keys(packageJson.dependencies || {});
  const devDeps = Object.keys(packageJson.devDependencies || {});

  console.log(`   Production dependencies: ${deps.length}`);
  console.log(`   Development dependencies: ${devDeps.length}`);

  // Identificar dependências pesadas
  const heavyDeps = [
    "puppeteer",
    "exceljs",
    "jspdf",
    "html2canvas",
    "@prisma/client",
    "prisma",
    "framer-motion",
  ];

  const foundHeavyDeps = deps.filter((dep) =>
    heavyDeps.some((heavy) => dep.includes(heavy)),
  );

  console.log(`   Heavy dependencies found: ${foundHeavyDeps.join(", ")}`);

  // Contar componentes Radix UI
  const radixDeps = deps.filter((dep) => dep.startsWith("@radix-ui/"));
  console.log(`   Radix UI components: ${radixDeps.length}`);

  return {
    totalDeps: deps.length,
    heavyDeps: foundHeavyDeps,
    radixCount: radixDeps.length,
  };
}

// Análise de arquivos
function analyzeFileStructure() {
  console.log("\n📁 File Structure Analysis:");

  const countFiles = (dir, extensions = [".ts", ".tsx", ".js", ".jsx"]) => {
    let count = 0;
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        if (
          file.isDirectory() &&
          !file.name.startsWith(".") &&
          file.name !== "node_modules"
        ) {
          count += countFiles(path.join(dir, file.name), extensions);
        } else if (
          file.isFile() &&
          extensions.some((ext) => file.name.endsWith(ext))
        ) {
          count++;
        }
      }
    } catch (error) {
      // Ignorar erros de acesso
    }
    return count;
  };

  const tsFiles = countFiles(".", [".ts", ".tsx"]);
  const jsFiles = countFiles(".", [".js", ".jsx"]);
  const componentFiles = countFiles("./components");
  const hookFiles = countFiles("./hooks");
  const libFiles = countFiles("./lib");

  console.log(`   TypeScript files: ${tsFiles}`);
  console.log(`   JavaScript files: ${jsFiles}`);
  console.log(`   Component files: ${componentFiles}`);
  console.log(`   Hook files: ${hookFiles}`);
  console.log(`   Library files: ${libFiles}`);

  return {
    tsFiles,
    jsFiles,
    componentFiles,
    hookFiles,
    libFiles,
  };
}

// Análise de configuração atual
function analyzeCurrentConfig() {
  console.log("\n⚙️  Configuration Analysis:");

  // Next.js config
  if (fs.existsSync("next.config.js")) {
    const config = fs.readFileSync("next.config.js", "utf8");
    console.log("   ✅ next.config.js exists");

    const hasWebpackConfig = config.includes("webpack:");
    const hasSwcMinify = config.includes("swcMinify");
    const hasWatchOptions = config.includes("watchOptions");

    console.log(`   Webpack customization: ${hasWebpackConfig ? "✅" : "❌"}`);
    console.log(`   SWC minification: ${hasSwcMinify ? "✅" : "❌"}`);
    console.log(`   Watch options: ${hasWatchOptions ? "✅" : "❌"}`);
  } else {
    console.log("   ❌ next.config.js not found");
  }

  // TypeScript config
  if (fs.existsSync("tsconfig.json")) {
    const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
    console.log("   ✅ tsconfig.json exists");

    const hasIncremental = tsconfig.compilerOptions?.incremental;
    const hasComposite = tsconfig.compilerOptions?.composite;

    console.log(`   Incremental compilation: ${hasIncremental ? "✅" : "❌"}`);
    console.log(`   Composite project: ${hasComposite ? "✅" : "❌"}`);
  }
}

// Teste de build time
function measureBuildTime() {
  console.log("\n🏗️  Build Time Measurement:");

  try {
    // Limpar cache primeiro
    console.log("   Clearing Next.js cache...");
    if (fs.existsSync(".next")) {
      execSync("rmdir /s /q .next", { stdio: "ignore" });
    }

    // Medir tempo de build
    const { duration } = measureTime("Next.js build", () => {
      try {
        execSync("npm run build", { stdio: "pipe", timeout: 120000 });
        return "success";
      } catch (error) {
        console.log("   ⚠️  Build failed or timed out");
        return "failed";
      }
    });

    return duration;
  } catch (error) {
    console.log("   ❌ Could not measure build time:", error.message);
    return null;
  }
}

// Gerar relatório
function generateReport(data) {
  const report = {
    timestamp: new Date().toISOString(),
    analysis: data,
    recommendations: [],
  };

  // Gerar recomendações baseadas na análise
  if (data.dependencies.heavyDeps.length > 0) {
    report.recommendations.push({
      type: "dependency",
      priority: "high",
      description: `Move heavy dependencies to dynamic imports: ${data.dependencies.heavyDeps.join(", ")}`,
    });
  }

  if (data.dependencies.radixCount > 10) {
    report.recommendations.push({
      type: "dependency",
      priority: "medium",
      description: "Optimize Radix UI imports with tree shaking",
    });
  }

  if (data.fileStructure.tsFiles > 50) {
    report.recommendations.push({
      type: "typescript",
      priority: "high",
      description: "Enable incremental TypeScript compilation",
    });
  }

  if (data.buildTime && data.buildTime > 30000) {
    report.recommendations.push({
      type: "build",
      priority: "high",
      description: "Build time is too slow, implement webpack optimizations",
    });
  }

  // Salvar relatório
  fs.writeFileSync(
    "build-performance-report.json",
    JSON.stringify(report, null, 2),
  );

  return report;
}

// Executar análise completa
async function runAnalysis() {
  const data = {
    dependencies: analyzeDependencies(),
    fileStructure: analyzeFileStructure(),
    buildTime: null,
  };

  analyzeCurrentConfig();

  // Medir build time (opcional, pode ser lento)
  console.log("\n⚠️  Build time measurement can take several minutes...");
  console.log("   Press Ctrl+C to skip this step\n");

  try {
    data.buildTime = measureBuildTime();
  } catch (error) {
    console.log("   Skipping build time measurement");
  }

  const report = generateReport(data);

  console.log("\n📊 Performance Analysis Complete!");
  console.log("\n🎯 Key Recommendations:");
  report.recommendations.forEach((rec, index) => {
    console.log(
      `   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`,
    );
  });

  console.log(`\n📄 Full report saved to: build-performance-report.json`);
}

// Executar
runAnalysis().catch(console.error);
