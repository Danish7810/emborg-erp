-- ═══════════════════════════════════════════════════════════════════
-- EMBORG — Phase 2C: Unified Fulfillment
-- Run in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════════
--
-- CURRENT RISK: sales_order_items.delivered_qty was maintained by
-- exactly one place -- the Sales Order page's manual "Fulfill" button,
-- a free-text quantity entry with no relationship to physical stock
-- at all. Delivery Note dispatch, which is the thing that actually
-- moves inventory, never touched delivered_qty. Two independent,
-- non-synchronized ways to describe "how much has been delivered."
--
-- FIX (this migration + the application changes in the same commit):
-- delivery_note_items gains a nullable sales_order_item_id FK, so a
-- dispatched line can be attributed back to the exact order line it
-- fulfills. A new RPC, dispatch_stock_for_line(), composes the two
-- RPCs from the previous two phases (record_stock_movement from Phase
-- 2a, consume_reservation from Phase 2B) as ordinary SQL function
-- calls -- which execute inside the SAME transaction as the calling
-- function, since PL/pgSQL functions don't open their own nested
-- transactions -- and adds delivered_qty + sales_orders.status
-- updates in that same transaction. This satisfies "inside one
-- transaction" for inventory, ledger, reservation, and delivered
-- quantity together, without duplicating any of the row-locking or
-- ledger logic already tested in the prior two phases.
--
-- The Sales Order's "Fulfill" button and its manual delivered_qty
-- entry are removed in the application code in this same commit --
-- delivered_qty and sales_orders.status (confirmed -> in_progress ->
-- completed) are now derived exclusively from dispatch_stock_for_line,
-- never settable independently. "draft", "confirmed", "cancelled"
-- remain user-selectable on the Sales Order status dropdown; the
-- system moves an order to "in_progress"/"completed" itself as
-- dispatches happen against it.
--
-- WHY status is only ever auto-ADVANCED, never auto-downgraded: this
-- function only touches sales_orders.status when its current value is
-- 'confirmed' or 'in_progress' -- a 'cancelled' or 'draft' order is
-- never touched by this logic, and a 'completed' order that somehow
-- gets a late dispatch against it (shouldn't happen in normal use,
-- since delivery-notes/page.tsx only offers 'confirmed'/'in_progress'
-- orders when creating a delivery note "from Sales Order") won't be
-- silently reopened either.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.delivery_note_items
  ADD COLUMN IF NOT EXISTS sales_order_item_id uuid REFERENCES public.sales_order_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_note_items_sales_order_item
  ON public.delivery_note_items (sales_order_item_id)
  WHERE sales_order_item_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.dispatch_stock_for_line(
  p_inventory_id uuid,
  p_qty numeric,
  p_item_name text,
  p_company_id uuid,
  p_reference_id uuid,
  p_notes text,
  p_sales_order_id uuid DEFAULT NULL,
  p_sales_order_item_id uuid DEFAULT NULL
)
RETURNS TABLE (new_balance numeric, applied_delta numeric, reservation_consumed numeric, delivered_qty numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_movement RECORD;
  v_consumed numeric := 0;
  v_new_delivered numeric := NULL;
  v_derived_status text;
BEGIN
  -- 1 + 2: atomic inventory update + ledger insert, reusing the
  -- already-tested Phase 2a function. clamp_to_available = true
  -- preserves the existing dispatch behavior exactly (warn, don't
  -- block, on insufficient stock).
  SELECT * INTO v_movement
  FROM public.record_stock_movement(
    p_inventory_id, -p_qty, 'sale', p_item_name, p_company_id,
    'delivery_note', p_reference_id, p_notes, true
  );

  -- 3: consume reservation for the ACTUAL applied delta (may be less
  -- than p_qty if clamped above), reusing the already-tested Phase 2B
  -- function -- same transaction, so a failure anywhere in this
  -- function rolls back the inventory/ledger change too.
  IF p_sales_order_id IS NOT NULL THEN
    v_consumed := public.consume_reservation(p_sales_order_id, p_inventory_id, ABS(v_movement.applied_delta));
  END IF;

  -- 4: delivered_qty on the specific order line, same transaction.
  -- LEAST(...) guards against ever exceeding the ordered quantity even
  -- in an edge case (e.g. a from-scratch top-up line dispatched beyond
  -- what was reserved).
  IF p_sales_order_item_id IS NOT NULL THEN
    UPDATE public.sales_order_items
    SET delivered_qty = LEAST(qty, COALESCE(delivered_qty, 0) + ABS(v_movement.applied_delta))
    WHERE id = p_sales_order_item_id
    RETURNING delivered_qty INTO v_new_delivered;
  END IF;

  -- Roll up the order's own status from its items' delivered_qty,
  -- same transaction -- this is what makes fulfillment status derived
  -- rather than independently settable. Only touches orders currently
  -- 'confirmed' or 'in_progress' -- see header note.
  IF p_sales_order_id IS NOT NULL THEN
    PERFORM 1 FROM public.sales_orders
    WHERE id = p_sales_order_id AND status IN ('confirmed', 'in_progress');

    IF FOUND THEN
      SELECT
        CASE
          WHEN bool_and(delivered_qty >= qty) THEN 'completed'
          WHEN bool_or(delivered_qty > 0) THEN 'in_progress'
          ELSE NULL
        END
      INTO v_derived_status
      FROM public.sales_order_items
      WHERE sales_order_id = p_sales_order_id;

      IF v_derived_status IS NOT NULL THEN
        UPDATE public.sales_orders SET status = v_derived_status WHERE id = p_sales_order_id;
      END IF;
    END IF;
  END IF;

  RETURN QUERY SELECT v_movement.new_balance, v_movement.applied_delta, v_consumed, v_new_delivered;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispatch_stock_for_line(
  uuid, numeric, text, uuid, uuid, text, uuid, uuid
) TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- VERIFY — run after applying
-- ───────────────────────────────────────────────────────────────────
-- 1. Confirm the column and function exist:
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'delivery_note_items' AND column_name = 'sales_order_item_id';
SELECT proname FROM pg_proc WHERE proname = 'dispatch_stock_for_line';

-- 2. Dispatch a Delivery Note created "from Sales Order" (so its lines
--    carry sales_order_item_id). Expect, all from one dispatch click:
--    inventory.quantity decreased, a new stock_ledger_entries row,
--    the matching stock_reservations row's fulfilled_quantity
--    increased, sales_order_items.delivered_qty increased, and (once
--    fully delivered) sales_orders.status flips to 'completed'
--    automatically -- no separate "Fulfill" action needed.

-- 3. Dispatch a from-scratch Delivery Note (no sales_order_id/
--    sales_order_item_id on its lines) -- expect inventory/ledger to
--    update exactly as before, and no error from the NULL-guarded
--    reservation/delivered_qty/status branches.

-- ───────────────────────────────────────────────────────────────────
-- 🔙 ROLLBACK
-- ───────────────────────────────────────────────────────────────────
-- DROP FUNCTION IF EXISTS public.dispatch_stock_for_line(uuid, numeric, text, uuid, uuid, text, uuid, uuid);
-- ALTER TABLE public.delivery_note_items DROP COLUMN IF EXISTS sales_order_item_id;
-- Roll back the application code first -- it calls dispatch_stock_for_line
-- unconditionally on dispatch once this ships, and no longer offers a
-- manual Fulfill path to fall back to.
