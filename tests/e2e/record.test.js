// End to end: records a tiny local page in real Chrome and checks the video against real time and the action log.
// Needs Chrome (CHROME_PATH or the macOS default) and ffmpeg/ffprobe on PATH; skips itself otherwise.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { record } from '../../src/run.js';

const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version']); return true; } catch { return false; } })();
const skip = !existsSync(chrome) ? 'Chrome not found' : !hasFfmpeg ? 'ffmpeg not found' : false;

/** Average RGB of a small patch in the middle of the video frame at time t. */
function colorAt(clip, t) {
  const raw = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', t.toFixed(3), '-i', clip, '-frames:v', '1', '-vf', 'crop=20:20:iw/2-10:ih/2-10,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
  return [raw[0], raw[1], raw[2]];
}
const isBlue = ([r, g, b]) => b > 150 && r < 120;
const isGreen = ([r, g, b]) => g > 120 && r < 100 && b < 140;
const isLight = ([r, g, b]) => r > 200 && g > 200 && b > 200;

test('records in real time and the screen changes at the logged tap times', { skip, timeout: 120_000 }, async () => {
  const out = mkdtempSync(join(tmpdir(), 'pdr-e2e-'));
  try {
    const app = pathToFileURL(fileURLToPath(new URL('../fixtures/app.html', import.meta.url))).href;
    const config = {
      url: app,
      viewport: { width: 500, height: 700 },
      frame: { width: 300, height: 600 },
      loadSeconds: 0.5,
      output: { width: 300, height: 600 },
      sections: [
        { name: 'clip', run: async ({ hold, tap }) => { await hold(1.5); await tap(150, 150, 1.5, 'top'); await tap(150, 450, 1.5, 'bottom'); await hold(1); } },
      ],
    };
    const [result] = await record(config, { outDir: out, log: () => {} });
    const clip = join(out, 'clip.mp4');

    // Timing accuracy: the video lasts as long as the recording did, within one frame.
    assert.ok(Math.abs(result.videoSeconds - result.seconds) <= 1 / 30 + 0.001, `${result.videoSeconds}s video for ${result.seconds}s real`);
    assert.equal(result.failed, null);

    // Calibration found the 300×600 frame at 1:1.
    const log = JSON.parse(readFileSync(join(out, 'clip.actions.json'), 'utf8'));
    const [top, bottom] = log.actions.filter((a) => a.type === 'tap');

    // Interaction: before each logged tap the old screen, right after it the new one.
    assert.ok(isLight(colorAt(clip, top.t - 0.15)), 'light before the first tap');
    assert.ok(isBlue(colorAt(clip, top.t + 0.3)), 'blue right after the first tap');
    assert.ok(isBlue(colorAt(clip, bottom.t - 0.15)), 'still blue before the second tap');
    assert.ok(isGreen(colorAt(clip, bottom.t + 0.3)), 'green right after the second tap');

    // Missing frames: the still opening second is filled, not skipped, so the first tap isn't early.
    assert.ok(top.t >= 1.5 + 0.6, `first tap logged at ${top.t}s, after the 1.5s hold and the approach`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
