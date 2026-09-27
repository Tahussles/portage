import gsap from "gsap";
import { MARKER_R, ROUTE_ACCENT, ROUTE_STONE } from "./RouteShape";
import { reachProgress, type RouteLayout } from "./route";

type DrawOptions = {
  /** Position in the timeline. */
  at?: number;
  duration: number;
  /** Draw from the last marker back to the first (the sign-out wipe). */
  reverse?: boolean;
};

/**
 * Adds "draw the Portage line" to a timeline: the route strokes itself in with power2.inOut and each marker
 * turns from stone to red, growing from 0.6 to 1, as the line reaches it. Returns the path length.
 */
export function drawRoute(tl: gsap.core.Timeline, root: Element, route: RouteLayout, { at = 0, duration, reverse = false }: DrawOptions) {
  const path = root.querySelector<SVGPathElement>("[data-route]")!;
  const markers = [...root.querySelectorAll<SVGCircleElement>("[data-marker]")];
  const length = path.getTotalLength();
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: reverse ? -length : length });
  gsap.set(markers, { fill: ROUTE_STONE, attr: { r: MARKER_R * 0.6 } });
  tl.to(path, { strokeDashoffset: 0, duration, ease: "power2.inOut" }, at);
  route.markers.forEach((m, i) => {
    const reached = reachProgress(reverse ? 1 - m.at : m.at);
    tl.to(markers[i], { fill: ROUTE_ACCENT, attr: { r: MARKER_R }, duration: 0.3, ease: "power2.out" }, at + duration * reached);
  });
  return length;
}
