-- Founding network card v2 (6 Sep 2026, Yves's product decisions)
--   The card asks: open to collaborate with (experts, studios), what you
--   bring, what would complement you. The single sentence (collab_wish) goes.
--   Posts permission (announce_ok) is its own toggle, default on, explained.
--   /apply loses the studio qualifier and the "dream offer": one open question
--   remains, the existing success_description, relabelled on the form.
-- No dead columns: dropped, not deprecated.

alter table public.app_profile
  drop constraint if exists app_profile_collab_wish_len,
  drop column if exists collab_wish,
  add column if not exists open_to text[] not null default '{}',
  add column if not exists brings text,
  add column if not exists seeks text,
  add column if not exists announce_ok boolean not null default true;

alter table public.app_profile
  drop constraint if exists app_profile_open_to_check,
  add constraint app_profile_open_to_check
    check (open_to <@ array['experts', 'studios']::text[]),
  drop constraint if exists app_profile_brings_len,
  add constraint app_profile_brings_len
    check (brings is null or char_length(brings) <= 200),
  drop constraint if exists app_profile_seeks_len,
  add constraint app_profile_seeks_len
    check (seeks is null or char_length(seeks) <= 200);

comment on column public.app_profile.announce_ok is
  'Founding network: INFITRA may mention this card in external posts (LinkedIn etc.), showing only what the member put in the profile. Default on, member can switch off.';

alter table public.app_pilot_application
  drop constraint if exists app_pilot_application_last_upsell_studio_only,
  drop constraint if exists app_pilot_application_dream_offer_len,
  drop column if exists last_upsell,
  drop column if exists dream_offer;

-- ── Reader: card carries open_to, brings, seeks ─────────────────────────────
create or replace function public.load_founding_community(p_public_only boolean default true)
returns jsonb
language plpgsql security definer stable
set search_path = 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_min_vis text;
  v_count integer;
  v_self_vis text;
  v_self_admin boolean := false;
  v_members jsonb;
begin
  if p_public_only then
    v_min_vis := 'public';
  else
    if v_uid is null then
      return jsonb_build_object('authorized', false, 'reason', 'not_authenticated',
                                'count', 0, 'members', '[]'::jsonb);
    end if;
    select community_visibility, coalesce(is_admin, false)
      into v_self_vis, v_self_admin
      from app_profile where id = v_uid;
    if not v_self_admin and coalesce(v_self_vis, 'none') = 'none' then
      select count(*) into v_count
        from app_profile
       where role in ('creator', 'admin') and community_visibility in ('members', 'public');
      return jsonb_build_object('authorized', false, 'reason', 'card_not_visible',
                                'count', v_count, 'members', '[]'::jsonb);
    end if;
    v_min_vis := 'members';
  end if;

  select count(*) into v_count
    from app_profile p
   where p.role in ('creator', 'admin')
     and (p.community_visibility = 'public'
          or (v_min_vis = 'members' and p.community_visibility = 'members'));

  if p_public_only and v_count < 3 then
    return jsonb_build_object('authorized', true, 'count', v_count, 'members', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(card order by consent_at asc nulls last), '[]'::jsonb)
    into v_members
    from (
      select p.community_consent_at as consent_at,
             jsonb_build_object(
               'id', p.id,
               'display_name', p.display_name,
               'avatar_url', p.avatar_url,
               'tagline', p.tagline,
               'bio', p.bio,
               'username', p.username,
               'entity_type', p.entity_type,
               'is_founding_expert', p.is_founding_expert,
               'visibility', p.community_visibility,
               'open_to', to_jsonb(p.open_to),
               'brings', p.brings,
               'seeks', p.seeks,
               'facts', jsonb_build_object(
                 'city', p.profile_facts->>'city',
                 'disciplines', coalesce(p.profile_facts->'disciplines', '[]'::jsonb),
                 'focus', p.profile_facts->>'focus'
               ),
               'credentials', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'kind', c.kind, 'title', c.title, 'org', c.org,
                          'year', c.year, 'year_end', c.year_end)
                        order by c.sort_order, c.created_at)
                   from app_expert_credential c
                  where c.profile_id = p.id
               ), '[]'::jsonb)
             ) as card
        from app_profile p
       where p.role in ('creator', 'admin')
         and p.display_name is not null
         and (p.community_visibility = 'public'
              or (v_min_vis = 'members' and p.community_visibility = 'members'))
    ) cards;

  return jsonb_build_object('authorized', true, 'count', v_count, 'members', v_members);
