// Runs INSIDE Figma (a scripting plugin, or the Figma MCP "use_figma" tool) on the current page.
// For every button inside a frame shown as an overlay that navigates away without closing the overlay,
// it puts "Close overlay" first and keeps the original actions (destinations, transitions) unchanged.
// Re-run safe: already-fixed buttons are skipped. Returns counts so you can confirm nothing is left.
const page = figma.currentPage;
const withReactions = page.findAll((n) => 'reactions' in n && n.reactions.length);
const overlayFrames = new Set();
const scan = (acts) => {
  for (const a of acts ?? []) {
    if (a.type === 'NODE' && (a.navigation === 'OVERLAY' || a.navigation === 'SWAP') && a.destinationId) overlayFrames.add(a.destinationId);
    if (a.type === 'CONDITIONAL') for (const b of a.conditionalBlocks ?? []) scan(b.actions);
  }
};
for (const n of withReactions) for (const r of n.reactions) scan(r.actions);
const frameOf = (n) => { let p = n; while (p.parent && p.parent.type !== 'SECTION' && p.parent.type !== 'PAGE') p = p.parent; return p; };
let fixed = 0;
for (const n of withReactions) {
  if (!overlayFrames.has(frameOf(n).id)) continue;
  let touched = false;
  const reactions = n.reactions.map((r) => {
    const acts = r.actions ?? [];
    if (acts[0]?.type === 'CLOSE' || !acts.some((a) => a.type === 'NODE' && a.navigation === 'NAVIGATE')) return r;
    touched = true;
    return { ...r, actions: [{ type: 'CLOSE' }, ...acts] };
  });
  if (touched) { await n.setReactionsAsync(reactions); fixed++; }
}
return { overlayFrames: overlayFrames.size, fixed };
