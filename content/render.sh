#!/usr/bin/env bash
# Render an INFITRA post template to a PNG at exact Instagram dimensions.
#
#   ./content/render.sh quote-card 1080 1080 out/my-post.png
#   ./content/render.sh carousel-slide 1080 1350 out/slide-1.png
#
# Renders at 2x and downsamples with sips, so type and the logo mark stay
# crisp instead of aliasing at native size. Uses the real General Sans
# webfont, so output matches the site exactly.
set -euo pipefail

TPL="${1:?template name, e.g. quote-card}"
W="${2:-1080}"
H="${3:-1080}"
OUT="${4:-content/out/${TPL}.png}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SRC="$ROOT/content/templates/${TPL}.html"
[ -f "$SRC" ] || { echo "no such template: $SRC" >&2; exit 1; }

mkdir -p "$(dirname "$ROOT/$OUT")"
TMP="$(mktemp -d)"

"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --virtual-time-budget=8000 \
  --allow-file-access-from-files \
  --window-size="${W},${H}" \
  --screenshot="$TMP/2x.png" "file://$SRC" >/dev/null 2>&1

cp "$TMP/2x.png" "$ROOT/$OUT"
sips -z "$H" "$W" "$ROOT/$OUT" >/dev/null 2>&1
rm -rf "$TMP"

echo "$OUT  ->  $(sips -g pixelWidth -g pixelHeight "$ROOT/$OUT" | tail -2 | tr -d '\n' | tr -s ' ')"
