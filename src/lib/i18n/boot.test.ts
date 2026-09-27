import { describe, expect, it } from "vitest";
import { browserLocale, initialLocale, LOCALE_BOOT_SCRIPT, PENDING_ATTR } from "./boot";

function runBoot(url: string, languages: string[]) {
  const attrs = new Map<string, string>();
  const root = {
    lang: "en-CA",
    setAttribute: (k: string, v: string) => attrs.set(k, v),
    removeAttribute: (k: string) => attrs.delete(k),
  };
  const { pathname, search } = new URL(url, "https://portage.test");
  new Function("document", "location", "navigator", "setTimeout", LOCALE_BOOT_SCRIPT)(
    { documentElement: root },
    { pathname, search },
    { languages, language: languages[0] },
    () => 0,
  );
  return { lang: root.lang, pending: attrs.get(PENDING_ATTR) ?? null };
}

describe("first-visit locale", () => {
  it("starts in French only for a French browser language", () => {
    expect(browserLocale("fr-CA")).toBe("fr");
    expect(browserLocale("FR")).toBe("fr");
    expect(browserLocale("en-CA")).toBe("en");
    expect(browserLocale("hi-IN")).toBe("en");
    expect(browserLocale(undefined)).toBe("en");
  });

  it("lets ?lang= win over the browser", () => {
    expect(initialLocale("?lang=en", "fr-CA")).toBe("en");
    expect(initialLocale("?lang=fr", "en-CA")).toBe("fr");
    expect(initialLocale("?lang=de", "fr-CA")).toBe("fr");
    expect(initialLocale("", "en-US")).toBe("en");
  });

  it("hides the English server render only when the page will turn French", () => {
    expect(runBoot("/", ["fr-CA", "en"])).toEqual({ lang: "fr-CA", pending: "fr" });
    expect(runBoot("/roadmap?lang=fr", ["en-CA"])).toEqual({ lang: "fr-CA", pending: "fr" });
    expect(runBoot("/?lang=en", ["fr-CA"])).toEqual({ lang: "en-CA", pending: null });
    expect(runBoot("/", ["en-CA"])).toEqual({ lang: "en-CA", pending: null });
    expect(runBoot("/pitch", ["fr-CA"])).toEqual({ lang: "en-CA", pending: null });
  });
});
