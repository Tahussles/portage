import { describe, expect, it } from "vitest";
import { profileFixture } from "@/lib/demo";
import type { DocExtraction } from "@/lib/engine/types";
import { emptyProfile, getField } from "./fields";
import { applyUpdate, changedFacts, editField, mergeDocument, mergeVoice, resolveConflict } from "./merge";
import { createEmailAccount, initials, nameFromEmail, seedPriya } from "./seed";
import type { Account, CheckedDocument } from "./types";

const T0 = "2026-09-26T20:00:00.000Z";
const T1 = "2026-09-26T21:00:00.000Z";
const T2 = "2026-09-26T22:00:00.000Z";

const fresh = (): Account => createEmailAccount("test.person@example.com", "en", new Date(T0));

function doc(extraction: Partial<DocExtraction>, at = T1): CheckedDocument {
  const full: DocExtraction = {
    docType: "employment_letter",
    nameOnDocument: null,
    issueDate: null,
    documentLanguage: null,
    issuer: null,
    description: "",
    ...extraction,
  };
  return { id: `${full.docType}@${at}`, docType: full.docType, checkedAt: at, extraction: full, findings: [] };
}

describe("merge rules", () => {
  it("lets the voice interview fill empty fields, with provenance", () => {
    const a = mergeVoice(fresh(), profileFixture().profile, T1);
    expect(getField(a, "profile.countryOfEducation")).toBe("IN");
    expect(getField(a, "profile.lastPractisedAt")).toBe("2024-07");
    expect(getField(a, "spokenLanguage")).toBe("hi");
    expect(a.provenance["profile.countryOfEducation"]).toEqual({ source: "voice", label: "voice", at: T1 });
  });

  it("never lets an empty value erase a fact", () => {
    const a = mergeVoice(mergeVoice(fresh(), profileFixture().profile, T1), emptyProfile(), T2);
    expect(getField(a, "profile.graduationYear")).toBe(2014);
  });

  it("lets a newer interview update its own earlier answers", () => {
    const a = applyUpdate(mergeVoice(fresh(), profileFixture().profile, T1), { path: "profile.yearsExperience", value: 9, source: "voice", at: T2 });
    expect(getField(a, "profile.yearsExperience")).toBe(9);
  });

  it("always keeps what the person edited", () => {
    let a = editField(mergeVoice(fresh(), profileFixture().profile, T1), "profile.lastPractisedAt", "2024-09", T2);
    a = applyUpdate(a, { path: "profile.lastPractisedAt", value: "2024-07", source: "voice", at: T2 });
    a = applyUpdate(a, { path: "legalName", value: "X", source: "edited", at: T2 });
    a = mergeDocument(a, doc({ nameOnDocument: "Someone Else" }));
    expect(getField(a, "profile.lastPractisedAt")).toBe("2024-09");
    expect(getField(a, "legalName")).toBe("X");
    expect(a.provenance.legalName.source).toBe("edited");
    expect(a.conflicts).toEqual([]);
  });

  it("lets a document beat the voice interview for names, and records the disagreement", () => {
    let a = applyUpdate(fresh(), { path: "legalName", value: "Priya Deshpande", source: "voice", label: "voice", at: T1 });
    a = mergeDocument(a, doc({ nameOnDocument: "Priya Anand Deshpande" }, T2));
    expect(getField(a, "legalName")).toBe("Priya Anand Deshpande");
    expect(a.provenance.legalName).toEqual({ source: "document", label: "employment_letter", at: T2 });
    expect(a.conflicts).toHaveLength(1);
    expect(a.conflicts[0].options.map((o) => [o.value, o.source])).toEqual([
      ["Priya Anand Deshpande", "document"],
      ["Priya Deshpande", "voice"],
    ]);
  });

  it("lets a document beat the voice interview for dates, with a conflict", () => {
    let a = applyUpdate(fresh(), { path: "profile.progress.criminalRecordCheckDate", value: "2026-08-01", source: "voice", at: T1 });
    a = mergeDocument(a, doc({ docType: "criminal_record_check", issueDate: "2026-09-01" }));
    expect(getField(a, "profile.progress.criminalRecordCheckDate")).toBe("2026-09-01");
    expect(a.conflicts.map((c) => c.path)).toEqual(["profile.progress.criminalRecordCheckDate"]);
  });

  it("makes a matching document the recorded source without a conflict", () => {
    let a = applyUpdate(fresh(), { path: "legalName", value: "Priya Deshpande", source: "voice", at: T1 });
    a = mergeDocument(a, doc({ docType: "criminal_record_check", nameOnDocument: "priya deshpande" }));
    expect(a.provenance.legalName.source).toBe("document");
    expect(a.conflicts).toEqual([]);
  });

  it("does not let a document overwrite other kinds of facts, only fill them", () => {
    const withVoice = mergeVoice(fresh(), profileFixture().profile, T1); // documentsLanguage: "mixed"
    expect(getField(mergeDocument(withVoice, doc({ documentLanguage: "en" })), "profile.documentsLanguage")).toBe("mixed");
    expect(getField(mergeDocument(fresh(), doc({ documentLanguage: "hi" })), "profile.documentsLanguage")).toBe("other");
  });

  it("does not let the voice interview overwrite a document's value", () => {
    let a = mergeDocument(fresh(), doc({ docType: "criminal_record_check", issueDate: "2026-09-01" }));
    a = applyUpdate(a, { path: "profile.progress.criminalRecordCheckDate", value: "2025-01-01", source: "voice", at: T2 });
    expect(getField(a, "profile.progress.criminalRecordCheckDate")).toBe("2026-09-01");
  });

  it("settles a conflict with the person's choice, as their edit", () => {
    const a = seedPriya(new Date(T0));
    const settled = resolveConflict(a, a.conflicts[0].id, 1, T2);
    expect(getField(settled, "legalName")).toBe("Priya Deshpande");
    expect(settled.provenance.legalName).toEqual({ source: "edited", at: T2 });
    expect(settled.conflicts).toEqual([]);
  });

  it("keeps one entry per checked document and stores findings, never files or transcripts", () => {
    let a = mergeDocument(fresh(), doc({ nameOnDocument: "A B" }));
    a = mergeDocument(a, doc({ nameOnDocument: "A B" }, T2));
    expect(a.documents).toHaveLength(1);
    const keys = new Set<string>();
    const walk = (v: unknown) => {
      if (!v || typeof v !== "object") return;
      for (const [k, x] of Object.entries(v)) {
        keys.add(k);
        walk(x);
      }
    };
    walk(seedPriya(new Date(T0)));
    for (const banned of ["transcript", "audio", "file", "blob", "dataUrl", "englishTranslation"]) expect(keys.has(banned)).toBe(false);
  });

  it("lists the facts that changed between two profiles", () => {
    const before = profileFixture().profile;
    const after = { ...before, yearsExperience: 9, progress: { ...before.progress, ecaStarted: true } };
    expect(changedFacts(before, after)).toEqual([
      ["profile.yearsExperience", 9],
      ["profile.progress.ecaStarted", true],
    ]);
  });
});

