// Probe runtime prototype states: open a frame, perform taps/scrolls, screenshot the phone after each step.
// Usage: node probe.mjs <outdir> '<json: [{name, node, steps:[["tap",x,y]|["scroll",dy]|["wait",s]]}]>'
import { chromium } from 'playwright-core';
const [out, spec] = process.argv.slice(2);
const OX = 48, OY = 60, S = 2.059;
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 1860 } })).newPage();
const clip = { x: OX, y: OY, width: 390 * S, height: 844 * S };
for (const p of JSON.parse(spec)) {
  if (!process.env.FIGMA_FILE_KEY) throw new Error('Set FIGMA_FILE_KEY.');
  await page.goto(`https://www.figma.com/proto/${process.env.FIGMA_FILE_KEY}/flow?node-id=${p.node}&starting-point-node-id=111-5055&scaling=contain&hide-ui=1&hotspot-hints=0&content-scaling=fixed`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(14000);
  let i = 0;
  await page.screenshot({ path: `${out}/${p.name}-${i++}.png`, clip, scale: 'css' });
  for (const [kind, a, b] of p.steps) {
    if (kind === 'tap') { await page.mouse.click(OX + a * S, OY + b * S); await page.waitForTimeout(1500); }
    if (kind === 'scroll') { await page.mouse.move(OX + 195 * S, OY + 500 * S); for (let k = 0; k < 20; k++) { await page.mouse.wheel(0, (a * S) / 20); await page.waitForTimeout(30); } await page.waitForTimeout(800); }
    if (kind === 'wait') await page.waitForTimeout(a * 1000);
    await page.screenshot({ path: `${out}/${p.name}-${i++}.png`, clip, scale: 'css' });
  }
}
await browser.close();
