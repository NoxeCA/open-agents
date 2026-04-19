import React, { type FC } from "react";
import { Text, Image } from "@react-pdf/renderer";
import type { QuoteTranslations } from "@/lib/locales/loader";
import type { PageNumberCollector } from "../../shared/pagination";
import { QuoteEditableRegion } from "../../components/editable-region";
import type { OptionalPageData } from "./types";
import { SECTION_KEYS } from "../../shared/pagination";
import PageShell from "../../components/PageShell";
import SectionMarker from "../../components/SectionMarker";
import { optionalPageStyles as styles } from "./styles";

interface OptionalPagesProps {
  root?: unknown;
  pages: OptionalPageData[];
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  hexPatternBase64: string;
  pageNumbers: PageNumberCollector;
}

const OptionalPages: FC<OptionalPagesProps> = ({
  root,
  pages,
  pageHeader,
  logoBase64,
  arrowsBase64,
  hexPatternBase64,
  pageNumbers,
}) => (
  <>
    {pages.map((page, i) => (
      <PageShell
        key={i}
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
      >
        <SectionMarker
          collector={pageNumbers}
          sectionKey={SECTION_KEYS.optionalKey(i)}
          position="start"
        />

        {hexPatternBase64 && (
          <Image style={styles.hexPattern} src={hexPatternBase64} />
        )}

        {page.pageTitle ? (
          <Text style={styles.pageTitle}>{page.pageTitle}</Text>
        ) : null}
        {page.title ? <Text style={styles.title}>{page.title}</Text> : null}
        <QuoteEditableRegion
          root={root}
          local={page}
          section="optional-pages"
          sectionAliases={["optional", "appendix"]}
          anchor="afterTitle"
          anchorAliases={["after-title"]}
          index={i}
          regionIds={[`optional:${i}:after-title`]}
          style={{ marginBottom: 16 }}
        />
        {page.text ? <Text style={styles.text}>{page.text}</Text> : null}
        <QuoteEditableRegion
          root={root}
          local={page}
          section="optional-pages"
          sectionAliases={["optional", "appendix"]}
          anchor="body"
          anchorAliases={["after-text", "blocks", "content"]}
          index={i}
          regionIds={[`optional:${i}:body`]}
          blockSources={[page.blocks]}
          style={{ marginBottom: 16 }}
        />
        <QuoteEditableRegion
          root={root}
          local={page}
          section="optional-pages"
          sectionAliases={["optional", "appendix"]}
          anchor="footer"
          index={i}
          regionIds={[`optional:${i}:footer`]}
          style={{ marginBottom: 16 }}
        />

        <SectionMarker
          collector={pageNumbers}
          sectionKey={SECTION_KEYS.optionalKey(i)}
          position="end"
        />
      </PageShell>
    ))}
  </>
);

export default OptionalPages;
