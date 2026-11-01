import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { installCursor } from './browser/cursor.js';
import { launch } from './browser/launch.js';
import { createActions } from './navigation/actions.js';
import { calibrate, createMapping } from './navigation/mapping.js';
import { startScreencast } from './recorder/screencast.js';
import { duration, encode } from './renderer/encode.js';
import { createActionLog } from './timeline/action-log.js';
import { resample } from './timeline/resample.js';

/**
 * Records every section of a project config, one browser session, one section at a time.
 * Sections whose name starts with "_" (or that set `film: false`) are walks between scenes: performed, not filmed.
 *
 * Config shape (see examples/ and docs/configuration.md):
 *   { url, viewport: {width, height}, frame: {width, height}, mapping?: {ox, oy, scale}, loadSeconds?, fps?,
 *     output?: {width, height}, cursor?: {...}, sections: [{ name, film?, run: async (actions) => {} }] }
 */
export async function record(config, { outDir = 'out', only, log = console.log } = {}) {
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });
  const fps = config.fps ?? 30;
  const { browser, page, cdp } = await launch({ viewport: config.viewport, chromePath: config.chromePath });
  const results = [];
  try {
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout((config.loadSeconds ?? 12) * 1000);
    const mapping = config.mapping ? createMapping(config.mapping) : await calibrate(page, config.frame);
    log(`frame at (${mapping.ox}, ${mapping.oy}), scale ${mapping.scale.toFixed(4)}`);
    await installCursor(page, config.cursor);
    const actionLog = createActionLog();
    const actions = createActions(page, mapping, actionLog, config.timing);
    actions.cue = (text) => actionLog.add('cue', { text });
    await page.mouse.move(actions.cursor.x, actions.cursor.y);
    const crop = mapping.crop(config.frame.width, config.frame.height);
    const size = config.output ?? { width: config.frame.width * 2, height: config.frame.height * 2 };

    for (const section of config.sections) {
      const walk = section.film === false || section.name.startsWith('_');
      // Unselected and walk sections still run, unfilmed, so later sections start from the right screen.
      if (walk || (only && !only.includes(section.name))) {
        await section.run(actions);
        continue;
      }
      const workDir = join(out, `.frames-${section.name}`);
      rmSync(workDir, { recursive: true, force: true });
      const capture = await startScreencast(cdp, workDir, { width: config.viewport.width, height: config.viewport.height });
      actionLog.reset();
      await actions.nudge(); // a first frame of the current screen
      let failure = null;
      try {
        await section.run(actions);
      } catch (error) {
        failure = error.message.split('\n')[0];
        actionLog.add('failed', { error: failure });
      }
      await actions.nudge();
      await page.waitForTimeout(200);
      const { frames, start, end } = await capture.stop();
      const { ticks, stats } = resample(frames, start, end, fps);
      const file = join(out, `${section.name}.mp4`);
      encode({ frames, ticks, workDir, out: file, crop, size, fps });
      rmSync(workDir, { recursive: true, force: true });
      const result = {
        clip: `${section.name}.mp4`,
        seconds: +(end - start).toFixed(2),
        videoSeconds: +duration(file).toFixed(3),
        fps,
        size,
        frames: stats,
        failed: failure,
        actions: actionLog.entries,
      };
      writeFileSync(join(out, `${section.name}.actions.json`), `${JSON.stringify(result, null, 2)}\n`);
      results.push(result);
      log(`${section.name}: ${result.seconds}s real → ${result.videoSeconds}s video, ${stats.frames} frames${failure ? `  ⚠ ${failure}` : ''}`);
    }
  } finally {
    await browser.close();
  }
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify({ recordedAt: new Date().toISOString(), clips: results.map(({ actions, ...r }) => r) }, null, 2)}\n`);
  return results;
}
