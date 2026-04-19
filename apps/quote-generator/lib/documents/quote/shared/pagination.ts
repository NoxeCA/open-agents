/** Stores the start and end page number for a section */
export interface SectionPageRange {
  start: number;
  end: number;
}

/** Mutable object populated during pass 1, read during pass 2 */
export type PageNumberCollector = Record<string, SectionPageRange>;

/** Consistent section keys used by both markers and TOC */
export const SECTION_KEYS = {
  aboutUs: 'aboutUs',
  culture: 'culture',
  ceoMessage: 'ceoMessage',
  team: 'team',
  partners: 'partners',
  proposalDescription: 'proposalDescription',
  serviceKey: (index: number) => `service-${index}`,
  projectSummary: 'projectSummary',
  optionalKey: (index: number) => `optional-${index}`,
  exclusionsConditions: 'exclusionsConditions',
  termsAndConditions: 'termsAndConditions',
} as const;

/** Format a page range for TOC display: "9", "9-12", or "—" */
export function formatPageRange(range: SectionPageRange | undefined): string {
  if (!range) return '-';
  if (range.start === range.end) return String(range.start);
  return `${range.start}-${range.end}`;
}
