"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { planSweep } from "@/components/landing/route";
import { drawRoute } from "@/components/landing/route-motion";
import { RouteShape } from "@/components/landing/RouteShape";
import { useWipeStore } from "@/lib/account/wipe";

gsap.registerPlugin(useGSAP);

const COVER = 0.7;
const UNCOVER = 0.45;

const pathOf = (href: string) => new URL(href, "http://portage.local").pathname;

/**
 * The page transition for signing in and out: the hero's Portage line (full-width variant) sweeps across
 * the screen and an ink panel follows it; the next page loads underneath and the panel slides away.
 * Reduced motion navigates at once.
 */
export function PageWipe() {
  const wipe = useWipeStore((s) => s.wipe);
  const finish = useWipeStore((s) => s.finish);
  const router = useRouter();
  const pathname = usePathname();
  const scope = useRef<HTMLDivElement>(null);
  const covered = useRef<string | null>(null);
  const current = useRef(pathname);
  // The overlay only exists after a click, so the window is there to measure.
  const route = useMemo(() => (wipe ? planSweep(window.innerWidth, window.innerHeight) : null), [wipe]);

  const uncover = useCallback(() => {
    const layer = scope.current?.querySelector("[data-wipe]");
    covered.current = null;
    if (!layer) return finish();
    gsap.to(layer, {
      clipPath: wipe?.direction === "back" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
      duration: UNCOVER,
      ease: "power2.inOut",
      onComplete: finish,
    });
  }, [wipe, finish]);

  useGSAP(
    () => {
      if (!wipe || !route) return;
      const go = () => {
        wipe.onCovered?.();
        covered.current = pathOf(wipe.href);
        router.push(wipe.href);
        // Same page (e.g. signing out on /): nothing will change the pathname, so uncover now.
        if (covered.current === current.current) requestAnimationFrame(() => uncover());
        else setTimeout(() => covered.current && uncover(), 3000);
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        wipe.onCovered?.();
        router.push(wipe.href);
        finish();
        return;
      }
      const forward = wipe.direction === "forward";
      const tl = gsap.timeline({ onComplete: go });
      gsap.set("[data-wipe]", { clipPath: "inset(0 0 0 0)" });
      tl.fromTo(
        "[data-panel]",
        { clipPath: forward ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" },
        { clipPath: "inset(0 0% 0 0%)", duration: COVER, ease: "power2.inOut" },
        0,
      );
      drawRoute(tl, scope.current!, route, { duration: COVER, reverse: !forward });
    },
    { scope, dependencies: [wipe?.id] },
  );

  // The next page is in place under the panel: slide it away.
  useEffect(() => {
    current.current = pathname;
    if (covered.current && covered.current === pathname) requestAnimationFrame(() => uncover());
  }, [pathname, uncover]);

  if (!wipe || !route) return null;
  return (
    <div ref={scope} aria-hidden="true" className="fixed inset-0 z-[70]">
      <div data-wipe className="absolute inset-0">
        <div data-panel className="absolute inset-0 bg-ink">
          <div className="absolute inset-0 bg-[url(/topo-hero.svg)] bg-cover bg-center" />
        </div>
        <RouteShape route={route} strokeWidth={2} />
      </div>
    </div>
  );
}
