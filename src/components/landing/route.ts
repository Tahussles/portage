// Geometry for "the Portage line" in the landing hero: one calm route across the land, drawn in the
// hero's own pixel space so it always stays clear of the headline and CTAs. Pure; tested in route.test.ts.

export type Point = { x: number; y: number };
export type Box = { left: number; top: number; right: number; bottom: number };

export type RouteLayout = {
  /** "side": low along the bottom, then up the right side of the headline (wide screens).
   *  "below": a short line under the CTAs (phones and narrow tablets). */
  mode: "side" | "below";
  width: number;
  height: number;
  /** SVG path data (cubic Béziers through the waypoints). */
  d: string;
  /** Approximate path length in px (the component reads the exact one from the DOM). */
  length: number;
  /** Step markers; `at` is the fraction of the path length where the marker sits. */
  markers: (Point & { at: number })[];
  /** Points sampled along the path (for the clearance tests). */
  samples: Point[];
};

/** Room needed to the right of the text before the route can climb beside it. */
export const SIDE_MIN_ROOM = 260;
const SIDE_MARKERS = [0.1, 0.28, 0.46, 0.64, 0.82, 1];
const BELOW_MARKERS = [0.2, 0.47, 0.74, 1];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom through the waypoints, as cubic Béziers. */
function toBeziers(points: Point[]) {
  const segs: [Point, Point, Point, Point][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    segs.push([
      p1,
      { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p2,
    ]);
  }
  return segs;
}

function bezierAt([a, b, c, d]: [Point, Point, Point, Point], t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

function build(mode: RouteLayout["mode"], width: number, height: number, waypoints: Point[], at: number[]): RouteLayout {
  const segs = toBeziers(waypoints);
  const d =
    `M${r1(waypoints[0].x)} ${r1(waypoints[0].y)}` +
    segs.map(([, b, c, e]) => `C${r1(b.x)} ${r1(b.y)} ${r1(c.x)} ${r1(c.y)} ${r1(e.x)} ${r1(e.y)}`).join("");

  const samples: Point[] = [];
  const lengths: number[] = [];
  let length = 0;
  segs.forEach((seg, i) => {
    for (let s = i === 0 ? 0 : 1; s <= 40; s++) {
      const p = bezierAt(seg, s / 40);
      const prev = samples[samples.length - 1];
      if (prev) length += Math.hypot(p.x - prev.x, p.y - prev.y);
      samples.push(p);
      lengths.push(length);
    }
  });

  const markers = at.map((f) => {
    const target = f * length;
    const i = Math.max(0, lengths.findIndex((l) => l >= target));
    return { x: r1(samples[i].x), y: r1(samples[i].y), at: f };
  });

  return { mode, width, height, d, length, markers, samples };
}

/**
 * Plans the route for a hero of `width` x `height` px whose text (label, headline and CTAs) occupies
 * `text`, under a navbar ending at `navBottom`.
 */
export function planRoute(width: number, height: number, text: Box, navBottom: number): RouteLayout {
  const room = height - text.bottom;

  if (width >= 768 && width - text.right >= SIDE_MIN_ROOM) {
    // Enter from the left edge low in the frame, run under the CTAs, then meander up beside the headline.
    const low = Math.min(height - 30, text.bottom + room * 0.55);
    const riseX = Math.max(text.right + 60, width * 0.62);
    const endX = Math.min(width - 70, Math.max(riseX + 190, width * 0.84));
    const endY = Math.max(navBottom + 110, height * 0.3);
    return build(
      "side",
      width,
      height,
      [
        { x: -24, y: low + 6 },
        { x: width * 0.18, y: low - 10 },
        { x: width * 0.38, y: low + 8 },
        { x: riseX - 70, y: low - 4 },
        { x: lerp(riseX, endX, 0.55), y: lerp(low, endY, 0.28) },
        { x: lerp(riseX, endX, 0.2), y: lerp(low, endY, 0.58) },
        { x: lerp(riseX, endX, 0.75), y: lerp(low, endY, 0.84) },
        { x: endX, y: endY },
      ],
      SIDE_MARKERS,
    );
  }

  // Phones: a shorter line in the band under the CTAs.
  const mid = text.bottom + room * 0.52;
  const amp = Math.min(12, room * 0.16);
  return build(
    "below",
    width,
    height,
    [
      { x: -16, y: mid + amp * 0.6 },
      { x: width * 0.24, y: mid - amp },
      { x: width * 0.47, y: mid + amp },
      { x: width * 0.68, y: mid - amp * 0.8 },
      { x: width * 0.84, y: mid - amp * 0.2 },
    ],
    BELOW_MARKERS,
  );
}

/** Inverse of GSAP's power2.inOut: when (0 to 1) a line drawn with that ease reaches fraction `f`. */
export function reachProgress(f: number) {
  return f < 0.5 ? Math.sqrt(f / 2) : 1 - Math.sqrt((1 - f) / 2);
}
