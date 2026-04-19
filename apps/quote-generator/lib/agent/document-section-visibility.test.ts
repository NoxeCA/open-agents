import { describe, expect, test } from "bun:test";

import { buildQuoteFixture } from "@/lib/quote/document-plan-fixtures";
import { normalizeQuoteData } from "@/lib/quote/normalize";

import {
  buildDocumentPlanSectionVisibilityPath,
  resolveDocumentPlanSectionVisibilityPath,
} from "./document-section-visibility";

describe("document section visibility paths", () => {
  test("builds stable semantic visibility paths", () => {
    expect(buildDocumentPlanSectionVisibilityPath("commercial")).toBe(
      "/documentPlan/sectionVisibility/commercial",
    );
    expect(buildDocumentPlanSectionVisibilityPath("overview")).toBe(
      "/documentPlan/sectionVisibility/overview",
    );
  });

  test("resolves semantic visibility paths onto sectionSelections indexes", () => {
    const normalized = normalizeQuoteData(buildQuoteFixture());

    expect(
      resolveDocumentPlanSectionVisibilityPath(
        normalized,
        "/documentPlan/sectionVisibility/overview",
      ),
    ).toBe("/documentPlan/sectionSelections/1/enabled");

    expect(
      resolveDocumentPlanSectionVisibilityPath(
        normalized,
        "/documentPlan/sectionVisibility/commercial",
      ),
    ).toBe("/documentPlan/sectionSelections/8/enabled");
  });

  test("maps legacy json-render sectionSelection paths onto live visibility paths", () => {
    const normalized = normalizeQuoteData(buildQuoteFixture());

    expect(
      resolveDocumentPlanSectionVisibilityPath(
        normalized,
        "/jsonRender/spec/variables/quote/composition/sectionSelections/1/enabled",
      ),
    ).toBe("/documentPlan/sectionSelections/1/enabled");

    expect(
      resolveDocumentPlanSectionVisibilityPath(
        normalized,
        "/jsonRenderDraft/variables/quote/documentPlan/sectionSelections/8/enabled",
      ),
    ).toBe("/documentPlan/sectionSelections/8/enabled");
  });
});
