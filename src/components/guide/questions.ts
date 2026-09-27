import { transcriptFixture } from "@/lib/demo";
import type { MessageKey } from "@/lib/i18n";

/** Languages with pre-generated spoken questions in public/guide (scripts/gen-guide-audio.mjs). */
export const GUIDE_LANGUAGES = ["en", "fr", "hi", "pa", "ur", "tl", "ar", "es", "zh"] as const;
export type GuideLanguage = (typeof GUIDE_LANGUAGES)[number];

export const isGuideLanguage = (code: string | null | undefined): code is GuideLanguage =>
  !!code && (GUIDE_LANGUAGES as readonly string[]).includes(code);

/** The six questions, one per screen, each covering what the engine needs. */
export const QUESTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `q${n}`,
  question: `guide.q${n}` as MessageKey,
  example: `guide.q${n}.example` as MessageKey,
  topic: `guide.topic${n}` as MessageKey,
  audio: (lang: GuideLanguage) => `/guide/${lang}/q${n}.mp3`,
}));

export type GuideQuestions = { lang: GuideLanguage; machineTranslated: boolean; questions: { id: string; text: string }[] };

/**
 * Priya's answers for "Use sample voice", one per question: the sentences of Ebrahim's Hindi transcript
 * fixture (sentence 0 is her name, 7 is her goal), so the sample never drifts from the fixture.
 */
export function sampleAnswers(): string[] {
  const sentences = transcriptFixture()
    .text.split("।")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s}।`);
  return [sentences[1], sentences[2], sentences[3], sentences[4], sentences[5], `${sentences[6]} ${sentences[7] ?? ""}`.trim()];
}

/** One transcript for /api/profile: "Q: ... A: ..." for each answered question, in order. */
export function combineAnswers(questionsInEnglish: string[], answers: (string | null)[]): string {
  return answers
    .map((a, i) => (a ? `Q: ${questionsInEnglish[i]}\nA: ${a}` : null))
    .filter(Boolean)
    .join("\n\n");
}

/** The language most answers were in (ties: the first one heard). */
export function mainLanguage(codes: string[], fallback: string): string {
  const counts = new Map<string, number>();
  for (const c of codes) counts.set(c, (counts.get(c) ?? 0) + 1);
  let best = fallback;
  let max = 0;
  for (const [c, n] of counts) if (n > max) [best, max] = [c, n];
  return best;
}
