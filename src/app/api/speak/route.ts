import { z } from "zod";
import { hasAnthropicKey } from "@/lib/ai/anthropic";
import { speak, needsTranslation } from "@/lib/speak/tts";
import { hasElevenLabsKey } from "@/lib/voice/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  languageCode: z.string().trim().min(2).max(12),
});

function fail(reason: string, status = 200) {
  console.warn(`[speak] unavailable: ${reason}`);
  return Response.json({ ok: false }, { status });
}

/**
 * POST { text, languageCode } -> audio/mpeg. The text is the deterministic plan summary; it is only
 * translated (when the language is not English), never rewritten. Any failure returns { ok: false }
 * and the UI hides the button.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("invalid JSON", 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail("invalid request", 400);
  const { text, languageCode } = parsed.data;

  if (!hasElevenLabsKey()) return fail("no ElevenLabs key configured");
  if (needsTranslation(languageCode) && !hasAnthropicKey()) return fail("no Anthropic key configured");

  const started = Date.now();
  try {
    const spoken = await speak(text, languageCode);
    console.info(`[speak] ok in ${Date.now() - started} ms`);
    return new Response(spoken.audio, {
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "no-store",
        // The (possibly translated) words, for the on-screen transcript. Encoded: headers are ASCII only.
        "x-speak-text": encodeURIComponent(spoken.text),
      },
    });
  } catch (err) {
    return fail(`${err instanceof Error ? err.name : "error"} after ${Date.now() - started} ms`);
  }
}
