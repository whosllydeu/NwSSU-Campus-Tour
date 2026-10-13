// Shrinks every 360° panorama in public/panoramas so the site can be
// pushed to GitHub and deployed on Vercel (and loads fast on phones).
//
//   npm i -D sharp
//   node scripts/compress-panoramas.mjs
//
// • Keeps the SAME file names and folders (no code changes needed).
// • Resizes to MAX_WIDTH (2:1 panorama → 4096×2048) — the largest size
//   most phones can show in 360° anyway — and re-saves as JPEG.
// • Files already small enough are left untouched, so it's safe to rerun.
// • Make a backup of public/panoramas BEFORE running (it overwrites files).
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Windows: don't let sharp keep files open (it blocks overwriting them).
sharp.cache(false);

const MAX_WIDTH = 4096; // try 5120 if you want sharper (bigger) files
const QUALITY = 80;
const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024; // already ≤1.5 MB and small enough → skip

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../public/panoramas");

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jpe?g)$/i.test(entry.name)) yield full;
  }
}

const mb = (b) => (b / 1024 / 1024).toFixed(2) + " MB";
let before = 0, after = 0, count = 0, skipped = 0;

for await (const file of walk(ROOT)) {
  // Read the whole file into memory first so the file isn't locked
  // while we overwrite it.
  const input = await readFile(file);
  const size = input.length;
  const meta = await sharp(input).metadata();
  before += size;

  if (size <= SKIP_BELOW_BYTES && (meta.width || 0) <= MAX_WIDTH) {
    after += size;
    skipped++;
    continue;
  }

  const output = await sharp(input, { limitInputPixels: false })
    .rotate() // respect camera orientation
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();

  try {
    await writeFile(file, output);
  } catch (err) {
    console.warn(`!! could not save ${path.relative(ROOT, file)} (${err.code}) — close any app using it and rerun`);
    after += size;
    continue;
  }
  after += output.length;
  count++;
  console.log(`${path.relative(ROOT, file)}  ${mb(size)} → ${mb(output.length)}`);
}

console.log(`\nDone: ${count} compressed, ${skipped} skipped`);
console.log(`Total: ${mb(before)} → ${mb(after)}`);
