import { Text, View, Image } from "@react-pdf/renderer";
import { type FC } from "react";
import type { QuoteTranslations } from "@/lib/locales/loader";
import type { PageNumberCollector } from "../../shared/pagination";
import { QuoteEditableRegion } from "../../components/editable-region";
import type { ExclusionsConditionsPageData } from "./types";
import { SECTION_KEYS } from "../../shared/pagination";
import PageShell from "../../components/PageShell";
import SectionMarker from "../../components/SectionMarker";
import { exclusionsConditionsStyles as styles } from "./styles";

const BulletList: FC<{ items: string[] }> = ({ items }) => (
  <View style={styles.sectionGap}>
    {items.map((item, i) => (
      <View key={i} style={styles.bulletItem}>
        <Text style={styles.bullet}>{"\u2022"}</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

interface ExclusionsConditionsPageProps {
  data: ExclusionsConditionsPageData;
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  infoIconBase64: string;
  pageNumbers: PageNumberCollector;
}

const ExclusionsConditionsPage: FC<ExclusionsConditionsPageProps> = ({
  data,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  infoIconBase64,
  pageNumbers,
}) => (
  <PageShell
    pageHeader={pageHeader}
    logoBase64={logoBase64}
    arrowsBase64={arrowsBase64}
  >
    <SectionMarker
      collector={pageNumbers}
      sectionKey={SECTION_KEYS.exclusionsConditions}
      position="start"
    />

    {/* Exclusion(s) */}
    <Text style={styles.sectionHeading}>
      {data.exclusions.length > 1
        ? lang.exclusions.exclusionTitlePlural
        : lang.exclusions.exclusionTitle}
    </Text>
    <BulletList items={data.exclusions} />
    <QuoteEditableRegion
      root={data}
      local={data}
      section="exclusions-conditions"
      sectionAliases={["commercial", "exclusions"]}
      anchor="afterExclusions"
      anchorAliases={["after-exclusions"]}
      regionIds={["commercial:after-exclusions"]}
      style={styles.sectionGap}
    />

    {/* Special Condition(s) */}
    <Text style={styles.sectionHeading}>
      {data.specialConditions.length > 1
        ? lang.exclusions.specialConditionsTitlePlural
        : lang.exclusions.specialConditionsTitle}
    </Text>
    <BulletList items={data.specialConditions} />
    <QuoteEditableRegion
      root={data}
      local={data}
      section="exclusions-conditions"
      sectionAliases={["commercial", "exclusions"]}
      anchor="afterSpecialConditions"
      anchorAliases={["after-special-conditions"]}
      regionIds={["commercial:after-special-conditions"]}
      style={styles.sectionGap}
    />

    {/* Note(s) */}
    <Text style={styles.sectionHeading}>
      {data.notes.length > 1
        ? lang.exclusions.noteTitlePlural
        : lang.exclusions.noteTitle}
    </Text>
    <BulletList items={data.notes} />
    <QuoteEditableRegion
      root={data}
      local={data}
      section="exclusions-conditions"
      sectionAliases={["commercial", "exclusions"]}
      anchor="afterNotes"
      anchorAliases={["after-notes"]}
      regionIds={["commercial:after-notes"]}
      style={styles.sectionGap}
    />

    {/* Payment Term(s) */}
    <Text style={styles.sectionHeading}>
      {data.paymentTerms.length > 1
        ? lang.exclusions.paymentTermTitlePlural
        : lang.exclusions.paymentTermTitle}
    </Text>
    <BulletList items={data.paymentTerms} />
    <QuoteEditableRegion
      root={data}
      local={data}
      section="exclusions-conditions"
      sectionAliases={["commercial", "exclusions"]}
      anchor="afterPaymentTerms"
      anchorAliases={["after-payment-terms"]}
      regionIds={["commercial:after-payment-terms"]}
      style={styles.sectionGap}
    />

    {/* Warranty — label is bold dark, text is regular gray */}
    <Text style={styles.warrantyText}>
      <Text style={styles.warrantyLabel}>{lang.exclusions.warrantyLabel} </Text>
      {lang.exclusions.warrantyText}
    </Text>

    {/* Info line */}
    <View style={styles.infoRow}>
      {infoIconBase64 && <Image style={styles.infoIcon} src={infoIconBase64} />}
      <Text style={styles.infoText}>{lang.exclusions.infoText}</Text>
    </View>

    <QuoteEditableRegion
      root={data}
      local={data}
      section="exclusions-conditions"
      sectionAliases={["commercial", "exclusions"]}
      anchor="afterInfo"
      anchorAliases={["after-info"]}
      regionIds={["commercial:after-info"]}
      style={styles.sectionGap}
    />

    {/* Contact + Signature block */}
    <View style={styles.bottomRow}>
      <View style={styles.contactBlock}>
        <Text style={styles.contactName}>{data.contactInfo.name}</Text>
        <Text style={styles.contactCompany}>Noxe Inc</Text>
        <Text style={styles.contactPhone}>Phone: {data.contactInfo.phone}</Text>
        <Text style={styles.contactEmail}>{data.contactInfo.email}</Text>
      </View>

      <View style={styles.signatureBlock}>
        <View style={styles.signatureRow}>
          <Text style={styles.signatureLabel}>
            {lang.exclusions.clientSignature}
          </Text>
          <View style={styles.signatureLine} />
        </View>
        <View style={styles.signatureRow}>
          <Text style={styles.signatureLabel}>{lang.exclusions.date}</Text>
          <View style={styles.signatureLine} />
        </View>
      </View>
    </View>

    <SectionMarker
      collector={pageNumbers}
      sectionKey={SECTION_KEYS.exclusionsConditions}
      position="end"
    />
  </PageShell>
);

export default ExclusionsConditionsPage;
