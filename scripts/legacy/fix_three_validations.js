const fs = require("fs");

// ============ FIX 1: Sales Orders - lock quotation after conversion ============
let so = fs.readFileSync("app/dashboard/sales-orders/page.tsx", "utf8");

so = so.replace(
  `      const number = "SO-" + new Date().getFullYear() + "-" + String(orders.length + 1).padStart(4, "0");
      const { data: created, error } = await supabase.from("sales_orders").insert({ ...payload, number }).select().single();
      if (error || !created) { showToast("Failed to save sales order", false); setSaving(false); return; }
      soId = created.id;
    }`,
  `      const number = "SO-" + new Date().getFullYear() + "-" + String(orders.length + 1).padStart(4, "0");
      const { data: created, error } = await supabase.from("sales_orders").insert({ ...payload, number }).select().single();
      if (error || !created) { showToast("Failed to save sales order", false); setSaving(false); return; }
      soId = created.id;
      if (fromQuotationId) {
        await supabase.from("quotations").update({ status: "converted" }).eq("id", fromQuotationId);
      }
    }`
);

fs.writeFileSync("app/dashboard/sales-orders/page.tsx", so, "utf8");
console.log("Fix 1 (Sales Orders quote lock):", so.includes('status: "converted" }).eq("id", fromQuotationId)') ? "APPLIED" : "FAILED - pattern not found");

// ============ FIX 2: Purchase Orders - cap received qty at remaining ordered qty ============
let po = fs.readFileSync("app/dashboard/purchase-orders/page.tsx", "utf8");

po = po.replace(
  `      const receiveNow = receiveQtys[item.id] || 0;
      if (receiveNow <= 0) { if ((item.received_qty || 0) < item.qty) allReceived = false; continue; }`,
  `      const remaining = item.qty - (item.received_qty || 0);
      let receiveNow = receiveQtys[item.id] || 0;
      if (receiveNow > remaining) {
        showToast("Capped receipt for " + item.item_name + " to remaining qty (" + remaining + ")", false);
        receiveNow = remaining;
      }
      if (receiveNow <= 0) { if ((item.received_qty || 0) < item.qty) allReceived = false; continue; }`
);

fs.writeFileSync("app/dashboard/purchase-orders/page.tsx", po, "utf8");
console.log("Fix 2 (PO over-receive cap):", po.includes("Capped receipt for") ? "APPLIED" : "FAILED - pattern not found");

// ============ FIX 3: Delivery Notes - warn on insufficient stock instead of silently clamping ============
let dn = fs.readFileSync("app/dashboard/delivery-notes/page.tsx", "utf8");

dn = dn.replace(
  `      const { data: invItem } = await supabase.from("inventory").select("quantity").eq("id", item.inventory_id).single();
      const currentQty = invItem?.quantity || 0;
      const newBalance = Math.max(0, currentQty - item.qty);
      await supabase.from("inventory").update({ quantity: newBalance }).eq("id", item.inventory_id);`,
  `      const { data: invItem } = await supabase.from("inventory").select("quantity").eq("id", item.inventory_id).single();
      const currentQty = invItem?.quantity || 0;
      if (item.qty > currentQty) {
        showToast("Warning: dispatching " + item.qty + " but only " + currentQty + " in stock for " + item.item_name, false);
      }
      const newBalance = Math.max(0, currentQty - item.qty);
      await supabase.from("inventory").update({ quantity: newBalance }).eq("id", item.inventory_id);`
);

fs.writeFileSync("app/dashboard/delivery-notes/page.tsx", dn, "utf8");
console.log("Fix 3 (Delivery Notes stock warning):", dn.includes("Warning: dispatching") ? "APPLIED" : "FAILED - pattern not found");
