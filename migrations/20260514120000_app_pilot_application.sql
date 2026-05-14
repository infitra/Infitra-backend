-- Pilot application form (Bundle 1 of the v3 pilot engagement plan).
--
-- The landing page already advertises "Apply for the pilot" as the
-- single CTA. Until this table exists, the route /apply is a 404 and
-- outreach has nowhere to land. This migration adds the storage,
-- the row-level security, and nothing else — the form itself is in
-- web/app/apply/.
--
-- Submissions are anonymous-friendly (an interested creator should
-- never need an account just to apply), so INSERT is open to both
-- anon and authenticated. Reads are admin-only — applications are
-- founder-reviewed, not publicly browsable.

create table if not exists public.app_pilot_application (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  channel_url text,
  expertise text not null,
  audience_size_range text,
  location text,
  has_partner boolean not null default false,
  partner_info text,
  complement_interest text,
  success_description text,
  status text not null default 'new'
    check (status in ('new','contacted','accepted','declined')),
  created_at timestamptz not null default now()
);

create index if not exists idx_pilot_application_status_created
  on public.app_pilot_application(status, created_at desc);

alter table public.app_pilot_application enable row level security;

-- Anyone (anon or authenticated) can submit. The form has no
-- auth gate by design — pilots discover INFITRA cold.
create policy app_pilot_application_insert_any
  on public.app_pilot_application
  for insert
  with check (true);

-- Reads restricted to admin. Founder reviews submissions in the
-- Supabase dashboard or a future admin surface.
create policy app_pilot_application_select_admin
  on public.app_pilot_application
  for select
  using (
    exists (
      select 1 from public.app_profile
      where id = (select auth.uid())
        and role = 'admin'
    )
  );
