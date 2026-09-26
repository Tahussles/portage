import { describe, expect, it } from "vitest";
import pathwayJson from "@/data/pathways/on-rn-ien.json";
import profilePriya from "@/data/fixtures/profile-priya.json";
import { docRules, nameTokens } from "./docRules";
import { buildPlan } from "./plan";
import { parsePathway } from "./schema";
import type { DocExtraction, Profile } from "./types";

const TODAY = "2026-09-26";
const priya = profilePriya as Profile;
const plan = buildPlan(priya, parsePathway(pathwayJson), TODAY); // parallel finish 2027-04-04

const doc = (over: Partial<DocExtraction>): DocExtraction => ({
  docType: "other",
  nameOnDocument: null,
  issueDate: null,
  documentLanguage: null,
  issuer: null,
  description: "test",
  ...over,
});
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe("docRules", () => {
  it("employment letter: must come from the employer, and flags a name mismatch", () => {
    const findings = docRules({
      extraction: doc({ docType: "employment_letter", nameOnDocument: "Priya Anand Deshpande", documentLanguage: "en" }),
      today: TODAY,
      plan,
      legalName: "Priya Deshpande",
    });
    expect(ids(findings)).toEqual(["must_come_from_employer", "name_mismatch", "language_ok"]);
    expect(findings[0].severity).toBe("critical");
    expect(findings[1].body.en).toContain('"Priya Anand Deshpande"');
  });

  it("police check issued now: too early for Priya's plan, and not from Sterling Backcheck", () => {
    const findings = docRules({
      extraction: doc({ docType: "criminal_record_check", issueDate: "2026-09-01", issuer: "Sample Police Records Office" }),
      today: TODAY,
      plan,
    });
    expect(ids(findings)).toEqual(["crc_provider", "crc_expires_early"]);
    expect(findings[1].body.en).toContain("expires in Mar 2027");
    expect(findings[1].body.en).toContain("around Apr 2027");
    expect(findings[1].body.fr).toContain("mars 2027");
  });

  it("police check: expired, and valid cases", () => {
    const expired = docRules({
      extraction: doc({ docType: "criminal_record_check", issueDate: "2026-01-10", issuer: "Sterling Backcheck" }),
      today: TODAY,
      plan,
    });
    expect(ids(expired)).toEqual(["crc_expired"]);
    const valid = docRules({
      extraction: doc({ docType: "criminal_record_check", issueDate: "2027-01-20", issuer: "Sterling Backcheck" }),
      today: "2027-01-25",
      plan,
    });
    expect(ids(valid)).toEqual(["crc_valid"]);
    expect(valid[0].severity).toBe("ok");
  });

  it("flags documents that need translation and old language tests", () => {
    expect(ids(docRules({ extraction: doc({ documentLanguage: "hi" }), today: TODAY }))).toEqual(["translation_needed"]);
    const oldTest = docRules({
      extraction: doc({ docType: "language_test_report", issueDate: "2024-03-01", documentLanguage: "en" }),
      today: TODAY,
    });
    expect(ids(oldTest)).toEqual(["language_test_old", "test_centre_sends_results", "language_ok"]);
  });

  it("routes education and licence documents to the right sender", () => {
    expect(ids(docRules({ extraction: doc({ docType: "diploma" }), today: TODAY }))).toEqual(["school_sends_to_eca"]);
    expect(ids(docRules({ extraction: doc({ docType: "nursing_licence" }), today: TODAY }))).toEqual([
      "must_come_from_regulator",
    ]);
  });

  it("compares names fairly and falls back to what the applicant said", () => {
    expect(nameTokens("PRIYA  Deshpandé")).toEqual(["priya", "deshpande"]);
    const same = docRules({
      extraction: doc({ nameOnDocument: "DESHPANDE, Priya" }),
      today: TODAY,
      legalName: "Priya Deshpande",
    });
    expect(ids(same)).toEqual(["name_matches"]);
    const said = docRules({
      extraction: doc({ nameOnDocument: "Priya D." }),
      today: TODAY,
      profile: { ...priya, nameOnDocumentsMatches: false },
    });
    expect(ids(said)).toEqual(["name_mismatch"]);
  });

  it("orders critical, warn, info, ok", () => {
    const findings = docRules({
      extraction: doc({ docType: "employment_letter", documentLanguage: "hi", nameOnDocument: "Ana Bell", issueDate: "2020-01" }),
      today: TODAY,
      legalName: "Ana Bell",
    });
    expect(findings.map((f) => f.severity)).toEqual(["critical", "warn", "ok"]);
  });
});
