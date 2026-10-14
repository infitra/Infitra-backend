-- Test accounts move to Resend's sandbox addresses.
--
-- 22 test accounts carried addresses on domains INFITRA does not own
-- (participant.com, test.com, creator.com, ...). The outbox sent them real
-- mail: some of those domains have no mail server (certain hard bounces),
-- others belong to real companies. Bounces count against hello@infitra.fit,
-- and Resend pauses sending above a 4% bounce rate; at pilot volume the test
-- sends were most of the traffic.
--
-- delivered+<name>@resend.dev is Resend's documented test address: Resend
-- records the email as delivered and sends it nowhere, so no bounce and no
-- inbox. Each email stays readable in Resend's log under its label.
--
-- Only the address changes (auth.users, the email identity, user metadata);
-- passwords, profiles, purchases and attendance are untouched. The login
-- becomes delivered+<old local part>@resend.dev. Sent outbox rows keep the
-- address they actually went to. Explicit list, never a domain pattern, so
-- a real person who signs up on one of these domains is never touched.
-- A fresh database has none of these accounts and skips; a partial match
-- stops the migration.

do $$
declare
  v_old text[] := array[
    'alex@creator.com', 'mira@creator.com',
    'anna@participant.com', 'kiet@participant.com', 'max@participant.com',
    'peter@participant.com', 'ramona@participant.com', 'richard@participant.com',
    'sam@participant.com', 'sven@participant.com', 'tim@participant.com',
    'timo@participant.com', 'yves@participant.com',
    'chris@particpant.com', 'randy@part.com', 'elke@sims.com',
    'astrid@test.com', 'mitch@test.com', 'roger@test.com',
    'yves.participant@test.com', 'yves.yves@test.ch',
    'e2e-participant-claude@example.com'
  ];
  v_n int;
begin
  create temp table _test_account_remap on commit drop as
    select u.id,
           'delivered+' || lower(split_part(u.email, '@', 1)) || '@resend.dev' as new_email
      from auth.users u
     where lower(u.email) = any (v_old);

  select count(*) into v_n from _test_account_remap;
  if v_n = 0 then
    raise notice 'no test accounts present, nothing to re-point';
    return;
  end if;
  if v_n <> cardinality(v_old) then
    raise exception 'expected % test accounts, found %', cardinality(v_old), v_n;
  end if;
  if exists (select 1 from auth.users u join _test_account_remap r on lower(u.email) = r.new_email) then
    raise exception 'a sandbox address is already taken';
  end if;

  update auth.users u
     set email = r.new_email,
         raw_user_meta_data = case when u.raw_user_meta_data ? 'email'
                                   then jsonb_set(u.raw_user_meta_data, '{email}', to_jsonb(r.new_email))
                                   else u.raw_user_meta_data end,
         updated_at = now()
    from _test_account_remap r
   where r.id = u.id;
  get diagnostics v_n = row_count;
  if v_n <> cardinality(v_old) then
    raise exception 'auth.users: expected % updates, got %', cardinality(v_old), v_n;
  end if;

  update auth.identities i
     set identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(r.new_email)),
         updated_at = now()
    from _test_account_remap r
   where r.id = i.user_id
     and i.provider = 'email';
  get diagnostics v_n = row_count;
  if v_n <> cardinality(v_old) then
    raise exception 'auth.identities: expected % updates, got %', cardinality(v_old), v_n;
  end if;
end $$;
