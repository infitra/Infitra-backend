-- The member welcome gets a sign-off (2026-09-30).
--
-- Seen by Yves on his phone in the first preview: the network welcome ended
-- on "Yves / Founder, INFITRA" with no closing line, where the participant
-- welcome has "See you inside,". Yves chose the same line for members: cool
-- and still somewhat personal. Same spacing as the participant welcome:
-- sign-off at 24px, name at 12px.
--
-- Surgical: patch the live definition with count assertions (the
-- 20260815_email_imprint_footer pattern), so nothing else in the function can
-- drift. Privileges survive CREATE OR REPLACE.

do $patch$
declare
  src      text := pg_get_functiondef('public.app_enqueue_network_card_emails(uuid)'::regprocedure);
  old_html text := '<p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Yves<br>';
  new_html text := '<p style="margin:24px 0 0;font-size:15px;line-height:1.6;">See you inside,</p>'
                || E'\n        <p style="margin:12px 0 0;font-size:15px;line-height:1.6;">Yves<br>';
  old_txt  text := E'network/edit\n\nYves\nFounder, INFITRA';
  new_txt  text := E'network/edit\n\nSee you inside,\n\nYves\nFounder, INFITRA';
begin
  if (length(src) - length(replace(src, old_html, ''))) / length(old_html) <> 1 then
    raise exception 'signoff patch: html anchor found % times, expected 1',
      (length(src) - length(replace(src, old_html, ''))) / length(old_html);
  end if;
  if (length(src) - length(replace(src, old_txt, ''))) / length(old_txt) <> 1 then
    raise exception 'signoff patch: text anchor found % times, expected 1',
      (length(src) - length(replace(src, old_txt, ''))) / length(old_txt);
  end if;
  execute replace(replace(src, old_html, new_html), old_txt, new_txt);
end
$patch$;
