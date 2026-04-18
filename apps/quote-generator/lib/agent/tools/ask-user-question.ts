import { tool, type UIToolInvocation } from "ai";
import { z } from "zod";

const optionSchema = z.object({
  label: z.string().describe("1-5 words, concise choice text"),
  description: z
    .string()
    .describe("Short explanation of trade-offs or what this choice means"),
});

const questionSchema = z.object({
  question: z
    .string()
    .describe("The complete question to ask, ends with '?'"),
  header: z.string().max(12).describe("Short label for tab/chip display"),
  options: z.array(optionSchema).min(2).max(4),
  multiSelect: z.boolean().default(false),
});

export const askUserQuestionInputSchema = z.object({
  questions: z.array(questionSchema).min(1),
});

export type AskUserQuestionInput = z.infer<typeof askUserQuestionInputSchema>;

const answerValueSchema = z.string().or(z.array(z.string()));
const askUserQuestionOutputSchema = z
  .object({
    answers: z.record(z.string(), answerValueSchema),
  })
  .or(
    z.object({
      declined: z.literal(true),
    }),
  );

export type AskUserQuestionOutput = z.infer<
  typeof askUserQuestionOutputSchema
>;

export const askUserQuestionTool = tool({
  description: `Ask the sales rep clarifying questions when information is ambiguous or missing (e.g. which layout to use, which of two candidate totals is correct, what language for the PDF, which services to bundle).

WHEN TO USE:
- Resolve \`needsConfirmation\` items surfaced by \`propose_quote_skeleton\`.
- Disambiguate between multiple plausible values found in the Excel.
- Gather preferences not present in the workbook (layout, payment terms, delivery date).
- Ask only after checking the current quote state, prior chat answers, and any reusable memory you already have.
- Right after ingestion, prefer one consolidated kickoff batch that validates the highest-value missing facts in a single pass instead of spreading them across several phases.

USAGE NOTES:
- There is no fixed hard cap on question count. Ask as many questions as genuinely needed to unblock the quote, but do not treat a large batch as a goal.
- In the first batch after ingestion, prioritize identity + recipient + commercial choices: who is preparing the quote, who it is for, the final contact block, payment schedule, exclusions, assumptions, optional sections, or layout.
- Keep option labels to 1-5 words. Use \`description\` for the trade-off.
- Users can always select "Other" to provide free text.
- Use \`multiSelect: true\` when more than one answer is valid (e.g. which services to include).
- If you recommend a specific option, put it first and suffix its label with "(Recommended)".
- Prefer recommended options that reuse stable defaults or recent repeated values, but do not silently overwrite customer-specific facts.
- Questions render as tabs in the UI; the user navigates between them before submitting.`,
  inputSchema: askUserQuestionInputSchema,
  outputSchema: askUserQuestionOutputSchema,
  // NO execute — this tool is resolved client-side by the UI.
  toModelOutput: ({ output }) => {
    if (!output) {
      return { type: "text", value: "User did not respond to questions." };
    }

    if ("declined" in output && output.declined) {
      return {
        type: "text",
        value:
          "User declined to answer. Continue without this information, infer a safe default, or ask a narrower question.",
      };
    }

    if ("answers" in output) {
      const formattedAnswers = Object.entries(output.answers)
        .map(([question, answer]) => {
          const answerStr = Array.isArray(answer) ? answer.join(", ") : answer;
          return `"${question}"="${answerStr}"`;
        })
        .join(", ");

      return {
        type: "text",
        value: `User has answered your questions: ${formattedAnswers}. Apply these answers via \`patch_quote\` before continuing.`,
      };
    }

    return { type: "text", value: "User responded to questions." };
  },
});

export type AskUserQuestionToolUIPart = UIToolInvocation<
  typeof askUserQuestionTool
>;
