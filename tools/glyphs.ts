/*
 * Pictogram library for the Midnight Indigo icon set — the shapes that are ours
 * rather than a brand's. Language and tool marks live in tools/marks.ts, and
 * the drawing primitives both use live in tools/shapes.ts (which is also where
 * the stroke, hole and no-bare-vertex rules are written down).
 *
 * Every pictogram is drawn inside a 24x24 box centred on (0,0) — coordinates
 * run from -12 to 12 — so the build can drop any of them into any container
 * with a single translate/scale and it lands optically centred.
 *
 * DUOTONE
 * -------
 * A pictogram is handed two colours: `ink` is the icon's identity colour and
 * `tint` a lighter version of the same hue, derived in tools/palette.ts. Every
 * pictogram spends both, and which part gets which is the whole design:
 *
 *   The tint is the SURFACE — the glass of the flask, the page of the book, the
 *   screen of the terminal, the body of the eye. The ink is what is ON that
 *   surface: the liquid, the print, the prompt, the iris.
 *
 * That split is why these are not V1's shapes recoloured. A single flat
 * silhouette has to say everything with its outline, so it ends up as a cluster
 * of thin slots and knock-outs that close up at 16px. Two tones carry the
 * structure instead, and the outline can stay simple and heavy.
 *
 * NOTHING HERE COMES TO A POINT
 * -----------------------------
 * Every corner is rounded, and it holds because of how the shapes are built
 * rather than because anyone remembered: polygons go through
 * `roundedPolygonPath`, straight runs of ink are capsules, arcs are stroked
 * with round caps and joins. Nothing below reaches for a bare `polygon()`.
 *
 * It matters twice over. These sit beside imported logos that are nearly all
 * curves, so a needle-pointed star read as a different set of icons that had
 * wandered in; and at 16px a bare vertex aliases into a grey fringe, so the old
 * points did not read as sharp, they read as dirty. The only hard corners left
 * in the set belong to brand marks, where the geometry is not ours to soften.
 *
 * EVERY PICTOGRAM WAS REDRAWN FOR V3
 * ----------------------------------
 * Not only the pointed ones. Rounding the star and the play triangle fixed the
 * shapes that were obviously wrong and left a second, quieter problem: a third
 * of the library was bars. The plain-text icon was four capsules, the log icon
 * three dots beside three more capsules, the checklist three ticks beside three
 * more — and at a glance, in a file tree, that is the same icon three times.
 * They are objects now: a page with a dog-ear, a panel of timestamped rows, a
 * clipboard.
 *
 * The pass also caught pictograms that took the tint and never spent it.
 * `braces` was drawn entirely in the identity colour, which made it the one
 * shape in the library with no depth at all. If a pictogram is handed two tones
 * it uses both, and the rule above decides which gets which.
 */

import {
  capsule,
  circle,
  circlePath,
  ellipse,
  ellipsePath,
  mirroredHorizontally,
  pathWithHoles,
  filledPath,
  ring,
  rotated,
  roundedFrame,
  roundedPolygon,
  roundedPolygonPath,
  roundedRectangle,
  roundedRectanglePath,
  star,
  strokedPath,
  type Colour,
  type InkPalette,
} from './shapes.ts';

export type { Colour, InkPalette } from './shapes.ts';

/** Draws one pictogram from its two tones. */
export type Pictogram = (palette: InkPalette) => string;

/* ------------------------------------------------------------------ *
 * Shared geometry
 * ------------------------------------------------------------------ */

/*
 * The shield, as a rounded hexagon rather than a crest.
 *
 * Drawn the obvious way — two shoulders and a point at the bottom — it is the
 * pointiest thing in the set, and the point carries the silhouette so it cannot
 * simply be trimmed. As a rounded polygon the same six vertices give the same
 * shield with a soft chin, and the shoulders stop being corners.
 */
const shieldOutlinePath = roundedPolygonPath(
  [[-10.8, -8.4], [0, -11.9], [10.8, -8.4], [10.8, -1], [0, 12.1], [-10.8, -1]],
  3.2
);

/** The lit half of it, for the shields that want a form rather than a crest. */
const shieldHighlightPath = roundedPolygonPath(
  [[0, -8.6], [7.5, -6.2], [7.5, -1], [0, 8.8]],
  2.2
);

/*
 * One arm of the curly-brace pair, as the centre line of a stroke.
 *
 * The nose is at x 0 and the two terminals at x 6, so the arm opens to the
 * RIGHT and points LEFT — which is what makes it a `{` rather than a `(`. Both
 * halves are 5.4 units of straight stem between 3-unit corner arcs, measured
 * from the nose, so the arm is symmetric about y 0 by construction. V1 built
 * this as a filled outline written out by hand, and the two halves ended up
 * bowing the same way: the pair read as an hourglass rather than as braces.
 */
const braceArmPath = 'M6 -11.4a3 3 0 0 0-3 3v5.4a3 3 0 0 1-3 3a3 3 0 0 1 3 3v5.4a3 3 0 0 0 3 3';

/** A tick, as a stroke centre line. */
const tickMarkPath = (x: number, y: number, scale: number): string =>
  `M${x - 3.4 * scale} ${y}l${2.6 * scale} ${2.6 * scale}l${4.8 * scale} ${-5.4 * scale}`;

/*
 * The isometric solid, as one silhouette instead of three faces.
 *
 * Drawing a cube as a left face, a right face and a top means three polygons
 * that share edges, and rounding them individually pulls those shared edges
 * apart into hairline gaps that read at 16px as the icon failing to render. So
 * the body is the whole hexagon, rounded once, and the top face is laid over it
 * in the tint — which is what the duotone wanted anyway.
 */
const isometricSolidPath = (cornerRadius: number): string =>
  roundedPolygonPath(
    [[0, -11.6], [11.4, -5.9], [11.4, 5.9], [0, 11.6], [-11.4, 5.9], [-11.4, -5.9]],
    cornerRadius
  );

