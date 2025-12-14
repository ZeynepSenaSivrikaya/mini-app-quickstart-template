#!/usr/bin/env node
/**
 * slices an image into 3 columns x 2 rows and writes files to public/moods/
 * Usage: node scripts/slice-moods.js path/to/source.png
 * Output files: public/moods/cry.png, happy.png, sweat.png, sleep.png, love.png, fire.png
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.error('Usage: node scripts/slice-moods.js path/to/source.png');
    process.exit(1);
  }
  if (!fs.existsSync(src)) {
    console.error('Source file does not exist:', src);
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'moods');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const labels = ['cry', 'happy', 'sweat', 'sleep', 'love', 'fire'];

  const img = sharp(src);
  const meta = await img.metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) {
    console.error('Unable to read image dimensions');
    process.exit(1);
  }

  const colW = Math.floor(w / 3);
  const rowH = Math.floor(h / 2);

  let index = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const left = col * colW;
      const top = row * rowH;
      const outName = labels[index] + '.png';
      const outPath = path.join(outDir, outName);

      await img
        .extract({ left, top, width: colW, height: rowH })
        .resize(256, 256, { fit: 'cover' })
        .png({ quality: 90 })
        .toFile(outPath);

      console.log('Wrote', outPath);
      index++;
    }
  }
  console.log('Done slicing moods.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
