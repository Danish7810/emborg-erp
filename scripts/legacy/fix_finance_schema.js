const fs = require("fs");
let content = fs.readFileSync("app/dashboard/finance/page.tsx", "utf8");

let changes = 0;

if (content.includes("inv.number")) { content = content.replace(/inv\.number/g, "inv.invoice_number"); changes++; }
if (content.includes("inv.client")) { content = content.replace(/inv\.client\b/g, "inv.client_name"); changes++; }

// Also fix the Invoice type definition if it uses old names
content = content.replace(
  /type Invoice = \{[^}]*\};/,
  `type Invoice = { id: string; invoice_number: string; client_name: string; amount: number; status: string; due_date: string; created_at: string; };`
);

fs.writeFileSync("app/dashboard/finance/page.tsx", content, "utf8");
console.log("Replacements made. New size:", fs.statSync("app/dashboard/finance/page.tsx").size, "bytes");

// Verify no old references remain
const remaining = (content.match(/inv\.number|inv\.client\b/g) || []).length;
console.log("Old references remaining:", remaining);
