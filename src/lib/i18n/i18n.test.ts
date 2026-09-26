import { describe, expect, it } from "vitest";
import en from "./en.json";
import fr from "./fr.json";
import { isLocale, translate } from "./index";

describe("i18n", () => {
  it("has the same keys in en and fr", () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  it("has no empty strings and no em dashes in UI copy", () => {
    for (const dict of [en, fr]) {
      for (const value of Object.values(dict)) {
        expect(value.trim()).not.toBe("");
        expect(value).not.toContain("—");
      }
    }
  });

  it("translates by locale", () => {
    expect(translate("en", "hero.line2")).toBe("Now practise it here.");
    expect(translate("fr", "hero.line2")).toBe("Exercez maintenant ici.");
  });

  it("only accepts en and fr", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
