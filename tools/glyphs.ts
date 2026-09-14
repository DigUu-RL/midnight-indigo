/*
 * The pictogram library — the shapes that say what a file DOES, as opposed to
 * which project owns it. Language and tool logos live in tools/marks.ts.
 *
 * Where the shapes come from
 * --------------------------
 * Every pictogram is imported artwork, from tools/pictogram-paths.ts, which
 * tools/import-pictograms.ts writes out of Iconify. Until V3 they were drawn
 * here by hand, and the V3 header defended that at length: rounded polygons,
 * capsules, no bare vertices, a duotone rule. The rules were right and the
 * drawings were still the weakest part of the set — the flask, the clipboard
 * and the terminal were three sketches by one person, sitting beside a hundred
 * and forty logos drawn by the designers whose job that was. V4 keeps the rules
 * and hands the drawing to a set that already follows them.
 *
 * What this module does with that artwork is the whole of its job:
 *
 *   THE BOX. Upstream is drawn on its own grid (256 for Phosphor). Everything
 *   here is scaled into the 24-unit box centred on the origin — coordinates
 *   from -12 to 12 — so the build can drop any pictogram into any container
 *   with one translate/scale, exactly as it does with a mark.
 *
 *   THE DUOTONE. A pictogram is handed two colours: `ink`, the icon's identity
 *   colour, and `tint`, a lighter tone of the same hue derived in
 *   tools/palette.ts. Upstream expresses that split as one colour at two
 *   opacities; the import resolved it into slots, because this set paints on
 *   #040208, where a 20% shape is not a lighter shape, it is the ground.
 *
 *     The tint is the SURFACE — the glass of the flask, the page of the
 *     document, the body of the disc. The ink is what is ON that surface.
 *
 *   THE FALLBACK. A pictogram painted with a single colour (a folder pictogram
 *   sunk into its body, a measuring pass) gets slot 0 for both, so nothing has
 *   to special-case a palette of one.
 */

import { pictogramPaths, type PictogramArt } from './pictogram-paths.ts';
import { filledPath, type Colour, type InkPalette } from './shapes.ts';

export type { Colour, InkPalette } from './shapes.ts';

/** Draws one pictogram from its two tones. */
export type Pictogram = (palette: InkPalette) => string;

/** The glyph box: 24 units, centred on the origin. */
const GLYPH_BOX = 24;

const roundToHundredThousandths = (v: number): number => Number(v.toFixed(5));

/**
 * Turns one piece of imported artwork into a pictogram.
 *
 * The scale and the half-box shift are the same correction `imported()` in
 * tools/marks.ts applies, for the same reason: upstream draws from a top-left
 * origin in its own box, and this set draws from the centre in ours. Anything
 * beyond that — artwork that is off-centre inside its own box, or overruns it —
 * is corrected later from the measured ink, by tools/measure.ts and
 * `placeArtwork()` in build-icons.ts.
 */
function imported(art: PictogramArt): Pictogram {
  const scale = roundToHundredThousandths(GLYPH_BOX / art.box);
  return (palette) => {
    const paint = (slot: number): Colour => palette[slot] ?? palette[0];
    const body = art.parts.map((p) => filledPath(p.d, paint(p.c), p.evenOdd === true)).join('');
    return `<g transform="translate(-12 -12) scale(${scale})">${body}</g>`;
  };
}

/*
 * The library. Every entry is one line because every entry is the same
 * decision made once, upstream: WHICH drawing means this, and that decision is
 * recorded next to the icon id in tools/import-pictograms.ts, where changing it
 * means changing the artwork rather than editing a path by hand.
 */
export const glyphs = Object.fromEntries(
  Object.entries(pictogramPaths).map(([name, art]) => [name, imported(art)])
) as Record<keyof typeof pictogramPaths, Pictogram>;

export type GlyphName = keyof typeof glyphs;

/**
 * Pictograms nothing draws — dead weight in tools/pictogram-paths.ts, measured
 * on every run and shipped to nobody. The same question tools/marks.ts asks
 * about imported logos, and it needs asking here for the same reason: an
 * imported library grows by adding a line, so the only thing that keeps it from
 * silently filling up with shapes the set decided against is being told. The
 * build prints it.
 */
export const unusedPictograms = (names: Iterable<GlyphName>): GlyphName[] => {
  const used = new Set(names);
  return (Object.keys(glyphs) as GlyphName[]).filter((n) => !used.has(n));
};
