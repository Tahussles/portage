import { describe, expect, it } from "vitest";
import sample from "@/data/fixtures/profile-priya.provisional.json";
import type { Profile } from "@/lib/engine/types";
import { translate, type MessageKey, type MessageVars } from "@/lib/i18n";
import { applyChipEdit, profileChips } from "./chips";

const profile = sample.profile as Profile;
const en = (key: MessageKey, vars?: MessageVars) => translate("en", key, vars);
const fr = (key: MessageKey, vars?: MessageVars) => translate("fr", key, vars);
const chip = (p: Profile, field: string, t = en, locale: "en" | "fr" = "en") =>
  profileChips(p, t, locale).find((c) => c.field === field)!;

describe("profile chips", () => {
  it("formats values in the viewer's locale", () => {
    expect(chip(profile, "countryOfEducation").value).toBe("India");
    expect(chip(profile, "countryOfEducation", fr, "fr").value).toBe("Inde");
    expect(chip(profile, "lastPractisedAt").value).toBe("Jul 2024");
    expect(chip(profile, "yearsExperience").value).toBe("8 years");
    expect(chip(profile, "authorizedToWork", fr, "fr").value).toBe("Oui");
    expect(chip(profile, "languageProficiency.status").value).toBe("Not taken yet");
  });

  it("asks to check low-confidence facts", () => {
    expect(chip(profile, "lastPractisedAt").lowConfidence).toBe(true); // "summer of 2024" = 0.6
    expect(chip(profile, "graduationYear").lowConfidence).toBe(false);
  });

  it("marks facts that were not said", () => {
    const docs = chip(profile, "documentsLanguage");
    expect(docs.missing).toBe(true);
    expect(docs.value).toBe("Not said");
    expect(docs.lowConfidence).toBe(false);
  });

  it("picks an editor per field", () => {
    expect(chip(profile, "lastPractisedAt").editor.kind).toBe("month");
    expect(chip(profile, "graduationYear").editor.kind).toBe("number");
    expect(chip(profile, "credential").editor).toMatchObject({ kind: "select" });
  });
});

describe("chip edits", () => {
  it("sets the value and marks it certain", () => {
    const edited = applyChipEdit(profile, "lastPractisedAt", "2024-03");
    expect(edited.lastPractisedAt).toBe("2024-03");
    expect(edited.confidence.lastPractisedAt).toBe(1);
    expect(profile.lastPractisedAt).toBe("2024-07"); // not mutated
  });

  it("parses numbers, booleans and nested fields", () => {
    expect(applyChipEdit(profile, "yearsExperience", "10").yearsExperience).toBe(10);
    expect(applyChipEdit(profile, "currentlyInCanada", "no").currentlyInCanada).toBe(false);
    expect(applyChipEdit(profile, "languageProficiency.status", "passed").languageProficiency.status).toBe("passed");
    expect(applyChipEdit(profile, "graduationYear", "").graduationYear).toBeNull();
  });
});
