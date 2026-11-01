import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { duration } from '../renderer/encode.js';

const ffmpeg = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);

/** One image of evenly spaced frames from a clip, left to right, to eyeball every step at once. */
export function contactSheet(clip, out, { every = 1.5, width = 130, columns = 10 } = {}) {
  const count = Math.floor(duration(clip) / every) + 1;
  const rows = Math.ceil(count / columns);
  ffmpeg(['-i', clip, '-vf', `fps=1/${every},scale=${width}:-2,pad=${width + 4}:ih+4:2:2:white,tile=${columns}x${rows}`, '-frames:v', '1', out]);
  return out;
}

/**
 * For each logged tap: the frame just before it and the frame `after` seconds later, side by side.
 * If the log and the video agree, every pair shows the cursor on the target, then the next screen.
 */
export function tapStrip(clip, actionsFile, out, { before = 0.1, after = 0.9, width = 200 } = {}) {
  const taps = JSON.parse(readFileSync(actionsFile, 'utf8')).actions.filter((a) => a.type === 'tap');
  if (!taps.length) return null;
  const inputs = [];
  for (const tap of taps)
    for (const t of [Math.max(0, tap.t - before), tap.t + after]) inputs.push('-ss', t.toFixed(2), '-i', clip);
  const n = taps.length * 2;
  const chains = Array.from({ length: n }, (_, i) => `[${i}:v]trim=end_frame=1,scale=${width}:-2[v${i}]`).join(';');
  ffmpeg([...inputs, '-filter_complex', `${chains};${Array.from({ length: n }, (_, i) => `[v${i}]`).join('')}hstack=${n}`, '-frames:v', '1', out]);
  return out;
}
