const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

// ── 1. Add a class to the dashboard's outer flex container ─────────
const layoutPath = path.join(ROOT, 'app', 'dashboard', 'layout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');

if (layout.includes('className="dashboard-shell"')) {
  console.log('⚠ layout.tsx already has dashboard-shell class — skipping');
} else {
  const before = layout;
  layout = layout.replace(
    `<div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)" }}>`,
    `<div className="dashboard-shell" style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)" }}>`
  );
  if (layout === before) {
    console.log('❌ Could not find the container div in layout.tsx — paste the file and I will patch manually');
    process.exit(1);
  }
  fs.writeFileSync(layoutPath, layout, 'utf8');
  console.log('✅ layout.tsx: outer container now has class "dashboard-shell"');
}

// ── 2. Add the missing flex-direction rule to globals.css ─────────
const cssPath = path.join(ROOT, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (css.includes('.dashboard-shell')) {
  console.log('⚠ globals.css already has dashboard-shell rule — skipping');
} else {
  css += `
/* ── THE missing rule: stack dashboard vertically on mobile so the
   top bar sits ABOVE the content instead of beside it in a flex row ── */
@media (max-width: 900px) {
  .dashboard-shell {
    flex-direction: column;
  }
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ globals.css: .dashboard-shell now stacks vertically below 900px');
}

console.log('\nRun: npm run build');
