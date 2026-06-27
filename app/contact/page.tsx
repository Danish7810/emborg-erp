"use client";
import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("https://formspree.io/f/mlgyrlzv", { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (res.ok) { setStatus("success"); form.reset(); }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
  }

  return (
    <main>
      <section style={{ padding: "80px 40px 40px", textAlign: "center", maxWidth: "700px", margin: "0 auto" }} >
        <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 12px 0" }}>Get in touch</p>
        <h1 className="tight" style={{ fontSize: "40px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>Talk to the EMBORG team</h1>
        <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>Book a free 30-minute demo call, or send us a message and we will get back to you within 24 hours.</p>
      </section>

      <section style={{ padding: "20px 40px 80px", maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
        <div style={{ padding: "32px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg-alt)" }}>
          <h2 className="tight" style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0" }}>Book a demo call</h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px 0", lineHeight: 1.5 }}>Pick a time that works for you. 30 minutes on Google Meet, no commitment required.</p>
          <a href="https://calendly.com/kazidanish-er/30min" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-block", padding: "12px 24px", backgroundColor: "var(--accent)", color: "white", borderRadius: "20px", textDecoration: "none", fontWeight: 600, fontSize: "15px", marginBottom: "20px" }}>
            Book a free demo
          </a>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {["30 minutes via Google Meet", "See EMBORG live on your use case", "No credit card required", "Get answers to your questions"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "32px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)" }}>
          <h2 className="tight" style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0" }}>Send a message</h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 24px 0" }}>Prefer email? Fill in the form and we will reply within 24 hours.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input name="name" placeholder="Full Name" required style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
            <input name="company" placeholder="Company Name" style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
            <input name="email" type="email" placeholder="Email Address" required style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
            <textarea name="message" placeholder="Your Requirements" rows={4} style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
            <button type="submit" disabled={status === "sending"} className="btn-primary" style={{ padding: "12px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "15px", cursor: "pointer", opacity: status === "sending" ? 0.6 : 1 }}>
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>
            {status === "success" && <p style={{ color: "#16a34a", textAlign: "center", fontSize: "14px", margin: 0 }}>Thank you! We will contact you shortly.</p>}
            {status === "error" && <p style={{ color: "#dc2626", textAlign: "center", fontSize: "14px", margin: 0 }}>Something went wrong. Please try again.</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
