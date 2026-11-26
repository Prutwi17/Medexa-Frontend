import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary, NotificationContainer, NotificationProvider } from '@/components/ui';
import { queryClient } from '@/lib/queryClient';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <BrowserRouter>
            {children}
            <NotificationContainer />
          </BrowserRouter>
        </NotificationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
