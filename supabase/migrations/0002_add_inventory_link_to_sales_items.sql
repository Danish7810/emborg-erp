-- ═══════════════════════════════════════════════════════════════════
-- EMBORG — Link Quotation & Sales Order lines to Inventory
-- Run in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════════
-- Why: quotation_items and sales_order_items currently store item_name
-- as free text with no link back to the inventory catalog. Because of
-- that, delivery notes generated "from a Sales Order" inherit an empty
-- inventory_id on every line, and stock dispatch silently skips
-- deduction for those lines (see app/dashboard/delivery-notes/page.tsx,
-- handleDispatch: `if (!item.inventory_id) continue;`).
--
-- This migration only adds a nullable, optional column. It does not
-- touch existing rows, does not make the link mandatory (so free-text
-- / custom line items with no catalog match keep working exactly as
-- before), and is idempotent — safe to run even if already applied.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.quotation_items
  ADD COLUMN IF NOT EXISTS inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL;

ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────────
-- VERIFY — run after applying, confirm both columns exist
-- ───────────────────────────────────────────────────────────────────
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('quotation_items', 'sales_order_items')
  AND column_name = 'inventory_id';
-- Expect 2 rows back, both is_nullable = 'YES'.

-- ───────────────────────────────────────────────────────────────────
-- 🔙 ROLLBACK (only if needed — safe, drops nothing but this column)
-- ───────────────────────────────────────────────────────────────────
-- ALTER TABLE public.quotation_items DROP COLUMN IF EXISTS inventory_id;
-- ALTER TABLE public.sales_order_items DROP COLUMN IF EXISTS inventory_id;
