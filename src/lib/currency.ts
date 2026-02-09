/**
 * Currency conversion utilities
 *
 * Provides currency conversion functionality with exchange rate caching
 */

import { prisma } from './db';

/**
 * Fetch exchange rate from external API
 * Using exchangerate-api.com (free tier: 1,500 requests/month)
 */
async function fetchExchangeRate(fromCurrency: string, toCurrency: string = 'USD'): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  try {
    // Using free exchangerate-api.com API
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates || !data.rates[toCurrency]) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    return data.rates[toCurrency];
  } catch (error) {
    console.error(`Failed to fetch exchange rate for ${fromCurrency} to ${toCurrency}:`, error);

    // Fallback to common rates if API fails
    return getFallbackRate(fromCurrency, toCurrency);
  }
}

/**
 * Get fallback exchange rates for common currencies
 * These are approximate rates and should only be used if the API fails
 */
function getFallbackRate(fromCurrency: string, toCurrency: string = 'USD'): number {
  const fallbackRates: Record<string, number> = {
    'USD': 1.0,
    'JPY': 0.0067,  // ~150 JPY = 1 USD
    'EUR': 1.08,
    'GBP': 1.27,
    'CNY': 0.14,
    'KRW': 0.00075, // ~1,330 KRW = 1 USD
    'SGD': 0.74,
    'HKD': 0.13,
    'AUD': 0.65,
    'CAD': 0.73,
    'INR': 0.012,   // ~83 INR = 1 USD
  };

  if (fromCurrency === toCurrency) return 1.0;

  const rate = fallbackRates[fromCurrency];

  if (!rate) {
    console.warn(`No fallback rate for ${fromCurrency}, using 1.0`);
    return 1.0;
  }

  return rate;
}

/**
 * Get exchange rate with database caching
 * Caches rates for 24 hours to reduce API calls
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string = 'USD'
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Try to get cached rate from database
  try {
    const cached = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        date: {
          gte: today,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (cached) {
      console.log(`Using cached exchange rate: ${fromCurrency} -> ${toCurrency} = ${cached.rate}`);
      return cached.rate;
    }
  } catch (error) {
    console.warn('Failed to fetch cached exchange rate:', error);
  }

  // Fetch new rate
  const rate = await fetchExchangeRate(fromCurrency, toCurrency);

  // Cache the rate
  try {
    await prisma.exchangeRate.create({
      data: {
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        rate,
        date: today,
        source: 'exchangerate-api',
      },
    });
    console.log(`Cached new exchange rate: ${fromCurrency} -> ${toCurrency} = ${rate}`);
  } catch (error) {
    console.warn('Failed to cache exchange rate:', error);
  }

  return rate;
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string = 'USD'
): Promise<{ amount: number; rate: number }> {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = amount * rate;

  return {
    amount: convertedAmount,
    rate,
  };
}

/**
 * Format currency with appropriate symbol
 */
export function formatCurrencyWithSymbol(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'JPY': '¥',
    'EUR': '€',
    'GBP': '£',
    'CNY': '¥',
    'KRW': '₩',
    'SGD': 'S$',
    'HKD': 'HK$',
    'AUD': 'A$',
    'CAD': 'C$',
    'INR': '₹',
  };

  const symbol = symbols[currency.toUpperCase()] || currency;

  // Format based on currency
  if (currency === 'JPY' || currency === 'KRW') {
    // No decimal places for JPY and KRW
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }

  return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
