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
 * PAINT RECIPE and nothing else — see ICON_VARIANTS at the bottom of this
 * file, and
 * tools/palette.ts for the colours it paints with.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glyphs } from './glyphs.ts';
import { marks, unusedImports } from './marks.ts';
import type { Colour, InkPalette } from './shapes.ts';
import {
  FONT_STACK,
  FONT_WEIGHT,
  fontSizeFor,
  letterSpacingFor,
  textMetricsKey,
  fileIcons,
  folderIcons,
  type FileSpec,
  type FolderSpec,
  type FileIcon,
  type FolderIcon,
} from './icon-spec.ts';
import { FOLDER, readableOnGround, darkened, lighterTint } from './palette.ts';
import buildTheme from './build-theme.ts';

/** What tools/measure.ts records for one piece of artwork and one text run. */
type MeasuredBounds = { cx: number; cy: number; w: number; h: number };
type MeasuredTextMetrics = MeasuredBounds & { dx: number; dy: number };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ICONS = path.join(HERE, '..', 'icons');

const readJsonFile = <T,>(name: string): T =>
  JSON.parse(fs.readFileSync(path.join(HERE, name), 'utf8')) as T;

const measuredArtworkBounds = readJsonFile<Record<string, MeasuredBounds>>('glyph-bounds.json');
const measuredTextMetrics = readJsonFile<Record<string, MeasuredTextMetrics>>('text-bounds.json');

const roundToThousandths = (v: number): number => Number(v.toFixed(3));

/* -------------------------------------------------------------- *
 * The box everything is drawn into
 * -------------------------------------------------------------- */

/*
 * Artwork is fitted to ARTWORK_SIZE units and centred on the artwork centre.
 * That centre sits a
 * little up and to the left of the canvas centre because the classic variant's
 * shadow falls down and to the right: put the artwork dead centre and the
 * shadow is what gets clipped by the viewBox.
 */
const ARTWORK_SIZE = 25.4;
const ARTWORK_CENTRE_X = 15.6;
const ARTWORK_CENTRE_Y = 15.4;

/**
 * Hand-authored artwork drifts off its nominal box, and anything that punches
 * holes in itself has ink that is not centred on its bounding box at all.
 * Imported logos are worse: they are drawn to their own optical balance inside
 * whatever box upstream chose. tools/measure.ts rasterises each piece and
 * records where the ink actually is; this puts that ink in the middle of ours,
 * at the size we want, whatever the artwork thought it was doing.
 */
function placeArtwork(kind: string, name: string, body: string, size = ARTWORK_SIZE): string {
  const key = `${kind}:${name}`;
  const b = measuredArtworkBounds[key];
  if (!b) throw new Error(`no measured bounds for ${key} — run: npm run measure:glyphs`);
  const s = size / Math.max(b.w, b.h);
  return (
    `<g transform="translate(${roundToThousandths(ARTWORK_CENTRE_X - b.cx * s)} ${roundToThousandths(ARTWORK_CENTRE_Y - b.cy * s)}) scale(${roundToThousandths(s)})">` +
    body +
    '</g>'
  );
}

/* -------------------------------------------------------------- *
 * Canvas primitives
 * -------------------------------------------------------------- */

