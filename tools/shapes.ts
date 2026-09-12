/*
 * The drawing primitives every hand-authored shape in the set is built from —
 * shared by tools/glyphs.ts (our pictograms) and tools/marks.ts (the language
 * marks that have no upstream SVG to import).
 *
 * Three rules the whole set depends on:
 *
 *   STROKES ARE FOR STROKE-SHAPED THINGS ONLY. Almost everything is a filled
 *   shape. V1 banned strokes outright because folder overlays drew each glyph
 *   twice — once fattened by a stroke, to punch a halo out of the folder — and
 *   a glyph that set its own stroke broke that. V2 has no halo, so
 *   `strokedPath()` exists for the handful of glyphs that genuinely ARE a
 *   stroke: a curly brace, a chevron. Building those out of filled outlines is
 *   what made V1's braces read as an hourglass. Everything else stays filled.
 *
 *   HOLES ARE HOLES. V1 painted them with a knock-out colour — the tile fill —
 *   which only worked because every glyph sat on a tile of known colour. V2 has
 *   no tile: artwork is painted straight onto whatever the file explorer is
 *   showing, which changes on hover and on selection. So a hole is cut with
 *   fill-rule="evenodd" and is genuinely transparent. The catch is that evenodd
 *   is a parity rule: two holes that OVERLAP cancel, and the overlap fills back
 *   in. `pathWithHoles()` takes a base and its holes; keep the holes disjoint.
 *
 *   NOTHING OURS COMES TO A POINT. Every polygon in the pictogram library goes
 *   through `roundedPolygonPath()`, every straight run of ink is a `capsule()`,
 *   and every arc is a `strokedPath()` with round caps and joins. Between those
 *   three there is no way to draw a bare vertex by accident, which is the only
 *   way a rule like that survives contact with seventy-odd glyphs.
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

/**
 * A polygon with every corner rounded off to `cornerRadius` — the primitive the
 * whole pictogram library is built on.
 *
 * V2's glyphs were polygons with bare vertices, and the set paid for it in the
 * places a corner is the whole shape: the star's five needles, the play
 * triangle's spike, the arrowheads on the route and flow charts, the apex of
 * the letter A. Next to marks that are nearly all curves — the Python snakes,
 * the Go wordmark, the Docker whale — those points read as a different set of
 * icons that had wandered in. At 16px they did not even read as sharp: a bare
 * vertex aliases into a grey fringe, so they read as dirty.
 *
 * Rounding them by hand is not an option at this count, and it is not a thing
 * that stays done: every edit to a polygon would have to re-derive its corner
 * arcs. So the corner is computed. For each vertex the two adjacent edges give
 * a tangent length `t = radius / tan(interiorAngle / 2)`, the arc runs between
 * the two points at distance `t` along those edges, and the sweep comes from
 * the sign of the cross product — so one call is correct for a convex hull, a
 * reflex notch and a star's inner vertices alike.
 *
 * `t` is clamped to half of the shorter edge, and the radius recomputed from
 * whatever `t` survived, so a corner between two short edges rounds as far as
 * it can instead of overshooting into its neighbour and turning the path inside
 * out. That clamp is why a caller can ask for one radius across a whole shape
 * and let the tight corners take what they can.
 */
export const roundedPolygonPath = (points: readonly Point[], cornerRadius: number): string => {
  const count = points.length;
  if (count < 3 || cornerRadius <= 0) return polygonPath(points);

  type RoundedCorner = {
    arcStart: Point;
    arcEnd: Point;
    radius: number;
    sweep: 0 | 1;
    collinear: boolean;
  };

  const corners: RoundedCorner[] = [];

  for (let index = 0; index < count; index++) {
    const [previousX, previousY] = points[(index - 1 + count) % count];
    const [cornerX, cornerY] = points[index];
    const [nextX, nextY] = points[(index + 1) % count];

    const towardPrevious = [previousX - cornerX, previousY - cornerY];
    const towardNext = [nextX - cornerX, nextY - cornerY];
    const lengthToPrevious = Math.hypot(towardPrevious[0], towardPrevious[1]) || 1e-9;
    const lengthToNext = Math.hypot(towardNext[0], towardNext[1]) || 1e-9;
    const [unitPreviousX, unitPreviousY] = [
      towardPrevious[0] / lengthToPrevious,
      towardPrevious[1] / lengthToPrevious,
    ];
    const [unitNextX, unitNextY] = [towardNext[0] / lengthToNext, towardNext[1] / lengthToNext];

    const interiorAngle = Math.acos(
      Math.max(-1, Math.min(1, unitPreviousX * unitNextX + unitPreviousY * unitNextY))
    );

    // Collinear: nothing to round, and tan(angle / 2) would blow up.
    if (interiorAngle > Math.PI - 1e-6 || interiorAngle < 1e-6) {
      corners.push({
        arcStart: [cornerX, cornerY],
        arcEnd: [cornerX, cornerY],
        radius: 0,
        sweep: 0,
        collinear: true,
      });
      continue;
    }

    const tangentOfHalfAngle = Math.tan(interiorAngle / 2);
    const tangentLength = Math.min(
      cornerRadius / tangentOfHalfAngle,
      lengthToPrevious / 2,
      lengthToNext / 2
    );

    corners.push({
      arcStart: [cornerX + unitPreviousX * tangentLength, cornerY + unitPreviousY * tangentLength],
      arcEnd: [cornerX + unitNextX * tangentLength, cornerY + unitNextY * tangentLength],
      radius: tangentLength * tangentOfHalfAngle,
      // Which way the corner turns decides the arc's direction.
      sweep: unitPreviousX * unitNextY - unitPreviousY * unitNextX < 0 ? 1 : 0,
      collinear: false,
    });
  }

  const at = roundCoordinate;
  let data = `M${at(corners[0].arcStart[0])} ${at(corners[0].arcStart[1])}`;
  for (let index = 0; index < count; index++) {
    const corner = corners[index];
    if (index > 0) data += `L${at(corner.arcStart[0])} ${at(corner.arcStart[1])}`;
    if (!corner.collinear) {
      data +=
        `A${at(corner.radius)} ${at(corner.radius)} 0 0 ${corner.sweep} ` +
        `${at(corner.arcEnd[0])} ${at(corner.arcEnd[1])}`;
    }
  }
  return data + 'Z';
};

