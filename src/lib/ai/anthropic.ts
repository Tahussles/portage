import Anthropic from "@anthropic-ai/sdk";
import type { ProfileData } from "@/lib/client/api";
import { profileSystemPrompt } from "./prompts";
import { extractProfileInputSchema, extractProfileTool, missingKeyFields, toProfile } from "./tools";

// Server only. The key is read from process.env by the SDK; never import this from a client component.

export const AI_TIMEOUT_MS = 12_000;

export function anthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ timeout: AI_TIMEOUT_MS, maxRetries: 0 });
  return client;
}

export class ExtractionError extends Error {}

/**
 * Asks Claude to call extract_profile once, then validates and normalizes the tool input.
 * Throws on API errors, timeouts, refusals or a missing tool call; the route falls back to the fixture.
 */
export async function extractProfileWithClaude(
  input: { transcript: string; languageCode: string; today: string },
  deps: { client?: Pick<Anthropic, "messages"> } = {},
): Promise<ProfileData> {
  const response = await (deps.client ?? getClient()).messages.create({
    model: anthropicModel(),
    max_tokens: 1500,
    // Forced tool use gives a structured answer; thinking stays off to keep latency inside the 12 s budget.
    thinking: { type: "disabled" },
    system: profileSystemPrompt(input.today),
    tools: [extractProfileTool],
    tool_choice: { type: "tool", name: extractProfileTool.name },
    messages: [
      {
        role: "user",
        content: `Spoken language (detected): ${input.languageCode}\n\nTranscript:\n${input.transcript}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new ExtractionError("Model declined the request");
  const call = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === extractProfileTool.name,
  );
  if (!call) throw new ExtractionError(`No extract_profile call (stop_reason: ${response.stop_reason})`);

  const parsed = extractProfileInputSchema.safeParse(call.input);
  if (!parsed.success) throw new ExtractionError("Tool input failed validation");

  const profile = toProfile(parsed.data);
  if (!profile.spokenLanguage) profile.spokenLanguage = input.languageCode;
  const missingFields = missingKeyFields(profile);
  return {
    profile,
    englishTranslation: parsed.data.englishTranslation,
    missingFields,
    ...(missingFields.length > 0 && parsed.data.followUp ? { followUp: parsed.data.followUp } : {}),
  };
}
