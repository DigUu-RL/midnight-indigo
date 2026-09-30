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
import { findBrowser } from './browser.ts';
import { glyphs, hasSurface, NO_SURFACE, SURFACE_EXPOSURE_LIMIT, type GlyphName } from './glyphs.ts';
import { marks, type MarkName } from './marks.ts';
import { FONT_STACK, FONT_WEIGHT, letteringRuns, textMetricsKey } from './icon-spec.ts';

/** The two shapes this script writes out. */
type Bounds = { cx: number; cy: number; w: number; h: number };
type TextMetrics = Bounds & { dx: number; dy: number };
/**
 * Artwork also records where its weight sits (the brightness-weighted centre,
 * mx/my), how much of its own box its silhouette fills — ink plus the holes it
 * encloses, so a ring counts as a disc — and its mean stroke thickness, twice
 * the ink area over its outline. build-icons.ts centres and sizes from these.
 */
type ArtworkMetrics = Bounds & { mx: number; my: number; fill: number; stroke: number; surfaceExposure?: number };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(os.tmpdir(), 'midnight-indigo-measure.html');
const GLYPH_OUT = path.join(HERE, 'glyph-bounds.json');
const TEXT_OUT = path.join(HERE, 'text-bounds.json');

// Artwork is drawn with the resolved ink for its icon; measuring only cares
// where the ink is, so every slot is the same white and the ground is black.
const WHITE: string[] = Array(8).fill('#fff');

const glyphNames = Object.keys(glyphs) as GlyphName[];
const markNames = Object.keys(marks) as MarkName[];
const runs = letteringRuns();

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

/* ---------------- how much of each surface stands free (M12) ---------------- */

const renderInBrowser = (script: string): string => {
  fs.writeFileSync(HTML, `<!doctype html><meta charset="utf-8"><body><pre id="out"></pre><script>${script}<\/script></body>`, 'utf8');
  const dom: string = execFileSync(
    findBrowser(),
    ['--headless', '--disable-gpu', '--virtual-time-budget=120000', '--dump-dom', `file:///${HTML.replace(/\\/g, '/')}`],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
  );
  const match: RegExpMatchArray | null = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!match || !match[1].trim()) throw new Error('measurement page produced no output');
  return match[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
};

/*
 * The ink white and the surface red, on black. A surface pixel on the edge of
 * the surface is HELD when ink lies within HOLD_RADIUS of it and EXPOSED when
 * it meets the ground with no ink that close: the share of exposed edge is how
 * free the surface stands. The radius is a fifth of a unit, so a surface that
 * stops a hair short of its outline still counts as held.
 */
const surfaceGlyphs: GlyphName[] = glyphNames.filter(hasSurface);
const surfaceJobs = surfaceGlyphs.map((name: GlyphName) => artJob('surface', name, glyphs[name](['#fff', '#f00'])));
const exposureScript = `
const jobs = ${JSON.stringify(surfaceJobs)};
const PX = 20;
const HOLD_RADIUS = 4;
const out = {};
(async () => {
  for (const job of jobs) {
    const S = job.span * PX;
    const canvas = document.createElement('canvas'); canvas.width = S; canvas.height = S;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const image = new Image();
    image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(job.svg)));
    await image.decode();
    context.drawImage(image, 0, 0, S, S);
    const data = context.getImageData(0, 0, S, S).data;
    const kind = new Uint8Array(S * S); // 0 ground, 1 surface, 2 ink, 3 blend
    for (let index = 0; index < S * S; index++) {
      const red = data[index * 4], green = data[index * 4 + 1], blue = data[index * 4 + 2];
      kind[index] = red + green + blue < 60 ? 0 : red > 200 && green < 40 ? 1 : green > 200 ? 2 : 3;
    }
    const inkNear = (x, y) => {
      for (let dy = -HOLD_RADIUS; dy <= HOLD_RADIUS; dy++) for (let dx = -HOLD_RADIUS; dx <= HOLD_RADIUS; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < S && ny < S && kind[ny * S + nx] === 2) return true;
      }
      return false;
    };
    let edge = 0, exposed = 0;
    for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
      if (kind[y * S + x] !== 1) continue;
      const neighbours = [kind[y * S + x - 1], kind[y * S + x + 1], kind[(y - 1) * S + x], kind[(y + 1) * S + x]];
      if (neighbours.every((neighbour) => neighbour === 1)) continue;
      edge++;
      if (neighbours.some((neighbour) => neighbour === 0 || neighbour === 3) && !inkNear(x, y)) exposed++;
    }
    out[job.id] = edge ? exposed / edge : 0;
  }
  document.getElementById('out').textContent = JSON.stringify(out);
})();
`;
const surfaceExposure: Record<string, number> = JSON.parse(renderInBrowser(exposureScript));
/** A pictogram is measured as it will be drawn: without its surface, when the surface stands free. */
const drawnForMeasuring = (name: GlyphName): string =>
  glyphs[name]((surfaceExposure[name] ?? 0) > SURFACE_EXPOSURE_LIMIT ? [WHITE[0], NO_SURFACE] : WHITE);

