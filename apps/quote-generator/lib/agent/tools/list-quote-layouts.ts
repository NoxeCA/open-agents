import { tool } from "ai";
import { z } from "zod";

import type { ListQuoteLayoutsOutput } from "../tool-types";

const LAYOUTS: ListQuoteLayoutsOutput = [
  {
    layout: "zero-ventilation",
    description:
      "Single combined table (materials + labor + totals). Use when the client only wants a bottom-line number.",
  },
  {
    layout: "itemized-without-price",
    description:
      "BOM lists parts without unit prices or labor amounts. Use for detailed technical proposals where pricing is hidden.",
  },
  {
    layout: "itemized-with-price",
    description:
      "Full BOM with qty, part, OEM, unit price, total. Default.",
  },
];

export const listQuoteLayoutsTool = tool({
  description:
    "List the available PDF layouts with a short description of each. Use when the user asks about layout options or when you need to choose a live pricing posture to set on the quote through `/documentPlan/pricingLayout`.",
  inputSchema: z.object({}),
  execute: async (): Promise<ListQuoteLayoutsOutput> => LAYOUTS,
});
