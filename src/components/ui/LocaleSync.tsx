"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { htmlLang, isLocale, useT } from "@/lib/i18n";
import { initialLocale, navigatorLanguage, PENDING_ATTR } from "@/lib/i18n/boot";
import { useAppStore } from "@/lib/store";

/**
 * Reads URL switches on every navigation: `?lang=fr`, `?demo=1` (kept on internal links),
 * `?from=pitch` (kept on internal links; the nav shows "Back to pitch"), and `?reset=1` (clears the
 * profile and those modes, then returns to the landing). On the first load without `?lang=`, a French
 * browser starts in French. Keeps `<html lang>`, the title and the description in the selected language
 * (the /pitch deck is English only).
 */
export function LocaleSync() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const setDemo = useAppStore((s) => s.setDemo);
  const setFromPitch = useAppStore((s) => s.setFromPitch);
  const reset = useAppStore((s) => s.reset);
  const t = useT();
  const firstLoad = useRef(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    if (firstLoad.current) {
      firstLoad.current = false;
      const next = initialLocale(window.location.search, navigatorLanguage());
      setLocale(next);
      const root = document.documentElement;
      if (root.getAttribute(PENDING_ATTR) !== next) root.removeAttribute(PENDING_ATTR);
    } else if (isLocale(lang)) setLocale(lang);
    if (params.get("reset") === "1") {
      reset();
      router.replace(isLocale(lang) && lang !== "en" ? `/?lang=${lang}` : "/");
      return;
    }
    if (params.get("demo") === "1") setDemo(true);
    if (params.get("from") === "pitch") setFromPitch(true);
    // Re-read on every navigation: client-side links (e.g. from the pitch deck) can add these switches.
  }, [pathname, setLocale, setDemo, setFromPitch, reset, router]);

  // Before paint: the French render is committed by now, so the boot script's hidden body can show.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (pathname.startsWith("/pitch")) {
      root.lang = htmlLang.en;
      root.removeAttribute(PENDING_ATTR);
      return;
    }
    root.lang = htmlLang[locale];
    if (root.getAttribute(PENDING_ATTR) === locale) root.removeAttribute(PENDING_ATTR);
  }, [locale, pathname]);

  // React hoists these into <head>. The deck sets its own English title.
  if (pathname.startsWith("/pitch")) return null;
  return (
    <>
      <title>{t("meta.title")}</title>
      <meta name="description" content={t("meta.description")} />
    </>
  );
}
