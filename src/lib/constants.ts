// Stage definitions
export const DEFAULT_STAGES = [
  { name: 'Lead', probability: 10 },
  { name: 'Qualified', probability: 30 },
  { name: 'Proposal', probability: 50 },
  { name: 'Negotiation', probability: 75 },
  { name: 'Contract', probability: 90 },
  { name: 'Closed Won', probability: 100 },
] as const;

// Currency multipliers (for mock data generation)
export const REGION_MULTIPLIERS = {
  US: 1.0,
  APAC: 0.8,
  IN: 0.5,
  JP: 0.7,
  EU: 0.9,
} as const;

// Exchange rate approximations (for mock data)
export const MOCK_EXCHANGE_RATES = {
  USD: 1.0,
  JPY: 0.0091,  // ~110 JPY = 1 USD
  INR: 0.013,   // ~75 INR = 1 USD
} as const;

// Date helpers
export const Q3_2024_START = new Date('2024-07-01');
export const Q3_2024_END = new Date('2024-09-30');
