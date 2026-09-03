/*
 * Generates the Midnight Indigo icon sets into icons/<dir>/ plus one icon-theme
 * manifest each. Run with `node tools/build-icons.ts [variant]` — with no
 * argument it builds every variant.
 *
 * Design system
 * -------------
 * FILES   A 26x26 rounded tile (rx 7) centred in the 32x32 canvas, carrying
 *         either the language's official mark or a short acronym. The tile is
 *         what makes the icon readable at 16px: the glyph always sits on a
 *         solid, high-contrast ground, and every icon has the exact same
 *         optical weight and centre.
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
 *
 * Variants
 * --------
 * Everything above is geometry, and every variant shares it: the same glyph
 * library, the same measured centres, the same tile. A variant is a PAINT
 * RECIPE and nothing else — see VARIANTS at the bottom of this file, and
 * tools/palette.js for the colours it paints with.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glyphs, type Colour, type Extra, type GlyphName } from './glyphs.ts';
import {
  FONT,
  WEIGHT,
  sizeFor,
  trackFor,
  textKey,
  files,
  folders,
  type FileSpec,
  type FolderSpec,
  type FileIcon,
  type FolderIcon,
} from './icon-spec.ts';
import {
  LIGHT,
  DARK,
  BG,
  FOLDER_STROKE,
  FOLDER_FILL,
  NEON_TILE,
  autoFg,
  neonInk,
  neonInkAll,
} from './palette.ts';
import buildTheme from './build-theme.ts';

/** What tools/measure.ts records for one glyph and one acronym. */
type GlyphBounds = { cx: number; cy: number; w: number; h: number };
type TextMetrics = { dx: number; dy: number };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ICONS = path.join(HERE, '..', 'icons');

const readJson = <T,>(name: string): T =>
  JSON.parse(fs.readFileSync(path.join(HERE, name), 'utf8')) as T;

const bounds = readJson<Record<string, GlyphBounds>>('glyph-bounds.json');
const textBounds = readJson<Record<string, TextMetrics>>('text-bounds.json');

/*
 * Hand-authored glyphs drift off the nominal 24x24 box, and the ones that punch
 * holes in themselves (the puzzle piece's socket, the gem's facets) have ink
 * that is not centred on their bounding box at all. tools/measure.js rasterises
 * each glyph and records where the ink actually is; this recentres every glyph
 * on that and shrinks anything that outgrew the box.
 */
function place(name: string, cx: number, cy: number, scale: number): string {
  const b = bounds[name];
  if (!b) throw new Error(`no measured bounds for glyph "${name}" — run: npm run measure:glyphs`);
  const fit = Math.min(1, 24 / Math.max(b.w, b.h));
  const s = scale * fit;
  // Recentre in glyph space (before the outer scale), so the correction scales with it.
  return `<g transform="translate(${round(cx - b.cx * s)} ${round(cy - b.cy * s)}) scale(${round(s)})">`;
}

const round = (v: number): number => Number(v.toFixed(3));

/* -------------------------------------------------------------- *
 * Canvas primitives
 * -------------------------------------------------------------- */

