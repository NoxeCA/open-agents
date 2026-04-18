import { askUserQuestionTool } from "./ask-user-question";
import { listQuoteLayoutsTool } from "./list-quote-layouts";
import { parseExcelTool } from "./parse-excel";
import { patchQuoteTool } from "./patch-quote";
import { proposeQuoteSkeletonTool } from "./propose-quote-skeleton";
import { renderPdfTool } from "./render-pdf";

export type BuildToolsContext = {
  quoteId: string;
  userId: string;
};

export function buildTools(ctx: BuildToolsContext) {
  return {
    parse_excel: parseExcelTool(ctx),
    propose_quote_skeleton: proposeQuoteSkeletonTool(ctx),
    patch_quote: patchQuoteTool(ctx),
    ask_user_question: askUserQuestionTool,
    render_pdf: renderPdfTool(ctx),
    list_quote_layouts: listQuoteLayoutsTool,
  };
}

export type QuoteAgentTools = ReturnType<typeof buildTools>;
