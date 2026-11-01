# How it works

```
config ──► run.js ──► launch Chrome ─► open URL ─► calibrate (find the frame) ─► draw cursor
                         │
                         └─ for each section:
                              start screencast ─► run the section's script ─► stop screencast
                                     │                    │
                              frames + timestamps     action log (same clock)
                                     └──────► resample to N fps ─► ffmpeg crop/scale/encode ─► NAME.mp4
                                                                                   NAME.actions.json
```

## Why Chrome screencast frames, resampled

Two easier approaches failed on the Flow recordings:

- **Playwright's built-in video** wrote frames at a fixed rate even when Chrome delivered them late. A 180 s
  take came out 194 s long (about 7.5% slow), and the drift grew through the take.
- **Encoding screencast frames one after another with per-frame durations** stretched motion. ffmpeg gives
  every image at least one frame of its default rate, so bursts of frames during cursor moves played slowly.

Chrome's screencast sends a frame only when the page changes and stamps it with the wall-clock time.
`timeline/resample.js` builds an exact constant-rate timeline: output frame *k* shows the newest frame captured by
time *k/fps*. The clip is exactly as long as the recording, a still screen repeats its last frame, and motion
faster than the output rate drops in-between frames instead of slowing down. Frames that arrive out of order
are sorted by their own timestamps first.

The action log uses the same wall clock, from the moment capture starts, so log times are video times.
Measured on the Flow footage: frames before and after logged taps match within 0.1 s.

## Coordinates and calibration

Section scripts use the design's own points (e.g. a 390×844 phone frame). Viewers like Figma scale and centre
the frame. `navigation/mapping.js` either takes a measured `{ox, oy, scale}` or **calibrates**: it screenshots the
page and finds the bright frame on the dark viewer background. Crops are kept to even sizes for H.264.

## Interaction verification

- `pdr verify` makes a contact sheet per clip and, for every logged tap, the frame 0.1 s before and 0.9 s after.
  A correct take shows the cursor on the target, then the next screen.
- `examples/figma-flow/trace-links.mjs` reads a Figma file through the REST API and reports links to missing
  frames and overlay buttons that navigate without closing the overlay (the bug that made a Start button
  "do nothing" in the Flow prototype).
- `tests/e2e/record.test.js` records a local page whose colour changes on tap, then checks the video's colour
  just before and after each logged tap, and that video length equals real time.

## Audit

Every run writes `audit.json`. It holds start and end times; the environment (Chrome, playwright-core, Node and
ffmpeg versions); the config; the frame mapping, and whether it was calibrated; and per clip the real and video
length, drift, frame stats (captured, dropped, duplicated, longest gap) and actions. Each tap in
`NAME.actions.json` carries `change`: the share of pixels that differ strongly (any colour channel over 40/255)
between the frame just before the press and about a second later, with the cursor dot masked out.
Warnings: a failed section, drift over one frame, or a tap with `change` under 0.1%. `--debug` also keeps
each section's raw frame timestamps (`NAME.frames.json`).

## Limits

- Coordinates are hand-picked per prototype. Finding hotspots automatically is future work.
- Headless Chrome on an 8 GB laptop handles one browser at a time comfortably; run sections sequentially.
- Viewers that need a login aren't supported on purpose: no sessions or cookies are stored.
