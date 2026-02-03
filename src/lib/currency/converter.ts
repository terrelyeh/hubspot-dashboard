import { prisma } from '@/lib/db';
import { MOCK_EXCHANGE_RATES } from '@/lib/constants';

interface ConversionResult {
  amountUsd: number;
  exchangeRate: number;
}

/**
 * Convert amount to USD
 * Priority:
 * 1. Use cached rate from database
 * 2. Fetch from external API (future)
 * 3. Use mock rates (development)
 */
export async function convertToUSD(
  amount: number,
  fromCurrency: string,
  date: Date = new Date()
): Promise<ConversionResult> {
  // Already USD
  if (fromCurrency === 'USD') {
    return { amountUsd: amount, exchangeRate: 1.0 };
  }

  // Get date without time
  const dateOnly = new Date(date.toISOString().split('T')[0]);

  // Check database cache
  const cached = await prisma.exchangeRate.findUnique({
    where: {
      fromCurrency_toCurrency_date: {
        fromCurrency,
        toCurrency: 'USD',
        date: dateOnly,
      },
    },
  });

  if (cached) {
    const rate = cached.rate;
    return {
      amountUsd: amount * rate,
      exchangeRate: rate,
    };
  }

  // Use mock rate for development
  const mockRate = MOCK_EXCHANGE_RATES[fromCurrency as keyof typeof MOCK_EXCHANGE_RATES];

  if (!mockRate) {
    throw new Error(`No exchange rate available for ${fromCurrency}`);
  }

  // Cache the mock rate
  await prisma.exchangeRate.create({
    data: {
      fromCurrency,
      toCurrency: 'USD',
      date: dateOnly,
      rate: mockRate,
      source: 'mock-data',
    },
  });

  return {
    amountUsd: amount * mockRate,
    exchangeRate: mockRate,
  };
}

/**
 * Convert multiple amounts in parallel
 */
export async function convertBatch(
  items: Array<{ amount: number; currency: string; date?: Date }>
): Promise<ConversionResult[]> {
  return Promise.all(
    items.map(item => convertToUSD(item.amount, item.currency, item.date))
  );
}
