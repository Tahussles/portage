// Generates faint topographic contour lines over seeded simplex noise. Deterministic: same seed, same files.
//   public/topo.svg       the roadmap and section backgrounds (unchanged since Step 3b)
//   public/topo-hero.svg  the landing hero: wider, fewer and smoother contours in stone at about 7%
// Run with `pnpm gen:topo`.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contours } from "d3-contour";
import { createNoise2D } from "simplex-noise";

const SEED = 20260926;

const VARIANTS = [
  {
    out: "../public/topo.svg",
    width: 1600,
    height: 1000,
    cols: 128,
    rows: 80,
    levels: 14,
    minRing: 10,
    // Three octaves, stretched a little horizontally so ridges read as land, not blobs.
    field: (noise, x, y) => {
      const nx = x / 50;
      const ny = y / 38;
      return noise(nx, ny) + 0.5 * noise(nx * 2.1 + 11, ny * 2.1 + 7) + 0.25 * noise(nx * 4.3 + 23, ny * 4.3 + 3);
    },
    smooth: false,
    attrs: 'stroke="#fafaf9" stroke-width="1" stroke-linejoin="round"',
  },
  {
    out: "../public/topo-hero.svg",
    width: 2400,
    height: 1200,
    cols: 96,
    rows: 48,
    levels: 8,
    minRing: 14,
    // Two gentle octaves at a lower frequency: long, calm ridges behind the headline.
    field: (noise, x, y) => {
      const nx = x / 42;
      const ny = y / 26;
      return noise(nx + 40, ny + 17) + 0.35 * noise(nx * 1.9 + 5, ny * 1.9 + 29);
    },
    smooth: true,
    attrs: 'stroke="#a8a29e" stroke-opacity="0.07" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"',
  },
];

// mulberry32: tiny seeded PRNG so the output never changes between runs.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// d3-contour returns MultiPolygons in grid units. Each ring becomes relative, integer path data;
// segments that run along the grid border are skipped (lifted with a move) so no frame is drawn.
function ringToPath(ring, v) {
  const sx = v.width / v.cols;
  const sy = v.height / v.rows;
  const onEdge = ([x, y]) => x <= 0 || y <= 0 || x >= v.cols || y >= v.rows;
  let d = "";
  let px = 0;
  let py = 0;
  let pen = false;
  for (let i = 0; i < ring.length; i++) {
    const x = Math.round(ring[i][0] * sx);
    const y = Math.round(ring[i][1] * sy);
    const border = i > 0 && onEdge(ring[i]) && onEdge(ring[i - 1]);
    if (i === 0 || border) {
      pen = false;
    } else if (!pen) {
      d += `M${px} ${py}`;
      pen = true;
    }
    if (pen && (x !== px || y !== py)) d += `l${x - px} ${y - py}`;
    px = x;
    py = y;
  }
  return d;
}

// Smooth variant: split the ring where it runs along the border, then draw each run as quadratic
// curves through the midpoints of its segments (closed rings wrap around), so contours read as calm lines.
function ringToSmoothPath(ring, v) {
  const sx = v.width / v.cols;
  const sy = v.height / v.rows;
  const onEdge = ([x, y]) => x <= 0 || y <= 0 || x >= v.cols || y >= v.rows;
  const pt = ([x, y]) => [Math.round(x * sx), Math.round(y * sy)];
  const mid = (a, b) => [Math.round((a[0] + b[0]) / 2), Math.round((a[1] + b[1]) / 2)];
  const runs = [];
  let run = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    if (onEdge(ring[i]) && onEdge(ring[i - 1])) {
      if (run.length > 1) runs.push(run);
      run = [ring[i]];
    } else run.push(ring[i]);
  }
  if (run.length > 1) runs.push(run);
  const closed = runs.length === 1 && runs[0].length === ring.length;
  return runs
    .map((r) => {
      const p = r.map(pt);
      if (closed) {
        const q = p.slice(0, -1); // the ring repeats its first point
        const n = q.length;
        let d = `M${mid(q[n - 1], q[0]).join(" ")}`;
        for (let i = 0; i < n; i++) d += `Q${q[i].join(" ")} ${mid(q[i], q[(i + 1) % n]).join(" ")}`;
        return `${d}Z`;
      }
      if (p.length < 3) return `M${p[0].join(" ")}L${p[p.length - 1].join(" ")}`;
      let d = `M${p[0].join(" ")}L${mid(p[0], p[1]).join(" ")}`;
      for (let i = 1; i < p.length - 1; i++) d += `Q${p[i].join(" ")} ${mid(p[i], p[i + 1]).join(" ")}`;
      return `${d}L${p[p.length - 1].join(" ")}`;
    })
    .join("");
}

for (const v of VARIANTS) {
  const noise = createNoise2D(mulberry32(SEED));
  const values = new Float64Array(v.cols * v.rows);
  for (let y = 0; y < v.rows; y++) {
    for (let x = 0; x < v.cols; x++) values[y * v.cols + x] = v.field(noise, x, y);
  }

  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const thresholds = Array.from({ length: v.levels }, (_, i) => min + ((i + 1) * (max - min)) / (v.levels + 1));

  const paths = contours()
    .size([v.cols, v.rows])
    .thresholds(thresholds)(values)
    .map((geometry) =>
      geometry.coordinates
        .flat()
        .filter((ring) => ring.length >= v.minRing)
        .map((ring) => (v.smooth ? ringToSmoothPath(ring, v) : ringToPath(ring, v)))
        .join(""),
    );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${v.width} ${v.height}" preserveAspectRatio="xMidYMid slice" fill="none" ${v.attrs}>
${paths.filter(Boolean).map((d) => `<path d="${d}"/>`).join("\n")}
</svg>
`;

  const out = fileURLToPath(new URL(v.out, import.meta.url));
  writeFileSync(out, svg);
  console.log(`wrote ${out} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB, ${paths.length} levels)`);
}
