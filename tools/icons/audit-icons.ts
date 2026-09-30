/*
 * The optical audit of the icon set. Rasterises every generated SVG in a real
 * renderer and writes what it finds to tools/icons/icon-optics.json:
 *
 *   npm run audit:icons
 *
 * tools/icons/measure.ts measures the ARTWORK before it is placed, so the build can
 * place it. This measures the ICON after it is built, so the placement can be
 * held to account: where the ink's weight actually sits, how much of the box
 * it fills, how thin its thinnest strokes come out at 16px, how much of it is
 * a hole, how square its corners are, how far its shadow reaches, and which
 * other file icons its silhouette at 16px can be mistaken for. Build,
 * then audit — the file records a hash of every SVG it measured, and
 * `npm run check` refuses an audit that no longer matches the icons.
 *
 * The thresholds the numbers are held to, and the icons excused from them,
 * live in tools/icons/icon-optics.ts, which the check reads without a browser.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sha256 } from '../shared/hash.ts';
import { findBrowser } from '../shared/browser.ts';
import { DARKEST_GROUND, LOOKALIKE_CEILING, OPTICS_FILE, type IconOptics, type OpticsReport } from './icon-optics.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const SVG_DIRECTORY: string = path.join(HERE, '..', '..', 'icons', 'svg');
const HTML: string = path.join(os.tmpdir(), 'midnight-indigo-audit.html');

/** The drop shadow the classic variant wraps its artwork in. */
const SHADOW_ATTRIBUTE: RegExp = / filter="url\(#sh\)"/;

/**
 * A folder with its face taken away, leaving the pictogram sunk into it —
 * which is what has to be centred on the face, and what the optical audit of a
 * folder is about. The face is every path drawn before the pictogram's group.
 */
const pictogramOnly = (svg: string): string =>
  svg.replace(/(<g filter="url\(#sh\)">)((?:<path [^>]*\/>)+)/, '$1').replace(/<clipPath[\s\S]*$/, '</svg>');

type AuditJob = { name: string; plain: string; shadowed: string; pictogram: string | null };

const iconFiles: string[] = fs.readdirSync(SVG_DIRECTORY).filter((file: string): boolean => file.endsWith('.svg')).sort();

const jobs: AuditJob[] = iconFiles.map((file: string): AuditJob => {
  const svg: string = fs.readFileSync(path.join(SVG_DIRECTORY, file), 'utf8');
  const name: string = file.slice(0, -4);
  return {
    name,
    shadowed: svg,
    plain: svg.replace(SHADOW_ATTRIBUTE, ''),
    pictogram: name.startsWith('folder') && name !== 'folder' && name !== 'folder-open' ? pictogramOnly(svg).replace(SHADOW_ATTRIBUTE, '') : null,
  };
});

/*
 * The page. Everything is measured on the alpha channel, drawn onto a
 * transparent canvas, so the numbers are about ink and not about colour — the
 * colour questions (contrast, the shadow's saturation) are answered in Node
 * from the SVG's own paint.
 *
 * ANALYSIS_PIXELS_PER_UNIT is fine enough that a 0.1-unit stroke is still a
 * pixel wide; the 16 and 32 renders are the real sizes, at 1x and 2x.
 */
