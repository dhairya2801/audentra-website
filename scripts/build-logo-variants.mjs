/**
 * Derives the approved web logo files from the source horizontal PNG.
 *
 * The source art is the approved horizontal lockup on an opaque white canvas:
 * the gradient A-mark followed by "UDENTRA". Per Brand Identity Guidelines v1
 * (§03, Logo Structure) the mark IS the first letter — glyph segmentation
 * confirms seven wordmark glyphs, so there is no duplicated "A" to remove.
 *
 * This script knocks out the white canvas and recolours the wordmark for the
 * target background. The gradient A-mark itself is never touched — the teal
 * crossbar is part of the mark and must stay (§03, Usage Errors).
 *
 * Outputs:
 *   public/audentra-logo-dark-text.png   navy wordmark — light backgrounds
 *   public/audentra-logo-light.png       white wordmark — dark backgrounds
 *   public/audentra-mark.png             A-mark alone — icon / favicon use
 *
 *   node scripts/build-logo-variants.mjs [source.png]
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = process.argv[2] ?? path.join(root, "public", "audentra-logo.png");

/** A pixel belongs to the gradient A-mark when it is both bright and saturated. */
function isMarkPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max > 140 && (max - min) / max > 0.35;
}

/** White canvas out, wordmark recoloured, mark preserved. */
async function knockout(wordmark) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isMarkPixel(r, g, b)) {
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = 255;
      continue;
    }

    // Wordmark ink on white: luminance becomes coverage. The source canvas
    // carries a faint off-white gradient, so anything below the noise floor is
    // forced fully transparent — otherwise nothing trims.
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const raw = Math.round((255 - luminance) * 1.35);
    out[i] = wordmark[0];
    out[i + 1] = wordmark[1];
    out[i + 2] = wordmark[2];
    out[i + 3] = raw < 26 ? 0 : Math.min(255, raw);
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .trim({ threshold: 1 })
    .toBuffer();
}

/** Column ranges that contain ink, i.e. one entry per glyph (or ligature). */
async function segments(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const found = [];
  let start = null;

  for (let x = 0; x < width; x += 1) {
    let alpha = 0;
    for (let y = 0; y < height; y += 1) alpha += data[(y * width + x) * channels + 3];
    const inked = alpha > height * 2;
    if (inked && start === null) start = x;
    if (!inked && start !== null) {
      found.push([start, x - 1]);
      start = null;
    }
  }
  if (start !== null) found.push([start, width - 1]);
  return { spans: found, width, height };
}

const darkLockup = await knockout([10, 31, 68]);
const lightLockup = await knockout([255, 255, 255]);

// The A-mark on its own, squared up for icon use (§03: minimum 24 px digital).
const { spans, height } = await segments(darkLockup);
const markWidth = spans[0][1] - spans[0][0] + 1;
const side = Math.max(markWidth, height);
const markIcon = await sharp({
  create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    {
      input: await sharp(darkLockup).extract({ left: spans[0][0], top: 0, width: markWidth, height }).toBuffer(),
      left: Math.round((side - markWidth) / 2),
      top: Math.round((side - height) / 2),
    },
  ])
  .png()
  .toBuffer();

await Promise.all([
  sharp(darkLockup).toFile(path.join(root, "public", "audentra-logo-dark-text.png")),
  sharp(lightLockup).toFile(path.join(root, "public", "audentra-logo-light.png")),
  sharp(markIcon).toFile(path.join(root, "public", "audentra-mark.png")),
]);

const meta = await sharp(darkLockup).metadata();
console.log(`wrote [A-mark] + UDENTRA lockups at ${meta.width}x${meta.height}, plus audentra-mark.png`);
