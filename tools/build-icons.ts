/*
 * Generates the Midnight Indigo icon sets into icons/<dir>/ plus one icon-theme
 * manifest each. Run with `node tools/build-icons.ts [variant]` — with no
 * argument it builds every variant.
 *
 * Design system (V4)
 * ------------------
 * FILES   No tile. The mark IS the icon: the language's own logo, or an
 *         imported pictogram, or bare lettering, drawn to fill a 25.4-unit box
 *         in the 32-unit canvas. V1 put everything on a 26x26 rounded tile,
 *         which gave the set a uniform optical weight at the cost of shrinking
 *         every logo to fit inside it — and of painting official two-tone marks
 *         onto a brand-coloured ground they were never meant to sit on.
 *         Dropping the tile gives each logo the whole icon and lets it be the
 *         shape it is.
 *
 *         Because there is no tile, there is also no knock-out colour: holes in
 *         a shape are cut with fill-rule="evenodd" and are genuinely
 *         transparent, so an icon survives the file explorer's hover and
 *         selection backgrounds. See tools/shapes.ts.
 *
 *         The pictograms are no longer drawn here. V4 imports them from Iconify
 *         (tools/import-pictograms.ts) and keeps only the treatment: the box,
 *         the measured centring, the duotone split, the shadow.
 *
 * FOLDERS A facade — one flat panel, square to the viewer, with the pictogram
 *         sunk into it in a darker tone of the same accent and a hard-edged
 *         beam of light crossing it at 40 degrees. See the folder section
 *         below, which is where that is drawn and argued.
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
import { glyphs, unusedPictograms, type GlyphName } from './glyphs.ts';
import { marks, unusedImports } from './marks.ts';
import { filledPath, roundedRectanglePath, type Colour, type InkPalette } from './shapes.ts';
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
import { FOLDER, LINE_ART_CONTRAST, readableOnGround, darkened, lighterTint, castShadow } from './palette.ts';
import buildTheme from './build-theme.ts';
import { ARTWORK_CENTRE } from './icon-optics.ts';

/** What tools/measure.ts records for one piece of artwork and one text run. */
type MeasuredBounds = { cx: number; cy: number; w: number; h: number };
type MeasuredArtwork = MeasuredBounds & { mx: number; my: number; fill: number; stroke: number };
type MeasuredTextMetrics = MeasuredBounds & { dx: number; dy: number };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ICONS = path.join(HERE, '..', 'icons');

const readJsonFile = <T,>(name: string): T =>
  JSON.parse(fs.readFileSync(path.join(HERE, name), 'utf8')) as T;

const measuredArtworkBounds = readJsonFile<Record<string, MeasuredArtwork>>('glyph-bounds.json');
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
const ARTWORK_CENTRE_X = ARTWORK_CENTRE.x;
const ARTWORK_CENTRE_Y = ARTWORK_CENTRE.y;

/*
 * OPTICAL PLACEMENT (M10)
 * -----------------------
 * Up to 9.0 every piece of artwork was centred on its ink's bounding box and
 * fitted so its longer side was ARTWORK_SIZE. Both are geometric answers, and
 * the eye does not measure boxes. The optical audit (tools/audit-icons.ts)
 * found the ink's WEIGHT up to 2.3px off centre at 16px — the flask sat on its
 * bulb, the Vercel and CMake triangles on their bases, the zsh prompt leaned on
 * its percent sign — and a tenfold spread in how much of the box an icon
 * darkens, from the solid TypeScript square to the hairline Electron atom.
 *
 * So placement now answers to the measured weight as well as the box:
 *
 *   CENTRE. The point put on the canvas centre is pulled from the box's centre
 *   halfway toward the ink's centre of mass — the correction an icon designer
 *   makes by hand to a play button or a flask. All the way would over-correct
 *   anything with a long thin part (the Java cup's steam would drag it down);
 *   none is what the audit caught. The shift is capped, and the artwork is
 *   kept inside the canvas whatever the pull asks for.
 *
 *   SIZE. A square that fills its box reads bigger than a disc of the same
 *   width, and a triangle smaller; so the artwork is scaled by how much of its
 *   own box its silhouette fills, against a disc's 0.785, gently (a fourth
 *   root) and within a narrow band — this evens out the set, it does not
 *   redraw it. And a mark far longer than it is tall — the Go and .NET
 *   wordmarks — is given length it can have: fitting its long side to the box
 *   left it five pixels tall at 16px.
 */
