/*
 * Generates the Midnight Indigo icon sets into icons/<dir>/ plus one icon-theme
 * manifest each. Run with `node tools/build-icons.ts [variant]` — with no
 * argument it builds every variant.
 *
 * Design system (V2)
 * ------------------
 * FILES   No tile. The mark IS the icon: the language's own logo, or one of our
 *         pictograms, or bare lettering, drawn to fill a 25.4-unit box in the
 *         32-unit canvas. V1 put everything on a 26x26 rounded tile, which gave
 *         the set a uniform optical weight at the cost of shrinking every logo
 *         to fit inside it — and of painting official two-tone marks onto a
 *         brand-coloured ground they were never meant to sit on. Dropping the
 *         tile gives each logo the whole icon and lets it be the shape it is.
 *
 *         Because there is no tile, there is also no knock-out colour: holes in
 *         a shape are cut with fill-rule="evenodd" and are genuinely
 *         transparent, so an icon survives the file explorer's hover and
 *         selection backgrounds. See tools/shapes.ts.
 *
 * FOLDERS A solid folder in the folder's accent colour, with its pictogram sunk
 *         into the body in a darker tone of that same accent. One shape, two
 *         tones, no outline — the same flat language as the file icons.
 *
 * There are no badges anywhere. File variants (.spec.ts, .module.ts, ...) are
 * their own icons: the colour keeps saying which language it is, and the whole
 * icon is given over to the pictogram that says what the file does.
 *
 * Variants
 * --------
 * Everything above is geometry, and every variant shares it: the same marks,
 * the same pictograms, the same measured centres, the same box. A variant is a
 * PAINT RECIPE and nothing else — see VARIANTS at the bottom of this file, and
 * tools/palette.ts for the colours it paints with.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glyphs } from './glyphs.ts';
import { marks, unusedImports } from './marks.ts';
import type { Colour, Ink } from './shapes.ts';
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
import { FOLDER, readable, shade, tint } from './palette.ts';
import buildTheme from './build-theme.ts';

/** What tools/measure.ts records for one piece of artwork and one text run. */
type Bounds = { cx: number; cy: number; w: number; h: number };
type TextMetrics = Bounds & { dx: number; dy: number };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ICONS = path.join(HERE, '..', 'icons');

const readJson = <T,>(name: string): T =>
  JSON.parse(fs.readFileSync(path.join(HERE, name), 'utf8')) as T;

const bounds = readJson<Record<string, Bounds>>('glyph-bounds.json');
const textBounds = readJson<Record<string, TextMetrics>>('text-bounds.json');

const round = (v: number): number => Number(v.toFixed(3));

/* -------------------------------------------------------------- *
 * The box everything is drawn into
 * -------------------------------------------------------------- */

/*
 * Artwork is fitted to ART units and centred on (CX, CY). The centre sits a
 * little up and to the left of the canvas centre because the classic variant's
 * shadow falls down and to the right: put the artwork dead centre and the
 * shadow is what gets clipped by the viewBox.
 */
const ART = 25.4;
const CX = 15.6;
const CY = 15.4;

/**
 * Hand-authored artwork drifts off its nominal box, and anything that punches
 * holes in itself has ink that is not centred on its bounding box at all.
 * Imported logos are worse: they are drawn to their own optical balance inside
 * whatever box upstream chose. tools/measure.ts rasterises each piece and
 * records where the ink actually is; this puts that ink in the middle of ours,
 * at the size we want, whatever the artwork thought it was doing.
 */
function place(kind: string, name: string, body: string, size = ART): string {
  const key = `${kind}:${name}`;
  const b = bounds[key];
  if (!b) throw new Error(`no measured bounds for ${key} — run: npm run measure:glyphs`);
  const s = size / Math.max(b.w, b.h);
  return (
    `<g transform="translate(${round(CX - b.cx * s)} ${round(CY - b.cy * s)}) scale(${round(s)})">` +
    body +
    '</g>'
  );
}

/* -------------------------------------------------------------- *
 * Canvas primitives
 * -------------------------------------------------------------- */

