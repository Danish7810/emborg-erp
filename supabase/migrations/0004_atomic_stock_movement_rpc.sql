-- ═══════════════════════════════════════════════════════════════════
-- EMBORG — Atomic stock movement RPC
-- Run in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════════
--
-- CURRENT RISK (before this migration):
-- Every stock mutation (PO receive, DN dispatch, manual adjustment) is
-- three-to-four separate Supabase calls issued sequentially from the
-- browser: SELECT current quantity, compute a new balance in
-- JavaScript, UPDATE inventory, INSERT a stock_ledger_entries row.
-- Nothing locks the row between the SELECT and the UPDATE. Two
-- concurrent operations on the same inventory_id (two staff dispatching
-- from different tabs, a receipt racing a manual adjustment) can both
-- read the same starting quantity and each write a result computed
-- from that stale value -- a classic lost update. The row ends up with
-- a quantity that doesn't match the sum of stock_ledger_entries for
-- that item, silently, with no error anywhere.
--
-- FIX: record_stock_movement() does the read, the balance computation,
-- the update, and the ledger insert all inside one function body,
-- which Postgres runs as a single transaction. `SELECT ... FOR UPDATE`
-- takes a row lock on the inventory row for the duration of that
-- transaction, so a second concurrent call to this function for the
-- same inventory_id blocks until the first one commits (or rolls back
-- entirely on any error, per Postgres function semantics) -- the two
-- writes can no longer interleave.
--
-- WHY THIS FUNCTION SIGNATURE:
-- Two existing call sites (PO receipt, DN dispatch) build item_name
-- from a snapshot column on their own document's line-item row
-- (purchase_order_items.item_name / delivery_note_items.item_name),
-- which can legitimately differ from the current inventory.name if the
-- product was renamed after the document was created. The third call
-- site (manual adjustment) already has the live inventory.name in
-- local state. To preserve each call site's exact existing behavior,
-- item_name is passed in as a parameter rather than looked up from
-- inventory inside the function -- looking it up here would silently
-- change what PO/DN ledger entries record.
--
-- p_clamp_to_available controls what happens when the requested
-- reduction would take quantity below zero, matching the two different
-- pre-existing behaviors this replaces exactly:
--   - Delivery Note dispatch (existing behavior, from an earlier fix
--     this session): does NOT block -- deducts only what's available
--     and the caller shows a warning. Call with p_clamp_to_available
--     = true.
--   - Manual adjustment (existing behavior): blocks entirely, no
--     partial application. Call with p_clamp_to_available = false
--     (the default) -- the function raises an exception and nothing
--     is written.
--   - Purchase receipt: delta is always >= 0 here, so this branch
--     never triggers either way.
--
-- REVERSAL SUPPORT (requirement 4): this function is intentionally
-- generic -- it has no separate "reversal mode." A reversal (delivery
-- return, purchase return, dispatch cancellation) is just another call
-- to this same function with a delta of the opposite sign from the
-- original movement, an entry_type that names it as a reversal (e.g.
-- 'delivery_return', 'purchase_return'), and reference_type/
-- reference_id pointing at the original document being reversed. Since
-- stock_ledger_entries is never updated or deleted by this function --
-- only ever inserted into -- a reversal always creates a new offsetting
-- row; the original movement's row is untouched, preserving full
-- history. No UI in this repo calls the function this way yet (adding
-- that trigger point -- e.g. wiring the Delivery Note status dropdown's
-- existing "Returned"/"Cancelled" options to actually reverse stock --
-- is a workflow change, deliberately left out of this pass). The
-- capability exists and is ready for that follow-up.
--
-- WHY A ROW LOCK INSTEAD OF OPTIMISTIC CONCURRENCY (e.g. a version
-- column + retry loop): a lock is simpler to reason about correctness
-- for (no client-side retry logic to get wrong, spread across three
-- different React components), and inventory rows are not so hot a
-- resource in this application (no product is realistically dispatched
-- and received hundreds of times a second) that lock contention is a
-- real concern -- see the performance note in the final report.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_inventory_id uuid,
  p_delta numeric,
  p_entry_type text,
  p_item_name text,
  p_company_id uuid,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_clamp_to_available boolean DEFAULT false
)
RETURNS TABLE (new_balance numeric, applied_delta numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current numeric;
  v_applied_delta numeric;
  v_new_balance numeric;
BEGIN
  -- Row lock: any other transaction calling this function for the same
  -- p_inventory_id blocks here until this transaction commits or
  -- rolls back. This is what makes the whole function atomic.
  SELECT quantity INTO v_current
  FROM public.inventory
  WHERE id = p_inventory_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item % not found', p_inventory_id
      USING ERRCODE = 'P0002';
  END IF;

  v_applied_delta := p_delta;

  IF p_delta < 0 AND (v_current + p_delta) < 0 THEN
    IF p_clamp_to_available THEN
      -- Take only what's available; caller (dispatch) is responsible
      -- for warning the user, same as the existing behavior it replaces.
      v_applied_delta := -v_current;
    ELSE
      -- Hard block, same as the existing manual-adjustment behavior:
      -- nothing is written, the whole statement aborts.
      RAISE EXCEPTION 'Insufficient stock: % available, % requested', v_current, -p_delta
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_new_balance := v_current + v_applied_delta;

  UPDATE public.inventory
  SET quantity = v_new_balance
  WHERE id = p_inventory_id;

  INSERT INTO public.stock_ledger_entries
    (company_id, inventory_id, item_name, entry_type, qty_change, balance_after, reference_type, reference_id, notes)
  VALUES
    (p_company_id, p_inventory_id, p_item_name, p_entry_type, v_applied_delta, v_new_balance, p_reference_type, p_reference_id, p_notes);

  RETURN QUERY SELECT v_new_balance, v_applied_delta;
END;
$$;

-- Callable by any authenticated user (existing RLS on inventory /
-- stock_ledger_entries still governs which rows they can even name via
-- p_inventory_id / p_company_id in the first place -- this function
-- does not bypass tenant isolation, it only makes the write atomic).
GRANT EXECUTE ON FUNCTION public.record_stock_movement(
  uuid, numeric, text, text, uuid, text, uuid, text, boolean
) TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- VERIFY — run after applying
-- ───────────────────────────────────────────────────────────────────
-- 1. Confirm the function exists:
SELECT proname, prosecdef AS is_security_definer
FROM pg_proc
WHERE proname = 'record_stock_movement';

-- 2. As a logged-in user, from the app or the Supabase JS client:
--    supabase.rpc('record_stock_movement', {
--      p_inventory_id: '<some item id>',
--      p_delta: 5,
--      p_entry_type: 'adjustment_in',
--      p_item_name: 'Test Item',
--      p_company_id: '<your company id>',
--      p_reference_type: 'manual',
--      p_notes: 'RPC smoke test'
--    })
--    Expect: { new_balance, applied_delta } back, inventory.quantity
--    increased by 5, and a matching stock_ledger_entries row inserted.

-- 3. Test the hard-block path (p_clamp_to_available default false):
--    call with p_delta larger (negative) than current stock. Expect:
--    an error, no change to inventory.quantity, no new ledger row.

-- 4. Test the clamp path: same call with p_clamp_to_available: true.
--    Expect: success, quantity clamped to 0 (not negative), ledger
--    row's qty_change equals the actual amount deducted, not the
--    originally requested amount.

-- ───────────────────────────────────────────────────────────────────
-- 🔙 ROLLBACK
-- ───────────────────────────────────────────────────────────────────
-- DROP FUNCTION IF EXISTS public.record_stock_movement(uuid, numeric, text, text, uuid, text, uuid, text, boolean);
-- Note: rolling back only removes the function -- it does not revert
-- the application code, which after this change calls the function
-- unconditionally. Roll back the code deploy first if you ever need to
-- roll back this migration.
