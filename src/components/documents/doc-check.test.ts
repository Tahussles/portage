import { describe, expect, it, vi } from "vitest";
import policeFixture from "@/data/fixtures/doccheck-police-check.json";
import type { DocExtraction, DocFinding, Profile } from "@/lib/engine/types";
import { translate, type MessageKey, type MessageVars } from "@/lib/i18n";
import { MAX_BYTES, SAMPLES, countIssues, extractionRows, loadSample, runCheck, toneOf, validateFile } from "./doc-check";

const en = (key: MessageKey, vars?: MessageVars) => translate("en", key, vars);
const fr = (key: MessageKey, vars?: MessageVars) => translate("fr", key, vars);
const finding = (severity: DocFinding["severity"]): DocFinding => ({
  id: severity,
  severity,
  title: { en: "t", fr: "t" },
  body: { en: "b", fr: "b" },
  relatedNodes: [],
  sourceUrl: "https://www.cno.org",
});

describe("file checks before upload", () => {
  it("accepts PDF, PNG and JPG by type or extension", () => {
    expect(validateFile({ name: "a.pdf", type: "application/pdf", size: 10 })).toBeNull();
    expect(validateFile({ name: "scan.JPG", type: "", size: 10 })).toBeNull();
    expect(validateFile({ name: "photo.png", type: "image/png", size: 10 })).toBeNull();
  });

  it("rejects other types, empty files and files over 8 MB", () => {
    expect(validateFile({ name: "a.docx", type: "application/msword", size: 10 })).toBe("docs.error.type");
    expect(validateFile({ name: "a.pdf", type: "application/pdf", size: 0 })).toBe("docs.error.empty");
    expect(validateFile({ name: "a.pdf", type: "application/pdf", size: MAX_BYTES + 1 })).toBe("docs.error.size");
    expect(validateFile({ name: "a.pdf", type: "application/pdf", size: MAX_BYTES })).toBeNull();
  });
});

describe("findings", () => {
  it("ticks OK, flags warn and critical, keeps info quiet", () => {
    expect(toneOf(finding("ok"))).toBe("ok");
    expect(toneOf(finding("warn"))).toBe("issue");
    expect(toneOf(finding("critical"))).toBe("issue");
    expect(toneOf(finding("info"))).toBe("info");
    expect(countIssues([finding("ok"), finding("warn"), finding("critical"), finding("info")])).toBe(2);
  });
});

describe("extracted fields", () => {
  const extraction = policeFixture.extraction as DocExtraction;

  it("labels type, date and language in the viewer's language", () => {
    expect(extractionRows(extraction, en, "en")).toEqual([
      { label: "Type", value: "Police criminal record check" },
      { label: "Name", value: "Priya Deshpande" },
      { label: "Issued", value: "September 1, 2026" },
      { label: "Language", value: "English" },
      { label: "Issued by", value: "Sample Police Records Office (fictional)" },
    ]);
    const frRows = extractionRows(extraction, fr, "fr");
    expect(frRows[3].value).toBe("anglais");
  });

  it("says when a field is not printed", () => {
    const rows = extractionRows({ ...extraction, nameOnDocument: null, issueDate: null }, en, "en");
    expect(rows[1].value).toBe("Not printed");
    expect(rows[2].value).toBe("Not printed");
  });
});

describe("running a check", () => {
  const profile = { profession: "nurse" } as Profile;
  const file = new File(["%PDF"], "sample-police-check.pdf", { type: "application/pdf" });
  const data = { extraction: policeFixture.extraction as DocExtraction, findings: [finding("ok")] };

  it("returns the findings and labels fixture answers as samples", async () => {
    expect(await runCheck(file, { profile }, vi.fn(async () => ({ ok: true, data })))).toEqual({
      kind: "result",
      data,
      sample: false,
    });
    const sample = await runCheck(file, { profile }, vi.fn(async () => ({ ok: true, data, fallback: true })));
    expect(sample).toMatchObject({ kind: "result", sample: true });
  });

  it("passes the profile and a trimmed legal name, and drops an empty one", async () => {
    const call = vi.fn(async () => ({ ok: true, data }));
    await runCheck(file, { profile, legalName: "  Priya Deshpande " }, call);
    expect(call).toHaveBeenLastCalledWith(file, { profile, legalName: "Priya Deshpande", demo: undefined });
    await runCheck(file, { profile, legalName: "   " }, call);
    expect(call).toHaveBeenLastCalledWith(file, { profile, legalName: undefined, demo: undefined });
  });

  it("reports an error instead of throwing", async () => {
    expect(await runCheck(file, { profile }, vi.fn(async () => ({ ok: false, error: "x" })))).toEqual({ kind: "error" });
    expect(await runCheck(file, { profile }, vi.fn(async () => Promise.reject(new Error("offline"))))).toEqual({
      kind: "error",
    });
  });

  it("loads a sample as a PDF with the file name the route recognises", async () => {
    const fetchImpl = vi.fn(async () => new Response(new Blob(["%PDF"])));
    const loaded = await loadSample(SAMPLES[1], fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith("/demo/docs/sample-police-check.pdf");
    expect(loaded.name).toBe("sample-police-check.pdf");
    expect(loaded.type).toBe("application/pdf");
  });
});