const OPTICAL = {
  /** 0 centres the ink's box, 1 its centre of mass. */
  centrePull: 0.5,
  /** The furthest the pull may move artwork, as a share of its size. */
  maxShift: 0.1,
  /** A disc's share of its bounding box: the fill that is neither grown nor shrunk. */
  referenceFill: Math.PI / 4,
  fillExponent: 0.25,
  minFillScale: 0.93,
  maxFillScale: 1.06,
  /** Below this ratio of short side to long, a mark counts as long. */
  longAspect: 0.6,
  aspectExponent: 0.3,
  /** No correction may take the long side past this share of the nominal size. */
  maxGrowth: 1.12,
  /** Clear canvas kept round the artwork: top/left, and bottom/right where the shadow falls. */
  leadingInset: 0.8,
  trailingInset: 1.6,
};

const clamp = (value: number, lowest: number, highest: number): number => Math.min(highest, Math.max(lowest, value));

/** The transform that puts measured artwork on a centre, sized and centred optically. */
const opticalTransform = (key: string, centreX: number, centreY: number, size: number): { transform: string; scale: number } => {
  const measured: MeasuredArtwork | undefined = measuredArtworkBounds[key];
  if (!measured) throw new Error(`no measured bounds for ${key} — run: npm run measure:glyphs`);
  const longSide: number = Math.max(measured.w, measured.h);
  const aspect: number = Math.min(measured.w, measured.h) / longSide;
  const fillScale: number = clamp(
    (OPTICAL.referenceFill / measured.fill) ** OPTICAL.fillExponent,
    OPTICAL.minFillScale,
    OPTICAL.maxFillScale
  );
  const aspectScale: number = aspect < OPTICAL.longAspect ? (OPTICAL.longAspect / aspect) ** OPTICAL.aspectExponent : 1;
  const room: number = 32 - OPTICAL.leadingInset - OPTICAL.trailingInset;
  const scale: number = Math.min(room, size * Math.min(OPTICAL.maxGrowth, fillScale * aspectScale)) / longSide;

  const reach: number = OPTICAL.maxShift * size;
  const anchorX: number = measured.cx + clamp(OPTICAL.centrePull * (measured.mx - measured.cx) * scale, -reach, reach) / scale;
  const anchorY: number = measured.cy + clamp(OPTICAL.centrePull * (measured.my - measured.cy) * scale, -reach, reach) / scale;

  /* Keep the placed box on the canvas, whatever the pull asked for. */
  const keepInside = (translate: number, boxCentre: number, extent: number): number => {
    const start: number = translate + (boxCentre - extent / 2) * scale;
    const end: number = translate + (boxCentre + extent / 2) * scale;
    if (start < OPTICAL.leadingInset) return translate + OPTICAL.leadingInset - start;
    if (end > 32 - OPTICAL.trailingInset) return translate - (end - (32 - OPTICAL.trailingInset));
    return translate;
  };
  const translateX: number = keepInside(centreX - anchorX * scale, measured.cx, measured.w);
  const translateY: number = keepInside(centreY - anchorY * scale, measured.cy, measured.h);
  return {
    transform: `translate(${roundToThousandths(translateX)} ${roundToThousandths(translateY)}) scale(${roundToThousandths(scale)})`,
    scale,
  };
};

/** The mean stroke of measured artwork once placed at `scale`, in canvas units. */
const placedStroke = (key: string, scale: number): number => measuredArtworkBounds[key].stroke * scale;

