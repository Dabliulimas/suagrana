#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔧 Optimizing TypeScript configuration...\n");

// Função para verificar se TypeScript está instalado
function checkTypeScriptInstallation() {
  try {
    execSync("npx tsc --version", { stdio: "pipe" });
    console.log("✅ TypeScript is installed");
    return true;
  } catch (error) {
    console.log("❌ TypeScript not found");
    return false;
  }
}

// Função para limpar cache do TypeScript
function clearTypeScriptCache() {
  console.log("🧹 Clearing TypeScript cache...");

  const cachePaths = [
    ".next/cache/tsconfig.tsbuildinfo",
    "tsconfig.tsbuildinfo",
    ".tsbuildinfo",
    "node_modules/.cache/typescript",
  ];

  let cleared = 0;
  for (const cachePath of cachePaths) {
    try {
      if (fs.existsSync(cachePath)) {
        if (fs.statSync(cachePath).isDirectory()) {
          execSync(`rmdir /s /q "${cachePath}"`, { stdio: "ignore" });
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

  console.log(`   Cleared ${cleared} cache files/directories`);
}

// Função para verificar configuração do TypeScript
function analyzeTypeScriptConfig() {
  console.log("📋 Analyzing TypeScript configuration...");

  if (!fs.existsSync("tsconfig.json")) {
    console.log("❌ tsconfig.json not found");
    return;
  }

  const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
  const compilerOptions = tsconfig.compilerOptions || {};

  const optimizations = {
    incremental: compilerOptions.incremental === true,
    skipLibCheck: compilerOptions.skipLibCheck === true,
    assumeChangesOnlyAffectDirectDependencies:
      compilerOptions.assumeChangesOnlyAffectDirectDependencies === true,
    disableSourceOfProjectReferenceRedirect:
      compilerOptions.disableSourceOfProjectReferenceRedirect === true,
    tsBuildInfoFile: !!compilerOptions.tsBuildInfoFile,
  };

  console.log("   Current optimizations:");
  Object.entries(optimizations).forEach(([key, enabled]) => {
    console.log(`   ${enabled ? "✅" : "❌"} ${key}`);
  });

  return optimizations;
}

// Função para testar velocidade de compilação
function testCompilationSpeed() {
  console.log("⏱️  Testing TypeScript compilation speed...");

  try {
    const start = Date.now();
    execSync("npx tsc --noEmit --incremental", {
      stdio: "pipe",
      timeout: 60000, // 1 minuto timeout
    });
    const duration = Date.now() - start;

    console.log(
      `   Type checking completed in: ${duration}ms (${(duration / 1000).toFixed(2)}s)`,
    );

    if (duration > 10000) {
      console.log("   ⚠️  Type checking is slow (>10s)");
      return "slow";
    } else if (duration > 5000) {
      console.log("   ⚠️  Type checking is moderate (>5s)");
      return "moderate";
    } else {
      console.log("   ✅ Type checking is fast (<5s)");
      return "fast";
    }
  } catch (error) {
    console.log("   ❌ Type checking failed or timed out");
    return "failed";
  }
}

// Função para gerar recomendações
function generateRecommendations(optimizations, speed) {
  const recommendations = [];

  if (!optimizations.incremental) {
    recommendations.push({
      type: "config",
      priority: "high",
      description: "Enable incremental compilation",
      action: 'Set "incremental": true in tsconfig.json',
    });
  }

  if (!optimizations.skipLibCheck) {
    recommendations.push({
      type: "config",
      priority: "high",
      description: "Skip library type checking",
      action: 'Set "skipLibCheck": true in tsconfig.json',
    });
  }

  if (!optimizations.tsBuildInfoFile) {
    recommendations.push({
      type: "config",
      priority: "medium",
      description: "Specify build info file location",
      action: 'Set "tsBuildInfoFile": ".next/cache/tsconfig.tsbuildinfo"',
    });
  }

  if (speed === "slow" || speed === "moderate") {
    recommendations.push({
      type: "performance",
      priority: "high",
      description: "Use development-specific TypeScript config",
      action: "Create tsconfig.dev.json with relaxed settings for development",
    });
  }

  if (speed === "failed") {
    recommendations.push({
      type: "error",
      priority: "critical",
      description: "Fix TypeScript compilation errors",
      action: "Run npx tsc --noEmit to see specific errors",
    });
  }

  return recommendations;
}

// Função principal
async function optimizeTypeScript() {
  if (!checkTypeScriptInstallation()) {
    console.log("Please install TypeScript: npm install -D typescript");
    return;
  }

  clearTypeScriptCache();
  const optimizations = analyzeTypeScriptConfig();
  const speed = testCompilationSpeed();

  const recommendations = generateRecommendations(optimizations, speed);

  console.log("\n🎯 Recommendations:");
  if (recommendations.length === 0) {
    console.log("   ✅ TypeScript configuration is already optimized!");
  } else {
    recommendations.forEach((rec, index) => {
      console.log(
        `   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`,
      );
      console.log(`      Action: ${rec.action}`);
    });
  }

  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    optimizations,
    speed,
    recommendations,
  };

  fs.writeFileSync(
    "typescript-optimization-report.json",
    JSON.stringify(report, null, 2),
  );
  console.log("\n📄 Report saved to: typescript-optimization-report.json");
}

// Executar
optimizeTypeScript().catch(console.error);
