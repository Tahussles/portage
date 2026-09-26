"use client";

import { useEffect } from "react";
import { htmlLang, isLocale } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/** Reads `?lang=fr` once on load and keeps `<html lang>` in step with the locale. */
export function LocaleSync() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(lang)) setLocale(lang);
  }, [setLocale]);

  useEffect(() => {
    document.documentElement.lang = htmlLang[locale];
  }, [locale]);

  return null;
}
