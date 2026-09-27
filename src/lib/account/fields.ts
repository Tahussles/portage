import type { Profile } from "@/lib/engine/types";
import type { Account, FieldPath, FieldValue } from "./types";

/** Account-level fields; everything else is "profile.<path>" inside Ebrahim's Profile. */
export const ACCOUNT_FIELDS = ["displayName", "legalName", "preferredLanguage", "spokenLanguage"] as const;

/** Names and dates: a document beats the voice interview for these (merge.ts). */
export const NAME_AND_DATE_FIELDS: ReadonlySet<FieldPath> = new Set([
  "legalName",
  "profile.graduationYear",
  "profile.lastPractisedAt",
  "profile.languageProficiency.date",
  "profile.progress.criminalRecordCheckDate",
]);

/** Profile fields that are not facts about the person (or live on the account instead). */
const NOT_FACTS = new Set(["profession", "targetCategory", "confidence", "spokenLanguage"]);

export function emptyProfile(): Profile {
  return {
    profession: "nurse",
    targetCategory: "RN",
    countryOfEducation: null,
    credential: null,
    graduationYear: null,
    lastPractisedAt: null,
    yearsExperience: null,
    currentlyInCanada: null,
    province: null,
    authorizedToWork: null,
    nameOnDocumentsMatches: null,
    documentsLanguage: null,
    languageProficiency: { status: null, test: null, date: null },
    progress: {
      ecaStarted: null,
      cnoAccountCreated: null,
      cnoApplicationSubmitted: null,
      ttpCompleted: null,
      jurisprudencePassed: null,
      registrationExamPassed: null,
      criminalRecordCheckDate: null,
    },
    spokenLanguage: null,
    confidence: {},
  };
}

/** Every fact in a profile as "profile.<path>" -> value (nested objects flattened). */
export function profileFacts(profile: Profile): [FieldPath, FieldValue][] {
  const out: [FieldPath, FieldValue][] = [];
  const walk = (obj: Record<string, unknown>, prefix: string) => {
    for (const [key, value] of Object.entries(obj)) {
      if (!prefix && NOT_FACTS.has(key)) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === "object") walk(value as Record<string, unknown>, path);
      else out.push([`profile.${path}`, (value ?? null) as FieldValue]);
    }
  };
  walk(profile as unknown as Record<string, unknown>, "");
  return out;
}

export function getField(account: Account, path: FieldPath): FieldValue {
  if (!path.startsWith("profile.")) return ((account as unknown as Record<string, unknown>)[path] ?? null) as FieldValue;
  let node: unknown = account.profile;
  for (const key of path.slice("profile.".length).split(".")) {
    if (node === null || typeof node !== "object") return null;
    node = (node as Record<string, unknown>)[key];
  }
  return (node ?? null) as FieldValue;
}

/** Returns a copy of the account with one field set (the profile is copied along the path). */
export function setField(account: Account, path: FieldPath, value: FieldValue): Account {
  if (!path.startsWith("profile.")) {
    return { ...account, [path]: path === "legalName" && value === null ? undefined : value } as Account;
  }
  const keys = path.slice("profile.".length).split(".");
  const profile = structuredClone(account.profile) as unknown as Record<string, unknown>;
  let node = profile;
  for (const key of keys.slice(0, -1)) {
    node[key] = { ...((node[key] as Record<string, unknown>) ?? {}) };
    node = node[key] as Record<string, unknown>;
  }
  node[keys[keys.length - 1]] = value;
  return { ...account, profile: profile as unknown as Profile };
}
