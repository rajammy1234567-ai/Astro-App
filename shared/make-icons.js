const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src1 = process.argv[2];
const outDir = process.argv[3];

async function run() {
  await sharp(src1).resize(1024, 1024, { fit: 'cover' }).png().toFile(path.join(outDir, 'icon.png'));
  await sharp(src1).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(outDir, 'splash-icon.png'));
  await sharp(src1).resize(48, 48, { fit: 'cover' }).png().toFile(path.join(outDir, 'favicon.png'));
  await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: { r: 30, g: 16, b: 51 } }
  }).png().toFile(path.join(outDir, 'android-icon-background.png'));

  const fg = await sharp(src1)
    .resize(680, 680, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();

  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: fg, gravity: 'centre' }])
    .png()
    .toFile(path.join(outDir, 'android-icon-foreground.png'));

  await sharp(src1).resize(1024, 1024, { fit: 'cover' }).grayscale().normalize().png()
    .toFile(path.join(outDir, 'android-icon-monochrome.png'));

  await sharp(src1).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(outDir, 'logo-glow.png'));

  console.log('OK', outDir);
  for (const f of fs.readdirSync(outDir)) {
    console.log(f, fs.statSync(path.join(outDir, f)).size);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
