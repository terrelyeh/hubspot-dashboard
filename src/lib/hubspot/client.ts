/**
 * HubSpot API Client
 *
 * Provides methods to fetch deals from HubSpot CRM API
 * Docs: https://developers.hubspot.com/docs/api/crm/deals
 */

interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    deal_currency_code?: string;
    dealstage: string;
    pipeline: string;
    closedate: string;
    createdate: string;
    hs_lastmodifieddate: string;
    hubspot_owner_id?: string;
    hs_deal_stage_probability?: string;
    hs_forecast_category?: string;
    distributor?: string;
    deploy_time?: string;
    expected_close_date?: string;
  };
  createdAt: string;
  updatedAt: string;
  url?: string; // HubSpot provides the direct URL to the deal
}

interface HubSpotOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface HubSpotPipeline {
  id: string;
  label: string;
  stages: {
    id: string;
    label: string;
    metadata: {
      probability?: string;
    };
  }[];
}

interface HubSpotLineItem {
  id: string;
  properties: {
    name: string;
    quantity: string;
    price: string;
    amount: string;
    description?: string;
    hs_product_id?: string;
  };
}

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    jobtitle?: string;
    phone?: string;
    company?: string;
  };
}

export class HubSpotClient {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch all deals from HubSpot
   * Uses pagination to retrieve all deals
   */
  async fetchDeals(params?: {
    limit?: number;
    after?: string;
    properties?: string[];
    associations?: string[];
  }): Promise<HubSpotDeal[]> {
    const properties = params?.properties || [
      'dealname',
      'amount',
      'deal_currency_code',
      'dealstage',
      'pipeline',
      'closedate',
      'createdate',
      'hs_lastmodifieddate',
      'hubspot_owner_id',
      'hs_deal_stage_probability',
      'hs_forecast_category',
      'distributor',
      'deploy_time',
      'expected_close_date',
    ];

    const queryParams = new URLSearchParams({
      limit: (params?.limit || 100).toString(),
      properties: properties.join(','),
    });

    if (params?.after) {
      queryParams.set('after', params.after);
    }

    if (params?.associations) {
      queryParams.set('associations', params.associations.join(','));
    }

    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/deals?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const deals = data.results || [];

    // Handle pagination
    if (data.paging?.next?.after) {
      const nextDeals = await this.fetchDeals({
        ...params,
        after: data.paging.next.after,
      });
      return [...deals, ...nextDeals];
    }

    return deals;
  }

  /**
   * Fetch deals with filters
   */
  async fetchDealsWithFilters(filters: {
    closeDate?: { start: Date; end: Date };
    dealStage?: string[];
    ownerId?: string;
  }): Promise<HubSpotDeal[]> {
    const filterGroups: any[] = [];

    // Close date filter
    if (filters.closeDate) {
      filterGroups.push({
        filters: [
          {
            propertyName: 'closedate',
            operator: 'GTE',
            value: filters.closeDate.start.getTime().toString(),
          },
          {
            propertyName: 'closedate',
            operator: 'LTE',
            value: filters.closeDate.end.getTime().toString(),
          },
        ],
      });
    }

    // Deal stage filter
    if (filters.dealStage && filters.dealStage.length > 0) {
      filterGroups.push({
        filters: filters.dealStage.map(stage => ({
          propertyName: 'dealstage',
          operator: 'EQ',
          value: stage,
        })),
      });
    }

    // Owner filter
    if (filters.ownerId) {
      filterGroups.push({
        filters: [
          {
            propertyName: 'hubspot_owner_id',
            operator: 'EQ',
            value: filters.ownerId,
          },
        ],
      });
    }

    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/deals/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups,
          properties: [
            'dealname',
            'amount',
            'deal_currency_code',
            'dealstage',
            'pipeline',
            'closedate',
            'createdate',
            'hs_lastmodifieddate',
            'hubspot_owner_id',
            'hs_deal_stage_probability',
            'hs_forecast_category',
          ],
          limit: 100,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Fetch deal owners
   */
  async fetchOwners(): Promise<HubSpotOwner[]> {
    const response = await fetch(`${this.baseUrl}/crm/v3/owners`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Fetch pipelines and their stages
   */
  async fetchPipelines(): Promise<HubSpotPipeline[]> {
    const response = await fetch(
      `${this.baseUrl}/crm/v3/pipelines/deals`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Batch fetch line items by IDs
   */
  async fetchLineItems(lineItemIds: string[]): Promise<HubSpotLineItem[]> {
    if (lineItemIds.length === 0) return [];

    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/line_items/batch/read`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: ['name', 'quantity', 'price', 'amount', 'description', 'hs_product_id'],
          inputs: lineItemIds.map(id => ({ id })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.warn(`Failed to fetch line items: ${response.status} - ${error}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Batch fetch contacts by IDs
   */
  async fetchContacts(contactIds: string[]): Promise<HubSpotContact[]> {
    if (contactIds.length === 0) return [];

    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/contacts/batch/read`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: ['firstname', 'lastname', 'email', 'jobtitle', 'phone', 'company'],
          inputs: contactIds.map(id => ({ id })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.warn(`Failed to fetch contacts: ${response.status} - ${error}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Fetch a single deal with associations (line items, contacts)
   */
  async fetchDealWithAssociations(dealId: string): Promise<{
    deal: HubSpotDeal;
    lineItems: HubSpotLineItem[];
    contacts: HubSpotContact[];
  } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/deals/${dealId}?associations=line_items,contacts`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const deal = await response.json();

      // Fetch line items
      const lineItemIds = deal.associations?.['line items']?.results?.map((r: any) => r.id) || [];
      const lineItems = await this.fetchLineItems(lineItemIds);

      // Fetch contacts
      const contactIds = deal.associations?.contacts?.results?.map((r: any) => r.id) || [];
      const contacts = await this.fetchContacts(contactIds);

      return {
        deal,
        lineItems,
        contacts,
      };
    } catch (error) {
      console.error('Error fetching deal with associations:', error);
      return null;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals?limit=1`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `API error: ${response.status} - ${response.statusText}`,
        };
      }

      return {
        success: true,
        message: 'Successfully connected to HubSpot API',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create HubSpot client instance
 */
export function createHubSpotClient(apiKey?: string): HubSpotClient {
  const key = apiKey || process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_API_KEY_GLOBAL;

  if (!key) {
    throw new Error('HubSpot API key not found. Please set HUBSPOT_API_KEY in .env.local');
  }

  return new HubSpotClient(key);
}
