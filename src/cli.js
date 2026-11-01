#!/usr/bin/env node
// pdr record <config.mjs> [--out dir] [--only a,b]   — record sections to silent MP4s + action logs
// pdr verify <out-dir>                                — contact sheets and before/after tap strips for each clip
import { existsSync, readdirSync } from 'node:fs';
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
  const results = await record(config, { outDir: flag('out') ?? 'out', only: flag('only')?.split(',') });
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
} else {
  console.log('Usage:\n  pdr record <config.mjs> [--out dir] [--only a,b]\n  pdr verify <out-dir>');
  process.exitCode = 2;
}
