import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { auditSection, environment, screenChange } from './audit.js';
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
export async function record(config, { outDir = 'out', only, debug = false, log = console.log } = {}) {
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });
  const fps = config.fps ?? 30;
  const { browser, page, cdp } = await launch({ viewport: config.viewport, chromePath: config.chromePath });
  const results = [];
  const runStarted = new Date().toISOString();
  let mapping;
  try {
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout((config.loadSeconds ?? 12) * 1000);
    mapping = config.mapping ? createMapping(config.mapping) : await calibrate(page, config.frame);
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
      // Did each tap change the screen? Compare the frame just before the press with the one ~1 s later (or just
      // before the next action), masking the cursor dot.
      const entries = actionLog.entries;
      const frameAt = (t) => frames.reduce((best, f) => (f.t <= t ? f : best), frames[0]);
      const dot = (config.cursor?.size ?? 58) * 1.4;
      for (const [i, tap] of entries.entries()) {
        if (tap.type !== 'tap') continue;
        const next = entries.slice(i + 1).find((e) => e.type === 'tap' || e.type === 'scroll');
        const press = start + tap.t;
        const later = Math.min(press + 1.0, next ? start + next.t - 0.05 : end);
        const at = mapping.toScreen(tap.x, tap.y);
        tap.change = +screenChange(frameAt(press - 0.03).file, frameAt(later).file, { x: at.x - dot / 2, y: at.y - dot / 2, w: dot, h: dot }).toFixed(4);
      }
      actionLog.replace(entries);
      rmSync(workDir, { recursive: true, force: true });
      if (debug) // raw capture times, to inspect stalls or bursts frame by frame
        writeFileSync(join(out, `${section.name}.frames.json`), `${JSON.stringify(frames.map((f) => +(f.t - start).toFixed(4)))}\n`);
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
      const audit = auditSection({ name: section.name, ...result });
      result.drift = audit.drift;
      result.warnings = audit.warnings;
      writeFileSync(join(out, `${section.name}.actions.json`), `${JSON.stringify(result, null, 2)}\n`);
      results.push(result);
      log(`${section.name}: ${result.seconds}s real → ${result.videoSeconds}s video, ${stats.frames} frames${audit.warnings.map((w) => `\n  ⚠ ${w}`).join('')}`);
    }
  } finally {
    const env = environment(browser.version());
    await browser.close();
    // The audit trail: what ran, where, with which tools, and what looked wrong. Written even if a section threw.
    writeFileSync(join(out, 'audit.json'), `${JSON.stringify({
      started: runStarted,
      finished: new Date().toISOString(),
      environment: env,
      config: { url: config.url, viewport: config.viewport, frame: config.frame, fps, output: config.output, only: only ?? null },
      mapping: mapping ? { ox: mapping.ox, oy: mapping.oy, scale: +mapping.scale.toFixed(4), calibrated: !config.mapping } : null,
      sections: results.map(({ clip, seconds, videoSeconds, drift, frames, failed, warnings, actions }) => ({ clip, seconds, videoSeconds, drift, frames, actions: actions.length, failed, warnings })),
      warnings: results.flatMap((r) => r.warnings.map((w) => `${r.clip}: ${w}`)),
    }, null, 2)}\n`);
  }
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify({ recordedAt: new Date().toISOString(), clips: results.map(({ actions, ...r }) => r) }, null, 2)}\n`);
  return results;
}
