import { useCallback } from "react";
import type { Locale } from "@/lib/engine/types";
import { useAppStore } from "@/lib/store";
import en from "./en.json";
import fr from "./fr.json";

export type MessageKey = keyof typeof en;

// `satisfies` makes the build fail if fr.json is missing a key that en.json has.
const dictionaries = { en, fr } satisfies Record<Locale, Record<MessageKey, string>>;

export const locales: Locale[] = ["en", "fr"];

export const htmlLang: Record<Locale, string> = { en: "en-CA", fr: "fr-CA" };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}

export function translate(locale: Locale, key: MessageKey): string {
  return dictionaries[locale][key] ?? en[key] ?? key;
}

export function useT() {
  const locale = useAppStore((s) => s.locale);
  return useCallback((key: MessageKey) => translate(locale, key), [locale]);
}
