// One-off asset generator: renders brand PNGs from SVG using sharp.
// Run from the web app root:  node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";

const root = process.cwd();
const iconSvg = readFileSync(`${root}/public/icon.svg`);
const maskableSvg = readFileSync(`${root}/public/icon-maskable.svg`);

// Adaptive-icon foreground: transparent bg + white mic, kept inside the
// central safe zone. Background layer is the solid green gradient.
const foregroundSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(106 100) scale(0.6)">
    <rect x="216" y="150" width="80" height="140" rx="40" fill="#ffffff"/>
    <path d="M176 250c0 44 36 80 80 80s80-36 80-80" stroke="#ffffff" stroke-width="22" stroke-linecap="round" fill="none"/>
    <rect x="244" y="330" width="24" height="44" rx="12" fill="#ffffff"/>
    <rect x="206" y="372" width="100" height="24" rx="12" fill="#ffffff"/>
  </g>
</svg>`;

const backgroundSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#25D366"/><stop offset="1" stop-color="#0E9F6E"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
</svg>`;

const jobs = [
  // Web PWA / favicons
  { svg: iconSvg, size: 192, out: "public/icon-192.png" },
  { svg: iconSvg, size: 512, out: "public/icon-512.png" },
  { svg: maskableSvg, size: 512, out: "public/maskable-512.png" },
  { svg: iconSvg, size: 180, out: "public/apple-icon.png" },
  // Mobile (Expo) assets — mobile-app lives inside the web root
  { svg: iconSvg, size: 1024, out: "mobile-app/assets/icon.png" },
  { svg: iconSvg, size: 48, out: "mobile-app/assets/favicon.png" },
  { svg: iconSvg, size: 1024, out: "mobile-app/assets/splash-icon.png" },
  { svg: Buffer.from(foregroundSvg), size: 1024, out: "mobile-app/assets/android-icon-foreground.png" },
  { svg: Buffer.from(backgroundSvg), size: 1024, out: "mobile-app/assets/android-icon-background.png" },
];

for (const job of jobs) {
  const path = `${root}/${job.out}`;
  try {
    mkdirSync(path.substring(0, path.lastIndexOf("/")), { recursive: true });
  } catch {}
  await sharp(job.svg, { density: 384 })
    .resize(job.size, job.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path);
  console.log("wrote", job.out, `(${job.size}px)`);
}
console.log("Done.");
