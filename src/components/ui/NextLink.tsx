"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { AppLink } from "./AppLink";
import { nextScreen, type Screen } from "./links";

type NextLinkProps = { from: Screen; tone?: "dark" | "light"; className?: string };

/** Subtle "Next: <screen>" at the natural end of each screen, so the walk-through never dead-ends. */
export function NextLink({ from, tone = "dark", className }: NextLinkProps) {
  const t = useT();
  const next = nextScreen(from);
  const label = next.id === "home" ? t("next.home") : t("next.label", { screen: t(next.id === "start" ? "nav.start.label" : `nav.${next.id}`) });
  return (
    <AppLink
      href={next.href}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline",
        tone === "dark" ? "text-mist hover:text-paper" : "text-quiet hover:text-ink",
        className,
      )}
    >
      {label}
      <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
    </AppLink>
  );
}
