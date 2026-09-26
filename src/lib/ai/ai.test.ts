import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as profileRoute } from "@/app/api/profile/route";
import { POST as transcribeRoute } from "@/app/api/transcribe/route";
import pathwayJson from "@/data/pathways/on-rn-ien.json";
import { profileFixture, transcriptFixture } from "@/lib/demo";
import { buildPlan } from "@/lib/engine/plan";
import { parsePathway } from "@/lib/engine/schema";
import { transcribeWithElevenLabs } from "@/lib/voice/elevenlabs";
import { extractProfileWithClaude, ExtractionError } from "./anthropic";
import { extractProfileInputSchema, missingKeyFields, toProfile } from "./tools";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const goodInput = {
  targetCategory: "RN",
  countryOfEducation: "in",
  credential: "bachelor",
  graduationYear: 2014,
  lastPractisedAt: "2024-07",
  yearsExperience: 8,
  currentlyInCanada: true,
  province: "on",
  authorizedToWork: "yes",
  nameOnDocumentsMatches: null,
  documentsLanguage: "mixed",
  languageProficiency: { status: "none", test: null, date: null },
  progress: { ecaStarted: false },
  spokenLanguage: "hi",
  confidence: { credential: 0.9, lastPractisedAt: 0.8, nameOnDocumentsMatches: 0.5 },
  englishTranslation: "My name is Priya.",
  followUp: { native: "?", english: "?" },
};

function fakeClient(content: unknown[], stop_reason = "tool_use") {
  const create = vi.fn().mockResolvedValue({ content, stop_reason });
  return { client: { messages: { create } } as never, create };
}

describe("profile extraction parsing", () => {
  it("normalizes codes and keeps confidences only for non-null fields", () => {
    const profile = toProfile(extractProfileInputSchema.parse(goodInput));
    expect(profile.countryOfEducation).toBe("IN");
    expect(profile.province).toBe("ON");
    expect(profile.profession).toBe("nurse");
    expect(profile.progress.cnoApplicationSubmitted).toBeNull();
    expect(profile.confidence).toEqual({ credential: 0.9, lastPractisedAt: 0.8 });
  });

  it("turns a malformed field into null instead of failing the whole extraction", () => {
    const parsed = extractProfileInputSchema.parse({
      ...goodInput,
      lastPractisedAt: "last summer",
      credential: "MSc",
      graduationYear: "2014",
    });
    const profile = toProfile(parsed);
    expect(profile.lastPractisedAt).toBeNull();
    expect(profile.credential).toBeNull();
    expect(profile.graduationYear).toBeNull();
    expect(missingKeyFields(profile)).toEqual(["lastPractisedAt", "credential"]);
  });

  it("still requires an English translation", () => {
    expect(extractProfileInputSchema.safeParse({ ...goodInput, englishTranslation: "" }).success).toBe(false);
  });
});

describe("extractProfileWithClaude", () => {
  const input = { transcript: "मेरा नाम प्रिया है।", languageCode: "hi", today: "2026-09-26" };

  it("forces the extract_profile tool and returns a validated profile", async () => {
    const { client, create } = fakeClient([{ type: "tool_use", id: "t1", name: "extract_profile", input: goodInput }]);
    const data = await extractProfileWithClaude(input, { client });
    const args = create.mock.calls[0][0];
    expect(args.tool_choice).toEqual({ type: "tool", name: "extract_profile" });
    expect(args.system).toContain("2026-09-26");
    expect(data.profile.credential).toBe("bachelor");
    expect(data.missingFields).toEqual([]);
    expect(data.followUp).toBeUndefined(); // only sent when something is missing
    expect(buildPlan(data.profile, parsePathway(pathwayJson), "2026-09-26").parallel.totalWeeks).toBeGreaterThan(0);
  });

  it("returns the follow-up question when key fields are missing", async () => {
    const { client } = fakeClient([
      { type: "tool_use", id: "t1", name: "extract_profile", input: { ...goodInput, authorizedToWork: null } },
    ]);
    const data = await extractProfileWithClaude(input, { client });
    expect(data.missingFields).toEqual(["authorizedToWork"]);
    expect(data.followUp).toEqual({ native: "?", english: "?" });
  });

  it("throws when there is no tool call or the model refuses", async () => {
    await expect(extractProfileWithClaude(input, fakeClient([{ type: "text", text: "hi" }], "end_turn"))).rejects.toThrow(
      ExtractionError,
    );
    await expect(extractProfileWithClaude(input, fakeClient([], "refusal"))).rejects.toThrow(/declined/);
  });
});

