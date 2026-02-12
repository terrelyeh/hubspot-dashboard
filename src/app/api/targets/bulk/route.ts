import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRegionAccess, requirePermission } from '@/lib/auth/permissions';

/**
 * POST /api/targets/bulk
 *
 * Perform bulk operations on targets
 *
 * Body:
 *   - operation: 'copy' | 'applyGrowth'
 *   - sourceYear: number (required for copy)
 *   - sourceQuarter: number (required for copy)
 *   - targetYear: number (required)
 *   - targetQuarter: number (required)
 *   - growthRate: number (optional, percentage e.g., 10 for 10%)
 *   - regions: string[] (optional, specific regions to apply to)
 *
 * Response:
 *   - created: number - Count of targets created
 *   - updated: number - Count of targets updated
 *   - targets: Array of created/updated targets
 */
export async function POST(request: Request) {
  try {
    // 權限檢查：只有 ADMIN 和 MANAGER 可以執行批量操作
    await requirePermission('EDIT_TARGETS');

    const body = await request.json();
    const {
      operation,
      sourceYear,
      sourceQuarter,
      targetYear,
      targetQuarter,
      growthRate,
      regions: regionCodes,
      pipelineHubspotId,
    } = body;

    // Validate operation
    if (!operation || !['copy', 'applyGrowth'].includes(operation)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid operation',
          message: 'operation must be "copy" or "applyGrowth"',
        },
        { status: 400 }
      );
    }

    // Validate target period
    if (!targetYear || !targetQuarter) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'targetYear and targetQuarter are required',
        },
        { status: 400 }
      );
    }

    if (targetQuarter < 1 || targetQuarter > 4) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid quarter',
          message: 'targetQuarter must be between 1 and 4',
        },
        { status: 400 }
      );
    }

    // Resolve pipeline filter if provided
    let pipelineId: string | null = null;
    if (pipelineHubspotId) {
      const pipeline = await prisma.pipeline.findFirst({
        where: { hubspotId: pipelineHubspotId, isActive: true },
      });
      if (pipeline) {
        pipelineId = pipeline.id;
      }
    }
    const pipelineFilter = pipelineId ? { pipelineId } : {};

    let created = 0;
    let updated = 0;
    const results: any[] = [];

    if (operation === 'copy') {
      // Validate source period
      if (!sourceYear || !sourceQuarter) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields',
            message: 'sourceYear and sourceQuarter are required for copy operation',
          },
          { status: 400 }
        );
      }

      if (sourceQuarter < 1 || sourceQuarter > 4) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid quarter',
            message: 'sourceQuarter must be between 1 and 4',
          },
          { status: 400 }
        );
      }

      // Build where clause for source targets
      const sourceWhere: any = {
        year: sourceYear,
        quarter: sourceQuarter,
        ...pipelineFilter,
      };

      // Filter by specific regions if provided
      if (regionCodes && regionCodes.length > 0) {
        // Region access control for each region
        for (const code of regionCodes) {
          try {
            await requireRegionAccess(code);
          } catch (error: any) {
            if (error.message === 'Forbidden') {
              return NextResponse.json({ error: `Region access denied: ${code}` }, { status: 403 });
            }
          }
        }

        const regionsToInclude = await prisma.region.findMany({
          where: { code: { in: regionCodes } },
        });

        sourceWhere.regionId = {
          in: regionsToInclude.map(r => r.id),
        };
      }

      // Fetch source targets
      const sourceTargets = await prisma.target.findMany({
        where: sourceWhere,
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

      if (sourceTargets.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No source targets found',
            message: `No targets found for Q${sourceQuarter} ${sourceYear}`,
          },
          { status: 404 }
        );
      }

      // Apply growth rate if provided
      const multiplier = growthRate ? 1 + growthRate / 100 : 1;

      // Copy targets to new period
      for (const source of sourceTargets) {
        const newAmount = Math.round(source.amount * multiplier);

        // Check if target already exists
        const existing = await prisma.target.findFirst({
          where: {
            regionId: source.regionId,
            ...pipelineFilter,
            year: targetYear,
            quarter: targetQuarter,
            ownerName: source.ownerName || null,
          },
        });

        let target;
        if (existing) {
          // Update existing
          target = await prisma.target.update({
            where: { id: existing.id },
            data: {
              amount: newAmount,
              notes: growthRate
                ? `Copied from Q${sourceQuarter} ${sourceYear} with ${growthRate}% growth`
                : `Copied from Q${sourceQuarter} ${sourceYear}`,
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
          // Create new
          target = await prisma.target.create({
            data: {
              regionId: source.regionId,
              pipelineId: pipelineId,
              year: targetYear,
              quarter: targetQuarter,
              ownerName: source.ownerName || null,
              amount: newAmount,
              notes: growthRate
                ? `Copied from Q${sourceQuarter} ${sourceYear} with ${growthRate}% growth`
                : `Copied from Q${sourceQuarter} ${sourceYear}`,
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

        // Determine if it was created or updated (for logging purposes)
        const wasNew = !existing;

        if (wasNew) {
          created++;
        } else {
          updated++;
        }

        results.push({
          id: target.id,
          region: target.region,
          year: target.year,
          quarter: target.quarter,
          amount: target.amount,
          amountFormatted: `$${(target.amount / 1000000).toFixed(2)}M`,
          notes: target.notes,
        });
      }
    } else if (operation === 'applyGrowth') {
      // Validate growth rate
      if (growthRate === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required field',
            message: 'growthRate is required for applyGrowth operation',
          },
          { status: 400 }
        );
      }

      // Build where clause for targets to update
      const targetWhere: any = {
        year: targetYear,
        quarter: targetQuarter,
        ...pipelineFilter,
      };

      if (regionCodes && regionCodes.length > 0) {
        // Region access control for each region
        for (const code of regionCodes) {
          try {
            await requireRegionAccess(code);
          } catch (error: any) {
            if (error.message === 'Forbidden') {
              return NextResponse.json({ error: `Region access denied: ${code}` }, { status: 403 });
            }
          }
        }

        const regionsToInclude = await prisma.region.findMany({
          where: { code: { in: regionCodes } },
        });

        targetWhere.regionId = {
          in: regionsToInclude.map(r => r.id),
        };
      }

      // Fetch existing targets
      const existingTargets = await prisma.target.findMany({
        where: targetWhere,
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

      if (existingTargets.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No targets found',
            message: `No targets found for Q${targetQuarter} ${targetYear}`,
          },
          { status: 404 }
        );
      }

      const multiplier = 1 + growthRate / 100;

      // Apply growth rate to existing targets
      for (const existing of existingTargets) {
        const newAmount = Math.round(existing.amount * multiplier);

        const target = await prisma.target.update({
          where: { id: existing.id },
          data: {
            amount: newAmount,
            notes: `Applied ${growthRate}% growth rate`,
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

        updated++;

        results.push({
          id: target.id,
          region: target.region,
          year: target.year,
          quarter: target.quarter,
          amount: target.amount,
          amountFormatted: `$${(target.amount / 1000000).toFixed(2)}M`,
          notes: target.notes,
        });
      }
    }

    return NextResponse.json({
      success: true,
      operation,
      created,
      updated,
      targets: results,
      message: `Successfully ${operation === 'copy' ? 'copied' : 'updated'} ${created + updated} targets`,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform bulk operation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
