# INFITRA

Creator collaboration platform for live fitness experiences. Complementary
experts build one live experience together; INFITRA provides everything
around it. Product at https://www.infitra.fit

This repository holds the whole company: product, backend, marketing and
plans. Map:

| Path | What it is |
|---|---|
| `web/` | The website and app (Next.js). Deployed to Vercel from `main`. |
| `supabase/` | The backend, in the Supabase CLI's standard layout: `config.toml`, `functions/` (Edge Functions: payments, live rooms, tokens, emails), `migrations/` (schema, RLS, triggers). Run `supabase` commands from the repo root. |
| `content/` | Marketing content system: social posts and carousel decks rendered from HTML. |
| `db/` | `schema.sql`, a full dump of the live database schema (the second copy of the schema, off Supabase). Refresh after each migration: `db/dump.sh` (needs Docker Desktop running). |
| `docs/` | Plans and reference: `PILOT_PLAN.md`, `LANDING_V2_PLAN.md`, `ARCHITECTURE_AND_SAFETY.md`. |
| `legal/` | Legal pack notes. |
| `BRAND.md` | Voice, messaging architecture, visual identity. Governs all public copy. |
| `CLAUDE.md` | Working context for Claude Code sessions. Imports `BRAND.md`. |

## The three things you reach for most

- **LinkedIn decks (PDF):** `content/out/carousel-offer-more.pdf`, `-why-now`, `-collaborating`, `-deal`
- **Instagram slides (PNG):** `content/out/carousel/<deck>-01.png` … in swipe order
- **Captions and calendar:** `content/PLAN.md`

`content/out/` is a build output and is not in git. If it is empty, rebuild:

    python3 content/build_posts.py
    for f in content/templates/carousel/*.html; do s=$(basename "$f" .html); \
      ./content/render.sh "carousel/$s" 1080 1350 "content/out/carousel/$s.png"; done
    python3 content/make_carousels.py

Open the exports in Finder: `open content/out`

## Why the folder used to be called "supabase"

It started life as the Supabase CLI directory and the rest of the company
moved in around it. Renamed to `infitra` on 2 Sep 2026, and the Supabase
files moved into `supabase/` the same day, which is the layout the CLI
expects. Nothing in `web/` moved, because Vercel deploys from there.
