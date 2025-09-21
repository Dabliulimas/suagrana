import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1;
    const type = searchParams.get("type"); // 'income' or 'expense'
    const tenant_id = searchParams.get("tenant_id");

    // Filtros de data para o mês/ano especificado
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Construir filtros base
    const whereFilters: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (tenant_id) whereFilters.tenant_id = tenant_id;

    // Ajustar filtros baseado no tipo
    let entryFilters: any = {};
    if (type === 'income') {
      entryFilters = { credit: { gt: 0 } };
    } else if (type === 'expense') {
      entryFilters = { debit: { gt: 0 } };
    }

    // Buscar transações com entries filtradas
    const transactions = await prisma.transaction.findMany({
      where: whereFilters,
      include: {
        entries: {
          where: entryFilters,
          include: {
            categories: true,
            accounts: true
          }
        }
      }
    });

    // Calcular totais
    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;
    const categoryBreakdown: { [key: string]: number } = {};

    transactions.forEach(transaction => {
      transaction.entries.forEach(entry => {
        if (entry.credit > 0) {
          totalIncome += Number(entry.credit);
        }
        if (entry.debit > 0) {
          totalExpense += Number(entry.debit);
        }
        
        // Breakdown por categoria
        const categoryName = entry.categories?.name || 'Sem categoria';
        if (!categoryBreakdown[categoryName]) {
          categoryBreakdown[categoryName] = 0;
        }
        categoryBreakdown[categoryName] += Number(entry.credit || entry.debit);
      });
      transactionCount++;
    });

    const summary = {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
      transactionCount,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, amount]) => ({
        category: name,
        amount
      })).sort((a, b) => b.amount - a.amount)
    };

    // Filtrar resposta baseado no tipo solicitado
    if (type === 'income') {
      return NextResponse.json({
        success: true,
        data: {
          total: totalIncome,
          count: transactionCount,
          period: summary.period,
          categoryBreakdown: summary.categoryBreakdown.filter(item => item.amount > 0)
        }
      });
    } else if (type === 'expense') {
      return NextResponse.json({
        success: true,
        data: {
          total: totalExpense,
          count: transactionCount,
          period: summary.period,
          categoryBreakdown: summary.categoryBreakdown.filter(item => item.amount > 0)
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: summary
      });
    }
  } catch (error) {
    console.error("Erro ao buscar resumo de transações:", error);
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