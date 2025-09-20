#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Analyzing unused dependencies...\n");

// Ler package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const dependencies = Object.keys(packageJson.dependencies || {});
const devDependencies = Object.keys(packageJson.devDependencies || {});

// Função para buscar uso de dependência nos arquivos
function findDependencyUsage(depName, searchPaths = ["."]) {
  const usagePatterns = [
    `import.*from.*['"]${depName}['"]`,
    `import.*['"]${depName}['"]`,
    `require\\(['"]${depName}['"]\\)`,
    `from.*['"]${depName}/`,
    `import.*['"]${depName}/`,
  ];

  let found = false;

  for (const pattern of usagePatterns) {
    try {
      const result = execSync(
        `findstr /r /s /i "${pattern}" *.ts *.tsx *.js *.jsx 2>nul || echo "not found"`,
        { encoding: "utf8", cwd: process.cwd() },
      );

      if (!result.includes("not found") && result.trim()) {
        found = true;
        break;
      }
    } catch (error) {
      // Continuar se comando falhar
    }
  }

  return found;
}

// Analisar dependências de produção
console.log("📦 Production Dependencies Analysis:");
const unusedProd = [];
const usedProd = [];

for (const dep of dependencies) {
  const isUsed = findDependencyUsage(dep);
  if (isUsed) {
    usedProd.push(dep);
  } else {
    unusedProd.push(dep);
  }
  process.stdout.write(".");
}

console.log("\n");

// Analisar dependências de desenvolvimento
console.log("🛠️  Development Dependencies Analysis:");
const unusedDev = [];
const usedDev = [];

for (const dep of devDependencies) {
  const isUsed = findDependencyUsage(dep);
  if (isUsed) {
    usedDev.push(dep);
  } else {
    unusedDev.push(dep);
  }
  process.stdout.write(".");
}

console.log("\n");

// Identificar dependências que podem ser movidas para devDependencies
const heavyProdDeps = [
  "puppeteer",
  "exceljs",
  "jspdf",
  "html2canvas",
  "@playwright/test",
  "jest",
  "@testing-library/react",
];

const shouldMoveToDevDeps = dependencies.filter((dep) =>
  heavyProdDeps.some((heavy) => dep.includes(heavy)),
);

// Gerar relatório
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalProd: dependencies.length,
    usedProd: usedProd.length,
    unusedProd: unusedProd.length,
    totalDev: devDependencies.length,
    usedDev: usedDev.length,
    unusedDev: unusedDev.length,
  },
  unusedDependencies: {
    production: unusedProd,
    development: unusedDev,
  },
  recommendations: {
    moveToDevDeps: shouldMoveToDevDeps,
    potentiallyUnused: unusedProd.filter(
      (dep) =>
        !dep.startsWith("@types/") &&
        !dep.startsWith("@radix-ui/") &&
        !["react", "react-dom", "next"].includes(dep),
    ),
  },
};

// Mostrar resultados
console.log("📊 Results:");
console.log(
  `   Production deps: ${usedProd.length} used, ${unusedProd.length} potentially unused`,
);
console.log(
  `   Development deps: ${usedDev.length} used, ${unusedDev.length} potentially unused`,
);

if (unusedProd.length > 0) {
  console.log("\n❌ Potentially unused production dependencies:");
  unusedProd.forEach((dep) => console.log(`   - ${dep}`));
}

if (shouldMoveToDevDeps.length > 0) {
  console.log("\n🔄 Dependencies that should be moved to devDependencies:");
  shouldMoveToDevDeps.forEach((dep) => console.log(`   - ${dep}`));
}

if (unusedDev.length > 0) {
  console.log("\n❌ Potentially unused development dependencies:");
  unusedDev.forEach((dep) => console.log(`   - ${dep}`));
}

// Salvar relatório
fs.writeFileSync(
  "unused-dependencies-report.json",
  JSON.stringify(report, null, 2),
);
console.log("\n📄 Full report saved to: unused-dependencies-report.json");

// Gerar comandos de limpeza
if (report.recommendations.potentiallyUnused.length > 0) {
  console.log("\n🧹 Suggested cleanup commands:");
  console.log(
    "npm uninstall " + report.recommendations.potentiallyUnused.join(" "),
  );
}

console.log(
  "\n⚠️  Note: This analysis may have false positives. Review carefully before removing dependencies.",
);
