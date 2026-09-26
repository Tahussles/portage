import { describe, expect, it } from "vitest";
import en from "./en.json";
import fr from "./fr.json";

// Copy rules from AGENTS.md: no em dashes anywhere; Canadian spelling in English.
const US_SPELLINGS: [RegExp, string][] = [
  [/\bcenters?\b/i, "centre"],
  [/\bcolors?\b/i, "colour"],
  [/\bfavorites?\b/i, "favourite"],
  [/\borganiz(e|es|ed|ing|ation|ations)\b/i, "organise / organisation"],
  // "license" is only allowed as a verb ("to license", "CNO will license you"); the noun is "licence".
  [/\b(?<!(?:to|will|can|may|must|should|would|could) )licenses?\b/i, "licence"],
];

describe("copy lint", () => {
  it("has no em dashes in either language", () => {
    const offenders = [...Object.entries(en), ...Object.entries(fr)].filter(([, v]) => v.includes("—"));
    expect(offenders).toEqual([]);
  });

  it("uses Canadian spelling in English", () => {
    const offenders = Object.entries(en).flatMap(([key, value]) =>
      US_SPELLINGS.filter(([re]) => re.test(value)).map(([, fix]) => `${key}: use "${fix}" in "${value}"`),
    );
    expect(offenders).toEqual([]);
  });

  it("catches the patterns it is meant to catch", () => {
    const hit = (s: string) => US_SPELLINGS.some(([re]) => re.test(s));
    expect(hit("Earliest license")).toBe(true);
    expect(hit("You need a license.")).toBe(true);
    expect(hit("CNO will license you")).toBe(false);
    expect(hit("Earliest licence")).toBe(false);
    expect(hit("Health center")).toBe(true);
  });
});
