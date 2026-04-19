import type { z } from 'zod';

export interface FormattedZodIssue {
  path: string;
  message: string;
  hint?: string;
}

/**
 * Render a Zod error into a flat list of `{ path, message, hint? }` entries.
 *
 * - `path` is a JSON-pointer-ish dotted string:
 *   `document.children[3].children[0].items`.
 * - `message` is tuned for spec authors: unknown component types get an
 *   explicit "Expected one of: …" list rather than Zod's default.
 * - `hint` suggests a near-miss when Levenshtein distance to a known option
 *   is 2 or less (e.g. "CoverBlok" -> "CoverBlock").
 */
export function formatZodError(err: z.ZodError): FormattedZodIssue[] {
  return err.issues.map(issue => {
    const path = formatPath(issue.path);
    const issueCode = (issue as { code?: string }).code;

    if (issueCode === 'invalid_union_discriminator') {
      const options = (issue as unknown as { options?: unknown[] }).options ?? [];
      const stringOptions = options.filter((o): o is string => typeof o === 'string');
      // Zod doesn't surface `received` on this code directly, so also fish it
      // out of the bag of extra fields that may be present.
      const received =
        (issue as unknown as { received?: unknown }).received ??
        (issue as unknown as { value?: unknown }).value;
      const receivedLabel = received === undefined ? 'unknown' : JSON.stringify(received);
      const message = `Unknown component type ${receivedLabel}. Expected one of: ${stringOptions
        .map(o => `"${o}"`)
        .join(', ')}.`;
      const hint =
        typeof received === 'string' ? suggest(received, stringOptions) : undefined;
      return hint ? { path, message, hint } : { path, message };
    }

    return { path, message: issue.message };
  });
}

function formatPath(segments: ReadonlyArray<PropertyKey>): string {
  let out = '';
  for (const seg of segments) {
    if (typeof seg === 'number') {
      out += `[${seg}]`;
    } else if (typeof seg === 'string') {
      out += out ? `.${seg}` : seg;
    } else {
      out += out ? `.[${String(seg)}]` : String(seg);
    }
  }
  return out;
}

function suggest(received: string, options: string[]): string | undefined {
  let best: { opt: string; d: number } | null = null;
  for (const opt of options) {
    const d = levenshtein(received, opt);
    if (best === null || d < best.d) best = { opt, d };
  }
  if (best && best.d <= 2) {
    return `Did you mean "${best.opt}"?`;
  }
  return undefined;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}
