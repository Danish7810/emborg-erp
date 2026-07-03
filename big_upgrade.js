const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\Danish\\emborg';
const report = [];
function log(msg) { console.log(msg); report.push(msg); }

// ═══════════════════════════════════════════════════════════════════
// PART 1: DIAGNOSTICS — proxy + package.json
// ═══════════════════════════════════════════════════════════════════
console.log('\n════════ PART 1: DIAGNOSTICS ════════\n');

// Check proxy.ts
const proxyPath = path.join(ROOT, 'proxy.ts');
if (fs.existsSync(proxyPath)) {
  const proxy = fs.readFileSync(proxyPath, 'utf8');
  const hasExport = proxy.includes('export async function proxy');
  log(hasExport ? '✅ proxy.ts exists with correct export' : '❌ proxy.ts missing "export async function proxy"');
} else {
  log('❌ proxy.ts NOT FOUND at root!');
}

// Check package.json for @supabase/ssr
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
if (deps['@supabase/ssr']) {
  log(`✅ @supabase/ssr in package.json (${deps['@supabase/ssr']})`);
} else {
  log('❌ @supabase/ssr MISSING from package.json — Vercel build will fail!');
  log('   FIX: run  npm install @supabase/ssr --save');
}
log('   All deps: ' + Object.keys(deps).join(', '));

// ═══════════════════════════════════════════════════════════════════
// PART 2: HOMEPAGE — replace testimonials + stats with honest content
// ═══════════════════════════════════════════════════════════════════
console.log('\n════════ PART 2: HOMEPAGE REBUILD ════════\n');

const homePath = path.join(ROOT, 'app', 'page.tsx');
let home = fs.readFileSync(homePath, 'utf8');
const originalHome = home;

// Helper: find the <section (or <div) tag start walking backwards from an index
function findBlockStart(src, fromIdx) {
  const sIdx = src.lastIndexOf('<section', fromIdx);
  return sIdx;
}

// ---- 2a. Replace testimonials section ----
// Boundaries: section containing "What our customers say" up to section containing "See EMBORG on your own data"
const tIdx = home.indexOf('What our customers say');
const dIdx = home.indexOf('See EMBORG on your own data');

const foundingAndComparison = `      <section style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20, letterSpacing: '0.05em' }}>NOW IN EARLY ACCESS</span>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>Be a founding customer.</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 36, lineHeight: 1.6 }}>EMBORG is live and onboarding its first wave of businesses. Founding customers get locked-in pricing for life, direct access to the product team, and priority on feature requests.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/auth/signup" style={{ background: '#fff', color: '#4F46E5', padding: '14px 28px', borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-block' }}>Start Free — 14 Days</a>
            <a href="/contact" style={{ background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)', display: 'inline-block' }}>Book a Demo</a>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 20 }}>No credit card required · Cancel anytime</p>
        </div>
      </section>

      <section style={{ padding: '80px 24px', maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>Enterprise power. SME simplicity.</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 48, fontSize: 17 }}>Everything growing businesses need from an ERP — without enterprise complexity or enterprise pricing.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(128,128,128,0.3)' }}>
                <th style={{ textAlign: 'left', padding: '14px 12px' }}></th>
                <th style={{ textAlign: 'center', padding: '14px 12px', color: '#4F46E5', fontWeight: 700 }}>EMBORG</th>
                <th style={{ textAlign: 'center', padding: '14px 12px', color: 'var(--muted)', fontWeight: 600 }}>Enterprise ERP suites</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Time to go live', 'Same day', 'Weeks to months'],
                ['CRM + Finance + Inventory + HR in one', 'Included in every plan', 'Separate products and licenses'],
                ['Built-in AI assistant', 'Included', 'Paid add-on'],
                ['Pricing model', 'Flat, transparent plans', 'Per-user, per-module, per-add-on'],
                ['Implementation consultants needed', 'No', 'Usually'],
                ['Built for', 'Small and mid-sized businesses', 'Large enterprises'],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 500 }}>{row[0]}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center', color: '#16A34A', fontWeight: 600 }}>{row[1]}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center', color: 'var(--muted)' }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

`;

if (tIdx !== -1 && dIdx !== -1 && dIdx > tIdx) {
  const secStart = findBlockStart(home, tIdx);
  const secEnd = findBlockStart(home, dIdx); // start of demo CTA section = end of cut
  if (secStart !== -1 && secEnd > secStart) {
    home = home.slice(0, secStart) + foundingAndComparison + home.slice(secEnd);
    log('✅ 2a. Testimonials REPLACED with Founding CTA + comparison table');
  } else {
    log('❌ 2a. Could not resolve <section boundaries for testimonials.');
    log('--- Context around "What our customers say": ---');
    log(originalHome.slice(Math.max(0, tIdx - 400), tIdx + 200));
  }
} else if (tIdx === -1) {
  log('⚠ 2a. "What our customers say" not found in app/page.tsx — testimonials may live in a component.');
  // Search components for it
  const searchDirs = [path.join(ROOT, 'app'), path.join(ROOT, 'app', 'components')];
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isFile() && (f.endsWith('.tsx') || f.endsWith('.ts'))) {
        const c = fs.readFileSync(fp, 'utf8');
        if (c.includes('Priya') || c.includes('What our customers say')) {
          log('   → Found testimonials in: ' + fp);
        }
      }
    }
  }
}

