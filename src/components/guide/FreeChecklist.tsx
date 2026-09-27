"use client";

import { useT } from "@/lib/i18n";
import { QUESTIONS } from "./questions";

/** "Talk freely": the six topics to mention and three tips, kept in view while recording. */
export function FreeChecklist() {
  const t = useT();
  return (
    <aside aria-labelledby="checklist-title" className="rounded-[var(--radius)] border border-slate-line bg-granite/60 p-5 text-left md:sticky md:top-[calc(var(--nav-h)+1.5rem)]">
      <h2 id="checklist-title" className="micro-label text-mist">
        {t("guide.checklist")}
      </h2>
      <ol className="mt-3 flex flex-col gap-2.5">
        {QUESTIONS.map((q, i) => (
          <li key={q.id} className="flex gap-3 text-sm leading-snug text-paper">
            <span className="grid size-5 shrink-0 place-items-center rounded-full border border-slate-line text-[10px] text-mist">{i + 1}</span>
            {t(q.topic)}
          </li>
        ))}
      </ol>
      <p className="micro-label mt-5 text-mist">{t("guide.tips")}</p>
      <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-mist">
        {(["guide.tip1", "guide.tip2", "guide.tip3"] as const).map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ul>
    </aside>
  );
}
