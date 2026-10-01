/*
 * The workbench screenshots in the README: real VS Code, not a drawing of it.
 *
 *   npm run preview:workbench
 *
 * The hero and the language cards are rendered from the theme files by this
 * repository's own page, which is what makes them reproducible to the byte.
 * The workbench cannot be drawn that way — menus, the diff editor, the debugger
 * and chat are VS Code's to draw — so these are the shots `npm run regression`
 * takes of the real thing, and only once they have been reviewed: each one is
 * copied from .regression/reviewed/, which holds only what someone looked at and
 * accepted with `npm run regression -- --accept`.
 *
 * A reviewed shot of an older tree would put a theme on the README that the
 * extension no longer ships. Every surface the regression run shoots records,
 * beside its shots, the hash of what they were taken of (inputs.txt), and this
 * script refuses a surface whose record is not the tree's.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { screenshot } from '../shared/headless.ts';
import { recordRendered, vscodeShotInputsHash } from '../regression/rendered-from.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const ROOT: string = path.join(HERE, '..', '..');
const REVIEWED: string = path.join(ROOT, '.regression', 'reviewed', 'vscode', 'workbench');
const OUT: string = path.join(ROOT, 'docs', 'preview');

type Family = 'indigo' | 'purple' | 'pink' | 'red' | 'orange' | 'green' | 'cyan' | 'blue';

/** One surface in one family, copied as VS Code drew it. The families are spread so the README shows more than one. */
const SHOTS: { file: string; surface: string; family: Family }[] = [
  { file: 'workbench-diff.png', surface: 'diff-editor', family: 'indigo' },
  { file: 'workbench-source-control.png', surface: 'source-control', family: 'orange' },
  { file: 'workbench-debug.png', surface: 'run-and-debug', family: 'cyan' },
  { file: 'workbench-chat.png', surface: 'chat', family: 'purple' },
];

/** One surface in all eight, side by side: the variants as a user switches between them. */
const VARIANTS: { file: string; surface: string } = { file: 'workbench-variants.png', surface: 'explorer' };
const FAMILIES: Family[] = ['indigo', 'purple', 'pink', 'red', 'orange', 'green', 'cyan', 'blue'];

const COLUMNS: number = 2;
/** Half the window, so each shot is scaled by exactly one half and stays crisp. */
const CELL_WIDTH: number = 683;
const GAP: number = 14;
const PADDING: number = 18;

const reviewedShot = (surface: string, family: Family): string => {
  const shot: string = path.join(REVIEWED, surface, `${family}.png`);
  if (!fs.existsSync(shot)) throw new Error(`${surface} has no reviewed shot in ${family} — run npm run regression -- --only=vscode --surfaces=${surface}, review it and accept it`);
  return shot;
};

const surfaces: string[] = [...new Set([...SHOTS.map((shot): string => shot.surface), VARIANTS.surface])];
const tree: string = vscodeShotInputsHash();
const stale: string[] = surfaces.filter((surface: string): boolean => {
  const record: string = path.join(REVIEWED, surface, 'inputs.txt');
  return !fs.existsSync(record) || fs.readFileSync(record, 'utf8').trim() !== tree;
});
if (stale.length) {
  throw new Error(
    `the reviewed shots of ${stale.join(', ')} are not of the themes and icons in the tree — ` +
      `run npm run regression -- --only=vscode --surfaces=${stale.join(',')}, review the sheets and accept them first`
  );
}

for (const { file, surface, family } of SHOTS) fs.copyFileSync(reviewedShot(surface, family), path.join(OUT, file));

const title = (family: Family): string => `Midnight ${family[0].toUpperCase()}${family.slice(1)}`;
const dataUrl = (file: string): string => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
const rows: number = Math.ceil(FAMILIES.length / COLUMNS);
const cellHeight: number = Math.round((CELL_WIDTH * 766) / 1366);
const width: number = PADDING * 2 + COLUMNS * CELL_WIDTH + (COLUMNS - 1) * GAP;
const height: number = PADDING * 2 + rows * (cellHeight + 26) + (rows - 1) * GAP;
const page: string = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'midnight-workbench-')), 'variants.html');
fs.writeFileSync(
  page,
  `<!doctype html><meta charset="utf-8"><style>
    html, body { margin: 0; background: #020108; }
    body { padding: ${PADDING}px; font: 600 13px 'Segoe UI', system-ui, sans-serif; color: #D8D2F0; }
    .grid { display: grid; grid-template-columns: repeat(${COLUMNS}, ${CELL_WIDTH}px); gap: ${GAP}px; }
    figure { margin: 0; }
    figcaption { height: 26px; line-height: 20px; }
    img { display: block; width: ${CELL_WIDTH}px; height: ${cellHeight}px; border-radius: 4px; outline: 1px solid #1C1440; }
  </style><div class="grid">${FAMILIES.map(
    (family: Family): string => `<figure><figcaption>${title(family)}</figcaption><img src="${dataUrl(reviewedShot(VARIANTS.surface, family))}"></figure>`
  ).join('')}</div>`,
  'utf8'
);
screenshot(page, path.join(OUT, VARIANTS.file), width, height, 1);
fs.rmSync(path.dirname(page), { recursive: true, force: true });

recordRendered('preview:workbench');
console.log(`workbench previews: ${SHOTS.length + 1} written to docs/preview/ from the reviewed VS Code ${fs.readFileSync(path.join(REVIEWED, '..', 'version.txt'), 'utf8').trim()} shots`);
