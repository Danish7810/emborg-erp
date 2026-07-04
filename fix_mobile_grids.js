const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

// ═══════════════════════════════════════════════════════════════════
// 1. Add responsive grid utility classes to globals.css
// ═══════════════════════════════════════════════════════════════════
const cssPath = path.join(ROOT, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('.grid-2-1')) {
  css += `
/* ── Responsive multi-column grids — stack to 1 column on small screens ── */
.grid-2-1 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .grid-2-1,
  .grid-3,
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
`;
  fs.writeFileSync(cssPath, css, { encoding: 'utf8' });
  console.log('✅ globals.css: added .grid-2-1 / .grid-3 / .grid-2 responsive utility classes');
} else {
  console.log('⚠ globals.css already has these classes — skipping');
}

// ═══════════════════════════════════════════════════════════════════
// 2. dashboard/page.tsx — swap 3 broken inline grids for the classes
// ═══════════════════════════════════════════════════════════════════
const dashPath = path.join(ROOT, 'app', 'dashboard', 'page.tsx');
let dash = fs.readFileSync(dashPath, 'utf8');
let dashChanges = 0;

// A) Pipeline by Stage + Business Health Score
if (dash.includes(`<div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>`)) {
  dash = dash.replace(
    `<div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>`,
    `<div className="grid-2-1">`
  );
  dashChanges++;
}

// B) Top Deals / Follow-up Needed / Recent Activity
if (dash.includes(`<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>`)) {
  dash = dash.replace(
    `<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>`,
    `<div className="grid-3">`
  );
  dashChanges++;
}

// C) Quick Stats + Recent Contacts (the outer 2-col wrapper, not the inner 2x2 stat grid)
if (dash.includes(`<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>`)) {
  dash = dash.replace(
    `<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>`,
    `<div className="grid-2">`
  );
  dashChanges++;
}

fs.writeFileSync(dashPath, dash, { encoding: 'utf8' });
console.log('✅ dashboard/page.tsx: fixed ' + dashChanges + ' broken grid(s)');

// ═══════════════════════════════════════════════════════════════════
// 3. dashboard/pipeline/page.tsx — Conversion Funnel + Stage Breakdown
// ═══════════════════════════════════════════════════════════════════
const pipePath = path.join(ROOT, 'app', 'dashboard', 'pipeline', 'page.tsx');
let pipe = fs.readFileSync(pipePath, 'utf8');
let pipeChanges = 0;

if (pipe.includes(`<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>`)) {
  pipe = pipe.replace(
    `<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>`,
    `<div className="grid-2" style={{ marginBottom: "16px" }}>`
  );
  pipeChanges++;
}

fs.writeFileSync(pipePath, pipe, { encoding: 'utf8' });
console.log('✅ pipeline/page.tsx: fixed ' + pipeChanges + ' broken grid(s)');

// ═══════════════════════════════════════════════════════════════════
// 4. Search bar in dashboard header — prevent overflow on narrow screens
// ═══════════════════════════════════════════════════════════════════
dash = fs.readFileSync(dashPath, 'utf8');
if (dash.includes('width: "200px" }} />')) {
  dash = dash.replace(
    `<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." style={{ padding: "9px 14px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", width: "200px" }} />`,
    `<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." style={{ padding: "9px 14px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", width: "100%", minWidth: "160px", maxWidth: "200px", boxSizing: "border-box" }} />`
  );
  fs.writeFileSync(dashPath, dash, { encoding: 'utf8' });
  console.log('✅ dashboard/page.tsx: search input now flexes instead of forcing a fixed 200px width');
}

console.log('\nRun: npm run build');
