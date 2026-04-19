import { SpecBindingError, type SpecBindingDetail } from './errors';
import { RepeatBudget } from './limits';
import {
  formatCurrency,
  formatDateLong,
  formatNumber,
} from '@/lib/documents/quote/shared/formatters';

type Variables = Record<string, unknown>;

/**
 * Context threaded through every binding-resolution call.
 *
 * - `variables`: the envelope's `variables` object (named lookups).
 * - `scope`: per-iteration bindings (e.g. `$repeat.as`, `@index`).
 * - `path`: JSON-pointer-ish location used in error messages.
 * - `lang`: document language, used by `$format`. Default 'fr'.
 * - `budget`: node-emission budget enforced during `$repeat` expansion.
 */
export interface BindingContext {
  variables: Variables;
  scope: Record<string, unknown>;
  path: string;
  lang: 'fr' | 'en';
  budget: RepeatBudget;
}

type FormatKind = 'currency' | 'date-long' | 'date-short' | 'number';

/**
 * Resolve a dotted path against the binding context.
 *
 * Supports `variables.*`, bare top-level paths resolved against variables,
 * scope entries (including `@index`), and the `arr[*].field` iterator (only
 * valid as a whole path — not a prefix in further segments).
 *
 * Returns `undefined` for missing paths; downstream Zod validation surfaces
 * a clearer error than a generic binding failure.
 */
function resolvePath(expression: string, ctx: BindingContext): unknown {
  const trimmed = expression.trim();

  // `arr[*].field` — iterate an array and pluck `field` from each element.
  const starMatch = trimmed.match(/^([^[]+)\[\*\](?:\.(.+))?$/);
  if (starMatch) {
    const [, basePath, fieldPath] = starMatch;
    const base = resolvePath(basePath, ctx);
    if (!Array.isArray(base)) return undefined;
    if (!fieldPath) return base;
    return base.map(item => {
      if (item == null || typeof item !== 'object') return undefined;
      let cursor: unknown = item;
      for (const seg of fieldPath.split('.')) {
        if (cursor == null || typeof cursor !== 'object') return undefined;
        cursor = (cursor as Record<string, unknown>)[seg];
      }
      return cursor;
    });
  }

  const [head, ...rest] = trimmed.split('.');
  let current: unknown;

  if (head === 'variables') {
    current = ctx.variables;
  } else if (head in ctx.scope) {
    current = ctx.scope[head];
  } else {
    // Allow bare dotted paths like "client.name" — resolve against variables.
    current = ctx.variables[head];
  }

  for (const segment of rest) {
    if (current == null) return undefined;
    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      current = current[Number(segment)];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveValue(value: unknown, ctx: BindingContext): unknown {
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    value.forEach((item, i) => {
      const childCtx: BindingContext = { ...ctx, path: `${ctx.path}[${i}]` };
      if (isObj(item) && '$repeat' in item) {
        const expanded = resolveRepeat(item as Record<string, unknown>, childCtx);
        out.push(...expanded);
      } else {
        out.push(resolveValue(item, childCtx));
      }
    });
    return out;
  }
  if (!isObj(value)) return value;

  if ('$state' in value) {
    const expr = value['$state'];
    if (typeof expr !== 'string') {
      throw new SpecBindingError([{ path: ctx.path, message: '$state must be a string path' }]);
    }
    // Return undefined silently for missing paths. If a downstream field is
    // required by the catalog, post-expand Zod validation surfaces a clearer
    // error than a generic binding failure.
    return resolvePath(expr, ctx);
  }

  if ('$template' in value) {
    const template = value['$template'];
    if (typeof template !== 'string') {
      throw new SpecBindingError([{ path: ctx.path, message: '$template must be a string' }]);
    }
    return applyTemplate(template, ctx);
  }

  if ('$cond' in value) {
    return resolveCond(value['$cond'], ctx);
  }

  if ('$repeat' in value) {
    // $repeat only valid as an array element, caught above. Throw if seen here.
    throw new SpecBindingError([
      { path: ctx.path, message: '$repeat is only valid inside an array' },
    ]);
  }

  if ('$sum' in value) {
    return resolveSum(value['$sum'], ctx);
  }

  if ('$count' in value) {
    return resolveCount(value['$count'], ctx);
  }

  if ('$format' in value) {
    return resolveFormat(value['$format'], ctx);
  }

  if ('$if-present' in value) {
    return resolveIfPresent(value['$if-present'], ctx);
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    const resolved = resolveValue(v, { ...ctx, path: ctx.path ? `${ctx.path}.${k}` : k });
    if (resolved !== undefined) {
      out[k] = resolved;
    }
  }
  return out;
}

function applyTemplate(template: string, ctx: BindingContext): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr: string) => {
    const resolved = resolvePath(expr, ctx);
    if (resolved === undefined || resolved === null) {
      throw new SpecBindingError([
        { path: ctx.path, message: `$template path "${expr}" resolved to undefined` },
      ]);
    }
    return String(resolved);
  });
}

