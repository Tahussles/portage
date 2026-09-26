import pathwayJson from "@/data/pathways/on-rn-ien.json";
import { ExtractionError, hasAnthropicKey } from "@/lib/ai/anthropic";
import { extractDocumentWithClaude, type DocMediaType } from "@/lib/ai/documents";
import { parseProfileLoose } from "@/lib/ai/tools";
import type { ApiResult, DocCheckData } from "@/lib/client/api";
import { docFixtureFor, isDemoRequest } from "@/lib/demo";
import { docRules } from "@/lib/engine/docRules";
import { buildPlan } from "@/lib/engine/plan";
import { parsePathway } from "@/lib/engine/schema";
import type { DocExtraction } from "@/lib/engine/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const pathway = parsePathway(pathwayJson);

function json(body: ApiResult<DocCheckData>, status = 200) {
  return Response.json(body, { status });
}

function todayInOntario(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
}

/** Detects the file type from its first bytes, so a renamed file cannot pass as a PDF. */
function sniff(bytes: Uint8Array): DocMediaType | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x25, 0x50, 0x44, 0x46)) return "application/pdf"; // %PDF
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  return null;
}

export async function POST(req: Request) {
  const demo = isDemoRequest(req);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ ok: false, error: "Expected multipart/form-data with a file" }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return json({ ok: false, error: "Missing file" }, 400);
  if (file.size > MAX_FILE_BYTES) return json({ ok: false, error: "File is larger than 8 MB" }, 413);

  const profileRaw = form.get("profile");
  let profile = null;
  if (typeof profileRaw === "string" && profileRaw) {
    try {
      profile = parseProfileLoose(JSON.parse(profileRaw));
    } catch {
      return json({ ok: false, error: "profile must be JSON" }, 400);
    }
  }
  const legalNameRaw = form.get("legalName");
  const legalName = typeof legalNameRaw === "string" ? legalNameRaw.slice(0, 200) : null;

  const today = todayInOntario();
  const respond = (extraction: DocExtraction, fallback: boolean) => {
    const plan = profile ? buildPlan(profile, pathway, today) : null;
    const findings = docRules({ extraction, today, profile, plan, legalName });
    return json({ ok: true, data: { extraction, findings }, ...(fallback ? { fallback: true } : {}) });
  };
  // Demo: scripted samples, recognised by file name; anything else shows the employment letter.
  if (demo) return respond(docFixtureFor(file.name, { orDefault: true })!, true);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mediaType = sniff(bytes);
  if (!mediaType) return json({ ok: false, error: "Upload a PDF, PNG or JPG" }, 415);

  // On failure, only a known sample falls back to its fixture: showing a sample's findings for
  // someone's real document would be wrong.
  const failure = (reason: string) => {
    console.warn(`[doc-check] fallback: ${reason}`);
    const sample = docFixtureFor(file.name);
    return sample
      ? respond(sample, true)
      : json({ ok: false, error: "We could not read this document right now. Please try again.", fallback: true });
  };

  if (!hasAnthropicKey()) return failure("no Anthropic key configured");
  const started = Date.now();
  try {
    const extraction = await extractDocumentWithClaude({ data: bytes, mediaType });
    console.info(`[doc-check] ok in ${Date.now() - started} ms`);
    return respond(extraction, false);
  } catch (err) {
    const name = err instanceof ExtractionError ? "ExtractionError" : err instanceof Error ? err.name : "error";
    return failure(`${name} after ${Date.now() - started} ms`);
  }
}
