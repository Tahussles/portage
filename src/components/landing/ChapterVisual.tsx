"use client";

import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

type ChapterVisualProps = { kind: "speak" | "map" | "prepare" | "practise" };

/** A real product shot for each chapter, in the selected language (captured by `pnpm gen:chapters`). */
export function ChapterVisual({ kind }: ChapterVisualProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const src = `/chapters/${kind}-${locale}`;
  return (
    <picture className="block aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] border border-stone-300 bg-ink shadow-[0_1px_2px_rgb(12_10_9/0.06),0_16px_32px_-16px_rgb(12_10_9/0.35)] md:w-[26rem] md:shrink-0">
      <source srcSet={`${src}.webp`} type="image/webp" />
      <img
        src={`${src}.jpg`}
        alt={t(`chapter.${kind}.alt`)}
        width={640}
        height={480}
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    </picture>
  );
}
