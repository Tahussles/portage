import sampleProfile from "@/data/fixtures/profile-priya.provisional.json";
import sampleTranscript from "@/data/fixtures/transcript-priya.provisional.json";
import type { Locale } from "@/lib/engine/types";
import {
  envelopeSchema,
  extractionSchema,
  transcriptSchema,
  type Extraction,
  type Transcript,
} from "./profile-schema";

// TODO(api): swap these for Ebrahim's helpers in src/lib/client/api.ts once that file is on main.
// Until then the intake talks to /api/transcribe and /api/profile directly (ARCHITECTURE section 5)
// and falls back to the provisional Priya fixtures when a route is missing, fails, or times out.

/** Where a result came from: the live route, or the bundled sample (shown as "Sample · Exemple"). */
export type Source = "live" | "sample";
export type Result<T> = { data: T; source: Source };

const TIMEOUT_MS = 15_000;

export const SAMPLE_TRANSCRIPT = transcriptSchema.parse(sampleTranscript);
export const SAMPLE_EXTRACTION = extractionSchema.parse(sampleProfile);

/** `?demo=1` forces fixtures, so the demo never depends on venue wifi. */
export function isDemoMode(search: string = typeof window === "undefined" ? "" : window.location.search) {
  return new URLSearchParams(search).get("demo") === "1";
}

type FetchLike = typeof fetch;

async function post<T>(
  url: string,
  body: BodyInit,
  schema: ReturnType<typeof envelopeSchema>,
  fetchImpl: FetchLike,
  headers?: HeadersInit,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { method: "POST", body, headers, signal: controller.signal });
    if (!res.ok) return null;
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success || !parsed.data.ok || parsed.data.data === undefined) return null;
    return parsed.data.data as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function transcribe(
  audio: Blob,
  languageHint?: string,
  { fetchImpl = fetch, demo = isDemoMode() }: { fetchImpl?: FetchLike; demo?: boolean } = {},
): Promise<Result<Transcript>> {
  if (demo) return { data: SAMPLE_TRANSCRIPT, source: "sample" };
  const form = new FormData();
  const ext = audio.type.includes("mp4") ? "mp4" : audio.type.includes("wav") ? "wav" : "webm";
  form.append("audio", audio, `intake.${ext}`);
  if (languageHint) form.append("languageHint", languageHint);
  const data = await post<Transcript>("/api/transcribe", form, envelopeSchema(transcriptSchema), fetchImpl);
  return data ? { data, source: "live" } : { data: SAMPLE_TRANSCRIPT, source: "sample" };
}

export async function extractProfile(
  transcript: string,
  languageCode: string,
  locale: Locale,
  { fetchImpl = fetch, demo = isDemoMode() }: { fetchImpl?: FetchLike; demo?: boolean } = {},
): Promise<Result<Extraction>> {
  if (demo) return { data: SAMPLE_EXTRACTION, source: "sample" };
  const data = await post<Extraction>(
    "/api/profile",
    JSON.stringify({ transcript, languageCode, locale }),
    envelopeSchema(extractionSchema),
    fetchImpl,
    { "Content-Type": "application/json" },
  );
  return data ? { data, source: "live" } : { data: SAMPLE_EXTRACTION, source: "sample" };
}

/** HEAD check so the sample button can use the recorded clip when it has been added. */
export async function sampleClipExists(url: string, fetchImpl: FetchLike = fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}
