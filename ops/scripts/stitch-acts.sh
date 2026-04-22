#!/usr/bin/env bash
# Concat N act clips into one 1920x1080 H.264 silent-audio video with an
# optional crossfade between each adjacent pair. Replaces the memegard-era
# stitch-demo.sh (which was locked to 6 fixed scenes + screenshots).
#
# Usage:
#   bash ops/scripts/stitch-acts.sh <out.mp4> <xfade-sec> <clip1.mp4> <clip2.mp4> ...
#
# Examples:
#   # BuilderMatch 6-act cut, 0.3s crossfades:
#   bash ops/scripts/stitch-acts.sh ops/demo/out/demo-builder.mp4 0.3 \
#     ops/demo/raw/act-1-hook.mp4 \
#     ops/demo/raw/act-2-insight.mp4 \
#     ops/demo/raw/act-3-live-profile.mp4 \
#     ops/demo/raw/act-4-live-swipe.mp4 \
#     ops/demo/raw/act-5-live-match.mp4 \
#     ops/demo/raw/act-6-vision.mp4
#
#   # No crossfade (hard cuts):
#   bash ops/scripts/stitch-acts.sh out.mp4 0 clip1.mp4 clip2.mp4 clip3.mp4
#
# Each clip is normalised to 1920x1080@30 yuv420p with a dark letterbox. The
# output carries a silent AAC audio track so render-vo.sh can mux a VO onto
# it via a single ffmpeg re-mux.
set -euo pipefail

cd "$(dirname "$0")/../.."

OUT="${1:-}"
XFADE="${2:-}"
shift 2 || true
CLIPS=("$@")

if [ -z "$OUT" ] || [ -z "$XFADE" ] || [ "${#CLIPS[@]}" -lt 2 ]; then
  cat >&2 <<USAGE
Usage: $0 <out.mp4> <xfade-sec> <clip1.mp4> <clip2.mp4> [clip3.mp4 ...]

  xfade-sec   crossfade duration between adjacent clips. 0 = hard cuts.
  clips       2 or more MP4/MOV/etc inputs. Each is scaled+padded to 1920x1080.
USAGE
  exit 1
fi

command -v ffmpeg >/dev/null  || { echo "need ffmpeg"; exit 1; }
command -v ffprobe >/dev/null || { echo "need ffprobe"; exit 1; }

W=1920
H=1080
FPS=30
NORM="scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x0B0F1A,setsar=1,fps=${FPS},format=yuv420p"

# Measure each clip's duration.
declare -a DURS
TOTAL=0
for c in "${CLIPS[@]}"; do
  [ -f "$c" ] || { echo "clip $c not found"; exit 1; }
  d=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$c")
  DURS+=("$d")
  TOTAL=$(awk -v a="$TOTAL" -v b="$d" 'BEGIN{ printf "%.3f", a + b }')
done

INPUTS=()
for c in "${CLIPS[@]}"; do
  INPUTS+=(-i "$c")
done

# Build filter graph.
# Each input is normalised: [N:v] -> [vN]
FILTER=""
for i in "${!CLIPS[@]}"; do
  FILTER+="[${i}:v]${NORM}[v${i}];"
done

N=${#CLIPS[@]}
if awk -v x="$XFADE" 'BEGIN{ exit !(x + 0 <= 0) }'; then
  # Pure concat (no xfade).
  CHAIN=""
  for i in "${!CLIPS[@]}"; do
    CHAIN+="[v${i}]"
  done
  FILTER+="${CHAIN}concat=n=${N}:v=1:a=0[vout]"
  FINAL_DUR="$TOTAL"
else
  # Chained xfade. Each step offsets at cumulative - xfade_duration.
  OFFSET="${DURS[0]}"
  OFFSET=$(awk -v a="$OFFSET" -v x="$XFADE" 'BEGIN{ printf "%.3f", a - x }')
  PREV="v0"
  for i in $(seq 1 $((N - 1))); do
    NEXT="xf${i}"
    FILTER+="[${PREV}][v${i}]xfade=transition=fade:duration=${XFADE}:offset=${OFFSET}[${NEXT}];"
    if [ "$i" -lt "$((N - 1))" ]; then
      # Running offset: + next clip duration - xfade.
      OFFSET=$(awk -v a="$OFFSET" -v b="${DURS[$i]}" -v x="$XFADE" \
        'BEGIN{ printf "%.3f", a + b - x }')
    fi
    PREV="$NEXT"
  done
  # Rename final tail to [vout].
  FILTER+="[${PREV}]null[vout]"
  FINAL_DUR=$(awk -v t="$TOTAL" -v x="$XFADE" -v n="$N" \
    'BEGIN{ printf "%.3f", t - (n - 1) * x }')
fi

echo "[stitch] clips=${N}  xfade=${XFADE}s  total_in=${TOTAL}s  total_out=${FINAL_DUR}s"
echo "[stitch] out=${OUT}"

# Silent stereo audio track matching final video duration so downstream
# VO re-mux has something to overwrite with `-c:a aac -shortest`.
ffmpeg -y "${INPUTS[@]}" \
  -f lavfi -t "$FINAL_DUR" -i anullsrc=r=48000:cl=stereo \
  -filter_complex "$FILTER" \
  -map "[vout]" -map "${N}:a" \
  -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r "${FPS}" \
  -c:a aac -b:a 128k -movflags +faststart \
  "$OUT" </dev/null

echo "[stitch] wrote $OUT"
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate \
  -of default=noprint_wrappers=1 "$OUT"
