import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stages = await prisma.pipelineStage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      stages: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        code: stage.code,
        probability: stage.probability,
        displayOrder: stage.displayOrder,
        isFinal: stage.isFinal,
        isWon: stage.isWon,
        color: stage.color,
        description: stage.description,
      })),
      total: stages.length,
    });
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch pipeline stages',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
