import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verificar se há transações
    const transactionCount = await prisma.transaction.count();
    
    // Buscar todas as transações simples primeiro
    const allTransactions = await prisma.transaction.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          transactions: transactionCount
        },
        allTransactions,
        summary: {
          totalTransactions: allTransactions.length
        }
      }
    });
  } catch (error) {
    console.error('Erro no debug:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}