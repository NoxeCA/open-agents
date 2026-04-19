import React from 'react';
import type { SpecContentNode } from '../../spec/schema';
import { CoverBlockRenderer } from './CoverBlock';
import {
  HStackRenderer,
  VStackRenderer,
  SectionRenderer,
  SpacerRenderer,
  DividerRenderer,
  BoxRenderer,
} from './layout';
import {
  HeadingRenderer,
  SubheadingRenderer,
  ParagraphRenderer,
  LabelRenderer,
  CaptionRenderer,
} from './typography';
import { DarkHeaderBoxRenderer, SectionHeaderRenderer } from './brand';
import { TocEntriesRenderer } from './TocEntries';
import { ImageRenderer, BulletListRenderer, ValuePillGridRenderer } from './content';
import {
  TaxDisclaimerRenderer,
  TotalCostBoxRenderer,
  SummaryTableRenderer,
  InfoGridRenderer,
  SignatureBlockRenderer,
  ContinuationHeaderRenderer,
  TeamCardRenderer,
  PartnerGridRenderer,
} from './composites';
import { BomTableRenderer, LaborBlockRenderer } from './tables';
import {
  CalloutRenderer,
  KeyValueTableRenderer,
  MetricRenderer,
  MetricGridRenderer,
  PriceComparisonRenderer,
  CeoMessageCardRenderer,
  TermsAndConditionsRenderer,
  KeepTogetherRenderer,
  LinkRenderer,
  PageNumberRenderer,
  TableRenderer,
  RichTextRenderer,
} from './atoms';

function renderChildren(nodes: SpecContentNode[] | undefined): React.ReactNode {
  if (!nodes) return null;
  return nodes.map((n, i) => <React.Fragment key={i}>{renderNode(n)}</React.Fragment>);
}

export function renderNode(node: SpecContentNode): React.ReactNode {
  const p = node as any;
  switch (node.type) {
    case 'CoverBlock':
      return <CoverBlockRenderer {...p} />;
    // Layout
    case 'HStack':
      return <HStackRenderer {...p}>{renderChildren(node.children)}</HStackRenderer>;
    case 'VStack':
      return <VStackRenderer {...p}>{renderChildren(node.children)}</VStackRenderer>;
    case 'Section':
      return <SectionRenderer {...p}>{renderChildren(node.children)}</SectionRenderer>;
    case 'Spacer':
      return <SpacerRenderer {...p} />;
    case 'Divider':
      return <DividerRenderer {...p} />;
    case 'Box':
      return <BoxRenderer {...p}>{renderChildren(node.children)}</BoxRenderer>;
    // Typography
    case 'Heading':
      return <HeadingRenderer {...p} />;
    case 'Subheading':
      return <SubheadingRenderer {...p} />;
    case 'Paragraph':
      return <ParagraphRenderer {...p} />;
    case 'Label':
      return <LabelRenderer {...p} />;
    case 'Caption':
      return <CaptionRenderer {...p} />;
    // Brand
    case 'DarkHeaderBox':
      return <DarkHeaderBoxRenderer {...p} />;
    case 'SectionHeader':
      return <SectionHeaderRenderer {...p} />;
    case 'TocEntries':
      return <TocEntriesRenderer {...p} />;
    // Content
    case 'Image':
      return <ImageRenderer {...p} />;
    case 'BulletList':
      return <BulletListRenderer {...p} />;
    case 'ValuePillGrid':
      return <ValuePillGridRenderer {...p} />;
    // Composites
    case 'TaxDisclaimer':
      return <TaxDisclaimerRenderer {...p} />;
    case 'TotalCostBox':
      return <TotalCostBoxRenderer {...p} />;
    case 'SummaryTable':
      return <SummaryTableRenderer {...p} />;
    case 'InfoGrid':
      return <InfoGridRenderer {...p} />;
    case 'SignatureBlock':
      return <SignatureBlockRenderer {...p} />;
    case 'ContinuationHeader':
      return <ContinuationHeaderRenderer {...p} />;
    case 'TeamCard':
      return <TeamCardRenderer {...p} />;
    case 'PartnerGrid':
      return <PartnerGridRenderer {...p} />;
    // Tables
    case 'BomTable':
      return <BomTableRenderer {...p} />;
    case 'LaborBlock':
      return <LaborBlockRenderer {...p} />;
    // Atoms (Phase 7)
    case 'Callout':
      return <CalloutRenderer {...p} />;
    case 'KeyValueTable':
      return <KeyValueTableRenderer {...p} />;
    case 'Metric':
      return <MetricRenderer {...p} />;
    case 'MetricGrid':
      return <MetricGridRenderer {...p} />;
    case 'PriceComparison':
      return <PriceComparisonRenderer {...p} />;
    case 'CeoMessageCard':
      return <CeoMessageCardRenderer {...p} />;
    case 'TermsAndConditions':
      return <TermsAndConditionsRenderer {...p} />;
    case 'KeepTogether':
      return <KeepTogetherRenderer {...p}>{renderChildren(node.children)}</KeepTogetherRenderer>;
    case 'Link':
      return <LinkRenderer {...p} />;
    case 'PageNumber':
      return <PageNumberRenderer {...p} />;
    case 'Table':
      return <TableRenderer {...p} />;
    case 'RichText':
      return <RichTextRenderer {...p} />;
    default:
      throw new Error(`Unknown spec node type: ${String(node.type)}`);
  }
}

// Backwards-compat alias used by Page.tsx (Phase 1 naming).
export const renderPageChild = renderNode;
