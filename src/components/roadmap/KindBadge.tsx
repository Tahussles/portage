"use client";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

type KindBadgeProps = {
  kind: "official" | "estimate" | "unknown";
  className?: string;
};

/** Official vs estimate is a designed element: trust is visible (DESIGN principle 4). */
export function KindBadge({ kind, className }: KindBadgeProps) {
  const t = useT();
  const label =
    kind === "official" ? t("badge.official") : kind === "estimate" ? t("badge.estimate") : t("badge.unverified");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap",
        kind === "official" ? "bg-paper text-ink" : "border border-mist/60 text-mist",
        kind === "unknown" && "border-dashed",
        className,
      )}
    >
      {label}
    </span>
  );
}
