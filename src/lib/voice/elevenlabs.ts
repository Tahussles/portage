import { z } from "zod";
import type { TranscribeData } from "@/lib/client/api";

// Server only. ElevenLabs speech-to-text (Scribe), called with fetch.
// Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/convert (checked 2026-09-26).

export const STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
export const STT_MODEL = "scribe_v2";
export const STT_TIMEOUT_MS = 12_000;

export function hasElevenLabsKey(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

const sttResponseSchema = z.object({
  text: z.string(),
  language_code: z.string(),
  language_probability: z.number().optional(),
});

export class TranscriptionError extends Error {}

export async function transcribeWithElevenLabs(
  audio: Blob,
  opts: { languageHint?: string; fetchImpl?: typeof fetch } = {},
): Promise<TranscribeData> {
  const form = new FormData();
  form.append("model_id", STT_MODEL);
  form.append("file", audio, "audio");
  if (opts.languageHint) form.append("language_code", opts.languageHint);

  const res = await (opts.fetchImpl ?? fetch)(STT_URL, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
    body: form,
    signal: AbortSignal.timeout(STT_TIMEOUT_MS),
  });
  if (!res.ok) throw new TranscriptionError(`ElevenLabs returned ${res.status}`);

  const parsed = sttResponseSchema.safeParse(await res.json());
  if (!parsed.success) throw new TranscriptionError("Unexpected ElevenLabs response shape");
  if (!parsed.data.text.trim()) throw new TranscriptionError("Empty transcript");

  return {
    text: parsed.data.text,
    languageCode: parsed.data.language_code,
    ...(parsed.data.language_probability !== undefined
      ? { languageProbability: parsed.data.language_probability }
      : {}),
  };
}
