/**
 * HubSpot API Client
 *
 * Provides methods to fetch deals from HubSpot CRM API
 * Docs: https://developers.hubspot.com/docs/api/crm/deals
 *
 * Performance optimizations:
 * - Iterative pagination (no recursion stack overflow risk)
 * - Single retry with backoff for transient errors (429, 502, 503)
 * - Timeout protection for Vercel serverless (7s default)
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
    end_user_location__dr_?: string;
  };
  createdAt: string;
  updatedAt: string;
  url?: string;
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

// Status codes that are safe to retry
const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

// Default deal properties to fetch
const DEFAULT_DEAL_PROPERTIES = [
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
  'end_user_location__dr_',
];

export class HubSpotClient {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';
  private timeout = 7000; // 7 seconds timeout for Vercel Hobby (10s limit)

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout?: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout || this.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout || this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * P1-7: Fetch with single retry for transient errors (429, 502, 503, 504)
   * Uses short backoff to stay within Vercel 10s timeout budget.
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    timeout?: number
  ): Promise<Response> {
    const response = await this.fetchWithTimeout(url, options, timeout);

    if (RETRYABLE_STATUS_CODES.has(response.status)) {
      // Wait 1 second before retry (short to stay within Vercel timeout)
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter ? Math.min(parseInt(retryAfter) * 1000, 2000) : 1000;
      await new Promise(resolve => setTimeout(resolve, waitMs));

      // Single retry
      return this.fetchWithTimeout(url, options, timeout);
    }

    return response;
  }

  /**
   * Standard auth headers
   */
  private get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * P1-6: Fetch all deals using iterative pagination (was recursive — stack overflow risk)
   */
  async fetchDeals(params?: {
    limit?: number;
    after?: string;
    properties?: string[];
    associations?: string[];
  }): Promise<HubSpotDeal[]> {
    const properties = params?.properties || DEFAULT_DEAL_PROPERTIES;
    const allDeals: HubSpotDeal[] = [];
    let after = params?.after;

    // Iterative pagination loop (was recursive)
    do {
      const queryParams = new URLSearchParams({
        limit: (params?.limit || 100).toString(),
        properties: properties.join(','),
      });

      if (after) {
        queryParams.set('after', after);
      }

      if (params?.associations) {
        queryParams.set('associations', params.associations.join(','));
      }

      const response = await this.fetchWithRetry(
        `${this.baseUrl}/crm/v3/objects/deals?${queryParams}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HubSpot API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const deals = data.results || [];
      allDeals.push(...deals);

      // Check for next page
      after = data.paging?.next?.after || null;
    } while (after);

    return allDeals;
  }

  /**
   * P1-8: Fetch deals with filters — now with pagination support
   * Date filtering includes both closeDate and createDate (OR logic)
   */
  async fetchDealsWithFilters(filters: {
    closeDate?: { start: Date; end: Date };
    dealStage?: string[];
    ownerId?: string;
  }): Promise<HubSpotDeal[]> {
    const filterGroups: any[] = [];

    if (filters.closeDate) {
      // Group 1: Close Date in range
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

      // Group 2: Create Date in range
      filterGroups.push({
        filters: [
          {
            propertyName: 'createdate',
            operator: 'GTE',
            value: filters.closeDate.start.getTime().toString(),
          },
          {
            propertyName: 'createdate',
            operator: 'LTE',
            value: filters.closeDate.end.getTime().toString(),
          },
        ],
      });
    }

    const allDeals: HubSpotDeal[] = [];
    let after: string | null = null;

    // Iterative pagination for search API
    do {
      const body: any = {
        filterGroups,
        properties: DEFAULT_DEAL_PROPERTIES,
        limit: 100,
      };

      if (after) {
        body.after = after;
      }

      const response = await this.fetchWithRetry(
        `${this.baseUrl}/crm/v3/objects/deals/search`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HubSpot API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const deals = data.results || [];
      allDeals.push(...deals);

      // Check for next page
      after = data.paging?.next?.after || null;
    } while (after);

    return allDeals;
  }

  /**
   * Fetch deal owners
   */
  async fetchOwners(): Promise<HubSpotOwner[]> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/crm/v3/owners`,
      { headers: this.headers }
    );

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
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/crm/v3/pipelines/deals`,
      { headers: this.headers }
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

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/crm/v3/objects/line_items/batch/read`,
      {
        method: 'POST',
        headers: this.headers,
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

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/crm/v3/objects/contacts/batch/read`,
      {
        method: 'POST',
        headers: this.headers,
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
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/crm/v3/objects/deals/${dealId}?associations=line_items,contacts`,
        { headers: this.headers }
      );

      if (!response.ok) {
        return null;
      }

      const deal = await response.json();

      // Fetch line items and contacts in parallel
      const lineItemIds = deal.associations?.['line items']?.results?.map((r: any) => r.id) || [];
      const contactIds = deal.associations?.contacts?.results?.map((r: any) => r.id) || [];

      const [lineItems, contacts] = await Promise.all([
        this.fetchLineItems(lineItemIds),
        this.fetchContacts(contactIds),
      ]);

      return { deal, lineItems, contacts };
    } catch (error) {
      console.error('Error fetching deal with associations:', error);
      return null;
    }
  }

  /**
   * Fetch line item associations for a single deal
   */
  async fetchDealLineItemAssociations(dealId: string): Promise<string[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/crm/v4/objects/deals/${dealId}/associations/line_items`,
        { headers: this.headers }
      );

      if (!response.ok) {
        if (response.status !== 404) {
          console.warn(`Failed to fetch line item associations for deal ${dealId}: ${response.status}`);
        }
        return [];
      }

      const data = await response.json();
      return data.results?.map((r: any) => r.toObjectId) || [];
    } catch (error) {
      console.warn(`Error fetching line item associations for deal ${dealId}:`, error);
      return [];
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/crm/v3/objects/deals?limit=1`,
        { headers: this.headers }
      );

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
