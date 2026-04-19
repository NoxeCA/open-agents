export const SPEC_LIMITS = {
  maxBodyBytes: 1_048_576, // 1 MiB
  maxDepth: 32,
  maxNodeCount: 2000,
};

export class SpecLimitError extends Error {
  readonly limit: keyof typeof SPEC_LIMITS;
  readonly actual: number;
  constructor(limit: keyof typeof SPEC_LIMITS, actual: number, message?: string) {
    super(message ?? `Spec exceeds ${limit} (actual: ${actual}, limit: ${SPEC_LIMITS[limit]})`);
    this.limit = limit;
    this.actual = actual;
  }
}

/**
 * Counts nodes emitted by `$repeat` expansion. Shared across every repeat in
 * a single resolve pass so a large outer repeat containing a large inner
 * repeat still trips the limit.
 *
 * The static walker in {@link enforceLimits} can't see these: it runs on the
 * unexpanded tree where a 10000-element `$repeat` is still just one node.
 */
export class RepeatBudget {
  private emitted = 0;

  /** Record `n` newly-emitted nodes. Throws if the global cap is crossed. */
  tick(n: number): void {
    this.emitted += n;
    if (this.emitted > SPEC_LIMITS.maxNodeCount) {
      throw new SpecLimitError('maxNodeCount', this.emitted);
    }
  }

  /** Total nodes emitted so far by `$repeat` during this resolve pass. */
  get count(): number {
    return this.emitted;
  }
}

function walk(node: unknown, depth: number, counts: { nodes: number; maxDepth: number }): void {
  if (depth > counts.maxDepth) counts.maxDepth = depth;
  if (depth > SPEC_LIMITS.maxDepth) {
    throw new SpecLimitError('maxDepth', depth);
  }
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, depth + 1, counts);
    return;
  }
  if (typeof node !== 'object') return;
  counts.nodes++;
  if (counts.nodes > SPEC_LIMITS.maxNodeCount) {
    throw new SpecLimitError('maxNodeCount', counts.nodes);
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    walk(value, depth + 1, counts);
  }
}

export function enforceLimits(spec: unknown): void {
  const counts = { nodes: 0, maxDepth: 0 };
  walk(spec, 0, counts);
}
