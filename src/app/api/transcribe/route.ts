import type { ApiResult, TranscribeData } from "@/lib/client/api";
import { isDemoRequest, transcriptFixture } from "@/lib/demo";
import { hasElevenLabsKey, transcribeWithElevenLabs } from "@/lib/voice/elevenlabs";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const LANGUAGE_HINT = /^[a-z]{2,3}$/;

function json(body: ApiResult<TranscribeData>, status = 200) {
  return Response.json(body, { status });
}

function fallback(reason: string) {
  // Log the reason only, never audio or transcript content.
  console.warn(`[transcribe] fallback: ${reason}`);
  return json({ ok: true, data: transcriptFixture(), fallback: true });
}

export async function POST(req: Request) {
  if (isDemoRequest(req)) return json({ ok: true, data: transcriptFixture(), fallback: true });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ ok: false, error: "Expected multipart/form-data with an audio file" }, 400);
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return json({ ok: false, error: "Missing audio file" }, 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) return json({ ok: false, error: "Audio is larger than 10 MB" }, 413);

  const hint = form.get("languageHint");
  const languageHint = typeof hint === "string" && LANGUAGE_HINT.test(hint) ? hint : undefined;

  if (!hasElevenLabsKey()) return fallback("no ElevenLabs key configured");

  const started = Date.now();
  try {
    const data = await transcribeWithElevenLabs(audio, { languageHint });
    console.info(`[transcribe] ok in ${Date.now() - started} ms`);
    return json({ ok: true, data });
  } catch (err) {
    return fallback(`${err instanceof Error ? err.name : "error"} after ${Date.now() - started} ms`);
  }
}
