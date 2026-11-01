import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMapping, findBrightBox } from '../src/navigation/mapping.js';

test('maps design points to page pixels and back', () => {
  const m = createMapping({ ox: 48, oy: 61, scale: 2.059 });
  const p = m.toScreen(195, 776);
  assert.ok(Math.abs(p.x - (48 + 195 * 2.059)) < 1e-9);
  const back = m.toDesign(p.x, p.y);
  assert.ok(Math.abs(back.x - 195) < 1e-9 && Math.abs(back.y - 776) < 1e-9);
});

test('crop covers the design frame with even sizes, as H.264 requires', () => {
  const c = createMapping({ ox: 48, oy: 61, scale: 2.059 }).crop(390, 844);
  assert.deepEqual(c, { x: 48, y: 61, w: 802, h: 1738 });
  assert.equal(c.w % 2, 0);
  assert.equal(c.h % 2, 0);
});

test('finds the bright prototype frame on a dark viewer background', () => {
  const [W, H] = [200, 300];
  const gray = Buffer.alloc(W * H, 10);
  for (let y = 40; y < 260; y++) for (let x = 30; x < 130; x++) gray[y * W + x] = 240;
  assert.deepEqual(findBrightBox(gray, W, H), { x: 30, y: 40, w: 100, h: 220 });
});

test('says so when no frame is on screen yet', () => {
  assert.throws(() => findBrightBox(Buffer.alloc(100 * 100, 0), 100, 100), /No prototype frame/);
});
