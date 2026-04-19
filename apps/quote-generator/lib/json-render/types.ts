import type { z } from 'zod';

export type CatalogKind = 'leaf' | 'container';

export type CatalogCategory =
  | 'layout'
  | 'typography'
  | 'brand'
  | 'content'
  | 'table'
  | 'composite'
  | 'template';

export interface CatalogExample {
  label: string;
  spec: unknown;
}

export interface CatalogComponent<Props extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  kind: CatalogKind;
  category: CatalogCategory;
  props: Props;
  description: string;
  examples?: CatalogExample[];
  pageBreakHint?: 'page-root' | 'section-root' | 'none';
}

export interface SpecNodeBase {
  type: string;
  children?: SpecNode[];
  [key: string]: unknown;
}

export type SpecNode = SpecNodeBase;