const script = `
const jobs = ${JSON.stringify(jobs)};
const UNIT = 8;
const CANVAS_UNITS = 32;
const INK = 40;
const render = async (svg, pixels) => {
  const canvas = document.createElement('canvas');
  canvas.width = pixels; canvas.height = pixels;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const image = new Image();
  image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  await image.decode();
  context.drawImage(image, 0, 0, pixels, pixels);
  const rgba = context.getImageData(0, 0, pixels, pixels).data;
  const alpha = new Uint8Array(pixels * pixels);
  for (let index = 0; index < alpha.length; index++) alpha[index] = rgba[index * 4 + 3];
  return alpha;
};
const inkStatistics = (alpha, pixels) => {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  let mass = 0, momentX = 0, momentY = 0, inkPixels = 0, edgePixels = 0;
  for (let row = 0; row < pixels; row++) for (let column = 0; column < pixels; column++) {
    const value = alpha[row * pixels + column];
    mass += value; momentX += value * (column + 0.5); momentY += value * (row + 0.5);
    if (value < INK) continue;
    inkPixels++;
    if (column < left) left = column; if (column > right) right = column;
    if (row < top) top = row; if (row > bottom) bottom = row;
    const isInk = (neighbourRow, neighbourColumn) =>
      neighbourRow >= 0 && neighbourColumn >= 0 && neighbourRow < pixels && neighbourColumn < pixels &&
      alpha[neighbourRow * pixels + neighbourColumn] >= INK;
    if (!isInk(row - 1, column) || !isInk(row + 1, column) || !isInk(row, column - 1) || !isInk(row, column + 1)) edgePixels++;
  }
  return { left, top, right: right + 1, bottom: bottom + 1, mass, momentX, momentY, inkPixels, edgePixels };
};
/* Background reachable from the border is outside; the rest of the empty pixels are holes. */
const enclosedHolePixels = (alpha, pixels) => {
  const outside = new Uint8Array(pixels * pixels);
  const stack = [];
  for (let index = 0; index < pixels; index++) stack.push(index, (pixels - 1) * pixels + index, index * pixels, index * pixels + pixels - 1);
  while (stack.length) {
    const index = stack.pop();
    if (outside[index] || alpha[index] >= INK) continue;
    outside[index] = 1;
    const row = Math.floor(index / pixels), column = index % pixels;
    if (row > 0) stack.push(index - pixels); if (row < pixels - 1) stack.push(index + pixels);
    if (column > 0) stack.push(index - 1); if (column < pixels - 1) stack.push(index + 1);
  }
  let holes = 0;
  for (let index = 0; index < alpha.length; index++) if (!outside[index] && alpha[index] < INK) holes++;
  return holes;
};
/* How much of each corner square of the ink's own box is filled: 1 is a sharp corner, less is rounded or cut. */
const cornerFill = (alpha, pixels, box) => {
  const side = Math.max(2, Math.round(Math.min(box.right - box.left, box.bottom - box.top) * 0.12));
  const corners = [[box.left, box.top], [box.right - side, box.top], [box.left, box.bottom - side], [box.right - side, box.bottom - side]];
  const fills = corners.map(([startColumn, startRow]) => {
    let filled = 0;
    for (let row = startRow; row < startRow + side; row++) for (let column = startColumn; column < startColumn + side; column++) if (alpha[row * pixels + column] >= INK) filled++;
    return filled / (side * side);
  });
  return fills.reduce((sum, fill) => sum + fill, 0) / fills.length;
};
/* At a real size: of the pixels with any ink, how many are solid rather than a blend with the ground. */
const solidity = (alpha) => {
  let lit = 0, solid = 0;
  for (const value of alpha) { if (value >= INK) lit++; if (value >= 200) solid++; }
  return { lit, solid: lit ? solid / lit : 0 };
};
/*
 * What an icon looks like at 16px, as the explorer shows it: drawn over the
 * side bar, shadow and all, each pixel in OKLab. Alpha alone would miss what
 * is inside a shape — the letters on the JavaScript tile are paint on a
 * plate, and in the alpha channel they are not there.
 */
const toLinear = (value) => { value /= 255; return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4); };
const oklab = (red, green, blue) => {
  const [r, g, b] = [toLinear(red), toLinear(green), toLinear(blue)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const seenAtSixteen = async (svg) => {
  const canvas = document.createElement('canvas');
  canvas.width = 16; canvas.height = 16;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.fillStyle = '${DARKEST_GROUND}';
  context.fillRect(0, 0, 16, 16);
  const image = new Image();
  image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  await image.decode();
  context.drawImage(image, 0, 0, 16, 16);
  const rgba = context.getImageData(0, 0, 16, 16).data;
  const pixels = [];
  for (let index = 0; index < rgba.length; index += 4) pixels.push(oklab(rgba[index], rgba[index + 1], rgba[index + 2]));
  return pixels;
};
const groundLab = oklab(...[1, 3, 5].map((offset) => parseInt('${DARKEST_GROUND}'.slice(offset, offset + 2), 16)));
const isGround = (pixel) => Math.hypot(pixel[0] - groundLab[0], pixel[1] - groundLab[1], pixel[2] - groundLab[2]) < 0.02;
/* How different two icons look at 16px: the mean OKLab distance, x100, over the pixels either of them paints. */
const seenDifference = (first, second) => {
  let total = 0, painted = 0;
  for (let index = 0; index < first.length; index++) {
    if (isGround(first[index]) && isGround(second[index])) continue;
    painted++;
    total += 100 * Math.hypot(first[index][0] - second[index][0], first[index][1] - second[index][1], first[index][2] - second[index][2]);
  }
  return painted ? total / painted : 0;
};
const LOOKALIKE_CEILING = ${LOOKALIKE_CEILING};
const output = [];
const appearances = new Map();
(async () => {
  const pixels = CANVAS_UNITS * UNIT;
  for (const job of jobs) {
    const plain = await render(job.plain, pixels);
    const shadowed = await render(job.shadowed, pixels);
    const ink = inkStatistics(plain, pixels);
    const shadow = inkStatistics(shadowed, pixels);
    let shadowOnlyPixels = 0;
    for (let index = 0; index < plain.length; index++) if (shadowed[index] >= INK && plain[index] < INK) shadowOnlyPixels++;
    const box = { left: ink.left, top: ink.top, right: ink.right, bottom: ink.bottom };
    if (job.name.startsWith('file-')) appearances.set(job.name, await seenAtSixteen(job.shadowed));
    const atSixteen = solidity(await render(job.plain, 16));
    const atThirtyTwo = solidity(await render(job.plain, 32));
    let pictogram = null;
    if (job.pictogram) {
      const pictogramInk = inkStatistics(await render(job.pictogram, pixels), pixels);
      pictogram = { centreX: pictogramInk.momentX / pictogramInk.mass / UNIT, centreY: pictogramInk.momentY / pictogramInk.mass / UNIT,
        boxCentreX: (pictogramInk.left + pictogramInk.right) / 2 / UNIT, boxCentreY: (pictogramInk.top + pictogramInk.bottom) / 2 / UNIT,
        box: { left: pictogramInk.left / UNIT, top: pictogramInk.top / UNIT, right: pictogramInk.right / UNIT, bottom: pictogramInk.bottom / UNIT } };
    }
    output.push({
      name: job.name,
      box: { left: box.left / UNIT, top: box.top / UNIT, right: box.right / UNIT, bottom: box.bottom / UNIT },
      massCentre: { x: ink.momentX / ink.mass / UNIT, y: ink.momentY / ink.mass / UNIT },
      inkArea: ink.inkPixels / (UNIT * UNIT),
      coverage: ink.mass / 255 / (pixels * pixels),
      strokeWidth: (2 * ink.inkPixels / ink.edgePixels) / UNIT,
      holeArea: enclosedHolePixels(plain, pixels) / (UNIT * UNIT),
      cornerFill: cornerFill(plain, pixels, box),
      shadowReach: { right: (shadow.right - ink.right) / UNIT, bottom: (shadow.bottom - ink.bottom) / UNIT },
      shadowArea: shadowOnlyPixels / (UNIT * UNIT),
      atSixteen, atThirtyTwo, pictogram, lookalikes: [],
    });
  }
  const names = [...appearances.keys()];
  const byName = new Map(output.map((entry) => [entry.name, entry]));
  for (let first = 0; first < names.length; first++) for (let second = first + 1; second < names.length; second++) {
    const difference = seenDifference(appearances.get(names[first]), appearances.get(names[second]));
    if (difference > LOOKALIKE_CEILING) continue;
    byName.get(names[first]).lookalikes.push({ name: names[second], difference });
    byName.get(names[second]).lookalikes.push({ name: names[first], difference });
  }
  for (const entry of output) entry.lookalikes.sort((left, right) => left.difference - right.difference || left.name.localeCompare(right.name));
  document.getElementById('out').textContent = JSON.stringify(output);
})();
`;

