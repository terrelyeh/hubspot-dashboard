import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHubSpotClient } from '@/lib/hubspot/client';

/**
 * GET /api/deals/[id]
 *
 * Get detailed deal information including line items and contacts from HubSpot
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;

    // Fetch deal from database
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        region: true,
      },
    });

    if (!deal) {
      return NextResponse.json(
        { success: false, message: 'Deal not found' },
        { status: 404 }
      );
    }

    // If this is a mock deal, return without fetching from HubSpot
    if (deal.hubspotId.startsWith('mock-')) {
      return NextResponse.json({
        success: true,
        deal: {
          ...deal,
          lineItems: [],
          contacts: [],
        },
      });
    }

    // Fetch line items and contacts from HubSpot
    try {
      // Select the correct API key based on the deal's region (supports any region)
      const regionCode = deal.region.code;
      const apiKey = process.env[`HUBSPOT_API_KEY_${regionCode}`];

      if (!apiKey) {
        console.error(`No API key found for region: ${regionCode}`);
        throw new Error(`HubSpot API key not configured for region: ${regionCode}. Please add HUBSPOT_API_KEY_${regionCode} to environment variables.`);
      }

      const client = createHubSpotClient(apiKey);
      const hubspotData = await client.fetchDealWithAssociations(deal.hubspotId);

      if (!hubspotData) {
        // Return deal without associations if HubSpot fetch fails
        return NextResponse.json({
          success: true,
          deal: {
            ...deal,
            lineItems: [],
            contacts: [],
          },
        });
      }

      // Format line items
      const lineItems = hubspotData.lineItems.map(item => ({
        id: item.id,
        name: item.properties.name,
        description: item.properties.description || null,
        quantity: parseFloat(item.properties.quantity || '0'),
        price: parseFloat(item.properties.price || '0'),
        amount: parseFloat(item.properties.amount || '0'),
        productId: item.properties.hs_product_id || null,
      }));

      // Format contacts
      const contacts = hubspotData.contacts.map(contact => ({
        id: contact.id,
        firstName: contact.properties.firstname || null,
        lastName: contact.properties.lastname || null,
        fullName: [contact.properties.firstname, contact.properties.lastname]
          .filter(Boolean)
          .join(' ') || 'Unknown',
        email: contact.properties.email || null,
        jobTitle: contact.properties.jobtitle || null,
        phone: contact.properties.phone || null,
        company: contact.properties.company || null,
      }));

      return NextResponse.json({
        success: true,
        deal: {
          id: deal.id,
          hubspotId: deal.hubspotId,
          name: deal.name,
          amount: deal.amountUsd,
          currency: deal.currency,
          stage: deal.stage,
          probability: deal.stageProbability,
          forecastCategory: deal.forecastCategory || 'Pipeline',
          closeDate: deal.closeDate.toISOString(),
          owner: deal.ownerName || 'Unassigned',
          ownerEmail: deal.ownerEmail,
          priority: deal.priority,
          description: deal.description,
          distributor: deal.distributor,
          numContacts: contacts.length,
          hubspotUrl: deal.hubspotUrl,
          region: {
            code: deal.region.code,
            name: deal.region.name,
          },
          lineItems,
          contacts,
        },
      });
    } catch (error) {
      console.error('Error fetching HubSpot data:', error);

      // Return deal without associations if HubSpot API fails
      return NextResponse.json({
        success: true,
        deal: {
          ...deal,
          lineItems: [],
          contacts: [],
        },
      });
    }
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
