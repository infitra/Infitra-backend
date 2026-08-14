-- Transactional emails carry the operator identity (2026-08-15).
--
-- Legal pack rollout: every email INFITRA sends should identify who sends
-- it (name + postal address) and link the Legal Notice — the same identity
-- the impressum shows. Templates live inline in four enqueue functions;
-- this patches all four LIVE definitions surgically (the repo's migration
-- mirrors lag production, and retyping four templates invites drift).
--
-- Three uniform anchors across both quoting styles (the address and link
-- text contain no single quotes, so the same replacement string is valid
-- inside dollar-quoted templates and single-quoted concatenations):
--   1. html footer line  → insert the identity line after it
--   2. html www link     → append the Legal Notice link
--   3. text footer       → insert identity + imprint URL (two variants:
--      dollar-quoted templates end "...experts\nwww.infitra.fit$txt$";
--      the pilot function concatenates with || E'\n' ||)
-- Each anchor is count-checked; the block aborts rather than half-patch.

do $patch$
declare
  fn regprocedure;
  def text;
  patched text;
  a1 text := $a$INFITRA · Live experiences by complementary experts<br>$a$;
  r1 text := $a$INFITRA · Live experiences by complementary experts<br>Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland<br>$a$;
  a2 text := $a$>www.infitra.fit</a></p>$a$;
  r2 text := $a$>www.infitra.fit</a> · <a href="https://www.infitra.fit/imprint" style="color:#0891b2;text-decoration:none;">Legal Notice</a></p>$a$;
  a3 text;
  r3 text;
  n int;
begin
  for fn in
    select oid::regprocedure from pg_proc
    where proname in ('admin_email_enqueue_receipt','app_enqueue_welcome_email',
                      'app_enqueue_session_reminders','app_enqueue_pilot_application_emails')
  loop
    def := pg_get_functiondef(fn);

    -- 1) HTML identity line (exactly once per function).
    n := (length(def) - length(replace(def, a1, ''))) / length(a1);
    if n <> 1 then
      raise exception '% html footer anchor found % times, expected 1', fn, n;
    end if;
    patched := replace(def, a1, r1);

    -- 2) HTML Legal Notice link (exactly once per function).
    n := (length(patched) - length(replace(patched, a2, ''))) / length(a2);
    if n <> 1 then
      raise exception '% html link anchor found % times, expected 1', fn, n;
    end if;
    patched := replace(patched, a2, r2);

    -- 3) TEXT footer: template style vs concatenation style.
    a3 := 'INFITRA · Live experiences by complementary experts' || chr(10) || 'www.infitra.fit$txt$';
    r3 := 'INFITRA · Live experiences by complementary experts' || chr(10)
          || 'Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland' || chr(10)
          || 'www.infitra.fit · Legal notice: www.infitra.fit/imprint$txt$';
    if position(a3 in patched) > 0 then
      patched := replace(patched, a3, r3);
    else
      -- Concatenation style wraps across lines: "... experts' || E'\n'"
      -- newline, then "    || 'www.infitra.fit';"
      a3 := $a$'INFITRA · Live experiences by complementary experts' || E'\n'$a$ || chr(10) || $a$    || 'www.infitra.fit';$a$;
      r3 := $a$'INFITRA · Live experiences by complementary experts' || E'\n'$a$ || chr(10) || $a$    || 'Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland' || E'\n'$a$ || chr(10) || $a$    || 'www.infitra.fit · Legal notice: www.infitra.fit/imprint';$a$;
      if position(a3 in patched) = 0 then
        raise exception '% text footer anchor not found in either style', fn;
      end if;
      patched := replace(patched, a3, r3);
    end if;

    execute patched;
  end loop;
end
$patch$;
