import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get("tenant_id");
    
    // Filtros
    const where: any = { isActive: true };
    if (tenant_id) where.tenant_id = tenant_id;

    // Contar contas ativas
    const totalAccounts = await prisma.account.count({ where });

    // Calcular saldo total de todas as contas
    const balanceAggregate = await prisma.entries.aggregate({
      _sum: {
        credit: true,
        debit: true
      },
      where: {
        accounts: where
      }
    });

    const totalBalance = (balanceAggregate._sum.credit || 0) - (balanceAggregate._sum.debit || 0);

    // Calcular saldos por tipo de conta
    const accountsByType = await prisma.account.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true
      }
    });

    // Buscar contas com maior saldo
    const topAccounts = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.name,
        a.type,
        COALESCE(SUM(e.credit), 0) - COALESCE(SUM(e.debit), 0) as balance
      FROM accounts a
      LEFT JOIN entries e ON e.account_id = a.id
      WHERE a.is_active = true ${tenant_id ? 'AND a.tenant_id = $1' : ''}
      GROUP BY a.id, a.name, a.type
      ORDER BY balance DESC
      LIMIT 5
    `;

    return NextResponse.json({
      success: true,
      data: {
        totalAccounts,
        totalBalance: Number(totalBalance),
        accountsByType: accountsByType.map(item => ({
          type: item.type,
          count: item._count.id
        })),
        topAccounts: Array.isArray(topAccounts) ? topAccounts.map((account: any) => ({
          ...account,
          balance: Number(account.balance)
        })) : []
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar resumo das contas:", error);
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
}