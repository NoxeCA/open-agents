import type { SpecEnvelope } from "./spec/schema";

export interface ClaudeStyleScenarioOptions {
  planImageDataUri?: string;
}

export interface ClaudeStyleScenario {
  slug: string;
  title: string;
  request: string;
  description: string;
  spec: SpecEnvelope;
}

const FALLBACK_PLAN_IMAGE_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==";

type BomItem = {
  qty: number;
  partNumber: string;
  description: string;
  extendedDescription?: string;
  oem: string;
  unitPrice: number;
  total: number;
};

type LaborItem = {
  category: string;
  amount: number;
};

type PriceOption = {
  title: string;
  price: number;
  features: string[];
  highlighted?: boolean;
};

function createBomItem(
  prefix: string,
  index: number,
  description: string,
  oem: string,
  unitPrice: number,
  qty = 1,
): BomItem {
  return {
    qty,
    partNumber: `${prefix}-${String(index + 1).padStart(2, "0")}`,
    description,
    oem,
    unitPrice,
    total: qty * unitPrice,
  };
}

function sumBom(items: BomItem[]): number {
  return items.reduce((total, item) => total + item.total, 0);
}

function sumLabor(items: LaborItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

function createCoverPage() {
  return {
    type: "Page",
    header: false,
    footer: "none",
    children: [
      {
        type: "CoverBlock",
        clientName: { $state: "cover.clientName" },
        subtitle: { $template: "Proposal for {{cover.clientName}}" },
        documentType: { $state: "cover.documentType" },
        documentTitle: { $state: "cover.documentTitle" },
        quoteID: { $state: "cover.quoteId" },
        revision: { $state: "cover.revision" },
        quoteDate: { $state: "cover.quoteDate" },
        validUntil: { $state: "cover.validUntil" },
        preparedFor: { $state: "cover.preparedFor" },
        preparedBy: { $state: "cover.preparedBy" },
      },
    ],
  } as const;
}

function createTocPage(
  entries: Array<{ label: string; sectionId: string }>,
  combine?: Array<{ label: string; sectionIds: string[] }>,
) {
  return {
    type: "Page",
    header: "PROPOSAL",
    children: [
      {
        type: "TocEntries",
        title: "Table of contents",
        entries,
        combine,
      },
    ],
  } as const;
}

function createExecutiveSummaryPage() {
  return {
    type: "Page",
    sectionId: "executive-summary",
    header: "PROPOSAL",
    children: [
      {
        type: "Section",
        children: [
          {
            type: "SectionHeader",
            number: 1,
            name: "Executive summary",
          },
          {
            type: "Paragraph",
            size: 11,
            text: {
              $template:
                "{{project.clientName}} wants a proposal that reads cleanly for leadership but still survives direct PDF rendering through the vendored json-render runtime.",
            },
          },
          {
            type: "MetricGrid",
            columns: 4,
            items: [
              {
                $repeat: {
                  over: "summary.metrics",
                  as: "metric",
                  template: {
                    value: { $state: "metric.value" },
                    label: { $state: "metric.label" },
                    trend: { $state: "metric.trend" },
                  },
                },
              },
            ],
          },
          {
            type: "Callout",
            variant: "accent",
            title: "Renderer intent",
            text: {
              $template:
                "This suite keeps the output close to what Claude would emit: one envelope, light bindings, catalog-safe nodes, and no chat or AI SDK hop.",
            },
          },
          {
            type: "BulletList",
            variant: "arrow",
            items: [
              {
                $repeat: {
                  over: "summary.highlights",
                  as: "highlight",
                  template: { $state: "highlight" },
                },
              },
            ],
          },
          {
            type: "ValuePillGrid",
            tone: "outline",
            columns: 4,
            items: [
              {
                $repeat: {
                  over: "summary.tags",
                  as: "tag",
                  template: { $state: "tag" },
                },
              },
            ],
          },
        ],
      },
    ],
  } as const;
}

function createInvestmentSummaryPage() {
  return {
    type: "Page",
    sectionId: "investment-summary",
    header: "PROPOSAL",
    children: [
      {
        type: "Section",
        children: [
          {
            type: "SectionHeader",
            number: 9,
            name: "Investment summary",
          },
          {
            type: "Paragraph",
            muted: true,
            text: "The summary page stays intentionally simple so scenario-specific stress content elsewhere is easier to isolate.",
          },
          {
            type: "SummaryTable",
            rows: [
              {
                $repeat: {
                  over: "investment.rows",
                  as: "row",
                  template: {
                    label: { $state: "row.label" },
                    amount: { $state: "row.amount" },
                  },
                },
              },
            ],
            subtotalLabel: "Subtotal before taxes",
            subtotalAmount: { $state: "investment.subtotal" },
          },
          {
            type: "KeepTogether",
            children: [
              {
                type: "TotalCostBox",
                label: "Project total",
                amount: { $state: "investment.total" },
              },
              {
                type: "TaxDisclaimer",
                showIcon: true,
                text: "Taxes, final coordination, and approved change requests stay outside these direct renderer stress fixtures.",
              },
            ],
          },
          {
            type: "RichText",
            spans: [
              { text: "Commercial note: " },
              {
                text: "the rendering path is the system under test",
                bold: true,
                color: "#00AEEF",
              },
              {
                text: ", so this summary intentionally keeps the financial story stable across all scenarios.",
              },
            ],
          },
        ],
      },
    ],
  } as const;
}

function createAccessControlSection(
  projectTitle: string,
  projectIntro: string,
) {
  const bomItems = [
    createBomItem("AC", 0, "32-door Mercury controller panel", "Mercury", 1680),
    createBomItem("AC", 1, "Mullion reader with keypad", "HID", 420, 6),
    createBomItem("AC", 2, "Supervised door contact package", "HID", 118, 6),
    createBomItem("AC", 3, "Request-to-exit motion sensor", "Bosch", 86, 6),
  ];
  const labor = [
    { category: "Installation", amount: 3600 },
    { category: "Programming", amount: 1450 },
    { category: "Commissioning", amount: 900 },
  ];

  return {
    type: "ServiceSection",
    sectionId: "service-access-control",
    sectionNumber: 1,
    sectionName: "Access control",
    description:
      "Modernize six priority openings with new controllers, readers, and commissioning.",
    projectTitle,
    projectIntro,
    showProjectIntro: true,
    layout: "itemized-with-price",
    bomItems,
    bomSubtotal: sumBom(bomItems),
    laborCategories: labor,
    laborSubtotal: sumLabor(labor),
    totalCost: sumBom(bomItems) + sumLabor(labor),
  } as const;
}

function createVideoSection(projectTitle: string) {
  const bomItems = [
    createBomItem("VS", 0, "Indoor dome camera, 5MP", "Axis", 590, 4),
    createBomItem("VS", 1, "Multi-sensor loading dock camera", "Axis", 980, 1),
    createBomItem("VS", 2, "8-port PoE switch", "Cisco", 415, 2),
    createBomItem("VS", 3, "Video management licenses", "Genetec", 275, 5),
  ];

  return {
    type: "ServiceSection",
    sectionId: "service-video",
    sectionNumber: 2,
    sectionName: "Video surveillance",
    description:
      "Refresh camera coverage in the dock and corridor zones while keeping pricing summarized.",
    projectTitle,
    showProjectIntro: false,
    layout: "itemized-without-price",
    bomItems,
    bomSubtotal: sumBom(bomItems),
    totalCost: sumBom(bomItems),
  } as const;
}

function createRemoveSectionScenario(): ClaudeStyleScenario {
  const projectTitle = "Riverview Campus security refresh";
  const projectIntro =
    "This proposal reorganizes the core security scope into a cleaner first-pass narrative.";

  const accessControlSection = createAccessControlSection(
    projectTitle,
    projectIntro,
  );
  const videoSection = createVideoSection(projectTitle);
  const investmentTotal =
    accessControlSection.totalCost + videoSection.totalCost;

  return {
    slug: "remove-section-too-much",
    title: "Remove a section because it is too much",
    request:
      "The strategy page is too much for this version. Remove that section, keep the quote balanced, and let the detailed scope stay intact.",
    description:
      "Exercises structural pruning and TOC continuity after a dense page is removed from an otherwise complete proposal.",
    spec: {
      version: 1,
      brand: {
        translations: "en",
      },
      variables: {
        cover: {
          clientName: "Riverview Campus",
          documentType: "QUOTE",
          documentTitle: projectTitle,
          quoteId: "RV-ACVS-018",
          revision: 3,
          quoteDate: "2026-04-19",
          validUntil: "2026-05-31",
          preparedFor: [{ name: "Alicia Scott" }],
          preparedBy: [{ name: "Marc-Olivier Gagner" }],
        },
        project: {
          clientName: "Riverview Campus",
        },
        summary: {
          metrics: [
            { value: "6", label: "Controlled openings", trend: "Phase 1" },
            { value: "5", label: "Camera upgrades", trend: "Targeted refresh" },
            { value: "2", label: "Detailed services", trend: "Still included" },
            {
              value: "1",
              label: "Removed section",
              trend: "Less brochure, more signal",
            },
          ],
          highlights: [
            "The narrative is slimmer, but the scope pages stay untouched.",
            "TOC links still resolve across the two service sections.",
            "Investment summary remains stable after the document is trimmed.",
          ],
          tags: ["trimmed", "scope-first", "toc-safe", "rendered-direct"],
        },
        investment: {
          rows: [
            {
              label: "Access control scope",
              amount: accessControlSection.totalCost,
            },
            {
              label: "Video surveillance scope",
              amount: videoSection.totalCost,
            },
          ],
          subtotal: investmentTotal,
          total: investmentTotal,
        },
      },
      document: {
        type: "Document",
        lang: "en",
        children: [
          createCoverPage(),
          createTocPage(
            [
              { label: "Executive summary", sectionId: "executive-summary" },
              { label: "Investment summary", sectionId: "investment-summary" },
            ],
            [
              {
                label: "Detailed scope",
                sectionIds: ["service-access-control", "service-video"],
              },
            ],
          ),
          createExecutiveSummaryPage(),
          accessControlSection,
          videoSection,
          createInvestmentSummaryPage(),
        ],
      },
    },
  };
}

function createPlanImageScenario(
  planImageDataUri: string,
): ClaudeStyleScenario {
  const projectTitle = "North Annex phased modernization";
  const projectIntro =
    "This version adds a plan page in front of the priced sections so the client can orient themselves quickly.";

  const accessControlSection = createAccessControlSection(
    projectTitle,
    projectIntro,
  );
  const videoSection = createVideoSection(projectTitle);
  const investmentTotal =
    accessControlSection.totalCost + videoSection.totalCost + 4800;

  const planPage = {
    type: "Page",
    sectionId: "implementation-plan",
    header: "PROPOSAL",
    children: [
      {
        type: "Section",
        children: [
          {
            type: "SectionHeader",
            number: 2,
            name: "Implementation plan",
          },
          {
            type: "Paragraph",
            size: 11,
            text: {
              $template:
                "Add a lightweight plan page so {{project.clientName}} can see the sequence, image reference, and commercial options before the detailed BOM pages start.",
            },
          },
          {
            type: "Image",
            src: { $state: "plan.image" },
            width: 470,
            height: 150,
            align: "center",
          },
          {
            type: "Caption",
            text: "Image placeholder carried as a data URI to exercise the direct renderer path without relying on external URLs.",
          },
          {
            type: "Table",
            compact: true,
            columns: [
              { header: "Phase", width: "22%" },
              { header: "Focus", width: "44%" },
              { header: "Window", width: "17%" },
              { header: "Owner", width: "17%" },
            ],
            rows: [
              {
                $repeat: {
                  over: "plan.phases",
                  as: "phase",
                  template: [
                    { $state: "phase.name" },
                    { $state: "phase.focus" },
                    { $state: "phase.window" },
                    { $state: "phase.owner" },
                  ],
                },
              },
            ],
          },
          {
            type: "PriceComparison",
            options: [
              {
                $repeat: {
                  over: "plan.options",
                  as: "option",
                  template: {
                    title: { $state: "option.title" },
                    price: { $state: "option.price" },
                    features: [
                      {
                        $repeat: {
                          over: "option.features",
                          as: "feature",
                          template: { $state: "feature" },
                        },
                      },
                    ],
                    highlighted: { $state: "option.highlighted" },
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  } as const;

  return {
    slug: "add-plan-image",
    title: "Add a plan and image page",
    request:
      "Add a quick plan page with an image and commercial options before the detailed scope so the client can orient themselves faster.",
    description:
      "Exercises image data URIs, generic tables, and plan/option content inserted ahead of the service sections.",
    spec: {
      version: 1,
      brand: {
        translations: "en",
      },
      variables: {
        cover: {
          clientName: "North Annex",
          documentType: "PROPOSAL",
          documentTitle: projectTitle,
          quoteId: "NA-PLAN-024",
          revision: 1,
          quoteDate: "2026-04-19",
          validUntil: "2026-06-02",
          preparedFor: [{ name: "Dina Foster" }],
          preparedBy: [{ name: "Marc-Olivier Gagner" }],
        },
        project: {
          clientName: "North Annex",
        },
        summary: {
          metrics: [
            { value: "3", label: "Plan phases", trend: "Inserted page" },
            { value: "1", label: "Image block", trend: "Data URI" },
            {
              value: "3",
              label: "Plan options",
              trend: "Good / better / best",
            },
            { value: "2", label: "Scope sections", trend: "Still downstream" },
          ],
          highlights: [
            "The image is bound through variables instead of a raw external URL.",
            "The option cards sit on the same page as the implementation table.",
            "The service sections still render through the direct catalog path.",
          ],
          tags: ["plan-page", "image", "options", "bindings"],
        },
        plan: {
          image: planImageDataUri,
          phases: [
            {
              name: "Phase 1",
              focus: "Panel cleanup and riser confirmation",
              window: "Week 1",
              owner: "Noxe",
            },
            {
              name: "Phase 2",
              focus: "Reader swap and camera additions",
              window: "Week 2",
              owner: "Joint",
            },
            {
              name: "Phase 3",
              focus: "Commissioning, training, and turnover",
              window: "Week 3",
              owner: "Client",
            },
          ],
          options: [
            {
              title: "Core",
              price: investmentTotal - 4800,
              features: [
                "6 controlled openings",
                "Targeted camera refresh",
                "Standard handover",
              ],
            },
            {
              title: "Planned",
              price: investmentTotal,
              features: [
                "Adds phased coordination page",
                "Improved stakeholder walkthrough",
                "Expanded turnover package",
              ],
              highlighted: true,
            },
            {
              title: "Future-ready",
              price: investmentTotal + 6200,
              features: [
                "Planned document plus spare ports",
                "Advanced dashboards",
                "Longer commissioning window",
              ],
            },
          ] satisfies PriceOption[],
        },
        investment: {
          rows: [
            {
              label: "Access control scope",
              amount: accessControlSection.totalCost,
            },
            {
              label: "Video surveillance scope",
              amount: videoSection.totalCost,
            },
            { label: "Planning and stakeholder walkthrough", amount: 4800 },
          ],
          subtotal: investmentTotal,
          total: investmentTotal,
        },
      },
      document: {
        type: "Document",
        lang: "en",
        children: [
          createCoverPage(),
          createTocPage(
            [
              { label: "Executive summary", sectionId: "executive-summary" },
              {
                label: "Implementation plan",
                sectionId: "implementation-plan",
              },
              { label: "Investment summary", sectionId: "investment-summary" },
            ],
            [
              {
                label: "Detailed scope",
                sectionIds: ["service-access-control", "service-video"],
              },
            ],
          ),
          createExecutiveSummaryPage(),
          planPage,
          accessControlSection,
          videoSection,
          createInvestmentSummaryPage(),
        ],
      },
    },
  };
}

function createDualBomScenario(): ClaudeStyleScenario {
  const projectTitle = "West Atrium equipment rationalization";
  const projectIntro =
    "This scenario intentionally places two BOM cards back-to-back on a standard page.";

  const accessControlSection = createAccessControlSection(
    projectTitle,
    projectIntro,
  );
  const videoSection = createVideoSection(projectTitle);
  const investmentTotal =
    accessControlSection.totalCost + videoSection.totalCost + 4425;

  const coreItems = [
    createBomItem("SPLIT-AC", 0, "Controller enclosure", "Mercury", 1220, 1),
    createBomItem("SPLIT-AC", 1, "Reader/keypad combo", "HID", 398, 3),
    createBomItem("SPLIT-AC", 2, "Door contact set", "HID", 94, 3),
  ];
  const perimeterItems = [
    createBomItem("SPLIT-CAM", 0, "Exterior bullet camera", "Axis", 685, 2),
    createBomItem("SPLIT-CAM", 1, "Junction box kit", "Axis", 88, 2),
    createBomItem("SPLIT-CAM", 2, "Dedicated PoE injector", "Cisco", 76, 2),
  ];

  const dualBomPage = {
    type: "Page",
    sectionId: "equipment-split",
    header: "PROPOSAL",
    padding: 24,
    bottomReserve: 28,
    children: [
      {
        type: "SectionHeader",
        number: 2,
        name: "Equipment split",
      },
      {
        type: "Paragraph",
        size: 11,
        text: "Place two BOM tables on the same page, keep them visually close, and disable repeated fixed headers so the cards do not collide when rendered by react-pdf.",
      },
      {
        type: "BomTable",
        layout: "itemized-with-price",
        sectionName: "Core access package",
        repeatHeader: false,
        items: coreItems,
        subtotal: sumBom(coreItems),
      },
      {
        type: "Spacer",
        height: 12,
      },
      {
        type: "RichText",
        spans: [
          { text: "Placement note: " },
          {
            text: "these BOM cards are intentionally adjacent",
            bold: true,
            color: "#00AEEF",
          },
          {
            text: " so we can spot spacing regressions, repeated fixed-header collisions, and footer pressure quickly.",
          },
        ],
      },
      {
        type: "Spacer",
        height: 10,
      },
      {
        type: "BomTable",
        layout: "itemized-with-price",
        sectionName: "Perimeter video package",
        repeatHeader: false,
        items: perimeterItems,
        subtotal: sumBom(perimeterItems),
      },
      {
        type: "Caption",
        text: "This page exists purely as a renderer stress case and does not represent the final commercial grouping shown to the client.",
      },
    ],
  } as const;

  return {
    slug: "dual-bom-close-tables",
    title: "Two BOM tables close together",
    request:
      "Split the equipment into two BOM tables on the same page, or at least very close together, so we can inspect dense table behavior.",
    description:
      "Exercises standalone BomTable usage, adjacent table spacing, and the repeatHeader=false path that avoids fixed-header overlap.",
    spec: {
      version: 1,
      brand: {
        translations: "en",
      },
      variables: {
        cover: {
          clientName: "West Atrium",
          documentType: "QUOTE",
          documentTitle: projectTitle,
          quoteId: "WA-SPLIT-011",
          revision: 2,
          quoteDate: "2026-04-19",
          validUntil: "2026-05-28",
          preparedFor: [{ name: "Noah Romero" }],
          preparedBy: [{ name: "Marc-Olivier Gagner" }],
        },
        project: {
          clientName: "West Atrium",
        },
        summary: {
          metrics: [
            { value: "2", label: "Standalone BOM cards", trend: "Same page" },
            { value: "0", label: "Repeated BOM headers", trend: "Disabled" },
            { value: "6", label: "Stress rows", trend: "Across both cards" },
            { value: "1", label: "Inspection page", trend: "Dense layout" },
          ],
          highlights: [
            "The BOM cards use the catalog component directly instead of the higher-level quote path.",
            "The spacing between tables is intentionally tight but still readable.",
            "The footer reserve stays on so dense pages have breathing room.",
          ],
          tags: ["bom", "tables", "dense", "react-pdf"],
        },
        investment: {
          rows: [
            {
              label: "Detailed scope sections",
              amount: accessControlSection.totalCost + videoSection.totalCost,
            },
            { label: "Dense BOM inspection page", amount: 4425 },
          ],
          subtotal: investmentTotal,
          total: investmentTotal,
        },
      },
      document: {
        type: "Document",
        lang: "en",
        children: [
          createCoverPage(),
          createTocPage(
            [
              { label: "Executive summary", sectionId: "executive-summary" },
              { label: "Equipment split", sectionId: "equipment-split" },
              { label: "Investment summary", sectionId: "investment-summary" },
            ],
            [
              {
                label: "Detailed scope",
                sectionIds: ["service-access-control", "service-video"],
              },
            ],
          ),
          createExecutiveSummaryPage(),
          dualBomPage,
          accessControlSection,
          videoSection,
          createInvestmentSummaryPage(),
        ],
      },
    },
  };
}

function createAppendixScenario(): ClaudeStyleScenario {
  const projectTitle = "Harbor Hub multi-page narrative appendix";
  const projectIntro =
    "This variant keeps the priced scope intact and pushes extra storytelling into a free-form appendix.";

  const accessControlSection = createAccessControlSection(
    projectTitle,
    projectIntro,
  );
  const videoSection = createVideoSection(projectTitle);
  const investmentTotal =
    accessControlSection.totalCost + videoSection.totalCost + 3250;

  const appendixOverviewPage = {
    type: "Page",
    sectionId: "appendix-overview",
    header: "APPENDIX",
    children: [
      {
        type: "Section",
        children: [
          {
            type: "SectionHeader",
            number: 10,
            name: "Appendix overview",
          },
          {
            type: "Paragraph",
            size: 11,
            text: "This appendix is intentionally freer than the core quote pages. It mixes metrics, narrative notes, tables, and legal-style content across several pages.",
          },
          {
            type: "MetricGrid",
            columns: 3,
            items: [
              {
                $repeat: {
                  over: "appendix.metrics",
                  as: "metric",
                  template: {
                    value: { $state: "metric.value" },
                    label: { $state: "metric.label" },
                    trend: { $state: "metric.trend" },
                  },
                },
              },
            ],
          },
          {
            type: "Callout",
            variant: "warning",
            title: "Why this matters",
            text: "Sales-led appendix pages are often where visual regressions hide because they mix many components without a rigid schema-driven template.",
          },
          {
            type: "Table",
            columns: [
              { header: "Thread", width: "28%" },
              { header: "Question", width: "44%" },
              { header: "Owner", width: "28%" },
            ],
            rows: [
              {
                $repeat: {
                  over: "appendix.discoveryThreads",
                  as: "thread",
                  template: [
                    { $state: "thread.name" },
                    { $state: "thread.question" },
                    { $state: "thread.owner" },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  } as const;

  const appendixFieldNotesPage = {
    type: "Page",
    sectionId: "appendix-field-notes",
    header: "APPENDIX",
    children: [
      {
        type: "Section",
        children: [
          {
            type: "Heading",
            level: 2,
            text: "Field notes and assumptions",
          },
          {
            type: "RichText",
            align: "justify",
            spans: [
              {
                text: "Goal: ",
                bold: true,
              },
              {
                text: "let the appendix feel authored rather than templated, while still staying inside the catalog and preserving deterministic rendering.",
              },
            ],
          },
          {
            type: "KeyValueTable",
            columns: 2,
            labelWidthPercent: 38,
            rows: [
              {
                $repeat: {
                  over: "appendix.assumptions",
                  as: "assumption",
                  template: {
                    label: { $state: "assumption.label" },
                    value: { $state: "assumption.value" },
                  },
                },
              },
            ],
          },
          {
            type: "BulletList",
            variant: "dash",
            items: [
              {
                $repeat: {
                  over: "appendix.notes",
                  as: "note",
                  template: { $state: "note" },
                },
              },
            ],
          },
        ],
      },
    ],
  } as const;

  const appendixCommercialPage = {
    type: "Page",
    sectionId: "appendix-commercial",
    header: "APPENDIX",
    children: [
      {
        type: "Section",
        children: [
          {
            type: "Heading",
            level: 2,
            text: "Commercial notes",
          },
          {
            type: "Paragraph",
            muted: true,
            text: "The last appendix page leans a bit more contractual to verify that denser, longer-form content still feels deliberate.",
          },
          {
            type: "TermsAndConditions",
            columns: 1,
            sections: [
              {
                $repeat: {
                  over: "appendix.terms",
                  as: "term",
                  template: {
                    title: { $state: "term.title" },
                    text: { $state: "term.text" },
                  },
                },
              },
            ],
          },
          {
            type: "Link",
            text: "questions@noxe.example",
            href: "mailto:questions@noxe.example",
          },
        ],
      },
    ],
  } as const;

  return {
    slug: "freeform-multi-page-appendix",
    title: "Freer multi-page appendix",
    request:
      "Add a freer appendix that can breathe across multiple pages with a mix of metrics, notes, tables, and commercial commentary.",
    description:
      "Exercises a three-page appendix with varied component mixes, repeated data bindings, and TOC spanning rows for the appendix itself.",
    spec: {
      version: 1,
      brand: {
        translations: "en",
      },
      variables: {
        cover: {
          clientName: "Harbor Hub",
          documentType: "PROPOSAL",
          documentTitle: projectTitle,
          quoteId: "HH-APPX-007",
          revision: 4,
          quoteDate: "2026-04-19",
          validUntil: "2026-06-15",
          preparedFor: [{ name: "Priya Collins" }],
          preparedBy: [{ name: "Marc-Olivier Gagner" }],
        },
        project: {
          clientName: "Harbor Hub",
        },
        summary: {
          metrics: [
            { value: "3", label: "Appendix pages", trend: "Free-form" },
            { value: "4", label: "Terms blocks", trend: "Single column" },
            { value: "6", label: "Bound appendix notes", trend: "Repeated" },
            { value: "2", label: "Scope sections", trend: "Still standard" },
          ],
          highlights: [
            "The appendix is purposefully broader in tone than the main quote.",
            "Every appendix page is still a raw json-render Page node.",
            "TOC range handling gets exercised for a multi-page appendix cluster.",
          ],
          tags: ["appendix", "multi-page", "freeform", "coverage"],
        },
        appendix: {
          metrics: [
            { value: "12", label: "Stakeholders", trend: "Across 3 teams" },
            {
              value: "5",
              label: "Open questions",
              trend: "To close at kickoff",
            },
            {
              value: "18",
              label: "Draft openings",
              trend: "Impacted by phasing",
            },
          ],
          discoveryThreads: [
            {
              name: "Operations",
              question: "Which doors need after-hours unlock rules?",
              owner: "Client",
            },
            {
              name: "Facilities",
              question: "Which risers are safe to reuse for PoE?",
              owner: "Joint",
            },
            {
              name: "Security",
              question: "Where should alarm escalation land after hours?",
              owner: "Noxe",
            },
          ],
          assumptions: [
            {
              label: "Rack space",
              value: "One 12U slot remains available in MDF-1",
            },
            {
              label: "Power",
              value: "UPS-backed power exists for controller cabinets",
            },
            {
              label: "Network",
              value: "Security VLAN can absorb 18 new endpoints",
            },
            {
              label: "Access window",
              value: "Night shifts only during live door cutover",
            },
          ],
          notes: [
            "Some appendix content is intentionally more sales-authored than engineering-authored.",
            "The table and notes page should still feel balanced when exported directly to PDF.",
            "This scenario is where layout regressions around long supporting text tend to show up first.",
            "No chat path or AI SDK call is needed to produce any of these pages.",
          ],
          terms: [
            {
              title: "1. Planned sequencing",
              text: "Appendix sequencing remains indicative until kickoff workshops confirm access windows, site supervision, and cable reuse assumptions.",
            },
            {
              title: "2. Narrative content",
              text: "Narrative appendix pages may be edited for clarity without changing the structured priced scope, provided totals and service-section data remain consistent.",
            },
            {
              title: "3. Visual support",
              text: "Client-facing diagrams, notes, and roadmap tables can be expanded inside the appendix without requiring a separate rendering pipeline.",
            },
            {
              title: "4. Review cycle",
              text: "This appendix is intended for review comments, prioritization notes, and client education content before the final commercial issue.",
            },
          ],
        },
        investment: {
          rows: [
            {
              label: "Access control scope",
              amount: accessControlSection.totalCost,
            },
            {
              label: "Video surveillance scope",
              amount: videoSection.totalCost,
            },
            { label: "Narrative appendix package", amount: 3250 },
          ],
          subtotal: investmentTotal,
          total: investmentTotal,
        },
      },
      document: {
        type: "Document",
        lang: "en",
        children: [
          createCoverPage(),
          createTocPage(
            [
              { label: "Executive summary", sectionId: "executive-summary" },
              { label: "Investment summary", sectionId: "investment-summary" },
            ],
            [
              {
                label: "Detailed scope",
                sectionIds: ["service-access-control", "service-video"],
              },
              {
                label: "Appendix",
                sectionIds: [
                  "appendix-overview",
                  "appendix-field-notes",
                  "appendix-commercial",
                ],
              },
            ],
          ),
          createExecutiveSummaryPage(),
          accessControlSection,
          videoSection,
          createInvestmentSummaryPage(),
          appendixOverviewPage,
          appendixFieldNotesPage,
          appendixCommercialPage,
        ],
      },
    },
  };
}

export function buildClaudeStyleScenarios(
  options: ClaudeStyleScenarioOptions = {},
): ClaudeStyleScenario[] {
  const planImageDataUri =
    options.planImageDataUri ?? FALLBACK_PLAN_IMAGE_DATA_URI;

  return [
    createRemoveSectionScenario(),
    createPlanImageScenario(planImageDataUri),
    createDualBomScenario(),
    createAppendixScenario(),
  ];
}

export function getClaudeStyleScenario(
  slug: string,
  options: ClaudeStyleScenarioOptions = {},
): ClaudeStyleScenario | undefined {
  return buildClaudeStyleScenarios(options).find(
    (scenario) => scenario.slug === slug,
  );
}
