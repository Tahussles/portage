"use client";

import { ViewportPortal } from "@xyflow/react";
import { useT } from "@/lib/i18n";

type SideLaneLabelProps = {
  y: number;
  width: number;
};

/** Label and rule above the "While you wait" lane (Temporary Class, bridge roles, support). */
export function SideLaneLabel({ y, width }: SideLaneLabelProps) {
  const t = useT();
  return (
    <ViewportPortal>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0"
        style={{ transform: `translate(0px, ${y - 40}px)`, width }}
      >
        <span className="micro-label block text-mist">{t("roadmap.whileYouWait")}</span>
        <span className="mt-2 block border-t border-dashed border-slate-line" />
      </div>
    </ViewportPortal>
  );
}
