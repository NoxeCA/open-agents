"use client";

import { Check, Loader2, MessageCircleQuestion } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ToolHeader, toolCardClassName, type ToolCallProps } from "./generic";

type Option = {
  label: string;
  description?: string;
};

type Question = {
  header?: string;
  question: string;
  options?: Option[];
  multiSelect?: boolean;
  allowOther?: boolean;
};

type AnswerValue = string | string[];
type SubmittedPayload =
  | { answers: Record<string, AnswerValue> }
  | { declined: true };

function questionKey(q: Question, i: number) {
  return q.question || `q-${i}`;
}

export function AskUserQuestionToolCall({
  input,
  output,
  state,
  toolCallId,
  onToolOutput,
}: ToolCallProps) {
  const questions: Question[] = useMemo(
    () => (Array.isArray(input?.questions) ? input.questions : []),
    [input],
  );

  const initialAnswers = useMemo(() => {
    const map: Record<string, AnswerValue> = {};
    for (const q of questions) {
      map[q.question] = q.multiSelect ? [] : "";
    }
    return map;
  }, [questions]);

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(
    initialAnswers,
  );
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [submittedPayload, setSubmittedPayload] =
    useState<SubmittedPayload | null>(null);
  const [activeTab, setActiveTab] = useState<string>(
    questions.length > 0 ? questionKey(questions[0], 0) : "",
  );

  const isAnswered = state === "output-available";
  const isDeclined = isAnswered && output && "declined" in output && output.declined;
  const hasAnswersOut =
    isAnswered && output && "answers" in output && output.answers;
  const pendingSubmittedPayload = !isAnswered ? submittedPayload : null;
  const isLocallyPending = pendingSubmittedPayload !== null;
  const submittedAnswers =
    hasAnswersOut && output && "answers" in output
      ? (output.answers as Record<string, AnswerValue>)
      : null;
  const showSubmittedSummary = Boolean(submittedAnswers);

  const setSingle = (qKey: string, label: string) => {
    if (isLocallyPending) return;
    setAnswers((prev) => ({ ...prev, [qKey]: label }));
  };

  const toggleMulti = (qKey: string, label: string) => {
    if (isLocallyPending) return;
    setAnswers((prev) => {
      const curr = Array.isArray(prev[qKey]) ? (prev[qKey] as string[]) : [];
      const exists = curr.includes(label);
      const next = exists
        ? curr.filter((x) => x !== label)
        : [...curr, label];
      return { ...prev, [qKey]: next };
    });
  };

  const buildFinalAnswers = () => {
    const result: Record<string, AnswerValue> = {};
    for (const q of questions) {
      const key = q.question;
      const other = otherText[key]?.trim();
      if (q.multiSelect) {
        const arr = Array.isArray(answers[key]) ? (answers[key] as string[]) : [];
        result[key] = other ? [...arr, other] : arr;
      } else {
        result[key] = other || (answers[key] as string) || "";
      }
    }
    return result;
  };

  const handleSubmit = () => {
    if (!toolCallId || !onToolOutput) return;
    const nextPayload = { answers: buildFinalAnswers() } as const;
    setSubmittedPayload(nextPayload);
    onToolOutput({
      tool: "ask_user_question",
      toolCallId,
      output: nextPayload,
    });
  };

  const handleSkip = () => {
    if (!toolCallId || !onToolOutput) return;
    setSubmittedPayload({ declined: true });
    onToolOutput({
      tool: "ask_user_question",
      toolCallId,
      output: { declined: true },
    });
  };

  const canSubmit = questions.every((q) => {
    const key = q.question;
    const other = otherText[key]?.trim();
    if (other) return true;
    const val = answers[key];
    if (q.multiSelect) return Array.isArray(val) && val.length > 0;
    return typeof val === "string" && val.length > 0;
  });

  return (
    <Card className={toolCardClassName}>
      <CardHeader className="px-3">
        <CardTitle className="text-xs font-normal">
          <ToolHeader name="ask_user_question" state={state} />
        </CardTitle>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <MessageCircleQuestion className="size-3.5" />
          <span>
            {questions.length} question{questions.length === 1 ? "" : "s"}
            {isLocallyPending
              ? " • traitement en cours"
              : isDeclined
              ? " • ignoré"
              : hasAnswersOut
                ? " • répondu"
                : state === "input-available"
                  ? " • votre réponse est attendue"
                  : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-3">
        {questions.length > 0 && !isAnswered && state === "input-available" && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto w-full flex-wrap justify-start">
              {questions.map((q, i) => {
                const key = questionKey(q, i);
                const val = answers[q.question];
                const answered = q.multiSelect
                  ? Array.isArray(val) && val.length > 0
                  : (typeof val === "string" && val.length > 0) ||
                    !!otherText[q.question]?.trim();
                return (
                  <TabsTrigger key={key} value={key}>
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="max-w-[14ch] truncate">
                        {q.header ?? q.question}
                      </span>
                      {answered && (
                        <Check className="size-3 text-green-600" />
                      )}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {questions.map((q, i) => {
              const key = questionKey(q, i);
              const val = answers[q.question];
              return (
                <TabsContent key={key} value={key} className="space-y-2 pt-2">
                  <p className="text-sm text-foreground">{q.question}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(q.options ?? []).map((opt) => {
                      const selected = q.multiSelect
                        ? Array.isArray(val) && val.includes(opt.label)
                        : val === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          title={opt.description}
                          disabled={isLocallyPending}
                          onClick={() =>
                            q.multiSelect
                              ? toggleMulti(q.question, opt.label)
                              : setSingle(q.question, opt.label)
                          }
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all",
                            selected
                              ? "border-primary bg-primary/10 font-medium text-primary"
                              : "border-border bg-background hover:border-border hover:bg-accent",
                          )}
                        >
                          {selected && <Check className="size-3" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-muted-foreground">
                      Autre
                    </label>
                    <Textarea
                      value={otherText[q.question] ?? ""}
                      onChange={(e) =>
                        setOtherText((prev) => ({
                          ...prev,
                          [q.question]: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Saisissez une réponse personnalisée..."
                      className="rounded-xl text-sm"
                      disabled={isLocallyPending}
                    />
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {showSubmittedSummary && submittedAnswers && (
          <div className="space-y-1.5">
            {questions.map((q) => {
              const a = submittedAnswers[q.question];
              const str = Array.isArray(a) ? a.join(", ") : (a ?? "—");
              return (
                <div key={q.question} className="text-xs">
                  <p className="text-foreground">{q.question}</p>
                  <p className="text-muted-foreground">
                    <span className="text-green-600">→</span> {str}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {isDeclined && (
          <p className="text-xs italic text-muted-foreground">
            Vous avez choisi de ne pas répondre.
          </p>
        )}

        {state === "input-available" && onToolOutput && toolCallId && (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkip}
              disabled={isLocallyPending}
            >
              Passer
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit || isLocallyPending}
            >
              {isLocallyPending ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                "Envoyer les réponses"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
