#!/usr/bin/env bash
# Render a scene-aligned voiceover for the demo slideshow, pad each scene to
# its slideshow duration with silence, concat, and mux onto
# ops/demo/out/demo-local.mp4 → ops/demo/out/demo-local-voice.mp4.
#
# Two providers, in priority order:
#   1. ElevenLabs — used when ELEVENLABS_API_KEY is present in env (or ops/.env).
#      Defaults: ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB (Adam),
#                ELEVENLABS_MODEL=eleven_turbo_v2_5.
#   2. macOS `say` — fallback. Defaults: VOICE=Samantha, RATE=175.
#
# Scene timings mirror ops/scripts/stitch-demo.sh:
#   0:00-0:06 (6s)   hook
#   0:06-0:13 (7s)   tagline
#   0:13-0:28 (15s)  streaming
#   0:28-0:35 (7s)   complete
#   0:35-0:50 (15s)  verdict
#   0:50-0:60 (10s)  outro
#
# Intermediate combined VO is exported to ops/demo/out/voiceover.mp3 so it can
# be re-muxed standalone. When ElevenLabs is the source, ops/demo/out/demo-vo-eleven.mp3
# is also written as a named copy.
#
# Re-mux a fresh take onto the silent video (no re-render) with:
#   ffmpeg -y -i ops/demo/out/demo-local.mp4 -i <new-vo>.mp3 \
#     -c:v copy -map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k -shortest \
#     ops/demo.mp4
set -euo pipefail

cd "$(dirname "$0")/../.."

# Load ops/.env if present so ELEVENLABS_* keys are available to this script.
if [ -f ops/.env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source ops/.env
  set +o allexport
fi

VIDEO=ops/demo/out/demo-local.mp4
OUT=ops/demo/out
RAW=ops/demo/raw/vo
mkdir -p "$RAW" "$OUT"

[ -f "$VIDEO" ] || { echo "silent demo $VIDEO not found — run stitch-demo.sh first"; exit 1; }
command -v ffmpeg >/dev/null   || { echo "need ffmpeg"; exit 1; }

# Pick provider.
PROVIDER="say"
if [ -n "${ELEVENLABS_API_KEY:-}" ]; then
  PROVIDER="elevenlabs"
  command -v curl >/dev/null || { echo "need curl for elevenlabs mode"; exit 1; }
  command -v jq >/dev/null   || { echo "need jq for elevenlabs mode"; exit 1; }
fi
echo "[vo] provider=${PROVIDER}"

ELEVEN_VOICE_ID="${ELEVENLABS_VOICE_ID:-pNInz6obpgDQGcFmaJgB}"
ELEVEN_MODEL="${ELEVENLABS_MODEL:-eleven_turbo_v2_5}"
SAY_VOICE="${VOICE:-Samantha}"
SAY_RATE="${RATE:-175}"

render_elevenlabs() {
  # $1 = scene idx, $2 = text, $3 = outfile (mp3)
  local idx=$1 text=$2 out=$3
  local body
  body=$(jq -n \
    --arg text "$text" \
    --arg model "$ELEVEN_MODEL" \
    '{ text: $text, model_id: $model, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }')

  local http_code
  http_code=$(curl -sS -o "$out" -w "%{http_code}" \
    -X POST "https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}" \
    -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
    -H "Content-Type: application/json" \
    -H "Accept: audio/mpeg" \
    -d "$body")
  if [ "$http_code" != "200" ]; then
    echo "[vo] ElevenLabs scene ${idx} HTTP ${http_code}:"
    cat "$out" | head -c 400
    echo
    return 1
  fi
  local bytes
  bytes=$(wc -c < "$out")
  echo "[vo] scene ${idx}: ${bytes} bytes"
}

render_say() {
  local idx=$1 text=$2 aiff=$3
  say -v "$SAY_VOICE" -r "$SAY_RATE" -o "$aiff" "$text"
}

render_scene() {
  local idx=$1 dur=$2 text=$3
  local mp3="$RAW/scene-${idx}.mp3"
  local aiff="$RAW/scene-${idx}.aiff"
  local wav="$RAW/scene-${idx}.wav"
  local padded="$RAW/scene-${idx}-padded.wav"

  if [ "$PROVIDER" = "elevenlabs" ]; then
    render_elevenlabs "$idx" "$text" "$mp3"
    ffmpeg -y -i "$mp3" -ac 2 -ar 48000 "$wav" </dev/null >/dev/null 2>&1
  else
    render_say "$idx" "$text" "$aiff"
    ffmpeg -y -i "$aiff" -ac 2 -ar 48000 "$wav" </dev/null >/dev/null 2>&1
  fi

  # Bake a 20 ms fade-out at the tail of the raw VO so breath / plosive
  # decay doesn't click against the padded silence (important when a scene
  # lands close to its budget — e.g. scene 1 on the kqVT voice). Then pad
  # up to the scene duration, and clip if VO overshoots.
  local wavlen
  wavlen=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$wav")
  local fade_st
  fade_st=$(awk -v d="$wavlen" 'BEGIN { v = d - 0.02; if (v < 0) v = 0; printf "%.3f", v }')
  ffmpeg -y -i "$wav" \
    -af "afade=t=out:st=${fade_st}:d=0.02,apad=whole_dur=${dur}" \
    -t "$dur" -ac 2 -ar 48000 "$padded" </dev/null >/dev/null 2>&1
  echo "file 'scene-${idx}-padded.wav'" >> "$RAW/concat.txt"
}

: > "$RAW/concat.txt"

# ElevenLabs reads natural punctuation well, so use real IPFS/NFT spelling and
# "Four.meme" / "DoraHacks" — Adam pronounces them cleanly. The `say` fallback
# also reads these fine (it just sounds more robotic either way).
render_scene 1  6  "Every day, a thousand tokens launch on Four.meme. Ninety-five percent are rugs."
render_scene 2  7  "Five AI agents. Live debate. Verdict on-chain."
render_scene 3 15  "Paste a contract. Five agents debate in parallel — Contract Auditor, Liquidity Analyst, Dev Stalker, Sentiment Watcher, Meta Matcher."
render_scene 4  7  "In ten seconds, a verdict."
render_scene 5 15  "The whole debate is pinned to IPFS. A verdict NFT mints on-chain. Forever on-chain, forever auditable."
render_scene 6 10  "memegard. Upvote on DoraHacks."

# Concat the 6 padded scenes into one 60s voiceover (WAV → MP3).
ffmpeg -y -f concat -safe 0 -i "$RAW/concat.txt" \
  -c:a libmp3lame -b:a 192k -ar 48000 \
  "$OUT/voiceover.mp3" </dev/null >/dev/null 2>&1

if [ "$PROVIDER" = "elevenlabs" ]; then
  cp "$OUT/voiceover.mp3" "$OUT/demo-vo-eleven.mp3"
fi

# Mux voiceover onto the silent video. Drop the anull stereo track.
ffmpeg -y -i "$VIDEO" -i "$OUT/voiceover.mp3" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest \
  "$OUT/demo-local-voice.mp4" </dev/null >/dev/null 2>&1

echo "[vo] wrote $OUT/voiceover.mp3 and $OUT/demo-local-voice.mp4 (provider=${PROVIDER})"
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,channels,sample_rate,width,height \
  -of default=noprint_wrappers=1 "$OUT/demo-local-voice.mp4"
