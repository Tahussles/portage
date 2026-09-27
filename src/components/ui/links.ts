import { useCallback } from "react";
import { useAppStore } from "@/lib/store";

/** Adds `demo=1` (and `from=pitch`) to an internal href when those modes are on, keeping any query and hash. */
export function withDemo(href: string, demo: boolean, fromPitch = false): string {
  if ((!demo && !fromPitch) || !href.startsWith("/") || href.startsWith("/pitch")) return href;
  const url = new URL(href, "http://portage.local");
  if (demo) url.searchParams.set("demo", "1");
  if (fromPitch) url.searchParams.set("from", "pitch");
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Hook form: every internal link and router.push goes through this. */
export function useHref() {
  const demo = useAppStore((s) => s.demo);
  const fromPitch = useAppStore((s) => s.fromPitch);
  return useCallback((href: string) => withDemo(href, demo, fromPitch), [demo, fromPitch]);
}

export type Screen = "start" | "roadmap" | "documents" | "insights";

/** The five-screen walk: landing, then start, roadmap, documents, insights, and back to the landing. */
export const SCREENS: { id: Screen; href: string }[] = [
  { id: "start", href: "/start" },
  { id: "roadmap", href: "/roadmap" },
  { id: "documents", href: "/documents" },
  { id: "insights", href: "/insights" },
];

export function nextScreen(current: Screen): { id: Screen | "home"; href: string } {
  const i = SCREENS.findIndex((s) => s.id === current);
  return SCREENS[i + 1] ?? { id: "home", href: "/" };
}

export function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
