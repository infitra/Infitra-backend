/**
 * The ONE place money becomes a string.
 *
 * Every surface used to inline `CHF ${(cents / 100).toFixed(2)}`, which meant
 * the currency was a literal in ~8 files while the DATA has carried a
 * `currency` column all along (challenges, sessions, transactions, payouts).
 * Adding a second currency would otherwise have been a hunt through the
 * frontend rather than a schema change.
 *
 * Deliberately NOT Intl.NumberFormat: it formats differently depending on the
 * resolved locale, which differs between the server render and the browser —
 * exactly the mismatch class that froze the journey card's clock (see
 * lib/time/useHasMounted). A fixed "CODE amount" shape is deterministic
 * everywhere, and matches the brand's existing "CHF 99" style.
 *
 * NOTE for real multi-currency: display is only one of three pieces. The
 * others are the schema CHECKs pinning currency = 'CHF' on app_challenge /
 * app_session / app_creator_subscription_plan, and the buyer-fee gross-up in
 * lib/pricing.ts, whose fixed component (CHF 0.30) is Stripe's CHF fee — EUR
 * is 0.25. Widening the display alone would quietly mis-price EUR.
 */

export const DEFAULT_CURRENCY = "CHF";

/** "CHF 102.05" · pass decimals: 0 for round figures ("CHF 178"). */
export function formatMoney(
  cents: number | null | undefined,
  currency: string | null | undefined = DEFAULT_CURRENCY,
  { decimals = 2 }: { decimals?: 0 | 2 } = {},
): string {
  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  const amount = Number(cents ?? 0) / 100;
  return `${code} ${amount.toFixed(decimals)}`;
}

/** Same shape, for values already in MAJOR units (e.g. app_payout.amount). */
export function formatMajor(
  amount: number | string | null | undefined,
  currency: string | null | undefined = DEFAULT_CURRENCY,
  { decimals = 2 }: { decimals?: 0 | 2 } = {},
): string {
  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  return `${code} ${Number(amount ?? 0).toFixed(decimals)}`;
}
