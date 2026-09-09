-- The two card answers get room to breathe (9 Sep 2026): 400 characters
-- instead of 200, so members can express themselves. Mirrored in the
-- editor (maxLength, counter) and the join action.
alter table public.app_profile drop constraint app_profile_brings_len;
alter table public.app_profile add constraint app_profile_brings_len check (brings is null or char_length(brings) <= 400);
alter table public.app_profile drop constraint app_profile_seeks_len;
alter table public.app_profile add constraint app_profile_seeks_len check (seeks is null or char_length(seeks) <= 400);