describe("transcribeWithElevenLabs", () => {
  const audio = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" });

  it("sends scribe_v2 with the key header and maps the response", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "test-key");
    const fetchImpl = vi.fn().mockResolvedValue(
      Response.json({ text: "नमस्ते", language_code: "hin", language_probability: 0.97, words: [] }),
    );
    const data = await transcribeWithElevenLabs(audio, { languageHint: "hi", fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/speech-to-text");
    expect(init.headers["xi-api-key"]).toBe("test-key");
    expect((init.body as FormData).get("model_id")).toBe("scribe_v2");
    expect((init.body as FormData).get("language_code")).toBe("hi");
    expect(data).toEqual({ text: "नमस्ते", languageCode: "hin", languageProbability: 0.97 });
  });

  it("throws on HTTP errors and unexpected shapes", async () => {
    await expect(
      transcribeWithElevenLabs(audio, { fetchImpl: vi.fn().mockResolvedValue(new Response("no", { status: 500 })) }),
    ).rejects.toThrow(/500/);
    await expect(
      transcribeWithElevenLabs(audio, { fetchImpl: vi.fn().mockResolvedValue(Response.json({ nope: true })) }),
    ).rejects.toThrow(/shape/);
  });
});

describe("routes", () => {
  const audioForm = () => {
    const form = new FormData();
    form.append("audio", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "a.webm");
    return form;
  };

  it("serves fixtures in demo mode without calling upstream", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const t = await (await transcribeRoute(new Request("http://x/api/transcribe?demo=1", { method: "POST" }))).json();
    expect(t).toEqual({ ok: true, data: transcriptFixture(), fallback: true });
    const p = await (await profileRoute(new Request("http://x/api/profile?demo=1", { method: "POST" }))).json();
    expect(p).toEqual({ ok: true, data: profileFixture(), fallback: true });
  });

  it("falls back to fixtures when no API key is configured", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const t = await (await transcribeRoute(new Request("http://x/api/transcribe", { method: "POST", body: audioForm() }))).json();
    expect(t.fallback).toBe(true);
    const p = await (
      await profileRoute(
        new Request("http://x/api/profile", {
          method: "POST",
          body: JSON.stringify({ transcript: "hello", languageCode: "en", locale: "en" }),
        }),
      )
    ).json();
    expect(p.fallback).toBe(true);
    expect(p.data.profile.lastPractisedAt).toBe("2024-07");
  });

  it("rejects bad input with a clear error", async () => {
    const noAudio = await transcribeRoute(new Request("http://x/api/transcribe", { method: "POST", body: new FormData() }));
    expect(noAudio.status).toBe(400);
    const big = new FormData();
    big.append("audio", new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]), "big.webm");
    expect((await transcribeRoute(new Request("http://x/api/transcribe", { method: "POST", body: big }))).status).toBe(413);
    const badJson = await profileRoute(new Request("http://x/api/profile", { method: "POST", body: "{" }));
    expect(badJson.status).toBe(400);
    const badShape = await profileRoute(
      new Request("http://x/api/profile", { method: "POST", body: JSON.stringify({ transcript: "" }) }),
    );
    expect(await badShape.json()).toMatchObject({ ok: false });
  });

  it("the demo profile builds a plan", () => {
    const plan = buildPlan(profileFixture().profile, parsePathway(pathwayJson), "2026-09-26");
    expect(plan.statuses.translations).toBe("todo");
  });
});
