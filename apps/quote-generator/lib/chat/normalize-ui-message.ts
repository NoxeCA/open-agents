type GenericRecord = Record<string, unknown>;

type MessagePartLike = GenericRecord & {
  type?: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

type MessageLike = {
  id?: string;
  role?: string;
  parts?: unknown;
  content?: unknown;
};

function isRecord(value: unknown): value is GenericRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inferLegacyToolState(part: MessagePartLike) {
  if (typeof part.state === "string" && part.state.length > 0) {
    return part.state;
  }

  if (part.output !== undefined) {
    return "output-available";
  }

  if (part.toolName === "ask_user_question") {
    return "input-available";
  }

  return "input-streaming";
}

export function normalizeUiMessagePart(part: unknown): unknown {
  if (!isRecord(part)) {
    return part;
  }

  const type = typeof part.type === "string" ? part.type : "";
  if (type !== "tool-call") {
    return part;
  }

  const toolName =
    typeof part.toolName === "string" && part.toolName.length > 0
      ? part.toolName
      : "tool";

  return {
    ...part,
    type: `tool-${toolName}`,
    state: inferLegacyToolState(part),
  };
}

function normalizeUiMessageParts(parts: unknown) {
  if (!Array.isArray(parts)) {
    return [];
  }

  return parts.map((part) => normalizeUiMessagePart(part));
}

function getToolName(part: unknown) {
  if (!isRecord(part)) return null;

  const type = typeof part.type === "string" ? part.type : "";
  if (type === "tool-call") {
    return typeof part.toolName === "string" ? part.toolName : null;
  }

  if (type.startsWith("tool-")) {
    return type.slice("tool-".length);
  }

  if (type === "dynamic-tool") {
    return typeof part.toolName === "string" ? part.toolName : null;
  }

  return null;
}

function isPendingAskUserQuestionPart(part: unknown) {
  if (!isRecord(part)) return false;
  if (getToolName(part) !== "ask_user_question") return false;

  const state =
    typeof part.state === "string" ? part.state : inferLegacyToolState(part);

  return state === "input-available" || state === "input-streaming";
}

function isRenderablePart(part: unknown) {
  if (!isRecord(part)) return false;

  const type = typeof part.type === "string" ? part.type : "";

  return (
    type === "text" ||
    type === "tool-call" ||
    type === "dynamic-tool" ||
    type.startsWith("tool-")
  );
}

function dropSupersededPendingQuestionParts<TMessage extends MessageLike>(
  messages: TMessage[],
) {
  const nextMessages = [...messages];
  let seenPendingAskUserQuestion = false;

  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    const message = nextMessages[index];
    if (message.role === "user") {
      seenPendingAskUserQuestion = false;
      continue;
    }

    const parts = Array.isArray(message.parts) ? message.parts : [];
    const hasPendingAskUserQuestion = parts.some((part) =>
      isPendingAskUserQuestionPart(part),
    );

    if (!hasPendingAskUserQuestion) {
      continue;
    }

    if (!seenPendingAskUserQuestion) {
      seenPendingAskUserQuestion = true;
      continue;
    }

    const filteredParts = parts.filter(
      (part) => !isPendingAskUserQuestionPart(part),
    );

    if (filteredParts.some((part) => isRenderablePart(part))) {
      nextMessages[index] = {
        ...message,
        parts: filteredParts,
      };
      continue;
    }

    nextMessages.splice(index, 1);
  }

  return nextMessages;
}

export function normalizeUiMessage<TMessage extends MessageLike>(
  message: TMessage,
): TMessage {
  const parts = normalizeUiMessageParts(message.parts);

  if (parts.length > 0) {
    return {
      ...message,
      parts,
    };
  }

  if (typeof message.content === "string" && message.content.length > 0) {
    return {
      ...message,
      parts: [{ type: "text", text: message.content }],
    };
  }

  return {
    ...message,
    parts: [],
  };
}

export function normalizeUiMessages<TMessage extends MessageLike>(
  messages: TMessage[],
): TMessage[] {
  const normalized = messages.map((message) => normalizeUiMessage(message));
  return dropSupersededPendingQuestionParts(normalized);
}
