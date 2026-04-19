import { Text, View } from "@react-pdf/renderer";
import { type FC } from "react";
import type { QuoteTranslations, Language } from "@/lib/locales/loader";
import type { PageNumberCollector } from "../../shared/pagination";
import { QuoteEditableRegion } from "../../components/editable-region";
import type { ProposalDescriptionPageData } from "./types";
import { SECTION_KEYS } from "../../shared/pagination";
import { formatDateLongWithWeekday } from "../../shared/formatters";
import PageShell from "../../components/PageShell";
import SectionMarker from "../../components/SectionMarker";
import { proposalDescriptionStyles as styles } from "./styles";

interface ProposalDescriptionPageProps {
  data: ProposalDescriptionPageData;
  lang: QuoteTranslations;
  selectedLang: Language;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  pageNumbers: PageNumberCollector;
}

const ProposalDescriptionPage: FC<ProposalDescriptionPageProps> = ({
  data,
  lang,
  selectedLang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  pageNumbers,
}) => {
  const { proposal } = data;

  return (
    <PageShell
      pageHeader={pageHeader}
      logoBase64={logoBase64}
      arrowsBase64={arrowsBase64}
    >
      <SectionMarker
        collector={pageNumbers}
        sectionKey={SECTION_KEYS.proposalDescription}
        position="start"
      />

      <Text style={styles.title}>{lang.proposalDescription.title}</Text>

      <View style={styles.addresseeBlock}>
        <Text style={styles.addresseeLine}>
          {formatDateLongWithWeekday(proposal.date, selectedLang)}
        </Text>
        <Text style={styles.addresseeLine}>{proposal.addressee.name}</Text>
        {proposal.addressee.company && (
          <Text style={styles.addresseeLine}>{proposal.addressee.company}</Text>
        )}
        <Text style={styles.addresseeLine}>{proposal.addressee.address}</Text>
      </View>

      <Text style={styles.objectHeading}>
        {lang.proposalDescription.object} {proposal.object}
      </Text>

      <QuoteEditableRegion
        root={data}
        local={proposal}
        section="proposal-description"
        sectionAliases={["proposal", "proposal-description"]}
        anchor="afterObject"
        anchorAliases={["after-object"]}
        regionIds={["proposal:after-object"]}
        style={{ marginBottom: 16 }}
      />

      {proposal.paragraphs.map((paragraph, i) => (
        <Text key={i} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      <QuoteEditableRegion
        root={data}
        local={proposal}
        section="proposal-description"
        sectionAliases={["proposal", "proposal-description"]}
        anchor="afterParagraphs"
        anchorAliases={["after-paragraphs", "body", "blocks"]}
        regionIds={["proposal:body", "proposal:after-paragraphs"]}
        blockSources={[proposal.blocks]}
        style={{ marginBottom: 16 }}
      />

      <QuoteEditableRegion
        root={data}
        local={proposal}
        section="proposal-description"
        sectionAliases={["proposal", "proposal-description"]}
        anchor="footer"
        regionIds={["proposal:footer"]}
        style={{ marginBottom: 16 }}
      />

      <SectionMarker
        collector={pageNumbers}
        sectionKey={SECTION_KEYS.proposalDescription}
        position="end"
      />
    </PageShell>
  );
};

export default ProposalDescriptionPage;
