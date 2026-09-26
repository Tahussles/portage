import { useCallback } from "react";
import { useAppStore } from "@/lib/store";

/** Adds `demo=1` to an internal href when demo mode is on, keeping any query and hash. */
export function withDemo(href: string, demo: boolean): string {
  if (!demo || !href.startsWith("/")) return href;
  const url = new URL(href, "http://portage.local");
  url.searchParams.set("demo", "1");
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Hook form: every internal link and router.push goes through this. */
export function useHref() {
  const demo = useAppStore((s) => s.demo);
  return useCallback((href: string) => withDemo(href, demo), [demo]);
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
