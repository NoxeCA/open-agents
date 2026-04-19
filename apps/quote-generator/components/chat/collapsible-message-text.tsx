"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "./markdown-message";

const MAX_LINES = 12;
const MAX_CHARS = 2400;

type Props = {
  text: string;
};

function looksLikeMarkdownTable(text: string) {
  return /\|.+\|/.test(text) && /\|?[:\-\s|]{3,}\|?/.test(text);
}

function getPreview(text: string) {
  const lines = text.split("\n");
  const clippedByLines = lines.slice(0, MAX_LINES).join("\n");
  const clipped =
    clippedByLines.length > MAX_CHARS
      ? `${clippedByLines.slice(0, MAX_CHARS)}…`
      : clippedByLines;

  return {
    preview: clipped,
    isLong:
      !looksLikeMarkdownTable(text) &&
      (lines.length > MAX_LINES ||
        text.length > MAX_CHARS ||
        text.includes("\t")),
  };
}

export function CollapsibleMessageText({ text }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { preview, isLong } = useMemo(() => getPreview(text), [text]);

  if (!isLong) {
    return <MarkdownMessage text={text} />;
  }

  return (
    <div className="space-y-2">
      <div className="max-h-[22rem] overflow-auto">
        {expanded ? (
          <MarkdownMessage text={text} />
        ) : (
          <div className="whitespace-pre-wrap break-words">{preview}</div>
        )}
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Réduire le contenu" : "Afficher tout"}
      </Button>
    </div>
  );
}
