import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as docCheckRoute } from "@/app/api/doc-check/route";
import profilePriya from "@/data/fixtures/profile-priya.json";
import { extractDocumentWithClaude } from "./documents";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const samplePdf = readFileSync("public/demo/docs/sample-police-check.pdf");

function upload(name: string, bytes: Uint8Array<ArrayBuffer>, extra: Record<string, string> = {}, demo = false) {
  const form = new FormData();
  form.append("file", new File([bytes], name));
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return docCheckRoute(new Request(`http://x/api/doc-check${demo ? "?demo=1" : ""}`, { method: "POST", body: form }));
}

describe("extractDocumentWithClaude", () => {
  it("sends the PDF as a document block and normalizes the tool input", async () => {
    const create = vi.fn().mockResolvedValue({
      stop_reason: "tool_use",
      content: [
        {
          type: "tool_use",
          id: "t1",
          name: "extract_document",
          input: { docType: "passport-ish", nameOnDocument: "Priya", issueDate: "1 Sept 2026", documentLanguage: "EN", description: "x" },
        },
      ],
    });
    const result = await extractDocumentWithClaude(
      { data: new Uint8Array(samplePdf), mediaType: "application/pdf" },
      { client: { messages: { create } } as never },
    );
    const args = create.mock.calls[0][0];
    expect(args.tool_choice).toEqual({ type: "tool", name: "extract_document" });
    expect(args.messages[0].content[0]).toMatchObject({ type: "document", source: { media_type: "application/pdf" } });
    expect(result).toEqual({
      docType: "other",
      nameOnDocument: "Priya",
      issueDate: null,
      documentLanguage: "en",
      issuer: null,
      description: "x",
    });
  });
});

describe("/api/doc-check", () => {
  it("demo mode: police check sample gives the 'too early' finding for Priya", async () => {
    const res = await upload("sample-police-check.pdf", samplePdf, { profile: JSON.stringify(profilePriya) }, true);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.fallback).toBe(true);
    expect(body.data.extraction.docType).toBe("criminal_record_check");
    expect(body.data.findings.map((f: { id: string }) => f.id)).toContain("crc_provider");
  });

  it("demo mode: employment letter sample with a legal name", async () => {
    const res = await upload("sample-employment-letter.pdf", samplePdf, { legalName: "Priya Deshpande" }, true);
    const ids = (await res.json()).data.findings.map((f: { id: string }) => f.id);
    expect(ids).toEqual(["must_come_from_employer", "name_mismatch", "language_ok"]);
  });

  it("without a key, falls back only for known samples", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const sample = await (await upload("sample-police-check.pdf", samplePdf)).json();
    expect(sample).toMatchObject({ ok: true, fallback: true });
    const real = await (await upload("my-diploma.pdf", samplePdf)).json();
    expect(real).toMatchObject({ ok: false, fallback: true });
  });

  it("rejects missing, oversized, non-document and bad-profile uploads", async () => {
    const empty = await docCheckRoute(new Request("http://x/api/doc-check", { method: "POST", body: new FormData() }));
    expect(empty.status).toBe(400);
    expect((await upload("big.pdf", new Uint8Array(8 * 1024 * 1024 + 1))).status).toBe(413);
    expect((await upload("notes.pdf", new TextEncoder().encode("hello"))).status).toBe(415);
    expect((await upload("a.pdf", samplePdf, { profile: "{" })).status).toBe(400);
  });
});
