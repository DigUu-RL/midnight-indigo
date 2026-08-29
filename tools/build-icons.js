'use strict';

/*
 * Generates the whole Midnight Indigo icon set into icons/svg/ plus the
 * icon-theme manifest. Run with `node tools/build-icons.js`.
 *
 * Design system
 * -------------
 * FILES   A 26x26 rounded tile (rx 7) centred in the 32x32 canvas, painted in
 *         the language's brand colour, carrying either its official mark or a
 *         short acronym. The tile is what makes the icon readable at 16px: the
 *         glyph always sits on a solid, high-contrast ground, and every icon
 *         has the exact same optical weight and centre.
 * FOLDERS A stroked (outlined) folder in lavender, with a pictogram sitting
 *         over its bottom-right corner. The pictogram is drawn twice: once in
 *         the editor background colour with a stroke on the wrapper (punching a
 *         halo through the folder outline) and once in its accent colour on
 *         top. That halo is the "leve borda" that separates the two shapes.
 *
 * There are no badges anywhere. File variants (.spec.ts, .module.ts, ...) are
 * their own icons: the tile keeps the language colour so you still read the
 * language, and the whole glyph area is given over to the pictogram that says
 * what the file is.
 */

const fs = require('fs');
const path = require('path');
const { glyphs } = require('./glyphs');
const { FONT, WEIGHT, sizeFor, trackFor, textKey, files, folders } = require('./icon-spec');
const bounds = require('./glyph-bounds.json');
const textBounds = require('./text-bounds.json');

const OUT = path.join(__dirname, '..', 'icons', 'svg');

/*
 * Hand-authored glyphs drift off the nominal 24x24 box, and the ones that punch
 * holes in themselves (the puzzle piece's socket, the gem's facets) have ink
 * that is not centred on their bounding box at all. tools/measure.js rasterises
 * each glyph and records where the ink actually is; this recentres every glyph
 * on that and shrinks anything that outgrew the box.
 */
function place(name, cx, cy, scale) {
  const b = bounds[name];
  if (!b) throw new Error(`no measured bounds for glyph "${name}" — run: npm run measure:glyphs`);
  const fit = Math.min(1, 24 / Math.max(b.w, b.h));
  const s = scale * fit;
  // Recentre in glyph space (before the outer scale), so the correction scales with it.
  return `<g transform="translate(${round(cx - b.cx * s)} ${round(cy - b.cy * s)}) scale(${round(s)})">`;
}

const round = (v) => Number(v.toFixed(3));

/* -------------------------------------------------------------- *
 * Canvas primitives
 * -------------------------------------------------------------- */

