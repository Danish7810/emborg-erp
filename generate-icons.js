// Run this ONCE to generate PNG icons from your SVG logo
// Install sharp first: npm install sharp --save-dev
// Then run: node generate-icons.js

const sharp = require('sharp');
const path = require('path');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  for (const size of sizes) {
    await sharp('public/icons/icon.svg')
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}x${size}.png`);
    console.log(`✅ Generated: icon-${size}x${size}.png`);
  }
  // Also create placeholder screenshots (solid color)
  await sharp({ create: { width: 390, height: 844, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } } })
    .png().toFile('public/icons/screenshot-mobile.png');
  await sharp({ create: { width: 1280, height: 800, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } } })
    .png().toFile('public/icons/screenshot-desktop.png');
  console.log('✅ All icons generated!');
}

generate().catch(console.error);