// ---- 2b. Replace animated stats with honest static stats ----
const statIdx = home.indexOf('Businesses served');
if (statIdx !== -1) {
  const sStart = findBlockStart(home, statIdx);
  const sEndTag = home.indexOf('</section>', statIdx);
  if (sStart !== -1 && sEndTag !== -1) {
    const staticStats = `      <section style={{ padding: '56px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, textAlign: 'center' }}>
          <div><div style={{ fontSize: 40, fontWeight: 700, color: '#4F46E5' }}>8</div><div style={{ color: 'var(--muted)', fontSize: 15 }}>ERP modules included</div></div>
          <div><div style={{ fontSize: 40, fontWeight: 700, color: '#4F46E5' }}>14 days</div><div style={{ color: 'var(--muted)', fontSize: 15 }}>Free trial, no card needed</div></div>
          <div><div style={{ fontSize: 40, fontWeight: 700, color: '#4F46E5' }}>99.5%</div><div style={{ color: 'var(--muted)', fontSize: 15 }}>Uptime target</div></div>
          <div><div style={{ fontSize: 40, fontWeight: 700, color: '#4F46E5' }}>24h</div><div style={{ color: 'var(--muted)', fontSize: 15 }}>Support response</div></div>
        </div>
      </section>`;
    home = home.slice(0, sStart) + staticStats + home.slice(sEndTag + '</section>'.length);
    log('✅ 2b. Animated 0-stats REPLACED with honest static stats (8 modules, 14-day trial, 99.5%, 24h)');
  } else {
    log('❌ 2b. Could not resolve stats section boundaries. Context:');
    log(home.slice(Math.max(0, statIdx - 500), statIdx + 100));
  }
} else {
  log('⚠ 2b. "Businesses served" not in page.tsx — likely in a component. Search output above may show it.');
}

if (home !== originalHome) {
  fs.writeFileSync(homePath, home, 'utf8');
  log('💾 app/page.tsx saved (' + home.length + ' bytes)');
}

// ═══════════════════════════════════════════════════════════════════
// PART 3: FOOTER — replace dead About/Blog/Careers with legal links
// ═══════════════════════════════════════════════════════════════════
console.log('\n════════ PART 3: FOOTER FIX ════════\n');

// Find which file contains the footer (search for "Careers")
function findFilesContaining(dir, needle, results = []) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(f)) {
      findFilesContaining(fp, needle, results);
    } else if (stat.isFile() && (f.endsWith('.tsx') || f.endsWith('.ts'))) {
      if (fs.readFileSync(fp, 'utf8').includes(needle)) results.push(fp);
    }
  }
  return results;
}

const footerFiles = findFilesContaining(path.join(ROOT, 'app'), 'Careers');
if (footerFiles.length === 0) {
  log('❌ 3. No file containing "Careers" found under app/');
} else {
  for (const ff of footerFiles) {
    let fc = fs.readFileSync(ff, 'utf8');
    const origFc = fc;

    // Replace About/Blog/Careers links (works for <a> and <Link>)
    fc = fc.replace(/<(a|Link)([^>]*?)href=\{?["']\/["']\}?([^>]*?)>\s*About\s*<\/(a|Link)>/g, '<$1$2href="/features"$3>About</$4>');
    fc = fc.replace(/<(a|Link)([^>]*?)href=\{?["']\/["']\}?([^>]*?)>\s*Blog\s*<\/(a|Link)>/g, '<$1$2href="/privacy"$3>Privacy Policy</$4>');
    fc = fc.replace(/<(a|Link)([^>]*?)href=\{?["']\/["']\}?([^>]*?)>\s*Careers\s*<\/(a|Link)>/g, '<$1$2href="/terms"$3>Terms of Service</$4>');

    if (fc !== origFc) {
      // Also add a Refund link after Terms if space — append after the Terms anchor we just made
      fc = fc.replace(/(>Terms of Service<\/(a|Link)>)/, '$1<a href="/refund">Refund Policy</a>');
      fs.writeFileSync(ff, fc, 'utf8');
      log('✅ 3. Footer links fixed in: ' + ff);
      log('   About → /features | Blog → Privacy Policy | Careers → Terms of Service | + Refund Policy added');
    } else {
      log('⚠ 3. Found "Careers" in ' + ff + ' but the link pattern did not match. Here is the block:');
      const ci = origFc.indexOf('Careers');
      log('────────────────────────────');
      log(origFc.slice(Math.max(0, ci - 600), ci + 200));
      log('────────────────────────────');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// PART 4: CANONICAL / og:url — force www everywhere
// ═══════════════════════════════════════════════════════════════════
console.log('\n════════ PART 4: CANONICAL FIX ════════\n');

const metaFiles = findFilesContaining(path.join(ROOT, 'app'), 'https://emborgerp.com');
if (metaFiles.length === 0) {
  log('⚠ 4. No file contains "https://emborgerp.com" — canonical may already be www or set elsewhere.');
} else {
  for (const mf of metaFiles) {
    let mc = fs.readFileSync(mf, 'utf8');
    mc = mc.split('https://emborgerp.com').join('https://www.emborgerp.com');
    // Avoid accidental double-www
    mc = mc.split('https://www.www.emborgerp.com').join('https://www.emborgerp.com');
    fs.writeFileSync(mf, mc, 'utf8');
    log('✅ 4. Canonical/og:url switched to www in: ' + mf);
  }
}

console.log('\n════════ DONE — now run: npm run build ════════');