type CondOp = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'present' | 'absent';

function compare(left: unknown, op: CondOp, right: unknown): boolean {
  switch (op) {
    case 'eq':
      return left === right;
    case 'neq':
      return left !== right;
    case 'lt':
      return typeof left === 'number' && typeof right === 'number' && left < right;
    case 'lte':
      return typeof left === 'number' && typeof right === 'number' && left <= right;
    case 'gt':
      return typeof left === 'number' && typeof right === 'number' && left > right;
    case 'gte':
      return typeof left === 'number' && typeof right === 'number' && left >= right;
    case 'present':
      return left !== undefined && left !== null;
    case 'absent':
      return left === undefined || left === null;
  }
}

const COND_OPS: readonly CondOp[] = [
  'eq',
  'neq',
  'lt',
  'lte',
  'gt',
  'gte',
  'present',
  'absent',
];

function resolveCond(cond: unknown, ctx: BindingContext): unknown {
  if (!isObj(cond)) {
    throw new SpecBindingError([{ path: ctx.path, message: '$cond must be an object' }]);
  }
  const testExpr = cond['if'];
  if (typeof testExpr !== 'string') {
    throw new SpecBindingError([
      { path: ctx.path, message: '$cond.if must be a string path' },
    ]);
  }
  const leftValue = resolvePath(testExpr, ctx);

  let truthy: boolean;
  if ('op' in cond) {
    const op = cond['op'];
    if (typeof op !== 'string' || !COND_OPS.includes(op as CondOp)) {
      throw new SpecBindingError([
        {
          path: ctx.path,
          message: `$cond.op must be one of: ${COND_OPS.join(', ')}`,
        },
      ]);
    }
    truthy = compare(leftValue, op as CondOp, cond['value']);
  } else {
    truthy = Boolean(leftValue);
  }

  const branch = truthy ? cond['then'] : cond['else'];
  if (branch === undefined) return undefined;
  return resolveValue(branch, ctx);
}

function resolveRepeat(node: Record<string, unknown>, ctx: BindingContext): unknown[] {
  const repeat = node['$repeat'];
  if (!isObj(repeat)) {
    throw new SpecBindingError([{ path: ctx.path, message: '$repeat must be an object' }]);
  }
  const overExpr = repeat['over'];
  const as = repeat['as'];
  const template = repeat['template'];
  if (typeof overExpr !== 'string' || typeof as !== 'string' || template === undefined) {
    throw new SpecBindingError([
      { path: ctx.path, message: '$repeat requires `over` (string), `as` (string), `template`' },
    ]);
  }
  const collection = resolvePath(overExpr, ctx);
  if (!Array.isArray(collection)) {
    throw new SpecBindingError([
      { path: ctx.path, message: `$repeat.over path "${overExpr}" did not resolve to an array` },
    ]);
  }

  // Budget-enforce before materializing the expanded array, so oversized
  // repeats blow up early with a clean SpecLimitError rather than OOMing.
  ctx.budget.tick(collection.length);

  return collection.map((item, index) => {
    const scope = { ...ctx.scope, [as]: item, '@index': index };
    return resolveValue(template, {
      ...ctx,
      scope,
      path: `${ctx.path}[${index}]`,
    });
  });
}

