import { describe, expect, it } from "vitest";
import { planRoute, reachProgress, type Box, type RouteLayout } from "./route";

const inside = (p: { x: number; y: number }, b: Box, margin: number) =>
  p.x > b.left - margin && p.x < b.right + margin && p.y > b.top - margin && p.y < b.bottom + margin;

function expectClear(route: RouteLayout, text: Box, navBottom: number) {
  expect(route.samples.filter((p) => inside(p, text, 16))).toEqual([]);
  for (const p of route.samples) {
    expect(p.y).toBeGreaterThan(navBottom);
    expect(p.y).toBeLessThan(route.height - 8);
    expect(p.x).toBeLessThan(route.width);
  }
  for (const m of route.markers) {
    expect(m.x).toBeGreaterThan(0);
    expect(inside(m, text, 16)).toBe(false);
  }
}

// Text boxes measured from the hero (label, headline lines and CTAs) at common sizes.
const WIDE: [number, number, Box, number][] = [
  [1440, 900, { left: 80, top: 300, right: 1010, bottom: 790 }, 64],
  [1440, 900, { left: 80, top: 250, right: 1080, bottom: 790 }, 64], // French wraps wider
  [1280, 800, { left: 32, top: 250, right: 960, bottom: 690 }, 64],
  [1920, 1080, { left: 352, top: 420, right: 1300, bottom: 968 }, 64],
];

describe("the Portage line", () => {
  it.each(WIDE)("climbs beside the headline at %ix%i without touching the text", (w, h, text, nav) => {
    const route = planRoute(w, h, text, nav);
    expect(route.mode).toBe("side");
    expect(route.markers).toHaveLength(6);
    expectClear(route, text, nav);
    expect(route.samples[0].x).toBeLessThan(0); // enters from the left edge
    expect(route.samples[0].y).toBeGreaterThan(h * 0.8); // low in the frame
    const end = route.markers[route.markers.length - 1];
    expect(end.x).toBeGreaterThan((w * 2) / 3); // ends in the right third
    expect(end.at).toBe(1);
  });

  it("sits under the CTAs on a phone, shorter, with 4 markers", () => {
    const text = { left: 20, top: 400, right: 355, bottom: 700 };
    const route = planRoute(375, 812, text, 104);
    expect(route.mode).toBe("below");
    expect(route.markers).toHaveLength(4);
    expectClear(route, text, 104);
    for (const p of route.samples) expect(p.y).toBeGreaterThan(text.bottom + 8);
    expect(route.length).toBeLessThan(planRoute(1440, 900, WIDE[0][2], 64).length);
  });

  it("falls back to the line under the CTAs when the headline leaves no room beside it", () => {
    const route = planRoute(1024, 768, { left: 32, top: 300, right: 900, bottom: 660 }, 64);
    expect(route.mode).toBe("below");
  });

  it("times each marker to the moment a power2.inOut line reaches it", () => {
    const power2InOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x));
    for (const f of [0, 0.1, 0.28, 0.5, 0.64, 0.82, 1]) expect(power2InOut(reachProgress(f))).toBeCloseTo(f, 6);
  });
});
