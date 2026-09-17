-- The email footer tagline follows the brand (2026-09-17).
--
-- WHY: every transactional email signed off with "INFITRA · Live
-- experiences by complementary experts". True when the network was pairs of
-- experts, and a closed door now that studios and gyms are in it: a gym
-- owner reading a line about complementary experts is being told, quietly,
-- that this is not for them.
--
-- The replacement is the brand line the landing already leads with
-- ("INFITRA makes professional collaboration in fitness and health easy"),
-- so the company says one thing in both places.
--
-- Five enqueue functions carry the tagline twice each (HTML footer + text
-- footer). The string holds no single quotes, so one replacement is valid
-- inside both the dollar-quoted templates and the single-quoted
-- concatenations. Patched against the LIVE definitions, the way the imprint
-- footer was (2026-08-15): the repo's migration mirrors lag production and
-- retyping five templates invites drift. Each function is count-checked and
-- the block aborts rather than half-patch.

do $patch$
declare
  fn      regprocedure;
  def     text;
  a       text := 'INFITRA · Live experiences by complementary experts';
  r       text := 'INFITRA · Professional collaboration in fitness and health, made easy';
  n       int;
  touched int := 0;
begin
  for fn in
    select p.oid::regprocedure from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.prosrc like '%' || a || '%'
  loop
    def := pg_get_functiondef(fn);
    n := (length(def) - length(replace(def, a, ''))) / length(a);
    if n <> 2 then
      raise exception '% carries the tagline % times, expected 2 (html + text)', fn, n;
    end if;
    execute replace(def, a, r);
    touched := touched + 1;
  end loop;

  if touched <> 5 then
    raise exception 'patched % functions, expected 5', touched;
  end if;
end
$patch$;
