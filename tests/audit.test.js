import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditSection, MIN_CHANGE } from '../src/audit.js';

const clean = {
  name: 'clip', seconds: 10, videoSeconds: 10.0, fps: 30, failed: null,
  frames: { frames: 200, ticks: 300, duplicates: 120, dropped: 20, longestGap: 1.2 },
  actions: [{ t: 2, type: 'tap', label: 'Start', change: 0.4 }, { t: 6, type: 'tap', change: 0.02 }],
};

test('a clean section has no warnings', () => {
  assert.deepEqual(auditSection(clean).warnings, []);
});

test('flags drift beyond one frame between real time and video length', () => {
  const { warnings, drift } = auditSection({ ...clean, videoSeconds: 10.2 });
  assert.equal(drift, 0.2);
  assert.match(warnings[0], /drift/);
});

test('flags a failed section with its error', () => {
  assert.match(auditSection({ ...clean, failed: 'Timeout 30000ms' }).warnings[0], /failed: Timeout/);
});

test("flags a tap after which the screen didn't change: a missed tap or an invisible layer on top", () => {
  const actions = [{ t: 3.4, type: 'tap', label: 'Start', change: MIN_CHANGE / 2 }];
  assert.match(auditSection({ ...clean, actions }).warnings[0], /didn't change after tap at 3\.4s \(Start\)/);
});

test('a small change, like toggling one permission tile, still counts as the screen reacting', () => {
  const actions = [{ t: 3.4, type: 'tap', change: 0.004 }];
  assert.deepEqual(auditSection({ ...clean, actions }).warnings, []);
});

test('flags a section with no captured motion at all', () => {
  assert.match(auditSection({ ...clean, frames: { ...clean.frames, frames: 2 } }).warnings[0], /only 2 frames/);
});
