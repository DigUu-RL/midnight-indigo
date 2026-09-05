/*
 * The drawing primitives every hand-authored shape in the set is built from —
 * shared by tools/glyphs.ts (our pictograms) and tools/marks.ts (the language
 * marks that have no upstream SVG to import).
 *
 * Two rules the whole set depends on:
 *
 *   STROKES ARE FOR STROKE-SHAPED THINGS ONLY. Almost everything is a filled
 *   shape. V1 banned strokes outright because folder overlays drew each glyph
 *   twice — once fattened by a stroke, to punch a halo out of the folder — and
 *   a glyph that set its own stroke broke that. V2 has no halo, so `stroked()`
 *   exists for the handful of glyphs that genuinely ARE a stroke: a curly
 *   brace, a chevron. Building those out of filled outlines is what made V1's
 *   braces read as an hourglass. Everything else stays filled.
 *
 *   HOLES ARE HOLES. V1 painted them with a knock-out colour — the tile fill —
 *   which only worked because every glyph sat on a tile of known colour. V2 has
 *   no tile: artwork is painted straight onto whatever the file explorer is
 *   showing, which changes on hover and on selection. So a hole is cut with
 *   fill-rule="evenodd" and is genuinely transparent. The catch is that evenodd
 *   is a parity rule: two holes that OVERLAP cancel, and the overlap fills back
 *   in. `cut()` takes a base and its holes; keep the holes disjoint.
 *
 * Everything is expressed as path DATA rather than as <rect>/<circle> elements,
 * because a hole has to be a sub-path of the shape it is cut from.
 */

/** A colour, written as a hex literal. */
export type Colour = string;

/** The resolved palette for one icon: index 0 is the primary colour. */
export type Ink = readonly Colour[];

export const n = (v: number): number => Number(v.toFixed(2));

/* ---------------- path data ---------------- */

/** Sharp-cornered rectangle. */
export const rectD = (x: number, y: number, w: number, h: number): string =>
  `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;

/** Rounded rectangle, as one sub-path. */
export const rrD = (x: number, y: number, w: number, h: number, rx: number): string => {
  const r = Math.min(rx, w / 2, h / 2);
  if (r <= 0) return rectD(x, y, w, h);
  return (
    `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)}` +
    `V${n(y + h - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(y + h)}` +
    `H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y + h - r)}` +
    `V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)}Z`
  );
};

export const circD = (cx: number, cy: number, r: number): string =>
  `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;

export const ellD = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0Z`;

export const polyD = (pts: readonly (readonly [number, number])[]): string =>
  `M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}Z`;

/**
 * A capsule between two points: the set's basic stroke. The round caps are part
 * of the path rather than circles laid over a rectangle, because a hole has to
 * be a single sub-path — two overlapping sub-paths would cancel under evenodd.
 */
export const capD = (x1: number, y1: number, x2: number, y2: number, w: number): string => {
  const r = w / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1e-6;
  const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
  const [px, py] = [-uy * r, ux * r];
  return (
    `M${n(x1 + px)} ${n(y1 + py)}L${n(x2 + px)} ${n(y2 + py)}` +
    `A${n(r)} ${n(r)} 0 0 0 ${n(x2 - px)} ${n(y2 - py)}` +
    `L${n(x1 - px)} ${n(y1 - py)}` +
    `A${n(r)} ${n(r)} 0 0 0 ${n(x1 + px)} ${n(y1 + py)}Z`
  );
};

/* ---------------- elements ---------------- */

export const path = (d: string, fill: Colour, evenodd = false): string =>
  `<path d="${d}"${evenodd ? ' fill-rule="evenodd"' : ''} fill="${fill}"/>`;

/**
 * A centre line drawn as a stroke, with round caps and joins. For the glyphs
 * that are a stroke rather than a shape — see the note at the top of the file.
 * The width scales with the glyph, which is what keeps a brace the same weight
 * on a file icon and on a folder.
 */
export const stroked = (d: string, colour: Colour, w: number): string =>
  `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** A shape with holes punched clean through it. Holes must not overlap. */
export const cut = (fill: Colour, base: string, ...holes: string[]): string =>
  path(base + holes.join(''), fill, true);

export const R = (x: number, y: number, w: number, h: number, rx: number, f: Colour): string =>
  path(rrD(x, y, w, h, rx), f);

export const C = (cx: number, cy: number, r: number, f: Colour): string => path(circD(cx, cy, r), f);

export const E = (cx: number, cy: number, rx: number, ry: number, f: Colour): string =>
  path(ellD(cx, cy, rx, ry), f);

export const G = (pts: readonly (readonly [number, number])[], f: Colour): string =>
  path(polyD(pts), f);

export const bar = (x1: number, y1: number, x2: number, y2: number, w: number, f: Colour): string =>
  path(capD(x1, y1, x2, y2, w), f);

export const rot = (deg: number, body: string): string =>
  `<g transform="rotate(${n(deg)})">${body}</g>`;

/**
 * Horizontal mirror. For a shape whose two halves face each other — a brace
 * pair, a bracket pair — writing the second half by hand is what lets the two
 * drift apart; deriving it guarantees they cannot.
 */
export const mir = (body: string): string => `<g transform="scale(-1 1)">${body}</g>`;

/** Ring: a disc with a concentric hole. */
export const ring = (cx: number, cy: number, r: number, t: number, f: Colour): string =>
  cut(f, circD(cx, cy, r), circD(cx, cy, r - t));

/** Elliptical ring. */
export const ringE = (cx: number, cy: number, rx: number, ry: number, t: number, f: Colour): string =>
  cut(f, ellD(cx, cy, rx, ry), ellD(cx, cy, rx - t, ry - t));

/** Rounded-rectangle frame. */
export const frame = (
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  t: number,
  f: Colour
): string => cut(f, rrD(x, y, w, h, rx), rrD(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(0.5, rx - t)));