const svg = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${body}</svg>`;

// XML-escaped for the font-family attribute, which is quoted with " itself.
const FONT_ATTR = FONT.replace(/"/g, '&quot;');

/** Everything `label()` needs beyond the string itself. */
type LabelOpts = { fill?: Colour; size?: number; track?: number; dy?: number };

/*
 * Acronyms are placed from measured ink, not from a rule of thumb.
 * `text-anchor="middle"` centres the advance width, which is not where the ink
 * sits — and the baseline a string wants depends on whether it has a descender.
 * tools/measure.js records both; this just applies the correction.
 */
function label(str: string, opts: LabelOpts = {}): string {
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

const TILE = (bg: Colour): string => `<rect x="3" y="3" width="26" height="26" rx="7" fill="${bg}"/>`;

// 0.8 puts a 24-unit glyph at 19.2 units inside a 26-unit tile: big, with just
// enough air that the rounded corners never clip it.
const GLYPH_SCALE = 0.8;

function drawGlyph(name: GlyphName, fg: Colour, knockOut: Colour, extra: Extra | undefined, scale?: number): string {
  const g = glyphs[name];
  if (!g) throw new Error(`unknown glyph: ${name}`);
  return place(name, 16, 16, scale || GLYPH_SCALE) + g(fg, knockOut, extra) + '</g>';
}

/* -------------------------------------------------------------- *
 * Folders
 * -------------------------------------------------------------- */

const folderPath = (isOpen: boolean, stroke: Colour, fill: Colour): string =>
  isOpen
    ? `<path d="M4 24.5V7.5A2 2 0 0 1 6 5.5h6.3a2 2 0 0 1 1.55.75l1.8 2.15a2 2 0 0 0 1.55.75H24a2 2 0 0 1 2 2v2.6" ` +
      `fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="M4.15 24.9 7.05 14.85A1.9 1.9 0 0 1 8.87 13.5H28.2a1.45 1.45 0 0 1 1.4 1.85l-2.6 9.25A2.6 2.6 0 0 1 24.5 26.5H6.1A2 2 0 0 1 4.15 24.9Z" ` +
      `fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`
    : `<path d="M4 24.5V7.5A2 2 0 0 1 6 5.5h6.3a2 2 0 0 1 1.55.75l1.8 2.15a2 2 0 0 0 1.55.75H26a2 2 0 0 1 2 2V24.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" ` +
      `fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;

// The overlay sits low-right, where the old badge used to be, but it is the
// pictogram itself — no chip, no lettering — ringed by the editor background.
// Sized so the pictogram still reads at the 16px VS Code renders folders at —
// it is deliberately large enough to cover most of the folder's lower-right.
const OVERLAY_AT = [21.8, 22];
const OVERLAY_SCALE = 0.72;

function overlayAt(name: GlyphName): [string, (typeof glyphs)[GlyphName]] {
  const g = glyphs[name];
  if (!g) throw new Error(`unknown glyph: ${name}`);
  return [place(name, OVERLAY_AT[0], OVERLAY_AT[1], OVERLAY_SCALE), g];
}

// The knock-out ring that separates the pictogram from the folder outline.
function overlayHalo(name: GlyphName): string {
  const [open, g] = overlayAt(name);
  return `${open}<g stroke="${BG}" stroke-width="5.2" stroke-linejoin="round" stroke-linecap="round">${g(BG, BG, [BG, BG, BG])}</g></g>`;
}

function overlayInk(name: GlyphName, accent: Colour, extra?: Extra): string {
  const [open, g] = overlayAt(name);
  return `${open}${g(accent, BG, extra)}</g>`;
}

/* -------------------------------------------------------------- *
 * Variant: classic — brand-coloured tiles
 * -------------------------------------------------------------- */

function classicFile(spec: FileSpec): string {
  const fg = spec.fg || autoFg(spec.bg);
  let body = TILE(spec.bg);
  if (spec.glyph) body += drawGlyph(spec.glyph, fg, spec.hole || spec.bg, spec.extra, spec.scale);
  if (spec.text) body += label(spec.text, { fill: spec.textFill || fg, size: spec.size, dy: spec.dy });
  return svg(body);
}

function classicFolder(spec: Partial<FolderSpec>, isOpen: boolean): string {
  const base = folderPath(isOpen, FOLDER_STROKE, FOLDER_FILL);
  // The plain folder is drawn from an empty spec; a pictogram needs both halves.
  if (!spec.glyph || !spec.accent) return svg(base);
  return svg(base + overlayHalo(spec.glyph) + overlayInk(spec.glyph, spec.accent, spec.extra));
}

