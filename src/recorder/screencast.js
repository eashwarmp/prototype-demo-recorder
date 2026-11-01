import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Frames in capture-time order (stable for equal times, so arrival order breaks ties). */
export const orderFrames = (frames) => frames.map((f, i) => ({ f, i })).sort((a, b) => a.f.t - b.f.t || a.i - b.i).map(({ f }) => f);

/**
 * Captures Chrome's own timestamped screencast frames to `dir` as JPEGs. Each frame keeps the wall-clock time
 * Chrome reports for it, which the timeline resampler uses to place it exactly.
 * @returns {{ stop(): Promise<{ frames: {file: string, t: number}[], start: number, end: number }> }}
 */
export async function startScreencast(cdp, dir, { width, height, quality = 92 }) {
  mkdirSync(dir, { recursive: true });
  const frames = [];
  const onFrame = async ({ data, metadata, sessionId }) => {
    const file = join(dir, `${String(frames.length).padStart(6, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  };
  cdp.on('Page.screencastFrame', onFrame);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality, maxWidth: width, maxHeight: height, everyNthFrame: 1 });
  const start = Date.now() / 1000;
  return {
    start,
    async stop() {
      const end = Date.now() / 1000;
      await cdp.send('Page.stopScreencast');
      cdp.off('Page.screencastFrame', onFrame);
      // Chrome occasionally delivers a frame out of order; its own timestamp is the truth, so order by it.
      return { frames: orderFrames(frames), start, end };
    },
  };
}
