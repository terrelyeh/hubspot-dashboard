import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission, requireRegionAccess } from '@/lib/auth/permissions';

/**
 * GET /api/targets
 *
 * List all targets with optional filtering
 *
 * Query params:
 *   - region: string (optional) - Filter by region code
 *   - year: number (optional) - Filter by year
 *   - quarter: number (optional) - Filter by quarter
 *   - owner: string (optional) - Filter by owner name (empty string for region-level only)
 *
 * Response:
 *   - targets: Array of target objects with region info
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const regionCode = searchParams.get('region');
    const pipelineCode = searchParams.get('pipeline'); // HubSpot pipeline ID
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : undefined;
    const owner = searchParams.get('owner');

    // Build where clause
    const where: any = {};

    if (regionCode) {
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

      const region = await prisma.region.findUnique({
        where: { code: regionCode },
      });

      if (!region) {
        return NextResponse.json(
          {
            success: false,
            error: 'Region not found',
            message: `No region found with code: ${regionCode}`,
          },
          { status: 404 }
        );
      }

      where.regionId = region.id;

      // Resolve pipeline if provided
      if (pipelineCode) {
        const pipeline = await prisma.pipeline.findFirst({
          where: { regionId: region.id, hubspotId: pipelineCode, isActive: true },
        });
        if (pipeline) {
          where.pipelineId = pipeline.id;
        }
      }
    }

    if (year !== undefined) {
      where.year = year;
    }

    if (quarter !== undefined) {
      where.quarter = quarter;
    }

    if (owner !== undefined && owner !== null) {
      // If owner is empty string, filter for region-level targets (ownerName = null)
      // Otherwise, filter for specific owner
      where.ownerName = owner === '' ? null : owner;
    }

    // Fetch targets
    const targets = await prisma.target.findMany({
      where,
      include: {
        region: {
          select: {
            code: true,
            name: true,
            currency: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { quarter: 'desc' },
        { region: { code: 'asc' } },
        { ownerName: 'asc' },
      ],
    });

    // Format response
    const formattedTargets = targets.map(target => ({
      id: target.id,
      region: target.region,
      year: target.year,
      quarter: target.quarter,
      ownerName: target.ownerName,
      targetType: target.ownerName ? 'owner' : 'region',
      amount: target.amount,
      currency: target.currency,
      amountFormatted: target.currency === 'JPY'
        ? `¥${(target.amount / 1000000).toFixed(2)}M`
        : `$${(target.amount / 1000000).toFixed(2)}M`,
      notes: target.notes,
      createdAt: target.createdAt.toISOString(),
      updatedAt: target.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      targets: formattedTargets,
      total: formattedTargets.length,
    });
  } catch (error) {
    console.error('Error fetching targets:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch targets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/targets
 *
 * Create a new target or update existing one
 *
 * Body:
 *   - regionCode: string (required)
 *   - year: number (required)
 *   - quarter: number (required, 1-4)
 *   - amount: number (required)
 *   - ownerName: string (optional) - null or omitted for region-level target
 *   - notes: string (optional)
 *
 * Response:
 *   - target: Created/updated target object
 */
export async function POST(request: Request) {
  try {
    // 權限檢查：只有 ADMIN 和 MANAGER 可以編輯目標
    await requirePermission('EDIT_TARGETS');

    const body = await request.json();
    const { regionCode, year, quarter, amount, ownerName, currency, notes, pipelineHubspotId } = body;

    // Region access control
    if (regionCode) {
      try {
        await requireRegionAccess(regionCode);
      } catch (error: any) {
        if (error.message === 'Forbidden') {
          return NextResponse.json({ error: 'Region access denied' }, { status: 403 });
        }
      }
    }

    // Validate required fields
    if (!regionCode || !year || !quarter || amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'regionCode, year, quarter, and amount are required',
        },
        { status: 400 }
      );
    }

    // Validate quarter
    if (quarter < 1 || quarter > 4) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid quarter',
          message: 'quarter must be between 1 and 4',
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount',
          message: 'amount must be a positive number',
        },
        { status: 400 }
      );
    }

    // Find region
    const region = await prisma.region.findUnique({
      where: { code: regionCode },
    });

    if (!region) {
      return NextResponse.json(
        {
          success: false,
          error: 'Region not found',
          message: `No region found with code: ${regionCode}`,
        },
        { status: 404 }
      );
    }

    // Resolve pipeline if provided
    let pipelineId: string | null = null;
    if (pipelineHubspotId) {
      const pipeline = await prisma.pipeline.findFirst({
        where: { regionId: region.id, hubspotId: pipelineHubspotId, isActive: true },
      });
      if (pipeline) {
        pipelineId = pipeline.id;
      }
    }

    // Find existing target first (to handle null ownerName properly)
    const existingTarget = await prisma.target.findFirst({
      where: {
        regionId: region.id,
        pipelineId: pipelineId,
        year,
        quarter,
        ownerName: ownerName || null,
      },
    });

    let target;
    if (existingTarget) {
      // Update existing target
      target = await prisma.target.update({
        where: { id: existingTarget.id },
        data: {
          amount,
          currency: currency || 'USD',
          notes: notes || null,
        },
        include: {
          region: {
            select: {
              code: true,
              name: true,
              currency: true,
            },
          },
        },
      });
    } else {
      // Create new target
      target = await prisma.target.create({
        data: {
          regionId: region.id,
          pipelineId: pipelineId,
          year,
          quarter,
          ownerName: ownerName || null,
          amount,
          currency: currency || 'USD',
          notes: notes || null,
        },
        include: {
          region: {
            select: {
              code: true,
              name: true,
              currency: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      target: {
        id: target.id,
        region: target.region,
        year: target.year,
        quarter: target.quarter,
        ownerName: target.ownerName,
        targetType: target.ownerName ? 'owner' : 'region',
        amount: target.amount,
        currency: target.currency,
        amountFormatted: target.currency === 'JPY'
          ? `¥${(target.amount / 1000000).toFixed(2)}M`
          : `$${(target.amount / 1000000).toFixed(2)}M`,
        notes: target.notes,
        createdAt: target.createdAt.toISOString(),
        updatedAt: target.updatedAt.toISOString(),
      },
      message: 'Target saved successfully',
    });
  } catch (error: any) {
    console.error('Error creating/updating target:', error);

    // 處理權限錯誤
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save target',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/targets
 *
 * Delete a target
 *
 * Query params:
 *   - id: string (required) - Target ID to delete
 *
 * Response:
 *   - message: Success message
 */
export async function DELETE(request: Request) {
  try {
    // 權限檢查：只有 ADMIN 和 MANAGER 可以刪除目標
    await requirePermission('EDIT_TARGETS');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter',
          message: 'id parameter is required',
        },
        { status: 400 }
      );
    }

    // Check if target exists
    const existingTarget = await prisma.target.findUnique({
      where: { id },
      include: { region: { select: { code: true } } },
    });

    if (!existingTarget) {
      return NextResponse.json(
        {
          success: false,
          error: 'Target not found',
          message: `No target found with id: ${id}`,
        },
        { status: 404 }
      );
    }

    // Region access control for the target's region
    try {
      await requireRegionAccess(existingTarget.region.code);
    } catch (error: any) {
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Region access denied' }, { status: 403 });
      }
    }

    // Delete target
    await prisma.target.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Target deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting target:', error);

    // 處理權限錯誤
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete target',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
