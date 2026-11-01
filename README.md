# prototype-demo-recorder

Records an interactive prototype (a Figma prototype, or any web page) as **silent, real-time MP4s**, one per
section, each with a **timestamped action log** of every tap, scroll and narration cue. The footage is ready
for an editor (or another tool) to line up with voice-over.

- **Real time, no drift.** Video length equals the time the recording took, to the frame. The screen at
  12.41 s in the video is the screen at 12.41 s in the action log (checked to within 0.1 s).
- **Scripted, repeatable takes.** Sections are short scripts (`glide`, `tap`, `scroll`, `hold`, `cue`) in
  the prototype's own design coordinates, so a re-take is one command.
- **Looks like a person using it.** Eased cursor moves, smooth scrolling and a visible touch cursor that pulses
  on each tap.
- **Verifiable.** `pdr verify` makes contact sheets and before/after strips for every logged tap, so you can
  check that every click landed without watching every clip.

Status: works end to end on one real Figma prototype (the Flow demo, 15 clips). Not yet proven on other prototypes.

## Install

Needs Node 20+, Google Chrome (or any Chromium) and `ffmpeg`/`ffprobe` on your PATH.

```sh
npm install
brew install ffmpeg          # macOS; any recent ffmpeg with libx264 works
cp .env.example .env         # optional: CHROME_PATH, FIGMA_PROTO_URL, FIGMA_TOKEN
npm test                     # unit tests, no browser needed
npm run test:e2e             # records a tiny local page in real Chrome
```

## Record

```sh
npx pdr record examples/figma-flow/lead-journey.config.mjs --out out/flow
npx pdr record my.config.mjs --out out/take2 --only 04_execution     # re-take one section
npx pdr verify out/flow                                              # contact sheets + tap strips
```

Each section produces `NAME.mp4` (H.264, no audio) and `NAME.actions.json`:

```json
{ "clip": "04_execution.mp4", "seconds": 42.76, "videoSeconds": 42.767, "fps": 30,
  "actions": [ { "t": 3.82, "type": "tap", "label": "Start", "x": 195, "y": 776 },
               { "t": 3.80, "type": "cue", "text": "Alright, let's hit Start" } ] }
```

`t` is seconds from the start of that clip. `manifest.json` lists every clip.

## Record another prototype

1. **Share it so a logged-out browser can open it.** For Figma, set the prototype link to "anyone with the link
   can view". No cookies or sessions are used or stored.
2. **Write a config.** Copy [`examples/figma-flow/lead-journey.config.mjs`](examples/figma-flow/lead-journey.config.mjs).
   Set `url`, the design `frame` size (e.g. 390×844) and a `viewport` big enough for the output resolution you want.
3. **Find coordinates** in design points: the centre of each button in the design file. For Figma,
   `examples/figma-flow/trace-links.mjs` lists every link with the frames it connects.
4. **Check the prototype's links first.** In Figma, buttons inside an overlay that navigate without closing it
   leave an invisible layer on top that swallows the next tap. `trace-links.mjs` finds them;
   `fix-overlay-close.figma.js` fixes them inside Figma.
5. **Record one section, then verify** before recording the rest. Keep at least 2 s of `hold` at both ends of
   each section as editing handles.

Details: [docs/configuration.md](docs/configuration.md) · How it works: [docs/architecture.md](docs/architecture.md)

## Layout

```
src/browser/     launch Chrome, draw the touch cursor
src/navigation/  design→screen mapping, auto-calibration, glide/tap/scroll verbs
src/recorder/    Chrome screencast capture with per-frame timestamps
src/timeline/    resampling to an exact constant frame rate, action log
src/renderer/    ffmpeg encode (crop, scale, H.264)
src/verify/      contact sheets and before/after tap strips
src/run.js       records a config's sections;  src/cli.js  the `pdr` command
examples/figma-flow/   the Flow demo config, Figma link tracer and overlay fixer
tests/           timing, missing frames, mapping, actions; tests/e2e records a local page
```

## Ownership

Private. Before publishing or commercialising, confirm who owns code and assets made under any employment or
contract terms. Recordings of third-party prototypes stay out of this repo (`.gitignore` excludes videos,
images, archives, credentials and local configs).
