import { Text } from "@react-pdf/renderer";
import { Fragment, type FC } from "react";
import type { QuoteTranslations } from "@/lib/locales/loader";
import type { PageNumberCollector } from "../../shared/pagination";
import { SECTION_KEYS } from "../../shared/pagination";
import { QuoteEditableRegion } from "../../components/editable-region";
import PageShell from "../../components/PageShell";
import SectionMarker from "../../components/SectionMarker";
import { termsAndConditionsStyles as styles } from "./styles";

interface TermsAndConditionsPageProps {
  data?: unknown;
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  pageNumbers: PageNumberCollector;
}

const TermsAndConditionsPage: FC<TermsAndConditionsPageProps> = ({
  data,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  pageNumbers,
}) => {
  const sections = lang.terms.sections;

  return (
    <PageShell
      pageHeader={pageHeader}
      logoBase64={logoBase64}
      arrowsBase64={arrowsBase64}
      arrowsFlipped
    >
      <SectionMarker
        collector={pageNumbers}
        sectionKey={SECTION_KEYS.termsAndConditions}
        position="start"
      />

      <Text style={styles.title}>{lang.terms.title}</Text>

      <QuoteEditableRegion
        root={data}
        section="terms-and-conditions"
        sectionAliases={["terms"]}
        anchor="beforeSections"
        anchorAliases={["before-sections"]}
        regionIds={["terms:before-sections"]}
        style={{ marginBottom: 16 }}
      />

      {sections.map((section: { title: string; text: string }, i: number) => (
        <Fragment key={i}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          <Text
            style={
              i < sections.length - 1
                ? styles.sectionText
                : styles.sectionTextLast
            }
          >
            {section.text}
          </Text>
        </Fragment>
      ))}

      <QuoteEditableRegion
        root={data}
        section="terms-and-conditions"
        sectionAliases={["terms"]}
        anchor="afterSections"
        anchorAliases={["after-sections", "footer"]}
        regionIds={["terms:after-sections"]}
        style={{ marginTop: 16 }}
      />

      <SectionMarker
        collector={pageNumbers}
        sectionKey={SECTION_KEYS.termsAndConditions}
        position="end"
      />
    </PageShell>
  );
};

export default TermsAndConditionsPage;
