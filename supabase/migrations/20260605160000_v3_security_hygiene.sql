-- Security hygiene — from the architecture/safety analysis (ARCHITECTURE_AND_SAFETY.md §3).
-- Three advisor-flagged fixes, each verified safe against the codebase + access chain.

-- 1. Lock down app_profile_stats (unfiltered SECURITY DEFINER view).
--    Clients must read profiles via app_profile_public, which applies
--    can_view_profile(). app_profile_public is owned by postgres and runs with
--    owner privileges, so it keeps reading app_profile_stats after this revoke.
--    Verified: no app code queries app_profile_stats directly.
REVOKE SELECT ON public.app_profile_stats FROM anon, authenticated;

-- 2. De-list the public profile-images bucket.
--    A broad SELECT policy let any client ENUMERATE every uploaded file. The
--    bucket is public, so object URLs (getPublicUrl) keep serving without it,
--    and app code only uploads + builds public URLs (no .list()/.download()).
DROP POLICY IF EXISTS profile_images_public_read ON storage.objects;

-- 3. Pin search_path on the 4 SECURITY DEFINER collab-invite functions
--    (mutable search_path on a DEFINER function is a privilege-escalation
--    vector). Verified: none reference uuid_generate / extensions.* unqualified,
--    so 'public' is behavior-preserving.
ALTER FUNCTION public.accept_collab_invite(uuid, uuid) SET search_path TO 'public';
ALTER FUNCTION public.send_additional_collab_invite(uuid, uuid, uuid, text, integer) SET search_path TO 'public';
ALTER FUNCTION public.send_collab_invite(uuid, uuid, text, integer) SET search_path TO 'public';
ALTER FUNCTION public.send_collab_invites_with_draft(uuid, text, text, jsonb) SET search_path TO 'public';
