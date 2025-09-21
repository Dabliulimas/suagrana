import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Definir datas padrão se não fornecidas
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = now.toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Buscar transações de despesa do período
    const expenseTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: finalStartDate,
          lte: finalEndDate
        },
        type: 'expense'
      },
      select: {
        id: true,
        description: true,
        amount: true,
        category: true,
        date: true,
        accountId: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Agrupar por categoria
    const categoryData: { [key: string]: { 
      total: number; 
      count: number; 
      transactions: any[];
      average: number;
    } } = {};

    expenseTransactions.forEach((t: any) => {
      const category = t.category || 'Outros';
      const amount = Math.abs(parseFloat(t.amount));
      
      if (!categoryData[category]) {
        categoryData[category] = { 
          total: 0, 
          count: 0, 
          transactions: [],
          average: 0
        };
      }

      categoryData[category].total += amount;
      categoryData[category].count += 1;
      categoryData[category].transactions.push({
        id: t.id,
        description: t.description,
        amount: amount,
        date: t.date,
        accountId: t.accountId
      });
    });

    // Calcular médias e percentuais
    const totalExpenses = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);

    const COLORS = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
      '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
    ];

    const categories = Object.entries(categoryData)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        average: data.total / data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        transactions: data.transactions.slice(0, 5) // Últimas 5 transações
      }))
      .sort((a, b) => b.total - a.total)
      .map((category, index) => ({
        ...category,
        color: COLORS[index % COLORS.length]
      }));

    // Análise de tendências por categoria (comparar com período anterior)
    const periodDays = Math.ceil((new Date(finalEndDate).getTime() - new Date(finalStartDate).getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(new Date(finalStartDate).getTime() - (periodDays * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const previousEndDate = new Date(new Date(finalStartDate).getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    const previousExpenses = await prisma.transaction.findMany({
      where: {
        date: {
          gte: previousStartDate,
          lte: previousEndDate
        },
        type: 'expense'
      },
      select: {
        category: true,
        amount: true
      }
    });

    const previousCategoryData: { [key: string]: number } = {};
    previousExpenses.forEach((exp: any) => {
      const category = exp.category || 'Outros';
      const amount = Math.abs(parseFloat(exp.amount));
      previousCategoryData[category] = (previousCategoryData[category] || 0) + amount;
    });

    // Adicionar comparação com período anterior
    const categoriesWithTrends = categories.map(category => {
      const previousAmount = previousCategoryData[category.name] || 0;
      const change = previousAmount > 0 ? ((category.total - previousAmount) / previousAmount) * 100 : 0;
      
      return {
        ...category,
        previousPeriod: previousAmount,
        change: change,
        trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
      };
    });

    const result = {
      period: {
        startDate: finalStartDate,
        endDate: finalEndDate
      },
      summary: {
        totalExpenses,
        categoryCount: categories.length,
        transactionCount: expenseTransactions.length,
        averagePerCategory: categories.length > 0 ? totalExpenses / categories.length : 0,
        topCategory: categories.length > 0 ? categories[0] : null
      },
      categories: categoriesWithTrends,
      insights: {
        mostExpensiveCategory: categories.length > 0 ? categories[0].name : null,
        mostFrequentCategory: categories.length > 0 ? 
          categories.reduce((max, cat) => cat.count > max.count ? cat : max, categories[0]).name : null,
        categoriesAboveAverage: categories.filter(cat => 
          cat.total > (totalExpenses / categories.length)
        ).length
      }
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: "Relatório de gastos por categoria gerado com sucesso"
    });

  } catch (error: any) {
    console.error("Erro ao gerar relatório de gastos por categoria:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor ao gerar relatório de gastos por categoria",
        error: error.message
      },
      { status: 500 }
    );
  }
}