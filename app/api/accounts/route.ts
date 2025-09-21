import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get("tenant_id");
    const active = searchParams.get("active");
    
    // Construir filtros
    const where: any = {};
    if (tenant_id) where.tenant_id = tenant_id;
    if (active !== null) where.isActive = active === "true";

    // Buscar contas
    const accounts = await prisma.account.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        ledgers: true,
        tenants: {
          select: {
            name: true,
            slug: true
          }
        },
        entries: {
          take: 10,
          orderBy: {
            created_at: 'desc'
          },
          include: {
            transactions: {
              select: {
                description: true,
                date: true
              }
            }
          }
        }
      }
    });

    // Calcular saldos para cada conta
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const balance = await prisma.entries.aggregate({
          where: { account_id: account.id },
          _sum: {
            credit: true,
            debit: true
          }
        });
        
        const currentBalance = (balance._sum.credit || 0) - (balance._sum.debit || 0);
        
        return {
          ...account,
          balance: currentBalance
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: accountsWithBalance,
      total: accountsWithBalance.length
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/accounts`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(request.headers.get("authorization") && {
          authorization: request.headers.get("authorization")!,
        }),
        ...(request.headers.get("cookie") && {
          cookie: request.headers.get("cookie")!,
        }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Erro no proxy de accounts POST:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
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