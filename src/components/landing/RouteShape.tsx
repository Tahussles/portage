import type { RouteLayout } from "./route";

export const ROUTE_ACCENT = "#D52B1E"; // --color-accent
export const ROUTE_STONE = "#78716c"; // stone-500
export const MARKER_R = 4;

type RouteShapeProps = {
  route: RouteLayout;
  strokeWidth?: number;
  /** A faint halo on the last marker (the hero's destination). */
  halo?: boolean;
  /** The small travelling dot (the hero's idle motion). */
  dot?: boolean;
};

/**
 * The Portage line itself: the route, a marker per step, an optional halo and dot. Drawn in the route's own
 * pixel space. Rendered finished (red); `drawRoute` animates it. Shared by the hero and the page wipe.
 */
export function RouteShape({ route, strokeWidth = 1.5, halo = false, dot = false }: RouteShapeProps) {
  const first = route.markers[0];
  const last = route.markers[route.markers.length - 1];
  return (
    <svg viewBox={`0 0 ${route.width} ${route.height}`} className="absolute inset-0 size-full overflow-visible">
      {halo && <circle data-halo cx={last.x} cy={last.y} r={15} fill={ROUTE_ACCENT} fillOpacity={0.16} />}
      <path data-route d={route.d} fill="none" stroke={ROUTE_ACCENT} strokeWidth={strokeWidth} strokeLinecap="round" />
      {route.markers.map((m) => (
        <circle key={m.at} data-marker cx={m.x} cy={m.y} r={MARKER_R} fill={ROUTE_ACCENT} />
      ))}
      {dot && <circle data-dot cx={first.x} cy={first.y} r={3.5} fill={ROUTE_ACCENT} opacity={0} />}
    </svg>
  );
}
