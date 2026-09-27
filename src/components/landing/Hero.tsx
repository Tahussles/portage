"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { PortageLine } from "./PortageLine";
import { planRoute, type RouteLayout } from "./route";

gsap.registerPlugin(useGSAP);

/** The text's layout box inside the hero. Offsets ignore the rise-in transforms; line boxes give its real right edge. */
function measure(section: HTMLElement, text: HTMLElement): RouteLayout {
  const frame = section.getBoundingClientRect();
  let right = 0;
  const range = document.createRange();
  for (const el of text.querySelectorAll<HTMLElement>("[data-measure]")) {
    if (el.dataset.measure === "box") {
      right = Math.max(right, el.getBoundingClientRect().right - frame.left);
      continue;
    }
    // Text lines only: the block spans inside the headline are as wide as the container.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) right = Math.max(right, r.right - frame.left);
    }
  }
  const nav = document.querySelector("header")?.getBoundingClientRect().bottom ?? 64;
  return planRoute(
    frame.width,
    frame.height,
    { left: text.offsetLeft, top: text.offsetTop, right, bottom: text.offsetTop + text.offsetHeight },
    nav,
  );
}

export function Hero() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const scope = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number | null>(null);
  const [route, setRoute] = useState<RouteLayout | null>(null);

  // Re-plan the route when the hero resizes, the fonts arrive, or the language changes the headline.
  useEffect(() => {
    const section = scope.current;
    const text = textRef.current;
    if (!section || !text) return;
    const update = () => setRoute(measure(section, text));
    const observer = new ResizeObserver(update);
    observer.observe(section);
    observer.observe(text);
    void document.fonts?.ready.then(update);
    return () => observer.disconnect();
  }, [locale]);

  useGSAP(
    () => {
      startedAt.current = performance.now();
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-rise='headline']",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", delay: 0.3, stagger: 0.12 },
        );
        gsap.fromTo(
          "[data-rise='cta']",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 1.0 },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-rise]", { opacity: 1, y: 0 });
      });
    },
    { scope },
  );

  return (
    <section ref={scope} className="relative isolate h-svh min-h-[640px] overflow-hidden bg-ink">
      {/* The land: still contour lines (never animated), fading to ink so the ticker below reads. */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[url(/topo-hero.svg)] bg-cover bg-center" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-transparent from-55% to-ink" />
      {route && <PortageLine route={route} startedAt={startedAt} startLabel={t("hero.routeStart")} endLabel={t("hero.routeEnd")} />}

      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-24 md:px-8 md:pb-28">
        <div ref={textRef}>
          <p data-rise="headline" data-measure className="micro-label mb-6 max-w-xl text-mist">
            {t("hero.label")}
          </p>
          <h1 data-measure className="max-w-[10.5em] font-display text-[clamp(2.5rem,8vw,6.5rem)] leading-[1.05] font-medium tracking-tight">
            <span data-rise="headline" className="block text-paper">
              {t("hero.line1")}
            </span>
            <span data-rise="headline" className="block text-stone-500">
              {t("hero.line2")}
            </span>
          </h1>
          <div data-rise="cta" className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <AppLink
              data-measure="box"
              href="/start"
              className="group inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-white"
            >
              {t("hero.cta")}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </AppLink>
            <AppLink
              data-measure="box"
              href="/roadmap?demo=1"
              className="text-sm text-mist underline-offset-4 transition-colors hover:text-paper hover:underline"
            >
              {t("hero.sample")}
            </AppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
