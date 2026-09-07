-- Supply-side fields belong to creators only (6 Sep 2026)
--
-- entity_type, workspace_enabled, community_visibility, open_to, brings,
-- seeks and announce_ok describe the supply side. A participant carries
-- none of them: entity_type is null, the workspace is closed, the card does
-- not exist, posts permission is off. One trigger derives that from the
-- role on insert and update, so no writer has to remember it, and two
-- checks make the invariant non-bypassable.

alter table public.app_profile
  alter column entity_type drop not null,
  alter column entity_type drop default;

update public.app_profile
   set entity_type = null,
       workspace_enabled = false,
       community_visibility = 'none',
       open_to = '{}',
       brings = null,
       seeks = null,
       announce_ok = false
 where role = 'participant';

update public.app_profile
   set entity_type = 'expert'
 where role in ('creator', 'admin') and entity_type is null;

create or replace function public.enforce_profile_side_fields()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.role = 'participant' then
    new.entity_type := null;
    new.workspace_enabled := false;
    new.community_visibility := 'none';
    new.open_to := '{}';
    new.brings := null;
    new.seeks := null;
    new.announce_ok := false;
  else
    if new.entity_type is null then
      new.entity_type := 'expert';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_side_fields on public.app_profile;
create trigger trg_enforce_profile_side_fields
  before insert or update on public.app_profile
  for each row execute function public.enforce_profile_side_fields();

alter table public.app_profile
  drop constraint if exists app_profile_entity_type_check,
  add constraint app_profile_entity_type_check
    check (
      (role = 'participant' and entity_type is null)
      or (role in ('creator', 'admin') and entity_type in ('expert', 'studio'))
    ),
  drop constraint if exists app_profile_participant_no_supply_fields,
  add constraint app_profile_participant_no_supply_fields
    check (
      role <> 'participant'
      or (workspace_enabled = false and community_visibility = 'none'
          and open_to = '{}' and brings is null and seeks is null and announce_ok = false)
    );

comment on column public.app_profile.entity_type is
  'Supply side only: expert or studio for creators and admins, null for participants (trigger-derived, check-enforced).';
