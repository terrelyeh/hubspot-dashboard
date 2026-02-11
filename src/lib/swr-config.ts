/**
 * SWR Configuration for client-side caching with localStorage persistence
 *
 * Benefits:
 * - Automatic caching of API responses
 * - Stale-while-revalidate pattern for optimal UX
 * - Built-in deduplication of requests
 * - **Persistent cache across browser reloads** (localStorage)
 * - Manual cache invalidation support
 */

import { SWRConfiguration } from 'swr';

// localStorage key for SWR cache
const SWR_CACHE_KEY = 'swr-dashboard-cache';
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes max cache age

// Cache entry interface
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface CacheStore {
  [key: string]: CacheEntry;
}

// Load cache from localStorage
function loadCache(): Map<string, unknown> {
  if (typeof window === 'undefined') return new Map();

  try {
    const stored = localStorage.getItem(SWR_CACHE_KEY);
    if (!stored) return new Map();

    const parsed: CacheStore = JSON.parse(stored);
    const now = Date.now();
    const cache = new Map<string, unknown>();

    // Only load entries that aren't expired
    Object.entries(parsed).forEach(([key, entry]) => {
      if (now - entry.timestamp < CACHE_MAX_AGE_MS) {
        cache.set(key, entry.data);
      }
    });

    return cache;
  } catch (e) {
    console.error('Error loading SWR cache from localStorage:', e);
    return new Map();
  }
}

// Save cache to localStorage with QuotaExceeded handling (P2-9)
function saveCache(cache: Map<string, unknown>) {
  if (typeof window === 'undefined') return;

  try {
    const now = Date.now();
    const store: CacheStore = {};

    cache.forEach((data, key) => {
      // Only save dashboard API responses (not all SWR data)
      if (key.startsWith('/api/dashboard')) {
        store[key] = { data, timestamp: now };
      }
    });

    const serialized = JSON.stringify(store);
    localStorage.setItem(SWR_CACHE_KEY, serialized);
  } catch (e) {
    // P2-9: Handle QuotaExceededError by clearing oldest entries and retrying
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try {
        // Clear the SWR cache to free space
        localStorage.removeItem(SWR_CACHE_KEY);
        localStorage.removeItem(CACHE_METADATA_KEY);

        // Retry with just the current data
        const now = Date.now();
        const store: CacheStore = {};
        cache.forEach((data, key) => {
          if (key.startsWith('/api/dashboard')) {
            store[key] = { data, timestamp: now };
          }
        });
        localStorage.setItem(SWR_CACHE_KEY, JSON.stringify(store));
      } catch {
        // If still failing, localStorage is truly full — skip caching
        console.warn('localStorage quota exceeded, skipping cache persistence');
      }
    } else {
      console.error('Error saving SWR cache to localStorage:', e);
    }
  }
}

// Create cache provider for SWR
// This function is called by SWRConfig and receives the parent cache
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function localStorageCacheProvider(): () => Map<string, any> {
  return () => {
    // Initialize from localStorage
    const cache = loadCache() as Map<string, any>;

    // Set up debounced save
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedSave = () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => saveCache(cache), 1000);
    };

    // Override set to trigger save
    const originalSet = cache.set.bind(cache);
    cache.set = (key: string, value: unknown) => {
      originalSet(key, value);
      debouncedSave();
      return cache;
    };

    // Override delete to trigger save
    const originalDelete = cache.delete.bind(cache);
    cache.delete = (key: string) => {
      const result = originalDelete(key);
      saveCache(cache);
      return result;
    };

    return cache;
  };
}

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
  dashboard: (region: string, pipeline: string, startYear: number, startQuarter: number, endYear: number, endQuarter: number) =>
    `/api/dashboard?region=${region}&pipeline=${pipeline}&startYear=${startYear}&startQuarter=${startQuarter}&endYear=${endYear}&endQuarter=${endQuarter}&topDealsLimit=100&topDealsSortBy=amount`,

  dealDetails: (dealId: string) => `/api/deals/${dealId}`,

  targets: (region: string, pipeline: string, year: number, quarter: number) =>
    `/api/targets?region=${region}&pipeline=${pipeline}&year=${year}&quarter=${quarter}`,

  pipelines: (region: string) => `/api/pipelines?region=${region}`,
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

// Clear cache metadata and localStorage cache
export function clearCacheMetadata() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CACHE_METADATA_KEY);
    localStorage.removeItem(SWR_CACHE_KEY);
  } catch (e) {
    console.error('Error clearing cache metadata:', e);
  }
}
