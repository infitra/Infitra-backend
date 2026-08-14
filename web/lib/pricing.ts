/**
 * Buyer-side price math — the ONE mirror of the checkout gross-up.
 *
 * The Swiss price-indication ordinance (PBV) requires the actually payable
 * TOTAL, including mandatory surcharges, to be shown WITH the offer, not
 * first at checkout. The buyer covers the card processing fee (3% plus
 * CHF 0.30), so every price display on the buyer page must be able to say
 * the all-in number.
 *
 * MUST stay in lockstep with functions/create_checkout_session/index.ts
 * (BUYER_ABSORBS_FEES branch): total = ceil((base + 30) / 0.97). If the fee
 * model changes there, change it here in the same commit.
 */

const FIXED_FEE_CENTS = 30;
const PERCENT_FEE_RATE = 0.03;

/** The all-in amount Stripe will charge, in cents. */
export function totalWithCardFeeCents(baseCents: number): number {
  return Math.ceil((baseCents + FIXED_FEE_CENTS) / (1 - PERCENT_FEE_RATE));
}

/** "CHF 102.05" — the all-in total for a base price in cents. */
export function formatTotalWithCardFee(baseCents: number): string {
  return `CHF ${(totalWithCardFeeCents(baseCents) / 100).toFixed(2)}`;
}

/** The standard one-line disclosure used wherever the base price shows. */
export function cardFeeDisclosure(baseCents: number): string {
  return `Total incl. card processing (3% + CHF 0.30): ${formatTotalWithCardFee(baseCents)}`;
}
