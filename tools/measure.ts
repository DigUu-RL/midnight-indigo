/*
 * Measures the geometry build-icons.ts cannot know on its own, and writes it to
 * tools/glyph-bounds.json and tools/text-bounds.json:
 *
 *   node tools/measure.ts
 *
 * Everything is measured by rasterising in a real renderer (headless Edge) and
 * finding the lit pixels — that is, the INK, not the nominal box. The
 * distinction matters three times:
 *
 *   Artwork punches holes in itself. Those holes are inside the element's
 *   bounding box but are not ink, so centring on getBBox() leaves the visible
 *   shape leaning to one side. Rendering the artwork white on black measures
 *   exactly what the eye sees.
 *
 *   Imported logos are drawn to their own optical balance inside whatever box
 *   upstream chose, and several of them do not fill it — the Go wordmark is
 *   twice as wide as it is tall, the Docker whale sits low. Measuring is what
 *   lets the build fit them all to one size regardless.
 *
 *   Text set with text-anchor="middle" is centred on its ADVANCE width, not on
 *   its ink, and the baseline a string wants depends on whether it has a
 *   descender ("php") or not ("MD"). Measuring the ink sidesteps both, and the
 *   ink's own size is what lets the build shrink a string that would otherwise
 *   run out of the canvas.
 *
 * build-icons.ts turns these into a transform for every piece of artwork and an
 * x/y for every string, and fails with a pointer back here if it meets one it
 * has no numbers for. Re-run after adding or changing artwork or a string.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { glyphs, type GlyphName } from './glyphs.ts';
import { marks, type MarkName } from './marks.ts';
import { FONT, WEIGHT, textRuns, textKey } from './icon-spec.ts';

/** The two shapes this script writes out. */
type Bounds = { cx: number; cy: number; w: number; h: number };
type TextMetrics = Bounds & { dx: number; dy: number };

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

// Artwork is drawn with the resolved ink for its icon; measuring only cares
// where the ink is, so every slot is the same white and the ground is black.
const WHITE: string[] = Array(8).fill('#fff');

const glyphNames = Object.keys(glyphs) as GlyphName[];
const markNames = Object.keys(marks) as MarkName[];
const runs = textRuns();

/*
 * Measured on a canvas comfortably larger than the nominal box in both cases:
 * a good deal of the artwork overruns the 24-unit box on purpose, and a box
 * that merely fits would clip it — which silently reports a wrong ink centre
 * AND hides the fact that it needs shrinking.
 */
const ART_SPAN = 48;
const TEXT_SPAN = 56;

const artJob = (kind: string, id: string, body: string) => ({
  kind,
  id,
  span: ART_SPAN,
  svg:
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-ART_SPAN / 2} ${-ART_SPAN / 2} ${ART_SPAN} ${ART_SPAN}">` +
    `<rect x="${-ART_SPAN / 2}" y="${-ART_SPAN / 2}" width="${ART_SPAN}" height="${ART_SPAN}" fill="#000"/>` +
    `${body}</svg>`,
});

const jobs = [
  ...glyphNames.map((n) => artJob('glyph', n, glyphs[n](WHITE))),
  ...markNames.map((n) => artJob('mark', n, marks[n].draw(WHITE))),
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
  ['--headless', '--disable-gpu', '--virtual-time-budget=120000', '--dump-dom', `file:///${HTML.replace(/\\/g, '/')}`],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
);

const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m || !m[1].trim()) throw new Error('measurement page produced no output');

const round = (v: string | number): number => Number(Number(v).toFixed(3));
const artBounds: Record<string, Bounds> = {};
const textMetrics: Record<string, TextMetrics> = {};
const empty: string[] = [];

for (const line of m[1].trim().split('\u0002')) {
  const [kind, id, cx, cy, w, h] = line.split('\u0001');
  if (cx === 'EMPTY') {
    empty.push(`${kind} ${id}`);
    continue;
  }
  // For text the correction is "move the ink back to the centre", so the
  // offsets are stored negated; the size is kept as measured.
  if (kind === 'text') textMetrics[id] = { dx: round(-cx), dy: round(-cy), cx: round(cx), cy: round(cy), w: round(w), h: round(h) };
  else artBounds[`${kind}:${id}`] = { cx: round(cx), cy: round(cy), w: round(w), h: round(h) };
}

if (empty.length) throw new Error(`nothing rendered for: ${empty.join(', ')}`);
const missingArt = [
  ...glyphNames.map((n) => `glyph:${n}`),
  ...markNames.map((n) => `mark:${n}`),
].filter((k) => !artBounds[k]);
const missingText = runs.filter((r) => !textMetrics[textKey(r.str, r.size, r.track)]);
if (missingArt.length) throw new Error(`no bounds measured for: ${missingArt.join(', ')}`);
if (missingText.length) throw new Error(`no bounds measured for text: ${missingText.map((r) => r.str).join(', ')}`);

fs.writeFileSync(GLYPH_OUT, JSON.stringify(artBounds, null, 2) + '\n', 'utf8');
fs.writeFileSync(TEXT_OUT, JSON.stringify(textMetrics, null, 2) + '\n', 'utf8');

const wide = Object.entries(artBounds).filter(([, b]) => Math.max(b.w, b.h) / Math.min(b.w, b.h) > 2.5);
console.log(`measured ${glyphNames.length} pictograms and ${markNames.length} marks -> tools/glyph-bounds.json`);
console.log(`  ${wide.length} are more than 2.5x longer than they are tall: ${wide.map(([k]) => k).join(', ') || '—'}`);
console.log(`measured ${runs.length} text runs -> tools/text-bounds.json`);
