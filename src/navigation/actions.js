/** Smooth start and stop, so the cursor eases into and out of each move like a person's hand. */
export const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

/** Points along an eased path from (x0, y0) to (x1, y1), about one per 16 ms. */
export function path(x0, y0, x1, y1, ms) {
  const steps = Math.max(8, Math.round(ms / 16));
  const points = [];
  for (let i = 1; i <= steps; i++) {
    const p = easeInOut(i / steps);
    points.push({ x: x0 + (x1 - x0) * p, y: y0 + (y1 - y0) * p });
  }
  return { points, stepMs: ms / steps };
}

/**
 * The verbs a section script uses. All coordinates are design points; `mapping` turns them into pixels.
 * Every tap and scroll is written to `log` at the moment it happens.
 */
export function createActions(page, mapping, log, { tapMs = 110, approachMs = 650, aim = 0.25 } = {}) {
  const viewport = page.viewportSize();
  let cursor = { x: viewport.width - 20, y: viewport.height * 0.7 }; // parked off the frame
  const wait = (ms) => page.waitForTimeout(ms);
  const actions = {
    hold: (seconds) => wait(seconds * 1000),
    async glide(x, y, ms = 700) {
      const to = mapping.toScreen(x, y);
      const { points, stepMs } = path(cursor.x, cursor.y, to.x, to.y, ms);
      for (const p of points) {
        await page.mouse.move(p.x, p.y);
        await wait(stepMs);
      }
      cursor = to;
    },
    async tap(x, y, settle = 1.5, label = '') {
      await actions.glide(x, y, approachMs);
      await actions.hold(aim);
      log.add('tap', { label, x, y });
      await page.mouse.down();
      await wait(tapMs);
      await page.mouse.up();
      await actions.hold(settle);
    },
    async scroll(x, y, dy, ms = 1100) {
      await actions.glide(x, y, 400);
      log.add('scroll', { x, y, dy });
      const steps = Math.max(1, Math.round(ms / 33));
      for (let i = 0; i < steps; i++) {
        await page.mouse.wheel(0, (dy * mapping.scale) / steps);
        await wait(33);
      }
    },
    note: (text) => log.add('note', { text }),
    /** Moves the cursor by half a pixel: forces a fresh frame so a clip starts on the current screen. */
    async nudge() {
      await page.mouse.move(cursor.x + 0.5, cursor.y);
      await page.mouse.move(cursor.x, cursor.y);
    },
    get cursor() {
      return cursor;
    },
  };
  return actions;
}
