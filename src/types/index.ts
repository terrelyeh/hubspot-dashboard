// Core domain types
export interface RegionConfig {
  code: string;
  name: string;
  currency: 'USD' | 'JPY' | 'INR';
  timezone: string;
  flag: string;
  isActive: boolean;
  hubspot: {
    accountId: string;
    portalId: string;
    apiEndpoint: string;
  };
  team: Array<{
    name: string;
    role: string;
    email: string;
  }>;
  pipeline: {
    defaultStages: Array<{
      name: string;
      probability: number;
    }>;
  };
  content: string; // Markdown body
}

export interface DealStage {
  name: string;
  probability: number;
}

export interface ExchangeRateData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
}

export interface SyncResult {
  regionCode: string;
  success: boolean;
  dealsProcessed: number;
  dealsCreated: number;
  dealsUpdated: number;
  dealsFailed: number;
  duration: number;
  error?: string;
}
