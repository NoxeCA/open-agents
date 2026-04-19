import {
  defaultSettingsMiddleware,
  gateway as aiGateway,
  wrapLanguageModel,
  type LanguageModel,
} from "ai";
import {
  anthropic,
  type AnthropicLanguageModelOptions,
} from "@ai-sdk/anthropic";

const ANTHROPIC_MODEL_ID = "google/gemini-3-flash";
const GATEWAY_MODEL_ID = "google/gemini-3-flash";

const ANTHROPIC_DEFAULTS = {
  effort: "high",
  thinking: { type: "adaptive" },
} satisfies AnthropicLanguageModelOptions;

type WrappableLanguageModel = Parameters<typeof wrapLanguageModel>[0]["model"];

function withAnthropicDefaults(model: WrappableLanguageModel): LanguageModel {
  return wrapLanguageModel({
    model,
    middleware: defaultSettingsMiddleware({
      settings: {
        providerOptions: {
          anthropic: ANTHROPIC_DEFAULTS,
        },
      },
    }),
  });
}

export function resolveQuoteAgentModel(): LanguageModel {
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    return withAnthropicDefaults(aiGateway(GATEWAY_MODEL_ID));
  }

  return withAnthropicDefaults(anthropic(ANTHROPIC_MODEL_ID));
}
