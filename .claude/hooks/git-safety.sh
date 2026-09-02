#!/bin/sh
# Stop hook: nothing may exist only on this Mac.
# - unpushed commits: push them to origin (already deliberate work)
# - uncommitted changes: warn (never auto-commit)
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
dirty=$(git status --porcelain 2>/dev/null | grep -c .)
unpushed=$(git rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
note=""
if [ "${unpushed:-0}" -gt 0 ]; then
  if git push -q origin "$branch" >/dev/null 2>&1; then
    note="pushed $unpushed commit(s) to origin/$branch"
  else
    note="PUSH FAILED: $unpushed commit(s) exist only on this Mac"
  fi
fi
msg=""
[ "${dirty:-0}" -gt 0 ] && msg="$dirty uncommitted change(s) exist only on this Mac"
[ -n "$note" ] && msg="${msg:+$msg · }$note"
[ -n "$msg" ] && printf '{"systemMessage": "Git safety: %s"}\n' "$msg"
exit 0
