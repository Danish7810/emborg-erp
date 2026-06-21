"use client";
import { modules } from "../data";

const positions: Record<string, { x: number; y: number; path: string }> = {
  inventory: { x: 120, y: 94,  path: "M 120 128 Q 230 160 320 230" },
  finance:   { x: 580, y: 94,  path: "M 580 128 Q 470 160 380 230" },
  crm:       { x: 80,  y: 260, path: "M 160 260 Q 230 260 295 260" },
  hr:        { x: 620, y: 260, path: "M 540 260 Q 470 260 405 260" },
  sales:     { x: 120, y: 426, path: "M 120 392 Q 230 360 320 290" },
  projects:  { x: 580, y: 426, path: "M 580 392 Q 470 360 380 290" },
};

export default function ModulesInfographic({ onSelect, selectedId }: { onSelect: (id: string) => void; selectedId: string | null }) {
  return (
    <svg width="700" height="520" viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <defs>
        <radialGradient id="centerGrad" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </radialGradient>
      </defs>

      {modules.map((m) => (
        <path key={m.id} d={positions[m.id].path} fill="none" stroke={selectedId === m.id ? "#2563EB" : "#D4D4D1"} strokeWidth={selectedId === m.id ? 2.5 : 2} style={{ transition: "stroke 0.3s" }} />
      ))}

      {modules.map((m) => {
        const pos = positions[m.id];
        const active = selectedId === m.id;
        return (
          <g
            key={m.id}
            onClick={() => onSelect(m.id)}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${m.name}`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(m.id); }}
            style={{ cursor: "pointer", outline: "none" }}
          >
            <rect x={pos.x - 80} y={pos.y - 34} width="160" height="68" rx="14" fill={active ? "#EFF4FF" : "#FFFFFF"} stroke={active ? "#2563EB" : "#E5E5E0"} strokeWidth={active ? 2 : 1} />
            <text x={pos.x} y={pos.y - 4} textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="700" fill="#0A0A0A">{m.name.split(" ")[0]}</text>
            <text x={pos.x} y={pos.y + 16} textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="10.5" fill="#71717A">Click to explore</text>
          </g>
        );
      })}

      <g style={{ pointerEvents: "none" }}>
        <circle cx="350" cy="260" r="62" fill="url(#centerGrad)" />
        <text x="350" y="254" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="17" fontWeight="700" fill="white">EMBORG</text>
        <text x="350" y="274" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="11" fill="white" opacity="0.85">One platform</text>
      </g>
    </svg>
  );
}
