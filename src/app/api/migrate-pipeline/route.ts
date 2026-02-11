import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/migrate-pipeline
 *
 * Migrates legacy data (pipelineId = null) to each region's default pipeline:
 * - Targets with pipelineId = null → assigned to default pipeline
 * - Deals with pipelineId = null → assigned to default pipeline
 *
 * Safe to run multiple times (idempotent).
 * Should be run once after the pipeline feature is deployed and synced.
 */
export async function POST() {
  try {
    // Find all regions that have pipelines
    const regions = await prisma.region.findMany({
      where: { isActive: true },
      include: {
        pipelines: {
          where: { isActive: true },
          orderBy: [
            { isDefault: 'desc' },
            { displayOrder: 'asc' },
          ],
        },
      },
    });

    const results: {
      region: string;
      defaultPipeline: string;
      targetsMigrated: number;
      dealsMigrated: number;
    }[] = [];

    for (const region of regions) {
      if (region.pipelines.length === 0) {
        continue; // Skip regions without pipelines (not yet synced)
      }

      const defaultPipeline = region.pipelines.find(p => p.isDefault) || region.pipelines[0];

      // Migrate targets with pipelineId = null
      const targetResult = await prisma.target.updateMany({
        where: {
          regionId: region.id,
          pipelineId: null,
        },
        data: {
          pipelineId: defaultPipeline.id,
        },
      });

      // Migrate deals with pipelineId = null
      const dealResult = await prisma.deal.updateMany({
        where: {
          regionId: region.id,
          pipelineId: null,
        },
        data: {
          pipelineId: defaultPipeline.id,
        },
      });

      results.push({
        region: region.code,
        defaultPipeline: defaultPipeline.name,
        targetsMigrated: targetResult.count,
        dealsMigrated: dealResult.count,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
