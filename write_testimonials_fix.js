const fs = require('fs');
const path = require('path');

// Replacement founding customer section (replaces fake testimonials)
const foundingSection = `
{/* ─── Founding Customers CTA (replaces testimonials) ─── */}
<section style={{
  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  padding: '80px 24px',
  textAlign: 'center',
}}>
  <div style={{ maxWidth: 640, margin: '0 auto' }}>
    <span style={{
      display: 'inline-block',
      background: 'rgba(255,255,255,0.15)',
      color: '#fff',
      padding: '4px 14px',
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 20,
      letterSpacing: '0.05em',
    }}>NOW IN EARLY ACCESS</span>
    <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>
      Be a Founding Customer
    </h2>
    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 36, lineHeight: 1.6 }}>
      EMBORG is live and serving its first wave of businesses. Founding customers get locked-in pricing, direct access to the product team, and priority feature requests — forever.
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <a href="/auth/login" style={{
        background: '#fff',
        color: '#4F46E5',
        padding: '14px 28px',
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 16,
        textDecoration: 'none',
        display: 'inline-block',
      }}>Start Free — 14 Days</a>
      <a href="/contact" style={{
        background: 'transparent',
        color: '#fff',
        padding: '14px 28px',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 16,
        textDecoration: 'none',
        border: '2px solid rgba(255,255,255,0.5)',
        display: 'inline-block',
      }}>Book a Demo</a>
    </div>
    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 20 }}>
      No credit card required &nbsp;·&nbsp; Cancel anytime
    </p>
  </div>
</section>
`;

const homePath = path.join('C:\\Users\\Danish\\emborg', 'app', 'page.tsx');
let content = fs.readFileSync(homePath, { encoding: 'utf8' });

// Strategy: find the testimonials section by looking for the fake names
const hasTestimonials = content.includes('Priya M') || content.includes('Rajan K') || content.includes('Sneha T');

if (hasTestimonials) {
  console.log('Found fake testimonials — replacing with founding CTA section...');
  
  // Find the section boundaries — look for JSX section containing the fake names
  // We'll replace the entire testimonials section
  const lines = content.split('\n');
  let sectionStart = -1;
  let sectionEnd = -1;
  let depth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if ((line.includes('Priya M') || line.includes('Rajan K') || line.includes('testimonial') || line.includes('Testimonial')) && sectionStart === -1) {
      // Walk back to find the opening <section or <div
      for (let j = i; j >= 0; j--) {
        if (lines[j].includes('<section') || (lines[j].trim().startsWith('<div') && j < i - 1)) {
          sectionStart = j;
          break;
        }
      }
    }
    if (sectionStart !== -1 && sectionEnd === -1 && i > sectionStart) {
      if (line.includes('Sneha T') || line.includes('</section>')) {
        // Find the closing tag
        for (let k = i; k < Math.min(i + 30, lines.length); k++) {
          if (lines[k].includes('</section>') || lines[k].includes('</div>')) {
            sectionEnd = k;
            break;
          }
        }
      }
    }
  }
  
  if (sectionStart >= 0 && sectionEnd > sectionStart) {
    const before = lines.slice(0, sectionStart).join('\n');
    const after = lines.slice(sectionEnd + 1).join('\n');
    content = before + '\n' + foundingSection + '\n' + after;
    console.log(`✅ Replaced testimonials (lines ${sectionStart}-${sectionEnd}) with founding CTA`);
  } else {
    console.log('⚠ Could not auto-detect testimonials section boundaries.');
    console.log('  Manually delete the section with Priya M / Rajan K / Sneha T');
    console.log('  and replace with the section below:\n');
    console.log(foundingSection);
  }
} else {
  console.log('⚠ Could not find fake testimonials by name. Check the homepage manually.');
}

// Also fix stats if they're rendered as 0
if (content.includes('{count}') || content.includes('useState(0)') || content.includes('animatedValue')) {
  console.log('⚠ Stats appear to be client-side animated from 0. Add these to your SSR render:');
  console.log('  "150+ Businesses served", "8 ERP modules", "99.5% Uptime", "24h Support"');
}

fs.writeFileSync(homePath, content, { encoding: 'utf8' });
console.log('Done.');
