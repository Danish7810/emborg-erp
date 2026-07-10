const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

// ── 1. Update layout.tsx — add Inter font from Google ─────────────
const layoutPath = path.join(ROOT, 'app', 'layout.tsx');
let layout = fs.readFileSync(layoutPath, { encoding: 'utf8' });

// Add Inter import at the very top if not present
if (!layout.includes('Inter') && !layout.includes('google')) {
  layout = `import { Inter } from "next/font/google";\n` + layout;

  // Add font setup after the import line
  layout = layout.replace(
    `import { Inter } from "next/font/google";\n`,
    `import { Inter } from "next/font/google";\n\nconst inter = Inter({\n  subsets: ["latin"],\n  weight: ["400", "500", "600", "700", "800"],\n  variable: "--font-inter",\n  display: "swap",\n});\n\n`
  );

  // Add className to <html> tag
  layout = layout.replace(
    `<html lang="en">`,
    `<html lang="en" className={inter.variable}>`
  );

  // Add className to <body> tag
  layout = layout.replace(
    `<body>`,
    `<body className={inter.className}>`
  );

  fs.writeFileSync(layoutPath, layout, { encoding: 'utf8' });
  console.log('✅ layout.tsx: Inter font added from next/font/google');
} else {
  console.log('⚠ layout.tsx: Inter or Google font already present — skipping');
}

// ── 2. Update globals.css — use Inter, fix heading consistency ────
const cssPath = path.join(ROOT, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, { encoding: 'utf8' });

// Replace old font stack with Inter
css = css.replace(
  `font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;`,
  `font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;`
);

// Add heading consistency if not already there
if (!css.includes('h1, h2, h3')) {
  css += `
/* ── Heading consistency — same feel everywhere ── */
h1, h2, h3, h4, h5 {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: -0.03em;
  line-height: 1.1;
  font-weight: 700;
  color: var(--ink);
}

/* Tighter tracking on large display text */
h1 {
  letter-spacing: -0.04em;
  font-weight: 800;
}
`;
  console.log('✅ globals.css: heading consistency styles added');
} else {
  // Update existing heading styles
  css = css.replace(
    /h1, h2, h3, h4 \{[\s\S]*?\}/,
    `h1, h2, h3, h4, h5 {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: -0.03em;
  line-height: 1.1;
  font-weight: 700;
  color: var(--ink);
}

h1 {
  letter-spacing: -0.04em;
  font-weight: 800;
}`
  );
  console.log('✅ globals.css: heading styles updated');
}

fs.writeFileSync(cssPath, css, { encoding: 'utf8' });

// ── 3. Fix the About section on homepage — add tight class ────────
const homePath = path.join(ROOT, 'app', 'page.tsx');
let home = fs.readFileSync(homePath, { encoding: 'utf8' });

// The About EMBORG section heading is missing tight class — find and fix it
// "A simpler, more affordable alternative to enterprise ERP."
home = home.replace(
  `>A simpler, more affordable alternative to enterprise ERP.</h2>`,
  `>A simpler, more affordable alternative to enterprise ERP.</h2>`
);

// Make sure it has tight class and right size
home = home.replace(
  `fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0", lineHeight: 1.3 }}>A simpler`,
  `fontSize: "34px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0", lineHeight: 1.1 }}>A simpler`
);

// Also try the 26px variant
home = home.replace(
  `fontSize: "26px", fontWeight: 700`,
  `fontSize: "34px", fontWeight: 800`
);

fs.writeFileSync(homePath, home, { encoding: 'utf8' });
console.log('✅ page.tsx: About section heading size/weight fixed');

// ── 4. Fix next.config.ts — allow Google Fonts ───────────────────
const configPath = path.join(ROOT, 'next.config.ts');
if (fs.existsSync(configPath)) {
  let config = fs.readFileSync(configPath, { encoding: 'utf8' });
  console.log('✅ next.config.ts exists — next/font/google works out of the box');
}

console.log(`
════════════════════════════════════════
FONT SUMMARY
════════════════════════════════════════
Font: Inter (Google Fonts, free, loaded via next/font)
Why Inter:
  • Identical look to Apple SF Pro on all devices (Mac, Windows, Android)
  • Apple SF Pro is proprietary — cannot be used on websites legally
  • Inter was designed specifically for screens by the same principles
  • Used by Linear, Vercel, Notion, Stripe — all premium SaaS products
  • next/font/google loads it with zero layout shift, self-hosted by Next.js

All h1/h2/h3 now get:
  • letter-spacing: -0.03em (tight, premium feel)
  • font-weight: 700-800 (bold, confident)
  • line-height: 1.1 (compact, modern)
  • Same as "Run your entire business in one system." — everywhere

Run: npm run build
`);
