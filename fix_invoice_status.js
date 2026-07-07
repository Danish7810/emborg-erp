const fs = require("fs");
let content = fs.readFileSync("app/dashboard/sales-orders/page.tsx", "utf8");

content = content.replace(
  `status: "pending", due_date: so.delivery_date || null, company_id: profile.company_id,`,
  `status: "sent", due_date: so.delivery_date || null, company_id: profile.company_id,`
);

fs.writeFileSync("app/dashboard/sales-orders/page.tsx", content, "utf8");
console.log("Fixed. New size:", fs.statSync("app/dashboard/sales-orders/page.tsx").size, "bytes");
