"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { htmlLang, isLocale } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/**
 * Reads URL switches once on load: `?lang=fr`, `?demo=1` (kept on internal links), and
 * `?from=pitch` (kept on internal links; the nav shows "Back to pitch"), and `?reset=1` (clears the
 * profile and those modes, then returns to the landing). Keeps
 * `<html lang>` in step with the locale.
 */
export function LocaleSync() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const setDemo = useAppStore((s) => s.setDemo);
  const setFromPitch = useAppStore((s) => s.setFromPitch);
  const reset = useAppStore((s) => s.reset);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    if (isLocale(lang)) setLocale(lang);
    if (params.get("reset") === "1") {
      reset();
      router.replace(isLocale(lang) && lang !== "en" ? `/?lang=${lang}` : "/");
      return;
    }
    if (params.get("demo") === "1") setDemo(true);
    if (params.get("from") === "pitch") setFromPitch(true);
    // Re-read on every navigation: client-side links (e.g. from the pitch deck) can add these switches.
  }, [pathname, setLocale, setDemo, setFromPitch, reset, router]);

  useEffect(() => {
    document.documentElement.lang = htmlLang[locale];
  }, [locale]);

  return null;
}
