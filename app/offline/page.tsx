"use client";
export default function OfflinePage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: "400px" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>📡</div>
        <h1 className="tight" style={{ fontSize: "26px", fontWeight: 800, color: "var(--ink)", margin: "0 0 12px 0" }}>You are offline</h1>
        <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 28px 0" }}>
          EMBORG needs an internet connection to load your business data. Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "12px 28px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
