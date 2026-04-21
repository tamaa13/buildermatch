#!/usr/bin/env bash
# Render a scene-aligned voiceover track with macOS `say` (Samantha voice),
# pad each scene to its slideshow duration with silence, concat, and mux
# onto ops/demo/out/demo-local.mp4 → ops/demo/out/demo-local-voice.mp4.
#
# Scene timings mirror ops/scripts/stitch-demo.sh:
#   0:00-0:06 (6s)  hook
#   0:06-0:13 (7s)  tagline
#   0:13-0:28 (15s) streaming
#   0:28-0:35 (7s)  complete
#   0:35-0:50 (15s) verdict
#   0:50-0:60 (10s) outro
#
# This is a safety-net fallback. Replace with ElevenLabs / human VO when ready:
#   ffmpeg -y -i ops/demo/out/demo-local.mp4 -i voiceover.mp3 \
#     -c:v copy -map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k -shortest \
#     ops/demo.mp4
set -euo pipefail

cd "$(dirname "$0")/../.."

VOICE="${VOICE:-Samantha}"
RATE="${RATE:-175}"
VIDEO=ops/demo/out/demo-local.mp4
OUT=ops/demo/out
RAW=ops/demo/raw/vo
mkdir -p "$RAW" "$OUT"

[ -f "$VIDEO" ] || { echo "silent demo $VIDEO not found — run stitch-demo.sh first"; exit 1; }
command -v say >/dev/null      || { echo "need macOS /usr/bin/say"; exit 1; }
command -v ffmpeg >/dev/null   || { echo "need ffmpeg"; exit 1; }

# Scene text + duration in seconds. Voice aims to land inside the scene; the rest is silence.
render_scene() {
  local idx=$1 dur=$2 text=$3
  local aiff="$RAW/scene-${idx}.aiff"
  local wav="$RAW/scene-${idx}.wav"
  local padded="$RAW/scene-${idx}-padded.wav"

  say -v "$VOICE" -r "$RATE" -o "$aiff" "$text"
  ffmpeg -y -i "$aiff" -ac 2 -ar 48000 "$wav" </dev/null >/dev/null 2>&1

  # Pad with trailing silence up to scene duration; cut if VO overshoots.
  ffmpeg -y -i "$wav" -af "apad=whole_dur=${dur}" -t "$dur" -ac 2 -ar 48000 "$padded" </dev/null >/dev/null 2>&1
  echo "file 'scene-${idx}-padded.wav'" >> "$RAW/concat.txt"
}

: > "$RAW/concat.txt"

render_scene 1  6  "A thousand tokens launch on Four meme every day. Ninety five percent are rugs."
render_scene 2  7  "Five AI agents. Live debate. Verdict on chain."
render_scene 3 15  "Paste a contract. Five agents debate in parallel. Contract auditor. Liquidity analyst. Dev stalker. Sentiment watcher. Meta matcher."
render_scene 4  7  "In ten seconds, a verdict."
render_scene 5 15  "The whole debate is pinned to I P F S. A verdict N F T mints on chain. Forever on chain, forever auditable."
render_scene 6 10  "memegard. Upvote on Dora Hacks."

# Concat the 6 padded scenes into one 60s voiceover.
ffmpeg -y -f concat -safe 0 -i "$RAW/concat.txt" -c:a aac -b:a 160k -ar 48000 "$RAW/voiceover.m4a" </dev/null >/dev/null 2>&1

# Mux voiceover onto the silent video. Drop the anull stereo track.
ffmpeg -y -i "$VIDEO" -i "$RAW/voiceover.m4a" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest \
  "$OUT/demo-local-voice.mp4" </dev/null >/dev/null 2>&1

echo "wrote $OUT/demo-local-voice.mp4"
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,channels,sample_rate,width,height \
  -of default=noprint_wrappers=1 "$OUT/demo-local-voice.mp4"
