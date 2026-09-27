import { describe, expect, it } from "vitest";
import en from "./en.json";
import fr from "./fr.json";

// One language at a time (decision 16): the toggle picks English or French and nothing shows both.
// These checks catch "English · Français" pairs creeping back into either file.

/** Values that are the same word in both languages (names, acronyms, cognates). */
const SAME_IN_BOTH = new Set([
  "brand.name", // Portage
  "nav.documents", // Documents
  "documents.label",
  "docs.field.type", // Type
  "docs.severity.ok", // OK
  "insights.map.label", // Provinces
  "insights.stage.registration_exam", // NCLEX-RN
  // The toggle names each language in that language, with a matching lang attribute (WCAG 3.1.2).
  "nav.switchToEn",
  "nav.switchToFr",
]);

/** English values allowed to contain French letters: place names and the French toggle label. */
const FRENCH_LETTERS_OK = new Set(["ticker.6", "nav.switchToFr"]);

const FRENCH_IN_ENGLISH = /[éèêëàâçîïôûùœ]|\b(Votre|votre|Vous|vous|Parcours|parcours|Commencer|Français|français)\b/;
const ENGLISH_IN_FRENCH = /\b(Start|Your|your|Official|Estimate|Sample|Build|Hear|See)\b/;

const keys = Object.keys(en) as (keyof typeof en)[];

/** Whole-phrase containment, so cognates ("No" in "Non", "Transcript" in "Transcription") do not count. */
function containsPhrase(text: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, "u").test(text);
}

describe("one language at a time", () => {
  it("never puts one language's value inside the other's", () => {
    const pairs = keys.filter((k) => {
      if (en[k] === fr[k]) return !SAME_IN_BOTH.has(k);
      return containsPhrase(en[k], fr[k]) || containsPhrase(fr[k], en[k]);
    });
    expect(pairs).toEqual([]);
  });

  it("keeps French out of en.json", () => {
    const offenders = keys.filter((k) => !FRENCH_LETTERS_OK.has(k) && FRENCH_IN_ENGLISH.test(en[k]));
    expect(offenders.map((k) => `${k}: ${en[k]}`)).toEqual([]);
  });

  it("keeps English out of fr.json", () => {
    const offenders = keys.filter((k) => !SAME_IN_BOTH.has(k) && ENGLISH_IN_FRENCH.test(fr[k]));
    expect(offenders.map((k) => `${k}: ${fr[k]}`)).toEqual([]);
  });

  it("catches the patterns it is meant to catch", () => {
    expect(containsPhrase("Start · Commencer", "Commencer")).toBe(true);
    expect(containsPhrase("Transcription", "Transcript")).toBe(false);
    expect(containsPhrase("Non", "No")).toBe(false);
    expect(FRENCH_IN_ENGLISH.test("Start · Commencer")).toBe(true);
    expect(FRENCH_IN_ENGLISH.test("Official · Officiel")).toBe(false); // caught by the pair check instead
    expect(ENGLISH_IN_FRENCH.test("Start · Commencer")).toBe(true);
    expect(ENGLISH_IN_FRENCH.test("Estimation")).toBe(false);
  });
});
