// Generates public/topo.svg: faint topographic contour lines over seeded simplex noise.
// Run once with `node scripts/gen-topo.mjs`. Deterministic: same seed, same file.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contours } from "d3-contour";
import { createNoise2D } from "simplex-noise";

const SEED = 20260926;
const WIDTH = 1600;
const HEIGHT = 1000;
const COLS = 128;
const ROWS = 80;
const LEVELS = 14;
const OUT = fileURLToPath(new URL("../public/topo.svg", import.meta.url));

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

const noise = createNoise2D(mulberry32(SEED));

// Three octaves of noise, stretched a little horizontally so ridges read as land, not blobs.
const values = new Float64Array(COLS * ROWS);
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const nx = x / 50;
    const ny = y / 38;
    values[y * COLS + x] =
      noise(nx, ny) + 0.5 * noise(nx * 2.1 + 11, ny * 2.1 + 7) + 0.25 * noise(nx * 4.3 + 23, ny * 4.3 + 3);
  }
}

let min = Infinity;
let max = -Infinity;
for (const v of values) {
  if (v < min) min = v;
  if (v > max) max = v;
}
const thresholds = Array.from({ length: LEVELS }, (_, i) => min + ((i + 1) * (max - min)) / (LEVELS + 1));

const sx = WIDTH / COLS;
const sy = HEIGHT / ROWS;
const onEdge = ([x, y]) => x <= 0 || y <= 0 || x >= COLS || y >= ROWS;

// d3-contour returns MultiPolygons in grid units. Each ring becomes relative, integer path data;
// segments that run along the grid border are skipped (lifted with a move) so no frame is drawn.
function ringToPath(ring) {
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

const paths = contours()
  .size([COLS, ROWS])
  .thresholds(thresholds)(values)
  .map((geometry) =>
    geometry.coordinates
      .flat()
      .filter((ring) => ring.length >= 10)
      .map(ringToPath)
      .join(""),
  );

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#fafaf9" stroke-width="1" stroke-linejoin="round">
${paths.filter(Boolean).map((d) => `<path d="${d}"/>`).join("\n")}
</svg>
`;

writeFileSync(OUT, svg);
console.log(`wrote ${OUT} (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB, ${paths.length} levels)`);
