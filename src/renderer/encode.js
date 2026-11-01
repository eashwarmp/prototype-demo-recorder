import { execFileSync } from 'node:child_process';
import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Writes the resampled timeline as a numbered image sequence (symlinks, no copies) and encodes it:
 * crop to the prototype frame, scale to the output size, H.264 at constant `fps`, no audio.
 */
export function encode({ frames, ticks, workDir, out, crop, size, fps = 30, crf = 16 }) {
  const seq = join(workDir, 'seq');
  mkdirSync(seq, { recursive: true });
  ticks.forEach((index, k) => symlinkSync(frames[index].file, join(seq, `${String(k).padStart(6, '0')}.jpg`)));
  const filters = [`crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`];
  if (size) filters.push(`scale=${size.width}:${size.height}:flags=lanczos`);
  filters.push('format=yuv420p');
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-framerate', String(fps), '-i', join(seq, '%06d.jpg'),
    '-vf', filters.join(','),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-r', String(fps),
    '-an', '-movflags', '+faststart', out,
  ]);
  return out;
}

/** Length of a media file in seconds. */
export function duration(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
}
