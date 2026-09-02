-- P7 · The profile layer (2026-08-02). Applied to production as
-- profile_layer_p7; kept for the repo record. Full commentary inline there.
-- Summary: app_profile.profile_facts jsonb (fill = share),
-- app_expert_credential (kind/title/org/year, owner-managed under RLS,
-- readable only for creator profiles), app_profile_public extended with
-- profile_facts through the same can_view_profile gate.

-- Follow-up (same day): profile_id defaults to auth.uid(). A client insert
-- omitting it left NULL, and the RLS check `profile_id = auth.uid()`
-- evaluates NULL -> not true, so the row was rejected as an RLS violation
-- before the NOT NULL constraint was ever reached. Founder hit exactly this
-- adding their first credential.
alter table public.app_expert_credential
  alter column profile_id set default auth.uid();

-- Follow-up (same day): profile_id defaults to auth.uid(). A client insert
-- omitting it left NULL, and the RLS check `profile_id = auth.uid()`
-- evaluates NULL -> not true, so the row was rejected as an RLS violation
-- before the NOT NULL constraint was ever reached. Founder hit exactly this
-- adding their first credential.
alter table public.app_expert_credential
  alter column profile_id set default auth.uid();

-- Credentials can span years: year is the START, year_end the optional end
-- (checked >= year so a range can never render backwards). Renders "2018-2020".
alter table public.app_expert_credential
  add column if not exists year_end int
    check (year_end is null or (year_end between 1950 and 2100));
alter table public.app_expert_credential
  add constraint app_expert_credential_year_range_ok
  check (year_end is null or year is null or year_end >= year);
