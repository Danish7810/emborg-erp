const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

// ═══════════════════════════════════════════════════════════════════
// 1. INVENTORY PAGE — call notify-low-stock after save
// ═══════════════════════════════════════════════════════════════════
const invPath = path.join(ROOT, 'app', 'dashboard', 'inventory', 'page.tsx');
let inv = fs.readFileSync(invPath, 'utf8');

// Add a helper to call the notify API right after successful save (insert or update)
inv = inv.replace(
  `    if (editing) {
      const { error: err } = await supabase.from("inventory").update(payload).eq("id", editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { data: companyData, error: fnError } = await supabase.rpc("get_my_company_id");
      if (fnError || !companyData) { setError("Could not get company: " + (fnError?.message || "no company found")); setSaving(false); return; }
      const { error: insertError } = await supabase.from("inventory").insert({ ...payload, company_id: companyData });
      if (insertError) { setError(insertError.message); setSaving(false); return; }
    }

    setShowForm(false);
    setSaving(false);
    fetchItems();`,
  `    let savedItemId: string | null = null;

    if (editing) {
      const { error: err } = await supabase.from("inventory").update(payload).eq("id", editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
      savedItemId = editing.id;
    } else {
      const { data: companyData, error: fnError } = await supabase.rpc("get_my_company_id");
      if (fnError || !companyData) { setError("Could not get company: " + (fnError?.message || "no company found")); setSaving(false); return; }
      const { data: inserted, error: insertError } = await supabase.from("inventory").insert({ ...payload, company_id: companyData }).select("id").single();
      if (insertError) { setError(insertError.message); setSaving(false); return; }
      savedItemId = inserted?.id ?? null;
    }

    // Fire-and-forget: check if this item is now at/below its low-stock threshold and notify admins.
    // Not awaited on purpose — we don't want a slow email send to delay the UI.
    if (savedItemId && payload.quantity <= payload.low_stock_alert) {
      fetch("/api/notify-low-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: savedItemId }),
      }).catch(() => { /* non-critical — silently ignore notification failures */ });
    }

    setShowForm(false);
    setSaving(false);
    fetchItems();`
);

fs.writeFileSync(invPath, inv, 'utf8');
console.log('✅ inventory/page.tsx: low-stock notification wired into handleSave');
console.log('   Fires after add OR edit, only when quantity <= low_stock_alert');

// ═══════════════════════════════════════════════════════════════════
// 2. HR PAGE — call notify-leave-status after approve/reject
// ═══════════════════════════════════════════════════════════════════
const hrPath = path.join(ROOT, 'app', 'dashboard', 'hr', 'page.tsx');
let hr = fs.readFileSync(hrPath, 'utf8');

hr = hr.replace(
  `  async function handleLeaveStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("leave_requests").update({ status }).eq("id", id);
    fetchData();
  }`,
  `  async function handleLeaveStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("leave_requests").update({ status }).eq("id", id);

    // Fire-and-forget: email the employee that their leave was approved/rejected.
    // Not awaited on purpose — don't block the UI refresh on email delivery.
    fetch("/api/notify-leave-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveRequestId: id }),
    }).catch(() => { /* non-critical — silently ignore notification failures */ });

    fetchData();
  }`
);

fs.writeFileSync(hrPath, hr, 'utf8');
console.log('✅ hr/page.tsx: leave status notification wired into handleLeaveStatus');
console.log('   Fires on both Approve and Reject clicks');

console.log('\nRun: npm run build');
