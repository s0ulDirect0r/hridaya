'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { DataProvider } from '@/lib/data-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </AuthProvider>
  );
}
