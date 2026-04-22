#!/usr/bin/env bash
# Splice a live screen-record clip into scene 3 (13-28s) or scene 5 (35-50s)
# of the final demo video, preserving the existing ElevenLabs audio track.
#
# Usage:
#   bash ops/scripts/overlay-live-scene.sh 3 path/to/live-scene3.mp4
#   bash ops/scripts/overlay-live-scene.sh 5 path/to/live-scene5.mp4
#
# Chaining (apply both scenes):
#   bash ops/scripts/overlay-live-scene.sh 3 live-scene3.mp4          # → demo-hybrid-s3.mp4
#   bash ops/scripts/overlay-live-scene.sh 5 live-scene5.mp4 \
#     ops/demo/out/demo-hybrid-s3.mp4                                 # → demo-hybrid-s3s5.mp4
#
# Env overrides:
#   BASE=...  input base video (defaults to demo-local-voice.mp4)
#   OUT=...   explicit output path (otherwise auto-named by scene)
#   MATCH_VOLUME=1  attempt audio from live footage mixed under VO (default: drop live audio)
#
# The live footage is scaled+padded to 1920x1080 with a dark letterbox so it
# matches the slideshow composition. Audio is taken ENTIRELY from the base —
# live-footage audio (UI beeps, mic bleed) is dropped by default.
set -euo pipefail

cd "$(dirname "$0")/../.."

SCENE="${1:-}"
LIVE="${2:-}"
BASE="${3:-${BASE:-ops/demo/out/demo-local-voice.mp4}}"

if [ -z "$SCENE" ] || [ -z "$LIVE" ]; then
  cat >&2 <<USAGE
Usage: $0 <scene:3|5> <live-footage.mp4> [base-mp4]

  scene        3 → splice at 13..28s  · 5 → splice at 35..50s
  live-footage any MP4 (or anything ffmpeg decodes); longer than DUR is fine.
  base-mp4     defaults to ops/demo/out/demo-local-voice.mp4.

Chaining: pass the previous run's output as the base-mp4 arg on the next call.
USAGE
  exit 1
fi

case "$SCENE" in
  3) START=13; END=28 ;;
  5) START=35; END=50 ;;
  *) echo "scene must be 3 or 5 (got '$SCENE')"; exit 1 ;;
esac
DUR=$((END - START))

[ -f "$BASE" ] || { echo "base video $BASE not found"; exit 1; }
[ -f "$LIVE" ] || { echo "live footage $LIVE not found"; exit 1; }
command -v ffmpeg >/dev/null || { echo "need ffmpeg"; exit 1; }

BASE_DIR=$(dirname "$BASE")
BASE_STEM=$(basename "${BASE%.mp4}")
if [ -z "${OUT:-}" ]; then
  case "$BASE_STEM" in
    demo-local-voice) OUT="$BASE_DIR/demo-hybrid-s${SCENE}.mp4" ;;
    *)                OUT="$BASE_DIR/${BASE_STEM}-s${SCENE}.mp4" ;;
  esac
fi

echo "[overlay] scene=${SCENE}  window=${START}..${END}s  dur=${DUR}s"
echo "[overlay] base=${BASE}"
echo "[overlay] live=${LIVE}"
echo "[overlay] out=${OUT}"

# Normalise live footage to 1920x1080@30 yuv420p, trim to exactly DUR seconds.
# Drop its audio — base video carries the ElevenLabs VO throughout.
ffmpeg -y \
  -i "$BASE" -i "$LIVE" \
  -filter_complex "\
[0:v]trim=0:${START},setpts=PTS-STARTPTS[vpre];\
[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,\
pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0B0F1A,setsar=1,fps=30,\
trim=0:${DUR},setpts=PTS-STARTPTS,format=yuv420p[vmid];\
[0:v]trim=${END}:60,setpts=PTS-STARTPTS[vpost];\
[vpre][vmid][vpost]concat=n=3:v=1:a=0[vout]" \
  -map "[vout]" -map 0:a:0 \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 \
  -c:a copy -movflags +faststart \
  "$OUT" </dev/null >/dev/null 2>&1

echo "[overlay] wrote $OUT"
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate,channels \
  -of default=noprint_wrappers=1 "$OUT"
