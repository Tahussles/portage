"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type RefObject } from "react";
import { type RouteLayout } from "./route";
import { drawRoute } from "./route-motion";
import { RouteShape } from "./RouteShape";

gsap.registerPlugin(useGSAP);

/** The headline rise-in ends about 1.9 s after the hero mounts; the line draws after it. */
const INTRO_START = 1.9;
const DRAW = 2.4;
/** One quiet traveller along the route every 14 s. */
const DOT_CYCLE = 14;
const DOT_TRAVEL = 6;

type PortageLineProps = {
  route: RouteLayout;
  /** performance.now() when the hero's headline started rising in. */
  startedAt: RefObject<number | null>;
  startLabel: string;
  endLabel: string;
};

/**
 * "The Portage line": the roadmap's red route across the land, drawn once after the headline, with a
 * marker for each step. Afterwards only one small dot moves, once every 14 s; it pauses while the tab is
 * hidden. Reduced motion shows the finished line and no dot.
 */
export function PortageLine({ route, startedAt, startLabel, endLabel }: PortageLineProps) {
  const scope = useRef<HTMLDivElement>(null);
  const introDone = useRef(false);
  const last = route.markers[route.markers.length - 1];
  const first = route.markers[0];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const path = scope.current!.querySelector<SVGPathElement>("[data-route]")!;
        const dot = scope.current!.querySelector<SVGCircleElement>("[data-dot]")!;
        const startEls = gsap.utils.toArray<HTMLElement>("[data-start-label]");
        const endEls = gsap.utils.toArray<HTMLElement>("[data-end-label]");
        const length = path.getTotalLength();

        const travel = { p: 0 };
        const place = () => {
          const pt = path.getPointAtLength(travel.p * length);
          gsap.set(dot, { attr: { cx: pt.x, cy: pt.y } });
        };
        const dotTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: DOT_CYCLE - DOT_TRAVEL, delay: 1.2 });
        dotTl
          .fromTo(travel, { p: 0 }, { p: 1, duration: DOT_TRAVEL, ease: "sine.inOut", onUpdate: place, immediateRender: false }, 0)
          .fromTo(dot, { opacity: 0 }, { opacity: 0.6, duration: 0.6, ease: "none", immediateRender: false }, 0)
          .to(dot, { opacity: 0, duration: 0.8, ease: "none" }, DOT_TRAVEL - 0.8);
        const onVisibility = () => (document.hidden ? dotTl.pause() : introDone.current && dotTl.resume());
        document.addEventListener("visibilitychange", onVisibility);

        if (introDone.current) {
          dotTl.play();
        } else {
          const elapsed = startedAt.current === null ? INTRO_START : (performance.now() - startedAt.current) / 1000;
          gsap.set("[data-halo]", { opacity: 0 });
          const labels = [...startEls, ...endEls];
          if (labels.length) gsap.set(labels, { opacity: 0 });

          const intro = gsap.timeline({
            delay: Math.max(0, INTRO_START - elapsed),
            onComplete: () => {
              introDone.current = true;
              if (!document.hidden) dotTl.play();
            },
          });
          drawRoute(intro, scope.current!, route, { duration: DRAW });
          if (startEls.length) intro.to(startEls, { opacity: 1, duration: 0.6, ease: "none" }, 0);
          intro.to("[data-halo]", { opacity: 1, duration: 0.8, ease: "power1.out" }, DRAW);
          if (endEls.length) intro.to(endEls, { opacity: 1, duration: 0.6, ease: "none" }, DRAW);
        }

        return () => document.removeEventListener("visibilitychange", onVisibility);
      });
    },
    { scope, dependencies: [route], revertOnUpdate: true },
  );

  return (
    <div ref={scope} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <RouteShape route={route} halo dot />
      {route.mode === "side" && (
        <>
          <span data-start-label className="micro-label absolute hidden text-mist md:block" style={{ left: Math.max(16, first.x - 4), top: first.y + 14 }}>
            {startLabel}
          </span>
          <span data-end-label className="micro-label absolute hidden text-right text-mist md:block" style={{ right: route.width - last.x - 6, top: last.y - 34 }}>
            {endLabel}
          </span>
        </>
      )}
    </div>
  );
}
