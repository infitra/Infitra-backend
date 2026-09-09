/**
 * The version of the card consent wording: the "How we put you forward"
 * block in app/(app)/network/JoinNetworkForm.tsx, which names where a
 * member's card is shown (infitra.fit, the network, the welcome post).
 * Clicking the button under it is the consent act; the join action stores
 * this tag in app_profile.community_consent_version next to the timestamp,
 * so we can always say which wording a member agreed to.
 *
 * Bump it whenever that block's meaning changes. 1.0 = the wording of
 * 9 September 2026.
 */
export const CARD_CONSENT_VERSION = "1.0";
