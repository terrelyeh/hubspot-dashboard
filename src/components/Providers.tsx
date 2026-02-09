'use client';

import { useMemo } from 'react';
import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { LanguageProvider } from '@/lib/i18n';
import { swrConfig, localStorageCacheProvider } from '@/lib/swr-config';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create cache provider once (memoized to avoid re-creation)
  const cacheProvider = useMemo(() => localStorageCacheProvider(), []);

  return (
    <SessionProvider>
      <SWRConfig value={{ ...swrConfig, provider: cacheProvider }}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
