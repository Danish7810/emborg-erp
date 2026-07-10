-- ═══════════════════════════════════════════════════════════════════
-- EMBORG — Phase 2B: Stock Reservation System
-- Run in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════════
--
-- WHY A TABLE, NOT A COUNTER COLUMN:
-- A mutable reserved_quantity counter on inventory would repeat the
-- exact mistake this whole audit keeps finding elsewhere: a number
-- that's supposed to reflect reality but nothing guarantees it stays
-- reconciled with the reservations that produced it, and it gives you
-- no way to answer "which sales order is holding this stock, and
-- since when." stock_reservations is one row per reservation,
-- individually auditable, exactly as required. "available" is never
-- stored -- it's always computed as on_hand (inventory.quantity) minus
-- the live sum of outstanding reservations, via the view at the
-- bottom of this file.
--
-- LIFECYCLE THIS MIGRATION SUPPORTS (wired up in application code in
-- the same commit as this migration):
--   Sales Order confirmed        -> reserve_stock_item() per line
--   Delivery Note dispatch       -> consume_reservation()
--   Sales Order cancelled        -> release_sales_order_reservations()
--   Delivery Note cancelled      -> restore_reservation()
--     (only restores the reservation bookkeeping for what was actually
--     consumed at dispatch time -- does NOT reverse the physical
--     inventory/stock_ledger_entries movement. That's a related but
--     separate capability, deliberately out of this phase's scope; see
--     the reversal-support note in 0004_atomic_stock_movement_rpc.sql.)
--
-- CONCURRENCY: every function below uses SELECT ... FOR UPDATE to lock
-- the reservation rows it touches, same pattern as
-- record_stock_movement() in 0004. reserve_stock_item() additionally
-- relies on a partial unique index (below) so that even a genuine race
-- between two concurrent "confirm" clicks on the same sales order item
-- cannot create two reservations for it -- the second INSERT hits the
-- unique constraint and is turned into a no-op (ON CONFLICT DO NOTHING)
-- rather than relying on an application-level check-then-insert, which
-- would itself be racy.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  inventory_id uuid NOT NULL REFERENCES public.inventory(id),
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  -- Nullable + ON DELETE SET NULL: if a sales order is edited, its old
  -- sales_order_items rows are deleted and replaced (existing behavior,
  -- unchanged by this migration). The reservation row survives that as
  -- a historical record (sales_order_id still identifies which order
  -- it belonged to) rather than disappearing silently.
  sales_order_item_id uuid REFERENCES public.sales_order_items(id) ON DELETE SET NULL,
  reserved_quantity numeric NOT NULL CHECK (reserved_quantity > 0),
  fulfilled_quantity numeric NOT NULL DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'released')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fulfilled_not_exceed_reserved CHECK (fulfilled_quantity <= reserved_quantity)
);

-- At most one live (active or fulfilled) reservation per sales order
-- item -- this is what makes reserve_stock_item() safely idempotent
-- under concurrency, at the database level, not just in application code.
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_reservations_one_live_per_item
  ON public.stock_reservations (sales_order_item_id)
  WHERE status IN ('active', 'fulfilled') AND sales_order_item_id IS NOT NULL;

-- Supports the "sum outstanding reservations for this item" query the
-- availability view runs, and general per-item lookups.
CREATE INDEX IF NOT EXISTS idx_stock_reservations_inventory_active
  ON public.stock_reservations (inventory_id)
  WHERE status = 'active';

-- Supports consume_reservation() / restore_reservation()'s per-order
-- FIFO lookup, and release_sales_order_reservations().
CREATE INDEX IF NOT EXISTS idx_stock_reservations_sales_order
  ON public.stock_reservations (sales_order_id, status);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_company
  ON public.stock_reservations (company_id);

-- ───────────────────────────────────────────────────────────────────
-- RLS — same 4-policy pattern as every other business table in this
-- repo (see phase1_rls_migration.sql). Applied here regardless of
-- whether that migration's later stages were confirmed applied
-- elsewhere -- this is a brand new table, so it starts correctly
-- isolated from day one.
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stock_reservations FROM anon;

