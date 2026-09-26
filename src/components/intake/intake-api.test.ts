import { describe, expect, it, vi } from "vitest";
import {
  SAMPLE_EXTRACTION,
  SAMPLE_TRANSCRIPT,
  extractProfile,
  isDemoMode,
  sampleClipExists,
  transcribe,
} from "./intake-api";

const audio = new Blob(["x"], { type: "audio/webm" });

describe("intake API adapter", () => {
  it("uses the live route when it answers with valid data", async () => {
    const call = vi.fn(async () => ({ ok: true, data: { text: "hello", languageCode: "en" } }));
    const result = await transcribe(audio, "en", { call, demo: false });
    expect(result).toEqual({ data: { text: "hello", languageCode: "en" }, source: "live" });
    expect(call).toHaveBeenCalledWith(audio, { languageHint: "en", demo: false });
  });

  it("labels route fixtures (fallback: true) as the sample", async () => {
    const call = vi.fn(async () => ({ ok: true, fallback: true, data: SAMPLE_TRANSCRIPT }));
    expect((await transcribe(audio, undefined, { call, demo: false })).source).toBe("sample");
  });

  it("falls back to the local sample when the route is unreachable, not ok, or malformed", async () => {
    const failing = [
      vi.fn(async () => Promise.reject(new TypeError("offline"))),
      vi.fn(async () => ({ ok: false, error: "Unexpected response (404)" })),
      vi.fn(async () => ({ ok: true, data: { profile: { profession: "doctor" } } })),
    ];
    for (const call of failing) {
      // The malformed case is deliberately not a valid ProfileData.
      expect(await extractProfile("text", "hi", "en", { call: call as never, demo: false })).toEqual({
        data: SAMPLE_EXTRACTION,
        source: "sample",
      });
    }
  });

  it("passes demo mode and the request body through to the route", async () => {
    const call = vi.fn(async () => ({ ok: true, data: SAMPLE_EXTRACTION }));
    const result = await extractProfile("namaste", "hi", "fr", { call, demo: true });
    expect(result.source).toBe("live");
    expect(call).toHaveBeenCalledWith({ transcript: "namaste", languageCode: "hi", locale: "fr" }, { demo: true });
  });

  it("uses Ebrahim's Priya fixtures as the sample", () => {
    expect(SAMPLE_TRANSCRIPT.languageCode).toBe("hi");
    expect(SAMPLE_EXTRACTION.profile.lastPractisedAt).toBe("2024-07");
  });

  it("reads ?demo=1 and checks the sample clip with HEAD", async () => {
    expect(isDemoMode("?demo=1")).toBe(true);
    expect(isDemoMode("?lang=fr")).toBe(false);
    expect(await sampleClipExists("/demo/priya-hi.webm", vi.fn(async () => new Response(null, { status: 404 })))).toBe(false);
    expect(await sampleClipExists("/demo/priya-hi.webm", vi.fn(async () => new Response(null, { status: 200 })))).toBe(true);
  });
});
