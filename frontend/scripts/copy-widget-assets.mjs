import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Widget nhung duoc phat hanh cung origin voi dashboard (khong CDN rieng) -
// xem BotConfig.tsx: embedSnippet dung window.location.origin.
const __dirname = dirname(fileURLToPath(import.meta.url));
const widgetDist = resolve(__dirname, "../../widget/dist");
const publicDir = resolve(__dirname, "../public");

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

for (const file of ["script.umd.cjs", "script.css"]) {
  const source = resolve(widgetDist, file);
  if (!existsSync(source)) {
    throw new Error(`Khong tim thay ${file} trong widget/dist - hay build widget truoc.`);
  }
  copyFileSync(source, resolve(publicDir, file));
}
