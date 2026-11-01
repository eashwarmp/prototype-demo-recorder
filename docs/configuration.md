# Configuration

A config is an ES module whose default export describes one recording session. Sections run in order in the same
browser tab, so each one starts where the previous one ended.

```js
export default {
  url: 'https://…',                        // the page or prototype to open (logged out)
  viewport: { width: 900, height: 1860 },  // browser window in CSS pixels; bigger = sharper footage
  frame: { width: 390, height: 844 },      // the design frame your coordinates refer to
  mapping: { ox: 48, oy: 61, scale: 2.059 }, // optional; omit to calibrate automatically
  loadSeconds: 14,                         // wait after opening before calibrating (Figma needs ~12–14 s)
  fps: 30,                                 // output frame rate
  output: { width: 780, height: 1688 },    // output size; default is 2× the frame
  chromePath: undefined,                   // or CHROME_PATH
  cursor: { size: 58 },                    // touch cursor look: size, color, press
  timing: { approachMs: 650, aim: 0.25, tapMs: 110 }, // how taps move and press
  sections: [
    { name: '01_intro', run: async ({ hold, glide, tap, scroll, cue }) => { /* … */ } },
    { name: '_walk_to_history', run: async ({ tap }) => tap(195, 786) }, // "_" = performed, not filmed
  ],
};
```

## Section verbs

All coordinates are design points in `frame`.

| Verb | What it does | Logged |
|---|---|---|
| `hold(seconds)` | Waits. Use 2 s at both ends of a section as editing handles. | no |
| `glide(x, y, ms = 700)` | Moves the cursor along an eased path, paced by the wall clock so it takes `ms` even while the screencast runs. | no |
| `tap(x, y, settle = 1.5, label)` | Glides there, aims 0.25 s, presses for 110 ms, then waits `settle` s. | `tap` at the press |
| `scroll(x, y, dy, ms = 1100)` | Moves to (x, y) and scrolls `dy` design points smoothly. | `scroll` |
| `cue(text)` | Marks a narration line at this moment. | `cue` |
| `note(text)` | Free-form marker. | `note` |
| `click(label)` | Presses where the cursor already is, with no approach, so a press can land exactly on a narration cue. | `tap` at the press |
| `restart(seconds, url)` | Loads `url` (default `config.url`) and waits. After an unfilmed warm-up pass, screens come from cache without first-visit lag. It loads the URL rather than reloading, because Figma keeps the current screen in the page URL. | no |

For narration-timed takes, schedule events against the wall clock from a `cue('T0')` marker: `glide` first, then `click`
on the cue. See [`examples/flow-showcase`](../examples/flow-showcase/README.md).

## Tips

- Pick the viewport so the scaled frame lands near your output size, and the output stays sharp.
- If a section fails, its `actions.json` has a `failed` entry with the error. The clip is still written so you
  can see where it went wrong. The CLI exits with code 1.
- Use `--only a,b` to re-take sections. Earlier sections still run, unfilmed, to reach the right screen.
