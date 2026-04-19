import { describe, expect, test } from "bun:test";

import {
  buildQuoteJsonRenderEnvelope,
  getPersistedQuoteJsonRenderEnvelope,
} from "./json-render-bridge";
import { buildQuoteFixture } from "./document-plan-fixtures";
import { emptyQuoteData } from "./defaults";
import { normalizeQuoteData } from "./normalize";
import { quoteDataSchema, type QuoteData } from "./schema";

describe("quote json-render state", () => {
  test("seeds a persisted json-render state for empty quotes", () => {
    const normalized = normalizeQuoteData(
      emptyQuoteData() as Partial<QuoteData>,
    );

    expect(normalized.jsonRender).toBeDefined();
    expect(normalized.jsonRender?.spec.document.children).toHaveLength(1);
    expect(
      normalized.jsonRender?.spec.variables?.documentContent,
    ).toBeDefined();
    expect(
      (normalized.jsonRender?.spec.variables?.quote as Record<string, unknown>)
        ?.documentTitle,
    ).toBe("Proposition sans titre");
  });

  test("preserves an authored raw envelope through normalization", () => {
    const normalized = normalizeQuoteData({
      ...buildQuoteFixture(),
      lang: "en",
      documentTitle: "Security modernization",
      projectIntro: "A preserved custom intro.",
      jsonRender: {
        version: 1,
        document: {
          type: "Document",
          children: [
            {
              type: "Page",
              sectionId: "custom-overview",
              children: [
                {
                  type: "Heading",
                  text: "Custom overview",
                },
              ],
            },
          ],
        },
      },
    } as Partial<QuoteData>);
    const parsed = quoteDataSchema.parse(normalized);

    expect(parsed.jsonRender?.version).toBe(1);
    expect(parsed.jsonRender?.spec.document.lang).toBe("en");
    expect(parsed.jsonRender?.spec.document.children[0]).toMatchObject({
      sectionId: "custom-overview",
    });
    expect(parsed.jsonRender?.spec.variables?.quote).toBeDefined();
  });

  test("promotes a legacy top-level draft into canonical jsonRender state", () => {
    const normalized = normalizeQuoteData({
      ...buildQuoteFixture(),
      jsonRenderDraft: {
        version: 1,
        document: {
          type: "Document",
          lang: "fr",
          children: [
            {
              type: "Page",
              sectionId: "custom-plan-page",
              children: [
                {
                  type: "Heading",
                  text: "Legacy draft page",
                },
              ],
            },
          ],
        },
      },
    } as Partial<QuoteData> & { jsonRenderDraft: unknown });

    expect(normalized.jsonRender?.spec.document.children[0]).toMatchObject({
      sectionId: "custom-plan-page",
    });
  });

  test("reads persisted spec envelopes from canonical jsonRender state", () => {
    const persisted = getPersistedQuoteJsonRenderEnvelope({
      ...buildQuoteFixture(),
      jsonRender: {
        version: 1,
        spec: {
          version: 1,
          document: {
            type: "Document",
            lang: "en",
            children: [
              {
                type: "Page",
                sectionId: "persisted-spec",
                children: [
                  {
                    type: "Heading",
                    text: "Persisted spec",
                  },
                ],
              },
            ],
          },
        },
      },
    } as Partial<QuoteData>);

    expect(persisted).not.toBeNull();
    expect(persisted?.document.children[0]).toMatchObject({
      sectionId: "persisted-spec",
    });
  });

  test("ignores the seeded placeholder spec for fresh quotes", () => {
    const normalized = normalizeQuoteData(
      emptyQuoteData() as Partial<QuoteData>,
    );

    expect(getPersistedQuoteJsonRenderEnvelope(normalized)).toBeNull();
  });

  test("builds a full quote envelope for sparse fresh quotes", () => {
    const normalized = normalizeQuoteData(
      emptyQuoteData() as Partial<QuoteData>,
    );

    const envelope = buildQuoteJsonRenderEnvelope(normalized);

    expect(envelope.document.children[0]).toMatchObject({
      type: "Page",
    });
    expect(envelope.document.children.length).toBeGreaterThan(1);
  });
});
