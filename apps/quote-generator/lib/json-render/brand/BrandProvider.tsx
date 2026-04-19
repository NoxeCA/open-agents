import { AsyncLocalStorage } from "node:async_hooks";
import React from 'react';
import type { BrandConfig } from './defaults';

const brandStorage = new AsyncLocalStorage<BrandConfig>();

export function runWithBrand<T>(value: BrandConfig, fn: () => T): T {
  return brandStorage.run(value, fn);
}

export const BrandProvider: React.FC<{
  value: BrandConfig;
  children: React.ReactNode;
}> = ({ children }) => <>{children}</>;

export function useBrand(): BrandConfig {
  const ctx = brandStorage.getStore();
  if (!ctx) {
    throw new Error('useBrand() must be used inside <BrandProvider>');
  }
  return ctx;
}
