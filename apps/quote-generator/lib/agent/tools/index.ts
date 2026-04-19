import { askUserQuestionTool } from "./ask-user-question";
import { composeDocumentSpecTool } from "./compose-document-spec";
import { getDocumentCatalogTool } from "./get-document-catalog";
import { inspectContextFileTool } from "./inspect-context-file";
import { listQuoteLayoutsTool } from "./list-quote-layouts";
import { parseExcelTool } from "./parse-excel";
import { patchDocumentSpecTool } from "./patch-document-spec";
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
    inspect_context_file: inspectContextFileTool(ctx),
    propose_quote_skeleton: proposeQuoteSkeletonTool(ctx),
    patch_quote: patchQuoteTool(ctx),
    get_document_catalog: getDocumentCatalogTool(ctx),
    compose_document_spec: composeDocumentSpecTool(ctx),
    patch_document_spec: patchDocumentSpecTool(ctx),
    ask_user_question: askUserQuestionTool,
    render_pdf: renderPdfTool(ctx),
    list_quote_layouts: listQuoteLayoutsTool,
  };
}

export type QuoteAgentTools = ReturnType<typeof buildTools>;
