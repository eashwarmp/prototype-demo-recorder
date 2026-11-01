#!/usr/bin/env node
// pdr record <config.mjs> [--out dir] [--only a,b]   — record sections to silent MP4s + action logs
// pdr verify <out-dir>                                — contact sheets and before/after tap strips for each clip
// pdr audit <out-dir>                                 — what ran, with which tools, and every warning
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { record } from './run.js';
import { contactSheet, tapStrip } from './verify/sheets.js';

const [command, target, ...rest] = process.argv.slice(2);
const flag = (name) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

if (command === 'record' && target) {
  const config = (await import(pathToFileURL(resolve(target)).href)).default;
  const results = await record(config, { outDir: flag('out') ?? 'out', only: flag('only')?.split(','), debug: rest.includes('--debug') });
  process.exitCode = results.some((r) => r.failed) ? 1 : 0;
} else if (command === 'verify' && target) {
  const dir = resolve(target);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mp4'))) {
    const name = file.slice(0, -4);
    contactSheet(join(dir, file), join(dir, `${name}.sheet.png`));
    const actions = join(dir, `${name}.actions.json`);
    if (existsSync(actions)) tapStrip(join(dir, file), actions, join(dir, `${name}.taps.png`));
    console.log(`${name}: ${name}.sheet.png${existsSync(actions) ? `, ${name}.taps.png` : ''}`);
  }
} else if (command === 'audit' && target) {
  const audit = JSON.parse(readFileSync(join(resolve(target), 'audit.json'), 'utf8'));
  const { environment: e, mapping: m } = audit;
  console.log(`${audit.started} → ${audit.finished}`);
  console.log(`Chrome ${e.chrome} · playwright-core ${e.playwrightCore} · Node ${e.node} · ${e.ffmpeg}`);
  console.log(m ? `frame at (${m.ox}, ${m.oy}) × ${m.scale}${m.calibrated ? ' (calibrated)' : ' (from config)'}` : 'no mapping (failed before calibration)');
  for (const s of audit.sections) console.log(`  ${s.clip}: ${s.seconds}s real, drift ${s.drift}s, ${s.frames.frames} frames, ${s.actions} actions${s.failed ? `, FAILED ${s.failed}` : ''}`);
  console.log(audit.warnings.length ? `Warnings:\n${audit.warnings.map((w) => `  ⚠ ${w}`).join('\n')}` : 'No warnings.');
  process.exitCode = audit.warnings.length ? 1 : 0;
} else {
  console.log('Usage:\n  pdr record <config.mjs> [--out dir] [--only a,b] [--debug]\n  pdr verify <out-dir>\n  pdr audit <out-dir>');
  process.exitCode = 2;
}
