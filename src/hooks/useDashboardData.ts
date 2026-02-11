/**
 * SWR hooks for Dashboard data
 *
 * Usage:
 * const { data, error, isLoading, mutate } = useDashboardData(region, startYear, startQuarter, endYear, endQuarter);
 *
 * Features:
 * - Automatic caching with stale-while-revalidate
 * - Deduplication of concurrent requests
 * - Manual refresh via mutate()
 * - Global cache clear via clearAllCaches()
 */

import useSWR, { mutate } from 'swr';
import { cacheKeys, updateCacheMetadata, clearCacheMetadata } from '@/lib/swr-config';

// Dashboard data interface (simplified for hook)
interface DashboardResponse {
  success: boolean;
  usingMockData?: boolean;
  [key: string]: unknown;
}

/**
 * Hook for fetching dashboard data with SWR caching
 */
export function useDashboardData(
  region: string,
  pipeline: string,
  startYear: number,
  startQuarter: number,
  endYear: number,
  endQuarter: number,
  options?: {
    enabled?: boolean;
  }
) {
  const cacheKey = options?.enabled !== false
    ? cacheKeys.dashboard(region, pipeline, startYear, startQuarter, endYear, endQuarter)
    : null;

  const { data, error, isLoading, isValidating, mutate: revalidate } = useSWR<DashboardResponse>(
    cacheKey,
    {
      onSuccess: () => {
        updateCacheMetadata();
      },
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating, // true when refreshing in background
    refresh: () => revalidate(), // manual refresh
    mutate: revalidate,
  };
}

/**
 * Hook for fetching deal details with SWR caching
 */
export function useDealDetails(dealId: string | null) {
  const cacheKey = dealId ? cacheKeys.dealDetails(dealId) : null;

  const { data, error, isLoading, mutate: revalidate } = useSWR(cacheKey);

  return {
    data,
    error,
    isLoading,
    refresh: () => revalidate(),
  };
}

/**
 * Clear all SWR caches
 * Use this when user wants to force refresh all data
 */
export async function clearAllCaches() {
  // Clear SWR cache by calling mutate with undefined for all keys
  await mutate(
    () => true, // Match all keys
    undefined,  // Clear data
    { revalidate: false }
  );

  // Clear cache metadata
  clearCacheMetadata();

  console.log('All caches cleared');
}

/**
 * Clear specific dashboard cache
 */
export function clearDashboardCache(
  region?: string,
  pipeline?: string,
  startYear?: number,
  startQuarter?: number,
  endYear?: number,
  endQuarter?: number
) {
  if (region && pipeline && startYear && startQuarter && endYear && endQuarter) {
    // Clear specific cache
    const key = cacheKeys.dashboard(region, pipeline, startYear, startQuarter, endYear, endQuarter);
    mutate(key, undefined, { revalidate: false });
  } else {
    // Clear all dashboard caches
    mutate(
      (key) => typeof key === 'string' && key.startsWith('/api/dashboard'),
      undefined,
      { revalidate: false }
    );
  }
}

/**
 * Refresh all dashboard caches (revalidate without clearing)
 */
export async function refreshAllDashboardData() {
  await mutate(
    (key) => typeof key === 'string' && key.startsWith('/api/dashboard'),
    undefined,
    { revalidate: true }
  );
}
