function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isSeededQuoteJsonRenderPlaceholderSpec(candidate: unknown) {
  const record = isRecord(candidate) ? candidate : null;
  const document = isRecord(record?.document) ? record.document : null;
  const children = Array.isArray(document?.children) ? document.children : null;
  if (!children || children.length !== 1) {
    return false;
  }

  const firstPage = isRecord(children[0]) ? children[0] : null;
  if (!firstPage || firstPage.type !== "Page") {
    return false;
  }

  if (firstPage.header !== false || firstPage.footer !== "none") {
    return false;
  }

  const pageChildren = Array.isArray(firstPage.children) ? firstPage.children : null;
  if (!pageChildren || pageChildren.length !== 3) {
    return false;
  }

  const [labelNode, headingNode, paragraphNode] = pageChildren.map((child) =>
    isRecord(child) ? child : null,
  );

  const labelText = isRecord(labelNode?.text) ? labelNode.text : null;
  const headingText = isRecord(headingNode?.text) ? headingNode.text : null;
  const paragraphText = isRecord(paragraphNode?.text)
    ? paragraphNode.text
    : null;

  return (
    labelNode?.type === "Label" &&
    labelNode.uppercase === true &&
    labelText?.$state === "quote.documentType" &&
    headingNode?.type === "Heading" &&
    headingNode.level === 1 &&
    headingText?.$state === "quote.documentTitle" &&
    paragraphNode?.type === "Paragraph" &&
    paragraphNode.muted === true &&
    paragraphText?.$state === "quote.projectIntro"
  );
}
