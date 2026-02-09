'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { LanguageProvider } from '@/lib/i18n';
import { swrConfig } from '@/lib/swr-config';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig value={swrConfig}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
