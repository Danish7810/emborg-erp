"use client";
import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How can EMBORG help my retail business?",
  "What does the CRM module do?",
  "How much does EMBORG cost?",
  "How do I get started?",
];

export default function HeroChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setOpen(true);
    setLoading(true);
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I could not process that. Please try again or book a demo." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ marginTop: "32px", maxWidth: "540px" }}>
      {!open ? (
        <div>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 12px 0" }}>Have a question? Ask EMBORG AI:</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
              placeholder="How can EMBORG help my business?"
              style={{ flex: 1, padding: "11px 16px", border: "1px solid var(--line)", borderRadius: "24px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px", outline: "none" }}
            />
            <button onClick={() => sendMessage(input)} style={{ padding: "11px 18px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "24px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>Ask</button>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)} style={{ padding: "6px 12px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "transparent", color: "var(--muted)", fontSize: "12px", cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>EMBORG AI</span>
            <button onClick={() => { setOpen(false); setMessages([]); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>x</button>
          </div>
          <div style={{ padding: "16px", maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: "14px", backgroundColor: m.role === "user" ? "var(--accent)" : "var(--bg-alt)", color: m.role === "user" ? "white" : "var(--ink)", fontSize: "13px", lineHeight: 1.5 }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", borderRadius: "14px", backgroundColor: "var(--bg-alt)", color: "var(--muted)", fontSize: "13px" }}>Thinking...</div>
              </div>
            )}
          </div>
          <div style={{ padding: "12px", borderTop: "1px solid var(--line)", display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
              placeholder="Ask a follow-up..."
              style={{ flex: 1, padding: "9px 14px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", outline: "none" }}
            />
            <button onClick={() => sendMessage(input)} disabled={loading} style={{ padding: "9px 16px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "13px", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