const svgDocument = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${body}</svg>`;

// XML-escaped for the font-family attribute, which is quoted with " itself.
const FONT_STACK_ATTRIBUTE = FONT_STACK.replace(/"/g, '&quot;');

/*
 * Lettering is placed from measured ink, not from a rule of thumb.
 * `text-anchor="middle"` centres the advance width, which is not where the ink
 * sits — and the baseline a string wants depends on whether it has a descender.
 * tools/measure.ts records both, plus the ink's size, which is what lets a wide
 * string be scaled down instead of running out of the canvas.
 */
function renderLettering(str: string, fill: Colour, opts: { size?: number; track?: number; dy?: number }): string {
  const size = fontSizeFor(str, opts);
  const track = letterSpacingFor(str, opts);
  const m = measuredTextMetrics[textMetricsKey(str, size, track)];
  if (!m) throw new Error(`no measured text metrics for "${str}" — run: npm run measure:glyphs`);

  // Only ever shrink: the sizes in icon-spec.ts are chosen per character count,
  // and growing a short string here would undo that.
  const fit = Math.min(1, ARTWORK_SIZE / Math.max(m.w, m.h));
  const x = ARTWORK_CENTRE_X + m.dx * fit;
  const y = ARTWORK_CENTRE_Y + (m.dy + (opts.dy || 0)) * fit;
  return (
    `<text x="${roundToThousandths(x)}" y="${roundToThousandths(y)}" text-anchor="middle" ` +
    `font-family="${FONT_STACK_ATTRIBUTE}" font-weight="${FONT_WEIGHT}" font-size="${roundToThousandths(size * fit)}" ` +
    `letter-spacing="${roundToThousandths(track * fit)}" fill="${fill}">${str}</text>`
  );
}

/* -------------------------------------------------------------- *
 * Resolving an icon to artwork plus ink
 * -------------------------------------------------------------- */

/** The colours an icon is painted with, before a variant has had its say. */
function officialPaletteFor(spec: FileSpec): readonly Colour[] {
  if (spec.colors) return spec.colors;
  if (spec.mark) return marks[spec.mark].palette;
  throw new Error('spec has neither a mark nor colours to paint with');
}

/**
 * Pictograms are duotone: the identity colour plus a lighter lighterTint of it. A spec
 * only ever names the identity colour, so the pair is derived here — that way
 * every pictogram gets one for free, and adding a language means adding one
 * colour rather than two.
 */
const withDerivedTint = (ink: InkPalette): InkPalette => (ink.length > 1 ? ink : [ink[0], lighterTint(ink[0])]);

/** Draws a spec's artwork — everything but the lettering — with resolved ink. */
function renderArtwork(spec: FileSpec, ink: InkPalette): string {
  const scale = spec.scale ? ARTWORK_SIZE * spec.scale : ARTWORK_SIZE;
  if (spec.mark) return placeArtwork('mark', spec.mark, marks[spec.mark].draw(ink), scale);
  if (spec.glyph) return placeArtwork('glyph', spec.glyph, glyphs[spec.glyph](withDerivedTint(ink)), scale);
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
const FOLDER_PICTOGRAM_PLACEMENT = {
  closed: { cx: 16, cy: 18.6, size: 12.6 },
  open: { cx: 17, cy: 19.9, size: 11.6 },
};

function renderFolderPictogram(spec: Partial<FolderSpec>, isOpen: boolean, ink: InkPalette): string {
  const at = isOpen ? FOLDER_PICTOGRAM_PLACEMENT.open : FOLDER_PICTOGRAM_PLACEMENT.closed;
  const [kind, name, body] = spec.mark
    ? (['mark', spec.mark, marks[spec.mark].draw(ink)] as const)
    : spec.glyph
      ? (['glyph', spec.glyph, glyphs[spec.glyph](ink)] as const)
      : ([null, null, ''] as const);
  if (!kind) return '';
  const b = measuredArtworkBounds[`${kind}:${name}`];
  if (!b) throw new Error(`no measured bounds for ${kind}:${name} — run: npm run measure:glyphs`);
  const s = at.size / Math.max(b.w, b.h);
  return (
    `<g transform="translate(${roundToThousandths(at.cx - b.cx * s)} ${roundToThousandths(at.cy - b.cy * s)}) scale(${roundToThousandths(s)})">` +
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
 * lightness by palette.ts -> darkened. One soft offset pass, no spread: at the
 * 16px VS Code renders a file icon at, anything more turns the mark to mush.
 */

const DROP_SHADOW_FILTER_ID = 'sh';
const dropShadowFilter = (colour: Colour): string =>
  `<defs><filter id="${DROP_SHADOW_FILTER_ID}" x="-25%" y="-25%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
  `<feDropShadow dx="0.9" dy="1.3" stdDeviation="0.55" flood-color="${colour}" flood-opacity="1"/>` +
  `</filter></defs>`;

const withDropShadow = (body: string): string => `<g filter="url(#${DROP_SHADOW_FILTER_ID})">${body}</g>`;

function renderClassicFileIcon(spec: FileSpec): string {
  const ink = officialPaletteFor(spec).map(readableOnGround);
  let body = renderArtwork(spec, ink);
  if (spec.text) body += renderLettering(spec.text, spec.textFill || ink[0], spec);
  return svgDocument(dropShadowFilter(darkened(ink[0])) + withDropShadow(body));
}

