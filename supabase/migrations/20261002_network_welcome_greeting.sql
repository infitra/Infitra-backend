-- The member welcome greets a studio by its name and an expert by first name
-- (2026-10-02).
--
-- The first real card-live welcome (Michael Bachmann, 1 Oct) opened with
-- "Hi Coach,": the greeting took the first word of the card name, and his
-- card name is his brand, "Coach Michael Personal Training & Coaching". Every
-- studio would have hit the same ("Hi The,").
--
-- Now:
--   studio  -> the card name as written ("Hi EVOLUTIONfit,"). The card is
--              the studio, and its inbox may be read by more than one person.
--   expert  -> the first word of the note on the invite they redeemed. The
--              founder writes it when minting, starting with the person's
--              full name ("Michael Bachmann", "Marco Palmieri · ..."), so it
--              is a name by construction, never a brand.
--   neither -> the old rule (app_receipt_greeting over the profile fields),
--              for an expert without an invite or with a note that does not
--              start with a plain name.
--
-- Surgical: patch the live definition with a count assertion (the
-- 20260815_email_imprint_footer pattern). Privileges survive CREATE OR REPLACE.

do $patch$
declare
  src text := pg_get_functiondef('public.app_enqueue_network_card_emails(uuid)'::regprocedure);
  anchor text := 'v_first := app_receipt_greeting(null, p.display_name, p.full_name, p.username, p.email);';
  patched text := $new$-- Studio: the card name. Expert: first name from the invite note the
  -- founder wrote; a card name can be a brand. Else the old rule.
  if p.entity_type = 'studio' and nullif(trim(p.display_name), '') is not null then
    v_first := trim(p.display_name);
  else
    select regexp_replace(split_part(trim(i.note), ' ', 1), '[,;:·]+$', '')
      into v_first
      from app_creator_invite i
     where i.redeemed_by = p_profile_id
       and nullif(trim(i.note), '') is not null
     order by i.redeemed_at desc nulls last
     limit 1;
    if v_first is null or v_first !~ '^[[:alpha:]][[:alpha:]''’-]*$' then
      v_first := app_receipt_greeting(null, p.display_name, p.full_name, p.username, p.email);
    else
      v_first := upper(left(v_first, 1)) || substr(v_first, 2);
    end if;
  end if;$new$;
begin
  if (length(src) - length(replace(src, anchor, ''))) / length(anchor) <> 1 then
    raise exception 'greeting patch: anchor found % times, expected 1',
      (length(src) - length(replace(src, anchor, ''))) / length(anchor);
  end if;
  execute replace(src, anchor, patched);
end
$patch$;
