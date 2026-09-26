"use client";

import { type MessageKey, useT } from "@/lib/i18n";

const ITEMS: MessageKey[] = ["ticker.1", "ticker.2", "ticker.3", "ticker.4", "ticker.5", "ticker.6"];

function Row({ keys, reverse }: { keys: MessageKey[]; reverse?: boolean }) {
  const t = useT();
  // The row is drawn twice so a -50% translate loops seamlessly; the copy is hidden from screen readers.
  return (
    <div className="flex overflow-hidden">
      <div className={reverse ? "flex w-max animate-ticker-reverse" : "flex w-max animate-ticker"}>
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
            {keys.map((key) => (
              <li key={key} className="flex items-center gap-8 pr-8 font-display text-lg whitespace-nowrap text-mist md:text-2xl">
                {t(key)}
                <span aria-hidden="true" className="size-1 rounded-full bg-slate-line" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Two rows moving in opposite directions (40 s and 50 s loops); still under reduced motion. */
export function Ticker() {
  const t = useT();
  return (
    <section aria-label={t("ticker.label")} className="flex flex-col gap-4 border-y border-slate-line bg-ink py-8">
      <Row keys={ITEMS} />
      <Row keys={[...ITEMS.slice(3), ...ITEMS.slice(0, 3)]} reverse />
    </section>
  );
}
