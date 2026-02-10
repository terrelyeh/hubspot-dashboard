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

    // Fetch targets for each quarter
    let targetAmount = 0;
    const quartersWithTargets: { year: number; quarter: number; amount: number }[] = [];
    const quartersMissingTargets: { year: number; quarter: number }[] = [];

    for (const q of quartersInRange) {
      let target = null;

      if (ownerName && ownerName !== 'All') {
        // Try to find owner-specific target first
        target = await prisma.target.findFirst({
          where: {
            regionId: region.id,
            year: q.year,
            quarter: q.quarter,
            ownerName: ownerName,
          },
        });
      }

      // If no owner-specific target or owner is 'All', get region-level target
      if (!target) {
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
    });
  } catch (error) {
    console.error('Owner targets API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
