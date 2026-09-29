/*
 * The headless browser the measuring, auditing and screenshot scripts render
 * with. Any Chromium will do; MIDNIGHT_INDIGO_BROWSER names one explicitly.
 */

import fs from 'node:fs';

const BROWSERS: string[] = [
  process.env.MIDNIGHT_INDIGO_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter((browser): browser is string => Boolean(browser));

export const findBrowser = (): string => {
  const found: string | undefined = BROWSERS.find((browser: string): boolean => fs.existsSync(browser));
  if (!found) throw new Error('No Chromium-based browser found. Set MIDNIGHT_INDIGO_BROWSER to one.');
  return found;
};