/** Its lit top face. */
const isometricTopFacePath = (cornerRadius: number): string =>
  roundedPolygonPath([[0, -11.4], [11.1, -5.8], [0, -0.2], [-11.1, -5.8]], cornerRadius);

/** A rounded arrowhead pointing along `degrees`, its tip `length` from (x, y). */
const arrowHeadPath = (
  x: number,
  y: number,
  degrees: number,
  length: number,
  halfWidth: number,
  cornerRadius = 0.9
): string => {
  const radians = (degrees * Math.PI) / 180;
  const [alongX, alongY] = [Math.cos(radians), Math.sin(radians)];
  const [acrossX, acrossY] = [-alongY, alongX];
  return roundedPolygonPath(
    [
      [x + alongX * length, y + alongY * length],
      [x - acrossX * halfWidth, y - acrossY * halfWidth],
      [x + acrossX * halfWidth, y + acrossY * halfWidth],
    ],
    cornerRadius
  );
};

/** A band with rounded top corners and a square foot, for headers. */
const headerBand = (
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number,
  fill: Colour
): string =>
  roundedRectangle(x, y, width, height, cornerRadius, fill) +
  roundedRectangle(x, y + height - cornerRadius - 0.1, width, cornerRadius + 0.1, 0, fill);

export const glyphs = {
  /* ---------------- documents and lists ---------------- */

  /*
   * A page with a dog-ear — plain text, and the icon every unrecognised file
   * falls back to. It was four capsules, which made it the same drawing as the
   * log and the checklist at a glance; giving it a sheet is what tells the
   * three apart in a file tree.
   */
  lines: ([ink, tint]) =>
    roundedPolygon([[-8.8, -11.6], [3, -11.6], [9.2, -5.4], [9.2, 11.6], [-8.8, 11.6]], 2.4, tint) +
    roundedPolygon([[2.6, -11.4], [9, -5], [2.6, -5]], 1.4, ink) +
    capsule(-5.4, -0.6, 5.8, -0.6, 2.4, ink) +
    capsule(-5.4, 4.4, 5.8, 4.4, 2.4, ink) +
    capsule(-5.4, 9.2, 1.4, 9.2, 2.4, ink),

  // A console panel of timestamped rows — logs. The panel is what separates it
  // from the plain page; the dots are the timestamps.
  logLines: ([ink, tint]) =>
    roundedRectangle(-11.6, -9.8, 23.2, 19.6, 3.2, tint) +
    circle(-7.4, -4.6, 1.7, ink) + capsule(-3.6, -4.6, 8, -4.6, 2.4, ink) +
    circle(-7.4, 0.4, 1.7, ink) + capsule(-3.6, 0.4, 5.4, 0.4, 2.4, ink) +
    circle(-7.4, 5.4, 1.7, ink) + capsule(-3.6, 5.4, 8, 5.4, 2.4, ink),

  // A clipboard of passing rows — tests and validators.
  listCheck: ([ink, tint]) =>
    roundedRectangle(-9.8, -9.4, 19.6, 21, 3, tint) +
    roundedRectangle(-4.4, -11.8, 8.8, 4.6, 1.9, ink) +
    strokedPath(tickMarkPath(-3.6, -2.4, 0.82), ink, 2.6) +
    capsule(1.2, -2.4, 6.6, -2.4, 2.3, ink) +
    strokedPath(tickMarkPath(-3.6, 4.4, 0.82), ink, 2.6) +
    capsule(1.2, 4.4, 6.6, 4.4, 2.3, ink),

  // A sheet — a header band over a grid of cells, which reads as a table where
  // two rows of wide blocks read as a paragraph.
  grid: ([ink, tint]) => {
    const cell = (x: number, y: number): string => roundedRectangle(x, y, 6.6, 5.8, 1.5, tint);
    return (
      roundedRectangle(-11.4, -10, 22.8, 5.6, 2.2, ink) +
      cell(-11.4, -3) + cell(-3.3, -3) + cell(4.8, -3) +
      cell(-11.4, 4.2) + cell(-3.3, 4.2) + cell(4.8, 4.2)
    );
  },

  // A stack of discs — the database. Three rims rather than one, so it reads as
  // a stack instead of a drum.
  cylinder: ([ink, tint]) =>
    filledPath('M-9.8 -6v12c0 2.9 4.4 5.2 9.8 5.2s9.8-2.3 9.8-5.2V-6Z', tint) +
    pathWithHoles(ink, ellipsePath(0, 5.4, 9.8, 4.6), ellipsePath(0, 5.4, 6.2, 2.4)) +
    pathWithHoles(ink, ellipsePath(0, 0, 9.8, 4.6), ellipsePath(0, 0, 6.2, 2.4)) +
    ellipse(0, -6, 9.8, 4.8, ink),

  // Bars — analytics and plotted data.
  chart: ([ink, tint]) =>
    roundedRectangle(-10.8, 0.2, 6, 10.6, 2.6, tint) +
    roundedRectangle(-3, -6, 6, 16.8, 2.6, ink) +
    roundedRectangle(4.8, -2.6, 6, 13.4, 2.6, tint),

  /* ---------------- solids and modules ---------------- */

  // Isometric cube — assets. The lit top face is the tint.
  cube: ([ink, tint]) =>
    filledPath(isometricSolidPath(2.2), ink) + filledPath(isometricTopFacePath(2), tint),

  // Shipping box — store. The same solid, with tape over the lid.
  box: ([ink, tint]) =>
    filledPath(isometricSolidPath(2.2), ink) +
    filledPath(isometricTopFacePath(2), tint) +
    capsule(-5.8, -8.7, 5.8, -2.9, 2.4, ink),

  // The same solid opened up — 3D scenes and meshes, where the seams are the
  // point and a plain cube would say "asset" instead.
  model3d: ([ink, tint]) =>
    filledPath(isometricSolidPath(2.2), ink) +
    capsule(0, 0.4, 0, 10.6, 2.3, tint) +
    capsule(0, 0.4, -9.6, -5.2, 2.3, tint) +
    capsule(0, 0.4, 9.6, -5.2, 2.3, tint) +
    circle(0, 0.4, 2.2, tint),

  /*
   * Four blocks — modules. The diagonal check-pattern read as a window pane, so
   * three now sit square in the tint and the fourth is pulled clear in full
   * strength: a module taken out of a set, rather than a set of four squares.
   */
  cubes: ([ink, tint]) =>
    roundedRectangle(-11.4, -11.4, 10.2, 10.2, 2.8, tint) +
    roundedRectangle(1.2, -11.4, 10.2, 10.2, 2.8, tint) +
    roundedRectangle(-11.4, 1.2, 10.2, 10.2, 2.8, tint) +
    roundedRectangle(2.4, 2.4, 10.2, 10.2, 2.8, ink),

  // Jigsaw piece — components. The socket is cut clean through at the top and
  // the tab is the tint, so the piece reads as something that fits into
  // something else rather than as one lumpy square.
  puzzle: ([ink, tint]) =>
    pathWithHoles(
      ink,
      roundedRectanglePath(-10.8, -10.8, 21.6, 21.6, 3.4),
      circlePath(0.4, -10.8, 4.4)
    ) + circle(10.8, 0.4, 4.4, tint),

  // Stacked sheets — middleware. Only the top sheet is full strength.
  layers: ([ink, tint]) => {
    const chevronBand = (y: number): string =>
      roundedPolygon(
        [[-11.5, y], [0, y + 3.2], [11.5, y], [11.5, y + 2.6], [0, y + 5.8], [-11.5, y + 2.6]],
        1.3,
        tint
      );
    return (
      chevronBand(6.2) +
      chevronBand(1.2) +
      roundedPolygon([[0, -11.4], [11.5, -6.6], [0, -1.8], [-11.5, -6.6]], 2, ink)
    );
  },

  /* ---------------- tools ---------------- */

  /*
   * Cog — services. Eight teeth rather than six: at 16px six reads as a flower,
   * and the extra pair is what makes the outline say "machined". The hub is a
   * tint ring, so the wheel has a bore instead of a spot.
   */
  gear: ([ink, tint]) => {
    let teeth = '';
    for (let index = 0; index < 8; index++) {
      teeth += rotated(
        index * 45,
        roundedPolygon([[-2.9, -11.8], [2.9, -11.8], [2.2, -5.6], [-2.2, -5.6]], 1.2, ink)
      );
    }
    return teeth + circle(0, 0, 8.6, ink) + circle(0, 0, 4.4, tint);
  },

  /*
   * Open-end spanner — utilities, and the glyph this pass spent the longest on.
   *
   * V2 drew the jaw as a bare stroked arc: two thin horns that closed up at
   * 16px into a blob on a stick. Replacing it with a ring and a hex bore fixed
   * the weight and introduced a worse problem — a circle on the end of a
   * handle is a magnifying glass, and that is what it read as. So the head is
   * a solid block with a U cut clean out of the top: the notch is the whole
   * point of the tool, it is the part that survives being small, and nothing
   * else in the set has that silhouette.
   */
  wrench: ([ink, tint]) =>
    rotated(-42,
      capsule(0, -4, 0, 11, 4.6, tint) +
      pathWithHoles(
        ink,
        roundedRectanglePath(-7, -12, 14, 9.6, 2.8),
        roundedRectanglePath(-3.1, -13, 6.2, 7.2, 1.4)
      )
    ),

  // Claw hammer — build output. The notch is what stops the head reading as a
  // mallet, or as an axe once the whole thing is tilted.
  hammer: ([ink, tint]) =>
    rotated(-32,
      capsule(2, -3.6, 2, 11.4, 4.4, tint) +
      pathWithHoles(
        ink,
        roundedRectanglePath(-11.4, -11.4, 17.4, 8.6, 2.4),
        roundedPolygonPath([[-11.4, -9.7], [-6, -7.1], [-11.4, -4.5]], 1)
      )
    ),

  /*
   * Conical flask — specs. The glass is the tint and what is in it is full
   * strength; the collar at the neck is what stops the silhouette reading as a
   * plain triangle at 16px, which is what the old one did.
   */
  flask: ([ink, tint]) =>
    filledPath(
      'M-4 -11.6h8v6.4l7.2 12.4a2.8 2.8 0 0 1-2.42 4.2h-17.56A2.8 2.8 0 0 1-11.2 7.2L-4 -5.2Z',
      tint
    ) +
    capsule(-5.2, -10.2, 5.2, -10.2, 3, ink) +
    filledPath('M-5.2 2.6h10.4l3.5 6a1.1 1.1 0 0 1-0.95 1.65h-15.5a1.1 1.1 0 0 1-0.95-1.65Z', ink) +
    circle(-1.8, 6, 1.5, tint) + circle(2.2, 7.8, 1.1, tint),

  // Shield — the lit face is the tint, which gives it a form instead of a flat
  // crest.
  shield: ([ink, tint]) =>
    filledPath(shieldOutlinePath, ink) + filledPath(shieldHighlightPath, tint),

  shieldCheck: ([ink, tint]) =>
    filledPath(shieldOutlinePath, ink) + strokedPath(tickMarkPath(-0.6, -0.4, 1.15), tint, 3.2),

  // Funnel with the stream running through it — pipes.
  funnel: ([ink, tint]) =>
    roundedPolygon(
      [[-11.6, -11.2], [11.6, -11.2], [3.9, -0.6], [3.9, 7.6], [-3.9, 10.4], [-3.9, -0.6]],
      2,
      tint
    ) +
    roundedPolygon(
      [[-6.4, -6.4], [6.4, -6.4], [1.2, -0.4], [1.2, 6.6], [-1.2, 7.6], [-1.2, -0.4]],
      1.2,
      ink
    ),

  // Wand — directives. The sparks are four-point stars rather than crossed
  // needles, which is the same shape with its spikes rounded off.
  wand: ([ink, tint]) =>
    capsule(-9.6, 9.6, 4.4, -4.4, 4.6, tint) +
    star(9.2, -8.2, 4.6, 1.5, 4, 0.75, ink) +
    star(-1.6, -8.2, 3.2, 1.1, 4, 0.55, ink) +
    star(9, 6.2, 2.8, 0.9, 4, 0.5, ink),

  // Sliders — controllers. Round knobs rather than rounded blocks: a knob on a
  // track has to read instantly, and a circle survives the size where a
  // squarish handle blurs into its own track.
  sliders: ([ink, tint]) =>
    capsule(-10.6, -7.4, 10.6, -7.4, 4.4, tint) + circle(4.2, -7.4, 3.6, ink) +
    capsule(-10.6, 0, 10.6, 0, 4.4, tint) + circle(-4.6, 0, 3.6, ink) +
    capsule(-10.6, 7.4, 10.6, 7.4, 4.4, tint) + circle(6.2, 7.4, 3.6, ink),

  // Brush — styles. The bristles are a rounded wedge and the paint is the ink,
  // so it reads as loaded rather than as a lollipop.
  brush: ([ink, tint]) =>
    rotated(36,
      roundedRectangle(-3.8, -11.8, 7.6, 12.4, 2.6, tint) +
      roundedRectangle(-4.8, -0.6, 9.6, 3.8, 1.6, ink) +
      roundedPolygon([[-4.8, 3.8], [4.8, 3.8], [3.2, 11.8], [-3.2, 11.8]], 2.4, ink)
    ),

  /* ---------------- code and data ---------------- */

  /*
   * Curly braces. Drawn as strokes: see the note on `braceArmPath` above.
   *
   * The pair used to be the one pictogram painted in a single tone — it took
   * the tint and spent none of it, so it had no depth next to anything else in
   * a file list. The three dots between the arms are what it had been missing
   * anyway: `{ }` is a shape, `{...}` is a config file.
   */
  braces: ([ink, tint]) =>
    `<g transform="translate(-9.4 0)">${strokedPath(braceArmPath, ink, 2.9)}</g>` +
    mirroredHorizontally(
      `<g transform="translate(-9.4 0)">${strokedPath(braceArmPath, ink, 2.9)}</g>`
    ) +
    circle(-4.4, 0, 1.6, tint) + circle(0, 0, 1.6, tint) + circle(4.4, 0, 1.6, tint),

  // Angle brackets with a slash between them — markup.
  angles: ([ink, tint]) =>
    strokedPath('M-4.2 -8.4-11.2 0-4.2 8.4', ink, 3.4) +
    strokedPath('M4.2 -8.4 11.2 0 4.2 8.4', ink, 3.4) +
    strokedPath('M1.8 -9.6-1.8 9.6', tint, 3.2),

  // Two arrows passing each other — data transfer.
  exchange: ([ink, tint]) =>
    roundedPolygon(
      [[-11.4, -8.4], [3.2, -8.4], [3.2, -11.8], [11.6, -5.4], [3.2, 1], [3.2, -2.4], [-11.4, -2.4]],
      1.5,
      ink
    ) +
    roundedPolygon(
      [[11.4, 8.4], [-3.2, 8.4], [-3.2, 11.8], [-11.6, 5.4], [-3.2, -1], [-3.2, 2.4], [11.4, 2.4]],
      1.5,
      tint
    ),

  // Plus over minus — diffs.
  plusMinus: ([ink, tint]) =>
    roundedPolygon(
      [
        [-2.9, -11.6], [2.9, -11.6], [2.9, -7.7], [6.8, -7.7], [6.8, -1.9], [2.9, -1.9],
        [2.9, 2], [-2.9, 2], [-2.9, -1.9], [-6.8, -1.9], [-6.8, -7.7], [-2.9, -7.7],
      ],
      1.3,
      ink
    ) +
    capsule(-6.6, 8.2, 6.6, 8.2, 5, tint),

  // Arrows closing on a line — minified assets.
  compress: ([ink, tint]) =>
    capsule(0, -11.4, 0, 11.4, 3.4, ink) +
    capsule(-11.2, 0, -7.4, 0, 3.4, tint) +
    filledPath(arrowHeadPath(-6.8, 0, 0, 4.8, 6.2, 1.3), tint) +
    capsule(11.2, 0, 7.4, 0, 3.4, tint) +
    filledPath(arrowHeadPath(6.8, 0, 180, 4.8, 6.2, 1.3), tint),

  // f(x) — functions. The letter is the tint and the parentheses full strength,
  // so the pair reads as a call rather than as two loose shapes.
  fx: ([ink, tint]) =>
    strokedPath('M-7.8 -10.6a9.2 9.2 0 0 0 0 21.2', ink, 3.3) +
    strokedPath('M7.8 -10.6a9.2 9.2 0 0 1 0 21.2', ink, 3.3) +
    capsule(-3.4, -4.4, 3.4, 4.4, 3.3, tint) +
    capsule(3.4, -4.4, -3.4, 4.4, 3.3, tint),

  // Fish hook — React hooks.
  hook: ([ink, tint]) =>
    strokedPath('M6.2 -9.4v-0.6a2.4 2.4 0 0 1 4.8 0v11.4a8 8 0 0 1-16 0v-1.6', ink, 3.6) +
    circle(8.6, -10, 2.6, tint) +
    roundedPolygon([[-11.8, -1.4], [-6.4, -1.4], [-9.1, 3.8]], 1.1, ink),

  /* ---------------- windows and surfaces ---------------- */

  // Terminal — the screen is the tint, the prompt on it full strength. The
  // cursor is a block rather than an underscore: an underscore at 16px is one
  // pixel of ink and disappears.
  terminal: ([ink, tint]) =>
    roundedRectangle(-11.6, -9.6, 23.2, 19.2, 3.2, tint) +
    strokedPath('M-6.6 -3.6-2 0.8-6.6 5.2', ink, 3.1) +
    roundedRectangle(0.8, -0.9, 7.4, 3.4, 1.7, ink),

  // Browser — the chrome is full strength, the page under it the tint. The
  // address field is a capsule, which is what a browser's actually looks like
  // and what tells this apart from the terminal at a glance.
  browser: ([ink, tint]) =>
    roundedRectangle(-11.6, -9.6, 23.2, 19.2, 3.2, tint) +
    pathWithHoles(
      ink,
      'M-11.6 -5.8v-0.8a3 3 0 0 1 3-3h17.2a3 3 0 0 1 3 3v0.8Z',
      circlePath(-8.6, -7.4, 1.15),
      circlePath(-4.8, -7.4, 1.15),
      circlePath(-1, -7.4, 1.15)
    ) +
    capsule(-7.4, 1.4, 7.4, 1.4, 4.4, ink),

  // Dashboard — a header, a rail and a pane, which is the arrangement a layout
  // file actually describes; two equal columns under a bar were not saying it.
  layout: ([ink, tint]) =>
    roundedRectangle(-11.4, -11.4, 22.8, 6.2, 2.4, ink) +
    roundedRectangle(-11.4, -3.2, 7.4, 14.6, 2.4, tint) +
    roundedRectangle(-2, -3.2, 13.4, 14.6, 2.4, tint),

  // Eye — views. The canthi are arcs rather than cusps: an eye drawn as two
  // meeting curves comes to a needle at each end, which is the one place in the
  // set where a point looked like a rendering fault rather than a shape.
  eye: ([ink, tint]) =>
    filledPath(
      'M0 -8.8c5.6 0 10.3 3.5 12.5 7.3a3 3 0 0 1 0 3C10.3 5.3 5.6 8.8 0 8.8S-10.3 5.3-12.5 1.5a3 3 0 0 1 0-3C-10.3 -5.3-5.6 -8.8 0 -8.8Z',
      tint
    ) +
    circle(0, 0, 5.2, ink) + circle(1.8, -1.8, 1.8, tint),

  // Globe — public assets. The latitudes are capsules trimmed to the sphere
  // rather than full-width rules, so the ball reads as a ball.
  globe: ([ink, tint]) =>
    circle(0, 0, 11.6, tint) +
    pathWithHoles(ink, ellipsePath(0, 0, 5.4, 11.6), ellipsePath(0, 0, 2.9, 9.2)) +
    capsule(-11.4, 0, 11.4, 0, 2.6, ink) +
    capsule(-9.9, -5.8, 9.9, -5.8, 2.4, ink) +
    capsule(-9.9, 5.8, 9.9, 5.8, 2.4, ink),

  // Photograph — a sun and two overlapping hills, which is a landscape; one
  // ridge and a circle was a chart.
  picture: ([ink, tint]) =>
    roundedRectangle(-11.6, -9.6, 23.2, 19.2, 3.2, tint) +
    circle(-5, -3.8, 2.8, ink) +
    roundedPolygon([[1.6, 8.8], [7, 0.4], [12.4, 8.8]], 1.6, ink) +
    roundedPolygon([[-11.4, 8.8], [-3.6, -2.6], [4.2, 8.8]], 1.8, ink),

  // Camera — the photographs that arrive straight off a sensor.
  camera: ([ink, tint]) =>
    roundedRectangle(-6.8, -11, 8.6, 4.6, 1.8, tint) +
    roundedRectangle(-11.8, -7.6, 23.6, 16.6, 3.6, tint) +
    circle(0, 1, 5.4, ink) + circle(0, 1, 2.3, tint) +
    circle(8.2, -3.8, 1.7, ink),

  // Two beamed notes — audio. The heads are circles rather than tilted
  // ellipses: at 16px the tilt was a smudge on one side.
  note: ([ink, tint]) =>
    roundedPolygon([[-3.6, -8.4], [10.8, -11.6], [10.8, -7.6], [-3.6, -4.4]], 1.4, tint) +
    capsule(-3.6, -7.2, -3.6, 6.2, 3.2, tint) +
    capsule(10.8, -10.4, 10.8, 3.4, 3.2, tint) +
    circle(-6.6, 6.6, 4.4, ink) + circle(7.8, 3.8, 4.4, ink),

  // Play — video.
  play: ([ink, tint]) =>
    roundedRectangle(-11.6, -11.6, 23.2, 23.2, 5.4, tint) +
    roundedPolygon([[-5.4, -8.4], [8.4, 0], [-5.4, 8.4]], 2.2, ink),

  // Caption bars under a frame — subtitle tracks.
  subtitle: ([ink, tint]) =>
    roundedRectangle(-11.6, -8.8, 23.2, 17.6, 3.2, tint) +
    capsule(-8.2, 1.2, 8.2, 1.2, 2.8, ink) +
    capsule(-8.2, 5.8, 2.6, 5.8, 2.8, ink),

  // Zipped parcel — archives. The pull tab is what makes the slider read as a
  // slider rather than as a padlock.
  zip: ([ink, tint]) =>
    roundedRectangle(-9.8, -11.6, 19.6, 23.2, 3.4, tint) +
    roundedRectangle(-2.2, -11.4, 4.4, 2.4, 1, ink) +
    roundedRectangle(-2.2, -7.4, 4.4, 2.4, 1, ink) +
    roundedRectangle(-2.2, -3.4, 4.4, 2.4, 1, ink) +
    roundedRectangle(-3.6, 0.6, 7.2, 5.4, 2.2, ink) +
    pathWithHoles(
      ink,
      roundedRectanglePath(-2.6, 5.4, 5.2, 6.4, 2),
      roundedRectanglePath(-1.1, 7.2, 2.2, 3.2, 1.1)
    ),

  // An optical disc — disk and filesystem images.
  disk: ([ink, tint]) =>
    circle(0, 0, 11.6, tint) + ring(0, 0, 11.6, 3.1, ink) +
    circle(0, 0, 3.4, ink) + circle(0, 0, 1.4, tint),

  /* ---------------- security ---------------- */

  // Padlock — the shackle is the tint and the keyhole is cut clean through, so
  // it survives whatever the explorer paints behind it.
  padlock: ([ink, tint]) =>
    filledPath(
      'M0 -12a7 7 0 0 1 7 7v3.4h-4.2v-3.4A2.8 2.8 0 0 0 0 -7.8a2.8 2.8 0 0 0-2.8 2.8v3.4h-4.2v-3.4A7 7 0 0 1 0 -12Z',
      tint
    ) +
    pathWithHoles(
      ink,
      roundedRectanglePath(-9.6, -2, 19.2, 14, 3.4),
      circlePath(0, 3.2, 2.5) + 'M-1.2 3.2h2.4v4.8a1.2 1.2 0 0 1-2.4 0Z'
    ),

  // Key — certificates. A ring bow, a capsule shaft and two teeth.
  key: ([ink, tint]) =>
    ring(-5.2, 0, 7, 3.4, ink) +
    capsule(0, 0, 11.2, 0, 3.6, tint) +
    capsule(5.8, 0, 5.8, 5.6, 3.2, tint) +
    capsule(10.2, 0, 10.2, 4.4, 3.2, tint),

  /* ---------------- awards, time, objects ---------------- */

  // Award medal — licences. The ribbon tails notch inward, which
  // `roundedPolygonPath` rounds as a reflex corner without being told it is
  // one.
  seal: ([ink, tint]) =>
    roundedPolygon([[-6.4, 1.2], [-1.8, 1.2], [-1.8, 12], [-4.1, 9.6], [-6.4, 12]], 1.1, tint) +
    roundedPolygon([[6.4, 1.2], [1.8, 1.2], [1.8, 12], [4.1, 9.6], [6.4, 12]], 1.1, tint) +
    circle(0, -3.4, 8.6, ink) +
    star(0, -3.4, 5.8, 2.5, 5, 0.85, tint),

  // A clock over its own face — changelog. The face is the tint so the hands
  // have something to be read against.
  history: ([ink, tint]) =>
    circle(0, 0, 11.6, tint) +
    ring(0, 0, 11.6, 2.8, ink) +
    capsule(0, 0, 0, -6.2, 2.8, ink) +
    capsule(0, 0, 5.2, 0, 2.8, ink) +
    circle(0, 0, 1.9, tint),

  // Life ring — helpers.
  lifebuoy: ([ink, tint]) =>
    ring(0, 0, 11.6, 4, tint) +
    circle(0, 0, 5.4, ink) +
    rotated(45, capsule(-9.4, 0, 9.4, 0, 3.4, ink)) +
    rotated(-45, capsule(-9.4, 0, 9.4, 0, 3.4, ink)),

  // Open book — docs. The right-hand page is full strength.
  book: ([ink, tint]) =>
    filledPath(
      'M-1 -8.6v18.8c-2.7-1.9-5.8-2.8-9.2-2.8h-1.4a1 1 0 0 1-1-1v-14.2a1 1 0 0 1 1-1h1.4c3.4 0 6.5 0.9 9.2 2.8Z',
      tint
    ) +
    filledPath(
      'M1 -8.6v18.8c2.7-1.9 5.8-2.8 9.2-2.8h1.4a1 1 0 0 0 1-1v-14.2a1 1 0 0 0-1-1h-1.4c-3.4 0-6.5 0.9-9.2 2.8Z',
      ink
    ),

  // A closed book with a ribbon in it — e-books, which are a bound volume
  // rather than the open reference the docs folder wants.
  ebook: ([ink, tint]) =>
    roundedRectangle(-9.6, -11.6, 19.2, 23.2, 2.8, tint) +
    roundedRectangle(-9.6, -11.6, 4.6, 23.2, 2.8, ink) +
    roundedRectangle(-7.4, -11.6, 2.4, 23.2, 0, ink) +
    roundedPolygon([[2.4, -11.6], [7.6, -11.6], [7.6, -0.6], [5, -3.2], [2.4, -0.6]], 1, ink),

  // Label — types. The tip is the tag's whole silhouette, so it is rounded
  // rather than removed.
  tag: ([ink, tint]) =>
    pathWithHoles(
      ink,
      roundedPolygonPath([[-11.4, -8.2], [4.4, -8.2], [11.4, 0], [4.4, 8.2], [-11.4, 8.2]], 2.4),
      circlePath(-6, 0, 2.7)
    ) + circle(-6, 0, 2.7, tint),

  // Letterform — fonts.
  typeA: ([ink, tint]) =>
    pathWithHoles(
      ink,
      roundedPolygonPath(
        [[-3.2, -11.6], [3.2, -11.6], [10.6, 7], [4.8, 7], [3.5, 3.4], [-3.5, 3.4], [-4.8, 7], [-10.6, 7]],
        1.7
      ),
      roundedPolygonPath([[-1.9, -0.8], [1.9, -0.8], [0, -6.2]], 0.9)
    ) +
    capsule(-9.4, 10.4, 9.4, 10.4, 3, tint),

  // Star — icon assets.
  star: ([ink, tint]) => star(0, 0, 11.8, 5.2, 5, 1.7, ink) + star(0, 0, 5.8, 2.6, 5, 0.9, tint),

  // Four-point spark — the assistant and prompt files, which are new enough
  // that no convention has settled on anything else.
  sparkle: ([ink, tint]) =>
    star(-1.4, 1, 11, 3.2, 4, 1.1, ink) + star(7.8, -8, 4.2, 1.2, 4, 0.6, tint),

  /* ---------------- systems ---------------- */

  // Processor die — core.
  chip: ([ink, tint]) => {
    let pins = '';
    for (const rotation of [0, 90, 180, 270]) {
      pins += rotated(
        rotation,
        capsule(-5.6, -11.6, -5.6, -8, 2.8, tint) +
        capsule(0, -11.6, 0, -8, 2.8, tint) +
        capsule(5.6, -11.6, 5.6, -8, 2.8, tint)
      );
    }
    return pins + roundedRectangle(-8.8, -8.8, 17.6, 17.6, 3.2, ink) +
      roundedRectangle(-4, -4, 8, 8, 2, tint);
  },

  // Power plug — plugins. The body is a rounded block union'd with an ellipse
  // rather than a rectangle with a bevelled foot.
  plug: ([ink, tint]) =>
    capsule(-5.4, -11.6, -5.4, -5, 3.4, tint) + capsule(5.4, -11.6, 5.4, -5, 3.4, tint) +
    roundedRectangle(-10.2, -5.2, 20.4, 8, 3, ink) + ellipse(0, 2.4, 10.2, 6.4, ink) +
    capsule(0, 7.4, 0, 11.8, 3.4, tint),

  // Server rack — three units rather than two, which is what makes it a rack.
  // The status lights are full strength.
  serverRack: ([ink, tint]) => {
    const unit = (y: number): string =>
      roundedRectangle(-11.6, y, 23.2, 6.4, 2.2, tint) +
      circle(7.6, y + 3.2, 1.6, ink) +
      capsule(-8.2, y + 3.2, 1.6, y + 3.2, 2.4, ink);
    return unit(-11.2) + unit(-3.2) + unit(4.8);
  },

  // Broadcast arcs over a dot — captured traffic and network dumps.
  signal: ([ink, tint]) =>
    circle(0, 8.4, 3, ink) +
    strokedPath('M-5.6 2.6a8 8 0 0 1 11.2 0', tint, 3.2) +
    strokedPath('M-10.2 -2.6a14.6 14.6 0 0 1 20.4 0', tint, 3.2) +
    strokedPath('M-10.8 -8.4a19.4 19.4 0 0 1 21.6 0', ink, 3.2),

  // Flow chart — workflows.
  flow: ([ink, tint]) =>
    roundedRectangle(-11.6, -11.6, 12, 8.4, 2.6, ink) +
    roundedRectangle(-0.4, 3.2, 12, 8.4, 2.6, tint) +
    strokedPath('M-5.6 -3.2v6.8h11.2v-0.4', ink, 3) +
    filledPath(arrowHeadPath(5.6, 3.4, 90, 3.2, 2.6, 0.8), ink),

  // Fork in the road — routes.
  route: ([ink, tint]) =>
    strokedPath('M0 11.4V1.6', ink, 3.6) +
    strokedPath('M0 2.6-6.8 -4.2', tint, 3.6) +
    filledPath(arrowHeadPath(-9.6, -7, 225, 3.4, 3.6, 1), tint) +
    strokedPath('M0 2.6 6.8 -4.2', tint, 3.6) +
    filledPath(arrowHeadPath(9.6, -7, -45, 3.4, 3.6, 1), tint),

  // Share — one node feeding two.
  share: ([ink, tint]) =>
    capsule(-6.6, 0, 6.8, -8, 3, tint) + capsule(-6.6, 0, 6.8, 8, 3, tint) +
    circle(-7.2, 0, 4.8, ink) + circle(7.6, -8.4, 4.4, tint) + circle(7.6, 8.4, 4.4, tint),

  // Two links of a chain — shortcuts and symlinks.
  link: ([ink, tint]) =>
    rotated(-38,
      roundedFrame(-11.6, -4.6, 13.4, 9.2, 4.6, 2.8, ink) +
      roundedFrame(-1.8, -4.6, 13.4, 9.2, 4.6, 2.8, tint)
    ),

  // Horseshoe magnet — torrents, and anything else that pulls a file in.
  magnet: ([ink, tint]) =>
    filledPath('M-11.4 6.6V-0.4a11.4 11.4 0 0 1 22.8 0v7h-6.9v-7a4.5 4.5 0 0 0-9 0v7Z', ink) +
    roundedRectangle(-11.6, 4.4, 7.3, 6.4, 1.8, tint) +
    roundedRectangle(4.3, 4.4, 7.3, 6.4, 1.8, tint),

  // Ghost — mocks and fixtures. The hem is a rounded zigzag rather than a row
  // of spikes.
  ghost: ([ink, tint]) =>
    filledPath('M-10.8 1a10.8 10.8 0 0 1 21.6 0v5.4h-21.6Z', ink) +
    roundedPolygon(
      [
        [-10.8, 3.6], [10.8, 3.6], [10.8, 10.6], [7.2, 7.6], [3.6, 10.6],
        [0, 7.6], [-3.6, 10.6], [-7.2, 7.6], [-10.8, 10.6],
      ],
      1.5,
      ink
    ) +
    circle(-4, -2.4, 2.4, tint) + circle(4, -2.4, 2.4, tint),

  // Robot head — the face plate is the tint.
  robot: ([ink, tint]) =>
    capsule(0, -12, 0, -9.2, 2.8, ink) +
    roundedRectangle(-10.8, -9.2, 21.6, 18, 4.6, ink) +
    capsule(-12, -3.4, -12, 2.4, 3, ink) + capsule(12, -3.4, 12, 2.4, 3, ink) +
    pathWithHoles(
      tint,
      roundedRectanglePath(-7.6, -5.8, 15.2, 11.2, 2.8),
      circlePath(-3.4, -0.6, 2),
      circlePath(3.4, -0.6, 2)
    ),

  // Beetle — crash dumps and debug symbols.
  bug: ([ink, tint]) =>
    capsule(-11.2, -5.4, -6.6, -3.4, 2.4, tint) + capsule(11.2, -5.4, 6.6, -3.4, 2.4, tint) +
    capsule(-11.6, 1.4, -7.2, 1.4, 2.4, tint) + capsule(11.6, 1.4, 7.2, 1.4, 2.4, tint) +
    capsule(-11.2, 8.2, -6.6, 6.2, 2.4, tint) + capsule(11.2, 8.2, 6.6, 6.2, 2.4, tint) +
    capsule(-4.6, -11.6, -2.6, -8.6, 2.2, tint) + capsule(4.6, -11.6, 2.6, -8.6, 2.2, tint) +
    ellipse(0, 1.8, 7.6, 9.4, ink) + circle(0, -7.4, 4.4, ink) +
    capsule(0, -4.4, 0, 8.6, 2.2, tint),

  /* ---------------- correspondence and places ---------------- */

  // Envelope — mail formats.
  envelope: ([ink, tint]) =>
    roundedRectangle(-11.6, -8.4, 23.2, 16.8, 3, tint) +
    roundedPolygon([[-10.4, -7.2], [10.4, -7.2], [0, 2]], 1.8, ink),

  // Wall calendar — schedules and calendar exports.
  calendar: ([ink, tint]) =>
    capsule(-6, -11.8, -6, -8, 2.8, ink) + capsule(6, -11.8, 6, -8, 2.8, ink) +
    roundedRectangle(-11.6, -9.8, 23.2, 19.6, 3.2, tint) +
    headerBand(-11.6, -9.8, 23.2, 6.6, 3.2, ink) +
    circle(-5.4, 1.6, 2, ink) + circle(0, 1.6, 2, ink) + circle(5.4, 1.6, 2, ink) +
    circle(-5.4, 6.8, 2, ink) + circle(0, 6.8, 2, ink),

  // Contact card — address-book exports.
  contactCard: ([ink, tint]) =>
    roundedRectangle(-11.6, -8.6, 23.2, 17.2, 3.2, tint) +
    circle(-5, -2.6, 3.4, ink) +
    filledPath('M-10.2 5.6a5.2 5.2 0 0 1 10.4 0v0.6h-10.4Z', ink) +
    capsule(3.6, -3.4, 9.4, -3.4, 2.4, ink) + capsule(3.6, 1.4, 9.4, 1.4, 2.4, ink),

  // Map pin — geographic data.
  mapPin: ([ink, tint]) =>
    pathWithHoles(
      ink,
      'M0 -11.8a8.8 8.8 0 0 1 8.8 8.8c0 5.6-6.2 11.4-8.2 13.2a0.9 0.9 0 0 1-1.2 0c-2-1.8-8.2-7.6-8.2-13.2A8.8 8.8 0 0 1 0 -11.8Z',
      circlePath(0, -3, 3.5)
    ) + circle(0, -3, 3.5, tint),

  /* ---------------- movement ---------------- */

  // An arrow dropping into a tray — installers and packages.
  install: ([ink, tint]) =>
    roundedRectangle(-11.4, 5.8, 22.8, 6, 2.4, tint) +
    capsule(0, -11.2, 0, -3.4, 3.8, ink) +
    filledPath(arrowHeadPath(0, -3.6, 90, 6.6, 6.8, 1.6), ink),

  // Waste bin — backups, swap files and everything else an editor leaves
  // behind.
  trash: ([ink, tint]) =>
    roundedRectangle(-3.8, -11.8, 7.6, 3.2, 1.4, ink) +
    capsule(-10.6, -7.6, 10.6, -7.6, 3, ink) +
    roundedPolygon([[-8.4, -4.6], [8.4, -4.6], [7, 11], [-7, 11]], 2.4, tint) +
    capsule(-3, -0.6, -3, 6.6, 2.2, ink) + capsule(3, -0.6, 3, 6.6, 2.2, ink),

  /* ---------------- language and thought ---------------- */

  // Two cards, one lettered — translation and locale data. The A is cut out of
  // the front card rather than laid on it, so it stays legible whatever the
  // explorer paints behind the icon.
  translate: ([ink, tint]) =>
    roundedRectangle(-11.8, -11.8, 15.4, 15.4, 3.4, tint) +
    circle(-7.4, -7.4, 1.9, ink) +
    capsule(-3.8, -7.4, 0.4, -7.4, 2.4, ink) +
    capsule(-7.4, -3.8, -7.4, 0.4, 2.4, ink) +
    pathWithHoles(
      ink,
      roundedRectanglePath(-3.6, -3.6, 15.4, 15.4, 3.4),
      roundedPolygonPath(
        [[2.2, 8.6], [4.4, 1.4], [7.6, 1.4], [9.8, 8.6], [7.4, 8.6], [7, 7], [4.8, 7], [4.4, 8.6]],
        0.7
      )
    ),

  // Atom — contexts and providers.
  atom: ([ink, tint]) => {
    const orbit = pathWithHoles(tint, ellipsePath(0, 0, 11.8, 5), ellipsePath(0, 0, 9.6, 2.8));
    return orbit + rotated(60, orbit) + rotated(120, orbit) + circle(0, 0, 3.6, ink);
  },

  // Pi — the maths and notebook formats that have no mark of their own.
  pi: ([ink, tint]) =>
    capsule(-9.4, -6.6, 9.4, -6.6, 3.6, ink) +
    capsule(-4.4, -5, -4.4, 9.8, 3.4, tint) +
    capsule(4.4, -5, 4.4, 9.8, 3.4, tint),

  // Bezier segment with its nodes — vector artwork.
  vector: ([ink, tint]) =>
    strokedPath('M-8.6 8C-8.6 -4 8.6 4 8.6 -8', ink, 3.2) +
    roundedRectangle(-11.8, 5.2, 6.4, 6.4, 1.8, tint) +
    roundedRectangle(5.4, -11.6, 6.4, 6.4, 1.8, tint),

  // Game controller — save files, ROMs and scene data.
  gamepad: ([ink, tint]) =>
    roundedRectangle(-11.8, -6.6, 23.6, 13.2, 6.6, tint) +
    capsule(-8.4, -0.2, -3.2, -0.2, 2.8, ink) +
    capsule(-5.8, -2.8, -5.8, 2.4, 2.8, ink) +
    circle(5, -2.2, 2.2, ink) + circle(8.4, 1.6, 2.2, ink),

  // Leaf on a stem — Twig templates, which still have no mark to import.
  leaf: ([ink, tint]) =>
    filledPath(
      'M10.4 -11.4a2 2 0 0 1 1.8 2.2c1 9.6-2.7 17.2-10.4 19.4-4.7 1.4-9.4-0.6-10.8-4.7-1.6-4.7 1.2-9.4 7.6-11.4 4.1-1.3 8.2-2.4 11.8-5.5Z',
      ink
    ) +
    strokedPath('M-10.8 11.2C-7.4 5-3 0.4 2.6 -3.2', tint, 2.8),
} satisfies Record<string, Pictogram>;

export type GlyphName = keyof typeof glyphs;
