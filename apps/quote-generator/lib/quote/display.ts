const UNTITLED_QUOTE_TITLES = new Set(["Untitled quote", "Devis sans titre"]);

export function getDisplayQuoteTitle(title: string | null | undefined): string {
  const normalized = title?.trim();

  if (!normalized || UNTITLED_QUOTE_TITLES.has(normalized)) {
    return "Devis sans titre";
  }

  return normalized;
}
