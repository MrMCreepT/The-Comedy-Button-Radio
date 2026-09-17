import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const rootDir = process.cwd();
const publicDir = path.resolve(rootDir, 'public');
const sourceImage = path.resolve(publicDir, 'assets', 'cover.jpg');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generatePWAIcons() {
  console.log('[PWA Generator] Starting PWA icon generation from given image:', sourceImage);

  if (!fs.existsSync(sourceImage)) {
    throw new Error(`Source cover image not found at ${sourceImage}`);
  }

  // Load master image buffer
  const masterBuffer = fs.readFileSync(sourceImage);
  const metadata = await sharp(masterBuffer).metadata();
  console.log(`[PWA Generator] Loaded master image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

  // 1. Standard PWA 192x192 PNG (purpose: any)
  const icon192Path = path.resolve(publicDir, 'pwa-192x192.png');
  await sharp(masterBuffer)
    .resize(192, 192, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9 })
    .toFile(icon192Path);
  console.log(`[PWA Generator] Generated ${icon192Path}`);

  // 2. Standard PWA 512x512 PNG (purpose: any)
  const icon512Path = path.resolve(publicDir, 'pwa-512x512.png');
  await sharp(masterBuffer)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9 })
    .toFile(icon512Path);
  console.log(`[PWA Generator] Generated ${icon512Path}`);

  // 3. Maskable PWA 512x512 PNG (purpose: maskable)
  // Maskable icons require a safe zone margin (~80% size, so 410x410 centered on a 512x512 canvas)
  // to avoid Android circle / squircle launcher clipping key artwork elements.
  const innerSize = 410;
  const resizedInner = await sharp(masterBuffer)
    .resize(innerSize, innerSize, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  const maskable512Path = path.resolve(publicDir, 'pwa-maskable-512x512.png');
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 14, g: 17, b: 26, alpha: 1 }, // #0e111a
    },
  })
    .composite([
      {
        input: resizedInner,
        left: Math.round((512 - innerSize) / 2),
        top: Math.round((512 - innerSize) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(maskable512Path);
  console.log(`[PWA Generator] Generated ${maskable512Path}`);

  // 4. Apple Touch Icon 180x180 PNG
  const appleTouchPath = path.resolve(publicDir, 'apple-touch-icon.png');
  await sharp(masterBuffer)
    .resize(180, 180, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9 })
    .toFile(appleTouchPath);
  console.log(`[PWA Generator] Generated ${appleTouchPath}`);

  // 5. Favicon 48x48 PNG / ICO
  const faviconPath = path.resolve(publicDir, 'favicon.ico');
  await sharp(masterBuffer)
    .resize(48, 48, { fit: 'cover', position: 'center' })
    .png()
    .toFile(faviconPath);
  console.log(`[PWA Generator] Generated ${faviconPath}`);

  // Also sync to dist if dist exists
  const distDir = path.resolve(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(icon192Path, path.resolve(distDir, 'pwa-192x192.png'));
    fs.copyFileSync(icon512Path, path.resolve(distDir, 'pwa-512x512.png'));
    fs.copyFileSync(maskable512Path, path.resolve(distDir, 'pwa-maskable-512x512.png'));
    fs.copyFileSync(appleTouchPath, path.resolve(distDir, 'apple-touch-icon.png'));
    fs.copyFileSync(faviconPath, path.resolve(distDir, 'favicon.ico'));
    console.log('[PWA Generator] Synced all updated icons to dist/');
  }

  console.log('[PWA Generator] Successfully generated all PWA icons from given artwork!');
}

generatePWAIcons().catch((err) => {
  console.error('[PWA Generator] Error generating icons:', err);
  process.exit(1);
});
