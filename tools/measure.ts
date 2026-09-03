/*
 * Measures the geometry build-icons.ts cannot know on its own, and writes it to
 * tools/glyph-bounds.json and tools/text-bounds.json:
 *
 *   node tools/measure.ts
 *
 * Everything is measured by rasterising in a real renderer (headless Edge) and
 * finding the lit pixels — that is, the INK, not the nominal box. The
 * distinction matters twice:
 *
 *   Glyphs punch holes in themselves with the knock-out colour (the puzzle
 *   piece's socket, the gem's facets). Those holes are inside the element's
 *   bounding box but are not ink, so centring on getBBox() leaves the visible
 *   shape leaning to one side. Rendering the glyph white-on-black, with the
 *   knock-out painted black, measures exactly what the eye sees.
 *
 *   Text set with text-anchor="middle" is centred on its ADVANCE width, not on
 *   its ink, and the baseline a string wants depends on whether it has a
 *   descender ("php") or not ("MD"). Measuring the ink sidesteps both.
 *
 * build-icons.ts turns these into a translate for every glyph and an x/y for
 * every acronym, and fails with a pointer back here if it meets one it has no
 * numbers for. Re-run after adding or changing a glyph or an acronym.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { glyphs, type Glyph, type GlyphName } from './glyphs.ts';

/** The two shapes this script writes out. */
type GlyphBounds = { cx: number; cy: number; w: number; h: number };
type TextMetrics = { dx: number; dy: number };
import { FONT, WEIGHT, textRuns, textKey } from './icon-spec.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(os.tmpdir(), 'midnight-indigo-measure.html');
const GLYPH_OUT = path.join(HERE, 'glyph-bounds.json');
const TEXT_OUT = path.join(HERE, 'text-bounds.json');

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
  throw new Error('No Chromium-based browser found to measure with. Set MIDNIGHT_INDIGO_BROWSER to one.');
}

/*
 * Glyphs are called as (foreground, knockOut, extra). White foreground, black
 * knock-out, drawn on black: ink is then simply the lit pixels. `extra` is an
 * array for the multi-colour glyphs and a plain colour string for the two-tone
 * ones (python, kotlin), so hand it something that answers to both.
 */
// An array that also answers to toString(), so one flat render serves both
// the multi-colour glyphs (which index it) and the two-tone ones (which use it
// as a colour). That duality is why the seven glyphs reading it annotate the
// parameter `any`.
const WHITE = Object.assign(['#fff', '#fff', '#fff', '#fff', '#fff'], { toString: () => '#fff' });
const flat = (fn: Glyph): string => fn('#fff', '#000', WHITE);

const names = Object.keys(glyphs) as GlyphName[];
const runs = textRuns();

/*
 * Measured on a canvas comfortably larger than the nominal box in both cases:
 * several glyphs overrun the 24-unit box on purpose, and a box that merely fits
 * would clip them — which silently reports a wrong ink centre AND hides the
 * fact that they need shrinking.
 */
const GLYPH_SPAN = 40;
const TEXT_SPAN = 48;

const jobs = [
  ...names.map((n) => ({
    kind: 'glyph',
    id: n,
    span: GLYPH_SPAN,
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-GLYPH_SPAN / 2} ${-GLYPH_SPAN / 2} ${GLYPH_SPAN} ${GLYPH_SPAN}">` +
      `<rect x="${-GLYPH_SPAN / 2}" y="${-GLYPH_SPAN / 2}" width="${GLYPH_SPAN}" height="${GLYPH_SPAN}" fill="#000"/>` +
      `${flat(glyphs[n])}</svg>`,
  })),
  ...runs.map((r) => ({
    kind: 'text',
    id: textKey(r.str, r.size, r.track),
    span: TEXT_SPAN,
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-TEXT_SPAN / 2} ${-TEXT_SPAN / 2} ${TEXT_SPAN} ${TEXT_SPAN}">` +
      `<rect x="${-TEXT_SPAN / 2}" y="${-TEXT_SPAN / 2}" width="${TEXT_SPAN}" height="${TEXT_SPAN}" fill="#000"/>` +
      `<text x="0" y="0" text-anchor="middle" font-family="${FONT.replace(/"/g, '&quot;')}" ` +
      `font-weight="${WEIGHT}" font-size="${r.size}" letter-spacing="${r.track}" fill="#fff">` +
      r.str.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
      `</text></svg>`,
  })),
];

