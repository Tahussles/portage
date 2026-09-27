import type { Locale } from "@/lib/engine/types";

// One language at a time (decision 16). The server always renders English; a French visit switches after
// hydration. To keep English from flashing first, this script runs in <head> before the body paints and,
// when the page will turn French, hides the body until LocaleSync has rendered French (3 s fallback).

export const PENDING_ATTR = "data-locale-pending";

/** First-visit locale for a browser language: anything starting with "fr" is French, else English. */
export function browserLocale(language: string | undefined | null): Locale {
  return language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/** `?lang=` wins; otherwise the browser's first language decides. */
export function initialLocale(search: string, language: string | undefined | null): Locale {
  const lang = new URLSearchParams(search).get("lang");
  return lang === "en" || lang === "fr" ? lang : browserLocale(language);
}

export function navigatorLanguage(): string | undefined {
  return typeof navigator === "undefined" ? undefined : (navigator.languages?.[0] ?? navigator.language);
}

/** Same rules as `initialLocale`, as plain ES5 for the inline <head> script. /pitch is English only. */
export const LOCALE_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;if(location.pathname.indexOf("/pitch")===0)return;var q=new URLSearchParams(location.search).get("lang");var n=((navigator.languages&&navigator.languages[0])||navigator.language||"").toLowerCase();var l=q==="en"||q==="fr"?q:n.indexOf("fr")===0?"fr":"en";if(l!=="fr")return;d.lang="fr-CA";d.setAttribute("${PENDING_ATTR}","fr");setTimeout(function(){d.removeAttribute("${PENDING_ATTR}")},3000)}catch(e){}})();`;
