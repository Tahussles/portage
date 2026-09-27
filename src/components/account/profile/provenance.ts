import type { DocType, Locale } from "@/lib/engine/types";
import type { Provenance } from "@/lib/account/types";
import { htmlLang, type MessageKey, type MessageVars } from "@/lib/i18n";

type Translate = (key: MessageKey, vars?: MessageVars) => string;

/** The samples' short names ("Police check"); other documents use their type's name. */
export function docLabel(docType: DocType | string, t: Translate): string {
  if (docType === "employment_letter") return t("docs.sample.employment");
  if (docType === "criminal_record_check") return t("docs.sample.police");
  return t(`docs.type.${docType}` as MessageKey);
}

export function shortDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(htmlLang[locale], { month: "short", day: "numeric" }).format(new Date(iso));
}

/** "From your voice interview · Sep 26", "From: Police check · Sep 26", "Edited by you · Sep 27". */
export function provenanceText(p: Provenance, t: Translate, locale: Locale): string {
  const what =
    p.source === "voice"
      ? t("prov.voice")
      : p.source === "document"
        ? t("prov.document", { doc: docLabel(p.label ?? "other", t) })
        : p.source === "edited"
          ? t("prov.edited")
          : t("prov.seed");
  return `${what} · ${shortDate(p.at, locale)}`;
}
