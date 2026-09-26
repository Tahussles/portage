// Generates public/geo/canada-provinces.json: simplified province and territory outlines as SVG
// path data, from Natural Earth admin-1 (public domain). Run once with `node scripts/gen-geo.mjs`.
//   1. download ne_50m_admin_1_states_provinces.geojson from the natural-earth-vector repo
//   2. mapshaper: keep Canada, project to Statistics Canada Lambert (EPSG:3347), simplify, drop tiny islands
//   3. turn the projected rings into compact relative SVG paths in a 1000-wide viewBox
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson";
const OUT = fileURLToPath(new URL("../public/geo/canada-provinces.json", import.meta.url));
const LAMBERT =
  "+proj=lcc +lat_1=49 +lat_2=77 +lat_0=63.390675 +lon_0=-91.86666666666666 +x_0=6200000 +y_0=3000000 +datum=NAD83 +units=m";
const WIDTH = 1000;

const dir = mkdtempSync(join(tmpdir(), "portage-geo-"));
const raw = join(dir, "admin1.geojson");
const projected = join(dir, "canada.json");

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`download failed: ${res.status}`);
writeFileSync(raw, Buffer.from(await res.arrayBuffer()));

execFileSync(
  "npx",
  [
    "--yes",
    "mapshaper",
    raw,
    "-filter", 'adm0_a3 == "CAN"',
    "-filter-fields", "postal,name,name_fr",
    "-proj", LAMBERT,
    "-filter-islands", "min-area=1500km2",
    "-simplify", "30%", "keep-shapes",
    "-o", projected, "format=geojson",
  ],
  { stdio: "inherit" },
);

const geo = JSON.parse(readFileSync(projected, "utf8"));
const rings = (g) => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat());

let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
for (const f of geo.features) {
  for (const ring of rings(f.geometry)) {
    for (const [x, y] of ring) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
}
const scale = WIDTH / (maxX - minX);
const height = Math.round((maxY - minY) * scale);

// Relative, integer path data (SVG y grows down, so flip).
function pathFor(geometry) {
  let d = "";
  for (const ring of rings(geometry)) {
    let px = 0;
    let py = 0;
    let first = true;
    for (const [x, y] of ring) {
      const sx = Math.round((x - minX) * scale);
      const sy = Math.round((maxY - y) * scale);
      if (first) {
        d += `M${sx} ${sy}`;
        first = false;
      } else if (sx !== px || sy !== py) {
        d += `l${sx - px} ${sy - py}`;
      }
      px = sx;
      py = sy;
    }
    d += "z";
  }
  return d;
}

const provinces = geo.features
  .map((f) => ({
    code: f.properties.postal,
    name: { en: f.properties.name, fr: f.properties.name_fr },
    d: pathFor(f.geometry),
  }))
  .sort((a, b) => a.code.localeCompare(b.code));

const json = JSON.stringify({
  source: "Natural Earth admin-1 states and provinces, 1:50m (public domain), Statistics Canada Lambert projection",
  viewBox: `0 0 ${WIDTH} ${height}`,
  provinces,
});
writeFileSync(OUT, json + "\n");
console.log(`wrote ${OUT} (${(Buffer.byteLength(json) / 1024).toFixed(1)} KB, ${provinces.length} provinces and territories)`);
