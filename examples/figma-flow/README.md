# Example: Flow lead journey (Figma)

Records four sections of a Figma phone prototype: request → plan, connecting HubSpot, the live run with call
summary and transcript, and the approval.

```sh
export FIGMA_PROTO_URL='https://www.figma.com/proto/<file-key>/<name>?node-id=<home-frame>'
npx pdr record examples/figma-flow/lead-journey.config.mjs --out out/flow
npx pdr verify out/flow
```

Before recording a Figma prototype, check its links (read-only, needs a personal access token):

```sh
FIGMA_TOKEN=… node examples/figma-flow/trace-links.mjs <file-key>
```

If it reports overlay buttons that navigate without closing, run `fix-overlay-close.figma.js` inside Figma.
Coordinates in the config were read from the design file (node bounding boxes relative to their frame).
