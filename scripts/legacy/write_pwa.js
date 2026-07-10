const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

function write(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, { encoding: 'utf8' });
  console.log('✅ Written:', relPath);
}

// ═══════════════════════════════════════════════════════════════════
// 1. WEB APP MANIFEST — public/manifest.json
// ═══════════════════════════════════════════════════════════════════
write('public/manifest.json', JSON.stringify({
  name: "EMBORG ERP",
  short_name: "EMBORG",
  description: "Cloud ERP for small and mid-sized businesses — CRM, Finance, Inventory, HR and Payroll in one platform.",
  start_url: "/dashboard",
  display: "standalone",
  orientation: "portrait-primary",
  background_color: "#FAFAF9",
  theme_color: "#2563EB",
  lang: "en",
  scope: "/",
  categories: ["business", "finance", "productivity"],
  icons: [
    { src: "/icons/icon-72x72.png",   sizes: "72x72",   type: "image/png", purpose: "any" },
    { src: "/icons/icon-96x96.png",   sizes: "96x96",   type: "image/png", purpose: "any" },
    { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "any" },
    { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "any" },
    { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "any" },
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
  shortcuts: [
    { name: "Dashboard",  short_name: "Dashboard",  url: "/dashboard",           icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }] },
    { name: "Contacts",   short_name: "CRM",         url: "/dashboard/contacts",  icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }] },
    { name: "Finance",    short_name: "Finance",     url: "/dashboard/finance",   icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }] },
    { name: "Inventory",  short_name: "Inventory",   url: "/dashboard/inventory", icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }] },
  ],
  screenshots: [
    { src: "/icons/screenshot-mobile.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "EMBORG Dashboard on mobile" },
    { src: "/icons/screenshot-desktop.png", sizes: "1280x800", type: "image/png", form_factor: "wide", label: "EMBORG Dashboard on desktop" },
  ],
}, null, 2));

// ═══════════════════════════════════════════════════════════════════
// 2. SERVICE WORKER — public/sw.js
// Caches shell for offline viewing, network-first for API calls
// ═══════════════════════════════════════════════════════════════════
write('public/sw.js', `const CACHE_NAME = 'emborg-v1';

// App shell — pages that work offline after first visit
const SHELL_URLS = [
  '/',
  '/dashboard',
  '/auth/login',
  '/offline',
];

// Install: cache the shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API calls: network only (never cache live data)
// - Navigation: network first, fall back to cache, then /offline
// - Assets: cache first (JS/CSS/images don't change without new deploy)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls or Supabase
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    return;
  }

  // Navigation requests: network first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('/offline')))
    );
    return;
  }

  // Static assets: cache first
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/brand/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
});
`);

// ═══════════════════════════════════════════════════════════════════
// 3. OFFLINE PAGE — app/offline/page.tsx
// ═══════════════════════════════════════════════════════════════════
write('app/offline/page.tsx', `export default function OfflinePage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: "400px" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>📡</div>
        <h1 className="tight" style={{ fontSize: "26px", fontWeight: 800, color: "var(--ink)", margin: "0 0 12px 0" }}>You are offline</h1>
        <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 28px 0" }}>
          EMBORG needs an internet connection to load your business data. Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "12px 28px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
`);

// ═══════════════════════════════════════════════════════════════════
// 4. PWA META TAGS — update app/layout.tsx
// ═══════════════════════════════════════════════════════════════════
const layoutPath = path.join(ROOT, 'app', 'layout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');

if (!layout.includes('manifest')) {
  // Add manifest + apple meta to the metadata export
  layout = layout.replace(
    `export const metadata = {`,
    `export const metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EMBORG ERP",
  },
  formatDetection: { telephone: false },`
  );
  fs.writeFileSync(layoutPath, layout, 'utf8');
  console.log('✅ layout.tsx: manifest + apple meta added');
} else {
  console.log('⚠ layout.tsx already has manifest — skipping');
}

// ═══════════════════════════════════════════════════════════════════
// 5. SERVICE WORKER REGISTRATION — app/components/PwaInit.tsx
// ═══════════════════════════════════════════════════════════════════
write('app/components/PwaInit.tsx', `"use client";
import { useEffect } from "react";

export default function PwaInit() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(reg => console.log("SW registered:", reg.scope))
        .catch(err => console.log("SW registration failed:", err));
    }
  }, []);
  return null;
}
`);

