// Read-only checks of a Figma prototype's links through the REST API, before recording anything:
//  1. links whose destination doesn't exist,
//  2. buttons inside an overlay that navigate without closing the overlay first. The overlay can stay on top,
//     invisible but still catching taps, so the next button "does nothing" in the presentation player.
// Usage: FIGMA_TOKEN=... node trace-links.mjs <file-key> [frame-name-filter]
const [fileKey, filter = ''] = process.argv.slice(2);
const token = process.env.FIGMA_TOKEN;
if (!fileKey || !token) throw new Error('Usage: FIGMA_TOKEN=... node trace-links.mjs <file-key> [frame-name-filter]');

const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, { headers: { 'X-Figma-Token': token } });
if (!res.ok) throw new Error(`Figma answered ${res.status}: ${await res.text()}`);
const doc = await res.json();

const nodes = new Map();
const parent = new Map();
const walk = (n, p) => { nodes.set(n.id, n); parent.set(n.id, p); for (const c of n.children ?? []) walk(c, n.id); };
for (const pageNode of doc.document.children) walk(pageNode, null);
const screenOf = (id) => { let cur = id; while (parent.get(cur) && !['CANVAS', 'SECTION'].includes(nodes.get(parent.get(cur)).type)) cur = parent.get(cur); return nodes.get(cur); };
const actionsOf = (n) => (n.interactions ?? []).flatMap((i) => (i.actions ?? []).map((a) => ({ trigger: i.trigger?.type, ...a })));
const flat = (acts) => acts.flatMap((a) => (a.type === 'CONDITIONAL' ? (a.conditionalBlocks ?? []).flatMap((b) => flat(b.actions ?? [])) : [a]));

const overlays = new Set();
for (const n of nodes.values()) for (const a of flat(actionsOf(n))) if (a.navigation === 'OVERLAY' || a.navigation === 'SWAP') overlays.add(a.destinationId);

const missing = [];
const unclosed = [];
for (const n of nodes.values()) {
  const acts = actionsOf(n);
  if (!acts.length) continue;
  const screen = screenOf(n.id);
  if (filter && !screen?.name?.includes(filter)) continue;
  for (const a of flat(acts)) if (a.destinationId && !nodes.has(a.destinationId)) missing.push(`${screen?.name} / ${n.name} → ${a.destinationId}`);
  const navigatesFirst = (n.interactions ?? []).some((i) => (i.actions ?? []).some((a) => a.navigation === 'NAVIGATE') && i.actions[0]?.type !== 'CLOSE');
  if (overlays.has(screen?.id) && navigatesFirst) unclosed.push(`${screen.name} / ${n.name} (${n.id})`);
}
console.log(`${nodes.size} nodes, ${overlays.size} frames shown as overlays`);
console.log(`Links to missing frames: ${missing.length}`); missing.forEach((m) => console.log(`  ${m}`));
console.log(`Overlay buttons that navigate without closing: ${unclosed.length}`); unclosed.forEach((m) => console.log(`  ${m}`));
console.log(unclosed.length ? 'Fix with fix-overlay-close.figma.js (run inside Figma).' : 'No overlay issues.');
process.exitCode = missing.length || unclosed.length ? 1 : 0;
