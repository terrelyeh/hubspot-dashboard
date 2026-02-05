import { NextResponse } from 'next/server';
import { createHubSpotClient } from '@/lib/hubspot/client';

/**
 * GET /api/hubspot/test
 *
 * Test HubSpot API connection
 *
 * Query params:
 *   - apiKey: string (optional) - Test with specific API key
 *
 * Response:
 *   - success: boolean
 *   - message: string
 *   - details: object (if successful)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey') || undefined;

    // Create client
    const client = createHubSpotClient(apiKey);

    // Test connection
    const testResult = await client.testConnection();

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: testResult.message,
        },
        { status: 400 }
      );
    }

    // Fetch sample data to verify access
    const details: any = {
      scopes: {
        deals: { granted: false, error: null },
        owners: { granted: false, error: null },
        pipelines: { granted: false, error: null },
      },
    };

    // Test deals access
    try {
      const deals = await client.fetchDeals({ limit: 5 });
      details.scopes.deals.granted = true;
      details.dealsCount = deals.length;
      details.sampleDeal = deals[0] || null;
    } catch (error) {
      details.scopes.deals.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test owners access
    try {
      const owners = await client.fetchOwners();
      details.scopes.owners.granted = true;
      details.ownersCount = owners.length;
    } catch (error) {
      details.scopes.owners.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test pipelines access
    try {
      const pipelines = await client.fetchPipelines();
      details.scopes.pipelines.granted = true;
      details.pipelinesCount = pipelines.length;
    } catch (error) {
      details.scopes.pipelines.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check if at least deals access is granted
    const allGranted = details.scopes.deals.granted && details.scopes.owners.granted && details.scopes.pipelines.granted;
    const message = allGranted
      ? 'Successfully connected to HubSpot API with all required scopes'
      : details.scopes.deals.granted
      ? 'Connected to HubSpot API, but some scopes are missing. Please grant all required scopes for full functionality.'
      : 'Failed to access HubSpot deals. Please check your API key and scopes.';

    return NextResponse.json({
      success: details.scopes.deals.granted,
      message,
      details,
    });
  } catch (error) {
    console.error('Error testing HubSpot connection:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: 'Failed to connect to HubSpot API',
      },
      { status: 500 }
    );
  }
}
