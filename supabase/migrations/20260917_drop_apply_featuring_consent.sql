-- The featuring consent leaves /apply (2026-09-17).
--
-- WHY: the form asked permission to show a card that does not exist yet.
-- The real consent is the versioned one taken at /network from the invite
-- link (app_profile.community_consent_at + community_consent_version, wording
-- tagged in lib/cardConsent.ts). Nothing ever carried the application's copy
-- forward to the card, so app_pilot_application.announce_consent was a
-- second, earlier, unversioned consent for the same thing, collected before
-- the applicant had seen what they were consenting to.
--
-- With the checkbox gone the column could only ever read false, which makes
-- it, its timestamp, its stamping trigger, the "Featuring" row in the founder
-- notification and the admin board's Feature column all dead. They go
-- together.
--
-- The table is empty, so no consent record is lost. The versioned consent on
-- app_profile is untouched.

drop trigger if exists trg_app_pilot_application_consent on public.app_pilot_application;
drop function if exists public.trg_pilot_application_consent_stamp();

alter table public.app_pilot_application
  drop column if exists announce_consent,
  drop column if exists announce_consent_at;

-- Remove the Featuring row from the live notification, surgically: the
-- function was rewritten twice today (the form cut, then the tagline sweep),
-- so retyping it from the repo would undo one of them.
do $patch$
declare
  fn  regprocedure;
  def text;
  blk text := E'  v_rows_html := v_rows_html\n'
           || E'    || ''<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Featuring</td>''\n'
           || E'    || ''<td style="padding:6px 0;font-size:14px;color:#0F2229;">''\n'
           || E'    || case when a.announce_consent then ''Yes: card on infitra.fit and in posts'' else ''Switched off'' end\n'
           || E'    || ''</td></tr>'';\n'
           || E'  v_rows_text := v_rows_text || ''Featuring: ''\n'
           || E'    || case when a.announce_consent then ''yes'' else ''switched off'' end || E''\\n'';\n\n';
  n   int;
begin
  select p.oid::regprocedure into fn from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and p.proname = 'app_enqueue_pilot_application_emails';

  def := pg_get_functiondef(fn);
  n := (length(def) - length(replace(def, blk, ''))) / length(blk);
  if n <> 1 then
    raise exception 'featuring block found % times, expected 1', n;
  end if;

  execute replace(def, blk, '');
end
$patch$;
