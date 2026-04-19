import type { ReactNode } from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

type ChromeState = {
  density: "airy" | "balanced" | "compact";
  accent: "sand" | "forest" | "ink";
  lang: "fr" | "en";
};

type ProposalDocumentProps = {
  title: string;
};

type ProposalPageProps = ChromeState & {
  label: string;
  eyebrow?: string;
  tone: string;
};

type HeroSectionProps = ChromeState & {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  badge?: string;
};

type StatsGridProps = ChromeState & {
  title?: string;
  items: Array<{ label: string; value: string }>;
};

type NarrativeSectionProps = ChromeState & {
  title: string;
  eyebrow?: string;
  paragraphs: string[];
};

type ServiceCardsSectionProps = ChromeState & {
  title: string;
  eyebrow?: string;
  intro?: string;
  items: Array<{
    title: string;
    eyebrow?: string;
    description?: string;
    amount?: string;
    meta: string[];
  }>;
};

type TotalsHighlightProps = ChromeState & {
  title: string;
  amount: string;
  caption?: string;
};

type BulletListSectionProps = ChromeState & {
  title: string;
  eyebrow?: string;
  items: string[];
  tone: "neutral" | "warm" | "warning";
};

type PeopleGridSectionProps = ChromeState & {
  title: string;
  eyebrow?: string;
  intro?: string;
  people: Array<{
    name: string;
    role?: string;
    bio?: string;
    skills: string[];
  }>;
};

type LogoCloudSectionProps = ChromeState & {
  title: string;
  eyebrow?: string;
  intro?: string;
  logos: string[];
};

type ContactStripProps = ChromeState & {
  title: string;
  preparedFor: string[];
  preparedBy: string[];
  contactLines: string[];
};

type RegistryComponent<P extends Record<string, unknown>> = (args: {
  props: P;
  children?: ReactNode;
}) => ReactNode;

type PdfRegistryEntry = (args: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) => ReactNode;

function definePdfRegistry(
  components: Record<string, PdfRegistryEntry>,
): { registry: Record<string, PdfRegistryEntry> } {
  return { registry: components };
}

function createRegistryEntry<P extends Record<string, unknown>>(
  component: RegistryComponent<P>,
): PdfRegistryEntry {
  return ({ element, children }) =>
    component({
      props: element.props as P,
      children,
    });
}

function chromePalette(chrome: ChromeState) {
  const accent =
    chrome.accent === "forest"
      ? { tint: "#e7f5ee", line: "#78a98a", badge: "#e1f4e8" }
      : chrome.accent === "ink"
        ? { tint: "#eef2f7", line: "#8391a2", badge: "#e4ebf2" }
        : { tint: "#fff2e3", line: "#d7a97f", badge: "#fde8d2" };

  const spacing =
    chrome.density === "airy"
      ? { page: 42, gap: 16 }
      : chrome.density === "compact"
        ? { page: 28, gap: 10 }
        : { page: 34, gap: 12 };

  return { ...accent, ...spacing };
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#172033",
  },
  pageInner: {
    flexDirection: "column",
    gap: 12,
    minHeight: "100%",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#5f6b7a",
  },
  pageLabel: {
    fontSize: 12,
    color: "#415064",
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 1.05,
    fontWeight: 700,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#334155",
  },
  body: {
    fontSize: 11,
    lineHeight: 1.65,
    color: "#425466",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#172033",
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  statCell: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#64748b",
  },
  statValue: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#172033",
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    marginTop: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    color: "#334155",
  },
});

