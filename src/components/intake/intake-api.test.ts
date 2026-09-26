import { describe, expect, it, vi } from "vitest";
import { SAMPLE_EXTRACTION, SAMPLE_TRANSCRIPT, extractProfile, isDemoMode, sampleClipExists, transcribe } from "./intake-api";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const audio = new Blob(["x"], { type: "audio/webm" });

describe("intake API adapter", () => {
  it("uses the live route when it answers with a valid envelope", async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true, data: { text: "hello", languageCode: "en" } }));
    const result = await transcribe(audio, "en", { fetchImpl, demo: false });
    expect(result).toEqual({ data: { text: "hello", languageCode: "en" }, source: "live" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/transcribe");
    expect((init.body as FormData).get("languageHint")).toBe("en");
  });

  it("falls back to the sample when the route is missing (404)", async () => {
    const fetchImpl = vi.fn(async () => new Response("Not found", { status: 404 }));
    expect(await transcribe(audio, undefined, { fetchImpl, demo: false })).toEqual({
      data: SAMPLE_TRANSCRIPT,
      source: "sample",
    });
  });

  it("falls back when the network fails, the route says not ok, or the shape is wrong", async () => {
    const failing = [
      vi.fn(async () => Promise.reject(new TypeError("offline"))),
      vi.fn(async () => json({ ok: false, error: "upstream" })),
      vi.fn(async () => json({ ok: true, data: { profile: { profession: "doctor" } } })),
    ];
    for (const fetchImpl of failing) {
      const result = await extractProfile("text", "hi", "en", { fetchImpl, demo: false });
      expect(result).toEqual({ data: SAMPLE_EXTRACTION, source: "sample" });
    }
  });

  it("never calls the network in demo mode", async () => {
    const fetchImpl = vi.fn();
    expect((await transcribe(audio, undefined, { fetchImpl, demo: true })).source).toBe("sample");
    expect((await extractProfile("t", "hi", "fr", { fetchImpl, demo: true })).source).toBe("sample");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts the transcript, language and locale to /api/profile", async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true, data: SAMPLE_EXTRACTION }));
    const result = await extractProfile("namaste", "hi", "fr", { fetchImpl, demo: false });
    expect(result.source).toBe("live");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/profile");
    expect(JSON.parse(init.body as string)).toEqual({ transcript: "namaste", languageCode: "hi", locale: "fr" });
  });

  it("reads ?demo=1 and checks the sample clip with HEAD", async () => {
    expect(isDemoMode("?demo=1")).toBe(true);
    expect(isDemoMode("?lang=fr")).toBe(false);
    expect(await sampleClipExists("/demo/priya-hi.webm", vi.fn(async () => new Response(null, { status: 404 })))).toBe(false);
    expect(await sampleClipExists("/demo/priya-hi.webm", vi.fn(async () => new Response(null, { status: 200 })))).toBe(true);
  });
});
