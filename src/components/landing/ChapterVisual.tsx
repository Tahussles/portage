/* eslint-disable @next/next/no-img-element -- small static stills, no optimisation needed */

type ChapterVisualProps = { kind: "speak" | "map" | "prepare" | "practise" };

/** Small grayscale still for each chapter, drawn from the product itself. */
export function ChapterVisual({ kind }: ChapterVisualProps) {
  const frame = "relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] md:w-80";

  if (kind === "speak") {
    return (
      <div aria-hidden="true" className={`${frame} grid place-items-center bg-ink`}>
        <span className="relative grid size-24 place-items-center rounded-full bg-granite ring-1 ring-paper">
          <span className="absolute -inset-2 rounded-full border-2 border-accent opacity-80" />
          <span className="h-7 w-3 rounded-full border-2 border-paper" />
        </span>
      </div>
    );
  }

  if (kind === "map") {
    return (
      <div aria-hidden="true" className={`${frame} bg-ink`}>
        <div className="absolute inset-0 bg-[url(/topo.svg)] bg-cover opacity-[0.12]" />
        <svg viewBox="0 0 320 240" className="absolute inset-0 size-full">
          <path d="M40 180 C 100 180, 90 90, 150 90 S 230 160, 280 60" fill="none" stroke="#D52B1E" strokeWidth="2" strokeDasharray="6 6" />
          {[
            [40, 180],
            [150, 90],
            [215, 125],
            [280, 60],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x - 18} y={y - 10} width="36" height="20" rx="4" fill="#1c1917" stroke="#a8a29e" strokeWidth="1" />
          ))}
        </svg>
      </div>
    );
  }

  if (kind === "prepare") {
    return (
      <div aria-hidden="true" className={`${frame} bg-paper`}>
        <img src="/landing/chapter-prepare.jpg" alt="" width={640} height={906} loading="lazy" decoding="async" className="size-full object-cover object-top" />
        <span className="absolute inset-x-0 top-1/3 h-0.5 bg-accent shadow-[0_0_18px_4px_rgba(213,43,30,0.35)]" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={frame}>
      <img src="/landing/chapter-practise.jpg" alt="" width={640} height={360} loading="lazy" decoding="async" className="size-full object-cover" />
    </div>
  );
}
