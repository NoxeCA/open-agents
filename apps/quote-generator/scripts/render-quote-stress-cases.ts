import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeQuoteData } from "../lib/quote/normalize";
import { renderQuotePdf } from "../lib/quote/render";
import { quoteDataSchema } from "../lib/quote/schema";

type Json = Record<string, unknown>;

const appRoot = process.cwd();
const sampleJsonPath = path.join(
  appRoot,
  "examples",
  "quote-json-render.sample.json",
);
const outputDir = path.join(appRoot, ".local", "stress-suite");

function clone<T>(value: T): T {
  return structuredClone(value);
}

function makeBomItem(index: number, prefix: string) {
  const qty = (index % 3) + 1;
  const unitPrice = 85 + index * 17;
  return {
    qty,
    partNumber: `${prefix}-${String(index + 1).padStart(2, "0")}`,
    description: `Composant ${prefix} ${index + 1}`,
    oem: index % 2 === 0 ? "Genetec" : "HID",
    unitPrice,
    total: qty * unitPrice,
  };
}

function buildLongParagraph(title: string, sentences: number) {
  const parts: string[] = [];
  for (let index = 0; index < sentences; index += 1) {
    parts.push(
      `${title} ${index + 1}: cette section documente les hypotheses de coordination, les interfaces techniques, la logique d'exploitation et les points de vigilance chantier pour conserver un devis lisible mais tres detaille.`,
    );
  }
  return parts.join(" ");
}

async function loadBaseInput(): Promise<Json> {
  const rawJson = await readFile(sampleJsonPath, "utf8");
  return JSON.parse(rawJson) as Json;
}

async function renderCase(
  slug: string,
  title: string,
  mutate: (input: Json) => Json,
) {
  const input = mutate(await loadBaseInput());
  const normalized = quoteDataSchema.parse(normalizeQuoteData(input));
  const pdf = await renderQuotePdf(normalized);

  const jsonPath = path.join(outputDir, `${slug}.json`);
  const normalizedPath = path.join(outputDir, `${slug}.normalized.json`);
  const pdfPath = path.join(outputDir, `${slug}.pdf`);

  await writeFile(jsonPath, `${JSON.stringify(input, null, 2)}\n`, "utf8");
  await writeFile(
    normalizedPath,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );
  await writeFile(pdfPath, pdf);

  return {
    slug,
    title,
    input: jsonPath,
    normalized: normalizedPath,
    pdf: pdfPath,
    pdfBytes: pdf.length,
  };
}

function withDualTableAppendix(base: Json): Json {
  const quote = clone(base);
  const optionalPages = ((quote.optionalPages as unknown[]) ?? []).slice();
  optionalPages.push({
    pageTitle: "ANNEXE STRATEGIQUE",
    title: "Comparatif fonctionnel",
    blocks: [
      {
        type: "paragraph",
        tone: "lead",
        text: "On pousse ici un vrai cas funky: deux tableaux consecutifs sur une seule page, avec du contexte commercial avant, entre, et apres.",
      },
      {
        type: "table",
        title: "Tableau A - Portes et profils",
        columns: [{ label: "Porte" }, { label: "Profil" }, { label: "Mode" }],
        rows: [
          ["P1", "Administration", "Carte + PIN"],
          ["P2", "Personnel", "Carte"],
          ["P3", "Visiteurs", "Interphone"],
        ],
      },
      { type: "spacer", height: 18 },
      {
        type: "paragraph",
        tone: "muted",
        text: "Le second tableau reste sur la meme page pour verifier que le systeme supporte bien une mise en page plus dense sans casser la hierarchie visuelle.",
      },
      {
        type: "table",
        title: "Tableau B - Infrastructure",
        columns: [
          { label: "Sujet" },
          { label: "Etat actuel" },
          { label: "Cible", align: "right" },
        ],
        rows: [
          ["Controleurs", "1", "3"],
          ["Lecteurs", "2", "16"],
          ["Portes gerees", "2", "18"],
        ],
      },
      {
        type: "quote",
        text: "Ce scenario simule exactement le type de modification libre qu'un vendeur voudrait inserer au milieu du document sans toucher au style global.",
        attribution: "Stress test JSON render",
      },
    ],
  });
  quote.optionalPages = optionalPages;
  return quote;
}

