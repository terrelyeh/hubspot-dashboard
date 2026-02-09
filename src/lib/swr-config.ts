/**
 * SWR Configuration for client-side caching
 *
 * Benefits:
 * - Automatic caching of API responses
 * - Stale-while-revalidate pattern for optimal UX
 * - Built-in deduplication of requests
 * - Focus revalidation (refresh when tab regains focus)
 * - Manual cache invalidation support
 */

import { SWRConfiguration } from 'swr';

// Default fetcher function
export const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return response.json();
};

// SWR global configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  // Keep data fresh for 5 minutes before revalidating
  dedupingInterval: 5 * 60 * 1000, // 5 minutes
  // Don't auto-refresh on focus for dashboard data (user can manually refresh)
  revalidateOnFocus: false,
  // Don't auto-refresh on reconnect
  revalidateOnReconnect: false,
  // Retry on error
  errorRetryCount: 2,
  // Keep previous data while loading new data
  keepPreviousData: true,
};

// Cache key generators for consistent cache management
export const cacheKeys = {
  dashboard: (region: string, startYear: number, startQuarter: number, endYear: number, endQuarter: number) =>
    `/api/dashboard?region=${region}&startYear=${startYear}&startQuarter=${startQuarter}&endYear=${endYear}&endQuarter=${endQuarter}&topDealsLimit=100&topDealsSortBy=amount`,

  dealDetails: (dealId: string) => `/api/deals/${dealId}`,

  targets: (region: string, year: number, quarter: number) =>
    `/api/targets?region=${region}&year=${year}&quarter=${quarter}`,
};

// Storage key for cache metadata
export const CACHE_METADATA_KEY = 'swr-cache-metadata';

// Get cache info from localStorage
export function getCacheInfo(): { lastUpdated: string | null; itemCount: number } {
  if (typeof window === 'undefined') {
    return { lastUpdated: null, itemCount: 0 };
  }

  try {
    const metadata = localStorage.getItem(CACHE_METADATA_KEY);
    if (metadata) {
      return JSON.parse(metadata);
    }
  } catch (e) {
    console.error('Error reading cache metadata:', e);
  }

  return { lastUpdated: null, itemCount: 0 };
}

// Update cache metadata
export function updateCacheMetadata() {
  if (typeof window === 'undefined') return;

  try {
    const info = getCacheInfo();
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      itemCount: info.itemCount + 1,
    }));
  } catch (e) {
    console.error('Error updating cache metadata:', e);
  }
}

// Clear cache metadata
export function clearCacheMetadata() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CACHE_METADATA_KEY);
  } catch (e) {
    console.error('Error clearing cache metadata:', e);
  }
}
