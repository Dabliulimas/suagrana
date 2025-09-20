const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function migrateToFrontend() {
  try {
    console.log("=== MIGRANDO DADOS DO BANCO PARA FRONTEND ===");

    // Buscar todos os dados
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });

    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    });

    const goals = await prisma.goal.findMany({
      orderBy: { createdAt: "desc" },
    });

    const investments = await prisma.investment.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log("Dados encontrados:");
    console.log("- Transações:", transactions.length);
    console.log("- Contas:", accounts.length);
    console.log("- Metas:", goals.length);
    console.log("- Investimentos:", investments.length);

    // Criar script para popular localStorage
    const frontendScript = `
// Script para popular localStorage com dados do backend
console.log('=== POPULANDO LOCALSTORAGE ===');

// Transações
const transactions = ${JSON.stringify(transactions, null, 2)};
localStorage.setItem('sua-grana-transactions', JSON.stringify(transactions));
console.log('Transações salvas:', transactions.length);

// Contas
const accounts = ${JSON.stringify(accounts, null, 2)};
localStorage.setItem('sua-grana-accounts', JSON.stringify(accounts));
console.log('Contas salvas:', accounts.length);

// Metas
const goals = ${JSON.stringify(goals, null, 2)};
localStorage.setItem('sua-grana-goals', JSON.stringify(goals));
console.log('Metas salvas:', goals.length);

// Investimentos
const investments = ${JSON.stringify(investments, null, 2)};
localStorage.setItem('sua-grana-investments', JSON.stringify(investments));
console.log('Investimentos salvos:', investments.length);

// Viagens (dados de exemplo)
const trips = [];
localStorage.setItem('sua-grana-trips', JSON.stringify(trips));
console.log('Viagens salvas:', trips.length);

console.log('\n=== MIGRAÇÃO CONCLUÍDA ===');
console.log('Recarregue a página para ver os dados!');
`;

    // Salvar script no frontend
    const scriptPath = path.join(__dirname, "..", "populate-localStorage.js");
    if (typeof window === "undefined") return;
    fs.writeFileSync(scriptPath, frontendScript);

    console.log("\n=== SCRIPT CRIADO ===");
    console.log("Execute no console do navegador:");
    console.log("1. Abra o DevTools (F12)");
    console.log("2. Vá para a aba Console");
    console.log(
      "3. Cole e execute o conteúdo do arquivo populate-localStorage.js",
    );
    console.log("\nOu abra o arquivo:", scriptPath);
  } catch (error) {
    console.error("Erro na migração:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToFrontend();