fs.writeFileSync(HTML, `<!doctype html><meta charset="utf-8"><body><pre id="out"></pre><script>${script}<\/script></body>`, 'utf8');

const dom: string = execFileSync(
  findBrowser(),
  ['--headless', '--disable-gpu', '--virtual-time-budget=600000', '--dump-dom', `file:///${HTML.replace(/\\/g, '/')}`],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
);

const match: RegExpMatchArray | null = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!match || !match[1].trim()) throw new Error('the audit page produced no output');

const decoded: string = match[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const measured: Omit<IconOptics, 'hash'>[] = JSON.parse(decoded);

const roundDeep = (value: unknown): unknown => {
  if (typeof value === 'number') return Number(value.toFixed(3));
  if (Array.isArray(value)) return value.map(roundDeep);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, roundDeep(inner)]));
  return value;
};

const report: OpticsReport = Object.fromEntries(
  measured.map((optics): [string, IconOptics] => [
    optics.name,
    { ...(roundDeep(optics) as Omit<IconOptics, 'hash'>), hash: sha256(fs.readFileSync(path.join(SVG_DIRECTORY, `${optics.name}.svg`))).slice(0, 12) },
  ])
);

fs.writeFileSync(path.join(HERE, OPTICS_FILE), JSON.stringify(report, null, 1) + '\n', 'utf8');
console.log(`audited ${measured.length} icons -> tools/icons/${OPTICS_FILE}`);
