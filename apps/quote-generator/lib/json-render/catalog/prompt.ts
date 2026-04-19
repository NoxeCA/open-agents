import type { z } from 'zod';
import type { CatalogCategory, CatalogComponent } from '../types';
import { catalog } from './index';

// ─── Zod → TS-like shape printer ──────────────────────────────────────────
// Best-effort; not a full Zod serializer but covers object/array/enum/union/
// literal/string/number/boolean/optional/default — enough for the component
// prop shapes we declare.

function describe(schema: z.ZodTypeAny): string | undefined {
  const d = (schema as any)._def?.description;
  return typeof d === 'string' ? d : undefined;
}

function defaultValue(schema: z.ZodTypeAny): string | undefined {
  const def = (schema as any)._def;
  if (def?.typeName === 'ZodDefault') {
    try {
      const v = def.defaultValue();
      return JSON.stringify(v);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function printType(schema: z.ZodTypeAny, depth = 0): string {
  const def = (schema as any)._def;
  const name = def?.typeName as string | undefined;
  const indent = '  '.repeat(depth + 1);

  switch (name) {
    case 'ZodString':
      return 'string';
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodLiteral':
      return JSON.stringify(def.value);
    case 'ZodEnum':
      return (def.values as string[]).map(v => JSON.stringify(v)).join(' | ');
    case 'ZodOptional':
      return `${printType(def.innerType, depth)} | undefined`;
    case 'ZodDefault':
      return printType(def.innerType, depth);
    case 'ZodNullable':
      return `${printType(def.innerType, depth)} | null`;
    case 'ZodArray':
      return `${printType(def.type, depth)}[]`;
    case 'ZodUnion':
    case 'ZodDiscriminatedUnion': {
      const opts: z.ZodTypeAny[] = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
      return opts.map(o => printType(o, depth)).join(' | ');
    }
    case 'ZodObject': {
      const shape = def.shape();
      const lines: string[] = ['{'];
      for (const [key, child] of Object.entries(shape)) {
        const childSchema = child as z.ZodTypeAny;
        const desc = describe(childSchema);
        const dflt = defaultValue(childSchema);
        const isOptional =
          (childSchema as any)._def?.typeName === 'ZodOptional' ||
          (childSchema as any)._def?.typeName === 'ZodDefault';
        if (desc) {
          lines.push(`${indent}// ${desc}${dflt !== undefined ? ` (default: ${dflt})` : ''}`);
        } else if (dflt !== undefined) {
          lines.push(`${indent}// default: ${dflt}`);
        }
        lines.push(`${indent}${key}${isOptional ? '?' : ''}: ${printType(childSchema, depth + 1)};`);
      }
      lines.push(`${'  '.repeat(depth)}}`);
      return lines.join('\n');
    }
    case 'ZodEffects':
      return printType(def.schema, depth);
    default:
      return 'unknown';
  }
}

export function printCatalogShape(props: z.ZodTypeAny): string {
  return printType(props);
}

// ─── Prompt builder ────────────────────────────────────────────────────────

const DEFAULT_SYSTEM =
  'You generate valid json-render spec documents for the Noxe quote PDF pipeline. ' +
  'Output a single JSON object matching the envelope shape (`version`, optional `brand`, optional `variables`, optional `attachments`, required `document`). ' +
  'Use only the components listed below. Never invent new component names. ' +
  'Noxe brand colors, fonts, logos, and company info are applied automatically — do not embed them.';

const DEFAULT_RULES = [
  'The first page must be a cover (header: false, footer: "none", single CoverBlock child).',
  'Tag every non-cover `Page` with a stable `sectionId` when you want the Table of Contents to reference it.',
  'Currency amounts are numbers in dollars (no string formatting); they are formatted per `document.lang`.',
  'For repeating content, prefer `$repeat` over `variables.X` to keep the document compact.',
  'Images must reference a known brand asset key or a `data:` URI. Never use raw URLs.',
  'ServiceSection is a document-level node; place it alongside Page nodes, not inside a Page.',
  'Prefer the crafted Noxe composites first (for example CoverBlock, ServiceSection, SummaryTable, TaxDisclaimer, TotalCostBox, TeamCard, PartnerGrid, TermsAndConditions) before rebuilding equivalent structure from low-level typography or table primitives.',
  'Use lower-level Paragraph, Table, Divider, Image, and similar primitives mainly for inserted content, appendix-style pages, or local section embellishments — not to flatten the whole quote into generic layout blocks.',
  'Treat this catalog as a flexible composition surface for custom pages and inserted content. For the live handcrafted quote renderer, standard section visibility should still be controlled through the stable quote paths rather than by assuming this draft alone governs the final PDF.',
];

const CATEGORY_ORDER: CatalogCategory[] = [
  'layout',
  'typography',
  'brand',
  'content',
  'table',
  'composite',
  'template',
];

function groupByCategory(): Record<CatalogCategory, CatalogComponent[]> {
  const groups: Record<CatalogCategory, CatalogComponent[]> = {
    layout: [],
    typography: [],
    brand: [],
    content: [],
    table: [],
    composite: [],
    template: [],
  };
  for (const entry of Object.values(catalog)) {
    groups[entry.category].push(entry);
  }
  return groups;
}

export interface BuildPromptOptions {
  system?: string;
  customRules?: string[];
  includeCategories?: CatalogCategory[];
}

export function buildPrompt(opts: BuildPromptOptions = {}): string {
  const system = opts.system ?? DEFAULT_SYSTEM;
  const rules = [...DEFAULT_RULES, ...(opts.customRules ?? [])];
  const groups = groupByCategory();
  const categoriesToRender = opts.includeCategories ?? CATEGORY_ORDER;

  const out: string[] = [];
  out.push(system);
  out.push('');
  out.push('## Rules');
  rules.forEach(rule => out.push(`- ${rule}`));
  out.push('');

  out.push('## Envelope');
  out.push('```ts');
  out.push('{');
  out.push('  version: 1;');
  out.push('  brand?: { company?: {...}; translations?: "fr" | "en" };');
  out.push('  variables?: Record<string, unknown>;');
  out.push('  attachments?: { filename: string; base64Content: string }[];');
  out.push('  document: { type: "Document"; lang?: "fr" | "en"; children: (Page | ServiceSection)[] };');
  out.push('}');
  out.push('```');
  out.push('');

  out.push('## Bindings');
  out.push('- `{ "$state": "path.to.variable" }` — resolves from `variables` or the enclosing `$repeat` scope.');
  out.push('- `{ "$template": "Hello {{clientName}}" }` — mustache substitution.');
  out.push('- `{ "$cond": { "if": "path", "then": <node>, "else": <node> } }`');
  out.push('- `{ "$repeat": { "over": "variables.items", "as": "item", "template": <node> } }` — `@index` is exposed in scope.');
  out.push('');

  out.push('## Components');
  for (const cat of categoriesToRender) {
    const list = groups[cat];
    if (!list || list.length === 0) continue;
    out.push(`### ${cat}`);
    out.push('');
    for (const c of list) {
      out.push(`#### ${c.name} (${c.kind})`);
      out.push(c.description);
      out.push('```ts');
      out.push(`${c.name}Props = ${printCatalogShape(c.props)}`);
      out.push('```');
      if (c.examples && c.examples.length > 0) {
        for (const ex of c.examples) {
          out.push(`**Example — ${ex.label}**`);
          out.push('```json');
          out.push(JSON.stringify(ex.spec, null, 2));
          out.push('```');
        }
      }
      out.push('');
    }
  }
  return out.join('\n');
}

export interface CatalogManifest {
  version: 1;
  components: {
    name: string;
    kind: 'leaf' | 'container';
    category: CatalogCategory;
    description: string;
    shape: string;
  }[];
}

export function buildManifest(): CatalogManifest {
  return {
    version: 1,
    components: Object.values(catalog).map(c => ({
      name: c.name,
      kind: c.kind,
      category: c.category,
      description: c.description,
      shape: printCatalogShape(c.props),
    })),
  };
}
