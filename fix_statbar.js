const fs = require('fs');
const path = require('path');

// ── Fix StatBar.tsx ────────────────────────────────────────────────
// Problems:
// 1. useState(0) means SSR + crawlers see "0" for everything
// 2. "500+ Businesses served" is fabricated
// 3. "6 ERP modules" is wrong — you have 8
// Fix: render real value in SSR, animate on top of it (not from 0)

const statBarPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'components', 'StatBar.tsx');

const newStatBar = `"use client";
import { useEffect, useRef, useState } from "react";

type Stat = { value: number; suffix: string; label: string; prefix?: string };

const stats: Stat[] = [
  { value: 8,    suffix: "",   label: "ERP modules included" },
  { value: 14,   suffix: " days", label: "Free trial, no card" },
  { value: 99.5, suffix: "%",  label: "Uptime target" },
  { value: 24,   suffix: "h",  label: "Support response" },
];

function Counter({ value, suffix, prefix }: { value: number; suffix: string; prefix?: string }) {
  // Start at final value so SSR + crawlers always see the real number
  const [count, setCount] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reset to 0 only after hydration (client-side) then animate up
    setCount(0);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1400;
        const steps = 50;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= value) { setCount(value); clearInterval(timer); }
          else { setCount(parseFloat(current.toFixed(1))); }
        }, duration / steps);
      }
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

export default function StatBar() {
  return (
    <section style={{ padding: "60px 40px", backgroundColor: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "30px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        {stats.map((s, i) => (
          <div key={i}>
            <p className="tight" style={{ fontSize: "42px", fontWeight: 700, color: "var(--accent)", margin: "0 0 6px 0" }}>
              <Counter value={s.value} suffix={s.suffix} prefix={s.prefix} />
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

fs.writeFileSync(statBarPath, newStatBar, { encoding: 'utf8' });
console.log('✅ StatBar.tsx fixed:');
console.log('   - SSR now renders real values (not 0)');
console.log('   - Honest stats: 8 modules, 14 days trial, 99.5% uptime, 24h support');
console.log('   - Removed fabricated "500+ Businesses served"');
console.log('   - Animation still plays on scroll (client-side only)');

// ── Also fix dashboard layout client-side redirect ─────────────────
// The dashboard layout does client-side redirect via window.location
// This means unauthenticated users briefly see the dashboard shell
// The proxy.ts handles server-side redirect but let's verify the
// client-side fallback is tight too — it already is, just flag it

console.log('\n✅ Dashboard layout: client-side auth fallback already present');
console.log('   proxy.ts handles server-side redirect (the important one)');
console.log('   dashboard/layout.tsx has client fallback as secondary guard');

console.log('\nRun: npm run build');
