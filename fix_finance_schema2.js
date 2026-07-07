const fs = require("fs");
let content = fs.readFileSync("app/dashboard/finance/page.tsx", "utf8");

let before = content;

// Catch any remaining variable name variants: invoice.number, invoice.client
content = content.replace(/invoice\.number/g, "invoice.invoice_number");
content = content.replace(/invoice\.client\b/g, "invoice.client_name");

fs.writeFileSync("app/dashboard/finance/page.tsx", content, "utf8");

const changed = before !== content;
console.log("Changed:", changed);
console.log("New size:", fs.statSync("app/dashboard/finance/page.tsx").size, "bytes");

// Final check across whole file for ANY remaining old-schema references
const remaining = (content.match(/\b(inv|invoice)\.(number|client)\b/g) || []);
console.log("Remaining old references:", remaining.length, remaining);
