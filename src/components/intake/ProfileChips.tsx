"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/engine/types";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { applyChipEdit, profileChips, type Chip } from "./chips";

gsap.registerPlugin(useGSAP);

type ProfileChipsProps = {
  profile: Profile;
  onChange: (profile: Profile) => void;
};

function ChipEditorControl({ chip, onDone }: { chip: Chip; onDone: (raw: string | null) => void }) {
  const t = useT();
  const common = {
    autoFocus: true,
    "aria-label": t("chip.edit", { label: chip.label }),
    defaultValue: chip.raw,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onDone(null);
      if (e.key === "Enter") onDone((e.target as HTMLInputElement).value);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => onDone(e.target.value),
    className: "bg-transparent text-sm text-paper outline-none",
  };
  if (chip.editor.kind === "select") {
    return (
      <select {...common} onChange={(e) => onDone(e.target.value)}>
        {chip.missing && <option value="">{t("chip.notSaid")}</option>}
        {chip.editor.options.map((o) => (
          <option key={o.value} value={o.value} className="bg-granite">
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (chip.editor.kind === "month") return <input type="month" {...common} className={cn(common.className, "[color-scheme:dark]")} />;
  return <input type="number" inputMode="numeric" min={chip.editor.min} max={chip.editor.max} {...common} className={cn(common.className, "w-20")} />;
}

/** Extracted facts as chips; tap one to correct it. Low-confidence facts ask to be checked. */
export function ProfileChips({ profile, onChange }: ProfileChipsProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const scope = useRef<HTMLUListElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const chips = profileChips(profile, t, locale);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-chip]", { opacity: 0, y: 10, duration: 0.4, stagger: 0.06, ease: "power2.out" });
      });
    },
    { scope },
  );

  return (
    <ul ref={scope} className="flex flex-wrap justify-center gap-2">
      {chips.map((chip) => {
        const needsCheck = chip.lowConfidence || chip.missing;
        return (
          <li
            key={chip.field}
            data-chip
            className={cn(
              "flex items-center gap-2 rounded-full bg-granite px-3.5 py-1.5 text-sm",
              needsCheck ? "border border-dashed border-mist/70" : "border border-transparent",
            )}
          >
            <span className="text-mist">{chip.label}</span>
            {editing === chip.field ? (
              <ChipEditorControl
                chip={chip}
                onDone={(raw) => {
                  setEditing(null);
                  if (raw !== null && raw !== chip.raw) onChange(applyChipEdit(profile, chip.field, raw));
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(chip.field)}
                aria-label={t("chip.edit", { label: `${chip.label}: ${chip.value}` })}
                className={cn("font-medium underline-offset-4 hover:underline", chip.missing ? "text-mist" : "text-paper")}
              >
                {chip.value}
              </button>
            )}
            {chip.lowConfidence && editing !== chip.field && (
              <span className="micro-label text-mist">{t("chip.check")}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
