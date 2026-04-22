#!/usr/bin/env bash
# Generalised live-footage splicer. Substitutes `live.mp4` into the base video
# between `start` and `end` seconds, preserving the base's audio track across
# the whole cut. No assumptions about base duration or scene count — total
# runtime is auto-detected from the base video (or pass explicitly as $5).
#
# Usage:
#   bash ops/scripts/overlay-live.sh <start-sec> <end-sec> <live.mp4> [base.mp4] [total-sec]
#
# Examples (BuilderMatch 2-min cut):
#   # Act 3 at 30..50s inside demo-builder-voice.mp4
#   bash ops/scripts/overlay-live.sh 30 50 ops/demo/raw/live-profile-build.mp4
#
#   # Chain: overlay Act 3, then Act 4, then Act 5
#   bash ops/scripts/overlay-live.sh 30 50 live-act3.mp4 ops/demo/out/demo-builder-voice.mp4
#   bash ops/scripts/overlay-live.sh 50 75 live-act4.mp4 ops/demo/out/demo-builder-voice-30-50.mp4
#   bash ops/scripts/overlay-live.sh 75 100 live-act5.mp4 ops/demo/out/demo-builder-voice-30-50-50-75.mp4
#
# Env overrides:
#   OUT=...   explicit output path
#
# The live footage is scaled+padded to 1920x1080@30 yuv420p with a dark
# letterbox so it matches the slideshow composition. Audio is taken
# ENTIRELY from the base — live-footage audio (UI beeps, mic bleed) is
# dropped so the narrated VO stays pristine.
set -euo pipefail

cd "$(dirname "$0")/../.."

START="${1:-}"
END="${2:-}"
LIVE="${3:-}"
BASE="${4:-ops/demo/out/demo-local-voice.mp4}"
TOTAL="${5:-}"

if [ -z "$START" ] || [ -z "$END" ] || [ -z "$LIVE" ]; then
  cat >&2 <<USAGE
Usage: $0 <start-sec> <end-sec> <live.mp4> [base.mp4] [total-sec]

  start, end    seconds inside the base video to replace
  live.mp4      footage that lands in the [start..end] window; trimmed to fit
  base.mp4      defaults to ops/demo/out/demo-local-voice.mp4
  total-sec     base duration in seconds; auto-detected from base.mp4 if omitted
USAGE
  exit 1
fi

[ -f "$BASE" ] || { echo "base video $BASE not found"; exit 1; }
[ -f "$LIVE" ] || { echo "live footage $LIVE not found"; exit 1; }
command -v ffmpeg >/dev/null  || { echo "need ffmpeg"; exit 1; }
command -v ffprobe >/dev/null || { echo "need ffprobe"; exit 1; }

if [ -z "$TOTAL" ]; then
  TOTAL=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$BASE" \
    | awk '{ printf "%.3f", $1 }')
fi

DUR=$(awk -v a="$END" -v b="$START" 'BEGIN{ printf "%.3f", a - b }')
# Validate: 0 <= start < end <= total
awk -v s="$START" -v e="$END" -v t="$TOTAL" 'BEGIN {
  if (s < 0 || e <= s || e > t + 0.001) { exit 1 }
}' || { echo "invalid window: 0 <= start($START) < end($END) <= total($TOTAL)"; exit 1; }

BASE_DIR=$(dirname "$BASE")
BASE_STEM=$(basename "${BASE%.mp4}")
if [ -z "${OUT:-}" ]; then
  OUT="$BASE_DIR/${BASE_STEM}-$(printf '%s-%s' "$START" "$END" | tr '.' '_').mp4"
fi

echo "[overlay] window=${START}..${END}s (dur=${DUR}s, total=${TOTAL}s)"
echo "[overlay] base=${BASE}"
echo "[overlay] live=${LIVE}"
echo "[overlay] out=${OUT}"

# Build filter graph. If start==0 we drop [vpre]; if end==total we drop [vpost].
# This avoids trim segments of zero length which would break concat=n=3.
FILTER=""
MAPS=""
COUNT=0
if awk -v s="$START" 'BEGIN{ exit !(s > 0.001) }'; then
  FILTER+="[0:v]trim=0:${START},setpts=PTS-STARTPTS[vpre];"
  MAPS+="[vpre]"
  COUNT=$((COUNT + 1))
fi
FILTER+="[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,"
FILTER+="pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0B0F1A,setsar=1,fps=30,"
FILTER+="trim=0:${DUR},setpts=PTS-STARTPTS,format=yuv420p[vmid];"
MAPS+="[vmid]"
COUNT=$((COUNT + 1))
if awk -v e="$END" -v t="$TOTAL" 'BEGIN{ exit !(t - e > 0.001) }'; then
  FILTER+="[0:v]trim=${END}:${TOTAL},setpts=PTS-STARTPTS[vpost];"
  MAPS+="[vpost]"
  COUNT=$((COUNT + 1))
fi
FILTER+="${MAPS}concat=n=${COUNT}:v=1:a=0[vout]"

ffmpeg -y -i "$BASE" -i "$LIVE" \
  -filter_complex "$FILTER" \
  -map "[vout]" -map 0:a:0 \
  -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 30 \
  -c:a copy -movflags +faststart \
  "$OUT" </dev/null >/dev/null 2>&1

echo "[overlay] wrote $OUT"
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate \
  -of default=noprint_wrappers=1 "$OUT"
