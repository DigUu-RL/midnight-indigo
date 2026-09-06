/*
 * Renders the icon-set screenshots the README and the Marketplace listing use,
 * into docs/preview/:
 *
 *   npm run preview:gallery
 *
 *   icons-files.png     Every file and language icon.
 *   icons-folders.png   Every folder icon, closed and open.
 *
 * Why PNGs rather than the HTML previews: the Marketplace renders the README
 * and nothing else, so the only way the listing can show the icons is as an
 * image served over https. docs/** is excluded from the package (.vscodeignore),
 * which is why the README links them absolutely on raw.githubusercontent.com
 * rather than by relative path — a relative path renders on GitHub and breaks
 * on the Marketplace.
 *
 * The icons are the real generated SVGs, embedded as data URIs and shot at the
 * sizes VS Code renders them at, so this is what the set actually looks like
 * rather than a mock-up of it. Run it after `npm run build:icons`.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const OUT = path.join(ROOT, 'docs', 'preview');
const TMP = path.join(os.tmpdir(), 'midnight-indigo-icon-preview');

const readJson = (...p: string[]): any => JSON.parse(fs.readFileSync(path.join(...p), 'utf8'));
const theme = readJson(ROOT, 'themes', 'midnight-indigo-color-theme.json');
const C = theme.colors;

const BROWSERS = [
  process.env.MIDNIGHT_INDIGO_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter((b): b is string => Boolean(b));

function findBrowser(): string {
  for (const b of BROWSERS) if (fs.existsSync(b)) return b;
  throw new Error('No Chromium-based browser found. Set MIDNIGHT_INDIGO_BROWSER to one.');
}

/* -------------------------------------------------------------- *
 * Reading the built sets
 * -------------------------------------------------------------- */

const SVG = path.join(ROOT, 'icons', 'svg');

function icon(name: string): string {
  const file = path.join(SVG, `${name}.svg`);
  if (!fs.existsSync(file)) throw new Error(`no such icon: ${file} — run: npm run build:icons`);
  return `data:image/svg+xml;base64,${fs.readFileSync(file).toString('base64')}`;
}

const names = (prefix: string, suffix = ''): string[] =>
  fs
    .readdirSync(SVG)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -4))
    .filter((n) => n.startsWith(prefix) && (suffix ? n.endsWith(suffix) : !n.endsWith('-open')))
    .sort();

/** The name under an icon: the part that says which language or folder it is. */
const label = (n: string): string => n.replace(/^(file|folder)-/, '').replace(/-open$/, '');

/* -------------------------------------------------------------- *
 * Pages
 * -------------------------------------------------------------- */

/*
 * One stylesheet for all three pages. The ground is the theme's own sidebar
 * colour, because that is what the icons are drawn to be read against — shown
 * on white they would be a different set.
 */
const CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 18px;
    background: ${C['sideBar.background']};
    color: ${C['sideBar.foreground']};
    font: 13px/1 "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .grid { display: grid; gap: 2px 10px; }
  .cell { display: flex; align-items: center; gap: 9px; padding: 5px 8px; border-radius: 6px; }
  .cell:nth-child(even) { background: ${C['list.hoverBackground']}; }
  .cell img { width: 22px; height: 22px; flex: none; }
  .cell span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }
  .head {
    display: flex; gap: 10px; align-items: baseline;
    margin: 0 0 14px 8px; color: ${C['sideBar.foreground']};
  }
  .head b { font-size: 13px; font-weight: 600; letter-spacing: .09em; text-transform: uppercase; }
  .head i { font-style: normal; font-size: 12px; opacity: .6; }
`;

const page = (body: string): string =>
  `<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`;

const head = (title: string, note: string): string => `<div class="head"><b>${title}</b><i>${note}</i></div>`;

const cell = (src: string, text: string): string =>
  `<div class="cell"><img src="${src}"><span>${text}</span></div>`;

function gallery(title: string, note: string, cols: number, cells: string[]): string {
  return page(head(title, note) + `<div class="grid" style="grid-template-columns:repeat(${cols},1fr)">${cells.join('')}</div>`);
}

/* -------------------------------------------------------------- *
 * Render
 * -------------------------------------------------------------- */

const url = (file: string): string => `file:///${file.replace(/\\/g, '/')}`;

/*
 * The window has to be exactly as tall as the grid, and the grid's height
 * depends on how the browser wraps and rounds a row — guessing it at 32px a row
 * clipped the last line off the file gallery. So the page is loaded once to
 * report its own height, and shot at that.
 *
 * It reports the BODY's height rather than the document's: scrollHeight never
 * goes below the viewport, so a short page measured in a 600px window comes
 * back as 600 and gets shot with a screenful of empty ground under it.
 */
function measure(browser: string, file: string, width: number): number {
  const dom = execFileSync(
    browser,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${width},200`,
      '--virtual-time-budget=20000',
      '--dump-dom',
      url(file),
    ],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
  );
  const h = Number(dom.match(/<title>(\d+)<\/title>/)?.[1]);
  if (!h) throw new Error(`could not measure the height of ${path.basename(file)}`);
  return h;
}

function shoot(browser: string, html: string, png: string, width: number): void {
  const file = path.join(TMP, `${path.basename(png, '.png')}.html`);
  // The page reports its own height into the title, which --dump-dom hands back.
  fs.writeFileSync(
    file,
    `${html}<script>document.title=Math.ceil(document.body.getBoundingClientRect().height)<\/script>`,
    'utf8'
  );
  execFileSync(
    browser,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      `--window-size=${width},${measure(browser, file, width)}`,
      `--screenshot=${png}`,
      url(file),
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] }
  );
}

const browser = findBrowser();
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const fileIcons = names('file-');
const folderIcons = names('folder-');

const FILE_COLS = 7;
shoot(
  browser,
  gallery(
    `${fileIcons.length} file and language icons`,
    'each drawn from the language\'s own logo',
    FILE_COLS,
    fileIcons.map((n) => cell(icon(n), label(n)))
  ),
  path.join(OUT, 'icons-files.png'),
  1180
);
console.log(`wrote docs/preview/icons-files.png (${fileIcons.length} icons)`);

/*
 * Folders are shown closed and open next to each other: the open state is half
 * the drawing, and a gallery of closed folders hides it.
 */
const FOLDER_COLS = 4;
const folderCells = folderIcons.flatMap((n) => [
  `<div class="cell"><img src="${icon(n)}"><img src="${icon(`${n}-open`)}"><span>${label(n)}</span></div>`,
]);
shoot(
  browser,
  page(
    head(`${folderIcons.length} folder icons`, 'closed and open, matched to several name synonyms each') +
      `<div class="grid" style="grid-template-columns:repeat(${FOLDER_COLS},1fr)">${folderCells.join('')}</div>`
  ),
  path.join(OUT, 'icons-folders.png'),
  900
);
console.log(`wrote docs/preview/icons-folders.png (${folderIcons.length} folders, closed and open)`);
