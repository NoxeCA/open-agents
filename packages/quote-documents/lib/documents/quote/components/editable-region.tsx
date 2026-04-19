import { View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";

import {
  quoteRichContentBlocksSchema,
  type QuoteRichContentBlock,
} from "../rich-content";
import { QuoteRichContentRenderer } from "../rich-content-renderer";

type RegionRecord = Record<string, unknown>;

const LOCAL_REGION_CONTAINER_KEYS = [
  "documentContent",
  "documentRegions",
  "regions",
  "contentRegions",
  "regionBlocks",
  "editableRegions",
] as const;

function asRecord(value: unknown): RegionRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RegionRecord)
    : null;
}

function tokenize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueBlocks(blocks: QuoteRichContentBlock[]) {
  const seen = new Set<string>();
  const resolved: QuoteRichContentBlock[] = [];

  for (const block of blocks) {
    const key = JSON.stringify(block);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    resolved.push(block);
  }

  return resolved;
}

function buildNameVariants(value: string) {
  const tokens = tokenize(value);
  if (tokens.length === 0) {
    return [];
  }

  const camel = tokens
    .map((token, index) =>
      index === 0 ? token : `${token[0]?.toUpperCase() ?? ""}${token.slice(1)}`,
    )
    .join("");

  return unique([
    value,
    tokens.join("-"),
    tokens.join("_"),
    tokens.join(" "),
    camel,
  ]);
}

function normalizeIdentifier(value: string) {
  return tokenize(value).join(".");
}

function parseBlocks(value: unknown): QuoteRichContentBlock[] {
  const candidate = asRecord(value)?.blocks ?? value;
  const result = quoteRichContentBlocksSchema.safeParse(candidate);
  return result.success ? result.data : [];
}

function collectExactRegionBlocks(source: unknown, regionIds: string[]) {
  const record = asRecord(source);
  if (!record || regionIds.length === 0) {
    return [];
  }

  const documentContent = asRecord(record.documentContent);
  const containers = [
    asRecord(documentContent?.regions),
    asRecord(record.documentRegions),
    asRecord(record.regions),
    asRecord(record.contentRegions),
    asRecord(record.regionBlocks),
    asRecord(record.editableRegions),
  ].filter(Boolean) as RegionRecord[];

  const resolved: QuoteRichContentBlock[] = [];

  for (const container of containers) {
    for (const regionId of regionIds) {
      if (!(regionId in container)) {
        continue;
      }

      resolved.push(...parseBlocks(container[regionId]));
    }
  }

  return resolved;
}

function readPathValue(value: unknown, path: string[]) {
  let current = value;

  for (const segment of path) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      current =
        Number.isInteger(index) && index >= 0 ? current[index] : undefined;
      continue;
    }

    const record = asRecord(current);
    if (!record) {
      return undefined;
    }

    current = record[segment];
  }

  return current;
}

function resolveBlocksFromEntryArray(
  entries: unknown[],
  candidateIds: string[],
  sectionNames: string[],
  anchorNames: string[],
  itemIndex?: number,
) {
  const normalizedIds = new Set(candidateIds.map(normalizeIdentifier));
  const normalizedSections = new Set(sectionNames.map(normalizeIdentifier));
  const normalizedAnchors = new Set(anchorNames.map(normalizeIdentifier));
  const resolved: QuoteRichContentBlock[] = [];

  for (const entry of entries) {
    const record = asRecord(entry);
    if (!record) {
      continue;
    }

    const entryId = [
      record.id,
      record.target,
      record.path,
      record.region,
      record.name,
    ]
      .filter((value): value is string => typeof value === "string")
      .find((value) => normalizedIds.has(normalizeIdentifier(value)));

    if (entryId) {
      resolved.push(...parseBlocks(record.blocks ?? record.content ?? record));
      continue;
    }

    const entrySection = [record.section, record.scope, record.page, record.key]
      .filter((value): value is string => typeof value === "string")
      .find((value) => normalizedSections.has(normalizeIdentifier(value)));

    const entryAnchor = [record.anchor, record.slot, record.position]
      .filter((value): value is string => typeof value === "string")
      .find((value) => normalizedAnchors.has(normalizeIdentifier(value)));

    if (!entrySection || !entryAnchor) {
      continue;
    }

    const entryIndex =
      typeof record.itemIndex === "number"
        ? record.itemIndex
        : typeof record.serviceIndex === "number"
          ? record.serviceIndex
          : typeof record.index === "number"
            ? record.index
            : undefined;

    if (
      typeof itemIndex === "number" &&
      typeof entryIndex === "number" &&
      entryIndex !== itemIndex
    ) {
      continue;
    }

    resolved.push(...parseBlocks(record.blocks ?? record.content ?? record));
  }

  return resolved;
}

