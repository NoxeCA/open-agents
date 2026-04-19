"use client";

import { ChevronDown, ChevronRight, Loader2, Wrench } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ToolCallProps = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
  state?: string;
  toolCallId?: string;
  quoteId?: string;
  onToolOutput?: (args: {
    tool?: string;
    toolCallId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any;
  }) => void;
};

export const toolCardClassName =
  "my-1 gap-2 rounded-xl border border-border/50 bg-card/80 py-3 shadow-[var(--shadow-card)]";

const TOOL_LABELS: Record<string, string> = {
  ask_user_question: "questions utilisateur",
  inspect_context_file: "analyse du document",
  list_quote_layouts: "mises en page du devis",
  parse_excel: "analyse Excel",
  patch_quote: "mise à jour du devis",
  propose_quote_skeleton: "structure du devis",
  render_pdf: "génération du PDF",
};

function humanizeToolName(name: string) {
  return TOOL_LABELS[name] ?? name.replaceAll("_", " ");
}

export function stateBadgeClasses(state?: string) {
  switch (state) {
    case "output-available":
    case "completed":
      return "bg-emerald-500/10 text-emerald-700";
    case "output-error":
      return "bg-red-500/10 text-red-700";
    case "input-available":
      return "bg-blue-500/10 text-blue-700";
    case "input-streaming":
    default:
      return "bg-amber-500/10 text-amber-700";
  }
}

function stateLabel(state?: string) {
  switch (state) {
    case "output-available":
    case "completed":
      return "terminé";
    case "output-error":
      return "erreur";
    case "input-available":
      return "réponse requise";
    case "input-streaming":
      return "en cours";
    default:
      return null;
  }
}

export function ToolHeader({
  name,
  state,
  expanded,
  onToggle,
  meta,
}: {
  name: string;
  state?: string;
  expanded?: boolean;
  onToggle?: () => void;
  meta?: React.ReactNode;
}) {
  const isRunning = state === "input-streaming";
  const badgeLabel = stateLabel(state);
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 text-left"
    >
      {onToggle ? (
        expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground" />
        )
      ) : (
        <Wrench className="size-3.5 text-muted-foreground" />
      )}
      <span className="font-mono text-[11px] text-foreground">
        {humanizeToolName(name)}
      </span>
      {isRunning && (
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      )}
      {badgeLabel && (
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-1 font-mono text-[10px] uppercase",
            stateBadgeClasses(state),
          )}
        >
          {badgeLabel}
        </span>
      )}
      {meta}
    </button>
  );
}

export function Json({ value }: { value: unknown }) {
  if (value === undefined || value === null) return null;
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return (
    <pre className="max-h-64 overflow-auto rounded-xl border border-border/50 bg-muted/50 p-2.5 text-[11px] leading-snug">
      {text}
    </pre>
  );
}

export function GenericToolCall({
  name,
  input,
  output,
  state,
}: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className={toolCardClassName}>
      <CardHeader className="px-3">
        <CardTitle className="text-xs font-normal">
          <ToolHeader
            name={name}
            state={state}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 px-3">
          {input !== undefined && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Entrée
              </p>
              <Json value={input} />
            </div>
          )}
          {output !== undefined && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Sortie
              </p>
              <Json value={output} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
