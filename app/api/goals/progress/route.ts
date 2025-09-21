import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get("tenant_id");
    const userId = searchParams.get("userId");

    // Filtros
    const where: any = { status: 'ACTIVE' };
    if (tenant_id) where.tenant_id = tenant_id;
    if (userId) where.userId = userId;

    // Buscar metas ativas
    const goals = await prisma.goal.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { targetDate: 'asc' }
      ]
    });

    // Calcular progresso de cada meta
    const goalsWithProgress = goals.map(goal => {
      const progress = Number(goal.currentAmount) / Number(goal.targetAmount) * 100;
      const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);
      const daysUntilTarget = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...goal,
        progress: Math.min(progress, 100),
        remaining: Math.max(remaining, 0),
        daysUntilTarget,
        isOverdue: daysUntilTarget < 0,
        isCompleted: progress >= 100
      };
    });

    // Estatísticas gerais
    const totalGoals = goals.length;
    const completedGoals = goalsWithProgress.filter(g => g.isCompleted).length;
    const overdueGoals = goalsWithProgress.filter(g => g.isOverdue && !g.isCompleted).length;
    const averageProgress = totalGoals > 0 
      ? goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / totalGoals 
      : 0;

    const totalTargetAmount = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

    return NextResponse.json({
      success: true,
      data: {
        goals: goalsWithProgress,
        summary: {
          totalGoals,
          completedGoals,
          overdueGoals,
          activeGoals: totalGoals - completedGoals,
          averageProgress: Math.round(averageProgress * 100) / 100,
          totalTargetAmount,
          totalCurrentAmount,
          overallProgress: totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount * 100) : 0
        }
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar progresso das metas:", error);
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