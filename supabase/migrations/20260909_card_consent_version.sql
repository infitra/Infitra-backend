-- Card consent, versioned (9 Sep 2026). community_consent_at says WHEN a
-- member agreed to their card being shown (infitra.fit, the network, the
-- welcome post); community_consent_version says WHICH wording of "How we
-- put you forward" they agreed to. The join action writes the version
-- (CARD_CONSENT_VERSION in web/lib/cardConsent.ts, bumped with the copy);
-- the trigger keeps the pair consistent: a new version re-stamps the time,
-- a withdrawn card clears both.

alter table public.app_profile
  add column community_consent_version text;

comment on column public.app_profile.community_consent_version is
  'Founding network card: the version of the "How we put you forward" wording the member agreed to when the card went public. Paired with community_consent_at.';

-- Cards already public agreed to the first versioned wording. Done before
-- the trigger below exists, so the original consent time stays.
update public.app_profile
   set community_consent_version = '1.0'
 where community_visibility = 'public'
   and community_consent_version is null;

create or replace function public.trg_profile_community_consent() returns trigger
    language plpgsql
    set search_path to 'public'
    as $$
begin
  if new.community_visibility = 'none' then
    new.community_consent_at := null;
    new.community_consent_version := null;
  elsif tg_op = 'INSERT'
     or old.community_visibility = 'none'
     or new.community_consent_at is null
     or new.community_consent_version is distinct from old.community_consent_version then
    new.community_consent_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_app_profile_community_consent on public.app_profile;
create trigger trg_app_profile_community_consent
  before insert or update of community_visibility, community_consent_version
  on public.app_profile
  for each row execute function public.trg_profile_community_consent();
