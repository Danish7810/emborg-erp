const fs = require('fs');
const path = require('path');

// ─── Fix 1: proxy.ts — rename export from "middleware" to "proxy" ─────────────
const proxyPath = path.join('C:\\Users\\Danish\\emborg', 'proxy.ts');
let proxy = fs.readFileSync(proxyPath, { encoding: 'utf8' });

// Rename the exported function
proxy = proxy.replace('export async function middleware(', 'export async function proxy(');

fs.writeFileSync(proxyPath, proxy, { encoding: 'utf8' });
console.log('✅ Fix 1: Renamed export "middleware" → "proxy" in proxy.ts');

// ─── Fix 2: pricing/page.tsx — same use client + metadata conflict ─────────────
const pricingPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'pricing', 'page.tsx');
let pricing = fs.readFileSync(pricingPath, { encoding: 'utf8' });

// Remove the Metadata import and export we injected
pricing = pricing.replace(/import type \{ Metadata \} from 'next'\n\n/, '');
pricing = pricing.replace(/\nexport const metadata: Metadata = \{[\s\S]*?\}\n\n/, '\n');
pricing = pricing.replace(/export const metadata: Metadata = \{[\s\S]*?\}\n\n/, '');

// Move "use client" to line 1
pricing = pricing.replace(/"use client";\n?/g, '');
pricing = '"use client";\n' + pricing;

fs.writeFileSync(pricingPath, pricing, { encoding: 'utf8' });
console.log('✅ Fix 2: Fixed pricing/page.tsx — use client on top, metadata removed');

console.log('\nDone! Run: npm run build');
