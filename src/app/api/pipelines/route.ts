import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRegionAccess } from '@/lib/auth/permissions';

/**
 * GET /api/pipelines?region=JP
 *
 * List active pipelines for a region.
 * Returns pipelines ordered by displayOrder, with default pipeline first.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get('region') || 'JP';

    // Region access control
    try {
      await requireRegionAccess(regionCode);
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Region access denied' }, { status: 403 });
      }
    }

    // Resolve region
    const region = await prisma.region.findUnique({
      where: { code: regionCode },
    });

    if (!region) {
      return NextResponse.json(
        { success: false, error: 'Region not found', message: `No region found with code: ${regionCode}` },
        { status: 404 }
      );
    }

    // Fetch active pipelines for this region
    const pipelines = await prisma.pipeline.findMany({
      where: {
        regionId: region.id,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },  // Default pipeline first
        { displayOrder: 'asc' },
      ],
      select: {
        id: true,
        hubspotId: true,
        name: true,
        isDefault: true,
        displayOrder: true,
      },
    });

    return NextResponse.json({
      success: true,
      pipelines,
    });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pipelines',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