DROP POLICY IF EXISTS "stock_reservations_select" ON public.stock_reservations;
CREATE POLICY "stock_reservations_select" ON public.stock_reservations
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "stock_reservations_insert" ON public.stock_reservations;
CREATE POLICY "stock_reservations_insert" ON public.stock_reservations
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "stock_reservations_update" ON public.stock_reservations;
CREATE POLICY "stock_reservations_update" ON public.stock_reservations
  FOR UPDATE TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "stock_reservations_delete" ON public.stock_reservations;
CREATE POLICY "stock_reservations_delete" ON public.stock_reservations
  FOR DELETE TO authenticated
  USING (company_id = public.get_my_company_id());

-- ───────────────────────────────────────────────────────────────────
-- Availability view -- available is NEVER stored, always computed.
-- security_invoker = true is required so this view runs with the
-- QUERYING user's own RLS-checked permissions on inventory and
-- stock_reservations, rather than the view owner's -- without it, a
-- view can silently bypass RLS and leak cross-tenant data.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.inventory_availability
  WITH (security_invoker = true) AS
SELECT
  i.id AS inventory_id,
  i.company_id,
  i.quantity AS on_hand,
  COALESCE(r.reserved, 0) AS reserved,
  i.quantity - COALESCE(r.reserved, 0) AS available
FROM public.inventory i
LEFT JOIN (
  SELECT inventory_id, SUM(reserved_quantity - fulfilled_quantity) AS reserved
  FROM public.stock_reservations
  WHERE status = 'active'
  GROUP BY inventory_id
) r ON r.inventory_id = i.id;

