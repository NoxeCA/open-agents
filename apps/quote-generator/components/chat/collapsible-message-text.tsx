"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

const MAX_LINES = 12;
const MAX_CHARS = 1200;

type Props = {
  text: string;
};

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
      lines.length > MAX_LINES ||
      text.length > MAX_CHARS ||
      text.includes("\t"),
  };
}

export function CollapsibleMessageText({ text }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { preview, isLong } = useMemo(() => getPreview(text), [text]);

  if (!isLong) {
    return <div className="whitespace-pre-wrap break-words">{text}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="max-h-[22rem] overflow-auto whitespace-pre-wrap break-words">
        {expanded ? text : preview}
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Collapse paste" : "Expand paste"}
      </Button>
    </div>
  );
}
