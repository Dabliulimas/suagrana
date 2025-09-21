import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const skip = (page - 1) * limit;

    // Buscar transações com paginação
    const transactions = await prisma.transaction.findMany({
      take: limit,
      skip: skip,
      orderBy: {
        date: 'desc'
      },
      include: {
        entries: {
          include: {
            accounts: true,
            categories: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.transaction.count();

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
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
    
    // Validação básica dos dados necessários
    if (!body.description || !body.date || !body.created_by || !body.tenant_id || !body.entries) {
      return NextResponse.json(
        { 
          success: false,
          error: "Dados obrigatórios não fornecidos",
          required: ["description", "date", "created_by", "tenant_id", "entries"]
        },
        { status: 400 }
      );
    }

    // Criar transação com entries
    const transaction = await prisma.transaction.create({
      data: {
        description: body.description,
        date: new Date(body.date),
        status: body.status || "COMPLETED",
        tags: body.tags,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        created_by: body.created_by,
        tenant_id: body.tenant_id,
        external_id: body.external_id,
        reference: body.reference,
        entries: {
          create: body.entries.map((entry: any) => ({
            id: entry.id || crypto.randomUUID(),
            account_id: entry.account_id,
            category_id: entry.category_id,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            description: entry.description
          }))
        }
      },
      include: {
        entries: {
          include: {
            accounts: true,
            categories: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: transaction,
      message: "Transação criada com sucesso"
    }, {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Erro ao criar transação:", error);
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