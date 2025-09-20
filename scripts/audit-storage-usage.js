#!/usr/bin/env node
// Auditoria: listar ocorrências de localStorage e storage.get*/saveTransaction no projeto
const { execSync } = require("child_process");

function run(cmd) {
  try {
    const out = execSync(cmd, { stdio: "pipe" }).toString();
    console.log(out);
  } catch (e) {
    console.log(e.stdout?.toString() || e.message);
  }
}

console.log("\n🔎 Auditoria de usos de localStorage:");
run("rg -n --glob '!node_modules' 'localStorage\.'");

console.log("\n🔎 Auditoria de usos de storage.get* (leituras):");
run("rg -n --glob '!node_modules' 'storage\\.get\\w+\\('");

console.log(
  "\n🔎 Auditoria de usos de storage.saveTransaction/updateAccountBalance/addTripExpense (gravações):",
);
run(
  "rg -n --glob '!node_modules' 'storage\\.(saveTransaction|updateAccountBalance|addTripExpense)\\('",
);

console.log("\n✅ Auditoria concluída.");