/**
 * A regular star, already rounded. `pointCount` needles alternating between the
 * outer and inner radius, with the first needle pointing straight up.
 *
 * `verticalSquash` flattens it, which the medal seal wants and the icon star
 * does not.
 */
export const starPath = (
  centreX: number,
  centreY: number,
  outerRadius: number,
  innerRadius: number,
  pointCount: number,
  cornerRadius: number,
  verticalSquash = 1
): string => {
  const vertices: Point[] = [];
  for (let index = 0; index < pointCount * 2; index++) {
    const angle = (Math.PI / pointCount) * index - Math.PI / 2;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    vertices.push([
      centreX + Math.cos(angle) * radius,
      centreY + Math.sin(angle) * radius * verticalSquash,
    ]);
  }
  return roundedPolygonPath(vertices, cornerRadius);
};

/**
 * A capsule between two points: the set's basic stroke of ink. The round caps
 * are part of the path rather than circles laid over a rectangle, because a
 * hole has to be a single sub-path — two overlapping sub-paths would cancel
 * under evenodd.
 */
export const capsulePath = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  width: number
): string => {
  const radius = width / 2;
  const length = Math.hypot(toX - fromX, toY - fromY) || 1e-6;
  const [alongX, alongY] = [(toX - fromX) / length, (toY - fromY) / length];
  const [acrossX, acrossY] = [-alongY * radius, alongX * radius];
  const at = roundCoordinate;
  return (
    `M${at(fromX + acrossX)} ${at(fromY + acrossY)}L${at(toX + acrossX)} ${at(toY + acrossY)}` +
    `A${at(radius)} ${at(radius)} 0 0 0 ${at(toX - acrossX)} ${at(toY - acrossY)}` +
    `L${at(fromX - acrossX)} ${at(fromY - acrossY)}` +
    `A${at(radius)} ${at(radius)} 0 0 0 ${at(fromX + acrossX)} ${at(fromY + acrossY)}Z`
  );
};

/* ---------------- elements ---------------- */

export const filledPath = (data: string, fill: Colour, useEvenOddRule = false): string =>
  `<path d="${data}"${useEvenOddRule ? ' fill-rule="evenodd"' : ''} fill="${fill}"/>`;

/**
 * A centre line drawn as a stroke, with round caps and joins. For the glyphs
 * that are a stroke rather than a shape — see the note at the top of the file.
 * The width scales with the glyph, which is what keeps a brace the same weight
 * on a file icon and on a folder.
 */
export const strokedPath = (data: string, colour: Colour, width: number): string =>
  `<path d="${data}" fill="none" stroke="${colour}" stroke-width="${roundCoordinate(width)}" ` +
  `stroke-linecap="round" stroke-linejoin="round"/>`;

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

export const ellipse = (
  centreX: number,
  centreY: number,
  radiusX: number,
  radiusY: number,
  fill: Colour
): string => filledPath(ellipsePath(centreX, centreY, radiusX, radiusY), fill);

export const polygon = (points: readonly Point[], fill: Colour): string =>
  filledPath(polygonPath(points), fill);

/** A rounded polygon. The pictograms' workhorse — see `roundedPolygonPath`. */
export const roundedPolygon = (
  points: readonly Point[],
  cornerRadius: number,
  fill: Colour
): string => filledPath(roundedPolygonPath(points, cornerRadius), fill);

/** A rounded star. */
export const star = (
  centreX: number,
  centreY: number,
  outerRadius: number,
  innerRadius: number,
  pointCount: number,
  cornerRadius: number,
  fill: Colour,
  verticalSquash = 1
): string =>
  filledPath(
    starPath(centreX, centreY, outerRadius, innerRadius, pointCount, cornerRadius, verticalSquash),
    fill
  );

/** A capsule of ink between two points. */
export const capsule = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  width: number,
  fill: Colour
): string => filledPath(capsulePath(fromX, fromY, toX, toY, width), fill);

export const rotated = (degrees: number, body: string): string =>
  `<g transform="rotate(${roundCoordinate(degrees)})">${body}</g>`;

/**
 * Horizontal mirror. For a shape whose two halves face each other — a brace
 * pair, a bracket pair — writing the second half by hand is what lets the two
 * drift apart; deriving it guarantees they cannot.
 */
export const mirroredHorizontally = (body: string): string =>
  `<g transform="scale(-1 1)">${body}</g>`;

/** Ring: a disc with a concentric hole. */
export const ring = (
  centreX: number,
  centreY: number,
  radius: number,
  thickness: number,
  fill: Colour
): string =>
  pathWithHoles(
    fill,
    circlePath(centreX, centreY, radius),
    circlePath(centreX, centreY, radius - thickness)
  );

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

/** Rounded-rectangle frame. */
export const roundedFrame = (
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number,
  thickness: number,
  fill: Colour
): string =>
  pathWithHoles(
    fill,
    roundedRectanglePath(x, y, width, height, cornerRadius),
    roundedRectanglePath(
      x + thickness,
      y + thickness,
      width - 2 * thickness,
      height - 2 * thickness,
      Math.max(0.5, cornerRadius - thickness)
    )
  );
