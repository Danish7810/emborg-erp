"use client";
import { useEffect, useRef, useState } from "react";

type Stat = { value: number; suffix: string; label: string };

const stats: Stat[] = [
  { value: 500, suffix: "+", label: "Businesses served" },
  { value: 6, suffix: "", label: "ERP modules" },
  { value: 99.9, suffix: "%", label: "Uptime guaranteed" },
  { value: 24, suffix: "h", label: "Support response" }
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1600;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= value) { setCount(value); clearInterval(timer); }
          else { setCount(parseFloat(current.toFixed(1))); }
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function StatBar() {
  return (
    <section style={{ padding: "60px 40px", backgroundColor: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "30px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        {stats.map((s, i) => (
          <div key={i}>
            <p className="tight" style={{ fontSize: "42px", fontWeight: 700, color: "var(--accent)", margin: "0 0 6px 0" }}>
              <Counter value={s.value} suffix={s.suffix} />
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
