import profileExtractionPriya from "@/data/fixtures/profile-extraction-priya.json";
import profilePriya from "@/data/fixtures/profile-priya.json";
import transcriptPriya from "@/data/fixtures/transcript-priya.json";
import type { ProfileData, TranscribeData } from "@/lib/client/api";
import type { Profile } from "@/lib/engine/types";

// Demo mode (docs/ARCHITECTURE.md section 8): active with ?demo=1, NEXT_PUBLIC_FORCE_DEMO=1,
// a missing API key, or any upstream failure or timeout. Fixtures are imported directly so
// the fallback is instant and works with no network.

export function isForcedDemo(): boolean {
  return process.env.NEXT_PUBLIC_FORCE_DEMO === "1";
}

/** True when the request URL asks for demo mode or demo mode is forced by env. */
export function isDemoRequest(req: Request): boolean {
  return new URL(req.url).searchParams.get("demo") === "1" || isForcedDemo();
}

export function transcriptFixture(): TranscribeData {
  return { ...transcriptPriya };
}

export function profileFixture(): ProfileData {
  return {
    profile: structuredClone(profilePriya) as Profile,
    englishTranslation: profileExtractionPriya.englishTranslation,
    missingFields: [...profileExtractionPriya.missingFields],
  };
}
