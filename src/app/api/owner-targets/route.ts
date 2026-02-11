/**
 * Owner-specific Targets API
 *
 * Returns target data for a specific owner within a region.
 * Used for Goal Progress when filtering by Deal Owner.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    const value = amount / 1000000;
    const formatted = value.toFixed(1);
    return formatted.endsWith('.0') ? `$${value.toFixed(0)}M` : `$${formatted}M`;
  } else if (amount >= 1000) {
    const value = amount / 1000;
    const formatted = value.toFixed(1);
    return formatted.endsWith('.0') ? `$${value.toFixed(0)}K` : `$${formatted}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get('region');
    const pipelineCode = searchParams.get('pipeline'); // HubSpot pipeline ID
    const ownerName = searchParams.get('owner');
    const startYear = parseInt(searchParams.get('startYear') || new Date().getFullYear().toString());
    const startQuarter = parseInt(searchParams.get('startQuarter') || '1');
    const endYear = parseInt(searchParams.get('endYear') || new Date().getFullYear().toString());
    const endQuarter = parseInt(searchParams.get('endQuarter') || '4');

    if (!regionCode) {
      return NextResponse.json(
        { success: false, error: 'Region is required' },
        { status: 400 }
      );
    }

    // Find region
    const region = await prisma.region.findUnique({
      where: { code: regionCode },
    });

    if (!region) {
      return NextResponse.json(
        { success: false, error: 'Region not found' },
        { status: 404 }
      );
    }

    // Resolve pipeline if provided
    let pipelineId: string | undefined;
    if (pipelineCode) {
      const pipeline = await prisma.pipeline.findFirst({
        where: { regionId: region.id, hubspotId: pipelineCode, isActive: true },
      });
      if (pipeline) {
        pipelineId = pipeline.id;
      }
    }
    const pipelineFilter = pipelineId ? { pipelineId } : {};

    // Build quarters in range
    const quartersInRange: { year: number; quarter: number }[] = [];
    let currentYear = startYear;
    let currentQuarter = startQuarter;

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentQuarter <= endQuarter)
    ) {
      quartersInRange.push({ year: currentYear, quarter: currentQuarter });
      currentQuarter++;
      if (currentQuarter > 4) {
        currentQuarter = 1;
        currentYear++;
      }
    }

    // Track if we're querying for a specific owner (not 'All')
    const isQueryingSpecificOwner = ownerName && ownerName !== 'All';

    // Check if ANY owner-specific targets exist in this region (for the date range)
    // This determines whether we should show "Target Not Set" or fallback to region target
    let regionHasAnyOwnerTargets = false;
    if (isQueryingSpecificOwner) {
      const anyOwnerTarget = await prisma.target.findFirst({
        where: {
          regionId: region.id,
          ...pipelineFilter,
          ownerName: { not: null }, // Any owner-specific target
        },
      });
      regionHasAnyOwnerTargets = !!anyOwnerTarget;
    }

    // Fetch targets for each quarter
    let targetAmount = 0;
    const quartersWithTargets: { year: number; quarter: number; amount: number }[] = [];
    const quartersMissingTargets: { year: number; quarter: number }[] = [];

    // Track if this specific owner has their own target
    let hasOwnerTarget = false;

    for (const q of quartersInRange) {
      let target = null;

      if (isQueryingSpecificOwner) {
        // First, try to find owner-specific target
        target = await prisma.target.findFirst({
          where: {
            regionId: region.id,
            ...pipelineFilter,
            year: q.year,
            quarter: q.quarter,
            ownerName: ownerName,
          },
        });

        if (target) {
          hasOwnerTarget = true;
        } else if (!regionHasAnyOwnerTargets) {
          // If no one in this region has owner-specific targets,
          // fallback to region-level target (team shares the same goal)
          target = await prisma.target.findFirst({
            where: {
              regionId: region.id,
              ...pipelineFilter,
              year: q.year,
              quarter: q.quarter,
              ownerName: null,
            },
          });
        }
        // If regionHasAnyOwnerTargets but this owner doesn't have one,
        // don't fallback - show "Target Not Set" instead
      } else {
        // For 'All' or no owner specified, get region-level target
        target = await prisma.target.findFirst({
          where: {
            regionId: region.id,
            year: q.year,
            quarter: q.quarter,
            ownerName: null,
          },
        });
      }

      if (target) {
        targetAmount += target.amount;
        quartersWithTargets.push({ year: q.year, quarter: q.quarter, amount: target.amount });
      } else {
        quartersMissingTargets.push({ year: q.year, quarter: q.quarter });
      }
    }

    // Determine if we should show "Target Not Set" UI
    // Only show it when:
    // 1. Querying a specific owner AND
    // 2. The region has some owner-specific targets (meaning they use personal targets) AND
    // 3. This specific owner doesn't have their own target
    const shouldShowTargetNotSet = isQueryingSpecificOwner && regionHasAnyOwnerTargets && !hasOwnerTarget;

    return NextResponse.json({
      success: true,
      owner: ownerName || 'All',
      region: regionCode,
      targetAmount,
      targetAmountFormatted: formatCurrency(targetAmount),
      quartersWithTargets,
      quartersMissingTargets,
      isComplete: quartersMissingTargets.length === 0,
      coveredQuarters: quartersWithTargets.length,
      totalQuarters: quartersInRange.length,
      // Indicates if the owner has their own target set
      hasOwnerTarget: isQueryingSpecificOwner ? (hasOwnerTarget || !regionHasAnyOwnerTargets) : true,
      // Additional context
      regionHasAnyOwnerTargets,
    });
  } catch (error) {
    console.error('Owner targets API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
