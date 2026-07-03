const fs = require('fs');
const path = require('path');

const pricingPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'pricing', 'page.tsx');
let content = fs.readFileSync(pricingPath, { encoding: 'utf8' });

// ─── Remove test mode banner ───────────────────────────────────────────────────
// Catch various forms the banner could be written in
const testBannerPatterns = [
  // Full div with test mode text
  /<div[^>]*>[^<]*TEST MODE[^<]*Use card[^<]*4111[^<]*<\/div>/gis,
  /<div[^>]*>[^<]*TEST MODE[^<]*<\/div>/gis,
  // Alert/banner style
  /<[a-z]+[^>]*className[^>]*>[^<]*TEST MODE[^<]*<\/[a-z]+>/gis,
  // Any paragraph with the test card number
  /<p[^>]*>[^<]*4111 1111 1111 1111[^<]*<\/p>/gis,
  // Spans
  /<span[^>]*>[^<]*TEST MODE[^<]*<\/span>/gis,
];

let removed = 0;
for (const pattern of testBannerPatterns) {
  const newContent = content.replace(pattern, '<!-- test mode banner removed -->');
  if (newContent !== content) {
    content = newContent;
    removed++;
  }
}

if (removed === 0) {
  // Fallback: line-by-line approach
  const lines = content.split('\n');
  const cleaned = lines.filter(line => 
    !line.includes('TEST MODE') && 
    !line.includes('4111 1111') && 
    !line.includes('test mode') &&
    !line.includes('Use card')
  );
  if (cleaned.length !== lines.length) {
    content = cleaned.join('\n');
    console.log(`✅ Removed ${lines.length - cleaned.length} test mode lines`);
  } else {
    console.log('⚠ Could not find test mode banner automatically — check pricing page manually');
  }
} else {
  console.log('✅ Removed test mode banner via regex');
}

// ─── Fix pricing copy: Pro plan multi-user ────────────────────────────────────
// Change "Multiple users" to be Enterprise-only mention removed from Pro confusion
content = content.replace(
  /Up to (\d+) users/gi,
  'Up to $1 team members'
);

// If Pro says "single user", update to "up to 3 users"  
content = content.replace(
  /Single user|1 user only|One user/gi,
  'Up to 3 team members'
);

// ─── Make trial CTA more prominent (add note near buttons) ───────────────────
// Find the primary CTA buttons and add trial note
content = content.replace(
  /Get Started|Start Free|Subscribe Now/g,
  (match) => match // keep original text for now; layout fix is manual
);

fs.writeFileSync(pricingPath, content, { encoding: 'utf8' });
console.log('✅ Pricing page updated');
console.log('');
console.log('MANUAL CHECKS needed in pricing/page.tsx:');
console.log('1. Confirm no "TEST MODE" / "4111" text remains');
console.log('2. Change primary button CTA to "Start Free Trial" (not "Get Started" or "Subscribe Now")');
console.log('3. Add small text under each button: "14 days free · No credit card"');
console.log('4. Pro plan: ensure it shows "Up to 3 team members" not "Single user"');
