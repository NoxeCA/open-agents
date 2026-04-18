"use client";

import { Compass, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getIncludedOptionalSections,
  optionalSectionLibrary,
  type OptionalSectionKey,
} from "@/lib/quote/section-library";
import { SectionLibraryDialog } from "./section-library-dialog";

type Props = {
  quoteData: Record<string, unknown> | null | undefined;
  onToggleSection: (
    key: OptionalSectionKey,
    enabled: boolean,
  ) => Promise<void>;
  onDraftAssistantPrompt: (prompt: string) => void;
};

export function OptionalSectionsTeaser({
  quoteData,
  onToggleSection,
  onDraftAssistantPrompt,
}: Props) {
  const includedSections = getIncludedOptionalSections(quoteData);
  const highlightedSections = optionalSectionLibrary.slice(0, 5);

  return (
    <div className="border-b bg-gradient-to-br from-background via-background to-muted/40 px-4 py-4">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-border/70 bg-background/90 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Brochure-style pages</Badge>
              <Badge variant="secondary">
                {includedSections.length} of {optionalSectionLibrary.length} selected
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                This quote can include much more than scope and pricing
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Add pages like company intro, leadership note, team
                presentation, partners, and commercial terms so the PDF feels
                intentional and sales-ready instead of purely technical.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {highlightedSections.map((section) => {
                const enabled = includedSections.some(
                  (included) => included.key === section.key,
                );

                return (
                  <Badge
                    key={section.key}
                    variant={enabled ? "default" : "outline"}
                    className="rounded-full px-3 py-1"
                  >
                    {section.title}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <SectionLibraryDialog
              quoteData={quoteData}
              onToggleSection={onToggleSection}
              onDraftAssistantPrompt={onDraftAssistantPrompt}
              trigger={
                <Button>
                  <Compass className="size-4" />
                  Choose sections
                </Button>
              }
            />
            <Button
              variant="outline"
              onClick={() =>
                onDraftAssistantPrompt(
                  "Help me decide which optional sections should be included in this quote PDF. Briefly explain the strongest options for this proposal, then ask me only the minimum questions needed.",
                )
              }
            >
              <Sparkles className="size-4" />
              Ask for recommendations
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