function resolveSum(expr: unknown, ctx: BindingContext): number {
  if (typeof expr !== 'string') {
    throw new SpecBindingError([{ path: ctx.path, message: '$sum must be a string path' }]);
  }
  const value = resolvePath(expr, ctx);
  if (value === undefined || value === null) return 0;
  if (!Array.isArray(value)) {
    throw new SpecBindingError([
      { path: ctx.path, message: `$sum path "${expr}" did not resolve to an array` },
    ]);
  }
  let total = 0;
  for (const item of value) {
    if (item === undefined || item === null) continue;
    if (typeof item !== 'number' || !Number.isFinite(item)) {
      throw new SpecBindingError([
        {
          path: ctx.path,
          message: `$sum path "${expr}" contains a non-numeric element (${typeof item})`,
        },
      ]);
    }
    total += item;
  }
  return total;
}

function resolveCount(expr: unknown, ctx: BindingContext): number {
  if (typeof expr !== 'string') {
    throw new SpecBindingError([{ path: ctx.path, message: '$count must be a string path' }]);
  }
  const value = resolvePath(expr, ctx);
  if (value === undefined || value === null) return 0;
  if (!Array.isArray(value)) {
    throw new SpecBindingError([
      { path: ctx.path, message: `$count path "${expr}" did not resolve to an array` },
    ]);
  }
  return value.length;
}

const FORMAT_KINDS: readonly FormatKind[] = ['currency', 'date-long', 'date-short', 'number'];

function resolveFormat(node: unknown, ctx: BindingContext): string {
  if (!isObj(node)) {
    throw new SpecBindingError([{ path: ctx.path, message: '$format must be an object' }]);
  }
  const kind = node['kind'];
  if (typeof kind !== 'string' || !FORMAT_KINDS.includes(kind as FormatKind)) {
    throw new SpecBindingError([
      {
        path: ctx.path,
        message: `$format.kind must be one of: ${FORMAT_KINDS.join(', ')}`,
      },
    ]);
  }
  const rawValue = resolveValue(node['value'], ctx);
  if (rawValue === undefined || rawValue === null) {
    throw new SpecBindingError([
      { path: ctx.path, message: `$format.value resolved to ${rawValue}` },
    ]);
  }

  switch (kind as FormatKind) {
    case 'currency': {
      if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
        throw new SpecBindingError([
          { path: ctx.path, message: `$format currency expects a number, got ${typeof rawValue}` },
        ]);
      }
      return formatCurrency(rawValue, ctx.lang);
    }
    case 'number': {
      if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
        throw new SpecBindingError([
          { path: ctx.path, message: `$format number expects a number, got ${typeof rawValue}` },
        ]);
      }
      return formatNumber(rawValue, ctx.lang);
    }
    case 'date-long': {
      if (typeof rawValue !== 'string') {
        throw new SpecBindingError([
          { path: ctx.path, message: `$format date-long expects a YYYY-MM-DD string` },
        ]);
      }
      return formatDateLong(rawValue, ctx.lang);
    }
    case 'date-short': {
      if (typeof rawValue !== 'string') {
        throw new SpecBindingError([
          { path: ctx.path, message: `$format date-short expects a YYYY-MM-DD string` },
        ]);
      }
      // `date-short` is the input form itself (YYYY-MM-DD) — no helper needed.
      return rawValue;
    }
  }
}

function resolveIfPresent(expr: unknown, ctx: BindingContext): unknown {
  if (typeof expr !== 'string') {
    throw new SpecBindingError([
      { path: ctx.path, message: '$if-present must be a string path' },
    ]);
  }
  const value = resolvePath(expr, ctx);
  if (value === undefined || value === null) return undefined;
  return value;
}

/**
 * Resolve all binding operators (`$state`, `$template`, `$cond`, `$repeat`,
 * `$sum`, `$count`, `$format`, `$if-present`) in `spec`.
 *
 * The input's `document.lang` (default `'fr'`) drives formatting.
 * Over-large `$repeat` expansions throw `SpecLimitError('maxNodeCount')`.
 */
export function resolveBindings<T>(spec: T, variables: Variables = {}): T {
  const lang = readLang(spec);
  const ctx: BindingContext = {
    variables,
    scope: {},
    path: '',
    lang,
    budget: new RepeatBudget(),
  };
  return resolveValue(spec, ctx) as T;
}

function readLang(spec: unknown): 'fr' | 'en' {
  if (isObj(spec)) {
    const doc = spec['document'];
    if (isObj(doc)) {
      const lang = doc['lang'];
      if (lang === 'en' || lang === 'fr') return lang;
    }
  }
  return 'fr';
}

export { SpecBindingError };
export type { SpecBindingDetail };
