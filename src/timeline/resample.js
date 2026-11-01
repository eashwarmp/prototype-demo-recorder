/**
 * Turns frames that arrive at irregular times into an exact constant-frame-rate timeline.
 *
 * Chrome's screencast sends a frame only when the page changes, so frames bunch up during motion and stop
 * while the screen is still. Encoding them one-per-frame stretches motion and drifts; giving each frame a
 * duration makes encoders round short frames up. Instead, every output tick shows the newest frame captured
 * by that moment. The clip is then exactly as long as the real recording, by construction.
 *
 * @param {{t: number}[]} frames  capture times in seconds, ascending (clock of `start`/`end`)
 * @param {number} start  wall-clock seconds when recording began
 * @param {number} end    wall-clock seconds when recording ended
 * @param {number} fps
 * @returns {{ ticks: number[], stats: { ticks: number, seconds: number, frames: number, duplicates: number, dropped: number, longestGap: number } }}
 *   ticks[k] is the index into `frames` shown at time k / fps.
 */
export function resample(frames, start, end, fps = 30) {
  if (!frames.length) throw new Error('No frames were captured.');
  if (!(end > start)) throw new Error('The recording must end after it starts.');
  for (let i = 1; i < frames.length; i++)
    if (frames[i].t < frames[i - 1].t) throw new Error('Frame times must be ascending.');
  const count = Math.round((end - start) * fps);
  const ticks = new Array(count);
  const used = new Set();
  let j = 0;
  for (let k = 0; k < count; k++) {
    const t = start + k / fps;
    while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
    ticks[k] = j; // before the first frame arrives, the first frame stands in (it is the screen at start)
    used.add(j);
  }
  let longestGap = 0;
  for (let i = 1; i < frames.length; i++) longestGap = Math.max(longestGap, frames[i].t - frames[i - 1].t);
  return {
    ticks,
    stats: {
      ticks: count,
      seconds: count / fps,
      frames: frames.length,
      duplicates: count - used.size,
      // Frames that arrived between two ticks and were never shown (motion faster than the output fps).
      dropped: frames.length - used.size,
      longestGap: +longestGap.toFixed(3),
    },
  };
}