const jobs = [
  ...glyphNames.map((n) => artJob('glyph', n, drawnForMeasuring(n))),
  ...markNames.map((n) => artJob('mark', n, marks[n].draw(WHITE))),
  ...runs.map((r) => ({
    kind: 'text',
    id: textMetricsKey(r.str, r.size, r.track),
    span: TEXT_SPAN,
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-TEXT_SPAN / 2} ${-TEXT_SPAN / 2} ${TEXT_SPAN} ${TEXT_SPAN}">` +
      `<rect x="${-TEXT_SPAN / 2}" y="${-TEXT_SPAN / 2}" width="${TEXT_SPAN}" height="${TEXT_SPAN}" fill="#000"/>` +
      `<text x="0" y="0" text-anchor="middle" font-family="${FONT_STACK.replace(/"/g, '&quot;')}" ` +
      `font-weight="${FONT_WEIGHT}" font-size="${r.size}" letter-spacing="${r.track}" fill="#fff">` +
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
    let mass = 0, momentX = 0, momentY = 0, inkPixels = 0, edgePixels = 0;
    // Ink is anything meaningfully brighter than the black ground.
    const isInk = (x, y) => x >= 0 && y >= 0 && x < S && y < S && d[(y * S + x) * 4] + d[(y * S + x) * 4 + 1] + d[(y * S + x) * 4 + 2] >= 200;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const brightness = d[i] + d[i + 1] + d[i + 2];
      mass += brightness; momentX += brightness * (x + 0.5); momentY += brightness * (y + 0.5);
      if (brightness < 200) continue;
      inkPixels++;
      if (!isInk(x - 1, y) || !isInk(x + 1, y) || !isInk(x, y - 1) || !isInk(x, y + 1)) edgePixels++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) { out.push([j.kind, j.id, 'EMPTY'].join('\\u0001')); continue; }
    const half = j.span / 2;
    if (j.kind === 'text') {
      out.push([j.kind, j.id,
        (x0 + x1 + 1) / 2 / PX - half, (y0 + y1 + 1) / 2 / PX - half,
        (x1 - x0 + 1) / PX, (y1 - y0 + 1) / PX].join('\\u0001'));
      continue;
    }
    // Empty pixels the ground cannot reach from the edge are holes: counters, cut-outs, the inside of a ring.
    const outside = new Uint8Array(S * S);
    const stack = [];
    for (let k = 0; k < S; k++) stack.push(k, (S - 1) * S + k, k * S, k * S + S - 1);
    while (stack.length) {
      const k = stack.pop();
      if (outside[k] || isInk(k % S, Math.floor(k / S))) continue;
      outside[k] = 1;
      const x = k % S, y = Math.floor(k / S);
      if (y > 0) stack.push(k - S); if (y < S - 1) stack.push(k + S);
      if (x > 0) stack.push(k - 1); if (x < S - 1) stack.push(k + 1);
    }
    let silhouettePixels = 0;
    for (let k = 0; k < S * S; k++) if (!outside[k]) silhouettePixels++;
    out.push([j.kind, j.id,
      (x0 + x1 + 1) / 2 / PX - half, (y0 + y1 + 1) / 2 / PX - half,
      (x1 - x0 + 1) / PX, (y1 - y0 + 1) / PX,
      momentX / mass / PX - half, momentY / mass / PX - half,
      silhouettePixels / ((x1 - x0 + 1) * (y1 - y0 + 1)),
      2 * inkPixels / edgePixels / PX].join('\\u0001'));
  }
  document.getElementById('out').textContent = out.join('\\u0002');
})();
`;

const measured: string = renderInBrowser(script);

const round = (v: string | number): number => Number(Number(v).toFixed(3));
const artBounds: Record<string, ArtworkMetrics> = {};
const textMetrics: Record<string, TextMetrics> = {};
const empty: string[] = [];

for (const line of measured.trim().split('\u0002')) {
  const [kind, id, cx, cy, w, h, mx, my, fill, stroke] = line.split('\u0001');
  if (cx === 'EMPTY') {
    empty.push(`${kind} ${id}`);
    continue;
  }
  // For text the correction is "move the ink back to the centre", so the
  // offsets are stored negated; the size is kept as measured.
  if (kind === 'text') textMetrics[id] = { dx: round(-cx), dy: round(-cy), cx: round(cx), cy: round(cy), w: round(w), h: round(h) };
  else artBounds[`${kind}:${id}`] = { cx: round(cx), cy: round(cy), w: round(w), h: round(h), mx: round(mx), my: round(my), fill: round(fill), stroke: round(stroke) };
}

if (empty.length) throw new Error(`nothing rendered for: ${empty.join(', ')}`);
for (const [name, exposure] of Object.entries(surfaceExposure)) artBounds[`glyph:${name}`].surfaceExposure = round(exposure);
const missingArt = [
  ...glyphNames.map((n) => `glyph:${n}`),
  ...markNames.map((n) => `mark:${n}`),
].filter((k) => !artBounds[k]);
const missingText = runs.filter((r) => !textMetrics[textMetricsKey(r.str, r.size, r.track)]);
if (missingArt.length) throw new Error(`no bounds measured for: ${missingArt.join(', ')}`);
if (missingText.length) throw new Error(`no bounds measured for text: ${missingText.map((r) => r.str).join(', ')}`);

fs.writeFileSync(GLYPH_OUT, JSON.stringify(artBounds, null, 2) + '\n', 'utf8');
fs.writeFileSync(TEXT_OUT, JSON.stringify(textMetrics, null, 2) + '\n', 'utf8');

const wide = Object.entries(artBounds).filter(([, b]) => Math.max(b.w, b.h) / Math.min(b.w, b.h) > 2.5);
console.log(`measured ${glyphNames.length} pictograms and ${markNames.length} marks -> tools/glyph-bounds.json`);
console.log(`  ${wide.length} are more than 2.5x longer than they are tall: ${wide.map(([k]) => k).join(', ') || '—'}`);
console.log(`measured ${runs.length} text runs -> tools/text-bounds.json`);
const freeSurfaces: string[] = Object.entries(surfaceExposure)
  .filter(([, exposure]) => exposure > SURFACE_EXPOSURE_LIMIT)
  .map(([name, exposure]) => `${name} ${exposure.toFixed(2)}`)
  .sort();
console.log(`  ${freeSurfaces.length} pictograms drawn without their free-standing surface: ${freeSurfaces.join(', ') || '—'}`);
