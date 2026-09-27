// `pnpm video`: narrate, record, edit. The whole film re-renders in one command after any fix.
//   pnpm video                 everything
//   pnpm video --no-record     re-edit the last recording (after changing captions, timings or the mix)
import { narrate } from "./narrate.mjs";
import { record } from "./record.mjs";
import { render } from "./render.mjs";

const skipRecord = process.argv.includes("--no-record");
const timeline = await narrate();
console.log(`narration ready: about ${timeline.estimate.toFixed(0)} s, voice ${timeline.voice}`);
if (!skipRecord) await record();
const report = await render();
console.log(`\n${report.file}\n${Math.floor(report.duration / 60)}:${String(Math.floor(report.duration % 60)).padStart(2, "0")} (${report.duration.toFixed(1)} s), ${report.sizeMB} MB`);
console.log(`zooms ${report.zooms}; black ${report.black.length ? report.black.join(" ") : "none"}; flashes ${report.flashes.length ? report.flashes.join(" ") : "none"}`);
for (const s of report.segments) console.log(`  ${s.start.padStart(5)}  ${s.id}${s.waits.length ? `  (waits ${s.waits.join(", ")} s)` : ""}`);
