import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createActionLog } from '../src/timeline/action-log.js';
import { createActions, easeInOut, path } from '../src/navigation/actions.js';
import { createMapping } from '../src/navigation/mapping.js';

test('cursor paths ease in and out and end exactly on the target', () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  const { points } = path(0, 0, 100, 50, 400);
  assert.deepEqual(points.at(-1), { x: 100, y: 50 });
  for (let i = 1; i < points.length; i++) assert.ok(points[i].x >= points[i - 1].x, 'moves steadily toward the target');
  assert.ok(points[1].x - points[0].x < points[Math.floor(points.length / 2)].x - points[Math.floor(points.length / 2) - 1].x, 'slow start');
});

/** A stand-in page that records mouse calls and runs on a fake clock. */
function fakePage() {
  let now = 0;
  const calls = [];
  return {
    clock: () => now,
    calls,
    viewportSize: () => ({ width: 900, height: 1860 }),
    waitForTimeout: async (ms) => { now += ms / 1000; },
    mouse: {
      move: async (x, y) => calls.push(['move', Math.round(x), Math.round(y)]),
      down: async () => calls.push(['down', now]),
      up: async () => calls.push(['up', now]),
      wheel: async (dx, dy) => calls.push(['wheel', dy]),
    },
  };
}

test('a tap glides to the mapped target, presses there, and is logged at the moment of the press', async () => {
  const page = fakePage();
  const log = createActionLog(page.clock);
  const a = createActions(page, createMapping({ ox: 48, oy: 61, scale: 2 }), log);
  await a.hold(1);
  await a.tap(100, 200, 0.5, 'Start');
  const down = page.calls.findIndex((c) => c[0] === 'down');
  assert.deepEqual(page.calls[down - 1], ['move', 248, 461]); // the press lands on the target
  const tap = log.entries.find((e) => e.type === 'tap');
  assert.equal(tap.label, 'Start');
  assert.equal(tap.t, +page.calls[down][1].toFixed(2)); // logged exactly when the press happens
});

test('scroll distances are in design points, scaled to page pixels', async () => {
  const page = fakePage();
  const a = createActions(page, createMapping({ ox: 0, oy: 0, scale: 2 }), createActionLog(page.clock));
  await a.scroll(10, 10, 300, 330);
  const total = page.calls.filter((c) => c[0] === 'wheel').reduce((s, c) => s + c[1], 0);
  assert.ok(Math.abs(total - 600) < 1e-6);
});

test('the action log times entries from its last reset', () => {
  let t = 100;
  const log = createActionLog(() => t);
  t = 103.456;
  log.add('tap');
  log.reset();
  t = 104;
  log.add('cue', { text: 'hello' });
  assert.deepEqual(log.entries, [{ t: 0.54, type: 'cue', text: 'hello' }]);
});
