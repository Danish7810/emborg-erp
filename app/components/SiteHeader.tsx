"use client";
import { useState, useEffect } from "react";
import Footer from "./Footer";

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="var(--ink)" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteHeader({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("emborg-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("emborg-theme", next ? "dark" : "light");
  }

  return (
    <>
      <header style={{ borderBottom: "1px solid var(--line)", backgroundColor: "var(--bg)", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
            <img src="/brand/logo.svg" alt="EMBORG" width="26" height="26" />
            <span className="tight" style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
          </a>

          <nav className="nav-links">
            <a href="/" style={{ textDecoration: "none", color: "var(--muted)", fontSize: "14px" }}>Home</a>
            <a href="/features" style={{ textDecoration: "none", color: "var(--muted)", fontSize: "14px" }}>Features</a>
            <a href="/pricing" style={{ textDecoration: "none", color: "var(--muted)", fontSize: "14px" }}>Pricing</a>
            <a href="/contact" style={{ textDecoration: "none", color: "var(--muted)", fontSize: "14px" }}>Contact</a>
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle dark mode">
              {dark ? <MoonIcon /> : <SunIcon />}
            </button>
            <a href="/contact" style={{ backgroundColor: "var(--accent)", color: "white", padding: "9px 18px", borderRadius: "20px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>Request Demo</a>
          </nav>

          <button onClick={() => setOpen(!open)} className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} style={{ background: "none", border: "none", padding: "6px", cursor: "pointer" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path d="M6 6L18 18M6 18L18 6" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7H20M4 12H20M4 17H20" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        <div className={open ? "nav-mobile-panel open" : "nav-mobile-panel"}>
          <a href="/" onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "var(--ink)", fontSize: "16px", padding: "10px 0" }}>Home</a>
          <a href="/features" onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "var(--ink)", fontSize: "16px", padding: "10px 0" }}>Features</a>
          <a href="/pricing" onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "var(--ink)", fontSize: "16px", padding: "10px 0" }}>Pricing</a>
          <a href="/contact" onClick={() => setOpen(false)} style={{ textDecoration: "none", color: "var(--ink)", fontSize: "16px", padding: "10px 0" }}>Contact</a>
          <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--ink)", fontSize: "16px", padding: "10px 0", cursor: "pointer", textAlign: "left" }}>
            {dark ? <MoonIcon /> : <SunIcon />}
            <span>{dark ? "Dark mode" : "Light mode"}</span>
          </button>
          <a href="/contact" onClick={() => setOpen(false)} style={{ backgroundColor: "var(--accent)", color: "white", padding: "11px 18px", borderRadius: "20px", fontSize: "15px", fontWeight: 600, textDecoration: "none", textAlign: "center", marginTop: "8px" }}>Request Demo</a>
        </div>
      </header>

      <div>{children}</div>
      <Footer />
    </>
  );
}
