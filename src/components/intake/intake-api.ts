import { extractProfile as postProfile, transcribeAudio, type ApiResult } from "@/lib/client/api";
import { profileFixture, transcriptFixture } from "@/lib/demo";
import type { Locale } from "@/lib/engine/types";
import { extractionSchema, transcriptSchema, type Extraction, type Transcript } from "./profile-schema";

// Thin layer over Ebrahim's client helpers (src/lib/client/api.ts). The routes already serve
// fixtures in demo mode or when an upstream fails (`fallback: true`); this adds a zod check on
// what reaches the UI, a timeout, and a local fixture when the route itself cannot be reached.

/** Where a result came from: the live service, or the sample (shown as "Sample · Exemple"). */
export type Source = "live" | "sample";
export type Result<T> = { data: T; source: Source };

const TIMEOUT_MS = 15_000;

export const SAMPLE_TRANSCRIPT: Transcript = transcriptSchema.parse(transcriptFixture());
export const SAMPLE_EXTRACTION: Extraction = extractionSchema.parse(profileFixture());

/** `?demo=1` asks the routes for fixtures, so the demo never depends on venue wifi. */
export function isDemoMode(search: string = typeof window === "undefined" ? "" : window.location.search) {
  return new URLSearchParams(search).get("demo") === "1";
}

async function settle<T>(
  call: () => Promise<ApiResult<unknown>>,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } },
  sample: T,
): Promise<Result<T>> {
  try {
    const res = await Promise.race([
      call(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);
    const parsed = schema.safeParse(res.data);
    if (res.ok && parsed.success) return { data: parsed.data, source: res.fallback ? "sample" : "live" };
  } catch {
    // unreachable route, timeout: use the local sample below
  }
  return { data: sample, source: "sample" };
}

/**
 * ElevenLabs returns ISO 639-3 codes ("eng", "hin"); the UI and `lang` attributes want the short
 * BCP 47 form ("en", "hi"). Unknown codes pass through unchanged.
 */
export function normalizeLanguage(code: string): string {
  try {
    return new Intl.Locale(Intl.getCanonicalLocales(code)[0]).language;
  } catch {
    return code;
  }
}

export async function transcribe(
  audio: Blob,
  languageHint?: string,
  { call = transcribeAudio, demo = isDemoMode() }: { call?: typeof transcribeAudio; demo?: boolean } = {},
): Promise<Result<Transcript>> {
  const result = await settle(() => call(audio, { languageHint, demo }), transcriptSchema, SAMPLE_TRANSCRIPT);
  return { ...result, data: { ...result.data, languageCode: normalizeLanguage(result.data.languageCode) } };
}

export function extractProfile(
  transcript: string,
  languageCode: string,
  locale: Locale,
  { call = postProfile, demo = isDemoMode() }: { call?: typeof postProfile; demo?: boolean } = {},
): Promise<Result<Extraction>> {
  return settle(() => call({ transcript, languageCode, locale }, { demo }), extractionSchema, SAMPLE_EXTRACTION);
}

/** HEAD check so the sample button can use the recorded clip once it has been added. */
export async function sampleClipExists(url: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}
