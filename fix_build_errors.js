const fs = require('fs');
const path = require('path');

// ─── Fix 1: pricing/page.tsx — HTML comment inside JSX ────────────────────────
const pricingPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'pricing', 'page.tsx');
let pricing = fs.readFileSync(pricingPath, { encoding: 'utf8' });

// Replace the HTML comment (invalid in JSX) with nothing, and remove the empty div wrapper
pricing = pricing.replace(
  /<div[^>]*>\s*<!-- test mode banner removed -->\s*<\/div>/g,
  ''
);
// Also catch just the comment alone
pricing = pricing.replace(/<!-- test mode banner removed -->/g, '');

fs.writeFileSync(pricingPath, pricing, { encoding: 'utf8' });
console.log('✅ Fix 1: Removed invalid HTML comment from pricing/page.tsx');

// ─── Fix 2: contact/page.tsx — move "use client" to line 1, metadata to separate file ──
const contactPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'contact', 'page.tsx');
let contact = fs.readFileSync(contactPath, { encoding: 'utf8' });

// Remove the metadata import and export we added (can't mix "use client" + metadata)
contact = contact.replace(/import type \{ Metadata \} from 'next'\n\n/, '');
contact = contact.replace(/\nexport const metadata: Metadata = \{[\s\S]*?\}\n\n/, '\n');

// Move "use client" to the very top
contact = contact.replace(/^([\s\S]*?)("use client";)/, (match, before, directive) => {
  return directive + '\n' + before.replace(directive, '');
});

// Ensure "use client" is the first line
if (!contact.startsWith('"use client"')) {
  contact = contact.replace(/"use client";\n?/g, ''); // remove wherever it is
  contact = '"use client";\n' + contact;
}

fs.writeFileSync(contactPath, contact, { encoding: 'utf8' });
console.log('✅ Fix 2: Fixed contact/page.tsx — use client moved to top, metadata removed');

// Write a separate metadata file for contact
const contactMetaDir = path.join('C:\\Users\\Danish\\emborg', 'app', 'contact');
// In Next.js App Router, metadata must come from a server component or layout
// Since contact/page.tsx is "use client", we need to NOT export metadata from it
// The metadata we added IS gone now. That's fine — the root layout covers it.
console.log('   ℹ Contact page metadata removed (page is client component — root layout covers SEO)');

// ─── Fix 3: features/page.tsx — same issue as contact ─────────────────────────
const featuresPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'features', 'page.tsx');
let features = fs.readFileSync(featuresPath, { encoding: 'utf8' });

features = features.replace(/import type \{ Metadata \} from 'next'\n\n/, '');
features = features.replace(/\nexport const metadata: Metadata = \{[\s\S]*?\}\n\n/, '\n');

if (!features.startsWith('"use client"')) {
  features = features.replace(/"use client";\n?/g, '');
  features = '"use client";\n' + features;
}

fs.writeFileSync(featuresPath, features, { encoding: 'utf8' });
console.log('✅ Fix 3: Fixed features/page.tsx — use client moved to top, metadata removed');

// ─── Fix 4: dashboard/layout.tsx — can't export metadata from "use client" ────
const dashLayoutPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'dashboard', 'layout.tsx');
let dashLayout = fs.readFileSync(dashLayoutPath, { encoding: 'utf8' });

// Remove the metadata we injected
dashLayout = dashLayout.replace(/\nimport type \{ Metadata \} from 'next'\n\nexport const metadata: Metadata = \{\n  robots: 'noindex, nofollow',\n\}\n/, '');
dashLayout = dashLayout.replace(/import type \{ Metadata \} from 'next'\n\nexport const metadata: Metadata = \{\n  robots: 'noindex, nofollow',\n\}\n\n/, '');

fs.writeFileSync(dashLayoutPath, dashLayout, { encoding: 'utf8' });
console.log('✅ Fix 4: Removed metadata export from dashboard/layout.tsx (it is a client component)');

// ─── Fix 5: middleware.ts — rename to proxy.ts (Next.js 16 deprecation) ───────
const middlewarePath = path.join('C:\\Users\\Danish\\emborg', 'middleware.ts');
const proxyPath = path.join('C:\\Users\\Danish\\emborg', 'proxy.ts');

if (fs.existsSync(middlewarePath)) {
  const mw = fs.readFileSync(middlewarePath, { encoding: 'utf8' });
  fs.writeFileSync(proxyPath, mw, { encoding: 'utf8' });
  fs.unlinkSync(middlewarePath);
  console.log('✅ Fix 5: Renamed middleware.ts → proxy.ts (Next.js 16 convention)');
} else {
  console.log('⚠  middleware.ts not found — skipping rename');
}

console.log('\nAll fixes applied! Now run: npm run build');