/* -------------------------------------------------------------- *
 * Variant: neon — lit ink on a dark ground
 * -------------------------------------------------------------- *
 *
 * Same tile, same glyphs, same measured centres. What changes is the paint:
 * the brand colour moves off the tile and onto the ink, the tile becomes the
 * dark ground already used for folder fills, and everything drawn on it is put
 * through a blur-and-merge filter so it reads as a lit tube rather than a flat
 * shape. The ink itself comes from palette.js -> neonInk, which keeps the
 * brand's hue but raises it until it clears the contrast floor against that
 * ground — half the set's brand colours are too dark to survive otherwise.
 *
 * Glyphs stay FILLED rather than becoming hollow outlines. A 24-unit glyph
 * lands at 19 units on a tile VS Code renders at 16px; hollowing it out at that
 * size closes the counters and turns the pictogram into a smudge. The glow is
 * what carries the neon, not the hollowing.
 */

/*
 * A single soft pass laid UNDER the untouched artwork. Merging the blur over
 * itself is what turns a glow into a bloom: the halo gains enough alpha to
 * swallow the stroke it is supposed to be radiating from, and the icon loses
 * its contour. One pass at partial alpha, with SourceGraphic drawn last, keeps
 * every edge exactly as sharp as the classic set and lets the light sit around
 * it instead of on it.
 */
const GLOW_ID = 'glow';
const GLOW_RADIUS = 0.55;
const GLOW_ALPHA = 0.5;
const NEON_DEFS =
  `<defs><filter id="${GLOW_ID}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">` +
  `<feGaussianBlur stdDeviation="${GLOW_RADIUS}" result="b"/>` +
  `<feComponentTransfer in="b" result="soft"><feFuncA type="linear" slope="${GLOW_ALPHA}"/></feComponentTransfer>` +
  `<feMerge><feMergeNode in="soft"/><feMergeNode in="SourceGraphic"/></feMerge>` +
  `</filter></defs>`;

const lit = (body: string): string => `<g filter="url(#${GLOW_ID})">${body}</g>`;

/*
 * The ring is the tile's lit rim: its outer edge sits exactly on the tile edge
 * (3.7 - 1.4/2 = 3.0), and the corner radius is inset to match so it stays
 * concentric. Drawing it further in cost room the artwork does not have.
 */
const NEON_RING = (ink: Colour): string =>
  `<rect x="3.7" y="3.7" width="24.6" height="24.6" rx="6.3" fill="none" stroke="${ink}" stroke-width="1.4"/>`;

/*
 * On the classic tile the artwork's field is the whole 26-unit tile. Here the
 * ring stands inside that field and takes 1.4 units per side, so artwork drawn
 * at the classic size runs straight into it — the Twig leaf merged with the
 * ring outright, and MDX, ASM, TOML and the jigsaw pieces all touched it.
 * Shrinking the artwork layer about the tile centre gives the ring its room
 * back. It is applied as a transform over already-placed content, so every
 * measured centre from tools/measure.js still holds and no acronym needs
 * re-measuring at a new size.
 */
const NEON_ARTWORK_SCALE = 0.88;
const inset = (body: string): string =>
  `<g transform="translate(16 16) scale(${NEON_ARTWORK_SCALE}) translate(-16 -16)">${body}</g>`;

/*
 * Which colour on the spec carries the language's identity. Normally it is the
 * tile (`bg`). But a handful of specs deliberately pair a dark tile with a
 * coloured glyph — HTML's crest on #2B1610, Python's snakes on #2B5F8E — and
 * there the identity is in `fg`, so lifting `bg` would give a muddy brown where
 * the icon should be orange. `fg: LIGHT` is not an identity colour, it is the
 * classic variant's contrast pick, so it falls through to the tile.
 */
const identity = (spec: FileSpec): Colour => (spec.fg && spec.fg !== LIGHT && spec.fg !== DARK ? spec.fg : spec.bg);

