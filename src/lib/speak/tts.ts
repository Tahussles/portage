import type Anthropic from "@anthropic-ai/sdk";
import { anthropicModel, getAnthropicClient } from "@/lib/ai/anthropic";

// Server only. Translation (only when needed) plus ElevenLabs text-to-speech for "Hear your plan".
// Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert (checked 2026-09-26).

/** Multilingual and fast (Hindi included); eleven_multilingual_v2 took about 7 s for this summary in English alone. */
export const TTS_MODEL = "eleven_flash_v2_5";
/** "Alice - Clear, Engaging Educator", a premade voice chosen from the voices API. Override with ELEVENLABS_VOICE_ID. */
export const DEFAULT_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2";
/** Each upstream step (translation, then speech) gets its own 12 s budget. */
export const SPEAK_TIMEOUT_MS = 12_000;

export const TRANSLATE_SYSTEM =
  "Translate faithfully. Do not add, remove, or change any fact, date, number, or name. Output only the translation.";

/** Languages the summary is already written in (English) or that we show natively (French is translated too). */
export function needsTranslation(languageCode: string) {
  return !["en"].includes(languageCode.toLowerCase().split("-")[0]);
}

export function languageName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export async function translate(
  text: string,
  languageCode: string,
  signal: AbortSignal,
  client: Pick<Anthropic, "messages"> = getAnthropicClient(),
): Promise<string> {
  const response = await client.messages.create(
    {
      model: anthropicModel(),
      max_tokens: 1200,
      system: TRANSLATE_SYSTEM,
      messages: [{ role: "user", content: `Translate into ${languageName(languageCode)} (${languageCode}):\n\n${text}` }],
    },
    { signal },
  );
  const out = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
  if (!out) throw new Error("Empty translation");
  return out;
}

export async function synthesize(text: string, signal: AbortSignal, fetchImpl: typeof fetch = fetch): Promise<ArrayBuffer> {
  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const res = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "", "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: TTS_MODEL }),
    signal,
  });
  if (!res.ok) throw new Error(`ElevenLabs returned ${res.status}`);
  return res.arrayBuffer();
}

type Spoken = { audio: ArrayBuffer; text: string };

/** In-memory cache per (language, text): the demo replays the same summary without paying twice. */
const cache = new Map<string, Spoken>();
const MAX_CACHE = 50;

export async function speak(
  text: string,
  languageCode: string,
  deps: { translateImpl?: typeof translate; synthesizeImpl?: typeof synthesize } = {},
): Promise<Spoken> {
  const key = `${languageCode}\n${text}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const spokenText = needsTranslation(languageCode)
    ? await (deps.translateImpl ?? translate)(text, languageCode, AbortSignal.timeout(SPEAK_TIMEOUT_MS))
    : text;
  const audio = await (deps.synthesizeImpl ?? synthesize)(spokenText, AbortSignal.timeout(SPEAK_TIMEOUT_MS));

  const result = { audio, text: spokenText };
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  return result;
}
