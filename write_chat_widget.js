const fs = require("fs");

const widget = `"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm your EMBORG AI assistant. Ask me anything about your CRM, leads, finance, inventory, or HR data." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }]
      }));

      const res = await fetch(
        \`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${apiKey}\`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: "You are EMBORG AI, a smart ERP assistant for EMBORG — a cloud ERP platform for small and medium businesses. You help users manage their CRM contacts, leads pipeline, inventory, finance (invoices and expenses), and HR and payroll. Be concise, helpful, and professional. If asked about specific data you don't have access to, tell the user to check the relevant module in the dashboard. Always stay in the context of business operations and ERP workflows." }]
            },
            contents: [
              ...history,
              { role: "user", parts: [{ text }] }
            ],
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
          })
        }
      );

      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      setMessages([...newMessages, { role: "assistant", text: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", text: "Something went wrong. Please check your connection and try again." }]);
    }
    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 1000,
          width: "52px", height: "52px", borderRadius: "50%",
          backgroundColor: "var(--accent)", border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s"
        }}
        title="EMBORG AI Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: "88px", right: "24px", zIndex: 1000,
          width: "340px", height: "480px",
          backgroundColor: "var(--bg)", border: "1px solid var(--line)",
          borderRadius: "16px", boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid var(--line)",
            backgroundColor: "var(--accent)", display: "flex", alignItems: "center", gap: "10px"
          }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "white" }}>EMBORG AI</p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>Powered by Gemini</p>
            </div>
            <div style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ade80" }} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  backgroundColor: m.role === "user" ? "var(--accent)" : "var(--bg-alt)",
                  color: m.role === "user" ? "white" : "var(--ink)",
                  fontSize: "13px", lineHeight: 1.5, border: m.role === "assistant" ? "1px solid var(--line)" : "none"
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 13px", borderRadius: "14px 14px 14px 4px", backgroundColor: "var(--bg-alt)", border: "1px solid var(--line)", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--muted)", animation: "bounce 1s infinite", animationDelay: i * 0.15 + "s" }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px", borderTop: "1px solid var(--line)", display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything..."
              disabled={loading}
              style={{
                flex: 1, padding: "9px 13px", border: "1px solid var(--line)", borderRadius: "20px",
                backgroundColor: "var(--bg-alt)", color: "var(--ink)", fontSize: "13px", outline: "none"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "50%", border: "none",
                backgroundColor: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      <style>{\`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      \`}</style>
    </>
  );
}
`;

fs.mkdirSync("app/components", { recursive: true });
fs.writeFileSync("app/components/ChatWidget.tsx", widget, "utf8");
console.log("Done:", fs.statSync("app/components/ChatWidget.tsx").size, "bytes");
