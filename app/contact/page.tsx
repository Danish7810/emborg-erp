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
      const res = await fetch("https://formspree.io/f/mlgyrlzv", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <main style={{ padding: "80px 20px", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center", fontSize: "36px", color: "#0f172a", marginBottom: "10px" }}>
        Request a Free Demo
      </h1>
      <p style={{ textAlign: "center", color: "#64748b", marginBottom: "40px" }}>
        Tell us about your business and we will get back to you within 24 hours.
      </p>

      <form onSubmit={handleSubmit} style={{
        maxWidth: "500px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "15px"
      }}>
        <input name="name" placeholder="Full Name" required style={{
          padding: "12px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px"
        }} />

        <input name="company" placeholder="Company Name" required style={{
          padding: "12px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px"
        }} />

        <input name="email" type="email" placeholder="Email Address" required style={{
          padding: "12px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px"
        }} />

        <textarea name="message" placeholder="Your Requirements" rows={4} style={{
          padding: "12px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px"
        }} />

        <button type="submit" disabled={status === "sending"} style={{
          padding: "12px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          opacity: status === "sending" ? 0.6 : 1
        }}>
          {status === "sending" ? "Sending..." : "Submit Request"}
        </button>

        {status === "success" && (
          <p style={{ color: "#16a34a", textAlign: "center" }}>
            Thank you! We will contact you shortly.
          </p>
        )}
        {status === "error" && (
          <p style={{ color: "#dc2626", textAlign: "center" }}>
            Something went wrong. Please try again or email us directly.
          </p>
        )}
      </form>
    </main>
  );
}
