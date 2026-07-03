const fs = require('fs');
const path = require('path');

// This script patches the existing homepage page.tsx
// It reads the current file and applies targeted fixes

const homePath = path.join('C:\\Users\\Danish\\emborg', 'app', 'page.tsx');
let content = fs.readFileSync(homePath, { encoding: 'utf8' });

console.log('Current homepage size:', content.length, 'bytes');
console.log('Applying patches...');

// ─── Patch 1: Fix footer dead links ───────────────────────────────────────────
// Replace links that point to "/" with real paths or remove them
content = content.replace(
  /<a[^>]*href=["']\/["'][^>]*>\s*About\s*<\/a>/gi,
  '<a href="/features">About</a>'
);
content = content.replace(
  /<a[^>]*href=["']\/["'][^>]*>\s*Blog\s*<\/a>/gi,
  '<span style={{color:"#999",cursor:"default"}}>Blog (coming soon)</span>'
);
content = content.replace(
  /<a[^>]*href=["']\/["'][^>]*>\s*Careers\s*<\/a>/gi,
  '<span style={{color:"#999",cursor:"default"}}>Careers (coming soon)</span>'
);

// Also catch href="/" patterns in footer nav items
// Generic approach: find footer section and replace all href="/" that are inside footer
const footerFix = content.replace(/(\bAbout\b.*?)href=["']\/["']/g, '$1href="/features"');
if (footerFix !== content) {
  content = footerFix;
  console.log('✓ Fixed About link in footer');
}

console.log('Patched homepage size:', content.length, 'bytes');
fs.writeFileSync(homePath, content, { encoding: 'utf8' });
console.log('✅ Homepage patches written');
console.log('');
console.log('NOTE: After running this script, manually verify in your editor:');
console.log('1. The stats numbers are hardcoded (not 0) in the JSX');
console.log('2. Testimonials section — check if it contains Priya M / Rajan K / Sneha T');
console.log('3. Footer links for About/Blog/Careers');