end;
$$;

-- ── admin_people: the card fields for the People tab ────────────────────────
create or replace function public.admin_people(p_query text default null, p_limit integer default 200)
returns jsonb
language plpgsql security definer
set search_path = 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();

    select coalesce(jsonb_agg(row_to_json(r)::jsonb order by r.created_at desc), '[]'::jsonb) into v
    from (
        select
            p.id, p.display_name, p.username, p.role, p.is_admin, p.visibility,
            p.created_at, p.is_founding_expert,
            p.workspace_enabled, p.entity_type, p.community_visibility, p.announce_ok,
            p.open_to, p.brings, p.seeks,
            u.email,
            u.banned_until,
            u.raw_user_meta_data ->> 'terms_version' as terms_version,
            u.raw_user_meta_data ->> 'terms_accepted_at' as terms_accepted_at,
            u.raw_user_meta_data ->> 'health_consent_at' as health_consent_at,
            (select count(*) from app_transaction t where t.buyer_id = p.id and t.status = 'succeeded') as purchases,
            (select count(*) from app_challenge_member m where m.user_id = p.id) as memberships
        from app_profile p
        left join auth.users u on u.id = p.id
        where p_query is null or p_query = ''
           or p.display_name ilike '%' || p_query || '%'
           or p.username ilike '%' || p_query || '%'
           or u.email ilike '%' || p_query || '%'
        order by p.created_at desc
        limit least(greatest(coalesce(p_limit, 200), 1), 500)
    ) r;

    return v;
end;
$$;

-- ── Founder email without the dropped fields ────────────────────────────────
create or replace function public.app_enqueue_pilot_application_emails(p_application_id uuid)
returns void
language plpgsql security definer
set search_path = 'public'
as $$
declare
  a           record;
  v_first     text;
  v_audience  text;
  v_type      text;
  v_rows_html text := '';
  v_rows_text text := '';
  v_html      text;
  v_text      text;
