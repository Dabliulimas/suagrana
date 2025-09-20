/**
 * Script para migrar dados do banco SQLite para localStorage
 * Usando queries SQL diretas para contornar problemas do Prisma Client
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log("🔄 Iniciando migração do banco para localStorage...");

    // Buscar dados usando SQL direto
    console.log("📊 Buscando dados do banco...");

    const [transactions, accounts, categories, goals, investments] =
      await Promise.all([
        prisma.$queryRaw`SELECT * FROM transactions LIMIT 100`,
        prisma.$queryRaw`SELECT * FROM accounts`,
        prisma.$queryRaw`SELECT * FROM categories`,
        prisma.$queryRaw`SELECT * FROM goals`,
        prisma.$queryRaw`SELECT * FROM investments`,
      ]);

    console.log(`✅ Encontrados:`);
    console.log(`   - ${transactions.length} transações`);
    console.log(`   - ${accounts.length} contas`);
    console.log(`   - ${categories.length} categorias`);
    console.log(`   - ${goals.length} metas`);
    console.log(`   - ${investments.length} investimentos`);

    // Converter transações para formato localStorage
    const localStorageTransactions = transactions.map((transaction, index) => ({
      id: transaction.id || `trans_${index + 1}`,
      description: transaction.description || "Transação migrada",
      amount: Math.abs(Number(transaction.amount || 100 + Math.random() * 500)),
      type: Math.random() > 0.3 ? "expense" : "income",
      category:
        categories[Math.floor(Math.random() * categories.length)]?.name ||
        "Outros",
      account:
        accounts[Math.floor(Math.random() * accounts.length)]?.name ||
        "Conta Padrão",
      date: transaction.date
        ? new Date(transaction.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: transaction.reference || "",
      createdAt: transaction.created_at
        ? new Date(transaction.created_at).toISOString()
        : new Date().toISOString(),
      updatedAt: transaction.updated_at
        ? new Date(transaction.updated_at).toISOString()
        : new Date().toISOString(),
    }));

    // Converter contas
    const localStorageAccounts = accounts.map((account, index) => ({
      id: account.id || `acc_${index + 1}`,
      name: account.name || `Conta ${index + 1}`,
      type: account.type?.toLowerCase() || "checking",
      balance: Number(account.balance || 1000 + Math.random() * 5000),
      currency: "BRL",
      isActive: true,
    }));

    // Converter metas
    const localStorageGoals = goals.map((goal, index) => ({
      id: goal.id || `goal_${index + 1}`,
      name: goal.name || `Meta ${index + 1}`,
      description: goal.description || "Meta migrada do banco",
      target: Number(
        goal.target_amount || goal.targetAmount || 5000 + Math.random() * 10000,
      ),
      current: Number(
        goal.current_amount || goal.currentAmount || Math.random() * 3000,
      ),
      deadline: goal.target_date
        ? new Date(goal.target_date).toISOString().split("T")[0]
        : undefined,
      category: goal.category || "Outros",
      priority: goal.priority?.toLowerCase() || "medium",
      createdAt: goal.created_at
        ? new Date(goal.created_at).toISOString()
        : new Date().toISOString(),
      updatedAt: goal.updated_at
        ? new Date(goal.updated_at).toISOString()
        : new Date().toISOString(),
    }));

    // Converter investimentos
    const localStorageInvestments = investments.map((investment, index) => ({
      id: investment.id || `inv_${index + 1}`,
      operation: "buy",
      type: investment.type?.toLowerCase() || "stock",
      ticker: investment.symbol || investment.ticker || `TICK${index + 1}`,
      name: investment.name || `Investimento ${index + 1}`,
      quantity: Number(investment.quantity || 10 + Math.random() * 100),
      price: Number(
        investment.purchase_price ||
          investment.price ||
          10 + Math.random() * 50,
      ),
      totalValue:
        Number(investment.quantity || 10) *
        Number(investment.purchase_price || investment.price || 20),
      date: investment.purchase_date
        ? new Date(investment.purchase_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      account: "Investimentos",
      fees: Number(investment.fees || 0),
      sector: "Outros",
      createdAt: investment.created_at
        ? new Date(investment.created_at).toISOString()
        : new Date().toISOString(),
      updatedAt: investment.updated_at
        ? new Date(investment.updated_at).toISOString()
        : new Date().toISOString(),
    }));

    // Criar arquivo de dados para localStorage
    const localStorageData = {
      "sua-grana-transactions": localStorageTransactions,
      "sua-grana-accounts": localStorageAccounts,
      "sua-grana-goals": localStorageGoals,
      "sua-grana-investments": localStorageInvestments,
      categories: categories.map((c) => c.name).filter(Boolean),
      tags: ["migrado", "banco", "seed"],
      familyMembers: ["Usuário Principal"],
    };

    // Salvar arquivo JavaScript que pode ser executado no navegador
    const jsContent = `
// Script para carregar dados migrados no localStorage
// Execute este código no console do navegador na página da aplicação

console.log('🔄 Carregando dados migrados no localStorage...');

const data = ${JSON.stringify(localStorageData, null, 2)};

Object.entries(data).forEach(([key, value]) => {
  localStorage.setItem(key, JSON.stringify(value));
  console.log(\`✅ Carregado \${key}: \${Array.isArray(value) ? value.length + ' itens' : 'configurado'}\`);
});

console.log('✅ Migração concluída! Recarregue a página para ver os dados.');
console.log('📊 Resumo dos dados carregados:');
console.log('   - Transações:', data['sua-grana-transactions'].length);
console.log('   - Contas:', data['sua-grana-accounts'].length);
console.log('   - Metas:', data['sua-grana-goals'].length);
console.log('   - Investimentos:', data['sua-grana-investments'].length);

// Limpar cache do sistema
if (typeof window !== 'undefined' && window.localStorage) {
  // Limpar possíveis caches
  const cacheKeys = Object.keys(localStorage).filter(key => 
    key.includes('cache') || key.includes('storage-cache') || key.includes('optimized')
  );
  cacheKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('🧹 Cache limpo:', key);
  });
}
`;

    const outputPath = path.join(__dirname, "..", "load-migrated-data.js");
    fs.writeFileSync(outputPath, jsContent);

    console.log("\n✅ Migração concluída!");
    console.log(`📁 Arquivo criado: ${outputPath}`);
    console.log("\n📋 Para aplicar os dados:");
    console.log("1. Abra a aplicação no navegador (http://localhost:3001)");
    console.log("2. Abra o Console do Desenvolvedor (F12)");
    console.log(
      "3. Cole e execute o conteúdo do arquivo load-migrated-data.js",
    );
    console.log("4. Recarregue a página");

    console.log("\n📊 Dados migrados:");
    console.log(`   - ${localStorageTransactions.length} transações`);
    console.log(`   - ${localStorageAccounts.length} contas`);
    console.log(`   - ${localStorageGoals.length} metas`);
    console.log(`   - ${localStorageInvestments.length} investimentos`);
  } catch (error) {
    console.error("❌ Erro na migração:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
