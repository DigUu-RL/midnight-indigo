/*
 * Rendering a page in a headless browser, for the scripts that measure, audit
 * and screenshot: a screenshot of a page at a size, or what a page's DOM holds
 * once its own script has finished.
 *
 * These used to be the browser's command-line headless mode — `--screenshot`
 * and `--dump-dom`. Edge 154 runs that mode and writes nothing, with exit code
 * 0, so a screenshot silently was not taken and a measurement came back empty.
 * The page is now driven over the DevTools protocol with playwright-core,
 * which the browser still supports, in a child process so the scripts that
 * call it stay synchronous. The browser is the same one; only the way it is
 * told what to do has changed.
 *
 * A dump waits for the page to say it is done, by `ready` — an expression the
 * page makes true when its script has finished — rather than for a fixed
 * virtual time, which is what the command line offered.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBrowser } from './browser.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const SELF: string = path.join(HERE, 'headless.ts');

type Job =
  | { kind: 'screenshot'; url: string; png: string; width: number; height: number; scale: number }
  | { kind: 'dom'; url: string; width: number; height: number; ready: string; timeout: number };

export const fileUrl = (file: string): string => `file:///${file.replace(/\\/g, '/')}`;

const run = (job: Job): string =>
  execFileSync(process.execPath, [SELF, JSON.stringify(job)], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });

/** Shoots `htmlFile` in a window `width` × `height` CSS pixels, at `scale` device pixels each, into `pngFile`. */
export const screenshot = (htmlFile: string, pngFile: string, width: number, height: number, scale: number = 2): void =>
  void run({ kind: 'screenshot', url: fileUrl(htmlFile), png: pngFile, width, height, scale });

/** The DOM of `htmlFile` once `ready` (a JavaScript expression) holds in it, as HTML. */
export const dumpDom = (htmlFile: string, ready: string, options: { width?: number; height?: number; timeout?: number } = {}): string =>
  run({ kind: 'dom', url: fileUrl(htmlFile), width: options.width ?? 800, height: options.height ?? 600, ready, timeout: options.timeout ?? 120000 });

const isMain: boolean = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isMain) {
  const { chromium } = await import('playwright-core');
  const job: Job = JSON.parse(process.argv[2]);
  const browser = await chromium.launch({ executablePath: findBrowser(), headless: true, args: ['--hide-scrollbars', '--disable-gpu'] });
  try {
    const page = await browser.newPage({
      viewport: { width: job.width, height: job.height },
      deviceScaleFactor: job.kind === 'screenshot' ? job.scale : 1,
    });
    await page.goto(job.url, { waitUntil: 'load' });
    if (job.kind === 'screenshot') {
      await page.evaluate(async (): Promise<void> => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((image: HTMLImageElement): Promise<void> => image.decode().catch((): void => undefined)));
      });
      await page.screenshot({ path: job.png });
    } else {
      await page.waitForFunction(job.ready, undefined, { timeout: job.timeout, polling: 100 });
      process.stdout.write(await page.content());
    }
  } finally {
    await browser.close();
  }
}
