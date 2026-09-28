import QRCode from "qrcode";
import jsQR from "jsqr";
import sharp from "sharp";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { conference, conferenceQrUrl } from "../lib/conference/config";
async function main() {
  const directory = "public/events/aacrao-baltimore";
  await mkdir(directory, { recursive: true });
  const records = [];
  for (const placement of ["booth-signage", "handout"] as const) {
    const url = conferenceQrUrl(placement);
    const options = {
      errorCorrectionLevel: "Q" as const,
      margin: 4,
      scale: 24,
      color: { dark: "#000000", light: "#ffffff" },
    };
    const svg = await QRCode.toString(url, { ...options, type: "svg" });
    const png = await QRCode.toBuffer(url, { ...options, type: "png" });
    const base = `${directory}/qr-${placement}`;
    await writeFile(`${base}.svg`, svg);
    await sharp(png).withMetadata({ density: 300 }).toFile(`${base}.png`);
    const metadata = await sharp(png).metadata();
    for (const extension of ["png", "svg"]) {
      const { data, info } = await sharp(await readFile(`${base}.${extension}`))
        .resize(metadata.width, metadata.height, { kernel: "nearest" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const decoded = jsQR(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
      );
      if (decoded?.data !== url)
        throw new Error(`QR decode mismatch: ${placement} ${extension}`);
    }
    records.push({
      placement,
      url,
      width: metadata.width,
      height: metadata.height,
      quietZoneModules: 4,
      errorCorrection: "Q",
      decodedSvgAndPng: true,
    });
  }
  await writeFile(
    `${directory}/qr-manifest.json`,
    JSON.stringify({ fallbackUrl: conference.url, codes: records }, null, 2) +
      "\n",
  );
  console.log(JSON.stringify(records, null, 2));
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