function resolveBlocksFromContainer(
  container: unknown,
  candidateIds: string[],
  candidatePaths: string[][],
  sectionNames: string[],
  anchorNames: string[],
  itemIndex?: number,
) {
  if (Array.isArray(container)) {
    return resolveBlocksFromEntryArray(
      container,
      candidateIds,
      sectionNames,
      anchorNames,
      itemIndex,
    );
  }

  const record = asRecord(container);
  if (!record) {
    return [];
  }

  const resolved: QuoteRichContentBlock[] = [];
  const normalizedIds = new Set(candidateIds.map(normalizeIdentifier));

  for (const [key, value] of Object.entries(record)) {
    if (!normalizedIds.has(normalizeIdentifier(key))) {
      continue;
    }

    resolved.push(...parseBlocks(value));
  }

  for (const path of candidatePaths) {
    resolved.push(...parseBlocks(readPathValue(record, path)));
  }

  return resolved;
}

function collectLocalRegionBlocks(source: unknown, anchorNames: string[]) {
  const record = asRecord(source);
  if (!record) {
    return [];
  }

  const resolved: QuoteRichContentBlock[] = [];

  for (const key of LOCAL_REGION_CONTAINER_KEYS) {
    const container =
      key === "documentContent"
        ? asRecord(record.documentContent)?.regions
        : record[key];

    if (!container) {
      continue;
    }

    for (const anchorName of anchorNames) {
      resolved.push(
        ...resolveBlocksFromContainer(
          container,
          [anchorName],
          [[anchorName]],
          [],
          [anchorName],
        ),
      );
    }
  }

  return resolved;
}

function collectRootRegionContainers(source: unknown) {
  const record = asRecord(source);
  const documentContent = asRecord(record?.documentContent);

  return [
    documentContent?.regions,
    record?.documentRegions,
    record?.regions,
    record?.contentRegions,
    record?.regionBlocks,
    record?.editableRegions,
  ].filter((value): value is unknown => value !== undefined && value !== null);
}

export interface QuoteEditableRegionProps {
  root?: unknown;
  local?: unknown;
  section: string;
  anchor: string;
  index?: number;
  regionIds?: string[];
  sectionAliases?: string[];
  anchorAliases?: string[];
  blockSources?: unknown[];
  style?: ComponentProps<typeof View>["style"];
}

export function QuoteEditableRegion({
  root,
  local,
  section,
  anchor,
  index,
  regionIds = [],
  sectionAliases = [],
  anchorAliases = [],
  blockSources = [],
  style,
}: QuoteEditableRegionProps) {
  const sectionNames = unique(
    [section, ...sectionAliases].flatMap(buildNameVariants),
  );
  const anchorNames = unique(
    [anchor, ...anchorAliases].flatMap(buildNameVariants),
  );
  const stableScopes = unique(
    [section, ...sectionAliases].map((value) => tokenize(value).join("-")),
  );
  const stableAnchors = unique(
    [anchor, ...anchorAliases].map((value) => tokenize(value).join("-")),
  );

  const candidateIds = unique([
    ...regionIds,
    ...stableScopes.flatMap((scope) =>
      stableAnchors.flatMap((stableAnchor) =>
        typeof index === "number"
          ? [`${scope}:${index}:${stableAnchor}`]
          : [`${scope}:${stableAnchor}`],
      ),
    ),
    ...sectionNames.flatMap((sectionName) =>
      anchorNames
        .flatMap((anchorName) =>
          typeof index === "number"
            ? [
                `${sectionName}.${index}.${anchorName}`,
                `${sectionName}[${index}].${anchorName}`,
                `${sectionName}/${index}/${anchorName}`,
              ]
            : [],
        )
        .concat(
          anchorNames.map((anchorName) => `${sectionName}.${anchorName}`),
        ),
    ),
  ]);

  const candidatePaths = unique(
    sectionNames.flatMap((sectionName) =>
      anchorNames.flatMap((anchorName) =>
        typeof index === "number"
          ? [
              JSON.stringify([sectionName, String(index), anchorName]),
              JSON.stringify([sectionName, anchorName]),
            ]
          : [JSON.stringify([sectionName, anchorName])],
      ),
    ),
  ).map((value) => JSON.parse(value) as string[]);

  // Prefer exact keyed regions like documentContent.regions["service:0:after-tax"].
  const exactBlocks = uniqueBlocks([
    ...collectExactRegionBlocks(root, regionIds),
    ...collectExactRegionBlocks(local, regionIds),
  ]);

  const blocks =
    exactBlocks.length > 0
      ? exactBlocks
      : uniqueBlocks([
          ...blockSources.flatMap(parseBlocks),
          ...collectLocalRegionBlocks(local, anchorNames),
          ...collectRootRegionContainers(root).flatMap((container) =>
            resolveBlocksFromContainer(
              container,
              candidateIds,
              candidatePaths,
              sectionNames,
              anchorNames,
              index,
            ),
          ),
        ]);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <View style={style}>
      <QuoteRichContentRenderer blocks={blocks} />
    </View>
  );
}

export default QuoteEditableRegion;
