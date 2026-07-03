"use client";
import { useEffect } from "react";


const PLANS = [
  {
    name: "Starter",
    price: 999,
    priceLabel: "INR 999",
    period: "/month",
    description: "Perfect for freelancers and micro businesses",
    color: "#3B82F6",
    features: ["Up to 100 contacts", "CRM and Leads", "Basic Inventory", "Finance tracking", "Email support"],
    popular: false,
  },
  {
    name: "Pro",
    price: 2499,
    priceLabel: "INR 2,499",
    period: "/month",
    description: "For growing SMEs that need more power",
    color: "#6366F1",
    features: ["Unlimited contacts", "Full CRM + Pipeline Analytics", "Advanced Inventory", "Invoicing + Expenses", "HR and Payroll", "AI Assistant", "Priority support"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 5999,
    priceLabel: "INR 5,999",
    period: "/month",
    description: "For established businesses at scale",
    color: "#10B981",
    features: ["Everything in Pro", "Multiple users", "Custom integrations", "Dedicated account manager", "SLA guarantee", "Custom reports", "API access"],
    popular: false,
  },
];

declare global { interface Window { Razorpay: any; } }

export default function PricingPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  function handleSubscribe(plan: typeof PLANS[0]) {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: plan.price * 100,
      currency: "INR",
      name: "EMBORG",
      description: plan.name + " Plan - Monthly Subscription",
      image: "/brand/logo.svg",
      handler: function(response: any) {
        alert("Payment successful! Payment ID: " + response.razorpay_payment_id + ". Welcome to EMBORG " + plan.name + "!");
      },
      prefill: { name: "", email: "", contact: "" },
      notes: { plan: plan.name },
      theme: { color: plan.color },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", padding: "60px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", backgroundColor: "#6366F122", borderRadius: "20px", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "#6366F1", fontWeight: 600 }}>Simple, transparent pricing</span>
          </div>
          <h1 className="tight" style={{ fontSize: "48px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0" }}>Choose your plan</h1>
          <p style={{ fontSize: "18px", color: "var(--muted)", maxWidth: "500px", margin: "0 auto" }}>Start free, scale as you grow. No hidden fees.</p>
          
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "start" }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              backgroundColor: "var(--bg-alt)", borderRadius: "20px", padding: "32px",
              border: plan.popular ? "2px solid " + plan.color : "1px solid var(--line)",
              position: "relative",
            }}>
              {plan.popular && (
                <div style={{
                  position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                  backgroundColor: plan.color, color: "white", fontSize: "12px", fontWeight: 700,
                  padding: "4px 16px", borderRadius: "20px", whiteSpace: "nowrap"
                }}>MOST POPULAR</div>
              )}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: plan.color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: plan.color }} />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>{plan.name}</h2>
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>{plan.description}</p>
              </div>
              <div style={{ marginBottom: "28px" }}>
                <span style={{ fontSize: "38px", fontWeight: 800, color: plan.color }}>{plan.priceLabel}</span>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--ink)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                style={{
                  width: "100%", padding: "14px", borderRadius: "12px",
                  backgroundColor: plan.popular ? plan.color : "var(--bg)",
                  color: plan.popular ? "white" : plan.color,
                  border: "2px solid " + plan.color,
                  fontSize: "15px", fontWeight: 700, cursor: "pointer"
                }}
              >
                Get started with {plan.name}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--muted)", marginTop: "40px" }}>
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </div>
  );
}
