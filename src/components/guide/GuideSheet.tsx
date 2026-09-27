"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { QUESTIONS } from "./questions";

/** "What should I say?": the same six questions as a written guide, in the UI language, plus three tips. */
export function GuideSheet() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button ref={trigger} type="button" onClick={() => setOpen(true)} className="text-sm text-paper underline underline-offset-4 hover:text-white">
        {t("guide.whatToSay")}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-sheet-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85svh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-line bg-granite p-6 text-left shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="guide-sheet-title" className="font-display text-2xl font-medium tracking-tight">
                {t("guide.whatToSay")}
              </h2>
              <button
                ref={close}
                type="button"
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                }}
                aria-label={t("panel.close")}
                className="grid size-8 place-items-center rounded-full text-mist hover:text-paper"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-mist">{t("guide.sheet.body")}</p>
            <ol className="mt-5 flex flex-col gap-3">
              {QUESTIONS.map((q, i) => (
                <li key={q.id} className="flex gap-3 text-sm leading-relaxed text-paper">
                  <span className="font-display text-mist tabular-nums">{i + 1}</span>
                  <span>{t(q.question)}</span>
                </li>
              ))}
            </ol>
            <p className="micro-label mt-6 text-mist">{t("guide.tips")}</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-paper">
              {(["guide.tip1", "guide.tip2", "guide.tip3"] as const).map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
