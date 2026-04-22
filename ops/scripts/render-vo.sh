#!/usr/bin/env bash
# Render a scene-aligned voiceover track from an act-script JSON file.
# Provider priority: ElevenLabs (ELEVENLABS_API_KEY present) → macOS `say`.
#
# Usage:
#   bash ops/scripts/render-vo.sh [act-script.json] [base-video.mp4]
#
#   act-script.json   defaults to ops/demo/act-script.json
#   base-video.mp4    silent base to mux onto; defaults to ops/demo/out/demo-local.mp4
#
# Env overrides:
#   ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL
#   VOICE, RATE (for `say` fallback)
#   OUT_VO  path for combined voiceover mp3 (defaults next to base video)
#   OUT_MUX path for re-muxed demo video (defaults next to base video)
#
# Act-script format (JSON array):
#   [
#     { "act": 1, "duration": 15, "text": "..." },
#     { "act": 2, "duration": 15, "text": "..." },
#     ...
#   ]
# `duration` = seconds the act occupies; VO is rendered, faded 20ms at the
# tail, and padded with silence up to `duration`. Overshoot is hard-clipped.
#
# Output:
#   voiceover.mp3         combined VO, MP3 192k, total = sum(duration)
#   demo-vo-eleven.mp3    provider-tagged copy (only when ElevenLabs)
#   <base>-voice.mp4      silent base muxed with the VO track
set -euo pipefail

cd "$(dirname "$0")/../.."

# Load ops/.env if present so ELEVENLABS_* keys are available.
if [ -f ops/.env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source ops/.env
  set +o allexport
fi

SCRIPT="${1:-ops/demo/act-script.json}"
BASE="${2:-ops/demo/out/demo-local.mp4}"
OUT_DIR=$(dirname "$BASE")
BASE_STEM=$(basename "${BASE%.mp4}")
OUT_VO="${OUT_VO:-${OUT_DIR}/voiceover.mp3}"
OUT_MUX="${OUT_MUX:-${OUT_DIR}/${BASE_STEM}-voice.mp4}"
RAW=ops/demo/raw/vo
mkdir -p "$RAW" "$OUT_DIR"

[ -f "$SCRIPT" ] || { echo "act-script $SCRIPT not found — write it or pass a path"; exit 1; }
[ -f "$BASE" ]   || { echo "base video $BASE not found — run stitch-acts.sh first"; exit 1; }
command -v ffmpeg >/dev/null  || { echo "need ffmpeg"; exit 1; }
command -v ffprobe >/dev/null || { echo "need ffprobe"; exit 1; }
command -v jq >/dev/null      || { echo "need jq"; exit 1; }

PROVIDER="say"
if [ -n "${ELEVENLABS_API_KEY:-}" ]; then
  PROVIDER="elevenlabs"
  command -v curl >/dev/null || { echo "need curl for elevenlabs mode"; exit 1; }
fi
echo "[vo] provider=${PROVIDER}  script=${SCRIPT}  base=${BASE}"

ELEVEN_VOICE_ID="${ELEVENLABS_VOICE_ID:-pNInz6obpgDQGcFmaJgB}"
ELEVEN_MODEL="${ELEVENLABS_MODEL:-eleven_turbo_v2_5}"
SAY_VOICE="${VOICE:-Samantha}"
SAY_RATE="${RATE:-175}"

render_elevenlabs() {
  local idx=$1 text=$2 out=$3
  local body
  body=$(jq -n --arg text "$text" --arg model "$ELEVEN_MODEL" \
    '{ text: $text, model_id: $model, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }')
  local http_code
  http_code=$(curl -sS -o "$out" -w "%{http_code}" \
    -X POST "https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}" \
    -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
    -H "Content-Type: application/json" \
    -H "Accept: audio/mpeg" \
    -d "$body")
  if [ "$http_code" != "200" ]; then
    echo "[vo] ElevenLabs act ${idx} HTTP ${http_code}:" >&2
    head -c 400 "$out" >&2
    echo >&2
    return 1
  fi
  local bytes
  bytes=$(wc -c < "$out")
  echo "[vo] act ${idx}: ${bytes} bytes"
}

render_say() {
  local idx=$1 text=$2 aiff=$3
  say -v "$SAY_VOICE" -r "$SAY_RATE" -o "$aiff" "$text"
  echo "[vo] act ${idx}: say rendered"
}

render_act() {
  local idx=$1 dur=$2 text=$3
  local mp3="$RAW/act-${idx}.mp3"
  local aiff="$RAW/act-${idx}.aiff"
  local wav="$RAW/act-${idx}.wav"
  local padded="$RAW/act-${idx}-padded.wav"

  if [ "$PROVIDER" = "elevenlabs" ]; then
    render_elevenlabs "$idx" "$text" "$mp3"
    ffmpeg -y -i "$mp3" -ac 2 -ar 48000 "$wav" </dev/null >/dev/null 2>&1
  else
    render_say "$idx" "$text" "$aiff"
    ffmpeg -y -i "$aiff" -ac 2 -ar 48000 "$wav" </dev/null >/dev/null 2>&1
  fi

  # Bake a 20ms tail fade so voice decay doesn't click against silence pad.
  local wavlen
  wavlen=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$wav")
  local fade_st
  fade_st=$(awk -v d="$wavlen" 'BEGIN { v = d - 0.02; if (v < 0) v = 0; printf "%.3f", v }')
  ffmpeg -y -i "$wav" \
    -af "afade=t=out:st=${fade_st}:d=0.02,apad=whole_dur=${dur}" \
    -t "$dur" -ac 2 -ar 48000 "$padded" </dev/null >/dev/null 2>&1
  echo "file 'act-${idx}-padded.wav'" >> "$RAW/concat.txt"
}

: > "$RAW/concat.txt"

# Iterate acts from JSON. Uses null-delimited read to tolerate newlines/quotes.
TOTAL_DUR=0
while IFS=$'\t' read -r act_num dur text; do
  [ -z "$act_num" ] && continue
  render_act "$act_num" "$dur" "$text"
  TOTAL_DUR=$(awk -v a="$TOTAL_DUR" -v b="$dur" 'BEGIN{ printf "%.3f", a + b }')
done < <(jq -r '.[] | [.act, .duration, .text] | @tsv' "$SCRIPT")

# Concat the padded acts into one voiceover track.
ffmpeg -y -f concat -safe 0 -i "$RAW/concat.txt" \
  -c:a libmp3lame -b:a 192k -ar 48000 \
  "$OUT_VO" </dev/null >/dev/null 2>&1

if [ "$PROVIDER" = "elevenlabs" ]; then
  cp "$OUT_VO" "${OUT_DIR}/demo-vo-eleven.mp3"
fi

# Mux voiceover onto the silent base. Base is assumed already at TOTAL_DUR
# seconds (stitch-acts.sh produced it). If base is shorter, -shortest will
# clip the VO to match; if longer, VO ends and base tail silence fills.
ffmpeg -y -i "$BASE" -i "$OUT_VO" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest \
  "$OUT_MUX" </dev/null >/dev/null 2>&1

echo "[vo] total script duration: ${TOTAL_DUR}s"
echo "[vo] wrote $OUT_VO  and  $OUT_MUX (provider=${PROVIDER})"
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,channels,sample_rate,width,height \
  -of default=noprint_wrappers=1 "$OUT_MUX"