-- ───────────────────────────────────────────────────────────────────
-- reserve_stock_item — one reservation for one sales_order_item.
-- Idempotent: calling this twice for the same item is a no-op the
-- second time (returns the existing reservation's id).
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reserve_stock_item(
  p_sales_order_item_id uuid,
  p_sales_order_id uuid,
  p_inventory_id uuid,
  p_qty numeric,
  p_company_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_qty <= 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.stock_reservations
    (company_id, inventory_id, sales_order_id, sales_order_item_id, reserved_quantity, fulfilled_quantity, status)
  VALUES
    (p_company_id, p_inventory_id, p_sales_order_id, p_sales_order_item_id, p_qty, 0, 'active')
  ON CONFLICT (sales_order_item_id) WHERE status IN ('active', 'fulfilled')
  DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.stock_reservations
    WHERE sales_order_item_id = p_sales_order_item_id AND status IN ('active', 'fulfilled')
    LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────
-- release_sales_order_reservations — bulk-release on SO cancellation,
-- and reused around SO edits to clear stale reservations before
-- re-reserving against the edited item set.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.release_sales_order_reservations(
  p_sales_order_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.stock_reservations
  SET status = 'released', updated_at = now()
  WHERE sales_order_id = p_sales_order_id AND status = 'active';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ───────────────────────────────────────────────────────────────────
-- consume_reservation — called at dispatch time. Consumes up to p_qty
-- from this sales order's active reservations for this inventory
-- item, oldest first (FIFO), across as many reservation rows as
-- needed. Returns the amount actually consumed (may be less than
-- p_qty if under-reserved -- e.g. a from-scratch top-up line added to
-- an SO-linked delivery note beyond what was originally reserved).
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.consume_reservation(
  p_sales_order_id uuid,
  p_inventory_id uuid,
  p_qty numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining numeric := p_qty;
  v_consumed numeric := 0;
  v_take numeric;
  r RECORD;
BEGIN
  IF p_qty <= 0 OR p_sales_order_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT id, reserved_quantity, fulfilled_quantity
    FROM public.stock_reservations
    WHERE sales_order_id = p_sales_order_id
      AND inventory_id = p_inventory_id
      AND status = 'active'
    ORDER BY created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := LEAST(v_remaining, r.reserved_quantity - r.fulfilled_quantity);
    IF v_take > 0 THEN
      UPDATE public.stock_reservations
      SET fulfilled_quantity = fulfilled_quantity + v_take,
          status = CASE WHEN fulfilled_quantity + v_take >= reserved_quantity THEN 'fulfilled' ELSE 'active' END,
          updated_at = now()
      WHERE id = r.id;
      v_remaining := v_remaining - v_take;
      v_consumed := v_consumed + v_take;
    END IF;
  END LOOP;

  RETURN v_consumed;
END;
$$;

-- ───────────────────────────────────────────────────────────────────
-- restore_reservation — inverse of consume_reservation, for Delivery
-- Note cancellation/return after a dispatch. Gives back up to p_qty of
-- previously-fulfilled reservation, most-recently-consumed first,
-- reactivating 'fulfilled' rows back to 'active' as needed. Naturally
-- bounded: it can never restore more than was actually fulfilled, even
-- if the caller passes a larger number.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.restore_reservation(
  p_sales_order_id uuid,
  p_inventory_id uuid,
  p_qty numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining numeric := p_qty;
  v_restored numeric := 0;
  v_give_back numeric;
  r RECORD;
BEGIN
  IF p_qty <= 0 OR p_sales_order_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT id, fulfilled_quantity
    FROM public.stock_reservations
    WHERE sales_order_id = p_sales_order_id
      AND inventory_id = p_inventory_id
      AND status IN ('active', 'fulfilled')
      AND fulfilled_quantity > 0
    ORDER BY updated_at DESC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_give_back := LEAST(v_remaining, r.fulfilled_quantity);
    IF v_give_back > 0 THEN
      UPDATE public.stock_reservations
      SET fulfilled_quantity = fulfilled_quantity - v_give_back,
          status = 'active',
          updated_at = now()
      WHERE id = r.id;
      v_remaining := v_remaining - v_give_back;
      v_restored := v_restored + v_give_back;
    END IF;
  END LOOP;

  RETURN v_restored;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_stock_item(uuid, uuid, uuid, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_sales_order_reservations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_reservation(uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_reservation(uuid, uuid, numeric) TO authenticated;
GRANT SELECT ON public.inventory_availability TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- VERIFY — run after applying
-- ───────────────────────────────────────────────────────────────────
-- 1. Confirm the table, view, and functions exist:
SELECT tablename FROM pg_tables WHERE tablename = 'stock_reservations';
SELECT viewname FROM pg_views WHERE viewname = 'inventory_availability';
SELECT proname FROM pg_proc WHERE proname IN
  ('reserve_stock_item', 'release_sales_order_reservations', 'consume_reservation', 'restore_reservation');

-- 2. Confirm RLS is on and policies exist:
SELECT tablename, rowsecurity, (SELECT count(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS policy_count
FROM pg_tables t WHERE tablename = 'stock_reservations';
-- Expect rowsecurity = true, policy_count = 4.

-- 3. Confirm the unique partial index prevents double-reservation:
--    call reserve_stock_item() twice with the same p_sales_order_item_id
--    -- expect the same id back both times, and only one row in
--    stock_reservations for that item.

-- 4. Confirm inventory_availability computes correctly:
--    SELECT * FROM inventory_availability WHERE inventory_id = '<some id>';
--    available should equal on_hand - reserved, and change immediately
--    (no caching) as reservations are created/consumed/released.

-- ───────────────────────────────────────────────────────────────────
-- 🔙 ROLLBACK
-- ───────────────────────────────────────────────────────────────────
-- DROP VIEW IF EXISTS public.inventory_availability;
-- DROP FUNCTION IF EXISTS public.restore_reservation(uuid, uuid, numeric);
-- DROP FUNCTION IF EXISTS public.consume_reservation(uuid, uuid, numeric);
-- DROP FUNCTION IF EXISTS public.release_sales_order_reservations(uuid);
-- DROP FUNCTION IF EXISTS public.reserve_stock_item(uuid, uuid, uuid, numeric, uuid);
-- DROP TABLE IF EXISTS public.stock_reservations;
-- Note: dropping the table loses reservation history permanently.
-- Rolling back the application code (so nothing calls these functions
-- or expects this table) should happen before dropping the table.
