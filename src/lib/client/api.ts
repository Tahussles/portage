import { z } from "zod";
import type { Locale, Profile } from "@/lib/engine/types";

// Contract for the AI routes (docs/ARCHITECTURE.md section 5). Shared by route handlers and the UI.
// Every route answers { ok, data?, error?, fallback? }; fallback: true means fixture data was served.

export type ApiResult<T> = { ok: boolean; data?: T; error?: string; fallback?: boolean };

export type TranscribeData = { text: string; languageCode: string; languageProbability?: number };

export type ProfileRequest = { transcript: string; languageCode: string; locale: Locale };

export type ProfileData = {
  profile: Profile;
  englishTranslation: string;
  missingFields: string[];
  followUp?: { native: string; english: string };
};

export const profileRequestSchema = z.object({
  transcript: z.string().trim().min(1).max(20_000),
  languageCode: z.string().trim().min(2).max(12),
  locale: z.enum(["en", "fr"]),
});

/** Adds ?demo=1 to a route URL when demo mode is on in the browser. */
function routeUrl(path: string, demo: boolean): string {
  return demo ? `${path}?demo=1` : path;
}

async function readResult<T>(res: Response): Promise<ApiResult<T>> {
  try {
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: `Unexpected response (${res.status})` };
  }
}

/** Sends recorded audio for transcription. `languageHint` is an ISO 639 code, or omitted for auto-detect. */
export async function transcribeAudio(
  audio: Blob,
  opts: { languageHint?: string; demo?: boolean } = {},
): Promise<ApiResult<TranscribeData>> {
  const form = new FormData();
  form.append("audio", audio, "recording");
  if (opts.languageHint) form.append("languageHint", opts.languageHint);
  const res = await fetch(routeUrl("/api/transcribe", opts.demo ?? false), { method: "POST", body: form });
  return readResult<TranscribeData>(res);
}

/** Turns a transcript into a structured profile. */
export async function extractProfile(
  body: ProfileRequest,
  opts: { demo?: boolean } = {},
): Promise<ApiResult<ProfileData>> {
  const res = await fetch(routeUrl("/api/profile", opts.demo ?? false), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return readResult<ProfileData>(res);
}
