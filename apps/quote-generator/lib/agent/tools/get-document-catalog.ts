import { tool } from "ai";
import { z } from "zod";

import { describeDocumentCatalog } from "@/lib/quote/document/builder";

import type { DocumentCatalogOutput } from "../tool-types";

export const getDocumentCatalogTool = tool({
  description:
    "Return the available document themes, density presets, accent palettes, section kinds, and component building blocks for the quote presentation catalog.",
  inputSchema: z.object({}),
  execute: async (): Promise<DocumentCatalogOutput> => {
    return describeDocumentCatalog();
  },
});
