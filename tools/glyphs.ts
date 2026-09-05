/*
 * Pictogram library for the Midnight Indigo icon set — the shapes that are ours
 * rather than a brand's. Language and tool marks live in tools/marks.ts, and
 * the drawing primitives both use live in tools/shapes.ts (which is also where
 * the stroke and hole rules are written down).
 *
 * Every glyph is drawn inside a 24x24 box centred on (0,0) — coordinates run
 * from -12 to 12 — so the build can drop any glyph into any container with a
 * single translate/scale and it lands optically centred.
 *
 * DUOTONE
 * -------
 * A glyph is handed two colours: `ink[0]` is the icon's identity colour and
 * `ink[1]` a lighter tint of the same hue, derived in tools/palette.ts. Every
 * pictogram uses both, and which part gets which is the whole design:
 *
 *   The tint is the SURFACE — the glass of the flask, the page of the book, the
 *   screen of the terminal, the body of the eye. The full-strength colour is
 *   what is ON that surface: the liquid, the print, the prompt, the iris.
 *
 * That split is why V2's pictograms are not V1's shapes recoloured. A single
 * flat silhouette has to say everything with its outline, so it ends up as a
 * cluster of thin slots and knock-outs that close up at 16px. Two tones carry
 * the structure instead, and the outline can stay simple and heavy.
 */

import {
  C,
  E,
  G,
  R,
  bar,
  circD,
  cut,
  ellD,
  mir,
  path,
  polyD,
  ring,
  rot,
  rrD,
  stroked,
  type Colour,
  type Ink,
} from './shapes.ts';

export type { Colour, Ink } from './shapes.ts';

export type Glyph = (ink: Ink) => string;

/* ------------------------------------------------------------------ *
 * Shared geometry
 * ------------------------------------------------------------------ */

const SHIELD = 'M0 -11.8 10.8 -8v7.4C10.8 5.8 6.2 10.4 0 12.4-6.2 10.4-10.8 5.8-10.8 -0.6v-7.4Z';

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
const BRACE = 'M6 -11.4a3 3 0 0 0-3 3v5.4a3 3 0 0 1-3 3a3 3 0 0 1 3 3v5.4a3 3 0 0 0 3 3';

/** A tick, as a stroke centre line. */
const TICK = (x: number, y: number, s: number): string =>
  `M${x - 3.4 * s} ${y}l${2.6 * s} ${2.6 * s}l${4.8 * s} ${-5.4 * s}`;

/** The isometric top face shared by the cube-shaped glyphs. */
const isoTop = (h: number): string => polyD([[0, -h], [11.4, -h + 5.7], [0, -h + 11.4], [-11.4, -h + 5.7]]);

