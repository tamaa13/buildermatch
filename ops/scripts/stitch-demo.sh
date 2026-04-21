#!/usr/bin/env bash
# Stitch a 60s silent local demo video from the committed frontend screenshots.
# Output: ops/demo/out/demo-local.mp4 (1920x1080 H.264 yuv420p, 30 fps, AAC silent audio track).
#
# Why silent: homebrew ffmpeg 8.1 ships without drawtext/freetype in this env.
# Caption cards are rendered separately as SVGs under ops/demo/cards/ so a
# video editor (iMovie / Descript / Final Cut) can drop them over the slides
# along with the voiceover in post.
#
# Scene timing (total 60s):
#   0:00-0:06   01-home.png              hook: "1000 tokens/day, 95% are rugs"
#   0:06-0:13   01-home.png              tagline: "Five AI agents. Live debate."
#   0:13-0:28   02-analyze-streaming     "Paste a contract — agents debate"
#   0:28-0:35   03-analyze-complete      "In ten seconds, a verdict."
#   0:35-0:50   04-verdict-detail        "Pinned to IPFS. Minted on BNB."
#   0:50-0:60   06-logo.png              outro: "Upvote on DoraHacks."
#
# Re-mux with voiceover when ready:
#   ffmpeg -i ops/demo/out/demo-local.mp4 -i voiceover.mp3 \
#     -c:v copy -c:a aac -b:a 192k -shortest ops/demo.mp4
set -euo pipefail

cd "$(dirname "$0")/../.."

SHOTS=ops/screenshots
OUT=ops/demo/out
RAW=ops/demo/raw
mkdir -p "$OUT" "$RAW"

[ -d "$SHOTS" ] || { echo "screenshots not found at $SHOTS"; exit 1; }
[ -f "$SHOTS/06-logo.png" ] || cp "$SHOTS/01-home.png" "$SHOTS/06-logo.png"

W=1920
H=1080
FPS=30
VF="scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x0B0F1A,setsar=1,fps=${FPS},format=yuv420p"

render_slide() {
  local name=$1 dur=$2 img=$3
  ffmpeg -y -loop 1 -t "$dur" -i "$img" -vf "${VF}" \
    -c:v libx264 -preset veryfast -crf 20 -r "${FPS}" \
    "$RAW/${name}.mp4" </dev/null >/dev/null 2>&1
  echo "file '${name}.mp4'" >> "$RAW/concat.txt"
}

: > "$RAW/concat.txt"

render_slide "01-hook"       6  "$SHOTS/01-home.png"
render_slide "02-tagline"    7  "$SHOTS/01-home.png"
render_slide "03-streaming" 15  "$SHOTS/02-analyze-streaming.png"
render_slide "04-complete"   7  "$SHOTS/03-analyze-complete.png"
render_slide "05-verdict"   15  "$SHOTS/04-verdict-detail.png"
render_slide "06-outro"     10  "$SHOTS/06-logo.png"

ffmpeg -y -f concat -safe 0 -i "$RAW/concat.txt" \
  -f lavfi -t 60 -i anullsrc=r=48000:cl=stereo \
  -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart -shortest \
  "$OUT/demo-local.mp4" </dev/null >/dev/null 2>&1

echo "wrote $OUT/demo-local.mp4"
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate \
  -of default=noprint_wrappers=1 "$OUT/demo-local.mp4"
