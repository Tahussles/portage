"use client";

import { useT } from "@/lib/i18n";
import { htmlLang } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/** Languages we hint for most often; "auto" lets the transcription service detect it. */
export const HINT_LANGUAGES = ["hi", "tl", "ar", "pa", "ur", "es", "fr", "en"] as const;

type LanguageHintSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

function languageLabel(code: string, locale: string) {
  try {
    const own = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
    const ui = new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
    return own.toLocaleLowerCase(code) === ui.toLocaleLowerCase(locale) ? ui : `${own} · ${ui}`;
  } catch {
    return code;
  }
}

export function LanguageHintSelect({ value, onChange }: LanguageHintSelectProps) {
  const t = useT();
  const locale = htmlLang[useAppStore((s) => s.locale)];
  return (
    <label className="flex items-center gap-2 text-xs text-mist">
      <span className="micro-label">{t("intake.hint")}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-slate-line bg-granite px-3 py-1.5 text-xs text-paper"
      >
        <option value="auto">{t("intake.hint.auto")}</option>
        {HINT_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {languageLabel(code, locale)}
          </option>
        ))}
      </select>
    </label>
  );
}