/**
 * Hand-authored artwork drifts off its nominal box, and anything that punches
 * holes in itself has ink that is not centred on its bounding box at all.
 * Imported logos are worse: they are drawn to their own optical balance inside
 * whatever box upstream chose. tools/measure.ts rasterises each piece and
 * records where the ink actually is; this puts that ink in the middle of ours,
 * at the size we want, whatever the artwork thought it was doing.
 */
const placeArtwork = (kind: string, name: string, body: string, size = ARTWORK_SIZE): { body: string; stroke: number } => {
  const key: string = `${kind}:${name}`;
  const placed = opticalTransform(key, ARTWORK_CENTRE_X, ARTWORK_CENTRE_Y, size);
  return { body: `<g transform="${placed.transform}">${body}</g>`, stroke: placedStroke(key, placed.scale) };
};

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
type PlacedLettering = {
  body: string;
  /** Where the ink actually landed, which is what the rule is drawn under. */
  inkWidth: number;
  inkHeight: number;
  inkCentreY: number;
};

function renderLettering(
  str: string,
  fill: Colour,
  opts: { size?: number; track?: number; dy?: number; reserve?: number }
): PlacedLettering {
  const size = fontSizeFor(str, opts);
  const track = letterSpacingFor(str, opts);
  const m = measuredTextMetrics[textMetricsKey(str, size, track)];
  if (!m) throw new Error(`no measured text metrics for "${str}" — run: npm run measure:glyphs`);

  /*
   * Only ever shrink: the sizes in icon-spec.ts are chosen per character count,
   * and growing a short string here would undo that.
   *
   * `reserve` is the height something else is taking out of the box — the rule
   * under a lettered icon. It comes off the HEIGHT the string may use and not
   * off the width, because a rule under "LESS" does not make "LESS" narrower;
   * and it is taken here rather than by nudging the finished text, so a tall
   * single letter shrinks to fit instead of being pushed out of the canvas.
   */
  const available = ARTWORK_SIZE - (opts.reserve || 0);
  const fit = Math.min(1, ARTWORK_SIZE / m.w, available / m.h);
  const lift = (opts.reserve || 0) / 2;
  const x = ARTWORK_CENTRE_X + m.dx * fit;
  const y = ARTWORK_CENTRE_Y - lift + (m.dy + (opts.dy || 0)) * fit;
  return {
    body:
      `<text x="${roundToThousandths(x)}" y="${roundToThousandths(y)}" text-anchor="middle" ` +
      `font-family="${FONT_STACK_ATTRIBUTE}" font-weight="${FONT_WEIGHT}" font-size="${roundToThousandths(size * fit)}" ` +
      `letter-spacing="${roundToThousandths(track * fit)}" fill="${fill}">${str}</text>`,
    inkWidth: m.w * fit,
    inkHeight: m.h * fit,
    inkCentreY: ARTWORK_CENTRE_Y - lift + (opts.dy || 0) * fit,
  };
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
 * Pictograms are duotone: the identity colour plus a lighter tint of it. A spec
 * only ever names the identity colour, so the pair is derived here — that way
 * every pictogram gets one for free, and adding a language means adding one
 * colour rather than two.
 */
const withDerivedTint = (ink: InkPalette): InkPalette => (ink.length > 1 ? ink : [ink[0], lighterTint(ink[0])]);

/**
 * Draws a spec's artwork — everything but the lettering — with resolved ink,
 * and says how thick its strokes came out, which decides its shadow.
 */
function renderArtwork(spec: FileSpec, ink: InkPalette): { body: string; stroke: number } {
  const scale = spec.scale ? ARTWORK_SIZE * spec.scale : ARTWORK_SIZE;
  if (spec.mark) return placeArtwork('mark', spec.mark, marks[spec.mark].draw(ink), scale);
  if (spec.glyph) return placeArtwork('glyph', spec.glyph, glyphs[spec.glyph](withDerivedTint(ink)), scale);
  return { body: '', stroke: Infinity };
}

/* -------------------------------------------------------------- *
 * Folders
 * -------------------------------------------------------------- */

/*
 * FOLDERS ARE FACADES (V4)
 * ------------------------
 * A folder icon has no business pretending to be a cardboard wallet seen at an
 * angle. V3's was exactly that, and the illusion cost it twice: the tab was a
 * little notch of perspective nobody could read at 16px, and the open state had
 * to fake a second sheet of card to say "open".
 *
 * V4 draws the folder flat-on, as a FACADE: one panel, square to the viewer,
 * with a single horizontal seam where the tab meets the body. It is a building
 * seen head-on rather than a container seen from above, and at 16px a face
 * reads where a perspective does not.
 *
 * What makes it futuristic rather than merely plain is the LIGHT. One hard-
 * edged beam crosses the facade at 40 degrees, with a narrow companion beam
 * beside it — the two-band sweep of a light passing over a surface. It is
 * clipped to the panel, so it is light ON the folder rather than a stripe
 * floating over the file tree, and it is drawn LAST, over the pictogram as well
 * as the body: light falls on everything in front of it or it is not light.
 *
 * The beam is the one place in the set that spends opacity. Everywhere else a
 * translucent shape would be blending with #040208, which is to say vanishing;
 * here it blends with the folder's own accent, which is opaque, saturated and
 * exactly what the light is supposed to be falling on.
 */

/** The facade: a panel with a tab, drawn square to the viewer. */
const FOLDER_FACADE =
  'M3 8.9a2.4 2.4 0 0 1 2.4-2.4h7.3a2.4 2.4 0 0 1 1.94.99l1.36 1.87a2.4 2.4 0 0 0 1.94.99H26.6A2.4 2.4 0 0 1 29 12.75v11.85A2.4 2.4 0 0 1 26.6 27H5.4A2.4 2.4 0 0 1 3 24.6Z';

/*
 * The open state is the same facade with its front wall dropped away — the
 * panel slides down and the body behind it is revealed as a darker tone of the
 * same accent. No second sheet of card, no perspective: one face in front of
 * another, which is how a flat set says "in front".
 */
const FOLDER_OPEN_BACK =
  'M2.4 8.4a2.4 2.4 0 0 1 2.4-2.4h7.3a2.4 2.4 0 0 1 1.94.99l1.36 1.87a2.4 2.4 0 0 0 1.94.99H26a2.4 2.4 0 0 1 2.4 2.4v9.15A2.4 2.4 0 0 1 26 23.8H4.8a2.4 2.4 0 0 1-2.4-2.4Z';
const FOLDER_OPEN_FRONT =
  'M5.2 15.2a2.4 2.4 0 0 1 2.4-2.4H27.2a2.4 2.4 0 0 1 2.4 2.4v9.8a2.4 2.4 0 0 1-2.4 2.4H7.6a2.4 2.4 0 0 1-2.4-2.4Z';

/** Where the pictogram sits, and how big, in each state. */
const FOLDER_PICTOGRAM_PLACEMENT = {
  closed: { cx: 16, cy: 18.4, size: 12.4 },
  open: { cx: 17.4, cy: 20.1, size: 11.2 },
};

/* The light that crosses the facade. */
const BEAM_CLIP_ID = 'fc';
const BEAM_ANGLE = 40;
const BEAM_COLOUR = '#FFFFFF';

/** One band of the sweep: how far off the centre line, how thick, how bright. */
type BeamBand = { offset: number; thickness: number; alpha: number };

/** The two-band sweep the folder facade wears, at the folder's own angle. */
const FOLDER_BEAM: readonly BeamBand[] = [
  { offset: -9.8, thickness: 6.6, alpha: 0.2 },
  { offset: -1.5, thickness: 2.4, alpha: 0.13 },
];
const FOLDER_OPEN_BEAM: readonly BeamBand[] = [
  { offset: -9.8, thickness: 6, alpha: 0.2 },
  { offset: -1.5, thickness: 2.2, alpha: 0.13 },
];

/**
 * The beam pair, clipped to whichever face it falls on.
 *
 * The bands are authored horizontal and long enough to overrun the canvas in
 * both directions, then rotated as a pair — so the angle is stated once, as a
 * number, rather than implied by four corner coordinates that have to be
 * re-derived by hand every time it changes.
 */
/**
 * The sweep, clipped to whatever it is falling on.
 *
 * `surface` is clip CONTENT rather than path data, because the two surfaces in
 * the set are not the same kind of thing: a folder facade is one path, and a
 * lettered icon is its letters plus the rule under them. Clipping to a <text>
 * element is what puts the light on the letterforms themselves rather than on a
 * rectangle around them.
 */
function lightBeam(
  surface: string,
  centreX: number,
  centreY: number,
  angle: number,
  bands: readonly BeamBand[]
): string {
  /*
   * The clip is on the OUTER group and the rotation on an inner one, which is
   * not a detail: an element's own transform applies to the clip path it
   * references as well as to its contents, so rotating and clipping on the same
   * group turns the folder-shaped clip 40 degrees too, and the beam spills out
   * past the panel as a grey wedge where the folder is not.
   */
  const band = ({ offset, thickness, alpha }: BeamBand): string =>
    `<rect x="${roundToThousandths(centreX - 26)}" y="${roundToThousandths(centreY + offset)}" ` +
    `width="52" height="${roundToThousandths(thickness)}" fill="${BEAM_COLOUR}" opacity="${alpha}"/>`;
  return (
    `<clipPath id="${BEAM_CLIP_ID}">${surface}</clipPath>` +
    `<g clip-path="url(#${BEAM_CLIP_ID})">` +
    `<g transform="rotate(-${angle} ${roundToThousandths(centreX)} ${roundToThousandths(centreY)})">` +
    bands.map(band).join('') +
    `</g></g>`
  );
}

function renderFolderPictogram(spec: Partial<FolderSpec>, isOpen: boolean, ink: InkPalette): string {
  const at = isOpen ? FOLDER_PICTOGRAM_PLACEMENT.open : FOLDER_PICTOGRAM_PLACEMENT.closed;
  const [kind, name, body] = spec.mark
    ? (['mark', spec.mark, marks[spec.mark].draw(ink)] as const)
    : spec.glyph
      ? (['glyph', spec.glyph, glyphs[spec.glyph](ink)] as const)
      : ([null, null, ''] as const);
  if (!kind) return '';
  return `<g transform="${opticalTransform(`${kind}:${name}`, at.cx, at.cy, at.size).transform}">${body}</g>`;
}

/* -------------------------------------------------------------- *
 * Variant: classic — flat, official colour, with a shadow
 * -------------------------------------------------------------- *
 *
 * The shadow is what keeps a flat icon from looking like a sticker on this
 * theme, and it cannot be black: the ground is #040208, so a black shadow is
 * not a shadow, it is nothing. Each icon casts its own colour, taken down by
 * palette.ts -> castShadow. One soft offset pass, no spread.
 *
 * M10 made it smaller, calmer and darker. It used to fall 0.9 x 1.3 units with
 * a 0.55 blur — at 16px a band most of a pixel wide under every icon — in a
 * colour MORE saturated than the ink that cast it. On a solid mark that read as
 * a second, dirtier edge; on line art it was worse, because a shadow as thick
 * as the stroke fills the gaps between strokes, and the Laravel cube and the
 * Figma blobs came out as a red and an orange smear. The audit measured shadow
 * area at up to 1.8 times the ink's own.
 *
 * And line art casts none. Below LINE_ART_STROKE the mean stroke is under a
 * pixel at 16px, and a shadow on a hairline is not relief, it is a second
 * hairline drawn slightly out of register.
 */

const DROP_SHADOW_FILTER_ID = 'sh';
const DROP_SHADOW = { dx: 0.5, dy: 0.75, blur: 0.35 };
/** Placed mean stroke, in canvas units, below which artwork counts as line art. */
const LINE_ART_STROKE = 1.6;

const dropShadowFilter = (colour: Colour): string =>
  `<defs><filter id="${DROP_SHADOW_FILTER_ID}" x="-25%" y="-25%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
  `<feDropShadow dx="${DROP_SHADOW.dx}" dy="${DROP_SHADOW.dy}" stdDeviation="${DROP_SHADOW.blur}" flood-color="${colour}" flood-opacity="1"/>` +
  `</filter></defs>`;

const withDropShadow = (body: string): string => `<g filter="url(#${DROP_SHADOW_FILTER_ID})">${body}</g>`;

/** Whether a spec's artwork, once placed, is drawn in strokes thinner than LINE_ART_STROKE. */
const isLineArt = (spec: FileSpec): boolean => {
  const artworkKey: string | null = spec.mark ? `mark:${spec.mark}` : spec.glyph ? `glyph:${spec.glyph}` : null;
  if (!artworkKey) return false;
  const size: number = spec.scale ? ARTWORK_SIZE * spec.scale : ARTWORK_SIZE;
  return placedStroke(artworkKey, opticalTransform(artworkKey, ARTWORK_CENTRE_X, ARTWORK_CENTRE_Y, size).scale) < LINE_ART_STROKE;
};

/** The artwork, with the shadow its identity colour casts — or bare, if it is line art. */
const shadowed = (body: string, identity: Colour, stroke: number): string =>
  stroke < LINE_ART_STROKE ? `<g>${body}</g>` : dropShadowFilter(castShadow(identity)) + withDropShadow(body);

/* -------------------------------------------------------------- *
 * Lettered icons: the rule under the letters
 * -------------------------------------------------------------- *
 *
 * A format with no logo and no pictogram is set as bare letters — PDF, ASM,
 * INI, BAT, TCL. Which left them as the only icons in the set with no OBJECT in
 * them: every other icon is a thing, and these were three characters floating
 * in the middle of an empty box, reading as a label for an icon that had failed
 * to load.
 *
 * V4 gives them a rule underneath, in the icon's own colour, and sweeps the
 * same hard-edged light that crosses a folder's facade across the whole thing —
 * the letterforms and the rule together, at 45 degrees rather than the folder's
 * 40, because the composition is wider than it is tall and a shallower angle
 * would have the beam run along the rule instead of across it.
 *
 * The light falls on the LETTERS, not on a box around them: the clip holds the
 * <text> element itself, so the beam lands on the strokes of the P and the D and
 * nowhere in the counters. That is the whole point of doing it this way — a
 * lettered icon now belongs to the same set as a folder, lit by the same source,
 * rather than reading as a label for an icon that failed to load.
 */

const LETTERING_RULE = {
  /** Clear air between the bottom of the ink and the top of the rule. */
  gap: 2.2,
  thickness: 2.9,
  /** The rule is at least this wide, so "P" does not get a stub. */
  minWidth: 10.4,
  /** And never wider than the letters plus this much on each side. */
  overhang: 0.9,
};

const LETTERING_BEAM_ANGLE = 45;
/*
 * Wider bands than the folder's, and not because the icon is bigger. The beam
 * crosses a run of letterforms here, so most of what it passes over is the gaps
 * BETWEEN strokes; a band narrow enough to look right on a solid panel catches
 * two stems out of six and reads as a scratch rather than as light.
 */
const LETTERING_BEAM: readonly BeamBand[] = [
  { offset: -8.4, thickness: 6.2, alpha: 0.24 },
  { offset: -0.6, thickness: 2.2, alpha: 0.15 },
];

/** The rule under a lettered icon, and the light that crosses letters and rule. */
function letteringRule(lettering: PlacedLettering, fill: Colour): { bar: string; beam: string } {
  const width = Math.min(
    ARTWORK_SIZE,
    Math.max(LETTERING_RULE.minWidth, lettering.inkWidth + LETTERING_RULE.overhang * 2)
  );
  const x = ARTWORK_CENTRE_X - width / 2;
  const y = lettering.inkCentreY + lettering.inkHeight / 2 + LETTERING_RULE.gap;
  const radius = LETTERING_RULE.thickness / 2;
  const data = roundedRectanglePath(x, y, width, LETTERING_RULE.thickness, radius);
  return {
    bar: filledPath(data, fill),
    beam: lightBeam(
      lettering.body + `<path d="${data}"/>`,
      ARTWORK_CENTRE_X,
      // The centre of the composition, letters and rule together, so the sweep
      // is not weighted toward one end of it.
      (lettering.inkCentreY - lettering.inkHeight / 2 + y + LETTERING_RULE.thickness) / 2,
      LETTERING_BEAM_ANGLE,
      LETTERING_BEAM
    ),
  };
}

function renderClassicFileIcon(spec: FileSpec): string {
  const minimumContrast: number | undefined = isLineArt(spec) ? LINE_ART_CONTRAST : undefined;
  const ink = officialPaletteFor(spec).map((colour: Colour): Colour => readableOnGround(colour, minimumContrast));
  const artwork = renderArtwork(spec, ink);
  let body = artwork.body;
  let beam = '';
  if (spec.text) {
    /*
     * Only BARE lettering gets a rule. The Office tiles and the npm rectangle
     * also set text, but theirs sits on a mark that is already an object, and
     * underlining the W in Word would be underlining the logo.
     */
    const isBareLettering = !spec.mark;
    const lettering = renderLettering(spec.text, spec.textFill || ink[0], {
      ...spec,
      reserve: isBareLettering ? LETTERING_RULE.gap + LETTERING_RULE.thickness : 0,
    });
    body += lettering.body;
    if (isBareLettering) {
      const rule = letteringRule(lettering, ink[0]);
      body += rule.bar;
      beam = rule.beam;
    }
  }
  return svgDocument(shadowed(body, ink[0], artwork.stroke) + beam);
}

function renderClassicFolderIcon(spec: Partial<FolderSpec>, isOpen: boolean): string {
  const accent = readableOnGround(spec.accent || FOLDER);
  /*
   * The pictogram is not a second colour: it is the folder's own accent taken
   * down until it reads as sunk into the facade rather than laid on top of it.
   * Its duotone goes DOWN from there rather than up — the lighter tint a file
   * icon uses would climb back toward the panel it is meant to be cut into.
   */
  const sunk: InkPalette = [darkened(accent, 0.72), darkened(accent, 0.52)];
  const at = isOpen ? FOLDER_PICTOGRAM_PLACEMENT.open : FOLDER_PICTOGRAM_PLACEMENT.closed;
  const face = isOpen
    ? `<path d="${FOLDER_OPEN_BACK}" fill="${darkened(accent, 0.56)}"/><path d="${FOLDER_OPEN_FRONT}" fill="${accent}"/>`
    : `<path d="${FOLDER_FACADE}" fill="${accent}"/>`;
  const beam = isOpen
    ? lightBeam(`<path d="${FOLDER_OPEN_FRONT}"/>`, at.cx, at.cy, BEAM_ANGLE, FOLDER_OPEN_BEAM)
    : lightBeam(`<path d="${FOLDER_FACADE}"/>`, at.cx, at.cy, BEAM_ANGLE, FOLDER_BEAM);
  return svgDocument(shadowed(face + renderFolderPictogram(spec, isOpen, sunk), accent, Infinity) + beam);
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

const drawnGlyphs = [...Object.values(fileIcons), ...Object.values(folderIcons)]
  .map((spec: FileSpec | FolderSpec) => spec.glyph)
  .filter((name): name is GlyphName => name !== undefined);
const unusedGlyphs = unusedPictograms(drawnGlyphs);
if (unusedGlyphs.length) console.warn(`note: imported but unused pictograms: ${unusedGlyphs.join(', ')}`);
