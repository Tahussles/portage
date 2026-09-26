"use client";

import { useReactFlow } from "@xyflow/react";
import { Maximize, Minus, Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

type ZoomControlsProps = {
  onFit: () => void;
};

export function ZoomControls({ onFit }: ZoomControlsProps) {
  const t = useT();
  const { zoomIn, zoomOut } = useReactFlow();
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buttons = [
    { label: t("roadmap.zoomIn"), icon: Plus, onClick: () => zoomIn({ duration: reduced() ? 0 : 200 }) },
    { label: t("roadmap.zoomOut"), icon: Minus, onClick: () => zoomOut({ duration: reduced() ? 0 : 200 }) },
    { label: t("roadmap.fit"), icon: Maximize, onClick: onFit },
  ];
  return (
    <div className="absolute right-4 bottom-4 z-10 flex flex-col overflow-hidden rounded-[var(--radius)] border border-slate-line bg-granite">
      {buttons.map(({ label, icon: Icon, onClick }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          title={label}
          onClick={onClick}
          className="grid size-9 place-items-center text-mist transition-colors not-last:border-b not-last:border-slate-line hover:text-paper"
        >
          <Icon aria-hidden="true" className="size-4" />
        </button>
      ))}
    </div>
  );
}
