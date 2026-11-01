import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Share of pixels (0–1) that a tap must change for it to count as "the screen reacted". */
export const MIN_CHANGE = 0.001;

/**
 * Share of pixels (0–1) that differ strongly between two frames, ignoring a box (the cursor dot).
 * Strong = any colour channel differs by more than 40/255, well above JPEG noise. Per channel, not brightness:
 * two colours of similar brightness (say a blue and a green) still count as a change.
 */
export function screenChange(before, after, box) {
  const mask = box ? `drawbox=x=${Math.round(box.x)}:y=${Math.round(box.y)}:w=${Math.round(box.w)}:h=${Math.round(box.h)}:color=black:t=fill,` : '';
  const strong = "if(gt(val,40),255,0)";
  const out = execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', before, '-i', after,
    '-filter_complex',
    // Each channel's difference over the threshold becomes 255; any channel set makes the gray value > 20.
    `[0]${mask}format=gbrp[a];[1]${mask}format=gbrp[b];[a][b]blend=all_mode=difference,` +
      `lutrgb=r='${strong}':g='${strong}':b='${strong}',format=gray,lut=y='if(gt(val,20),255,0)',scale=1:1:flags=area`,
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1',
  ]);
  return out[0] / 255;
}

/**
 * What a reviewer should look at for one recorded section.
 * - drift: video length minus real length; more than one frame means the timeline is wrong.
 * - a tap whose screen barely changed (`tap.change` below MIN_CHANGE): it probably missed, or an invisible layer
 *   (like an overlay left open) swallowed it. A tap meant to do nothing will also show up here.
 */
export function auditSection({ name, seconds, videoSeconds, fps, failed, frames, actions }) {
  const warnings = [];
  const drift = +(videoSeconds - seconds).toFixed(3);
  if (failed) warnings.push(`failed: ${failed}`);
  if (Math.abs(drift) > 1 / fps + 0.001) warnings.push(`drift ${drift}s between real time and video`);
  if (frames.frames < 3 && actions.some((a) => a.type === 'tap')) warnings.push(`only ${frames.frames} frames captured during taps`);
  for (const tap of actions.filter((a) => a.type === 'tap' && typeof a.change === 'number'))
    if (tap.change < MIN_CHANGE)
      warnings.push(`screen didn't change after tap at ${tap.t}s${tap.label ? ` (${tap.label})` : ''}: ${(tap.change * 100).toFixed(2)}% of pixels`);
  return { name, drift, warnings };
}

const version = (cmd, args) => {
  try {
    return execFileSync(cmd, args).toString().split('\n')[0].trim();
  } catch {
    return 'not found';
  }
};

/** The environment a run happened in, for comparing a good take with a bad one. */
export function environment(browserVersion) {
  const pkg = (name) => {
    try {
      return JSON.parse(readFileSync(new URL(`../node_modules/${name}/package.json`, import.meta.url), 'utf8')).version;
    } catch {
      return 'unknown';
    }
  };
  return {
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    chrome: browserVersion,
    playwrightCore: pkg('playwright-core'),
    ffmpeg: version('ffmpeg', ['-version']),
  };
}
