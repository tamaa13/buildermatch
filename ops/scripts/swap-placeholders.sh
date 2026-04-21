#!/usr/bin/env bash
# One-shot: substitute placeholder URLs in ops/pitch/slides.html and re-render
# ops/pitch/pitch.pdf via Chrome headless. Keeps the source HTML intact by
# working on a temp copy.
#
# Usage:
#   LIVE_URL=https://memegard.vercel.app \
#   DORAHACKS_URL=https://dorahacks.io/buidl/xxxxx \
#   TWITTER_HANDLE=memegard_ai \
#   TELEGRAM_HANDLE=memegard_ai \
#   bash ops/scripts/swap-placeholders.sh
#
# Unset variables are replaced with a warning placeholder so judges notice.
set -euo pipefail

cd "$(dirname "$0")/../.."

SRC=ops/pitch/slides.html
TMP=$(mktemp -t memegard-slides.XXXXXX.html)
OUT=ops/pitch/pitch.pdf

[ -f "$SRC" ] || { echo "missing $SRC"; exit 1; }
command -v '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' >/dev/null 2>&1 || true

LIVE_URL="${LIVE_URL:-<<SET LIVE_URL>>}"
DORAHACKS_URL="${DORAHACKS_URL:-<<SET DORAHACKS_URL>>}"
TWITTER_HANDLE="${TWITTER_HANDLE:-memegard_ai}"
TELEGRAM_HANDLE="${TELEGRAM_HANDLE:-memegard_ai}"

sed \
  -e "s|localhost:3000|${LIVE_URL}|g" \
  -e "s|@memegard_io|@${TWITTER_HANDLE}|g" \
  -e "s|t.me/memegard|t.me/${TELEGRAM_HANDLE}|g" \
  -e "s|><b>Upvote:</b> DoraHacks<|><b>Upvote:</b> <a style=\"color:inherit\" href=\"${DORAHACKS_URL}\">${DORAHACKS_URL}</a><|g" \
  "$SRC" > "$TMP"

echo "[swap] LIVE_URL       → $LIVE_URL"
echo "[swap] DORAHACKS_URL  → $DORAHACKS_URL"
echo "[swap] TWITTER_HANDLE → @$TWITTER_HANDLE"
echo "[swap] TELEGRAM_HANDLE → @$TELEGRAM_HANDLE"

'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless --disable-gpu --no-pdf-header-footer --print-to-pdf-no-header \
  --print-to-pdf="$OUT" "file://${TMP}" 2>&1 | tail -3

echo "wrote $OUT"

# Leave the temp HTML around so you can open it in a browser to verify before
# uploading. Delete at your convenience.
echo "temp HTML: $TMP"
