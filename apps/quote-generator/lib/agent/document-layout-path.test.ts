import { describe, expect, test } from "bun:test";

import {
  buildDocumentPlanPricingLayoutPath,
  resolveDocumentPlanPricingLayoutPath,
} from "./document-layout-path";

describe("document pricing layout paths", () => {
  test("builds the stable semantic pricing layout path", () => {
    expect(buildDocumentPlanPricingLayoutPath()).toBe(
      "/documentPlan/pricingLayout",
    );
  });

  test("maps live and legacy layout paths onto the handcrafted renderer path", () => {
    expect(
      resolveDocumentPlanPricingLayoutPath("/documentPlan/pricingLayout"),
    ).toBe("/documentPlan/serviceLayoutPolicy");

    expect(
      resolveDocumentPlanPricingLayoutPath(
        "/jsonRender/spec/variables/quote/composition/serviceLayoutPolicy",
      ),
    ).toBe("/documentPlan/serviceLayoutPolicy");

    expect(
      resolveDocumentPlanPricingLayoutPath(
        "/jsonRenderDraft/variables/quote/documentPlan/serviceLayout",
      ),
    ).toBe("/documentPlan/serviceLayoutPolicy");
  });
});
