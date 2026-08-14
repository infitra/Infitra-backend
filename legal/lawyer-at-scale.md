# Legal pack · open items for the lawyer at scale

The legal pack (imprint, privacy policy, terms, refund policy, published
14 Aug 2026, all v1.0) is lean and self-written by design: complete on the
mandatory items, honest about the product, plain language. These are the
documented open decisions and known gaps a lawyer should revisit at
incorporation or when EU revenue becomes material. Keep this file current.

## Decisions taken deliberately (confirm, do not silently reverse)

1. **INFITRA is the merchant of record.** Participants contract with
   INFITRA for purchase + access; experts deliver content as independents.
   Matches the money flow (INFITRA's Stripe account, INFITRA pays out).
   Consequence accepted: INFITRA answers contractually for delivery.
2. **EU withdrawal position**: primary basis CRD Art. 16(l) (leisure
   services with fixed dates), belt-and-braces via a voluntary refund
   scheme at least as good as the CRD (pro-rata in the 14-day window,
   express immediate-start request at purchase, acknowledgment in the
   read-first box). The Art. 16(l) classification of a multi-week
   experience with community + materials is genuinely unsettled: CONFIRM.
3. **No EU Art. 27 representative during the pilot.** Strictly required
   from the first EU sale (the "occasional" exemption does not fit a
   commerce platform); accepted as a known gap on near-zero enforcement
   against micro controllers. Trigger to appoint (~EUR 150-500/yr,
   DataRep-class): first cohort with meaningful EU participants, or
   incorporation, whichever first.
4. **Health data**: reflections/check-ins/health-scoped enrollment treated
   as sensitive; explicit consent captured as an unticked checkbox at
   participant signup, recorded in auth metadata (health_consent_at +
   terms_version + terms_accepted_at). Lawyer should re-draft the consent
   wording and consider a DPIA once recording ships.
5. **No cookie banner**: only strictly-necessary cookies + cookieless
   Umami (EU). Standing rule: ANY marketing/tracking cookie added later
   flips this answer and requires a banner + policy update.
6. **Jurisdiction**: seat Hofstetten SO; mandatory consumer forums
   expressly reserved (CPC 32/35, Lugano 15-17, IPRG 120(2)).

## Known gaps / to-do before or at scale

- **Deletion runbook**: policy promises account deletion/anonymization
  within 30 days on request; no `app_anonymize_user()` exists yet and
  financial FKs are ON DELETE RESTRICT (correct, 10-year books). Manual
  service-role procedure needed before the first real request; build the
  function with the admin board.
- **Daily.co DPA with SCCs**: request via help@daily.co and countersign.
  The one US processor without DPF evidence, touching live video.
- **DPF certification check**: verify the SWISS-U.S. line (not just
  EU-U.S.) for Vercel, Resend, Stripe, Google at dataprivacyframework.gov;
  policy wording already covers both outcomes (DPF where held, else SCCs).
- **Record of processing activities**: one-page table (purpose, data,
  recipients, country, retention) — cheap insurance, GDPR Art. 30 wording
  is narrower than the Swiss exemption.
- **Consent versioning at scale**: terms_version is recorded at signup;
  no re-consent flow exists for future material changes yet (notice +
  30 days + exit is promised in Terms §12).
- **EU withdrawal button** (in force 19 Jun 2026): the labeled email flow
  ("Cancel my purchase") covers the spirit; formal button at scale.
- **Recording feature**: before shipping the 24h replay, build the consent
  surface (notice at booking for recorded experiences + in-room indicator
  + camera-off opt-out). Policy/terms text is pre-planted; text alone is
  not consent.
- **German versions** once German-market marketing begins; English is the
  operative version today.
- **VAT/OSS** for EU digital-ish services once EU revenue is material;
  Swiss VAT from CHF 100k.
- **Session-reschedule notification**: Terms promise only in-space
  visibility (honest today); consider an email/notification when built.
- **Payout timing rule**: pay experts in the back half of the 14-day
  window so refunds/chargebacks surface first; refunds reduce revenue
  before the split (now stated in Terms §11 and pilot-terms).

## Operator facts the documents assert (keep true)

- hello@infitra.fit must be a working mailbox (impressum + all documents).
- Receipt email = statutory order confirmation (UWG 3(1)(s) Ziff. 4):
  outbox + drain reliability is compliance infrastructure.
- Technical-log retention (12 months) is enforced by the
  `purge-technical-logs` cron; receipts exempt (10-year rule).
- Transactional email footers carry the operator identity + imprint link
  (patched into all four enqueue functions).
- Fonts are self-hosted (privacy §7 claims it); do not reintroduce a
  font CDN.
- Buyer page shows the all-in total incl. card fee (PBV); the mirror of
  the checkout gross-up lives in web/lib/pricing.ts — change both
  together.