const BG = '#020108'; // themes/midnight-indigo-color-theme.json -> editor.background
const DARK = '#0A0716'; // glyph colour on light tiles
const LIGHT = '#FFFFFF'; // glyph colour on dark tiles

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${body}</svg>`;

// Perceived lightness, used to pick a dark or light glyph automatically so the
// spec below never has to think about contrast.
function autoFg(hex) {
  const m = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.35 ? DARK : LIGHT;
}

// XML-escaped for the font-family attribute, which is quoted with " itself.
const FONT_ATTR = FONT.replace(/"/g, '&quot;');

/*
 * Acronyms are placed from measured ink, not from a rule of thumb.
 * `text-anchor="middle"` centres the advance width, which is not where the ink
 * sits — and the baseline a string wants depends on whether it has a descender.
 * tools/measure.js records both; this just applies the correction.
 */
function label(str, opts = {}) {
  const size = sizeFor(str, opts);
  const track = trackFor(str, opts);
  const m = textBounds[textKey(str, size, track)];
  if (!m) throw new Error(`no measured text metrics for "${str}" — run: npm run measure:glyphs`);
  // dx/dy move the measured ink box onto the tile centre.
  return (
    `<text x="${round(16 + m.dx)}" y="${round(16 + m.dy + (opts.dy || 0))}" text-anchor="middle" ` +
    `font-family="${FONT_ATTR}" font-weight="${WEIGHT}" font-size="${size}" ` +
    `letter-spacing="${track}" fill="${opts.fill}">${str}</text>`
  );
}

const TILE = (bg) => `<rect x="3" y="3" width="26" height="26" rx="7" fill="${bg}"/>`;

// 0.8 puts a 24-unit glyph at 19.2 units inside a 26-unit tile: big, with just
// enough air that the rounded corners never clip it.
const GLYPH_SCALE = 0.8;

function fileIcon(spec) {
  const bg = spec.bg;
  const fg = spec.fg || autoFg(bg);
  let body = TILE(bg);
  if (spec.glyph) {
    const g = glyphs[spec.glyph];
    if (!g) throw new Error(`unknown glyph: ${spec.glyph}`);
    body += place(spec.glyph, 16, 16, spec.scale || GLYPH_SCALE) + g(fg, spec.hole || bg, spec.extra) + '</g>';
  }
  if (spec.text) body += label(spec.text, { fill: spec.textFill || fg, size: spec.size, dy: spec.dy });
  return svg(body);
}

/* -------------------------------------------------------------- *
 * Folders
 * -------------------------------------------------------------- */

const FOLDER_STROKE = '#8B7CF6';
const FOLDER_FILL = '#1A1338';

const FOLDER_CLOSED =
  `<path d="M4 24.5V7.5A2 2 0 0 1 6 5.5h6.3a2 2 0 0 1 1.55.75l1.8 2.15a2 2 0 0 0 1.55.75H26a2 2 0 0 1 2 2V24.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" ` +
  `fill="${FOLDER_FILL}" stroke="${FOLDER_STROKE}" stroke-width="2" stroke-linejoin="round"/>`;

const FOLDER_OPEN =
  `<path d="M4 24.5V7.5A2 2 0 0 1 6 5.5h6.3a2 2 0 0 1 1.55.75l1.8 2.15a2 2 0 0 0 1.55.75H24a2 2 0 0 1 2 2v2.6" ` +
  `fill="${FOLDER_FILL}" stroke="${FOLDER_STROKE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
  `<path d="M4.15 24.9 7.05 14.85A1.9 1.9 0 0 1 8.87 13.5H28.2a1.45 1.45 0 0 1 1.4 1.85l-2.6 9.25A2.6 2.6 0 0 1 24.5 26.5H6.1A2 2 0 0 1 4.15 24.9Z" ` +
  `fill="${FOLDER_FILL}" stroke="${FOLDER_STROKE}" stroke-width="2" stroke-linejoin="round"/>`;

// The overlay sits low-right, where the old badge used to be, but it is the
// pictogram itself — no chip, no lettering — ringed by the editor background.
// Sized so the pictogram still reads at the 16px VS Code renders folders at —
// it is deliberately large enough to cover most of the folder's lower-right.
const OVERLAY_AT = [21.8, 22];
const OVERLAY_SCALE = 0.72;

function overlay(name, accent, extra) {
  const g = glyphs[name];
  if (!g) throw new Error(`unknown glyph: ${name}`);
  const open = place(name, OVERLAY_AT[0], OVERLAY_AT[1], OVERLAY_SCALE);
  const halo = `${open}<g stroke="${BG}" stroke-width="5.2" stroke-linejoin="round" stroke-linecap="round">${g(BG, BG, [BG, BG, BG])}</g></g>`;
  return halo + `${open}${g(accent, BG, extra)}</g>`;
}

function folderIcon(spec, isOpen) {
  const base = isOpen ? FOLDER_OPEN : FOLDER_CLOSED;
  return svg(spec.glyph ? base + overlay(spec.glyph, spec.accent, spec.extra) : base);
}

/* -------------------------------------------------------------- *
 * Emit
 * -------------------------------------------------------------- */

function write(name, content) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), content, 'utf8');
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const [name, spec] of Object.entries(files)) write(`file-${name}`, fileIcon(spec));

  write('folder', folderIcon({}, false));
  write('folder-open', folderIcon({}, true));
  for (const [name, spec] of Object.entries(folders)) {
    write(`folder-${name}`, folderIcon(spec, false));
    write(`folder-${name}-open`, folderIcon(spec, true));
  }

  const count = Object.keys(files).length + Object.keys(folders).length * 2 + 2;
  console.log(`wrote ${count} icons to icons/svg/`);

  require('./build-theme')({ files: Object.keys(files), folders: Object.keys(folders) });
}

build();
