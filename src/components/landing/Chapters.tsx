"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { useRef } from "react";
import { useT } from "@/lib/i18n";
import { ChapterVisual } from "./ChapterVisual";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const CHAPTERS = [
  { id: "speak", href: "/start" },
  { id: "map", href: "/roadmap" },
  { id: "prepare", href: "/documents" },
  { id: "practise", href: "/insights" },
] as const;

/** Four chapters on white, numbered. Each giant word is scrubbed from 0.15 to full opacity as it scrolls in. */
export function Chapters() {
  const t = useT();
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-chapter-word]").forEach((word) => {
          gsap.fromTo(
            word,
            { opacity: 0.15 },
            { opacity: 1, ease: "none", scrollTrigger: { trigger: word, start: "top 60%", end: "top 30%", scrub: true } },
          );
        });
      });
    },
    { scope },
  );

  return (
    <section ref={scope} id="how" aria-labelledby="how-title" className="scroll-mt-(--nav-h) bg-white text-ink">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <h2 id="how-title" className="micro-label text-quiet">
          {t("chapters.label")}
        </h2>
        <ol className="mt-10 flex flex-col gap-20 md:gap-28">
          {CHAPTERS.map((chapter, i) => (
            <li key={chapter.id} className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <p aria-hidden="true" className="font-display text-2xl font-medium text-stone-400 tabular-nums md:text-3xl">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p data-chapter-word className="mt-2 font-display text-[clamp(3rem,12vw,10rem)] leading-none font-medium tracking-tighter">
                  {t(`chapter.${chapter.id}.word`)}
                </p>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-quiet md:text-2xl md:leading-snug">
                  {t(`chapter.${chapter.id}.copy`)}
                </p>
                <AppLink
                  href={chapter.href}
                  className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink underline-offset-4 hover:underline"
                >
                  {t("chapter.go")}
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </AppLink>
              </div>
              <ChapterVisual kind={chapter.id} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
