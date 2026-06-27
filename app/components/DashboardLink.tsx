"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

export default function DashboardLink() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setLoggedIn(true);
    });
  }, []);

  if (!loggedIn) return null;

  return (
    <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px", backgroundColor: "var(--bg-alt)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "20px", textDecoration: "none", fontWeight: 600, fontSize: "14px", marginTop: "12px" }}>
      Go to your Dashboard
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
