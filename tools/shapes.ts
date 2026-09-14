/*
 * The drawing primitives the hand-authored artwork in the set is built from.
 *
 * There is one consumer left: tools/marks.ts, for the dozen logos with no
 * upstream SVG worth importing — Microsoft's, which are not redistributable,
 * and the handful whose official file is a gradient or a wordmark. Everything
 * else in the set is imported geometry now, so this module is a good deal
 * smaller than it was: V4 moved the pictograms to Iconify (see
 * tools/import-pictograms.ts) and took the primitives that existed only to draw
 * them out with them — the rounded polygon, the star, the capsule, the stroked
 * centre line, the mirror. They are in the history if a hand-drawn mark ever
 * needs one back.
 *
 * Two rules the set still depends on:
 *
 *   HOLES ARE HOLES. V1 painted them with a knock-out colour — the tile fill —
 *   which only worked because every glyph sat on a tile of known colour. V2
 *   dropped the tile: artwork is painted straight onto whatever the file
 *   explorer is showing, which changes on hover and on selection. So a hole is
 *   cut with fill-rule="evenodd" and is genuinely transparent. The catch is that
 *   evenodd is a parity rule: two holes that OVERLAP cancel, and the overlap
 *   fills back in. `pathWithHoles()` takes a base and its holes; keep them
 *   disjoint.
 *
 *   NOTHING OURS COMES TO A POINT — except where the point belongs to a logo.
 *   The imported pictograms are drawn with round caps and joins upstream, which
 *   is half of why that family was chosen; what is drawn here is brand geometry,
 *   where the corners are not ours to soften.
 *
 * Everything is expressed as path DATA rather than as <rect>/<circle> elements,
 * because a hole has to be a sub-path of the shape it is cut from. The
 * functions ending in `Path` return that data; the ones that do not return a
 * finished SVG element.
 */

/** A colour, written as a hex literal. */
export type Colour = string;

/**
 * The resolved palette for one icon. Index 0 is the identity colour and index 1
 * the lighter tint derived from it; a mark with more than two official colours
 * fills further slots in its own order.
 */
export type InkPalette = readonly Colour[];

/** Path data is emitted at two decimals — finer than any renderer resolves. */
export const roundCoordinate = (value: number): number => Number(value.toFixed(2));

/* ---------------- path data ---------------- */

/** Sharp-cornered rectangle. */
export const rectanglePath = (x: number, y: number, width: number, height: number): string =>
  `M${roundCoordinate(x)} ${roundCoordinate(y)}H${roundCoordinate(x + width)}` +
  `V${roundCoordinate(y + height)}H${roundCoordinate(x)}Z`;

/** Rounded rectangle, as one sub-path. */
export const roundedRectanglePath = (
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number
): string => {
  const radius = Math.min(cornerRadius, width / 2, height / 2);
  if (radius <= 0) return rectanglePath(x, y, width, height);
  const at = roundCoordinate;
  return (
    `M${at(x + radius)} ${at(y)}H${at(x + width - radius)}` +
    `A${at(radius)} ${at(radius)} 0 0 1 ${at(x + width)} ${at(y + radius)}` +
    `V${at(y + height - radius)}` +
    `A${at(radius)} ${at(radius)} 0 0 1 ${at(x + width - radius)} ${at(y + height)}` +
    `H${at(x + radius)}A${at(radius)} ${at(radius)} 0 0 1 ${at(x)} ${at(y + height - radius)}` +
    `V${at(y + radius)}A${at(radius)} ${at(radius)} 0 0 1 ${at(x + radius)} ${at(y)}Z`
  );
};

export const circlePath = (centreX: number, centreY: number, radius: number): string => {
  const at = roundCoordinate;
  return (
    `M${at(centreX - radius)} ${at(centreY)}` +
    `a${at(radius)} ${at(radius)} 0 1 0 ${at(2 * radius)} 0` +
    `a${at(radius)} ${at(radius)} 0 1 0 ${at(-2 * radius)} 0Z`
  );
};

export const ellipsePath = (
  centreX: number,
  centreY: number,
  radiusX: number,
  radiusY: number
): string => {
  const at = roundCoordinate;
  return (
    `M${at(centreX - radiusX)} ${at(centreY)}` +
    `a${at(radiusX)} ${at(radiusY)} 0 1 0 ${at(2 * radiusX)} 0` +
    `a${at(radiusX)} ${at(radiusY)} 0 1 0 ${at(-2 * radiusX)} 0Z`
  );
};

/** A point in the 24x24 glyph box, which runs from -12 to 12 on both axes. */
export type Point = readonly [number, number];

export const polygonPath = (points: readonly Point[]): string =>
  `M${points.map(([x, y]) => `${roundCoordinate(x)} ${roundCoordinate(y)}`).join('L')}Z`;

/* ---------------- elements ---------------- */

export const filledPath = (data: string, fill: Colour, useEvenOddRule = false): string =>
  `<path d="${data}"${useEvenOddRule ? ' fill-rule="evenodd"' : ''} fill="${fill}"/>`;

/** A shape with holes punched clean through it. Holes must not overlap. */
export const pathWithHoles = (fill: Colour, base: string, ...holes: string[]): string =>
  filledPath(base + holes.join(''), fill, true);

export const roundedRectangle = (
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number,
  fill: Colour
): string => filledPath(roundedRectanglePath(x, y, width, height, cornerRadius), fill);

export const circle = (centreX: number, centreY: number, radius: number, fill: Colour): string =>
  filledPath(circlePath(centreX, centreY, radius), fill);

export const polygon = (points: readonly Point[], fill: Colour): string =>
  filledPath(polygonPath(points), fill);

export const rotated = (degrees: number, body: string): string =>
  `<g transform="rotate(${roundCoordinate(degrees)})">${body}</g>`;

/** Elliptical ring. */
export const ellipticalRing = (
  centreX: number,
  centreY: number,
  radiusX: number,
  radiusY: number,
  thickness: number,
  fill: Colour
): string =>
  pathWithHoles(
    fill,
    ellipsePath(centreX, centreY, radiusX, radiusY),
    ellipsePath(centreX, centreY, radiusX - thickness, radiusY - thickness)
  );
