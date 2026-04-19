import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderSpec } from "../lib/json-render";
import { buildClaudeStyleScenarios } from "../lib/json-render/scenario-builder";
import { checkIntegrity } from "../lib/json-render/spec/integrity";
import { resolveBindings } from "../lib/json-render/spec/bindings";
import {
  specDocumentSchema,
  specEnvelopeSchema,
  type SpecDocument,
} from "../lib/json-render/spec/schema";

type CliOptions = {
  listOnly: boolean;
  skipRender: boolean;
  syncExamples: boolean;
  outDir: string;
  examplesDir: string;
  scenarioSlugs: string[];
};

type ScenarioSummary = {
  slug: string;
  title: string;
  request: string;
  description: string;
  componentTypes: string[];
  rawSpecPath: string;
  resolvedSpecPath: string;
  integrityIssues: ReturnType<typeof checkIntegrity>;
  pdfPath?: string;
  pdfBytes?: number;
  error?: string;
};

const scriptPath = fileURLToPath(import.meta.url);
const appRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultOutDir = path.join(
  appRoot,
  ".local",
  "direct-json-render-scenarios",
);
const defaultExamplesDir = path.join(
  appRoot,
  "examples",
  "json-render-scenarios",
);
const defaultPlanImagePath = path.join(
  appRoot,
  "public",
  "clientCompanyLogo.png",
);

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    listOnly: false,
    skipRender: false,
    syncExamples: false,
    outDir: defaultOutDir,
    examplesDir: defaultExamplesDir,
    scenarioSlugs: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--list") {
      options.listOnly = true;
      continue;
    }
    if (arg === "--skip-render") {
      options.skipRender = true;
      continue;
    }
    if (arg === "--sync-examples") {
      options.syncExamples = true;
      continue;
    }
    if (arg.startsWith("--scenario=")) {
      options.scenarioSlugs.push(arg.slice("--scenario=".length));
      continue;
    }
    if (arg === "--scenario") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("--scenario requires a value");
      }
      options.scenarioSlugs.push(next);
      index += 1;
      continue;
    }
    if (arg.startsWith("--out-dir=")) {
      options.outDir = path.resolve(appRoot, arg.slice("--out-dir=".length));
      continue;
    }
    if (arg === "--out-dir") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("--out-dir requires a value");
      }
      options.outDir = path.resolve(appRoot, next);
      index += 1;
      continue;
    }
    if (arg.startsWith("--examples-dir=")) {
      options.examplesDir = path.resolve(
        appRoot,
        arg.slice("--examples-dir=".length),
      );
      continue;
    }
    if (arg === "--examples-dir") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("--examples-dir requires a value");
      }
      options.examplesDir = path.resolve(appRoot, next);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function encodePngAsDataUri(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function collectComponentTypes(
  value: unknown,
  out = new Set<string>(),
): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectComponentTypes(item, out);
    }
    return [...out].sort();
  }

  if (!value || typeof value !== "object") {
    return [...out].sort();
  }

  const record = value as Record<string, unknown>;
  if (typeof record.type === "string") {
    out.add(record.type);
  }

  for (const child of Object.values(record)) {
    collectComponentTypes(child, out);
  }

  return [...out].sort();
}

function resolveScenarioSpec(rawSpec: unknown): SpecDocument {
  const envelope = specEnvelopeSchema.parse(rawSpec);
  const expanded = resolveBindings(
    envelope,
    (envelope.variables ?? {}) as Record<string, unknown>,
  );
  return specDocumentSchema.parse(expanded);
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function renderScenario(
  scenario: ReturnType<typeof buildClaudeStyleScenarios>[number],
  options: CliOptions,
): Promise<ScenarioSummary> {
  const rawSpecPath = path.join(options.outDir, `${scenario.slug}.json`);
  const resolvedSpecPath = path.join(
    options.outDir,
    `${scenario.slug}.resolved.json`,
  );
  const pdfPath = path.join(options.outDir, `${scenario.slug}.pdf`);

  try {
    const resolved = resolveScenarioSpec(scenario.spec);
    const integrityIssues = checkIntegrity(resolved);

    await writeJson(rawSpecPath, scenario.spec);
    await writeJson(resolvedSpecPath, resolved);

    let pdfBytes: number | undefined;
    if (!options.skipRender) {
      const pdf = await renderSpec(scenario.spec);
      await writeFile(pdfPath, pdf);
      pdfBytes = pdf.length;
    }

    return {
      slug: scenario.slug,
      title: scenario.title,
      request: scenario.request,
      description: scenario.description,
      componentTypes: collectComponentTypes(resolved),
      rawSpecPath,
      resolvedSpecPath,
      integrityIssues,
      pdfPath: options.skipRender ? undefined : pdfPath,
      pdfBytes,
    };
  } catch (error) {
    return {
      slug: scenario.slug,
      title: scenario.title,
      request: scenario.request,
      description: scenario.description,
      componentTypes: [],
      rawSpecPath,
      resolvedSpecPath,
      integrityIssues: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function syncExamples(
  scenarios: ReturnType<typeof buildClaudeStyleScenarios>,
  options: CliOptions,
) {
  await mkdir(options.examplesDir, { recursive: true });
  for (const scenario of scenarios) {
    const examplePath = path.join(options.examplesDir, `${scenario.slug}.json`);
    await writeJson(examplePath, scenario.spec);
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const planImageDataUri = encodePngAsDataUri(
    await readFile(defaultPlanImagePath),
  );

  const allScenarios = buildClaudeStyleScenarios({ planImageDataUri });

  if (options.listOnly) {
    console.log(
      JSON.stringify(
        allScenarios.map((scenario) => ({
          slug: scenario.slug,
          title: scenario.title,
          request: scenario.request,
          description: scenario.description,
        })),
        null,
        2,
      ),
    );
    return;
  }

  const selectedScenarios =
    options.scenarioSlugs.length > 0
      ? allScenarios.filter((scenario) =>
          options.scenarioSlugs.includes(scenario.slug),
        )
      : allScenarios;

  if (selectedScenarios.length === 0) {
    throw new Error("No matching scenarios selected.");
  }

  await mkdir(options.outDir, { recursive: true });

  if (options.syncExamples) {
    await syncExamples(selectedScenarios, options);
  }

  const summaries: ScenarioSummary[] = [];
  for (const scenario of selectedScenarios) {
    summaries.push(await renderScenario(scenario, options));
  }

  const summaryPath = path.join(options.outDir, "summary.json");
  await writeJson(summaryPath, {
    appRoot,
    outDir: options.outDir,
    examplesDir: options.syncExamples ? options.examplesDir : undefined,
    rendered: !options.skipRender,
    scenarios: summaries,
  });

  console.log(
    JSON.stringify(
      {
        outDir: options.outDir,
        summary: summaryPath,
        scenarios: summaries,
      },
      null,
      2,
    ),
  );
}

await main();
