"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { FieldValue, Provenance } from "@/lib/account/types";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { provenanceText } from "./provenance";

gsap.registerPlugin(useGSAP);

export type Control =
  | { kind: "text" }
  | { kind: "number"; min: number; max: number }
  | { kind: "month" }
  | { kind: "date" }
  | { kind: "select"; options: { value: string; label: string }[] }
  | { kind: "yesno" }
  | { kind: "check" };

type FieldRowProps = {
  label: string;
  value: FieldValue;
  control: Control;
  provenance?: Provenance;
  onCommit: (value: FieldValue) => void;
  /** Changes each time this field is saved, to play the highlight. */
  flash?: number;
};

const INPUT = "h-9 w-full rounded-[var(--radius)] border border-slate-line bg-ink px-2.5 text-sm text-paper focus:border-mist focus:outline-none";

/** Keeps a draft while typing; saves on blur or Enter (text, number, month, date). */
function DraftInput({ value, control, label, onCommit }: { value: FieldValue; control: Control; label: string; onCommit: (v: FieldValue) => void }) {
  const shown = value === null || value === undefined ? "" : String(control.kind === "month" ? String(value).slice(0, 7) : value);
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const raw = draft.trim();
    setDraft(null);
    const next = raw === "" ? null : control.kind === "number" ? Number(raw) : raw;
    if (next !== value && !(typeof next === "number" && Number.isNaN(next))) onCommit(next);
  };
  return (
    <input
      aria-label={label}
      type={control.kind === "number" ? "number" : control.kind}
      {...(control.kind === "number" ? { min: control.min, max: control.max, inputMode: "numeric" as const } : {})}
      value={draft ?? shown}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(null);
      }}
      className={INPUT}
    />
  );
}

/** One editable fact: its label, the right control, and where its value came from. */
export function FieldRow({ label, value, control, provenance, onCommit, flash }: FieldRowProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const row = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!flash) return;
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(row.current, { backgroundColor: "rgba(213, 43, 30, 0.16)" }, { backgroundColor: "rgba(213, 43, 30, 0)", duration: 1.2, ease: "power1.out" });
      });
    },
    { dependencies: [flash] },
  );

  let control_: React.ReactNode;
  switch (control.kind) {
    case "select":
      control_ = (
        <select aria-label={label} value={value === null ? "" : String(value)} onChange={(e) => onCommit(e.target.value || null)} className={INPUT}>
          <option value="">{t("chip.notSaid")}</option>
          {control.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "yesno":
      control_ = (
        <div role="group" aria-label={label} className="flex rounded-full border border-slate-line p-0.5 text-xs">
          {([true, false] as const).map((v) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={value === v}
              onClick={() => onCommit(value === v ? null : v)}
              className={cn("flex-1 rounded-full px-3 py-1.5 transition-colors", value === v ? "bg-paper text-ink" : "text-mist hover:text-paper")}
            >
              {t(v ? "answer.yes" : "answer.no")}
            </button>
          ))}
        </div>
      );
      break;
    case "check":
      control_ = (
        <input
          type="checkbox"
          aria-label={label}
          checked={value === true}
          onChange={(e) => onCommit(e.target.checked)}
          className="size-5 accent-[#D52B1E]"
        />
      );
      break;
    default:
      control_ = <DraftInput value={value} control={control} label={label} onCommit={onCommit} />;
  }

  return (
    <div ref={row} className="-mx-2 flex flex-col gap-1.5 rounded-md px-2 py-2.5">
      <div className={cn("flex gap-3", control.kind === "check" ? "items-center justify-between" : "flex-col sm:flex-row sm:items-center sm:justify-between")}>
        <span className="text-sm text-paper">{label}</span>
        <div className={cn(control.kind === "check" ? "" : "sm:w-56")}>{control_}</div>
      </div>
      {provenance && <p className="text-[11px] text-mist">{provenanceText(provenance, t, locale)}</p>}
    </div>
  );
}
