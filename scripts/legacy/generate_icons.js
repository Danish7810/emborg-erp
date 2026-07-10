const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

// First install sharp if not present
const { execSync } = require('child_process');
try {
  require.resolve('sharp');
  console.log('✅ sharp already installed');
} catch {
  console.log('Installing sharp...');
  execSync('npm install sharp --save-dev', { cwd: ROOT, stdio: 'inherit' });
  console.log('✅ sharp installed');
}

const sharp = require('sharp');

const iconsDir = path.join(ROOT, 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Generate SVG at a given size with the EMBORG logo properly scaled
function generateSvg(size) {
  const pad = Math.round(size * 0.05);        // 5% padding
  const inner = size - pad * 2;               // usable area
  const gap = Math.round(inner * 0.06);       // gap between squares
  const sq = Math.round((inner - gap) / 2);  // square size
  const rx = Math.round(sq * 0.18);          // corner radius

  const x1 = pad;
  const y1 = pad;
  const x2 = pad + sq + gap;
  const y2 = pad + sq + gap;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#2563EB"/>
  <rect x="${x1}" y="${y1}" width="${sq}" height="${sq}" rx="${rx}" fill="white"/>
  <rect x="${x2}" y="${y1}" width="${sq}" height="${sq}" rx="${rx}" fill="white" opacity="0.65"/>
  <rect x="${x1}" y="${y2}" width="${sq}" height="${sq}" rx="${rx}" fill="white" opacity="0.65"/>
  <rect x="${x2}" y="${y2}" width="${sq}" height="${sq}" rx="${rx}" fill="white" opacity="0.35"/>
</svg>`;
}

// Maskable icon — more padding so the logo sits inside the safe zone
function generateMaskableSvg(size) {
  const pad = Math.round(size * 0.15);
  const inner = size - pad * 2;
  const gap = Math.round(inner * 0.06);
  const sq = Math.round((inner - gap) / 2);
  const rx = Math.round(sq * 0.18);

  const x1 = pad;
  const y1 = pad;
  const x2 = pad + sq + gap;
  const y2 = pad + sq + gap;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563EB"/>
  <rect x="${x1}" y="${y1}" width="${sq}" height="${sq}" rx="${rx}" fill="white"/>
  <rect x="${x2}" y="${y1}" width="${sq}" height="${sq}" rx="${rx}" fill="white" opacity="0.65"/>
  <rect x="${x1}" y="${y2}" width="${sq}" height="${sq}" rx="${rx}" fill="white" opacity="0.65"/>
  <rect x="${x2}" y="${y2}" width="${sq}" height="${sq}" rx="${rx}" fill="white" opacity="0.35"/>
</svg>`;
}

async function generateIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const maskableSizes = [192, 512];

  for (const size of sizes) {
    const svg = generateSvg(size);
    const outPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✅ icon-${size}x${size}.png`);
  }

  // Generate maskable variants (no rounded rect — full bleed for OS cropping)
  for (const size of maskableSizes) {
    const svg = generateMaskableSvg(size);
    const outPath = path.join(iconsDir, `icon-${size}x${size}-maskable.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✅ icon-${size}x${size}-maskable.png`);
  }

  // Apple touch icon — 180x180, rounded, no mask
  const appleSvg = generateSvg(180);
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✅ apple-touch-icon.png');

  // favicon 32x32
  const faviconSvg = generateSvg(32);
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'favicon-32x32.png'));
  console.log('✅ favicon-32x32.png');

  // Update manifest to use maskable variants
  const manifestPath = path.join(ROOT, 'public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.icons = [
    { src: "/icons/icon-72x72.png",              sizes: "72x72",   type: "image/png", purpose: "any" },
    { src: "/icons/icon-96x96.png",              sizes: "96x96",   type: "image/png", purpose: "any" },
    { src: "/icons/icon-128x128.png",            sizes: "128x128", type: "image/png", purpose: "any" },
    { src: "/icons/icon-144x144.png",            sizes: "144x144", type: "image/png", purpose: "any" },
    { src: "/icons/icon-152x152.png",            sizes: "152x152", type: "image/png", purpose: "any" },
    { src: "/icons/icon-192x192.png",            sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-192x192-maskable.png",   sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "/icons/icon-384x384.png",            sizes: "384x384", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512x512.png",            sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512x512-maskable.png",   sizes: "512x512", type: "image/png", purpose: "maskable" },
  ];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ manifest.json updated with maskable icons');

  // Add apple touch icon to layout.tsx
  const layoutPath = path.join(ROOT, 'app', 'layout.tsx');
  let layout = fs.readFileSync(layoutPath, 'utf8');
  if (!layout.includes('apple-touch-icon')) {
    layout = layout.replace(
      `appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EMBORG ERP",
  },`,
      `appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EMBORG ERP",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png",  sizes: "192x192", type: "image/png" },
    ],
  },`
    );
    fs.writeFileSync(layoutPath, layout, 'utf8');
    console.log('✅ layout.tsx: apple-touch-icon linked');
  }

  console.log('\n════ ALL ICONS GENERATED ════');
  console.log('Run: npm run build && git add . && git commit -m "PWA: sharp icons, crisp at all sizes" && git push');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
