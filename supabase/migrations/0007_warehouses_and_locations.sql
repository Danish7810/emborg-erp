-- ═══════════════════════════════════════════════════════════════════
-- EMBORG — Phase 3: Warehouses, Locations, and Location-Level Stock
-- Run in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════════
--
-- ARCHITECTURE SUMMARY
--
-- Three new tables:
--   warehouses          — one per physical/logical warehouse
--   warehouse_locations — hierarchical (parent_id self-FK: e.g. a
--                          "Rack 1" location can have "Shelf A" as a
--                          child, which can have "Bin 3" as its own
--                          child). type distinguishes internal storage
--                          from view/customer/supplier/transit
--                          locations, matching Odoo's location model.
--   stock_quant         — the per-(inventory_id, location_id) balance.
--                          UNIQUE (inventory_id, location_id). This is
--                          the new source of truth for "how much of
--                          product X is at location Y."
--
-- inventory.quantity is NOT removed or renamed. It remains the
-- company-wide on-hand total, kept in sync with stock_quant by
-- construction — every write to one happens in the same function call
-- as the write to the other (record_stock_movement below), so they
-- cannot drift apart the way two independently-mutated counters would.
-- This is what "maintain backward compatibility" means concretely
-- here: every existing page that reads inventory.quantity (the
-- Inventory list, every "stock: X" dropdown across Quotations/Sales
-- Orders/Purchase Orders/Delivery Notes, the low-stock alert) keeps
-- working unchanged, reading a number that's still correct.
--
-- record_stock_movement() gains two new OPTIONAL trailing parameters,
-- p_source_location_id and p_destination_location_id, both DEFAULT
-- NULL. Existing callers (Purchase Order receipt, Delivery Note
-- dispatch, manual adjustment, and Phase 2C's dispatch_stock_for_line,
-- which calls this positionally) are not touched in this migration or
-- its accompanying application code — they keep calling the function
-- exactly as before, and NULL location parameters resolve internally
-- to the company's default location via get_default_location_id().
-- This is a deliberate, explicit choice over making the parameters
-- required: a required-parameter refactor would break every
-- stock-mutating flow in the app the moment this migration is applied,
-- ahead of (or behind) a coordinated code deploy I cannot guarantee is
-- perfectly synchronized, since migrations are applied manually. The
-- location-aware capability ships as new, additive surface (a
-- Warehouses/Transfers page) rather than a forced rewrite.
--
-- EXISTING WORKFLOW MAPPING:
--   Purchase Order receipt  → destination = resolved default location
--                              (source is NULL: stock enters from
--                              outside the system, same as today)
--   Delivery Note dispatch  → source = resolved default location
--                              (destination is NULL: stock leaves to
--                              the customer, same as today)
--   Manual adjustment       → same one-sided resolution, direction
--                              depends on in/out
--   NEW: Internal transfer  → both source and destination are real,
--                              user-chosen locations; a dedicated
--                              function (not record_stock_movement)
--                              handles this, since a transfer must NOT
--                              change inventory.quantity (the
--                              company-wide total is unchanged by
--                              moving stock between two of its own
--                              locations) — see
--                              transfer_stock_between_locations below.
--
-- RESERVATIONS (Phase 2B): stock_reservations has no location concept
-- — every current reservation is implicitly "at the default location,"
-- which is accurate today since no UI exists yet to hold stock
-- anywhere else. stock_quant.reserved_quantity is kept as a
-- recompute-from-source projection (never independently incremented)
-- via sync_quant_reserved(), called at the end of each Phase 2B RPC.
-- The true source of truth for individual reservations remains
-- stock_reservations, unchanged from Phase 2B — this is a materialized
-- rollup of it at the location level, not a second, independently-kept
-- number. Making reservations themselves location-aware (so stock at
-- a NON-default location can be reserved) is real future work, called
-- out at the end of this file, not attempted here.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- SCHEMA
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  code text NOT NULL,
  address text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

-- At most one default warehouse per company -- get_default_location_id()
-- and the backfill below both depend on this being unambiguous.
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_one_default_per_company
  ON public.warehouses (company_id) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_warehouses_company ON public.warehouses (company_id);