function neonFile(spec: FileSpec): string {
  const ink = neonInk(identity(spec));
  // The two crest icons ask for scale 0.9 so the badge fills a brand-coloured
  // tile. Here the tile is dark and the ring is the frame, so a glyph that big
  // covers both and the icon comes out a solid block among lit outlines.
  const scale = Math.min(spec.scale || GLYPH_SCALE, GLYPH_SCALE);
  let art = '';
  // Knock-outs are painted with the ground, so holes read as holes.
  if (spec.glyph) art += drawGlyph(spec.glyph, ink, NEON_TILE, neonInkAll(spec.extra), scale);
  if (spec.text) art += label(spec.text, { fill: spec.textFill || ink, size: spec.size, dy: spec.dy });
  return svg(NEON_DEFS + TILE(NEON_TILE) + lit(NEON_RING(neonInk(spec.bg)) + inset(art)));
}

function neonFolder(spec: Partial<FolderSpec>, isOpen: boolean): string {
  // The halo stays unlit: it is a knock-out in the editor background, and
  // blurring it would smear a dark cloud over the folder outline it separates.
  const base = lit(folderPath(isOpen, neonInk(FOLDER_STROKE), FOLDER_FILL));
  // The plain folder is drawn from an empty spec; a pictogram needs both halves.
  if (!spec.glyph || !spec.accent) return svg(NEON_DEFS + base);
  return svg(
    NEON_DEFS +
      base +
      overlayHalo(spec.glyph) +
      lit(overlayInk(spec.glyph, neonInk(spec.accent), neonInkAll(spec.extra)))
  );
}

/* -------------------------------------------------------------- *
 * Emit
 * -------------------------------------------------------------- */

/** A variant is a paint recipe plus where to write it. */
type Variant = {
  /** Directory under icons/ the SVGs go to. */
  dir: string;
  /** Manifest filename under icons/theme/. */
  theme: string;
  file: (spec: FileSpec) => string;
  folder: (spec: Partial<FolderSpec>, isOpen: boolean) => string;
};

const VARIANTS = {
  classic: {
    dir: 'svg',
    theme: 'midnight-indigo-icon-theme.json',
    file: classicFile,
    folder: classicFolder,
  },
  neon: {
    dir: 'svg-neon',
    theme: 'midnight-indigo-neon-icon-theme.json',
    file: neonFile,
    folder: neonFolder,
  },
} satisfies Record<string, Variant>;

type VariantName = keyof typeof VARIANTS;

const isVariant = (name: string): name is VariantName => name in VARIANTS;

function build(name: VariantName): void {
  const v: Variant = VARIANTS[name];
  const out = path.join(ICONS, v.dir);

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const write = (icon: string, content: string): void =>
    fs.writeFileSync(path.join(out, `${icon}.svg`), content, 'utf8');

  for (const [icon, spec] of Object.entries(files) as [FileIcon, FileSpec][]) {
    write(`file-${icon}`, v.file(spec));
  }

  write('folder', v.folder({}, false));
  write('folder-open', v.folder({}, true));
  for (const [icon, spec] of Object.entries(folders) as [FolderIcon, FolderSpec][]) {
    write(`folder-${icon}`, v.folder(spec, false));
    write(`folder-${icon}-open`, v.folder(spec, true));
  }

  const count = Object.keys(files).length + Object.keys(folders).length * 2 + 2;
  console.log(`[${name}] wrote ${count} icons to icons/${v.dir}/`);

  buildTheme({
    files: Object.keys(files) as FileIcon[],
    folders: Object.keys(folders) as FolderIcon[],
    out: path.join(ICONS, 'theme', v.theme),
    svgDir: v.dir,
  });
}

const only = process.argv[2];
let targets: VariantName[];
if (only === undefined) targets = Object.keys(VARIANTS) as VariantName[];
else if (isVariant(only)) targets = [only];
else throw new Error(`unknown variant "${only}" — expected one of: ${Object.keys(VARIANTS).join(', ')}`);

for (const name of targets) build(name);