const svg = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${body}</svg>`;

// XML-escaped for the font-family attribute, which is quoted with " itself.
const FONT_ATTR = FONT.replace(/"/g, '&quot;');

/*
 * Lettering is placed from measured ink, not from a rule of thumb.
 * `text-anchor="middle"` centres the advance width, which is not where the ink
 * sits — and the baseline a string wants depends on whether it has a descender.
 * tools/measure.ts records both, plus the ink's size, which is what lets a wide
 * string be scaled down instead of running out of the canvas.
 */
function label(str: string, fill: Colour, opts: { size?: number; track?: number; dy?: number }): string {
  const size = sizeFor(str, opts);
  const track = trackFor(str, opts);
  const m = textBounds[textKey(str, size, track)];
  if (!m) throw new Error(`no measured text metrics for "${str}" — run: npm run measure:glyphs`);

  // Only ever shrink: the sizes in icon-spec.ts are chosen per character count,
  // and growing a short string here would undo that.
  const fit = Math.min(1, ART / Math.max(m.w, m.h));
  const x = CX + m.dx * fit;
  const y = CY + (m.dy + (opts.dy || 0)) * fit;
  return (
    `<text x="${round(x)}" y="${round(y)}" text-anchor="middle" ` +
    `font-family="${FONT_ATTR}" font-weight="${WEIGHT}" font-size="${round(size * fit)}" ` +
    `letter-spacing="${round(track * fit)}" fill="${fill}">${str}</text>`
  );
}

/* -------------------------------------------------------------- *
 * Resolving an icon to artwork plus ink
 * -------------------------------------------------------------- */

/** The colours an icon is painted with, before a variant has had its say. */
function paletteOf(spec: FileSpec): readonly Colour[] {
  if (spec.colors) return spec.colors;
  if (spec.mark) return marks[spec.mark].palette;
  throw new Error('spec has neither a mark nor colours to paint with');
}

/**
 * Pictograms are duotone: the identity colour plus a lighter tint of it. A spec
 * only ever names the identity colour, so the pair is derived here — that way
 * every pictogram gets one for free, and adding a language means adding one
 * colour rather than two.
 */
const duotone = (ink: Ink): Ink => (ink.length > 1 ? ink : [ink[0], tint(ink[0])]);

/** Draws a spec's artwork — everything but the lettering — with resolved ink. */
function artwork(spec: FileSpec, ink: Ink): string {
  const scale = spec.scale ? ART * spec.scale : ART;
  if (spec.mark) return place('mark', spec.mark, marks[spec.mark].draw(ink), scale);
  if (spec.glyph) return place('glyph', spec.glyph, glyphs[spec.glyph](duotone(ink)), scale);
  return '';
}

/* -------------------------------------------------------------- *
 * Folders
 * -------------------------------------------------------------- */

/*
 * One folder, two states. The closed folder is a tabbed rounded rectangle; the
 * open one keeps that WHOLE shape as the back of the folder and swings a front
 * panel out and down over it, which is what reads as "open" at 16px — a folder
 * drawn merely wider does not.
 *
 * The back is the complete folder rather than the strip of it that shows above
 * the front panel. Drawing only the strip leaves the ground visible in the
 * wedge between the panel's slanted left edge and the folder's own left edge,
 * and that gap reads as a piece of the icon failing to render rather than as
 * depth.
 */
const FOLDER_BACK =
  'M3 9.4a2.6 2.6 0 0 1 2.6-2.6h6.35a2.2 2.2 0 0 1 1.7.8l1.85 2.25a2.2 2.2 0 0 0 1.7.8H26.4A2.6 2.6 0 0 1 29 13.25V24.4a2.6 2.6 0 0 1-2.6 2.6H5.6A2.6 2.6 0 0 1 3 24.4Z';
const FOLDER_OPEN_FRONT =
  'M3.05 24.6 6.15 14.4A2.6 2.6 0 0 1 8.65 12.55h19.6a1.8 1.8 0 0 1 1.72 2.32l-2.8 9.45A3 3 0 0 1 24.3 27H5.6a2.6 2.6 0 0 1-2.55-2.4Z';

/** Where the pictogram sits, and how big, in each state. */
const FOLDER_ART = {
  closed: { cx: 16, cy: 18.6, size: 12.6 },
  open: { cx: 17, cy: 19.9, size: 11.6 },
};

function folderArt(spec: Partial<FolderSpec>, isOpen: boolean, ink: Ink): string {
  const at = isOpen ? FOLDER_ART.open : FOLDER_ART.closed;
  const [kind, name, body] = spec.mark
    ? (['mark', spec.mark, marks[spec.mark].draw(ink)] as const)
    : spec.glyph
      ? (['glyph', spec.glyph, glyphs[spec.glyph](ink)] as const)
      : ([null, null, ''] as const);
  if (!kind) return '';
  const b = bounds[`${kind}:${name}`];
  if (!b) throw new Error(`no measured bounds for ${kind}:${name} — run: npm run measure:glyphs`);
  const s = at.size / Math.max(b.w, b.h);
  return (
    `<g transform="translate(${round(at.cx - b.cx * s)} ${round(at.cy - b.cy * s)}) scale(${round(s)})">` +
    body +
    '</g>'
  );
}

/* -------------------------------------------------------------- *
 * Variant: classic — flat, official colour, with a shadow
 * -------------------------------------------------------------- *
 *
 * The shadow is what keeps a flat icon from looking like a sticker on this
 * theme, and it cannot be black: the ground is #040208, so a black shadow is
 * not a shadow, it is nothing. Each icon casts its own colour, taken down in
 * lightness by palette.ts -> shade. One soft offset pass, no spread: at the
 * 16px VS Code renders a file icon at, anything more turns the mark to mush.
 */

const SHADOW_ID = 'sh';
const SHADOW = (colour: Colour): string =>
  `<defs><filter id="${SHADOW_ID}" x="-25%" y="-25%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
  `<feDropShadow dx="0.9" dy="1.3" stdDeviation="0.55" flood-color="${colour}" flood-opacity="1"/>` +
  `</filter></defs>`;

