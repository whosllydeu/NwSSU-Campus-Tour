import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

sharp.cache(false);

const MAX_WIDTH = 4096;
const QUALITY = 80;
const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024;

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
    .rotate()
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
