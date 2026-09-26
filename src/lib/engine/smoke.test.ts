import { describe, expect, it } from "vitest";
import type { Locale } from "@/lib/engine/types";

describe("scaffold", () => {
  it("resolves the @ path alias and runs", () => {
    const locale: Locale = "en";
    expect(locale).toBe("en");
  });
});
