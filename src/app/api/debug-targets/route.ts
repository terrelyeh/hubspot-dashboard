import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/debug-targets?region=JP
 * Temporary debug endpoint to check target + pipeline state in DB
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get('region') || 'JP';

    const region = await prisma.region.findUnique({
      where: { code: regionCode },
    });

    if (!region) {
      return NextResponse.json({ error: 'Region not found' });
    }

    // Get all pipelines for this region
    const pipelines = await prisma.pipeline.findMany({
      where: { regionId: region.id },
      select: { id: true, hubspotId: true, name: true, isDefault: true },
    });

    // Get all targets for this region (with their pipelineId)
    const targets = await prisma.target.findMany({
      where: { regionId: region.id },
      select: {
        id: true,
        year: true,
        quarter: true,
        amount: true,
        ownerName: true,
        pipelineId: true,
      },
    });

    // For each pipeline, show what targets would be found
    const pipelineTargetCheck = pipelines.map(p => {
      const matchingTargets = targets.filter(t => t.pipelineId === p.id);
      const nullTargets = targets.filter(t => t.pipelineId === null);
      return {
        pipeline: p.name,
        pipelineDbId: p.id,
        hubspotId: p.hubspotId,
        isDefault: p.isDefault,
        matchingTargets: matchingTargets.length,
        matchingTargetDetails: matchingTargets,
        nullPipelineTargets: nullTargets.length,
      };
    });

    return NextResponse.json({
      region: regionCode,
      regionDbId: region.id,
      totalPipelines: pipelines.length,
      totalTargets: targets.length,
      allTargets: targets,
      pipelineTargetCheck,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
