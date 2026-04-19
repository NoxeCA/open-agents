export type { CatalogComponent, CatalogCategory, CatalogKind, CatalogExample } from '../types';

import type { z } from 'zod';
import type { CatalogComponent } from '../types';

export function defineComponent<Props extends z.ZodTypeAny>(
  spec: CatalogComponent<Props>
): CatalogComponent<Props> {
  return spec;
}
