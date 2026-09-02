#!/bin/sh
# Refresh db/schema.sql from the linked Supabase project. Safe to rerun.
# Dumps to a temp file and replaces only on success, because
# `supabase db dump -f` truncates the target before dumping.
# Needs: Docker Desktop running (the CLI runs pg_dump in a container).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp)"
docker info >/dev/null 2>&1 || { echo "Docker Desktop is not running: open -a Docker, wait, retry" >&2; exit 1; }
( cd "$ROOT" && supabase db dump --linked -f "$TMP" </dev/null )
if [ -s "$TMP" ] && grep -q "CREATE TABLE" "$TMP"; then
  cp "$TMP" "$ROOT/db/schema.sql"
  echo "db/schema.sql refreshed: $(wc -l < "$TMP" | tr -d ' ') lines"
else
  echo "dump failed, db/schema.sql untouched" >&2; exit 1
fi
rm -f "$TMP"
