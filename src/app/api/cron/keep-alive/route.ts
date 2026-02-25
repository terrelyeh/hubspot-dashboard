import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/cron/keep-alive
 *
 * Keeps the Supabase database alive by pinging it periodically.
 * Supabase free tier pauses projects after 7 days of inactivity.
 *
 * Invoked by Vercel Cron (see vercel.json) every 3 days.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const start = Date.now();

    // Lightweight ping — just enough to keep the project active
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - start;

    console.log(`[keep-alive] DB ping OK (${duration}ms)`);

    return NextResponse.json({
      success: true,
      message: 'Database is alive',
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[keep-alive] DB ping failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
