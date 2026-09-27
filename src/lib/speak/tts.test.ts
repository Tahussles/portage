import { describe, expect, it, vi } from "vitest";
import { needsTranslation, speak, TRANSLATE_SYSTEM } from "./tts";

describe("hear your plan: speech pipeline", () => {
  it("translates everything except English", () => {
    expect(needsTranslation("en")).toBe(false);
    expect(needsTranslation("en-CA")).toBe(false);
    expect(needsTranslation("hi")).toBe(true);
    expect(needsTranslation("fr")).toBe(true);
  });

  it("keeps the faithful-translation rule in the system prompt", () => {
    expect(TRANSLATE_SYSTEM).toBe(
      "Translate faithfully. Do not add, remove, or change any fact, date, number, or name. Output only the translation.",
    );
  });

  it("translates, then synthesizes, and caches per language and text", async () => {
    const translateImpl = vi.fn(async () => "अनुवाद");
    const synthesizeImpl = vi.fn(async () => new ArrayBuffer(8));
    const first = await speak("Your plan.", "hi", { translateImpl, synthesizeImpl });
    expect(first.text).toBe("अनुवाद");
    expect(synthesizeImpl).toHaveBeenCalledWith("अनुवाद", expect.anything());
    await speak("Your plan.", "hi", { translateImpl, synthesizeImpl });
    expect(translateImpl).toHaveBeenCalledTimes(1);
    expect(synthesizeImpl).toHaveBeenCalledTimes(1);
  });

  it("skips translation for English", async () => {
    const translateImpl = vi.fn(async () => "x");
    const synthesizeImpl = vi.fn(async () => new ArrayBuffer(8));
    const out = await speak("English plan text.", "en", { translateImpl, synthesizeImpl });
    expect(translateImpl).not.toHaveBeenCalled();
    expect(out.text).toBe("English plan text.");
  });
});
