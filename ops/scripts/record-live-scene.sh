#!/usr/bin/env bash
# record-live-scene.sh — capture a chromeless browser window to mp4 for demo overlay
#
# Usage:
#   record-live-scene.sh <out.mp4> <duration_sec> <url>
#
# Opens Chrome --app=<url> (chromeless, position 0,0, large), records screen
# via ffmpeg avfoundation for <duration> seconds, then closes that window.

set -euo pipefail

OUT="${1:?out path}"
DUR="${2:?duration sec}"
URL="${3:?url}"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CHROME_USER_DATA="/tmp/memegard-chrome-$$"

"$CHROME" \
  --user-data-dir="$CHROME_USER_DATA" \
  --app="$URL" \
  --window-position=0,0 \
  --window-size=1512,950 \
  --disable-features=TranslateUI \
  --no-first-run \
  --no-default-browser-check \
  --incognito \
  --hide-crash-restore-bubble \
  &
CHROME_PID=$!

sleep 3  # let page render + SSE connect

ffmpeg -hide_banner -loglevel warning \
  -f avfoundation -framerate 30 -i "7" \
  -t "$DUR" \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  -vf "crop=3024:1900:0:64,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#0a0a0f" \
  -an -y "$OUT"

kill "$CHROME_PID" 2>/dev/null || true
rm -rf "$CHROME_USER_DATA"

echo "recorded → $OUT ($(du -h "$OUT" | cut -f1))"
