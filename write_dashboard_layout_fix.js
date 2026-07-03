const fs = require('fs');
const path = require('path');

// ─── Fix dashboard layout to not include marketing nav ────────────────────────
// Read existing dashboard layout
const dashLayoutPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'dashboard', 'layout.tsx');
let dashLayout = fs.existsSync(dashLayoutPath) ? fs.readFileSync(dashLayoutPath, { encoding: 'utf8' }) : '';

// Check if it already exports metadata for noindex
if (!dashLayout.includes('robots') && !dashLayout.includes('noindex')) {
  // Prepend metadata export at the top after existing imports
  const metadataInsert = `\nimport type { Metadata } from 'next'\n\nexport const metadata: Metadata = {\n  robots: 'noindex, nofollow',\n}\n\n`;
  
  // Find where imports end and content begins
  const lines = dashLayout.split('\n');
  let lastImportLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImportLine = i;
  }
  
  const before = lines.slice(0, lastImportLine + 1).join('\n');
  const after = lines.slice(lastImportLine + 1).join('\n');
  dashLayout = before + '\n\nimport type { Metadata } from \'next\'\n\nexport const metadata: Metadata = {\n  robots: \'noindex, nofollow\',\n}\n' + after;
  
  fs.writeFileSync(dashLayoutPath, dashLayout, { encoding: 'utf8' });
  console.log('✅ Added noindex to dashboard layout');
} else {
  console.log('⚠ Dashboard layout already has robots/noindex — skipping');
}

// ─── Write per-page metadata for public pages ──────────────────────────────────
const pages = [
  {
    file: path.join('C:\\Users\\Danish\\emborg', 'app', 'features', 'page.tsx'),
    metadata: `export const metadata: Metadata = {
  title: 'Features | EMBORG ERP — CRM, Finance, Inventory, HR & More',
  description: 'Explore every module in EMBORG ERP: CRM, Invoicing, Inventory, Payroll, HR, and Pipeline Analytics — all in one platform for SMEs.',
  alternates: { canonical: 'https://www.emborgerp.com/features' },
  openGraph: {
    title: 'EMBORG ERP Features',
    description: 'CRM, Finance, Inventory, HR, Payroll — every tool your business needs.',
    url: 'https://www.emborgerp.com/features',
    siteName: 'EMBORG ERP',
    type: 'website',
  },
}`,
  },
  {
    file: path.join('C:\\Users\\Danish\\emborg', 'app', 'pricing', 'page.tsx'),
    metadata: `export const metadata: Metadata = {
  title: 'Pricing | EMBORG ERP — Plans for Every Business Size',
  description: 'Simple, transparent pricing for EMBORG ERP. Start free for 14 days. Starter, Pro, and Enterprise plans available.',
  alternates: { canonical: 'https://www.emborgerp.com/pricing' },
  openGraph: {
    title: 'EMBORG ERP Pricing',
    description: 'Affordable ERP for SMEs. 14-day free trial, no credit card needed.',
    url: 'https://www.emborgerp.com/pricing',
    siteName: 'EMBORG ERP',
    type: 'website',
  },
}`,
  },
  {
    file: path.join('C:\\Users\\Danish\\emborg', 'app', 'contact', 'page.tsx'),
    metadata: `export const metadata: Metadata = {
  title: 'Contact Us | EMBORG ERP',
  description: 'Get in touch with the EMBORG ERP team — book a demo, ask a question, or request a custom plan.',
  alternates: { canonical: 'https://www.emborgerp.com/contact' },
  openGraph: {
    title: 'Contact EMBORG ERP',
    description: 'Book a live demo or send us a message.',
    url: 'https://www.emborgerp.com/contact',
    siteName: 'EMBORG ERP',
    type: 'website',
  },
}`,
  },
];

for (const { file, metadata } of pages) {
  if (!fs.existsSync(file)) {
    console.log('⚠ Not found, skipping:', file);
    continue;
  }

  let content = fs.readFileSync(file, { encoding: 'utf8' });

  // Check if metadata already exists
  if (content.includes('export const metadata')) {
    console.log('⚠ Already has metadata:', file);
    continue;
  }

  // Add Metadata import if not present
  if (!content.includes("from 'next'") && !content.includes('import type { Metadata }')) {
    content = "import type { Metadata } from 'next'\n\n" + content;
  }

  // Insert metadata after imports block
  const lines = content.split('\n');
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) lastImportLine = i;
  }

  if (lastImportLine >= 0) {
    lines.splice(lastImportLine + 1, 0, '\n' + metadata + '\n');
    content = lines.join('\n');
  } else {
    content = metadata + '\n\n' + content;
  }

  fs.writeFileSync(file, content, { encoding: 'utf8' });
  console.log('✅ Metadata added to:', path.basename(path.dirname(file)));
}

// ─── Fix homepage metadata / canonical ────────────────────────────────────────
const homePath = path.join('C:\\Users\\Danish\\emborg', 'app', 'page.tsx');
let homeContent = fs.readFileSync(homePath, { encoding: 'utf8' });

if (homeContent.includes('export const metadata') && homeContent.includes("url: 'https://emborgerp.com'")) {
  homeContent = homeContent.replace(
    "url: 'https://emborgerp.com'",
    "url: 'https://www.emborgerp.com'"
  );
  homeContent = homeContent.replace(
    "alternates: { canonical: 'https://emborgerp.com' }",
    "alternates: { canonical: 'https://www.emborgerp.com' }"
  );
  fs.writeFileSync(homePath, homeContent, { encoding: 'utf8' });
  console.log('✅ Fixed homepage canonical to www');
}

console.log('\nAll metadata fixes done!');
