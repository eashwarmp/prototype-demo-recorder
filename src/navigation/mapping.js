import { execFileSync } from 'node:child_process';

/**
 * Maps design coordinates (points in the prototype's own frame, e.g. 390×844 for a phone) to page pixels.
 * Prototype viewers scale and centre the frame; `calibrate` measures where it actually landed.
 */
export function createMapping({ ox, oy, scale }) {
  return {
    ox,
    oy,
    scale,
    toScreen: (x, y) => ({ x: ox + x * scale, y: oy + y * scale }),
    toDesign: (px, py) => ({ x: (px - ox) / scale, y: (py - oy) / scale }),
    /** The frame's rectangle in page pixels, with even sizes for video encoders. */
    crop: (width, height) => ({ x: Math.round(ox), y: Math.round(oy), w: Math.round(width * scale) & ~1, h: Math.round(height * scale) & ~1 }),
  };
}

/**
 * Finds the prototype frame in a screenshot: the bright rectangle on the viewer's dark background.
 * Scans the middle row and middle column of the image for pixels brighter than `threshold`.
 * @param {Buffer} gray  8-bit grayscale pixels, row-major
 */
export function findBrightBox(gray, width, height, threshold = 40) {
  const rowY = Math.floor(height * 0.5);
  const colX = Math.floor(width * 0.5);
  const row = [];
  for (let x = 0; x < width; x++) if (gray[rowY * width + x] > threshold) row.push(x);
  const col = [];
  for (let y = 0; y < height; y++) if (gray[y * width + colX] > threshold) col.push(y);
  if (!row.length || !col.length) throw new Error('No prototype frame found on screen. Is the page loaded?');
  return { x: row[0], y: col[0], w: row.at(-1) - row[0] + 1, h: col.at(-1) - col[0] + 1 };
}

/** Takes a screenshot and works out the mapping for a frame of `frame.width`×`frame.height` design points. */
export async function calibrate(page, frame, { threshold = 40 } = {}) {
  const png = await page.screenshot();
  const viewport = page.viewportSize();
  const gray = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-vf', `scale=${viewport.width}:${viewport.height},format=gray`, '-f', 'rawvideo', 'pipe:1'], { input: png, maxBuffer: 64 * 1024 * 1024 });
  const box = findBrightBox(gray, viewport.width, viewport.height, threshold);
  const scale = box.w / frame.width;
  const heightScale = box.h / frame.height;
  if (Math.abs(scale - heightScale) / scale > 0.02)
    throw new Error(`The frame on screen (${box.w}×${box.h}) doesn't match ${frame.width}×${frame.height}. Check frame size or wait longer.`);
  return createMapping({ ox: box.x, oy: box.y, scale });
}