// ── Add PwaInit to root layout ─────────────────────────────────────
layout = fs.readFileSync(layoutPath, 'utf8');
if (!layout.includes('PwaInit')) {
  layout = layout.replace(
    `import "./globals.css";`,
    `import "./globals.css";\nimport PwaInit from "./components/PwaInit";`
  );
  layout = layout.replace(
    `<body>`,
    `<body><PwaInit />`
  );
  // Handle the case where body has className
  layout = layout.replace(
    `<body className={inter.className}>`,
    `<body className={inter.className}><PwaInit />`
  );
  fs.writeFileSync(layoutPath, layout, 'utf8');
  console.log('✅ layout.tsx: PwaInit component registered');
}

// ═══════════════════════════════════════════════════════════════════
// 6. GENERATE PNG ICONS from SVG using canvas-like approach
// We'll create a simple script that generates placeholder icons
// The user needs to replace these with their real logo PNG later
// ═══════════════════════════════════════════════════════════════════
const iconsDir = path.join(ROOT, 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Create SVG icon file that browsers can use as fallback
const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#2563EB"/>
  <rect x="100" y="100" width="140" height="140" rx="20" fill="white"/>
  <rect x="272" y="100" width="140" height="140" rx="20" fill="white" opacity="0.7"/>
  <rect x="100" y="272" width="140" height="140" rx="20" fill="white" opacity="0.7"/>
  <rect x="272" y="272" width="140" height="140" rx="20" fill="white" opacity="0.4"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon, 'utf8');
console.log('✅ Written: public/icons/icon.svg');

// Write a script to generate PNG icons (requires sharp or canvas)
write('generate-icons.js', `// Run this ONCE to generate PNG icons from your SVG logo
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
      .toFile(\`public/icons/icon-\${size}x\${size}.png\`);
    console.log(\`✅ Generated: icon-\${size}x\${size}.png\`);
  }
  // Also create placeholder screenshots (solid color)
  await sharp({ create: { width: 390, height: 844, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } } })
    .png().toFile('public/icons/screenshot-mobile.png');
  await sharp({ create: { width: 1280, height: 800, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } } })
    .png().toFile('public/icons/screenshot-desktop.png');
  console.log('✅ All icons generated!');
}

generate().catch(console.error);
`);

// ── Also create minimal 1x1 pixel PNGs as placeholders so the build doesn't fail
// Real PNG header + IDAT for a 1x1 blue pixel
const minimalPng = Buffer.from([
  0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
  0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR chunk length + type
  0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // width=1, height=1
  0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // bit depth=8, color type=2 (RGB), CRC start
  0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41, // CRC end, IDAT chunk
  0x54,0x08,0xD7,0x63,0x60,0x60,0xF8,0x3F, // IDAT data (compressed 1px blue)
  0x00,0x00,0x05,0x00,0x01,0x99,0xC3,0x2F, // IDAT data continued
  0xB9,0x00,0x00,0x00,0x00,0x49,0x45,0x4E, // IEND chunk start
  0x44,0xAE,0x42,0x60,0x82               // IEND
]);

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const size of iconSizes) {
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  if (!fs.existsSync(iconPath)) {
    fs.writeFileSync(iconPath, minimalPng);
  }
}
// Placeholder screenshots
const screenshotMobile = path.join(iconsDir, 'screenshot-mobile.png');
const screenshotDesktop = path.join(iconsDir, 'screenshot-desktop.png');
if (!fs.existsSync(screenshotMobile)) fs.writeFileSync(screenshotMobile, minimalPng);
if (!fs.existsSync(screenshotDesktop)) fs.writeFileSync(screenshotDesktop, minimalPng);

console.log('✅ Placeholder PNG icons created (run generate-icons.js with sharp to make real ones)');

console.log(`
════════════════════════════════════════
PWA SETUP COMPLETE
════════════════════════════════════════
What's now in your app:
  ✅ /public/manifest.json  — tells browsers this is installable
  ✅ /public/sw.js          — service worker (offline support + caching)
  ✅ /app/offline/page.tsx  — offline fallback page
  ✅ /app/components/PwaInit.tsx — registers the service worker
  ✅ Placeholder PNG icons   — replace with real ones using generate-icons.js
  ✅ App shortcuts           — Dashboard, Contacts, Finance, Inventory

TO INSTALL ON YOUR PHONE (after deploy):
  1. Open https://www.emborgerp.com in Chrome on Android
  2. Tap the 3-dot menu → "Add to Home Screen"
  3. On iOS Safari: tap Share button → "Add to Home Screen"

TO GENERATE REAL ICONS (optional but recommended):
  npm install sharp --save-dev
  node generate-icons.js
  git add public/icons/
  git commit -m "Add real PWA icons"
  git push

Run: npm run build
`);
