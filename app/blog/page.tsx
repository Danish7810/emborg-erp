import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | EMBORG ERP — ERP Insights for Indian SMEs",
  description: "Guides, tips, and insights on running your business better — CRM, invoicing, inventory, HR, and cloud ERP for Indian small businesses.",
  alternates: { canonical: "https://www.emborgerp.com/blog" },
  openGraph: {
    title: "EMBORG ERP Blog",
    description: "Guides on cloud ERP, CRM, invoicing, and business operations for Indian SMEs.",
    url: "https://www.emborgerp.com/blog",
    siteName: "EMBORG ERP",
    type: "website",
  },
};

const posts = [
  {
    slug: "why-indian-smes-are-switching-to-cloud-erp",
    title: "Why Indian SMEs Are Ditching Spreadsheets for Cloud ERP in 2025",
    excerpt: "Over 73% of Indian SMEs still manage operations across disconnected tools. Here's the real cost — and how to fix it.",
    date: "July 2025",
    readTime: "12 min read",
    tag: "ERP Guide",
    tagColor: "#4F46E5",
  },
];

export default function BlogPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", color: "#1a1a1a" }}>
      <section style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 16 }}>EMBORG Blog</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
            Guides, tips, and insights on running your business better — ERP, CRM, invoicing, and operations for Indian SMEs.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ display: "grid", gap: 28 }}>
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "36px 40px", cursor: "pointer", transition: "box-shadow 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                  <span style={{ background: post.tagColor + "15", color: post.tagColor, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{post.tag}</span>
                  <span style={{ color: "#aaa", fontSize: 13 }}>{post.date} · {post.readTime}</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, lineHeight: 1.3, color: "#1a1a1a" }}>{post.title}</h2>
                <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>{post.excerpt}</p>
                <span style={{ color: "#4F46E5", fontWeight: 600, fontSize: 14 }}>Read article →</span>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 64, background: "#F8F7FF", borderRadius: 14, padding: "40px 36px", textAlign: "center" }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>More articles coming soon</h3>
          <p style={{ color: "#555", marginBottom: 24 }}>We write about ERP, CRM, invoicing, payroll, and running a better business. Subscribe to get notified.</p>
          <Link href="/contact" style={{ background: "#4F46E5", color: "#fff", padding: "12px 28px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>Get in touch</Link>
        </div>
      </section>
    </main>
  );
}
