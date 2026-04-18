"use client";

import type { ReactElement } from "react";
import {
  BookOpenText,
  BriefcaseBusiness,
  Check,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getIncludedOptionalSections,
  isOptionalSectionEnabled,
  optionalSectionCategoryLabels,
  optionalSectionLibrary,
  type OptionalSectionCategory,
  type OptionalSectionKey,
} from "@/lib/quote/section-library";

type Props = {
  quoteData: Record<string, unknown> | null | undefined;
  onToggleSection: (
    key: OptionalSectionKey,
    enabled: boolean,
  ) => Promise<void>;
  onDraftAssistantPrompt: (prompt: string) => void;
  trigger?: ReactElement;
};

type SectionFilter = "all" | OptionalSectionCategory;

const sectionFilters: { value: SectionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "story", label: "Storytelling" },
  { value: "credibility", label: "Credibility" },
  { value: "commercial", label: "Commercial" },
];

function getSectionsForFilter(filter: SectionFilter) {
  return filter === "all"
    ? optionalSectionLibrary
    : optionalSectionLibrary.filter((section) => section.category === filter);
}

function getSectionCategoryIcon(category: OptionalSectionCategory) {
  switch (category) {
    case "story":
      return <BookOpenText className="size-4" />;
    case "credibility":
      return <ShieldCheck className="size-4" />;
    case "commercial":
      return <BriefcaseBusiness className="size-4" />;
  }
}

export function SectionLibraryDialog({
  quoteData,
  onToggleSection,
  onDraftAssistantPrompt,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SectionFilter>("all");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const includedSections = getIncludedOptionalSections(quoteData);

  const defaultTrigger = (
    <Button size="sm" variant="outline">
      <Layers3 className="size-4" />
      Sections {includedSections.length}/{optionalSectionLibrary.length}
    </Button>
  );

  const runAction = (actionKey: string, task: () => Promise<void>) => {
    startTransition(async () => {
      setPendingAction(actionKey);
      try {
        await task();
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0">
        <div className="border-b bg-gradient-to-br from-background via-background to-muted/60 px-6 py-6">
          <DialogHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Optional quote pages</Badge>
              <Badge variant="secondary">
                {includedSections.length} enabled
              </Badge>
            </div>
            <DialogTitle className="text-2xl">
              Build a stronger PDF than just pricing
            </DialogTitle>
            <DialogDescription className="max-w-3xl text-sm leading-6">
              These sections make the quote feel more complete, credible, and
              client-ready. Pick the ones you want, then let the assistant ask
              only the questions needed to fill them in.
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value as SectionFilter)}
          className="px-6 py-5"
        >
          <TabsList>
            {sectionFilters.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value}>
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {sectionFilters.map((filter) => (
            <TabsContent
              key={filter.value}
              value={filter.value}
              className="mt-5 space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {getSectionsForFilter(filter.value).map((section) => {
                  const enabled = isOptionalSectionEnabled(
                    quoteData,
                    section.key,
                  );
                  const includeActionKey = `${section.key}:include`;
                  const draftActionKey = `${section.key}:draft`;
                  const removeActionKey = `${section.key}:remove`;
                  const isIncludeBusy =
                    isPending && pendingAction === includeActionKey;
                  const isDraftBusy =
                    isPending && pendingAction === draftActionKey;
                  const isRemoveBusy =
                    isPending && pendingAction === removeActionKey;

                  return (
                    <Card
                      key={section.key}
                      className="gap-4 rounded-3xl border-border/70 bg-gradient-to-br from-background via-background to-muted/40 py-5 shadow-sm"
                    >
                      <CardHeader className="space-y-3 px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="gap-1">
                                {getSectionCategoryIcon(section.category)}
                                {
                                  optionalSectionCategoryLabels[
                                    section.category
                                  ]
                                }
                              </Badge>
                              <Badge variant={enabled ? "default" : "secondary"}>
                                {enabled ? "Included in PDF" : "Available"}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">
                              {section.title}
                            </CardTitle>
                          </div>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {section.shortDescription}
                        </p>
                      </CardHeader>

                      <CardContent className="space-y-4 px-5">
                        <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                            Best when
                          </p>
                          <p className="mt-2 text-sm leading-6 text-foreground">
                            {section.toneHint}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-muted/60 p-4">
                          <p className="text-sm font-medium text-foreground">
                            Questions the assistant will usually ask
                          </p>
                          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                            {section.assistantQuestions.map((question) => (
                              <li key={question} className="flex gap-2">
                                <Check className="mt-1 size-3.5 text-foreground" />
                                <span>{question}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {enabled ? (
                            <>
                              <Button
                                onClick={() => {
                                  runAction(draftActionKey, async () => {
                                    onDraftAssistantPrompt(
                                      section.assistantPrompt,
                                    );
                                    setOpen(false);
                                  });
                                }}
                                disabled={isDraftBusy}
                              >
                                <Sparkles className="size-4" />
                                {isDraftBusy
                                  ? "Opening chat..."
                                  : "Draft questions in chat"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  runAction(removeActionKey, async () => {
                                    await onToggleSection(section.key, false);
                                  });
                                }}
                                disabled={isRemoveBusy}
                              >
                                {isRemoveBusy
                                  ? "Removing..."
                                  : "Remove from PDF"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => {
                                  runAction(draftActionKey, async () => {
                                    await onToggleSection(section.key, true);
                                    onDraftAssistantPrompt(
                                      section.assistantPrompt,
                                    );
                                    setOpen(false);
                                  });
                                }}
                                disabled={isDraftBusy}
                              >
                                <Sparkles className="size-4" />
                                {isDraftBusy
                                  ? "Adding..."
                                  : "Include + draft questions"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  runAction(includeActionKey, async () => {
                                    await onToggleSection(section.key, true);
                                  });
                                }}
                                disabled={isIncludeBusy}
                              >
                                {isIncludeBusy ? "Saving..." : "Just include"}
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
