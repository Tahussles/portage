"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { FileText } from "lucide-react";
import { useRef } from "react";
import { useT } from "@/lib/i18n";

gsap.registerPlugin(useGSAP);

type DocPreviewProps = {
  name: string;
  /** Image URL (uploaded image or a sample's PNG), or a PDF blob URL. */
  src: string | null;
  kind: "image" | "pdf";
  /** True from upload until the findings are shown. */
  scanning: boolean;
  /** Called after the first two passes (or at once under reduced motion). */
  onScanned: () => void;
};

/** Thumbnail with a scan line sweeping top to bottom twice (1.2 s each, power1.inOut). */
export function DocPreview({ name, src, kind, scanning, onScanned }: DocPreviewProps) {
  const t = useT();
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!scanning) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Two passes, then keep sweeping if the answer is still on its way.
        gsap.fromTo(
          "[data-scan]",
          { top: "0%", opacity: 1 },
          {
            top: "100%",
            duration: 1.2,
            ease: "power1.inOut",
            repeat: 1,
            onComplete: () => {
              onScanned();
              gsap.fromTo("[data-scan]", { top: "0%" }, { top: "100%", duration: 1.2, ease: "power1.inOut", repeat: -1 });
            },
          },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => onScanned());
    },
    { scope, dependencies: [scanning], revertOnUpdate: true },
  );

  return (
    <div
      ref={scope}
      className="relative aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-[var(--radius)] border border-rule bg-white shadow-sm"
    >
      {src && kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element -- blob and sample URLs, no optimisation needed
        <img src={src} alt={t("docs.preview", { name })} className="size-full object-cover object-top" />
      )}
      {src && kind === "pdf" && (
        <object
          data={`${src}#page=1&toolbar=0&navpanes=0&view=FitH`}
          type="application/pdf"
          aria-label={t("docs.preview", { name })}
          className="pointer-events-none size-full"
        >
          <span className="grid size-full place-items-center">
            <FileText aria-hidden="true" className="size-10 text-quiet" />
          </span>
        </object>
      )}
      {scanning && (
        <span
          data-scan
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 bg-accent shadow-[0_0_24px_6px_rgba(213,43,30,0.35)] opacity-0"
        />
      )}
    </div>
  );
}