describe("the seeded Priya account", () => {
  const priya = seedPriya(new Date(T0));

  it("carries her voice interview, two checked samples and the legal-name conflict", () => {
    expect(priya.displayName).toBe("Priya");
    expect(priya.legalName).toBe("Priya Anand Deshpande");
    expect(priya.spokenLanguage).toBe("hi");
    expect(priya.provenance["profile.countryOfEducation"].source).toBe("voice");
    expect(priya.provenance.legalName).toMatchObject({ source: "document", label: "employment_letter" });
    expect(priya.documents.map((d) => d.docType)).toEqual(["employment_letter", "criminal_record_check"]);
    expect(priya.documents.every((d) => d.findings.length > 0)).toBe(true);
    expect(getField(priya, "profile.progress.criminalRecordCheckDate")).toBe("2026-09-01");
    expect(priya.provenance["profile.progress.criminalRecordCheckDate"]).toMatchObject({ source: "document", label: "criminal_record_check" });
    expect(priya.conflicts).toHaveLength(1);
    expect(priya.conflicts[0]).toMatchObject({ path: "legalName" });
    expect(priya.conflicts[0].options.map((o) => [o.value, o.source, o.label])).toEqual([
      ["Priya Anand Deshpande", "document", "employment_letter"],
      ["Priya Deshpande", "voice", "voice"],
    ]);
  });

  it("names email accounts from the address, with initials for the avatar", () => {
    expect(nameFromEmail("taha.hussain@example.com")).toBe("Taha Hussain");
    expect(initials("Taha Hussain")).toBe("TH");
    expect(initials("Priya")).toBe("P");
    expect(fresh().profile).toEqual(emptyProfile());
  });
});
