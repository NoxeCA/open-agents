import { applyPatch as fjpApply, type Operation } from "fast-json-patch";
import { quoteDataSchema, type QuoteData } from "./schema";

export type { Operation };

export function applyPatch(data: Partial<QuoteData>, ops: Operation[]): Partial<QuoteData> {
  const clone = structuredClone(data);
  const result = fjpApply(clone as object, ops, true, false);
  return result.newDocument as Partial<QuoteData>;
}

export function validatePartial(data: unknown): { issues: { path: string; message: string }[] } {
  const parsed = quoteDataSchema.partial().safeParse(data);
  if (parsed.success) return { issues: [] };
  return {
    issues: parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}
