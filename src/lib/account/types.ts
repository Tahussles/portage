import type { DocExtraction, DocFinding, DocType, Locale, Profile } from "@/lib/engine/types";

// The account lives only in this browser (localStorage "portage.account.v1"). It holds structured facts:
// profile fields, where each came from, edits, and document findings with their extracted fields.
// Never audio, transcripts, or document files (AGENTS.md rule 7, decision 18). Wraps Ebrahim's Profile
// type without changing it.

export type ProvenanceSource = "voice" | "document" | "edited" | "seed";

/** Where a field's current value came from. `label` is a document type for "document". */
export type Provenance = { source: ProvenanceSource; label?: string; at: string };

/** "displayName", "legalName", "preferredLanguage", "spokenLanguage", or "profile.<dotted path>". */
export type FieldPath = string;

export type FieldValue = string | number | boolean | null;

export type CheckedDocument = {
  id: string;
  docType: DocType;
  checkedAt: string;
  extraction: DocExtraction;
  findings: DocFinding[];
  /** One of the watermarked samples. */
  sample?: boolean;
};

export type ConflictOption = { value: FieldValue } & Provenance;

/** Two sources disagree about a field; the person picks one on /profile. */
export type Conflict = { id: string; path: FieldPath; options: ConflictOption[]; createdAt: string };

export type Account = {
  version: 1;
  id: string;
  /** Only for accounts created with "Continue with email"; never sent anywhere. */
  email?: string;
  displayName: string;
  legalName?: string;
  preferredLanguage: Locale;
  spokenLanguage: string | null;
  createdAt: string;
  profile: Profile;
  provenance: Record<FieldPath, Provenance>;
  documents: CheckedDocument[];
  conflicts: Conflict[];
};
