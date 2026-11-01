import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Starts Chrome headless at the given viewport. GPU flags help canvas-heavy viewers like Figma render crisply. */
export async function launch({ viewport, chromePath = process.env.CHROME_PATH, headless = true }) {
  const executablePath = chromePath || (existsSync(MAC_CHROME) ? MAC_CHROME : undefined);
  const browser = await chromium.launch({
    executablePath,
    headless,
    args: ['--use-angle=metal', '--ignore-gpu-blocklist'],
  });
  // No storage state is loaded or saved: recordings never carry anyone's session.
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  return { browser, context, page, cdp };
}
