import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const userId = searchParams.get('userId');
    
    // Filtros
    const where: any = { status: 'ACTIVE' };
    if (tenant_id) where.tenant_id = tenant_id;
    if (userId) where.userId = userId;

    // Buscar investimentos ativos
    const investments = await prisma.investment.findMany({
      where,
      include: {
        dividends: {
          orderBy: { paymentDate: 'desc' },
          take: 10
        }
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });

    // Calcular estatísticas do portfólio
    const totalInvested = investments.reduce((sum, inv) => 
      sum + (Number(inv.quantity) * Number(inv.purchasePrice)), 0
    );

    const currentValue = investments.reduce((sum, inv) => 
      sum + (Number(inv.quantity) * Number(inv.currentPrice || inv.purchasePrice)), 0
    );

    const totalReturn = currentValue - totalInvested;
    const totalReturnPercentage = totalInvested > 0 ? ((totalReturn / totalInvested) * 100) : 0;

    const totalDividends = investments.reduce((sum, inv) => 
      sum + inv.dividends.reduce((divSum, div) => divSum + Number(div.amount), 0), 0
    );

    // Diversificação por tipo
    const diversification = investments.reduce((acc, inv) => {
      if (!acc[inv.type]) {
        acc[inv.type] = { count: 0, value: 0 };
      }
      acc[inv.type].count++;
      acc[inv.type].value += Number(inv.quantity) * Number(inv.currentPrice || inv.purchasePrice);
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Top performadores
    const topPerformers = investments
      .map(inv => {
        const invested = Number(inv.quantity) * Number(inv.purchasePrice);
        const current = Number(inv.quantity) * Number(inv.currentPrice || inv.purchasePrice);
        const returnPct = invested > 0 ? ((current - invested) / invested * 100) : 0;
        return {
          ...inv,
          returnPercentage: returnPct
        };
      })
      .sort((a, b) => b.returnPercentage - a.returnPercentage)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAssets: investments.length,
          totalInvested: Number(totalInvested.toFixed(2)),
          currentValue: Number(currentValue.toFixed(2)),
          totalReturn: Number(totalReturn.toFixed(2)),
          totalReturnPercentage: Number(totalReturnPercentage.toFixed(2)),
          totalDividends: Number(totalDividends.toFixed(2)),
        },
        diversification: Object.entries(diversification).map(([type, data]) => ({
          type,
          count: data.count,
          value: Number(data.value.toFixed(2)),
          percentage: currentValue > 0 ? Number((data.value / currentValue * 100).toFixed(2)) : 0
        })),
        topPerformers: topPerformers.map(inv => ({
          id: inv.id,
          name: inv.name,
          symbol: inv.symbol,
          type: inv.type,
          returnPercentage: Number(inv.returnPercentage.toFixed(2))
        })),
        recentDividends: investments
          .flatMap(inv => inv.dividends.map(div => ({ ...div, investmentName: inv.name })))
          .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
          .slice(0, 5)
      }
    }, { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resumo dos investimentos:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}