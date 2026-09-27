import type { DocExtraction, Profile } from "@/lib/engine/types";
import { NAME_AND_DATE_FIELDS, getField, profileFacts, setField } from "./fields";
import type { Account, CheckedDocument, Conflict, ConflictOption, FieldPath, FieldValue, Provenance, ProvenanceSource } from "./types";

// How facts from different sources combine in the account. Pure: every function returns a new account.
//  1. What the person edits always wins, and a later voice or document value never overwrites it.
//  2. For names and dates, a document beats the voice interview (and an older document). When it
//     disagrees with the value already there, the document value is used AND a conflict records both,
//     so nothing changes silently; the person settles it on /profile.
//  3. The voice interview fills empty fields (and a newer interview updates its own earlier answers).
//     Documents also fill empty fields that are not names or dates.
//  4. Every write records its provenance.

export type Update = { path: FieldPath; value: FieldValue } & Provenance;

const isEmpty = (v: FieldValue | undefined) => v === null || v === undefined || v === "";

function sameValue(a: FieldValue, b: FieldValue) {
  return typeof a === "string" && typeof b === "string" ? a.trim().toLowerCase() === b.trim().toLowerCase() : a === b;
}

function write(account: Account, u: Update): Account {
  const next = setField(account, u.path, u.value);
  const provenance: Provenance = { source: u.source, at: u.at, ...(u.label ? { label: u.label } : {}) };
  return { ...next, provenance: { ...account.provenance, [u.path]: provenance } };
}

function withConflict(account: Account, path: FieldPath, options: ConflictOption[], at: string): Account {
  const existing = account.conflicts.find((c) => c.path === path);
  if (existing) {
    const merged = [...existing.options];
    for (const o of options) if (!merged.some((m) => sameValue(m.value, o.value))) merged.push(o);
    return { ...account, conflicts: account.conflicts.map((c) => (c === existing ? { ...c, options: merged } : c)) };
  }
  const conflict: Conflict = { id: `${path}@${at}`, path, options, createdAt: at };
  return { ...account, conflicts: [...account.conflicts, conflict] };
}

const dropConflicts = (account: Account, path: FieldPath): Account =>
  account.conflicts.some((c) => c.path === path) ? { ...account, conflicts: account.conflicts.filter((c) => c.path !== path) } : account;

/** Applies one value from one source, following the rules above. */
export function applyUpdate(account: Account, u: Update): Account {
  if (u.source === "edited") return dropConflicts(write(account, u), u.path);
  if (isEmpty(u.value)) return account;

  const current = getField(account, u.path);
  const prov = account.provenance[u.path];
  if (prov?.source === "edited") return account; // rule 1

  if (!isEmpty(current) && sameValue(current, u.value)) {
    // Agreement: a document is the stronger evidence, so it becomes the recorded source.
    return u.source === "document" && prov?.source !== "document" ? write(account, u) : account;
  }
  if (isEmpty(current)) return write(account, u); // rules 3 and 4

  switch (u.source) {
    case "document": {
      if (!NAME_AND_DATE_FIELDS.has(u.path)) return account;
      const before: ConflictOption = { value: current, source: prov?.source ?? "seed", at: prov?.at ?? u.at, ...(prov?.label ? { label: prov.label } : {}) };
      const incoming: ConflictOption = { value: u.value, source: u.source, at: u.at, ...(u.label ? { label: u.label } : {}) };
      return withConflict(write(account, u), u.path, [incoming, before], u.at); // rule 2
    }
    case "voice":
      return !prov || prov.source === "voice" || prov.source === "seed" ? write(account, u) : account;
    case "seed":
      return write(account, u);
  }
}

export function applyUpdates(account: Account, updates: Update[]): Account {
  return updates.reduce(applyUpdate, account);
}

/** Merges a profile extracted from the voice interview (every non-empty fact). */
export function mergeVoice(account: Account, profile: Profile, at: string, label = "voice"): Account {
  const updates: Update[] = profileFacts(profile).map(([path, value]) => ({ path, value, source: "voice", label, at }));
  if (profile.spokenLanguage) updates.push({ path: "spokenLanguage", value: profile.spokenLanguage, source: "voice", label, at });
  return applyUpdates(account, updates);
}

const DOC_LANGUAGE: Record<string, Profile["documentsLanguage"]> = { en: "en", fr: "fr" };

/** The facts a checked document contributes: the name on it, and dates that the plan uses. */
export function documentUpdates(extraction: DocExtraction, at: string): Update[] {
  const base = { source: "document" as ProvenanceSource, label: extraction.docType, at };
  const updates: Update[] = [];
  if (extraction.nameOnDocument) updates.push({ ...base, path: "legalName", value: extraction.nameOnDocument.trim() });
  if (extraction.docType === "criminal_record_check" && extraction.issueDate)
    updates.push({ ...base, path: "profile.progress.criminalRecordCheckDate", value: extraction.issueDate });
  if (extraction.docType === "language_test_report" && extraction.issueDate)
    updates.push({ ...base, path: "profile.languageProficiency.date", value: extraction.issueDate });
  if (extraction.documentLanguage)
    updates.push({ ...base, path: "profile.documentsLanguage", value: DOC_LANGUAGE[extraction.documentLanguage] ?? "other" });
  return updates;
}

/** Records a checked document (findings and extracted fields; never the file) and merges its facts. */
export function mergeDocument(account: Account, doc: CheckedDocument): Account {
  const key = (d: CheckedDocument) => `${d.docType}|${d.extraction.nameOnDocument ?? ""}|${d.extraction.issueDate ?? ""}`;
  const documents = [doc, ...account.documents.filter((d) => key(d) !== key(doc))];
  return applyUpdates({ ...account, documents }, documentUpdates(doc.extraction, doc.checkedAt));
}

/** The person changes a field on /profile (or on the intake chips). */
export function editField(account: Account, path: FieldPath, value: FieldValue, at: string): Account {
  return applyUpdate(account, { path, value, source: "edited", at });
}

/** The person picks one side of a conflict; it counts as their edit and the conflict goes away. */
export function resolveConflict(account: Account, conflictId: string, option: number, at: string): Account {
  const conflict = account.conflicts.find((c) => c.id === conflictId);
  const chosen = conflict?.options[option];
  if (!conflict || !chosen) return account;
  return editField(account, conflict.path, chosen.value, at);
}

/** Paths whose values differ between two profiles (for edits made through the intake chips). */
export function changedFacts(before: Profile, after: Profile): [FieldPath, FieldValue][] {
  const old = new Map(profileFacts(before));
  return profileFacts(after).filter(([path, value]) => old.get(path) !== value);
}