function withAllSectionsAndLongNarrative(base: Json): Json {
  const quote = clone(base);
  quote.includeAboutUs = true;
  quote.includeCulture = true;
  quote.includeCeoMessage = true;
  quote.includeTeam = true;
  quote.includePartners = true;
  quote.includeTermsAndConditions = true;
  quote.projectTitle = "LC Connect - All Sections Stress";
  quote.projectIntro = buildLongParagraph("Narratif de projet", 6);

  const regions = clone(
    ((quote.documentContent as Json | undefined)?.regions as Json | undefined) ??
      {},
  );

  regions["proposal:body"] = {
    target: { scope: "proposal", anchor: "body" },
    label: "Proposal body",
    locationHints: ["proposal body"],
    blocks: [
      {
        type: "heading",
        level: "h2",
        text: "Pourquoi ce devis est volontairement charge",
      },
      {
        type: "paragraph",
        tone: "lead",
        text: buildLongParagraph("Bloc narratif", 5),
      },
      {
        type: "list",
        title: "Ce qu'on veut verifier",
        items: [
          "Ajout de beaucoup de contenu sans changer le systeme visuel",
          "Conservation des sauts de page propres",
          "Compatibilite des regions libres avec les sections brochure",
        ],
      },
    ],
  };

  quote.documentContent = {
    version: 1,
    regions,
  };

  const optionalPages = ((quote.optionalPages as unknown[]) ?? []).slice();
  optionalPages.push(
    {
      pageTitle: "GENETEC",
      title: "Presentation de plateforme",
      blocks: [
        {
          type: "paragraph",
          tone: "lead",
          text: buildLongParagraph("Genetec", 7),
        },
        {
          type: "stats",
          title: "Indicateurs",
          items: [
            { label: "Sites", value: "3" },
            { label: "Lecteurs", value: "16" },
            { label: "Roles", value: "5" },
          ],
        },
      ],
    },
    {
      pageTitle: "CONTROLE D'ACCES",
      title: "Logique d'exploitation",
      blocks: [
        {
          type: "paragraph",
          tone: "body",
          text: buildLongParagraph("Controle d'acces", 8),
        },
        {
          type: "table",
          title: "Sequences d'usage",
          columns: [{ label: "Moment" }, { label: "Action" }, { label: "But" }],
          rows: [
            ["Matin", "Ouverture planifiee", "Fluidite"],
            ["Jour", "Controle par profil", "Securite"],
            ["Soir", "Verrouillage auto", "Reduction du risque"],
          ],
        },
      ],
    },
  );
  quote.optionalPages = optionalPages;
  return quote;
}

function withBomOverload(base: Json): Json {
  const quote = clone(base);
  const services = clone((quote.services as Json[]) ?? []);

  const overloadedItems = Array.from({ length: 22 }, (_, index) =>
    makeBomItem(index, "AC"),
  );
  services[0] = {
    ...services[0],
    sectionName: "Controle d'acces - surcharge materiel",
    description:
      "On surcharge volontairement la premiere section avec beaucoup de lignes BOM pour tester la pagination et la lisibilite.",
    bomItems: overloadedItems,
    bomSubtotal: overloadedItems.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    ),
    totalCost:
      overloadedItems.reduce((sum, item) => sum + Number(item.total), 0) + 1800,
    laborSubtotal: 1800,
    laborCategories: [
      { category: "Installation", amount: 900 },
      { category: "Programmation", amount: 600 },
      { category: "Mise en service", amount: 300 },
    ],
    tableIntroBlocks: [
      {
        type: "paragraph",
        tone: "lead",
        text: "Ce cas cherche a casser la page service avec une tres longue table tout en gardant les notes et les totaux coherents.",
      },
    ],
    tableOutroBlocks: [
      {
        type: "paragraph",
        tone: "muted",
        text: "Si cette section reste propre a l'impression, on sait que la base est deja beaucoup plus robuste.",
      },
    ],
  };

  quote.services = services;
  quote.projectSummary = {
    description:
      "Stress test avec une tres grosse premiere section materiel et des zones de texte libres autour des tableaux.",
    subtotal: Number(services[0]?.bomSubtotal ?? 0),
    totalProjectCost: Number(services[0]?.totalCost ?? 0),
  };
  return quote;
}

