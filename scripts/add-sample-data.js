// Script para adicionar dados de exemplo ao localStorage
// Execute este script no console do navegador para popular o dashboard

const sampleData = {
  transactions: [
    {
      id: "trans-1",
      description: "Salário",
      amount: 5000,
      type: "income",
      category: "Salário",
      account: "Conta Corrente",
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "trans-2",
      description: "Supermercado",
      amount: -350,
      type: "expense",
      category: "Alimentação",
      account: "Conta Corrente",
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "trans-3",
      description: "Combustível",
      amount: -200,
      type: "expense",
      category: "Transporte",
      account: "Conta Corrente",
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "trans-4",
      description: "Freelance",
      amount: 1200,
      type: "income",
      category: "Trabalho Extra",
      account: "Conta Corrente",
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "trans-5",
      description: "Conta de Luz",
      amount: -180,
      type: "expense",
      category: "Utilidades",
      account: "Conta Corrente",
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  accounts: [
    {
      id: "acc-1",
      name: "Conta Corrente",
      type: "checking",
      balance: 8500,
      bank: "Banco do Brasil",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "acc-2",
      name: "Poupança",
      type: "savings",
      balance: 15000,
      bank: "Caixa Econômica",
      interestRate: 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "acc-3",
      name: "Cartão de Crédito",
      type: "credit",
      balance: -1200,
      creditLimit: 5000,
      bank: "Nubank",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  investments: [
    {
      id: "inv-1",
      operation: "buy",
      type: "stock",
      ticker: "PETR4",
      name: "Petrobras PN",
      quantity: 100,
      price: 35.5,
      totalValue: 3550,
      date: new Date().toISOString().slice(0, 10),
      account: "Corretora XP",
      fees: 10,
      sector: "Petróleo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inv-2",
      operation: "buy",
      type: "treasury",
      name: "Tesouro Selic 2029",
      quantity: 1,
      price: 10000,
      totalValue: 10000,
      date: new Date().toISOString().slice(0, 10),
      account: "Tesouro Direto",
      fees: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inv-3",
      operation: "buy",
      type: "fii",
      ticker: "HGLG11",
      name: "CSHG Logística",
      quantity: 50,
      price: 120.0,
      totalValue: 6000,
      date: new Date().toISOString().slice(0, 10),
      account: "Corretora XP",
      fees: 15,
      sector: "Logística",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  goals: [
    {
      id: "goal-1",
      name: "Reserva de Emergência",
      description: "Reserva para 6 meses de gastos",
      target: 30000,
      current: 15000,
      deadline: "2024-12-31",
      category: "Emergência",
      priority: "high",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "goal-2",
      name: "Viagem Europa",
      description: "Viagem de férias para Europa",
      target: 20000,
      current: 5000,
      deadline: "2025-06-30",
      category: "Viagem",
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "goal-3",
      name: "Carro Novo",
      description: "Entrada para carro novo",
      target: 50000,
      current: 12000,
      deadline: "2025-03-31",
      category: "Veículo",
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

// Função para salvar os dados no localStorage
function addSampleData() {
  try {
    console.log("🚀 Adicionando dados de exemplo...");

    // Salvar cada tipo de dado
    localStorage.setItem(
      "sua-grana-transactions",
      JSON.stringify(sampleData.transactions),
    );
    localStorage.setItem(
      "sua-grana-accounts",
      JSON.stringify(sampleData.accounts),
    );
    localStorage.setItem(
      "sua-grana-investments",
      JSON.stringify(sampleData.investments),
    );
    localStorage.setItem("sua-grana-goals", JSON.stringify(sampleData.goals));

    console.log("✅ Dados de exemplo adicionados com sucesso!");
    console.log("📊 Resumo dos dados:");
    console.log(`- ${sampleData.transactions.length} transações`);
    console.log(`- ${sampleData.accounts.length} contas`);
    console.log(`- ${sampleData.investments.length} investimentos`);
    console.log(`- ${sampleData.goals.length} metas`);

    console.log("🔄 Recarregue a página para ver os dados no dashboard.");

    return true;
  } catch (error) {
    console.error("❌ Erro ao adicionar dados:", error);
    return false;
  }
}

// Função para limpar todos os dados
function clearAllData() {
  try {
    console.log("🧹 Limpando todos os dados...");

    const keys = [
      "sua-grana-transactions",
      "sua-grana-accounts",
      "sua-grana-investments",
      "sua-grana-goals",
      "sua-grana-trips",
      "sua-grana-contacts",
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log("✅ Todos os dados foram removidos!");
    console.log("🔄 Recarregue a página para ver as mudanças.");

    return true;
  } catch (error) {
    console.error("❌ Erro ao limpar dados:", error);
    return false;
  }
}

// Função para verificar dados existentes
function checkExistingData() {
  console.log("🔍 Verificando dados existentes...");

  const keys = [
    "sua-grana-transactions",
    "sua-grana-accounts",
    "sua-grana-investments",
    "sua-grana-goals",
  ];

  keys.forEach((key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      console.log(`${key}: ${data.length} items`);
    } catch (error) {
      console.log(`${key}: erro ao ler dados`);
    }
  });
}

// Exportar funções para uso no console
if (typeof window !== "undefined") {
  window.addSampleData = addSampleData;
  window.clearAllData = clearAllData;
  window.checkExistingData = checkExistingData;

  console.log("📋 Funções disponíveis:");
  console.log("- addSampleData(): Adiciona dados de exemplo");
  console.log("- clearAllData(): Remove todos os dados");
  console.log("- checkExistingData(): Verifica dados existentes");
}

// Se executado diretamente, adicionar os dados
if (typeof module === "undefined") {
  addSampleData();
}

export { addSampleData, clearAllData, checkExistingData, sampleData };
