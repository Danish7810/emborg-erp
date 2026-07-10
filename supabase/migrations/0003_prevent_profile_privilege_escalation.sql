-- ═══════════════════════════════════════════════════════════════════
-- EMBORG — Prevent self-service privilege escalation via profiles
-- Run in Supabase SQL Editor (https://supabase.com/dashboard → SQL)
-- ═══════════════════════════════════════════════════════════════════
--
-- CURRENT RISK (before this migration):
-- phase1_rls_migration.sql's "profiles_update_own" policy is:
--
--   CREATE POLICY "profiles_update_own" ON public.profiles
--     FOR UPDATE TO authenticated
--     USING (id = auth.uid())
--     WITH CHECK (id = auth.uid());
--
-- Postgres RLS policies are ROW-scoped, not COLUMN-scoped. This policy
-- correctly restricts *which row* a user can update (their own), but it
-- does not restrict *which columns* they can change on that row. Any
-- authenticated user can therefore run, directly from the browser
-- (no application code involved, this bypasses every "Admin-only" UI
-- check in the app since those are client-side only):
--
--   supabase.from("profiles").update({ role: "Admin" }).eq("id", myOwnId)
--   supabase.from("profiles").update({ company_id: "<any-other-company-uuid>" }).eq("id", myOwnId)
--
-- The first grants self-admin. The second hops the user into a
-- different company's tenant, since every other RLS policy in the app
-- (contacts_select, leads_select, etc.) trusts get_my_company_id(),
-- which reads straight from this same profiles.company_id column.
--
-- FIX: a BEFORE UPDATE trigger that rejects any UPDATE statement which
-- actually changes role or company_id, regardless of what value is
-- being set to what — it compares OLD vs NEW and raises if either
-- differs. This is chosen over two alternatives:
--   - Column-level GRANT/REVOKE: would require knowing Supabase's
--     exact current grant state on this table to avoid accidentally
--     breaking other legitimate self-edit fields (full_name, etc.);
--     not verifiable without a live DB connection, so avoided here as
--     a blind change on a production table.
--   - A SECURITY DEFINER "admin changes teammate's role" function:
--     a real feature worth building later (see note at the bottom),
--     but it doesn't by itself close this hole — the trigger below is
--     required regardless, since the vulnerability is a user editing
--     THEIR OWN row, not an admin editing someone else's.
--
-- WHY PRIVILEGE ESCALATION IS IMPOSSIBLE AFTER THIS MIGRATION:
-- Every UPDATE on public.profiles — issued by any client, with any
-- role/company_id value, through any code path (the Supabase JS
-- client, a raw REST call, a future API route) — passes through this
-- trigger before the row is written. The trigger compares the
-- proposed new row (NEW) against the existing row (OLD) at the
-- database engine level, which cannot be bypassed by RLS policies,
-- application code, or client-side checks: if role or company_id
-- would change, the entire statement is aborted with an exception and
-- nothing is written. The only way to legitimately change these
-- columns going forward is a trusted, explicitly-audited path (e.g. a
-- future SECURITY DEFINER function that itself verifies the caller is
-- an Admin of the target company) that this trigger is deliberately
-- NOT exempting today — meaning role/company_id changes are fully
-- locked down until such a function is built and reviewed.
--
-- SCOPE NOTE: this repo has no confirmed "permissions" column on
-- profiles (only api_keys.permissions, a different table, already
-- correctly scoped server-side). If your live schema does have a
-- profiles.permissions column, add it to the IF condition below to
-- match — do not run this migration blind if so; check first.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Changing role directly is not permitted.'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Changing company_id directly is not permitted.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ───────────────────────────────────────────────────────────────────
-- VERIFY — run after applying
-- ───────────────────────────────────────────────────────────────────
-- 1. Confirm the trigger exists:
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'trg_prevent_profile_privilege_escalation';
-- Expect 1 row, tgenabled = 'O' (origin, i.e. active).

-- 2. As a logged-in user (not via SQL editor's superuser context —
--    superuser/service-role bypasses this like it bypasses RLS),
--    from the app or via the Supabase JS client, attempt:
--      supabase.from("profiles").update({ role: "Admin" }).eq("id", <own id>)
--    Expect: an error, no row changed.
--    Then confirm a normal self-edit still works:
--      supabase.from("profiles").update({ full_name: "New Name" }).eq("id", <own id>)
--    Expect: succeeds.

-- ───────────────────────────────────────────────────────────────────
-- 🔙 ROLLBACK (only if this trigger unexpectedly blocks something
-- legitimate — investigate why before rolling back, since the
-- default-safe state is "blocked", not "allowed")
-- ───────────────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
-- DROP FUNCTION IF EXISTS public.prevent_profile_privilege_escalation();

-- ───────────────────────────────────────────────────────────────────
-- FOLLOW-UP (not implemented here — separate feature, needs review):
-- app/dashboard/settings/page.tsx's handleRoleChange() lets an Admin
-- attempt to change a TEAMMATE's role. That was already non-functional
-- before this migration too: the existing profiles_update_own policy's
-- USING (id = auth.uid()) clause only permits updating your OWN row,
-- so an admin updating someone else's profile was already silently
-- blocked by RLS (Supabase returns success with zero rows affected
-- rather than an error, so this likely fails invisibly today). This
-- migration does not change that pre-existing behavior. A real fix
-- needs a SECURITY DEFINER function like:
--   admin_update_member_role(member_id uuid, new_role text)
-- that explicitly checks the caller is role='Admin' in the SAME
-- company_id as the target member before updating — intentionally
-- left for a dedicated change, not bundled into this security patch.
