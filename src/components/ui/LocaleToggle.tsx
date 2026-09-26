"use client";

import { cn } from "@/lib/cn";
import { locales, useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import type { Locale } from "@/lib/engine/types";

export function LocaleToggle() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  const choose = (next: Locale) => {
    setLocale(next);
    const url = new URL(window.location.href);
    if (next === "en") url.searchParams.delete("lang");
    else url.searchParams.set("lang", next);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className="flex items-center rounded-full border border-slate-line p-0.5 text-xs font-medium"
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l === "en" ? "en-CA" : "fr-CA"}
          aria-pressed={locale === l}
          aria-label={t(l === "en" ? "nav.switchToEn" : "nav.switchToFr")}
          onClick={() => choose(l)}
          className={cn(
            "rounded-full px-2.5 py-1 tracking-[0.12em] uppercase transition-colors",
            locale === l ? "bg-paper text-ink" : "text-mist hover:text-paper",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
