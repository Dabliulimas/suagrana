import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const tenant_id = searchParams.get('tenant_id');
    
    // Datas padrão (6 meses atrás até hoje)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 6);
    
    const startDate = startDateParam ? new Date(startDateParam) : defaultStartDate;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEndDate;
    
    // Filtros
    const whereFilters: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    if (tenant_id) whereFilters.tenant_id = tenant_id;

    // Buscar transações no período
    const transactions = await prisma.transaction.findMany({
      where: whereFilters,
      include: {
        entries: {
          include: {
            categories: true,
            accounts: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Agrupar dados por mês
    const monthlyData: { [key: string]: { income: number; expense: number; net: number; date: string } } = {};
    
    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          income: 0,
          expense: 0,
          net: 0,
          date: monthKey
        };
      }
      
      transaction.entries.forEach(entry => {
        if (entry.credit > 0) {
          monthlyData[monthKey].income += Number(entry.credit);
        }
        if (entry.debit > 0) {
          monthlyData[monthKey].expense += Number(entry.debit);
        }
      });
      
      monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expense;
    });

    // Converter para array e ordenar
    const cashFlowData = Object.values(monthlyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calcular totais
    const totalIncome = cashFlowData.reduce((sum, month) => sum + month.income, 0);
    const totalExpense = cashFlowData.reduce((sum, month) => sum + month.expense, 0);
    const netCashFlow = totalIncome - totalExpense;
    
    // Calcular médias
    const avgMonthlyIncome = cashFlowData.length > 0 ? totalIncome / cashFlowData.length : 0;
    const avgMonthlyExpense = cashFlowData.length > 0 ? totalExpense / cashFlowData.length : 0;
    
    // Identificar tendência (compara os últimos 3 meses com os 3 anteriores)
    let trend = 'stable';
    if (cashFlowData.length >= 6) {
      const recentMonths = cashFlowData.slice(-3);
      const previousMonths = cashFlowData.slice(-6, -3);
      
      const recentAvg = recentMonths.reduce((sum, m) => sum + m.net, 0) / 3;
      const previousAvg = previousMonths.reduce((sum, m) => sum + m.net, 0) / 3;
      
      if (recentAvg > previousAvg * 1.05) trend = 'improving';
      else if (recentAvg < previousAvg * 0.95) trend = 'declining';
    }

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        summary: {
          totalIncome: Number(totalIncome.toFixed(2)),
          totalExpense: Number(totalExpense.toFixed(2)),
          netCashFlow: Number(netCashFlow.toFixed(2)),
          avgMonthlyIncome: Number(avgMonthlyIncome.toFixed(2)),
          avgMonthlyExpense: Number(avgMonthlyExpense.toFixed(2)),
          trend
        },
        monthlyData: cashFlowData.map(month => ({
          ...month,
          income: Number(month.income.toFixed(2)),
          expense: Number(month.expense.toFixed(2)),
          net: Number(month.net.toFixed(2))
        })),
        chartData: cashFlowData.map(month => ({
          month: month.date,
          income: Number(month.income.toFixed(2)),
          expense: Number(month.expense.toFixed(2)),
          net: Number(month.net.toFixed(2))
        }))
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de fluxo de caixa:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Erro interno do servidor",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}