CREATE TABLE IF NOT EXISTS public.warehouse_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  -- Self-FK for hierarchy (Rack -> Shelf -> Bin). ON DELETE CASCADE:
  -- removing a parent location removes its children, matching the
  -- physical reality that a shelf can't outlive the rack it's bolted to.
  parent_id uuid REFERENCES public.warehouse_locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'internal'
    CHECK (type IN ('internal', 'view', 'customer', 'supplier', 'transit')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_locations_warehouse ON public.warehouse_locations (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_parent ON public.warehouse_locations (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_company ON public.warehouse_locations (company_id);

CREATE TABLE IF NOT EXISTS public.stock_quant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  inventory_id uuid NOT NULL REFERENCES public.inventory(id),
  location_id uuid NOT NULL REFERENCES public.warehouse_locations(id),
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  -- No CHECK (reserved_quantity <= quantity): Phase 2B's reservation
  -- model allows confirming a Sales Order to reserve stock regardless
  -- of current availability (matches the existing "confirmation always
  -- succeeds" behavior) -- reserved_quantity > quantity is a real,
  -- meaningful state ("oversold"), not a data error.
  reserved_quantity numeric NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inventory_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_quant_location ON public.stock_quant (location_id);
CREATE INDEX IF NOT EXISTS idx_stock_quant_company ON public.stock_quant (company_id);

-- Ledger gains optional location detail. Nullable, additive -- every
-- historical row keeps NULL here forever, which is correct (they
-- predate location tracking), never edited.
ALTER TABLE public.stock_ledger_entries
  ADD COLUMN IF NOT EXISTS source_location_id uuid REFERENCES public.warehouse_locations(id),
  ADD COLUMN IF NOT EXISTS destination_location_id uuid REFERENCES public.warehouse_locations(id);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_source_location ON public.stock_ledger_entries (source_location_id) WHERE source_location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_ledger_dest_location ON public.stock_ledger_entries (destination_location_id) WHERE destination_location_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────
-- RLS — standard 4-policy pattern, same as every business table in
-- this repo.
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_quant ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.warehouses FROM anon;
REVOKE ALL ON public.warehouse_locations FROM anon;
REVOKE ALL ON public.stock_quant FROM anon;

DROP POLICY IF EXISTS "warehouses_select" ON public.warehouses;
CREATE POLICY "warehouses_select" ON public.warehouses FOR SELECT TO authenticated USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "warehouses_insert" ON public.warehouses;
CREATE POLICY "warehouses_insert" ON public.warehouses FOR INSERT TO authenticated WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "warehouses_update" ON public.warehouses;
CREATE POLICY "warehouses_update" ON public.warehouses FOR UPDATE TO authenticated USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "warehouses_delete" ON public.warehouses;
CREATE POLICY "warehouses_delete" ON public.warehouses FOR DELETE TO authenticated USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "warehouse_locations_select" ON public.warehouse_locations;
CREATE POLICY "warehouse_locations_select" ON public.warehouse_locations FOR SELECT TO authenticated USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "warehouse_locations_insert" ON public.warehouse_locations;
CREATE POLICY "warehouse_locations_insert" ON public.warehouse_locations FOR INSERT TO authenticated WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "warehouse_locations_update" ON public.warehouse_locations;
CREATE POLICY "warehouse_locations_update" ON public.warehouse_locations FOR UPDATE TO authenticated USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "warehouse_locations_delete" ON public.warehouse_locations;
CREATE POLICY "warehouse_locations_delete" ON public.warehouse_locations FOR DELETE TO authenticated USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "stock_quant_select" ON public.stock_quant;
CREATE POLICY "stock_quant_select" ON public.stock_quant FOR SELECT TO authenticated USING (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "stock_quant_insert" ON public.stock_quant;
CREATE POLICY "stock_quant_insert" ON public.stock_quant FOR INSERT TO authenticated WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "stock_quant_update" ON public.stock_quant;
CREATE POLICY "stock_quant_update" ON public.stock_quant FOR UPDATE TO authenticated USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id());
DROP POLICY IF EXISTS "stock_quant_delete" ON public.stock_quant;
CREATE POLICY "stock_quant_delete" ON public.stock_quant FOR DELETE TO authenticated USING (company_id = public.get_my_company_id());

-- ───────────────────────────────────────────────────────────────────
-- get_default_location_id — resolves (and lazily provisions, if
-- somehow missing) a company's default internal location. Self-healing
-- so companies created after this migration's one-time backfill still
-- get a working default without a second manual step.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_default_location_id(p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_location_id uuid;
  v_warehouse_id uuid;
BEGIN
  SELECT wl.id INTO v_location_id
  FROM public.warehouse_locations wl
  JOIN public.warehouses w ON w.id = wl.warehouse_id
  WHERE w.company_id = p_company_id AND w.is_default = true AND wl.type = 'internal'
  ORDER BY wl.created_at
  LIMIT 1;

  IF v_location_id IS NOT NULL THEN
    RETURN v_location_id;
  END IF;

  INSERT INTO public.warehouses (company_id, name, code, is_default)
  VALUES (p_company_id, 'Default Warehouse', 'MAIN', true)
  ON CONFLICT (company_id, code) DO NOTHING
  RETURNING id INTO v_warehouse_id;

  IF v_warehouse_id IS NULL THEN
    SELECT id INTO v_warehouse_id FROM public.warehouses WHERE company_id = p_company_id AND code = 'MAIN';
  END IF;

  INSERT INTO public.warehouse_locations (company_id, warehouse_id, name, type)
  VALUES (p_company_id, v_warehouse_id, 'Stock', 'internal')
  RETURNING id INTO v_location_id;

  RETURN v_location_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_default_location_id(uuid) TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- BACKFILL — idempotent, safe to re-run. Ports every existing
-- company's flat inventory.quantity into stock_quant at its new
-- default location, and seeds reserved_quantity from any currently-
-- active Phase 2B reservations.
-- ───────────────────────────────────────────────────────────────────
INSERT INTO public.warehouses (company_id, name, code, is_default)
SELECT DISTINCT i.company_id, 'Default Warehouse', 'MAIN', true
FROM public.inventory i
WHERE NOT EXISTS (
  SELECT 1 FROM public.warehouses w WHERE w.company_id = i.company_id AND w.is_default = true
)
ON CONFLICT (company_id, code) DO NOTHING;

INSERT INTO public.warehouse_locations (company_id, warehouse_id, name, type)
SELECT w.company_id, w.id, 'Stock', 'internal'
FROM public.warehouses w
WHERE w.is_default = true
  AND NOT EXISTS (
    SELECT 1 FROM public.warehouse_locations wl WHERE wl.warehouse_id = w.id AND wl.type = 'internal'
  );

INSERT INTO public.stock_quant (company_id, inventory_id, location_id, quantity, reserved_quantity)
SELECT
  i.company_id,
  i.id,
  (SELECT wl.id FROM public.warehouse_locations wl JOIN public.warehouses w ON w.id = wl.warehouse_id
   WHERE w.company_id = i.company_id AND w.is_default = true AND wl.type = 'internal' LIMIT 1),
  i.quantity,
  COALESCE((SELECT SUM(sr.reserved_quantity - sr.fulfilled_quantity) FROM public.stock_reservations sr
            WHERE sr.inventory_id = i.id AND sr.status = 'active'), 0)
FROM public.inventory i
ON CONFLICT (inventory_id, location_id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- record_stock_movement — refactored. Same name, same first 9
-- parameters in the same order (backward compatible for both named-
-- parameter calls from the app and dispatch_stock_for_line's
-- positional call), two new optional trailing parameters appended.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_inventory_id uuid,
  p_delta numeric,
  p_entry_type text,
  p_item_name text,
  p_company_id uuid,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_clamp_to_available boolean DEFAULT false,
  p_source_location_id uuid DEFAULT NULL,
  p_destination_location_id uuid DEFAULT NULL
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
  v_location_id uuid;
BEGIN
  -- Unchanged from Phase 2a: lock the inventory row, compute the
  -- clamped/blocked delta, write inventory.quantity. This is still the
  -- company-wide total every existing page reads.
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
      v_applied_delta := -v_current;
    ELSE
      RAISE EXCEPTION 'Insufficient stock: % available, % requested', v_current, -p_delta
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_new_balance := v_current + v_applied_delta;

  UPDATE public.inventory
  SET quantity = v_new_balance
  WHERE id = p_inventory_id;

  -- NEW: resolve which location this movement actually affects (the
  -- destination for stock coming in, the source for stock going out),
  -- defaulting to the company's default location when the caller
  -- didn't specify one -- this is what makes every existing caller's
  -- behavior unchanged.
  IF v_applied_delta >= 0 THEN
    v_location_id := COALESCE(p_destination_location_id, public.get_default_location_id(p_company_id));
  ELSE
    v_location_id := COALESCE(p_source_location_id, public.get_default_location_id(p_company_id));
  END IF;

  -- Upsert stock_quant using the SAME already-clamped v_applied_delta
  -- used for inventory.quantity above, so the two can never disagree.
  -- INSERT ... ON CONFLICT DO UPDATE is itself atomic (Postgres takes
  -- the necessary row lock as part of conflict resolution), and
  -- additionally handles "this item has no stock_quant row yet"
  -- (e.g. a brand-new item's first movement) in the same statement,
  -- so no separate existence check is needed here.
  INSERT INTO public.stock_quant (company_id, inventory_id, location_id, quantity)
  VALUES (p_company_id, p_inventory_id, v_location_id, v_applied_delta)
  ON CONFLICT (inventory_id, location_id)
  DO UPDATE SET quantity = public.stock_quant.quantity + EXCLUDED.quantity, updated_at = now();

  INSERT INTO public.stock_ledger_entries
    (company_id, inventory_id, item_name, entry_type, qty_change, balance_after, reference_type, reference_id, notes, source_location_id, destination_location_id)
  VALUES
    (p_company_id, p_inventory_id, p_item_name, p_entry_type, v_applied_delta, v_new_balance, p_reference_type, p_reference_id, p_notes,
     CASE WHEN v_applied_delta < 0 THEN v_location_id ELSE p_source_location_id END,
     CASE WHEN v_applied_delta >= 0 THEN v_location_id ELSE p_destination_location_id END);

  RETURN QUERY SELECT v_new_balance, v_applied_delta;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_stock_movement(
  uuid, numeric, text, text, uuid, text, uuid, text, boolean, uuid, uuid
) TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- transfer_stock_between_locations — NEW. Moves stock between two
-- locations of the same company with NO change to inventory.quantity
-- (the company-wide total is unaffected by redistributing stock it
-- already owns). Deliberately separate from record_stock_movement,
-- which is single-location by design.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.transfer_stock_between_locations(
  p_inventory_id uuid,
  p_source_location_id uuid,
  p_destination_location_id uuid,
  p_qty numeric,
  p_company_id uuid,
  p_item_name text,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (source_balance numeric, destination_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_qty numeric;
  v_dest_qty numeric;
  v_first_id uuid;
  v_second_id uuid;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'Transfer quantity must be positive' USING ERRCODE = 'P0001';
  END IF;
  IF p_source_location_id = p_destination_location_id THEN
    RAISE EXCEPTION 'Source and destination locations must differ' USING ERRCODE = 'P0001';
  END IF;

  -- Lock both rows in a consistent order (by location_id, not by
  -- source/destination role) so two concurrent transfers moving stock
  -- in opposite directions between the same two locations can never
  -- deadlock each other waiting on each other's locks.
  IF p_source_location_id < p_destination_location_id THEN
    v_first_id := p_source_location_id; v_second_id := p_destination_location_id;
  ELSE
    v_first_id := p_destination_location_id; v_second_id := p_source_location_id;
  END IF;

  PERFORM 1 FROM public.stock_quant WHERE inventory_id = p_inventory_id AND location_id = v_first_id FOR UPDATE;
  PERFORM 1 FROM public.stock_quant WHERE inventory_id = p_inventory_id AND location_id = v_second_id FOR UPDATE;

  SELECT quantity INTO v_source_qty FROM public.stock_quant
  WHERE inventory_id = p_inventory_id AND location_id = p_source_location_id;

  IF v_source_qty IS NULL OR v_source_qty < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock at source location: % available, % requested', COALESCE(v_source_qty, 0), p_qty
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.stock_quant SET quantity = quantity - p_qty, updated_at = now()
  WHERE inventory_id = p_inventory_id AND location_id = p_source_location_id
  RETURNING quantity INTO v_source_qty;

  INSERT INTO public.stock_quant (company_id, inventory_id, location_id, quantity)
  VALUES (p_company_id, p_inventory_id, p_destination_location_id, p_qty)
  ON CONFLICT (inventory_id, location_id)
  DO UPDATE SET quantity = public.stock_quant.quantity + EXCLUDED.quantity, updated_at = now()
  RETURNING quantity INTO v_dest_qty;

  -- Two ledger rows, one per leg, both referencing both locations so
  -- either can be found from a per-location history query.
  INSERT INTO public.stock_ledger_entries
    (company_id, inventory_id, item_name, entry_type, qty_change, balance_after, reference_type, notes, source_location_id, destination_location_id)
  VALUES
    (p_company_id, p_inventory_id, p_item_name, 'transfer_out', -p_qty, v_source_qty, 'internal_transfer', p_notes, p_source_location_id, p_destination_location_id);

  INSERT INTO public.stock_ledger_entries
    (company_id, inventory_id, item_name, entry_type, qty_change, balance_after, reference_type, notes, source_location_id, destination_location_id)
  VALUES
    (p_company_id, p_inventory_id, p_item_name, 'transfer_in', p_qty, v_dest_qty, 'internal_transfer', p_notes, p_source_location_id, p_destination_location_id);

  RETURN QUERY SELECT v_source_qty, v_dest_qty;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_stock_between_locations(uuid, uuid, uuid, numeric, uuid, text, text) TO authenticated;

-- ───────────────────────────────────────────────────────────────────
-- sync_quant_reserved — recomputes (never increments) stock_quant's
-- reserved_quantity at the default location from the live sum of
-- active Phase 2B reservations. Called at the end of each Phase 2B
-- RPC below so stock_quant.reserved_quantity never drifts from
-- stock_reservations, the true source of truth.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_quant_reserved(p_inventory_id uuid, p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_location_id uuid;
  v_total_reserved numeric;
BEGIN
  v_location_id := public.get_default_location_id(p_company_id);

  SELECT COALESCE(SUM(reserved_quantity - fulfilled_quantity), 0) INTO v_total_reserved
  FROM public.stock_reservations
  WHERE inventory_id = p_inventory_id AND status = 'active';

  INSERT INTO public.stock_quant (company_id, inventory_id, location_id, quantity, reserved_quantity)
  VALUES (p_company_id, p_inventory_id, v_location_id, 0, v_total_reserved)
  ON CONFLICT (inventory_id, location_id)
  DO UPDATE SET reserved_quantity = v_total_reserved, updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_quant_reserved(uuid, uuid) TO authenticated;

-- Extend the four Phase 2B reservation RPCs to keep stock_quant in
-- sync. Bodies are otherwise byte-for-byte identical to 0005's
-- versions -- only the trailing sync_quant_reserved() call is new.

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

  PERFORM public.sync_quant_reserved(p_inventory_id, p_company_id);

  RETURN v_id;
END;
$$;

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
  r RECORD;
BEGIN
  UPDATE public.stock_reservations
  SET status = 'released', updated_at = now()
  WHERE sales_order_id = p_sales_order_id AND status = 'active';
  GET DIAGNOSTICS v_count = ROW_COUNT;

  FOR r IN
    SELECT DISTINCT inventory_id, company_id FROM public.stock_reservations WHERE sales_order_id = p_sales_order_id
  LOOP
    PERFORM public.sync_quant_reserved(r.inventory_id, r.company_id);
  END LOOP;

  RETURN v_count;
END;
$$;

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
  v_company_id uuid;
  r RECORD;
BEGIN
  IF p_qty <= 0 OR p_sales_order_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT id, reserved_quantity, fulfilled_quantity, company_id
    FROM public.stock_reservations
    WHERE sales_order_id = p_sales_order_id
      AND inventory_id = p_inventory_id
      AND status = 'active'
    ORDER BY created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_company_id := r.company_id;
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

  IF v_company_id IS NOT NULL THEN
    PERFORM public.sync_quant_reserved(p_inventory_id, v_company_id);
  END IF;

  RETURN v_consumed;
END;
$$;

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
  v_company_id uuid;
  r RECORD;
BEGIN
  IF p_qty <= 0 OR p_sales_order_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT id, fulfilled_quantity, company_id
    FROM public.stock_reservations
    WHERE sales_order_id = p_sales_order_id
      AND inventory_id = p_inventory_id
      AND status IN ('active', 'fulfilled')
      AND fulfilled_quantity > 0
    ORDER BY updated_at DESC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_company_id := r.company_id;
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

  IF v_company_id IS NOT NULL THEN
    PERFORM public.sync_quant_reserved(p_inventory_id, v_company_id);
  END IF;

  RETURN v_restored;
END;
$$;

-- ───────────────────────────────────────────────────────────────────
-- VERIFY — run after applying
-- ───────────────────────────────────────────────────────────────────
-- 1. Every company with inventory has exactly one default warehouse
--    and one default internal location:
SELECT company_id, count(*) FROM public.warehouses WHERE is_default = true GROUP BY company_id HAVING count(*) <> 1;
-- Expect 0 rows.

-- 2. stock_quant totals match inventory.quantity for every item
--    (they should, immediately after the backfill):
SELECT i.id, i.quantity AS inventory_qty, COALESCE(SUM(sq.quantity), 0) AS quant_total
FROM public.inventory i
LEFT JOIN public.stock_quant sq ON sq.inventory_id = i.id
GROUP BY i.id, i.quantity
HAVING i.quantity <> COALESCE(SUM(sq.quantity), 0);
-- Expect 0 rows.

-- 3. Existing flows unaffected: receive a Purchase Order, dispatch a
--    Delivery Note, record a manual adjustment -- confirm
--    inventory.quantity changes exactly as before AND the
--    corresponding stock_quant row at the default location moves by
--    the same amount.

-- 4. Internal transfer: call transfer_stock_between_locations with two
--    different location ids for the same item. Confirm: source
--    stock_quant decreases, destination increases by the same amount,
--    inventory.quantity is UNCHANGED, two new stock_ledger_entries
--    rows appear (transfer_out / transfer_in).

-- 5. Negative stock prevention: attempt a transfer requesting more
--    than the source location holds -- expect an error, no partial
--    application (check both stock_quant rows are unchanged after the
--    failed call).

-- 6. Concurrency: open two sessions, attempt simultaneous transfers of
--    the same item between the same two locations in opposite
--    directions -- expect both to complete correctly in sequence (one
--    waits for the other's lock), never a deadlock error.

-- ───────────────────────────────────────────────────────────────────
-- 🔙 ROLLBACK
-- ───────────────────────────────────────────────────────────────────
-- Roll back application code first (remove the Warehouses page and
-- its nav entry) -- nothing else calls the new tables/functions, since
-- the three existing stock-mutating pages were deliberately left
-- unmodified in this phase.
--
-- DROP FUNCTION IF EXISTS public.restore_reservation(uuid, uuid, numeric);
-- DROP FUNCTION IF EXISTS public.consume_reservation(uuid, uuid, numeric);
-- DROP FUNCTION IF EXISTS public.release_sales_order_reservations(uuid);
-- DROP FUNCTION IF EXISTS public.reserve_stock_item(uuid, uuid, uuid, numeric, uuid);
-- -- (the four functions above revert to their 0005 bodies by re-running
-- -- 0005's CREATE OR REPLACE statements, or drop+recreate as above)
-- DROP FUNCTION IF EXISTS public.transfer_stock_between_locations(uuid, uuid, uuid, numeric, uuid, text, text);
-- DROP FUNCTION IF EXISTS public.sync_quant_reserved(uuid, uuid);
-- -- Revert record_stock_movement to its 0004 signature/body by
-- -- re-running 0004's CREATE OR REPLACE statement (drops the two new
-- -- trailing parameters and the stock_quant/location logic).
-- DROP FUNCTION IF EXISTS public.get_default_location_id(uuid);
-- ALTER TABLE public.stock_ledger_entries DROP COLUMN IF EXISTS source_location_id;
-- ALTER TABLE public.stock_ledger_entries DROP COLUMN IF EXISTS destination_location_id;
-- DROP TABLE IF EXISTS public.stock_quant;
-- DROP TABLE IF EXISTS public.warehouse_locations;
-- DROP TABLE IF EXISTS public.warehouses;
-- Note: inventory.quantity was never touched by this migration beyond
-- its normal write path, so rolling back loses nothing there -- only
-- location-level history (stock_quant, and the location columns on
-- stock_ledger_entries) is lost.

-- ───────────────────────────────────────────────────────────────────
-- REMAINING WORK (explicitly deferred, not attempted here)
-- ───────────────────────────────────────────────────────────────────
-- - stock_reservations has no location_id -- reservations are
--   implicitly "at the default location" only. Making them truly
--   location-aware (so non-default-location stock can be reserved)
--   needs its own migration and is real future work once there's a
--   reason for stock to routinely live anywhere but the default
--   location.
-- - The three existing stock-mutating pages (Purchase Orders, Delivery
--   Notes, Stock Ledger's manual adjustment) do not expose location
--   selection in their UI -- they continue operating entirely against
--   the default location, by design, this phase. Extending them to
--   let a user choose a non-default receiving/picking location is a
--   natural next increment, deliberately not bundled into this phase
--   to keep it reviewable.
-- - Phase 4 (batch/serial tracking) is next, per your explicit
--   sequencing -- not started.
