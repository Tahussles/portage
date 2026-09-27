import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/en.json";
import { GUIDE_LANGUAGES, QUESTIONS, combineAnswers, mainLanguage, sampleAnswers } from "./questions";

describe("guided interview", () => {
  it("has Priya's sample answer for each question, from the fixture", () => {
    const a = sampleAnswers();
    expect(a).toHaveLength(6);
    for (const [i, token] of ["2014", "आठ", "2024", "वॉटरलू", "टेस्ट", "दस्तावेज़"].entries()) expect(a[i]).toContain(token);
  });

  it("combines answered questions into one transcript and skips the rest", () => {
    const qs = QUESTIONS.map((q) => en[q.question]);
    const out = combineAnswers(qs, ["Pune, 2014", null, "July 2024", null, null, null]);
    expect(out).toBe(`Q: ${qs[0]}\nA: Pune, 2014\n\nQ: ${qs[2]}\nA: July 2024`);
  });

  it("picks the language most answers were in", () => {
    expect(mainLanguage(["hi", "en", "hi"], "en")).toBe("hi");
    expect(mainLanguage([], "fr")).toBe("fr");
  });

  it("ships the spoken questions for every guide language, under 4 MB in total", () => {
    let total = 0;
    for (const lang of GUIDE_LANGUAGES) {
      const json = JSON.parse(readFileSync(`public/guide/${lang}/questions.json`, "utf8"));
      expect(json.questions).toHaveLength(6);
      expect(json.machineTranslated).toBe(!["en", "fr"].includes(lang));
      for (const q of QUESTIONS) {
        const file = `public${q.audio(lang)}`;
        expect(existsSync(file)).toBe(true);
        total += statSync(file).size;
      }
    }
    expect(total).toBeLessThan(4 * 1024 * 1024);
  });
});
