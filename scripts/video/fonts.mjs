// The app's own fonts (Inter and Space Grotesk, as built by next/font) as @font-face rules with data URLs,
// so the title cards and captions render in exactly the product's type without fetching anything.
import { readFileSync, readdirSync } from "node:fs";
import { ROOT } from "./lib.mjs";

export function fontFaces() {
  const dir = `${ROOT}.next/static/chunks/`;
  let css = "";
  try {
    css = readdirSync(dir)
      .filter((f) => f.endsWith(".css"))
      .map((f) => readFileSync(`${dir}${f}`, "utf8"))
      .find((c) => c.includes("@font-face"));
  } catch {
    // no build yet
  }
  if (!css) throw new Error("No built fonts found: run `pnpm build` once before `pnpm video`.");
  const faces = css.match(/@font-face\s*{[^}]*}/g) ?? [];
  return faces
    .filter((f) => /font-family:\s*"?(Inter|Space Grotesk)"?/.test(f))
    .map((f) =>
      f.replace(/url\(\.\.\/media\/([^)]+)\)/, (_, file) => {
        const data = readFileSync(`${ROOT}.next/static/media/${file}`).toString("base64");
        return `url(data:font/woff2;base64,${data})`;
      }),
    )
    .join("\n");
}
