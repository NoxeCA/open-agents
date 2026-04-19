import { AsyncLocalStorage } from "node:async_hooks";
import React from 'react';
import type { PageNumberCollector } from '@/lib/documents/quote/shared/pagination';

const pageNumberStorage = new AsyncLocalStorage<PageNumberCollector>();

export function runWithPageNumbers<T>(
  value: PageNumberCollector,
  fn: () => T,
): T {
  return pageNumberStorage.run(value, fn);
}

export const PageNumberProvider: React.FC<{
  value: PageNumberCollector;
  children: React.ReactNode;
}> = ({ children }) => <>{children}</>;

export function usePageNumbers(): PageNumberCollector {
  const ctx = pageNumberStorage.getStore();
  if (!ctx) {
    throw new Error('usePageNumbers() must be used inside <PageNumberProvider>');
  }
  return ctx;
}