const pdfRegistry = definePdfRegistry({
  ProposalDocument: createRegistryEntry(({
    props,
    children,
  }: {
    props: ProposalDocumentProps;
    children?: ReactNode;
  }) => (
    <Document title={props.title} author="Noxe">
      {children}
    </Document>
  )),
  ProposalPage: createRegistryEntry(({
    props,
    children,
  }: {
    props: ProposalPageProps;
    children?: ReactNode;
  }) => {
    const palette = chromePalette(props);

    return (
      <Page size="A4" style={[styles.page, { padding: palette.page }]}>
        <View style={[styles.pageInner, { gap: palette.gap }]}>
          {(props.eyebrow || props.label) && (
            <View
              style={[
                styles.row,
                { justifyContent: "space-between", alignItems: "center" },
              ]}
            >
              <View>
                {props.eyebrow && (
                  <Text style={styles.eyebrow}>{props.eyebrow}</Text>
                )}
                <Text
                  style={[
                    styles.pageLabel,
                    { marginTop: props.eyebrow ? 6 : 0 },
                  ]}
                >
                  {props.label}
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: palette.badge,
                }}
              >
                <Text style={[styles.eyebrow, { color: "#172033" }]}>
                  {props.tone}
                </Text>
              </View>
            </View>
          )}
          {children}
        </View>
      </Page>
    );
  }),
  HeroSection: createRegistryEntry(({ props }: { props: HeroSectionProps }) => {
    const palette = chromePalette(props);

    return (
      <View
        style={[
          styles.sectionCard,
          {
            borderColor: palette.line,
            backgroundColor: palette.tint,
          },
        ]}
      >
        {props.eyebrow && <Text style={styles.eyebrow}>{props.eyebrow}</Text>}
        <Text style={[styles.heroTitle, { marginTop: props.eyebrow ? 10 : 0 }]}>
          {props.title}
        </Text>
        {props.subtitle && (
          <Text style={[styles.heroSubtitle, { marginTop: 10 }]}>
            {props.subtitle}
          </Text>
        )}
        {props.summary && (
          <Text style={[styles.body, { marginTop: 12 }]}>{props.summary}</Text>
        )}
        {props.badge && (
          <View
            style={{
              marginTop: 16,
              alignSelf: "flex-start",
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: "#ffffff",
            }}
          >
            <Text style={[styles.pageLabel, { fontSize: 10 }]}>
              {props.badge}
            </Text>
          </View>
        )}
      </View>
    );
  }),
  StatsGrid: createRegistryEntry(({ props }: { props: StatsGridProps }) => {
    const palette = chromePalette(props);

    return (
      <View style={{ gap: 10 }}>
        {props.title && <Text style={styles.sectionTitle}>{props.title}</Text>}
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          {props.items.map((item, index) => (
            <View
              key={`${item.label}-${index}`}
              style={[styles.statCell, { borderColor: palette.line }]}
            >
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }),
  NarrativeSection: createRegistryEntry(({
    props,
  }: { props: NarrativeSectionProps }) => {
    const palette = chromePalette(props);

    return (
      <View
        style={[
          styles.sectionCard,
          {
            borderColor: palette.line,
            backgroundColor: "#ffffff",
            gap: 8,
          },
        ]}
      >
        {props.eyebrow && <Text style={styles.eyebrow}>{props.eyebrow}</Text>}
        <Text style={styles.sectionTitle}>{props.title}</Text>
        {props.paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.body}>
            {paragraph}
          </Text>
        ))}
      </View>
    );
  }),
  ServiceCardsSection: createRegistryEntry(({
    props,
  }: { props: ServiceCardsSectionProps }) => {
    const palette = chromePalette(props);

    return (
      <View style={{ gap: 10 }}>
        {props.eyebrow && <Text style={styles.eyebrow}>{props.eyebrow}</Text>}
        <Text style={styles.sectionTitle}>{props.title}</Text>
        {props.intro && <Text style={styles.body}>{props.intro}</Text>}
        <View style={{ gap: 8 }}>
          {props.items.map((item, index) => (
            <View
              key={`${item.title}-${index}`}
              style={[
                styles.sectionCard,
                {
                  borderColor: palette.line,
                  backgroundColor: "#ffffff",
                  gap: 8,
                },
              ]}
            >
              {item.eyebrow && <Text style={styles.eyebrow}>{item.eyebrow}</Text>}
              <View
                style={[
                  styles.row,
                  { justifyContent: "space-between", alignItems: "flex-start" },
                ]}
              >
                <View style={{ flexGrow: 1, flexBasis: 0 }}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  {item.description && (
                    <Text style={[styles.body, { marginTop: 6 }]}>
                      {item.description}
                    </Text>
                  )}
                </View>
                {item.amount && (
                  <View
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      backgroundColor: palette.badge,
                    }}
                  >
                    <Text style={[styles.pageLabel, { fontSize: 10 }]}>
                      {item.amount}
                    </Text>
                  </View>
                )}
              </View>
              {item.meta.length > 0 && (
                <View style={[styles.row, { flexWrap: "wrap" }]}>
                  {item.meta.map((meta, metaIndex) => (
                    <Text
                      key={`${meta}-${metaIndex}`}
                      style={[styles.chip, { borderColor: palette.line }]}
                    >
                      {meta}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }),
  TotalsHighlight: createRegistryEntry(({
    props,
  }: { props: TotalsHighlightProps }) => {
    const palette = chromePalette(props);

    return (
      <View
        style={[
          styles.sectionCard,
          {
            borderColor: palette.line,
            backgroundColor: palette.tint,
            gap: 8,
          },
        ]}
      >
        <Text style={styles.eyebrow}>{props.title}</Text>
        <Text style={[styles.heroTitle, { fontSize: 22 }]}>{props.amount}</Text>
        {props.caption && <Text style={styles.body}>{props.caption}</Text>}
      </View>
    );
  }),
  BulletListSection: createRegistryEntry(({
    props,
  }: { props: BulletListSectionProps }) => {
    const palette = chromePalette(props);
      const bulletColor =
        props.tone === "warning"
          ? "#d97706"
          : props.tone === "warm"
            ? "#e11d48"
            : "#64748b";

    return (
      <View
        style={[
          styles.sectionCard,
          {
            borderColor: palette.line,
            backgroundColor: "#ffffff",
            gap: 8,
          },
        ]}
      >
        {props.eyebrow && <Text style={styles.eyebrow}>{props.eyebrow}</Text>}
        <Text style={styles.sectionTitle}>{props.title}</Text>
        <View style={{ gap: 6 }}>
          {props.items.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: bulletColor }]} />
              <Text style={[styles.body, { flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }),
  PeopleGridSection: createRegistryEntry(({
    props,
  }: { props: PeopleGridSectionProps }) => {
    const palette = chromePalette(props);

    return (
      <View style={{ gap: 10 }}>
        {props.eyebrow && <Text style={styles.eyebrow}>{props.eyebrow}</Text>}
        <Text style={styles.sectionTitle}>{props.title}</Text>
        {props.intro && <Text style={styles.body}>{props.intro}</Text>}
        <View style={{ gap: 8 }}>
          {props.people.map((person, index) => (
            <View
              key={`${person.name}-${index}`}
              style={[
                styles.sectionCard,
                {
                  borderColor: palette.line,
                  backgroundColor: "#ffffff",
                  gap: 6,
                },
              ]}
            >
              <Text style={styles.sectionTitle}>{person.name}</Text>
              {person.role && <Text style={styles.pageLabel}>{person.role}</Text>}
              {person.bio && <Text style={styles.body}>{person.bio}</Text>}
              {person.skills.length > 0 && (
                <View style={[styles.row, { flexWrap: "wrap" }]}>
                  {person.skills.map((skill, skillIndex) => (
                    <Text
                      key={`${skill}-${skillIndex}`}
                      style={[styles.chip, { borderColor: palette.line }]}
                    >
                      {skill}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }),
  LogoCloudSection: createRegistryEntry(({
    props,
  }: { props: LogoCloudSectionProps }) => {
    const palette = chromePalette(props);

    return (
      <View
        style={[
          styles.sectionCard,
          {
            borderColor: palette.line,
            backgroundColor: "#ffffff",
            gap: 8,
          },
        ]}
      >
        {props.eyebrow && <Text style={styles.eyebrow}>{props.eyebrow}</Text>}
        <Text style={styles.sectionTitle}>{props.title}</Text>
        {props.intro && <Text style={styles.body}>{props.intro}</Text>}
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          {props.logos.map((logo, index) => (
            <Text
              key={`${logo}-${index}`}
              style={[styles.chip, { borderColor: palette.line }]}
            >
              {logo}
            </Text>
          ))}
        </View>
      </View>
    );
  }),
  ContactStrip: createRegistryEntry(({
    props,
  }: { props: ContactStripProps }) => {
    const palette = chromePalette(props);

    return (
      <View
        style={[
          styles.sectionCard,
          {
            borderColor: palette.line,
            backgroundColor: palette.tint,
            gap: 10,
          },
        ]}
      >
        <Text style={styles.sectionTitle}>{props.title}</Text>
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <View style={{ flexGrow: 1, flexBasis: 0, gap: 4 }}>
            <Text style={styles.eyebrow}>
              {props.lang === "fr" ? "Prepare pour" : "Prepared for"}
            </Text>
            {props.preparedFor.map((line, index) => (
              <Text key={`${line}-${index}`} style={styles.body}>
                {line}
              </Text>
            ))}
          </View>
          <View style={{ flexGrow: 1, flexBasis: 0, gap: 4 }}>
            <Text style={styles.eyebrow}>
              {props.lang === "fr" ? "Prepare par" : "Prepared by"}
            </Text>
            {props.preparedBy.map((line, index) => (
              <Text key={`${line}-${index}`} style={styles.body}>
                {line}
              </Text>
            ))}
          </View>
          <View style={{ flexGrow: 1, flexBasis: 0, gap: 4 }}>
            <Text style={styles.eyebrow}>Contact</Text>
            {props.contactLines.map((line, index) => (
              <Text key={`${line}-${index}`} style={styles.body}>
                {line}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  }),
});

export const quoteDocumentPdfRegistry = pdfRegistry.registry;
