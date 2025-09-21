import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'thisMonth';

    // Definir datas padrão se não fornecidas
    const now = new Date();
    let defaultStartDate: string;
    let defaultEndDate: string = now.toISOString().split('T')[0];

    switch (period) {
      case '1month':
        defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case '3months':
        defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
        break;
      case '6months':
        defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
        break;
      case '1year':
        defaultStartDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'ytd':
        defaultStartDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    }

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Buscar transações do período
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: finalStartDate,
          lte: finalEndDate
        }
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        accountId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Buscar contas
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calcular estatísticas
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);

    const netFlow = totalIncome - totalExpenses;

    // Gastos por categoria
    const categoryData: { [key: string]: number } = {};
    transactions
      .filter((t: any) => t.type === 'expense')
      .forEach((t: any) => {
        const category = t.category || 'Outros';
        categoryData[category] = (categoryData[category] || 0) + Math.abs(parseFloat(t.amount));
      });

    const COLORS = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
      '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
    ];

    const categories = Object.entries(categoryData)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([name, amount], index) => ({
        name,
        amount: amount as number,
        percentage: totalExpenses > 0 ? ((amount as number) / totalExpenses) * 100 : 0,
        color: COLORS[index % COLORS.length]
      }));

    // Tendência mensal
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    transactions.forEach((t: any) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        monthlyData[monthKey].income += parseFloat(t.amount);
      } else {
        monthlyData[monthKey].expenses += Math.abs(parseFloat(t.amount));
      }
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        }),
        income: data.income,
        expenses: data.expenses,
        netFlow: data.income - data.expenses
      }));

    // Breakdown de contas
    const accountsBreakdown = accounts.map((account: any) => ({
      name: account.name,
      balance: parseFloat(account.balance) || 0,
      type: account.type
    }));

    const reportData = {
      period,
      income: totalIncome,
      expenses: totalExpenses,
      netFlow,
      categories,
      monthlyTrend,
      accountsBreakdown
    };

    return NextResponse.json({
      success: true,
      data: reportData,
      message: "Relatório gerado com sucesso"
    });

  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor ao gerar relatório",
        error: error.message
      },
      { status: 500 }
    );
  }
}