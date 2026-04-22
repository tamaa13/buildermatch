# OBS preset — apply before recording

OBS 32.1.1 is already at `/Applications/OBS.app`. First launch will create a default "Untitled" scene collection + "Untitled" profile. Run through this once to turn it into the BuilderMatch recording setup, then the same config persists across launches.

Target canvas: 1920×1080 native, 60 fps, x264 CRF 18, ~10 Mbps, AAC 192 kbps stereo, MP4 output. Matches `ops/demo/obs-scene.json`.

---

## Step 1 — Launch + accept auto-config wizard

- First launch will show an **Auto-Configuration Wizard**. Pick **"Optimize just for recording, I will not be streaming"** → let it run. It won't pick CRF 18 on its own; override below.
- Close the wizard.

## Step 2 — Output (encoder + filename)

Menu: **OBS → Settings → Output**

- **Output Mode:** `Advanced`
- Tab **Recording**:
  - **Type:** `Standard`
  - **Recording Path:** `/Users/tama/Work/memegard/ops/demo/raw`
  - **Recording Format:** `MPEG-4 (.mp4)`
  - **Video Encoder:** `x264`
  - **Rate Control:** `CRF`
  - **CRF:** `18`
  - **Keyframe Interval:** `2`
  - **CPU Usage Preset:** `veryfast`
  - **Profile:** `high`
  - **Tune:** `(None)`
- Tab **Audio**:
  - **Audio Bitrate (Track 1):** `192`

## Step 3 — Video (canvas + fps)

Menu: **OBS → Settings → Video**

- **Base (Canvas) Resolution:** `1920x1080`
- **Output (Scaled) Resolution:** `1920x1080`
- **Downscale Filter:** `Lanczos (Sharpened scaling, 36 samples)`
- **Common FPS Values:** `60`

## Step 4 — Audio

Menu: **OBS → Settings → Audio**

- **Sample Rate:** `48 kHz`
- **Channels:** `Stereo`
- **Desktop Audio:** set to your main output device (so UI beeps are captured *for reference* — `overlay-live.sh` drops them when muxing onto the narrated base, so this is safe to leave on).
- **Mic/Auxiliary Audio:** disable unless you want to VO live (you're rendering VO separately via `render-vo.sh`).

## Step 5 — Scenes

Menu: **Scenes** panel (bottom-left) → **+**

Create three scenes in order:

1. **Act 3 — Profile Build**
2. **Act 4 — Swipe Feed**
3. **Act 5 — Match & Mint**

For each, click **Sources** panel → **+** → **Display Capture**:
- Name: `Display`
- Display: the monitor that will show the browser window
- Hit **OK**.

If you want to crop to just the browser window: right-click the Display source → **Filters** → **+** → **Crop/Pad** → set `Top/Bottom/Left/Right` to frame the window. Or just record full-screen and crop in post with ffmpeg.

## Step 6 — Hotkeys

Menu: **OBS → Settings → Hotkeys**

Recommended (match `ops/demo/obs-scene.json`):

| Action | Hotkey |
| --- | --- |
| Start Recording | `⌘⇧R` |
| Stop Recording | `⌘⇧S` |
| Switch to "Act 3 — Profile Build" | `⌥1` |
| Switch to "Act 4 — Swipe Feed" | `⌥2` |
| Switch to "Act 5 — Match & Mint" | `⌥3` |

Hit **Apply** → **OK**.

## Step 7 — Filename

OBS default: `%CCYY-%MM-%DD %hh-%mm-%ss.mp4`. Optionally change to `act-%CCYY%MM%DD-%hh%mm%ss.mp4` via **Settings → Advanced → Recording → Filename Formatting**.

After each take, rename:
```
mv "ops/demo/raw/<timestamped-file>.mp4" "ops/demo/raw/act-3-live-profile.mp4"
# etc.
```

## Step 8 — Pre-flight check

Do a 5-second throwaway recording. Verify:
- File lands in `ops/demo/raw/`
- `ffprobe` reports `1920x1080`, `60 fps`, `h264 high profile`, AAC 48 kHz stereo.

```bash
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of default=nw=1 ops/demo/raw/<latest>.mp4
```

If anything off, tweak in Settings → the next take will use the corrected values.

## Post-production handoff

Once all three Act captures are in `ops/demo/raw/`, feed them through the pipeline:

```bash
# 1. Stitch 6 acts (Acts 1/2/6 = Claude Design montage, Acts 3/4/5 = your OBS captures)
bash ops/scripts/stitch-acts.sh ops/demo/out/demo-builder.mp4 0.3 \
  ops/demo/raw/act-1-hook.mp4 \
  ops/demo/raw/act-2-insight.mp4 \
  ops/demo/raw/act-3-live-profile.mp4 \
  ops/demo/raw/act-4-live-swipe.mp4 \
  ops/demo/raw/act-5-live-match.mp4 \
  ops/demo/raw/act-6-vision.mp4

# 2. Render + mux VO
bash ops/scripts/render-vo.sh ops/demo/act-script.json ops/demo/out/demo-builder.mp4

# 3. (Optional) Overlay a re-recorded act on top of the final
bash ops/scripts/overlay-live.sh <start> <end> <new-take.mp4> ops/demo/out/demo-builder-voice.mp4
```
