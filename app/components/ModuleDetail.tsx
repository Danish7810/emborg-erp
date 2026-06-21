"use client";
import { Module } from "../data";

export default function ModuleDetail({ module }: { module: Module | null }) {
  if (!module) {
    return (
      <div style={{ padding: "28px", border: "1px dashed var(--line)", borderRadius: "16px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
        Click any module above to see how EMBORG helps.
      </div>
    );
  }

  return (
    <div style={{ padding: "28px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg)" }}>
      <h3 className="tight" style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>{module.name}</h3>

      <p style={{ fontSize: "15px", color: "var(--muted)", margin: "0 0 10px 0", lineHeight: 1.5 }}>
        <strong style={{ color: "var(--ink)" }}>The problem: </strong>{module.problem}
      </p>

      <p style={{ fontSize: "15px", color: "var(--accent)", margin: "0 0 22px 0", lineHeight: 1.5, fontWeight: 600 }}>
        {module.outcome}
      </p>

      <div style={{ padding: "18px", backgroundColor: "var(--bg-alt)", borderRadius: "12px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 8px 0" }}>Real-world impact</p>
        <p style={{ fontSize: "14px", color: "var(--ink)", margin: 0, lineHeight: 1.6 }}>{module.story}</p>
      </div>
    </div>
  );
}
