const fs = require("fs");
let content = fs.readFileSync("app/dashboard/payments/page.tsx", "utf8");

// Fix type definition
content = content.replace(
  `type Invoice = { id: string; number: string; client: string; amount: number; status: string; };`,
  `type Invoice = { id: string; invoice_number: string; client_name: string; amount: number; status: string; };`
);

// Fix the select query
content = content.replace(
  `supabase.from("invoices").select("id, number, client, amount, status").neq("status", "draft").order("number"),`,
  `supabase.from("invoices").select("id, invoice_number, client_name, amount, status").order("invoice_number"),`
);

// Fix all references to inv.number -> inv.invoice_number, inv.client -> inv.client_name
content = content.replace(/inv\.number/g, "inv.invoice_number");
content = content.replace(/inv\.client\b/g, "inv.client_name");
content = content.replace(/selectedInvoice\.number/g, "selectedInvoice.invoice_number");
content = content.replace(/selectedInvoice\.client/g, "selectedInvoice.client_name");

fs.writeFileSync("app/dashboard/payments/page.tsx", content, "utf8");
console.log("Fixed. Verifying no old references remain:");
const remaining = (content.match(/inv\.client[^_]|inv\.number/g) || []).length;
console.log("Old references left:", remaining);
console.log("New size:", fs.statSync("app/dashboard/payments/page.tsx").size, "bytes");
