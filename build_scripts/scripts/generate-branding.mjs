import fs from "fs";
import path from "path";
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const desktopAssets = path.join(root, "desktop", "assets");
const mobileAssets = path.join(root, "mobile", "assets");
const sourceIcon = path.join(root, "build_scripts", "branding", "source-icon.png");

fs.mkdirSync(desktopAssets, { recursive: true });
fs.mkdirSync(mobileAssets, { recursive: true });

if (!fs.existsSync(sourceIcon)) {
  throw new Error(`Missing branding source at ${sourceIcon}`);
}

const trimmedLogo = await sharp(sourceIcon)
  .trim({ background: { r: 255, g: 255, b: 255 } })
  .png()
  .toBuffer();

async function createSquareIcon(size, background) {
  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background
    }
  });

  const logo = await sharp(trimmedLogo)
    .resize(Math.round(size * 0.78), Math.round(size * 0.78), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  return base
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

const icon1024 = await createSquareIcon(1024, { r: 255, g: 255, b: 255, alpha: 1 });
const icon512 = await createSquareIcon(512, { r: 255, g: 255, b: 255, alpha: 1 });
const adaptiveIcon = await createSquareIcon(1024, { r: 255, g: 255, b: 255, alpha: 0 });
const splash = await sharp({
  create: {
    width: 1242,
    height: 2436,
    channels: 4,
    background: "#ffffff"
  }
})
  .composite([
    {
      input: await sharp(trimmedLogo)
        .resize(780, 780, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer(),
      top: 828,
      left: 231
    }
  ])
  .png()
  .toBuffer();

await fs.promises.writeFile(path.join(mobileAssets, "icon.png"), icon1024);
await fs.promises.writeFile(path.join(mobileAssets, "adaptive-icon.png"), adaptiveIcon);
await fs.promises.writeFile(path.join(mobileAssets, "splash.png"), splash);
await fs.promises.writeFile(path.join(desktopAssets, "icon.png"), icon512);
await fs.promises.writeFile(path.join(desktopAssets, "icon.ico"), await pngToIco(icon512));

console.log("Branding assets generated.");
