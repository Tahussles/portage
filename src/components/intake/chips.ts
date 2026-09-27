import type { Locale, Profile } from "@/lib/engine/types";
import { htmlLang, type MessageKey, type MessageVars } from "@/lib/i18n";

type Translate = (key: MessageKey, vars?: MessageVars) => string;

/** Below this the chip gets a dashed outline and "Check". */
export const LOW_CONFIDENCE = 0.7;

export const CHIP_FIELDS = [
  "countryOfEducation",
  "credential",
  "graduationYear",
  "yearsExperience",
  "lastPractisedAt",
  "authorizedToWork",
  "languageProficiency.status",
  "currentlyInCanada",
  "documentsLanguage",
] as const;

export type ChipField = (typeof CHIP_FIELDS)[number];

export type ChipEditor =
  | { kind: "select"; options: { value: string; label: string }[] }
  | { kind: "month" }
  | { kind: "number"; min: number; max: number };

export type Chip = {
  field: ChipField;
  label: string;
  /** Display value in the viewer's locale. */
  value: string;
  /** Current value as the editor sees it ("" when not said). */
  raw: string;
  missing: boolean;
  lowConfidence: boolean;
  editor: ChipEditor;
};

/** Common countries of education for internationally educated nurses in Ontario, plus any value already set. */
const COUNTRIES = ["IN", "PH", "NG", "PK", "IR", "JM", "KE", "NP", "CN", "LK", "GH", "ZW", "GB", "US"];

function regionName(code: string, locale: Locale) {
  try {
    return new Intl.DisplayNames([htmlLang[locale]], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function monthLabel(ym: string, locale: Locale) {
  return new Intl.DateTimeFormat(htmlLang[locale], { month: "short", year: "numeric", timeZone: "UTC" }).format(
    Date.parse(`${ym.slice(0, 7)}-01T00:00:00Z`),
  );
}

function rawValue(profile: Profile, field: ChipField): string {
  const value = field === "languageProficiency.status" ? profile.languageProficiency.status : profile[field];
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (field === "lastPractisedAt") return String(value).slice(0, 7);
  return String(value);
}

function editorFor(field: ChipField, raw: string, t: Translate, locale: Locale): ChipEditor {
  const yesNo = [
    { value: "yes", label: t("answer.yes") },
    { value: "no", label: t("answer.no") },
  ];
  switch (field) {
    case "countryOfEducation": {
      const codes = raw && !COUNTRIES.includes(raw) ? [raw, ...COUNTRIES] : COUNTRIES;
      return { kind: "select", options: codes.map((c) => ({ value: c, label: regionName(c, locale) })) };
    }
    case "credential":
      return {
        kind: "select",
        options: (["bachelor", "diploma", "other"] as const).map((v) => ({ value: v, label: t(`credential.${v}`) })),
      };
    case "graduationYear":
      return { kind: "number", min: 1970, max: new Date().getUTCFullYear() };
    case "yearsExperience":
      return { kind: "number", min: 0, max: 50 };
    case "lastPractisedAt":
      return { kind: "month" };
    case "authorizedToWork":
      return { kind: "select", options: [...yesNo, { value: "unsure", label: t("answer.unsure") }] };
    case "languageProficiency.status":
      return {
        kind: "select",
        options: (["none", "booked", "passed", "via_education_or_work"] as const).map((v) => ({
          value: v,
          label: t(`langTest.${v}`),
        })),
      };
    case "currentlyInCanada":
      return { kind: "select", options: yesNo };
    case "documentsLanguage":
      return {
        kind: "select",
        options: (["en", "fr", "other", "mixed"] as const).map((v) => ({ value: v, label: t(`docsLang.${v}`) })),
      };
  }
}

function displayValue(field: ChipField, raw: string, t: Translate, locale: Locale): string {
  if (!raw) return t("chip.notSaid");
  switch (field) {
    case "countryOfEducation":
      return regionName(raw, locale);
    case "credential":
      return t(`credential.${raw as "bachelor" | "diploma" | "other"}`);
    case "graduationYear":
      return raw;
    case "yearsExperience":
      return t("chip.years", { n: raw });
    case "lastPractisedAt":
      return monthLabel(raw, locale);
    case "authorizedToWork":
    case "currentlyInCanada":
      return t(`answer.${raw as "yes" | "no" | "unsure"}`);
    case "languageProficiency.status":
      return t(`langTest.${raw as "none" | "booked" | "passed" | "via_education_or_work"}`);
    case "documentsLanguage":
      return t(`docsLang.${raw as "en" | "fr" | "other" | "mixed"}`);
  }
}

export function profileChips(profile: Profile, t: Translate, locale: Locale): Chip[] {
  return CHIP_FIELDS.map((field) => {
    const raw = rawValue(profile, field);
    const confidence = profile.confidence[field];
    return {
      field,
      label: t(`chip.${field}`),
      value: displayValue(field, raw, t, locale),
      raw,
      missing: raw === "",
      lowConfidence: raw !== "" && confidence !== undefined && confidence < LOW_CONFIDENCE,
      editor: editorFor(field, raw, t, locale),
    };
  });
}

/** Applies an inline edit. A value the person set or confirmed is certain: confidence becomes 1. */
export function applyChipEdit(profile: Profile, field: ChipField, raw: string): Profile {
  const confidence = { ...profile.confidence, [field]: 1 };
  const empty = raw.trim() === "";
  switch (field) {
    case "graduationYear":
    case "yearsExperience": {
      const n = Number(raw);
      return { ...profile, [field]: empty || Number.isNaN(n) ? null : n, confidence };
    }
    case "currentlyInCanada":
      return { ...profile, currentlyInCanada: empty ? null : raw === "yes", confidence };
    case "languageProficiency.status":
      return {
        ...profile,
        languageProficiency: {
          ...profile.languageProficiency,
          status: empty ? null : (raw as Profile["languageProficiency"]["status"]),
        },
        confidence,
      };
    default:
      return { ...profile, [field]: empty ? null : raw, confidence };
  }
}