const dropped = (body: string): string => `<g filter="url(#${SHADOW_ID})">${body}</g>`;

function classicFile(spec: FileSpec): string {
  const ink = paletteOf(spec).map(readable);
  let body = artwork(spec, ink);
  if (spec.text) body += label(spec.text, spec.textFill || ink[0], spec);
  return svg(SHADOW(shade(ink[0])) + dropped(body));
}

function classicFolder(spec: Partial<FolderSpec>, isOpen: boolean): string {
  const accent = readable(spec.accent || FOLDER);
  /*
   * The pictogram is not a second colour: it is the folder's own accent taken
   * down until it reads as sunk into the body rather than laid on top of it.
   * Its duotone goes DOWN from there rather than up — the lighter tint a file
   * icon uses would climb back toward the folder it is meant to be cut into.
   */
  const sunk: Ink = [shade(accent, 0.74), shade(accent, 0.56)];
  const body = isOpen
    ? `<path d="${FOLDER_BACK}" fill="${shade(accent, 0.34)}"/><path d="${FOLDER_OPEN_FRONT}" fill="${accent}"/>`
    : `<path d="${FOLDER_BACK}" fill="${accent}"/>`;
  return svg(SHADOW(shade(accent)) + dropped(body + folderArt(spec, isOpen, sunk)));
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

/*
 * There is one variant, and the machinery for more is kept anyway.
 *
 * V2 shipped a second set, "neon", which lifted every colour until it glowed
 * and traded the shadow for a halo. It is gone in V3 — it read as a novelty
 * next to a set built on the projects' own marks, and it was the one part of
 * the extension nobody could give a reason to prefer. What stays is the shape
 * of the thing: a variant is a paint recipe, `dir` and `theme` say where it
 * lands, and adding one back touches nothing else. The geometry, the marks, the
 * measurements and the mappings never belonged to a variant in the first place.
 */
const VARIANTS = {
  classic: {
    dir: 'svg',
    theme: 'midnight-indigo-icon-theme.json',
    file: classicFile,
    folder: classicFolder,
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

const dead = unusedImports();
if (dead.length) console.warn(`note: imported but unused marks: ${dead.join(', ')}`);
