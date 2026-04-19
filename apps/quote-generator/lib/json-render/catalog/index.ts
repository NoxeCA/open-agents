import type { CatalogComponent } from '../types';
import { Document } from './layout/Document';
import { Page } from './layout/Page';
import { HStack, VStack, Section, Spacer, Divider, Box } from './layout/primitives';
import {
  Heading,
  Subheading,
  Paragraph,
  Label,
  Caption,
} from './typography/primitives';
import { DarkHeaderBox, SectionHeader } from './brand/primitives';
import { TocEntries } from './brand/TocEntries';
import { Image, BulletList, ValuePillGrid } from './content/primitives';
import { CoverBlock } from './composites/CoverBlock';
import {
  TaxDisclaimer,
  TotalCostBox,
  SummaryTable,
  InfoGrid,
  SignatureBlock,
  ContinuationHeader,
  TeamCard,
  PartnerGrid,
} from './composites/primitives';
import { BomTable, LaborBlock, ServiceSection } from './tables/primitives';
import {
  Callout,
  KeyValueTable,
  Metric,
  MetricGrid,
  PriceComparison,
  CeoMessageCard,
  TermsAndConditions,
  KeepTogether,
  Link,
  PageNumber,
  Table,
  RichText,
} from './atoms/primitives';

export const catalog = {
  Document,
  Page,
  HStack,
  VStack,
  Section,
  Spacer,
  Divider,
  Box,
  Heading,
  Subheading,
  Paragraph,
  Label,
  Caption,
  DarkHeaderBox,
  SectionHeader,
  TocEntries,
  Image,
  BulletList,
  ValuePillGrid,
  CoverBlock,
  TaxDisclaimer,
  TotalCostBox,
  SummaryTable,
  InfoGrid,
  SignatureBlock,
  ContinuationHeader,
  TeamCard,
  PartnerGrid,
  BomTable,
  LaborBlock,
  ServiceSection,
  Callout,
  KeyValueTable,
  Metric,
  MetricGrid,
  PriceComparison,
  CeoMessageCard,
  TermsAndConditions,
  KeepTogether,
  Link,
  PageNumber,
  Table,
  RichText,
} as const;

export type CatalogName = keyof typeof catalog;

export const CATALOG_NAMES = Object.keys(catalog) as CatalogName[];

export function getCatalogEntry(name: string): CatalogComponent | undefined {
  return (catalog as Record<string, CatalogComponent>)[name];
}
