"use client";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import type { LayoutMode } from "./layout";

type LayoutToggleProps = {
  mode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
};

const OPTIONS = [
  { mode: "sequential", label: "roadmap.oneAtATime" },
  { mode: "parallel", label: "roadmap.portagePlan" },
] as const;

export function LayoutToggle({ mode, onChange }: LayoutToggleProps) {
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("roadmap.toggle")}
      className="flex w-full rounded-full border border-slate-line bg-granite/80 p-1 text-xs font-medium sm:inline-flex sm:w-auto sm:text-sm"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.mode}
          type="button"
          aria-pressed={mode === o.mode}
          onClick={() => onChange(o.mode)}
          className={cn(
            "flex-1 rounded-full px-3 py-1.5 leading-tight transition-colors sm:flex-none sm:px-4 sm:whitespace-nowrap",
            mode === o.mode ? "bg-paper text-ink" : "text-mist hover:text-paper",
          )}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}
