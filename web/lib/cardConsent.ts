/**
 * The version of the card consent wording: the "What happens next"
 * block in app/(app)/network/JoinNetworkForm.tsx, which names where a
 * member's card is shown (infitra.fit, the network, the welcome post).
 * Clicking the button under it is the consent act; the join action stores
 * this tag in app_profile.community_consent_version next to the timestamp,
 * so we can always say which wording a member agreed to.
 *
 * Bump it whenever that block's wording changes. 1.0 = the wording of the
 * morning of 9 September 2026 ("How we put you forward"); 1.1 = the same
 * afternoon, retitled "What happens next", first sentence shortened.
 */
export const CARD_CONSENT_VERSION = "1.1";
