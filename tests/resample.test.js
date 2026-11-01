import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resample } from '../src/timeline/resample.js';

const frames = (...times) => times.map((t) => ({ t }));

test('the clip is exactly as long as the real recording, whatever the frame rate of capture', () => {
  for (const seconds of [1, 7.3, 42.9, 600]) {
    const { ticks, stats } = resample(frames(0, 0.4, 0.41, 0.42, seconds - 0.2), 0, seconds, 30);
    assert.equal(ticks.length, Math.round(seconds * 30));
    assert.ok(Math.abs(stats.seconds - seconds) <= 1 / 30, `${stats.seconds} vs ${seconds}`);
  }
});

test('no cumulative drift: the frame shown at time t is the newest frame captured by t, even after 10 minutes', () => {
  // A frame every 0.5 s for 10 minutes; tick k shows the frame captured at floor(k/15)*0.5 s.
  const f = Array.from({ length: 1200 }, (_, i) => ({ t: 1000 + i * 0.5 }));
  const { ticks } = resample(f, 1000, 1600, 30);
  for (const k of [0, 14, 15, 9000, 17999]) assert.equal(ticks[k], Math.floor(k / 15), `tick ${k}`);
});

test('bursts of frames during motion are not stretched: extra frames are dropped, time is kept', () => {
  // 100 frames in the first second (motion), then nothing.
  const f = Array.from({ length: 100 }, (_, i) => ({ t: i / 100 }));
  const { ticks, stats } = resample(f, 0, 2, 30);
  assert.equal(ticks.length, 60);
  assert.equal(ticks[15], 50); // at 0.5 s the frame captured at 0.5 s
  assert.equal(ticks[59], 99); // the screen held still after motion stopped
  assert.ok(stats.dropped > 0);
});

test('missing frames: a still screen with no new frames repeats the last frame', () => {
  const { ticks, stats } = resample(frames(0, 5), 0, 10, 30);
  assert.deepEqual([ticks[0], ticks[149], ticks[150], ticks[299]], [0, 0, 1, 1]);
  assert.equal(stats.longestGap, 5);
  assert.equal(stats.duplicates, 298);
});

test('a first frame that arrives just after the start stands in for the first instant', () => {
  const { ticks } = resample(frames(0.05, 1), 0, 2, 30);
  assert.equal(ticks[0], 0);
});

test('refuses inputs that would produce a wrong video', () => {
  assert.throws(() => resample([], 0, 1), /No frames/);
  assert.throws(() => resample(frames(0), 1, 1), /end after/);
  assert.throws(() => resample(frames(1, 0.5), 0, 2), /ascending/);
});

test('frames Chrome delivers out of order are put back in capture order before resampling', async () => {
  const { orderFrames } = await import('../src/recorder/screencast.js');
  const ordered = orderFrames([{ t: 1, file: 'a' }, { t: 3, file: 'c' }, { t: 2, file: 'b' }, { t: 3, file: 'd' }]);
  assert.deepEqual(ordered.map((f) => f.file), ['a', 'b', 'c', 'd']);
  assert.doesNotThrow(() => resample(ordered, 0, 4, 30));
});
