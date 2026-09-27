import pathwayData from "@/data/pathways/on-rn-ien.json";
import { docFixtureFor, profileFixture } from "@/lib/demo";
import { docRules } from "@/lib/engine/docRules";
import { buildPlan } from "@/lib/engine/plan";
import type { Locale, Pathway } from "@/lib/engine/types";
import { emptyProfile } from "./fields";
import { applyUpdate, applyUpdates, documentUpdates, mergeVoice } from "./merge";
import type { Account, CheckedDocument } from "./types";

const pathway = pathwayData as unknown as Pathway;

export const DEMO_ACCOUNT_ID = "demo-priya";

function blank(id: string, displayName: string, preferredLanguage: Locale, at: string): Account {
  return {
    version: 1,
    id,
    displayName,
    preferredLanguage,
    spokenLanguage: null,
    createdAt: at,
    profile: emptyProfile(),
    provenance: {},
    documents: [],
    conflicts: [],
  };
}

/** The two watermarked samples, checked exactly as /api/doc-check does in demo mode. */
function sampleDocuments(at: string, today: string): CheckedDocument[] {
  const profile = profileFixture().profile;
  const plan = buildPlan(profile, pathway, today);
  return ["sample-employment-letter.pdf", "sample-police-check.pdf"].map((file) => {
    const sample = docFixtureFor(file)!;
    return {
      id: `${sample.extraction.docType}@${at}`,
      docType: sample.extraction.docType,
      checkedAt: at,
      extraction: sample.extraction,
      findings: docRules({ extraction: sample.extraction, today, profile, plan, legalName: sample.legalName }),
      sample: true,
    };
  });
}

/**
 * Priya's demo account (a composite persona): her voice interview (Ebrahim's profile fixture), the two
 * sample documents already checked, and one open conflict about her legal name: the employment letter
 * says "Priya Anand Deshpande", she said "Priya Deshpande".
 */
export function seedPriya(now: Date = new Date(), preferredLanguage: Locale = "en"): Account {
  const at = now.toISOString();
  const today = now.toLocaleDateString("en-CA");
  let account = blank(DEMO_ACCOUNT_ID, "Priya", preferredLanguage, at);
  // She said her name in the interview, so the display name counts as from her voice.
  account = { ...account, provenance: { preferredLanguage: { source: "seed", at }, displayName: { source: "voice", label: "voice", at } } };
  account = mergeVoice(account, profileFixture().profile, at);
  account = applyUpdates(account, [
    { path: "displayName", value: "Priya", source: "voice", label: "voice", at },
    { path: "legalName", value: "Priya Deshpande", source: "voice", label: "voice", at },
  ]);

  const [employment, police] = sampleDocuments(at, today);
  account = { ...account, documents: [employment, police] };
  // The police check agrees with what she said, so only its date is merged; the employment letter's
  // fuller name then disagrees with the voice interview, which opens the conflict.
  account = applyUpdates(account, documentUpdates(police.extraction, at).filter((u) => u.path !== "legalName"));
  for (const u of documentUpdates(employment.extraction, at)) account = applyUpdate(account, u);
  return account;
}

/** Title-cased words from the part of the email before "@": "taha.hussain@x" -> "Taha Hussain". */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._+-]+/).filter(Boolean);
  const name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return name || email;
}

/** "Continue with email": a fresh account in this browser, named from the email, with an empty profile. */
export function createEmailAccount(email: string, preferredLanguage: Locale, now: Date = new Date()): Account {
  const at = now.toISOString();
  const normalized = email.trim().toLowerCase();
  const account = blank(`email:${normalized}`, nameFromEmail(normalized), preferredLanguage, at);
  return { ...account, email: normalized, provenance: { displayName: { source: "seed", at }, preferredLanguage: { source: "seed", at } } };
}

/** "PD" for "Priya Deshpande", "P" for "Priya". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}
