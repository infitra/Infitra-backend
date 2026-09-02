#!/bin/sh
# Refresh db/schema.sql from the linked Supabase project. Safe to rerun.
#
# Two things this handles that bit us on 2 Sep 2026:
#  1. The Supabase CLI expects its files under <workdir>/supabase/. This
#     repo keeps them at the root, so we point --workdir at a scratch dir
#     that contains a symlink named "supabase" back to the repo.
#  2. `supabase db dump -f` truncates the target before dumping, so a failed
#     run (Docker not running) leaves an empty file. Dump to a temp file and
#     replace only on success.
# Needs: Docker Desktop running (the CLI runs pg_dump in a container).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
ln -s "$ROOT" "$WORK/supabase"
TMP="$WORK/schema.sql"
docker info >/dev/null 2>&1 || { echo "Docker Desktop is not running: open -a Docker, wait, retry" >&2; exit 1; }
supabase --workdir "$WORK" db dump --linked -f "$TMP" </dev/null
if [ -s "$TMP" ] && grep -q "CREATE TABLE" "$TMP"; then
  cp "$TMP" "$ROOT/db/schema.sql"
  echo "db/schema.sql refreshed: $(wc -l < "$TMP" | tr -d ' ') lines"
else
  echo "dump failed, db/schema.sql untouched" >&2; exit 1
fi
rm -rf "$WORK"