function renderClassicFolderIcon(spec: Partial<FolderSpec>, isOpen: boolean): string {
  const accent = readableOnGround(spec.accent || FOLDER);
  /*
   * The pictogram is not a second colour: it is the folder's own accent taken
   * down until it reads as sunk into the body rather than laid on top of it.
   * Its duotone goes DOWN from there rather than up — the lighter lighterTint a file
   * icon uses would climb back toward the folder it is meant to be cut into.
   */
  const sunk: InkPalette = [darkened(accent, 0.74), darkened(accent, 0.56)];
  const body = isOpen
    ? `<path d="${FOLDER_BACK}" fill="${darkened(accent, 0.34)}"/><path d="${FOLDER_OPEN_FRONT}" fill="${accent}"/>`
    : `<path d="${FOLDER_BACK}" fill="${accent}"/>`;
  return svgDocument(dropShadowFilter(darkened(accent)) + withDropShadow(body + renderFolderPictogram(spec, isOpen, sunk)));
}

/* -------------------------------------------------------------- *
 * Emit
 * -------------------------------------------------------------- */

/** A variant is a paint recipe plus where its output lands. */
type IconVariant = {
  /** Directory under icons/ the SVGs go to. */
  svgDirectory: string;
  /** Manifest filename under icons/theme/. */
  manifestFile: string;
  renderFile: (spec: FileSpec) => string;
  renderFolder: (spec: Partial<FolderSpec>, isOpen: boolean) => string;
};

/*
 * There is one variant, and the machinery for more is kept anyway.
 *
 * V2 shipped a second set, "neon", which lifted every colour until it glowed
 * and traded the shadow for a halo. It is gone in V3 — it read as a novelty
 * next to a set built on the projects' own marks, and it was the one part of
 * the extension nobody could give a reason to prefer. What stays is the shape
 * of the thing: a variant is a paint recipe, `svgDirectory` and `manifestFile`
 * say where it lands, and adding one back touches nothing else. The geometry,
 * the marks, the measurements and the mappings never belonged to a variant in
 * the first place.
 */
const ICON_VARIANTS = {
  classic: {
    svgDirectory: 'svg',
    manifestFile: 'midnight-indigo-icon-theme.json',
    renderFile: renderClassicFileIcon,
    renderFolder: renderClassicFolderIcon,
  },
} satisfies Record<string, IconVariant>;

type IconVariantName = keyof typeof ICON_VARIANTS;

const isKnownVariant = (name: string): name is IconVariantName => name in ICON_VARIANTS;

function buildVariant(variantName: IconVariantName): void {
  const variant: IconVariant = ICON_VARIANTS[variantName];
  const outputDirectory = path.join(ICONS, variant.svgDirectory);

  fs.rmSync(outputDirectory, { recursive: true, force: true });
  fs.mkdirSync(outputDirectory, { recursive: true });
  const writeIconFile = (iconFileName: string, content: string): void =>
    fs.writeFileSync(path.join(outputDirectory, `${iconFileName}.svg`), content, 'utf8');

  for (const [iconName, spec] of Object.entries(fileIcons) as [FileIcon, FileSpec][]) {
    writeIconFile(`file-${iconName}`, variant.renderFile(spec));
  }

  writeIconFile('folder', variant.renderFolder({}, false));
  writeIconFile('folder-open', variant.renderFolder({}, true));
  for (const [iconName, spec] of Object.entries(folderIcons) as [FolderIcon, FolderSpec][]) {
    writeIconFile(`folder-${iconName}`, variant.renderFolder(spec, false));
    writeIconFile(`folder-${iconName}-open`, variant.renderFolder(spec, true));
  }

  const iconCount =
    Object.keys(fileIcons).length + Object.keys(folderIcons).length * 2 + 2;
  console.log(`[${variantName}] wrote ${iconCount} icons to icons/${variant.svgDirectory}/`);

  buildTheme({
    fileIcons: Object.keys(fileIcons) as FileIcon[],
    folderIcons: Object.keys(folderIcons) as FolderIcon[],
    manifestPath: path.join(ICONS, 'theme', variant.manifestFile),
    svgDirectory: variant.svgDirectory,
  });
}

const requestedVariant = process.argv[2];
let variantsToBuild: IconVariantName[];
if (requestedVariant === undefined) variantsToBuild = Object.keys(ICON_VARIANTS) as IconVariantName[];
else if (isKnownVariant(requestedVariant)) variantsToBuild = [requestedVariant];
else throw new Error(`unknown variant "${requestedVariant}" — expected one of: ${Object.keys(ICON_VARIANTS).join(', ')}`);

for (const name of variantsToBuild) buildVariant(name);

const unusedMarkImports = unusedImports();
if (unusedMarkImports.length) console.warn(`note: imported but unused marks: ${unusedMarkImports.join(', ')}`);
