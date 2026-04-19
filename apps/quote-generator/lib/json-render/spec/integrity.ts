import { ASSET_KEYS } from '../env';
import type { SpecDocument } from './schema';

/**
 * One finding produced by {@link checkIntegrity}.
 *
 * `toc-dangling` and `image-unknown-asset` are fatal; callers should throw
 * `IntegrityError`. `duplicate-section-id` is a warning — the TOC two-pass
 * render will pick the first match but downstream authors should know.
 */
export type IntegrityIssue =
  | { kind: 'toc-dangling'; path: string; sectionId: string }
  | { kind: 'image-unknown-asset'; path: string; src: string }
  | { kind: 'duplicate-section-id'; path: string; sectionId: string };

/**
 * Thrown by the renderer when integrity findings include a fatal issue.
 * `.issues` contains the full list (including any non-fatal warnings).
 */
export class IntegrityError extends Error {
  readonly issues: IntegrityIssue[];
  constructor(issues: IntegrityIssue[]) {
    const summary = issues
      .map(i => {
        if (i.kind === 'toc-dangling') return `${i.path}: TOC refers to unknown sectionId "${i.sectionId}"`;
        if (i.kind === 'image-unknown-asset') return `${i.path}: Image.src "${i.src}" is not a known asset key or data URI`;
        return `${i.path}: duplicate sectionId "${i.sectionId}"`;
      })
      .join('; ');
    super(`Spec integrity failed: ${summary}`);
    this.issues = issues;
  }
}

interface SectionIndex {
  // sectionId -> list of paths where it was declared (for duplicate detection).
  byId: Map<string, string[]>;
}

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Collect every declared `sectionId` on `Page` and `ServiceSection` nodes.
 *
 * A `ServiceSection` without an explicit `sectionId` is treated as
 * `service-<sectionNumber>` to match the runtime default described by the
 * catalog schema.
 */
function collectSectionIds(root: unknown, path: string, idx: SectionIndex): void {
  if (Array.isArray(root)) {
    root.forEach((item, i) => collectSectionIds(item, `${path}[${i}]`, idx));
    return;
  }
  if (!isObj(root)) return;

  const type = root['type'];
  if (type === 'Page' && typeof root['sectionId'] === 'string') {
    const id = root['sectionId'];
    const existing = idx.byId.get(id) ?? [];
    existing.push(path);
    idx.byId.set(id, existing);
  } else if (type === 'ServiceSection') {
    let id: string | undefined;
    if (typeof root['sectionId'] === 'string') {
      id = root['sectionId'];
    } else if (typeof root['sectionNumber'] === 'number') {
      id = `service-${root['sectionNumber']}`;
    }
    if (id) {
      const existing = idx.byId.get(id) ?? [];
      existing.push(path);
      idx.byId.set(id, existing);
    }
  }

  for (const [k, v] of Object.entries(root)) {
    collectSectionIds(v, path ? `${path}.${k}` : k, idx);
  }
}

function walkForIssues(
  node: unknown,
  path: string,
  idx: SectionIndex,
  issues: IntegrityIssue[],
  assetKeys: Set<string>
): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => walkForIssues(item, `${path}[${i}]`, idx, issues, assetKeys));
    return;
  }
  if (!isObj(node)) return;

  const type = node['type'];

  if (type === 'TocEntries') {
    const entries = node['entries'];
    if (Array.isArray(entries)) {
      entries.forEach((entry, i) => {
        if (isObj(entry) && typeof entry['sectionId'] === 'string') {
          const sid = entry['sectionId'];
          if (!idx.byId.has(sid)) {
            issues.push({
              kind: 'toc-dangling',
              path: `${path}.entries[${i}].sectionId`,
              sectionId: sid,
            });
          }
        }
      });
    }
    const combine = node['combine'];
    if (Array.isArray(combine)) {
      combine.forEach((row, i) => {
        if (isObj(row) && Array.isArray(row['sectionIds'])) {
          row['sectionIds'].forEach((sid: unknown, j: number) => {
            if (typeof sid === 'string' && !idx.byId.has(sid)) {
              issues.push({
                kind: 'toc-dangling',
                path: `${path}.combine[${i}].sectionIds[${j}]`,
                sectionId: sid,
              });
            }
          });
        }
      });
    }
  }

  if (type === 'Image' && typeof node['src'] === 'string') {
    const src = node['src'];
    if (!src.startsWith('data:') && !assetKeys.has(src)) {
      issues.push({ kind: 'image-unknown-asset', path: `${path}.src`, src });
    }
  }

  for (const [k, v] of Object.entries(node)) {
    walkForIssues(v, path ? `${path}.${k}` : k, idx, issues, assetKeys);
  }
}

/**
 * Walk a resolved spec and return referential-integrity findings.
 *
 * Checks:
 * - `TocEntries.entries[].sectionId` and `combine[].sectionIds[]` point to a
 *   `Page` or `ServiceSection` that actually exists in the document.
 * - `Image.src` is either a `data:` URI or one of the declared asset keys.
 * - Warn (non-fatal) when two section-bearing nodes share a `sectionId`.
 *
 * Callers decide how to react; the renderer throws on fatal kinds and
 * `console.warn`s duplicates.
 */
export function checkIntegrity(resolvedSpec: SpecDocument): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const idx: SectionIndex = { byId: new Map() };
  const assetKeys = new Set<string>(ASSET_KEYS);

  const children = resolvedSpec.document?.children ?? [];
  children.forEach((child, i) => {
    collectSectionIds(child, `document.children[${i}]`, idx);
  });

  for (const [sid, paths] of idx.byId) {
    if (paths.length > 1) {
      for (let i = 1; i < paths.length; i++) {
        issues.push({ kind: 'duplicate-section-id', path: paths[i], sectionId: sid });
      }
    }
  }

  children.forEach((child, i) => {
    walkForIssues(child, `document.children[${i}]`, idx, issues, assetKeys);
  });

  return issues;
}
