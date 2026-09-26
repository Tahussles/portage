import { checkDocument, type DocCheckData } from "@/lib/client/api";
import type { DocExtraction, DocFinding, DocType, Locale, Profile } from "@/lib/engine/types";
import { htmlLang, type MessageKey, type MessageVars } from "@/lib/i18n";

type Translate = (key: MessageKey, vars?: MessageVars) => string;

/** Same limit as the route (src/app/api/doc-check/route.ts), enforced before uploading. */
export const MAX_BYTES = 8 * 1024 * 1024;
export const ACCEPT = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";

/** Watermarked samples in public/demo/docs (Ebrahim's). The route matches its fixtures by PDF file name. */
export const SAMPLES = [
  { id: "employment", file: "sample-employment-letter.pdf", thumb: "/demo/docs/sample-employment-letter.png", label: "docs.sample.employment" },
  { id: "police", file: "sample-police-check.pdf", thumb: "/demo/docs/sample-police-check.png", label: "docs.sample.police" },
] as const satisfies readonly { id: string; file: string; thumb: string; label: MessageKey }[];

export type Sample = (typeof SAMPLES)[number];

export type FileProblem = "docs.error.type" | "docs.error.size" | "docs.error.empty";

/** Client-side check before anything is sent: type by MIME or extension, size up to 8 MB. */
export function validateFile(file: { name: string; type: string; size: number }): FileProblem | null {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const okType = ["application/pdf", "image/png", "image/jpeg"].includes(file.type) || ["pdf", "png", "jpg", "jpeg"].includes(ext);
  if (!okType) return "docs.error.type";
  if (file.size === 0) return "docs.error.empty";
  if (file.size > MAX_BYTES) return "docs.error.size";
  return null;
}

export function isPdf(file: { name: string; type: string }) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export type Tone = "ok" | "info" | "issue";

/** OK gets an ink tick; warn and critical get a red flag; info stays quiet. */
export function toneOf(finding: Pick<DocFinding, "severity">): Tone {
  if (finding.severity === "ok") return "ok";
  if (finding.severity === "info") return "info";
  return "issue";
}

export function countIssues(findings: DocFinding[]) {
  return findings.filter((f) => toneOf(f) === "issue").length;
}

function formatIssueDate(date: string, locale: Locale) {
  const precise = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const ms = Date.parse(precise ? `${date}T00:00:00Z` : `${date.slice(0, 7)}-01T00:00:00Z`);
  if (Number.isNaN(ms)) return date;
  return new Intl.DateTimeFormat(htmlLang[locale], {
    ...(precise ? { day: "numeric" } : {}),
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(ms);
}

function languageName(code: string, locale: Locale) {
  try {
    return new Intl.DisplayNames([htmlLang[locale]], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The fields the model read from the document, as a quiet two-column table. */
export function extractionRows(extraction: DocExtraction, t: Translate, locale: Locale) {
  const none = t("docs.none");
  return [
    { label: t("docs.field.type"), value: t(`docs.type.${extraction.docType satisfies DocType}`) },
    { label: t("docs.field.name"), value: extraction.nameOnDocument ?? none },
    { label: t("docs.field.issueDate"), value: extraction.issueDate ? formatIssueDate(extraction.issueDate, locale) : none },
    { label: t("docs.field.language"), value: extraction.documentLanguage ? languageName(extraction.documentLanguage, locale) : none },
    { label: t("docs.field.issuer"), value: extraction.issuer ?? none },
  ];
}

export type CheckOutcome =
  | { kind: "result"; data: DocCheckData; sample: boolean }
  | { kind: "error" };

const TIMEOUT_MS = 30_000;

/** Runs the pre-check. Fixture answers (`fallback: true`) are labelled as samples; failures never throw. */
export async function runCheck(
  file: File,
  opts: { profile: Profile; legalName?: string; demo?: boolean },
  call: typeof checkDocument = checkDocument,
): Promise<CheckOutcome> {
  try {
    const res = await Promise.race([
      call(file, { profile: opts.profile, legalName: opts.legalName?.trim() || undefined, demo: opts.demo }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);
    if (res.ok && res.data && Array.isArray(res.data.findings)) {
      return { kind: "result", data: res.data, sample: Boolean(res.fallback) };
    }
  } catch {
    // network error or timeout
  }
  return { kind: "error" };
}

/** Fetches a sample PDF so it goes through the same upload path as a real document. */
export async function loadSample(sample: Sample, fetchImpl: typeof fetch = fetch): Promise<File> {
  const blob = await (await fetchImpl(`/demo/docs/${sample.file}`)).blob();
  return new File([blob], sample.file, { type: "application/pdf" });
}
