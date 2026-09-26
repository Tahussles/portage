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

export type MessageVars = Record<string, string | number>;

/** Looks up a key and fills `{name}` placeholders from `vars`. */
export function translate(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  const text: string = dictionaries[locale][key] ?? en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function useT() {
  const locale = useAppStore((s) => s.locale);
  return useCallback(
    (key: MessageKey, vars?: MessageVars) => translate(locale, key, vars),
    [locale],
  );
}