const script = `
const jobs = ${JSON.stringify(jobs)};
const PX = 20; // device pixels per icon unit
const out = [];
(async () => {
  for (const j of jobs) {
    const S = j.span * PX;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(j.svg)));
    await img.decode();
    ctx.drawImage(img, 0, 0, S, S);
    const d = ctx.getImageData(0, 0, S, S).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      // Ink is anything meaningfully brighter than the black ground.
      if (d[i] + d[i + 1] + d[i + 2] < 200) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) { out.push([j.kind, j.id, 'EMPTY'].join('\\u0001')); continue; }
    const half = j.span / 2;
    out.push([j.kind, j.id,
      (x0 + x1 + 1) / 2 / PX - half, (y0 + y1 + 1) / 2 / PX - half,
      (x1 - x0 + 1) / PX, (y1 - y0 + 1) / PX].join('\\u0001'));
  }
  document.getElementById('out').textContent = out.join('\\u0002');
})();
`;

fs.writeFileSync(
  HTML,
  `<!doctype html><meta charset="utf-8"><body><pre id="out"></pre><script>${script}<\/script></body>`,
  'utf8'
);

const dom = execFileSync(
  findBrowser(),
  ['--headless', '--disable-gpu', '--virtual-time-budget=60000', '--dump-dom', `file:///${HTML.replace(/\\/g, '/')}`],
  { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
);

const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m || !m[1].trim()) throw new Error('measurement page produced no output');

const round = (v: string | number): number => Number(Number(v).toFixed(3));
const glyphBounds: Record<string, GlyphBounds> = {};
const textBounds: Record<string, TextMetrics> = {};
const empty: string[] = [];

for (const line of m[1].trim().split('\u0002')) {
  const [kind, id, cx, cy, w, h] = line.split('\u0001');
  if (cx === 'EMPTY') {
    empty.push(`${kind} ${id}`);
    continue;
  }
  if (kind === 'glyph') glyphBounds[id] = { cx: round(cx), cy: round(cy), w: round(w), h: round(h) };
  // For text the correction is simply "move the ink back to the centre".
  else textBounds[id] = { dx: round(-cx), dy: round(-cy) };
}

if (empty.length) throw new Error(`nothing rendered for: ${empty.join(', ')}`);
const missingGlyphs = names.filter((n) => !glyphBounds[n]);
const missingText = runs.filter((r) => !textBounds[textKey(r.str, r.size, r.track)]);
if (missingGlyphs.length) throw new Error(`no bounds measured for glyphs: ${missingGlyphs.join(', ')}`);
if (missingText.length) throw new Error(`no bounds measured for text: ${missingText.map((r) => r.str).join(', ')}`);

fs.writeFileSync(GLYPH_OUT, JSON.stringify(glyphBounds, null, 2) + '\n', 'utf8');
fs.writeFileSync(TEXT_OUT, JSON.stringify(textBounds, null, 2) + '\n', 'utf8');

const offBy = (b: GlyphBounds): number => Math.max(Math.abs(b.cx), Math.abs(b.cy));
const offGlyph = names.filter((n) => offBy(glyphBounds[n]) >= 0.3);
const oversized = names.filter((n) => Math.max(glyphBounds[n].w, glyphBounds[n].h) > 24.05);
const offText = Object.values(textBounds).filter((b) => Math.max(Math.abs(b.dx), Math.abs(b.dy)) >= 0.3);

console.log(`measured ${names.length} glyphs -> tools/glyph-bounds.json`);
console.log(`  ${offGlyph.length} need re-centring, ${oversized.length} need shrinking into the 24x24 box`);
console.log(`measured ${runs.length} text runs -> tools/text-bounds.json`);
console.log(`  ${offText.length} need an offset of 0.3 units or more to centre their ink`);
