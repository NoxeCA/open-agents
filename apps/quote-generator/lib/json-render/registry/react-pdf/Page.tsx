import React, { FC } from 'react';
import { Page as RPdfPage, Text, View, Image } from '@react-pdf/renderer';
import { basePageStyle, spacing } from '@/lib/documents/quote/shared/styles';
import { coverStyles } from '@/lib/documents/quote/pages/01-cover/styles';
import { useBrand } from '../../brand';
import type { SpecPageNode } from '../../spec/schema';
import { renderNode } from './render-child';
import { SectionMarker } from './SectionMarker';
import { usePageNumbers } from './page-numbers';

interface PageRendererProps {
  node: SpecPageNode;
}

// Detect whether a page is a "cover" — no header, no footer, full-bleed
// absolute layout. Triggered by header === false OR a CoverBlock child.
function isCoverPage(node: SpecPageNode): boolean {
  if (node.header === false) return true;
  const firstChild = node.children[0];
  return firstChild?.type === 'CoverBlock';
}

const chromeStyles = {
  page: {
    ...basePageStyle,
    padding: spacing.pagePadding,
    flexDirection: 'column' as const,
  },
  pageHeader: {
    fontFamily: 'URWGeometric' as const,
    fontWeight: 700 as const,
    fontSize: 14,
    lineHeight: 1.14,
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    height: 33,
  },
  footerLogo: {
    width: 64,
    height: 17,
  },
  footerArrows: {
    position: 'absolute' as const,
    right: 30,
    bottom: -10,
    width: 18,
    height: 18,
  },
};

export const PageRenderer: FC<PageRendererProps> = ({ node }) => {
  const brand = useBrand();
  const pageNumbers = usePageNumbers();
  const size = node.size ?? 'LETTER';

  const startMarker = node.sectionId ? (
    <SectionMarker
      collector={pageNumbers}
      sectionKey={node.sectionId}
      position="start"
    />
  ) : null;
  const endMarker = node.sectionId ? (
    <SectionMarker
      collector={pageNumbers}
      sectionKey={node.sectionId}
      position="end"
    />
  ) : null;

  if (isCoverPage(node)) {
    // Full-bleed cover layout (CoverBlock owns positioning).
    return (
      <RPdfPage size={size} style={coverStyles.page}>
        {startMarker}
        {node.children.map((child, idx) => (
          <React.Fragment key={idx}>{renderNode(child)}</React.Fragment>
        ))}
        {endMarker}
      </RPdfPage>
    );
  }

  const headerText = typeof node.header === 'string' ? node.header : '';
  const showFooter = node.footer !== 'none';
  const logoBase64 = brand.assets.logoDark;
  const arrowsBase64 = brand.assets.arrowsFooter;

  return (
    <RPdfPage
      size={size}
      style={{
        ...chromeStyles.page,
        padding: node.padding ?? spacing.pagePadding,
      }}
    >
      {headerText && (
        <Text style={{ ...chromeStyles.pageHeader, color: brand.colors.gray }} fixed>
          {headerText}
        </Text>
      )}

      <View
        style={
          node.bottomReserve
            ? { ...chromeStyles.content, paddingBottom: node.bottomReserve }
            : chromeStyles.content
        }
      >
        {startMarker}
        {node.children.map((child, idx) => (
          <React.Fragment key={idx}>{renderNode(child)}</React.Fragment>
        ))}
        {endMarker}
      </View>

      {showFooter && (
        <View style={chromeStyles.footer} fixed>
          {logoBase64 ? <Image style={chromeStyles.footerLogo} src={logoBase64} /> : <View />}
          {arrowsBase64 && <Image style={chromeStyles.footerArrows} src={arrowsBase64} />}
        </View>
      )}
    </RPdfPage>
  );
};