begin
  select * into a from app_pilot_application where id = p_application_id;
  if not found then
    return;
  end if;

  v_audience := case a.audience_size_range
    when 'under_500'  then 'Under 500'
    when '500_to_2k'  then '500 to 2,000'
    when '2k_to_10k'  then '2,000 to 10,000'
    when '10k_to_50k' then '10,000 to 50,000'
    when 'over_50k'   then 'Over 50,000'
    else a.audience_size_range
  end;
  v_type := case when a.applicant_type = 'studio' then 'Studio or gym' else 'Expert' end;

  v_rows_html :=
       '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;white-space:nowrap;vertical-align:top;">Name</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.name) || '</td></tr>'
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Type</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || v_type || '</td></tr>'
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Email</td>'
    || '<td style="padding:6px 0;font-size:14px;"><a href="mailto:' || app_html_escape(a.email) || '" style="color:#0891b2;text-decoration:none;">' || app_html_escape(a.email) || '</a></td></tr>'
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Expertise</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.expertise) || '</td></tr>';

  v_rows_text := 'Name:      ' || a.name || E'\n'
              || 'Type:      ' || v_type || E'\n'
              || 'Email:     ' || a.email || E'\n'
              || 'Expertise: ' || a.expertise || E'\n';

  if a.channel_url is not null then
    v_rows_html := v_rows_html
      || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Channel</td>'
      || '<td style="padding:6px 0;font-size:14px;">'
      || case when a.channel_url ~* '^https?://'
              then '<a href="' || app_html_escape(a.channel_url) || '" style="color:#0891b2;text-decoration:none;">' || app_html_escape(a.channel_url) || '</a>'
              else '<span style="color:#0F2229;">' || app_html_escape(a.channel_url) || '</span>'
         end
      || '</td></tr>';
    v_rows_text := v_rows_text || 'Channel:   ' || a.channel_url || E'\n';
  end if;

  if v_audience is not null then
    v_rows_html := v_rows_html
      || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Audience</td>'
      || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(v_audience) || '</td></tr>';
    v_rows_text := v_rows_text || 'Audience:  ' || v_audience || E'\n';
  end if;

  if a.location is not null then
    v_rows_html := v_rows_html
      || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Location</td>'
      || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.location) || '</td></tr>';
    v_rows_text := v_rows_text || 'Location:  ' || a.location || E'\n';
  end if;

  v_rows_html := v_rows_html
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Partner</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">'
    || case when a.has_partner
            then 'Has someone in mind' || case when a.partner_info is not null then ': ' || app_html_escape(a.partner_info) else '' end
            else 'Looking for a complement' || case when a.complement_interest is not null then ': ' || app_html_escape(a.complement_interest) else '' end
       end
    || '</td></tr>';
  v_rows_text := v_rows_text
    || 'Partner:   '
    || case when a.has_partner
            then 'has someone in mind' || coalesce(': ' || a.partner_info, '')
            else 'looking for a complement' || coalesce(': ' || a.complement_interest, '')
       end || E'\n';

  if a.success_description is not null then
    v_rows_html := v_rows_html
      || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Successful collaboration</td>'
      || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.success_description) || '</td></tr>';
    v_rows_text := v_rows_text || 'Successful collaboration: ' || a.success_description || E'\n';
  end if;

  v_rows_html := v_rows_html
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Featuring</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">'
    || case when a.announce_consent then 'Yes: card on infitra.fit and in posts' else 'Switched off' end
    || '</td></tr>';
  v_rows_text := v_rows_text || 'Featuring: '
    || case when a.announce_consent then 'yes' else 'switched off' end || E'\n';

  v_html := '<div style="background:#F2EFE8;padding:32px 12px;">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">'
    || '<tr><td style="padding:36px 32px;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;color:#0F2229;">'
    || '<img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">'
    || '<p style="margin:0 0 20px;font-size:16px;font-weight:700;">New founding network application</p>'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' || v_rows_html || '</table>'
    || '</td></tr></table></td></tr></table></div>';

  v_text := 'New founding network application' || E'\n\n' || v_rows_text;

  insert into public.app_email_outbox (kind, to_email, subject, html_body, text_body, target_id)
  values ('pilot_application_founder', 'yves@infitra.fit',
          'Founding network (' || lower(v_type) || '): ' || a.name, v_html, v_text, a.id);

  if nullif(a.email, '') is null then
    return;
  end if;

  v_first := coalesce(nullif(split_part(a.name, ' ', 1), ''), a.name);

  v_html := '<div style="background:#F2EFE8;padding:32px 12px;">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">'
    || '<tr><td style="padding:36px 32px;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;color:#0F2229;">'
    || '<img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ' || app_html_escape(v_first) || ',</p>'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Your application for the founding network has arrived. Thank you for taking the time.</p>'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">We read every application personally and reply within a few days.</p>'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">In the meantime, the pilot terms are public: <a href="https://www.infitra.fit/pilot-terms" style="color:#0891b2;text-decoration:none;">www.infitra.fit/pilot-terms</a>. And if anything comes to mind, just reply to this email.</p>'
    || '<p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Speak soon,</p>'
    || '<p style="margin:12px 0 0;font-size:15px;line-height:1.6;">Yves<br>'
    || '<span style="color:#475569;font-size:13px;">Founder, INFITRA</span></p>'
    || '</td></tr></table>'
    || '<p style="margin:20px 0 0;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Live experiences by complementary experts<br>Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland<br>'
    || '<a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a> · <a href="https://www.infitra.fit/imprint" style="color:#0891b2;text-decoration:none;">Legal Notice</a></p>'
    || '</td></tr></table></div>';

  v_text := 'Hi ' || v_first || ',' || E'\n\n'
    || 'Your application for the founding network has arrived. Thank you' || E'\n'
    || 'for taking the time.' || E'\n\n'
    || 'We read every application personally and reply within a few days.' || E'\n\n'
    || 'In the meantime, the pilot terms are public:' || E'\n'
    || 'https://www.infitra.fit/pilot-terms' || E'\n'
    || 'And if anything comes to mind, just reply to this email.' || E'\n\n'
    || 'Speak soon,' || E'\n\n'
    || 'Yves' || E'\n'
    || 'Founder, INFITRA' || E'\n\n'
    || 'INFITRA · Live experiences by complementary experts' || E'\n'
    || 'Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland' || E'\n'
    || 'www.infitra.fit · Legal notice: www.infitra.fit/imprint';

  insert into public.app_email_outbox (kind, to_email, subject, html_body, text_body, target_id)
  values ('pilot_application_confirm', a.email,
          'Your INFITRA founding network application', v_html, v_text, a.id);
end;
$$;