export const glyphs = {
  /* ---------------- documents and lists ---------------- */

  // A page of text: the first line is the heading, in full strength.
  lines: ([a, b]) =>
    bar(-9.2, -7.6, 9.2, -7.6, 3.4, a) +
    bar(-9.2, -1.2, 9.2, -1.2, 3, b) +
    bar(-9.2, 4.6, 9.2, 4.6, 3, b) +
    bar(-9.2, 10.4, 1.6, 10.4, 3, b),

  // Timestamped lines — log files.
  logLines: ([a, b]) =>
    C(-8.6, -7.4, 2.4, a) + bar(-3.4, -7.4, 9.2, -7.4, 3, b) +
    C(-8.6, 0, 2.4, a) + bar(-3.4, 0, 9.2, 0, 3, b) +
    C(-8.6, 7.4, 2.4, a) + bar(-3.4, 7.4, 4.4, 7.4, 3, b),

  // A checklist — three passing rows.
  listCheck: ([a, b]) =>
    stroked(TICK(-6.6, -7.4, 1), a, 3) + bar(1.6, -7.4, 10.2, -7.4, 3, b) +
    stroked(TICK(-6.6, 0, 1), a, 3) + bar(1.6, 0, 10.2, 0, 3, b) +
    stroked(TICK(-6.6, 7.4, 1), a, 3) + bar(1.6, 7.4, 6.6, 7.4, 3, b),

  // A sheet: header row in full strength, body cells in tint.
  grid: ([a, b]) =>
    R(-11.4, -9.6, 22.8, 5.8, 2.4, a) +
    R(-11.4, -2.4, 10.6, 5.6, 1.8, b) + R(0.8, -2.4, 10.6, 5.6, 1.8, b) +
    R(-11.4, 4.6, 10.6, 5, 1.8, b) + R(0.8, 4.6, 10.6, 5, 1.8, b),

  // A stack of discs — the database.
  cylinder: ([a, b]) =>
    path('M-9.8 -5.4v10.8c0 2.9 4.4 5.2 9.8 5.2s9.8-2.3 9.8-5.2V-5.4Z', b) +
    E(0, -5.4, 9.8, 5, a) +
    cut(a, ellD(0, 1.6, 9.8, 5), ellD(0, 1.6, 6, 2.6)),

  // Isometric cube — assets. The lit top face is the tint.
  cube: ([a, b]) =>
    path('M-11.4 -5.4 0 0.6v11.6l-11.4-6.2Z', a) +
    path('M11.4 -5.4 0 0.6v11.6l11.4-6.2Z', a) +
    path(isoTop(11.6), b),

  // Four blocks — modules. The diagonal pairing is what stops it reading as a
  // window pane.
  cubes: ([a, b]) =>
    R(-11.4, -11.4, 11.2, 11.2, 3, b) + R(0.2, -11.4, 11.2, 11.2, 3, a) +
    R(-11.4, 0.2, 11.2, 11.2, 3, a) + R(0.2, 0.2, 11.2, 11.2, 3, b),

  // Jigsaw piece — components. The knob is the tint, so the piece reads as two
  // things fitting together rather than as one lumpy square.
  puzzle: ([a, b]) =>
    cut(a, rrD(-10.6, -10.6, 21.2, 21.2, 3.2), circD(10.6, 0.6, 4.4)) +
    C(-0.4, -10.6, 4.4, b),

  /* ---------------- tools ---------------- */

  // Cog — services. Six square teeth and a tint hub; V1 had eight rounded ones
  // and a hole, which at 16px was a fuzzy disc.
  gear: ([a, b]) => {
    let teeth = '';
    for (let i = 0; i < 6; i++) teeth += rot(i * 60, G([[-3.4, -11.8], [3.4, -11.8], [2.5, -5.4], [-2.5, -5.4]], a));
    return teeth + C(0, 0, 8.4, a) + C(0, 0, 4.3, b);
  },

  // Spanner — utilities. An open jaw at 45°, with the grip in tint.
  wrench: ([a, b]) =>
    rot(-40, bar(0, -6.2, 0, 10.6, 4.4, b) + stroked('M-5.6 -10.2A6.4 6.4 0 1 0 5.6 -10.2', a, 3.4)),

  // Claw hammer — build output. The notch is what stops the head reading as a
  // mallet, or as an axe once the whole thing is tilted.
  hammer: ([a, b]) =>
    rot(-32,
      bar(2, -3.6, 2, 11.4, 4.4, b) +
      cut(a, rrD(-11.4, -11.4, 17.4, 8.6, 2.4), polyD([[-11.4, -9.6], [-6, -7.1], [-11.4, -4.6]]))
    ),

  // Conical flask — specs. Glass in tint, what is in it at full strength.
  flask: ([a, b]) =>
    cut(
      b,
      'M-4.2 -11.8h8.4a1.7 1.7 0 0 1 0 3.4h-0.9v4.9l7 12a2.7 2.7 0 0 1-2.35 4.05h-16.9A2.7 2.7 0 0 1-11.3 8.55l7-12v-4.9h-0.9a1.7 1.7 0 0 1 0-3.4Z'
    ) +
    path('M-5.4 2.4h10.8l3.6 6.2a1 1 0 0 1-0.85 1.5h-16.3a1 1 0 0 1-0.85-1.5Z', a) +
    C(-1.6, 5.8, 1.5, b) + C(2.4, 7.6, 1.1, b),

  // Shield — the lit face is the tint, which is what gives it a form instead of
  // a flat crest.
  shield: ([a, b]) => path(SHIELD, a) + path('M0 -8.2 7.4 -5.6v5C7.4 4 4.3 7.3 0 8.9Z', b),

  shieldCheck: ([a, b]) => path(SHIELD, a) + stroked(TICK(-0.6, -0.4, 1.15), b, 3.2),

  // Funnel with a drop coming out of it — pipes.
  funnel: ([a, b]) =>
    path('M-11.6 -11.2h23.2a1.2 1.2 0 0 1 0.9 1.99L4 -0.4V6a1.6 1.6 0 0 1-0.8 1.4l-4.4 2.5A1.6 1.6 0 0 1-4 8.5V-0.4l-8.5-8.81A1.2 1.2 0 0 1-11.6 -11.2Z', b) +
    path('M0 -6.6 6.4 -6.6 1.2 -0.6v7.7l-2.4 1.4V-0.6Z', a),

  // Wand — directives.
  wand: ([a, b]) =>
    bar(-9.6, 9.6, 4.4, -4.4, 4.6, b) +
    path('M9.2 -12l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4Z', a) +
    path('M-1.6 -11.4 -0.7 -9.1 1.6 -8.2-0.7 -7.3-1.6 -5-2.5 -7.3-4.8 -8.2-2.5 -9.1Z', a) +
    path('M9 3.6 9.7 5.5 11.6 6.2 9.7 6.9 9 8.8 8.3 6.9 6.4 6.2 8.3 5.5Z', a),

  // Sliders — controllers. Tracks in tint, handles at full strength.
  sliders: ([a, b]) =>
    bar(-10.6, -7.6, 10.6, -7.6, 4.2, b) + R(1.2, -11, 5, 6.8, 2.5, a) +
    bar(-10.6, 0, 10.6, 0, 4.2, b) + R(-7, -3.4, 5, 6.8, 2.5, a) +
    bar(-10.6, 7.6, 10.6, 7.6, 4.2, b) + R(3.4, 4.2, 5, 6.8, 2.5, a),

  /* ---------------- code and data ---------------- */

  // Curly braces. Drawn as strokes: see the note on BRACE above.
  braces: ([a]) =>
    `<g transform="translate(-9 0)">${stroked(BRACE, a, 2.8)}</g>` +
    mir(`<g transform="translate(-9 0)">${stroked(BRACE, a, 2.8)}</g>`),

  // Angle brackets with a slash between them — markup.
  angles: ([a, b]) =>
    stroked('M-4.4 -8.2-11.4 0-4.4 8.2', a, 3.2) +
    stroked('M4.4 -8.2 11.4 0 4.4 8.2', a, 3.2) +
    stroked('M2 -9.4-2 9.4', b, 3),

  // Two arrows passing each other — data transfer.
  exchange: ([a, b]) =>
    path('M-11.4 -8.2h15.6v-3.2a1.4 1.4 0 0 1 2.4-1l6.2 6.2a1.4 1.4 0 0 1 0 2l-6.2 6.2a1.4 1.4 0 0 1-2.4-1V-2.2h-15.6Z', a) +
    path('M11.4 8.2h-15.6v3.2a1.4 1.4 0 0 1-2.4 1l-6.2-6.2a1.4 1.4 0 0 1 0-2l6.2-6.2a1.4 1.4 0 0 1 2.4 1V2.2h15.6Z', b),

  // Plus over minus — diffs.
  plusMinus: ([a, b]) =>
    path('M-2.9 -11.6h5.8v3.9h3.9v5.8h-3.9v3.9h-5.8v-3.9h-3.9v-5.8h3.9Z', a) +
    bar(-6.4, 8, 6.4, 8, 5, b),

  // Arrows closing on a line — minified assets.
  compress: ([a, b]) =>
    bar(0, -11.4, 0, 11.4, 3.4, a) +
    path('M-11.6 -6.4 -4.4 0-11.6 6.4Z', b) + bar(-11.4, 0, -5.6, 0, 3.4, b) +
    path('M11.6 -6.4 4.4 0 11.6 6.4Z', b) + bar(11.4, 0, 5.6, 0, 3.4, b),

  // f(x) — functions. The letter is the tint, the parentheses full strength, so
  // the pair reads as a call rather than as two loose shapes.
  fx: ([a, b]) =>
    stroked('M-7.6 -10.6a9 9 0 0 0 0 21.2', a, 3.2) +
    stroked('M7.6 -10.6a9 9 0 0 1 0 21.2', a, 3.2) +
    bar(-3.6, -4.6, 3.6, 4.6, 3.2, b) +
    bar(3.6, -4.6, -3.6, 4.6, 3.2, b),

  // Fish hook — React hooks.
  hook: ([a, b]) =>
    stroked('M6.2 -9.4v-0.6a2.4 2.4 0 0 1 4.8 0v11.4a8 8 0 0 1-16 0v-1.6', a, 3.6) +
    C(8.6, -10, 2.6, b) +
    path('M-11.8 -1.2h5.2l-2.6 5Z', a),

  /* ---------------- windows and surfaces ---------------- */

  // Terminal — the screen is the tint, the prompt on it is full strength.
  terminal: ([a, b]) =>
    R(-11.6, -9.6, 23.2, 19.2, 3.2, b) +
    stroked('M-6.4 -3.4-1.6 1.2-6.4 5.8', a, 3) +
    bar(1, 5.8, 6.6, 5.8, 3, a),

  // Browser — the chrome is full strength, the page under it the tint.
  browser: ([a, b]) =>
    R(-11.6, -9.6, 23.2, 19.2, 3.2, b) +
    cut(
      a,
      'M-11.6 -6.4v-0.2a3 3 0 0 1 3-3h17.2a3 3 0 0 1 3 3v0.2Z',
      circD(-8.4, -7.9, 1.1),
      circD(-4.7, -7.9, 1.1),
      circD(-1, -7.9, 1.1)
    ) +
    bar(-6.6, 2, 6.6, 2, 3, a),

  // Dashboard — public/layouts.
  layout: ([a, b]) =>
    R(-11.2, -11.2, 22.4, 6.4, 2.4, a) +
    R(-11.2, -2.4, 8, 13.6, 2.4, b) +
    R(-1, -2.4, 12.2, 13.6, 2.4, b),

  // Stacked sheets — middleware. Only the top sheet is full strength.
  layers: ([a, b]) =>
    path('M-12 5.4 -8 3.4 0 7.4 8 3.4 12 5.4 0 11.4Z', b) +
    path('M-12 -0.6 -8 -2.6 0 1.4 8 -2.6 12 -0.6 0 5.4Z', b) +
    path('M0 -11.4 12 -5.4 0 0.6-12 -5.4Z', a),

  // Eye — views.
  eye: ([a, b]) =>
    path('M0 -8.8c6.6 0 11.4 4.9 13 8.8-1.6 3.9-6.4 8.8-13 8.8S-11.4 3.9-13 0C-11.4 -3.9-6.6 -8.8 0 -8.8Z', b) +
    C(0, 0, 5.2, a) + C(1.8, -1.8, 1.8, b),

  // Globe — public assets.
  globe: ([a, b]) =>
    C(0, 0, 11.6, b) +
    cut(a, ellD(0, 0, 5.6, 11.6), ellD(0, 0, 3, 9.2)) +
    bar(-11.4, 0, 11.4, 0, 2.6, a) +
    path('M-10.4 -5.6h20.8v2.6h-20.8ZM-10.4 3h20.8v2.6h-20.8Z', a),

  /* ---------------- objects ---------------- */

  // Shipping box — store. Lid in tint, tape at full strength.
  box: ([a, b]) =>
    path('M-11.6 -5.4 0 0.6v11.6l-11.6-6.2Z', a) +
    path('M11.6 -5.4 0 0.6v11.6l11.6-6.2Z', a) +
    path(isoTop(11.6), b) +
    path('M-5.8 -8.6 5.8 -2.6 2.9 -1.1-8.7 -7.1Z', a),

  // Photograph — images.
  picture: ([a, b]) =>
    R(-11.6, -9.4, 23.2, 18.8, 3.2, b) +
    C(-4.8, -3.4, 2.9, a) +
    path('M-11.6 9.4v-3.4l6.8-6.8 4.4 5.8 4.2-3.6 8 8Z', a),

  // Two beamed notes — audio.
  note: ([a, b]) =>
    path('M11 -11.6v3.8l-14.4 3.3v-3.8l12.8-2.96A1.6 1.6 0 0 1 11 -11.6Z', b) +
    bar(-1.7, -7.6, -1.7, 6.4, 3.4, b) + bar(9.4, -10.2, 9.4, 3.6, 3.4, b) +
    E(-5.4, 7, 4.6, 3.9, a) + E(5.7, 4.2, 4.6, 3.9, a),

  // Play — video.
  play: ([a, b]) => R(-11.6, -11.6, 23.2, 23.2, 5.4, b) + path('M-3.6 -6.8 7 0-3.6 6.8Z', a),

  // Zipped parcel — archives.
  zip: ([a, b]) =>
    R(-9.8, -11.6, 19.6, 23.2, 3.4, b) +
    path('M-2.2 -11.6h4.4v2.4h-4.4Zm0 4h4.4v2.4h-4.4Zm0 4h4.4v2.4h-4.4Z', a) +
    cut(a, rrD(-3.8, 0.6, 7.6, 9.4, 2.4), rrD(-1.3, 3.2, 2.6, 4.2, 1.3)),

  // Padlock — the shackle is the tint.
  padlock: ([a, b]) =>
    path('M0 -12a7 7 0 0 1 7 7v3.4h-4.2v-3.4A2.8 2.8 0 0 0 0 -7.8a2.8 2.8 0 0 0-2.8 2.8v3.4h-4.2v-3.4A7 7 0 0 1 0 -12Z', b) +
    cut(a, rrD(-9.6, -2, 19.2, 14, 3.2), circD(0, 3.4, 2.5) + 'M-1.2 3.4h2.4v4.6a1.2 1.2 0 0 1-2.4 0Z'),

  // Key — certificates.
  key: ([a, b]) =>
    cut(a, circD(-5, 0, 7), circD(-5, 0, 3)) +
    bar(0.4, 0, 11.2, 0, 3.6, b) +
    bar(6, 0, 6, 5.4, 3.2, b) +
    bar(10.4, 0, 10.4, 4.2, 3.2, b),

  // Award medal — licences.
  seal: ([a, b]) =>
    path('M-6.4 1.2h4.6v10.8L-4.1 9.6-6.4 12Z', b) +
    path('M6.4 1.2h-4.6v10.8L4.1 9.6 6.4 12Z', b) +
    C(0, -3.4, 8.6, a) +
    path('M0 -8.8 1.75 -5.25 5.6 -4.7 2.8 -1.95 3.5 1.9 0 0.1-3.5 1.9-2.8 -1.95-5.6 -4.7-1.75 -5.25Z', b),

  // Clock over its own history — changelog.
  history: ([a, b]) =>
    C(0, 0, 11.6, b) +
    cut(a, circD(0, 0, 11.6), circD(0, 0, 8.8)) +
    stroked('M0 -6V0.6h5', a, 3.2),

  // Brush — styles.
  brush: ([a, b]) =>
    rot(36,
      R(-3.7, -11.8, 7.4, 12.6, 2.4, b) +
      R(-4.6, -0.2, 9.2, 3.6, 1.2, a) +
      path('M-4.6 4.2h9.2v3.2A4.6 4.6 0 0 1 0 11.8 4.6 4.6 0 0 1-4.6 7.4Z', a)
    ),

  // Life ring — helpers.
  lifebuoy: ([a, b]) =>
    ring(0, 0, 11.6, 4, b) +
    C(0, 0, 5.4, a) +
    rot(45, bar(-9.4, 0, 9.4, 0, 3.4, a)) +
    rot(-45, bar(-9.4, 0, 9.4, 0, 3.4, a)),

  // Open book — docs. The right-hand page is full strength.
  book: ([a, b]) =>
    path('M-1 -8.6v18.8c-2.7-1.9-5.8-2.8-9.2-2.8h-1.4a1 1 0 0 1-1-1v-14.2a1 1 0 0 1 1-1h1.4c3.4 0 6.5 0.9 9.2 2.8Z', b) +
    path('M1 -8.6v18.8c2.7-1.9 5.8-2.8 9.2-2.8h1.4a1 1 0 0 0 1-1v-14.2a1 1 0 0 0-1-1h-1.4c-3.4 0-6.5 0.9-9.2 2.8Z', a),

  // Label — types.
  tag: ([a, b]) =>
    cut(
      a,
      'M-11.6 -9.4a2.2 2.2 0 0 1 2.2-2.2h9.6a3 3 0 0 1 2.12 0.88l9.6 9.6a2.2 2.2 0 0 1 0 3.11l-9.31 9.31a2.2 2.2 0 0 1-3.11 0l-9.6-9.6A3 3 0 0 1-11.6 -0.2Z',
      circD(-5.6, -5.6, 2.7)
    ) + C(-5.6, -5.6, 2.7, b),

  // Letterform — fonts.
  typeA: ([a, b]) =>
    cut(a, 'M-3 -11.6h6l7.6 18.6h-5.4l-1.3-3.4h-8.2l-1.3 3.4h-5.4Z', polyD([[-2.4, -0.2], [2.4, -0.2], [0, -6.4]])) +
    bar(-9.4, 10.4, 9.4, 10.4, 3, b),

  // Star — icon assets.
  star: ([a, b]) =>
    path('M0 -11.8 3.7 -4.2 12 -3 6 2.8 7.4 11-0 7.2-7.4 11-6 2.8-12 -3-3.7 -4.2Z', a) +
    path('M0 -5.6 1.85 -1.8 6 -1.2 3 1.7 3.7 5.8 0 3.9-3.7 5.8-3 1.7-6 -1.2-1.85 -1.8Z', b),

  /* ---------------- systems ---------------- */

  // Processor die — core.
  chip: ([a, b]) => {
    let pins = '';
    for (const d of [0, 90, 180, 270]) {
      pins += rot(d, bar(-5.6, -11.6, -5.6, -8, 2.8, b) + bar(0, -11.6, 0, -8, 2.8, b) + bar(5.6, -11.6, 5.6, -8, 2.8, b));
    }
    return pins + R(-8.8, -8.8, 17.6, 17.6, 3, a) + R(-4, -4, 8, 8, 1.8, b);
  },

  // Power plug — plugins.
  plug: ([a, b]) =>
    bar(-5.4, -11.6, -5.4, -5, 3.4, b) + bar(5.4, -11.6, 5.4, -5, 3.4, b) +
    path('M-10.4 -5h20.8v3.6A9.4 9.4 0 0 1 0 8 9.4 9.4 0 0 1-10.4 -1.4Z', a) +
    bar(0, 6.6, 0, 11.8, 3.4, b),

  // Server rack — the status lights are full strength.
  serverRack: ([a, b]) =>
    R(-11.6, -11, 23.2, 9.4, 2.6, b) + C(7.4, -6.3, 1.8, a) + bar(-8, -6.3, 1.6, -6.3, 2.6, a) +
    R(-11.6, 1.6, 23.2, 9.4, 2.6, b) + C(7.4, 6.3, 1.8, a) + bar(-8, 6.3, 1.6, 6.3, 2.6, a),

  // Flow chart — workflows.
  flow: ([a, b]) =>
    R(-11.6, -11.6, 12, 8.4, 2.6, a) +
    R(-0.4, 3.2, 12, 8.4, 2.6, b) +
    stroked('M-5.6 -3.2v6.8h11.2v-0.4', a, 3) +
    path('M5.6 6.4 3.2 2.2h4.8Z', a),

  // Fork in the road — routes.
  route: ([a, b]) =>
    stroked('M0 11.4V1.6', a, 3.6) +
    stroked('M0 2.6-7.2 -4.6', b, 3.6) + path('M-11.8 -11.8 -4 -10.4-10.4 -4Z', b) +
    stroked('M0 2.6 7.2 -4.6', b, 3.6) + path('M11.8 -11.8 4 -10.4 10.4 -4Z', b),

  // Share — one node feeding two.
  share: ([a, b]) =>
    bar(-6.6, 0, 6.8, -8, 3, b) + bar(-6.6, 0, 6.8, 8, 3, b) +
    C(-7.2, 0, 4.8, a) + C(7.6, -8.4, 4.4, b) + C(7.6, 8.4, 4.4, b),

  // Ghost — mocks and fixtures.
  ghost: ([a, b]) =>
    path('M0 -11.8a10.8 10.8 0 0 1 10.8 10.8v13.2l-3.6-2.7-3.6 2.7-3.6-2.7-3.6 2.7-3.6-2.7-3.6 2.7V-1A10.8 10.8 0 0 1 0 -11.8Z', a) +
    C(-4, -2.4, 2.4, b) + C(4, -2.4, 2.4, b),

  // Robot head — the face plate is the tint.
  robot: ([a, b]) =>
    bar(0, -12, 0, -9.2, 2.8, a) +
    R(-10.8, -9.2, 21.6, 18, 4.4, a) +
    bar(-12, -3.4, -12, 2.4, 3, a) + bar(12, -3.4, 12, 2.4, 3, a) +
    cut(b, rrD(-7.6, -5.8, 15.2, 11.2, 2.6), circD(-3.4, -0.6, 2), circD(3.4, -0.6, 2)),

  // Translate — i18n.
  translate: ([a, b]) =>
    path('M-11.6 -11.6h6.4v2.4h5.2v3.6h-1.6a13 13 0 0 1-2.4 5.2 13.6 13.6 0 0 0 2.4 1.7l-1.4 3.5a17 17 0 0 1-3.6-2.5 17 17 0 0 1-3.6 2.5l-1.4-3.5a13.6 13.6 0 0 0 2.4-1.7 13 13 0 0 1-2.4-5.2h-1.6v-3.6h5.2v-2.4Zm3.4 6h-3.2a8.4 8.4 0 0 0 1.6 2.9 8.4 8.4 0 0 0 1.6-2.9Z', a) +
    cut(b, 'M3.4 -1.6h4.6l5.4 13.2h-4.2l-0.9-2.4h-4.9l-0.9 2.4h-4.2Z', polyD([[4.3, 5.6], [7.1, 5.6], [5.7, 1.8]])),

  // Atom — contexts and providers.
  atom: ([a, b]) =>
    cut(b, ellD(0, 0, 11.8, 5), ellD(0, 0, 9.6, 2.8)) +
    rot(60, cut(b, ellD(0, 0, 11.8, 5), ellD(0, 0, 9.6, 2.8))) +
    rot(120, cut(b, ellD(0, 0, 11.8, 5), ellD(0, 0, 9.6, 2.8))) +
    C(0, 0, 3.6, a),

  // Leaf on a stem — Twig templates.
  leaf: ([a, b]) =>
    path('M11.4 -11.6c1.6 10-2.1 18-10 20.2-4.7 1.4-9.4-0.6-10.8-4.7-1.6-4.7 1.2-9.4 7.6-11.4 4.1-1.3 8.8-2.5 13.2-4.1Z', a) +
    stroked('M-10.8 11.2C-7.4 5-3 0.4 2.6 -3.2', b, 2.8),
} satisfies Record<string, Glyph>;

export type GlyphName = keyof typeof glyphs;