function withKitchenSink(base: Json): Json {
  const quote = clone(withAllSectionsAndLongNarrative(withDualTableAppendix(base)));
  const services = clone((quote.services as Json[]) ?? []);

  services.push(
    {
      sectionNumber: 2,
      sectionName: "Intrusion",
      description: "Ajout d'une section complete intrusion pour pousser la variete.",
      bomItems: Array.from({ length: 8 }, (_, index) => makeBomItem(index, "IN")),
      bomSubtotal: 2328,
      laborCategories: [
        { category: "Installation", amount: 900 },
        { category: "Programmation", amount: 450 },
      ],
      laborSubtotal: 1350,
      totalCost: 3678,
      layout: "itemized-with-price",
      overviewBlocks: [
        {
          type: "paragraph",
          tone: "lead",
          text: "Cette section intrusion a son propre narratif avant le tableau.",
        },
      ],
      tableIntroBlocks: [
        {
          type: "paragraph",
          tone: "muted",
          text: "On place encore du contenu avant le tableau pour verifier l'empilage des regions.",
        },
      ],
      tableOutroBlocks: [
        {
          type: "table",
          title: "Mini tableau sous tableau",
          columns: [{ label: "Lot" }, { label: "Statut" }],
          rows: [
            ["Intrusion", "Inclus"],
            ["Coordination", "Incluse"],
          ],
        },
      ],
    },
    {
      sectionNumber: 3,
      sectionName: "Services professionnels",
      description: "Une section sans BOM lourd mais avec cadrage executif.",
      bomItems: [],
      bomSubtotal: 0,
      laborCategories: [
        { category: "Gestion de projet", amount: 1200 },
        { category: "Formation", amount: 600 },
      ],
      laborSubtotal: 1800,
      totalCost: 1800,
      layout: "zero-ventilation",
      overviewBlocks: [
        {
          type: "heading",
          level: "h3",
          text: "Volet accompagnement",
        },
        {
          type: "paragraph",
          text: "Cette section simule un bloc plus conseil / gouvernance, sans abandonner la presentation Noxe.",
        },
      ],
      tableIntroBlocks: [
        {
          type: "quote",
          text: "Le vendeur doit pouvoir enrichir ce genre de page sans demander un nouveau champ schema a chaque fois.",
          attribution: "Besoin produit",
        },
      ],
      footerBlocks: [
        {
          type: "paragraph",
          tone: "muted",
          text: "Bloc de fermeture sous la ventilation zero pour verifier les zones libres de fin de section.",
        },
      ],
    },
  );

  quote.services = services;
  quote.projectSummary = {
    description:
      "Scenario maximaliste: toutes les sections brochure, trois services, regions libres, doubles tableaux et longues annexes.",
    subtotal: 7842,
    totalProjectCost: 11517,
  };
  return quote;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const cases = [
    {
      slug: "01-baseline",
      title: "Baseline sample",
      mutate: (input: Json) => input,
    },
    {
      slug: "02-dual-table-appendix",
      title: "Dual table appendix on one page",
      mutate: withDualTableAppendix,
    },
    {
      slug: "03-all-sections-long-narrative",
      title: "All sections plus long-form narrative pages",
      mutate: withAllSectionsAndLongNarrative,
    },
    {
      slug: "04-bom-overload",
      title: "Heavy BOM pagination stress test",
      mutate: withBomOverload,
    },
    {
      slug: "05-kitchen-sink",
      title: "Kitchen sink layout stress test",
      mutate: withKitchenSink,
    },
  ] as const;

  const results = [];
  for (const testCase of cases) {
    try {
      results.push(
        await renderCase(testCase.slug, testCase.title, testCase.mutate),
      );
    } catch (error) {
      results.push({
        slug: testCase.slug,
        title: testCase.title,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const summaryPath = path.join(outputDir, "summary.json");
  await writeFile(summaryPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputDir, summary: summaryPath, results }, null, 2));
}

await main();
