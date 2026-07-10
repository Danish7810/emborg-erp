-- ═══════════════════════════════════════════════════════════════════
-- EMBORG PHASE 1 — RLS MIGRATION
-- Run in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════════
-- ⚠️ RUN IN STAGES. Do NOT run the whole file blindly.
-- Stage A: discover → Stage B: one table → test app → Stage C: rest
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- STAGE A — DISCOVERY (safe, read-only. Run this first, send me output)
-- ───────────────────────────────────────────────────────────────────

-- A1. List all your tables and whether RLS is on
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- A2. Which tables have a company_id column (needed for isolation)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'company_id'
ORDER BY table_name;

-- A3. Which tables are MISSING company_id (these need it added)
SELECT t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.tablename
      AND c.column_name = 'company_id'
  )
ORDER BY t.tablename;

-- A4. Confirm the security-definer function exists
SELECT proname, prosecdef AS is_security_definer
FROM pg_proc
WHERE proname = 'get_my_company_id';


-- ───────────────────────────────────────────────────────────────────
-- STAGE B — PILOT: enable RLS on ONE table (contacts) and test
-- ───────────────────────────────────────────────────────────────────
-- After running this, open your live app while LOGGED IN:
--   • /dashboard/contacts must still list your contacts
--   • Adding a contact must still work
-- Then open incognito (logged out): direct Supabase queries return nothing.
-- If the app breaks, run the ROLLBACK at the bottom and send me the error.

-- B1. Ensure the helper function is safe (recreate defensively)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- B2. Enable RLS on contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- B3. Remove old anon grants (anon should have NO direct table access)
REVOKE ALL ON public.contacts FROM anon;

-- B4. Policies: authenticated users can only touch rows in their company
DROP POLICY IF EXISTS "contacts_select" ON public.contacts;
CREATE POLICY "contacts_select" ON public.contacts
  FOR SELECT TO authenticated
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "contacts_insert" ON public.contacts;
CREATE POLICY "contacts_insert" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "contacts_update" ON public.contacts;
CREATE POLICY "contacts_update" ON public.contacts
  FOR UPDATE TO authenticated
  USING (company_id = public.get_my_company_id())
  WITH CHECK (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "contacts_delete" ON public.contacts;
CREATE POLICY "contacts_delete" ON public.contacts
  FOR DELETE TO authenticated
  USING (company_id = public.get_my_company_id());

-- ✋ STOP HERE. Test the app. Only continue to Stage C if contacts works.


-- ───────────────────────────────────────────────────────────────────
-- STAGE C — ROLL OUT to all business tables
-- ───────────────────────────────────────────────────────────────────
-- Edit the table list below to match your Stage A2 output EXACTLY.
-- Every table listed must have a company_id column.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'leads',
    'invoices',
    'expenses',
    'products',        -- or 'inventory' — match YOUR table name from A2
    'employees',
    'payroll_runs',    -- match your actual name
    'leave_requests',  -- match your actual name
    'activities'       -- match your actual name
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT TO authenticated USING (company_id = public.get_my_company_id())', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (company_id = public.get_my_company_id())', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO authenticated USING (company_id = public.get_my_company_id()) WITH CHECK (company_id = public.get_my_company_id())', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO authenticated USING (company_id = public.get_my_company_id())', t, t);

    RAISE NOTICE 'RLS enabled + policies created for: %', t;
  END LOOP;
END $$;


-- ───────────────────────────────────────────────────────────────────
-- STAGE D — special tables (profiles, companies, team invites)
-- ───────────────────────────────────────────────────────────────────

-- profiles: user can read own profile + profiles in their company
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM anon;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- companies: members can read their own company; admins update it
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.companies FROM anon;

DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_my_company_id());

DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE TO authenticated
  USING (id = public.get_my_company_id())
  WITH CHECK (id = public.get_my_company_id());

-- NOTE: the on_auth_user_created trigger is SECURITY DEFINER,
-- so signup still works — triggers bypass RLS. No change needed.


-- ───────────────────────────────────────────────────────────────────
-- STAGE E — VERIFY (run after everything)
-- ───────────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
-- Every business table should show rls_enabled = true, policy_count >= 4


-- ───────────────────────────────────────────────────────────────────
-- 🔙 EMERGENCY ROLLBACK (only if the app breaks — per table)
-- ───────────────────────────────────────────────────────────────────
-- ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
-- GRANT ALL ON public.contacts TO authenticated;
