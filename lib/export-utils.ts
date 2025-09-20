interface TransactionData {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: string;
}

interface InvestmentData {
  name: string;
  type: string;
  amount: number;
  return: number;
  allocation: number;
}

interface BudgetData {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
}

interface SummaryData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  investments: number;
  savingsRate: number;
  period: string;
}

interface ExportData {
  transactions: TransactionData[];
  investments: InvestmentData[];
  budget: BudgetData[];
  summary: SummaryData | null;
}

export async function exportToCSV(data: ExportData, period: string) {
  const csvContent: string[] = [];

  // Add header with export info
  csvContent.push(`# Relatorio Financeiro - ${getPeriodLabel(period)}`);
  csvContent.push(`# Exportado em: ${new Date().toLocaleString("pt-BR")}`);
  csvContent.push("");

  // Export Summary
  if (data.summary) {
    csvContent.push("=== RESUMO FINANCEIRO ===");
    csvContent.push("Metrica,Valor");
    csvContent.push(
      `Saldo Total,R$ ${data.summary.totalBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    );
    csvContent.push(
      `Receita Mensal,R$ ${data.summary.monthlyIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    );
    csvContent.push(
      `Gastos Mensais,R$ ${data.summary.monthlyExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    );
    csvContent.push(
      `Investimentos,R$ ${data.summary.investments.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    );
    csvContent.push(`Taxa de Poupanca,${data.summary.savingsRate.toFixed(1)}%`);
    csvContent.push("");
  }

  // Export Transactions
  if (data.transactions.length > 0) {
    csvContent.push("=== TRANSACOES ===");
    csvContent.push("Data,Descricao,Categoria,Valor,Tipo");
    data.transactions.forEach((transaction) => {
      const formattedAmount = `R$ ${Math.abs(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      csvContent.push(
        `${transaction.date},${transaction.description},${transaction.category},${formattedAmount},${transaction.type === "income" ? "Receita" : "Despesa"}`,
      );
    });
    csvContent.push("");
  }

  // Export Investments
  if (data.investments.length > 0) {
    csvContent.push("=== INVESTIMENTOS ===");
    csvContent.push("Nome,Tipo,Valor Investido,Rentabilidade,Alocacao");
    data.investments.forEach((investment) => {
      const formattedAmount = `R$ ${investment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      csvContent.push(
        `${investment.name},${investment.type},${formattedAmount},${investment.return.toFixed(2)}%,${investment.allocation}%`,
      );
    });
    csvContent.push("");
  }

  // Export Budget
  if (data.budget.length > 0) {
    csvContent.push("=== ORCAMENTO ===");
    csvContent.push("Categoria,Orcado,Gasto,Restante,Status");
    data.budget.forEach((budget) => {
      const formattedBudgeted = `R$ ${budget.budgeted.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      const formattedSpent = `R$ ${budget.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      const formattedRemaining = `R$ ${budget.remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      const status =
        budget.remaining >= 0 ? "Dentro do orcamento" : "Acima do orcamento";
      csvContent.push(
        `${budget.category},${formattedBudgeted},${formattedSpent},${formattedRemaining},${status}`,
      );
    });
  }

  // Create and download CSV file
  const csvString = csvContent.join("\n");
  const blob = new Blob(["\ufeff" + csvString], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `relatorio-financeiro-${period}-${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToPDF(data: ExportData, period: string) {
  // Create HTML content for PDF
  const htmlContent = generatePDFHTML(data, period);

  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, permita pop-ups para exportar o PDF");
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
}

function generatePDFHTML(data: ExportData, period: string): string {
  const currentDate = new Date().toLocaleString("pt-BR");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatorio Financeiro</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #3b82f6;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #374151;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        .summary-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background-color: #f8fafc;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          color: #374151;
          font-size: 14px;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
        }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatorio Financeiro</h1>
        <p><strong>Periodo:</strong> ${getPeriodLabel(period)}</p>
        <p><strong>Gerado em:</strong> ${currentDate}</p>
      </div>

      ${
        data.summary
          ? `
        <div class="section">
          <h2>Resumo Financeiro</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Saldo Total</h3>
              <div class="value positive">R$ ${data.summary.totalBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-card">
              <h3>Receita Mensal</h3>
              <div class="value positive">R$ ${data.summary.monthlyIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-card">
              <h3>Gastos Mensais</h3>
              <div class="value negative">R$ ${data.summary.monthlyExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="summary-card">
              <h3>Taxa de Poupanca</h3>
              <div class="value">${data.summary.savingsRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      `
          : ""
      }

      ${
        data.transactions.length > 0
          ? `
        <div class="section">
          <h2>Transacoes</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descricao</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              ${data.transactions
                .map(
                  (transaction) => `
                <tr>
                  <td>${new Date(transaction.date).toLocaleDateString("pt-BR")}</td>
                  <td>${transaction.description}</td>
                  <td>${transaction.category}</td>
                  <td class="${transaction.type === "income" ? "positive" : "negative"}">
                    R$ ${Math.abs(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td>${transaction.type === "income" ? "Receita" : "Despesa"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
          : ""
      }

      ${
        data.investments.length > 0
          ? `
        <div class="section">
          <h2>Investimentos</h2>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Valor Investido</th>
                <th>Rentabilidade</th>
                <th>Alocacao</th>
              </tr>
            </thead>
            <tbody>
              ${data.investments
                .map(
                  (investment) => `
                <tr>
                  <td>${investment.name}</td>
                  <td>${investment.type}</td>
                  <td>R$ ${investment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td class="${investment.return >= 0 ? "positive" : "negative"}">
                    ${investment.return >= 0 ? "+" : ""}${investment.return.toFixed(2)}%
                  </td>
                  <td>${investment.allocation}%</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
          : ""
      }

      ${
        data.budget.length > 0
          ? `
        <div class="section">
          <h2>Orcamento</h2>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Orcado</th>
                <th>Gasto</th>
                <th>Restante</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.budget
                .map(
                  (budget) => `
                <tr>
                  <td>${budget.category}</td>
                  <td>R$ ${budget.budgeted.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td>R$ ${budget.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td class="${budget.remaining >= 0 ? "positive" : "negative"}">
                    R$ ${budget.remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td>${budget.remaining >= 0 ? "Dentro do orcamento" : "Acima do orcamento"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
          : ""
      }

      <div class="footer">
        <p>Relatorio gerado automaticamente pelo Sistema de Controle Financeiro</p>
        <p>Este documento contem informacoes confidenciais e deve ser tratado com seguranca</p>
      </div>
    </body>
    </html>
  `;
}

function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    "last-month": "Ultimo mes",
    "last-3-months": "Ultimos 3 meses",
    "last-6-months": "Ultimos 6 meses",
    "last-year": "Ultimo ano",
    "current-year": "Ano atual",
    "all-time": "Todo o periodo",
  };
  return labels[period] || period;
}
