import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "image.png");
const phoneSrc = path.join(root, "Phone.png");
const out = path.join(root, "public", "assets");

await mkdir(out, { recursive: true });

await sharp(src)
  .resize(1600, null, { withoutEnlargement: true })
  .webp({ quality: 78 })
  .toFile(path.join(out, "village-desktop.webp"));

await sharp(src)
  .resize(900, 1200, { fit: "cover", position: "centre" })
  .webp({ quality: 78 })
  .toFile(path.join(out, "village-mobile.webp"));

await sharp(src)
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 80 })
  .toFile(path.join(out, "village-og.jpg"));

await sharp(phoneSrc)
  .resize(900, 1946, { fit: "cover", position: "centre" })
  .webp({ quality: 78 })
  .toFile(path.join(out, "phone-bg.webp"));

await sharp(phoneSrc)
  .resize(1800, 3892, { fit: "cover", position: "centre" })
  .webp({ quality: 78 })
  .toFile(path.join(out, "phone-bg@2x.webp"));

console.log("images optimized");
