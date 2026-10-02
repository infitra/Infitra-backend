-- Templates are dropped: tables, policies and the edge function (2026-10-02).
--
-- create_from_template was a live creator-gate bypass. template_owner_all is a
-- FOR ALL policy with no is_creator(), so any participant could insert their
-- own app_template row (proved with a rolled-back impersonated insert), and
-- the edge function then inserted app_challenge / app_session as the service
-- role, skipping challenge_insert_creator and session_insert_creator.
--
-- Nothing called it: no reference in web/, no cron job, no function or view
-- in the database, 0 rows in both tables. The edge function is deleted from
-- the project in the same change.
--
-- Reusing an experience (e.g. one experience for several studios) belongs in
-- a sibling of create_challenge_continuation_draft, which copies a whole
-- experience the caller owns. A blueprint table only ever produced a bare
-- challenge.
--
-- Guarded: aborts if either table holds a row. No CASCADE, so an unexpected
-- dependent object fails the migration instead of disappearing with it.

do $$
begin
  if exists (select 1 from public.app_template)
     or exists (select 1 from public.app_template_item) then
    raise exception 'app_template / app_template_item are not empty; refusing to drop';
  end if;
end $$;

drop table public.app_template_item;
drop table public.app_template;
