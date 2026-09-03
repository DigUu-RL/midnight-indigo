/*
 * Pictogram library for the Midnight Indigo icon set.
 *
 * Every glyph is drawn inside a 24x24 box centred on (0,0) — coordinates run
 * from -12 to 12 — so the build script can drop any glyph into any container
 * with a single translate/scale and it lands optically centred.
 *
 * Hard rule: glyphs are FILL-ONLY. No child may set `stroke`. The folder icons
 * render each glyph twice — once in the editor background colour with a stroke
 * on the wrapping <g> to punch a halo out of the folder, then again in colour on
 * top — and that only yields a clean silhouette when nothing overrides the
 * inherited stroke. Holes are painted with `k` (the knock-out colour: the tile
 * fill on file icons, the editor background on folder overlays).
 */

/** A colour, written as a hex literal. */
export type Colour = string;

/*
 * The secondary colours a glyph may take. Two-tone marks (Python, Kotlin, the
 * HTML and CSS crests) take a single colour; the multi-colour ones (Julia,
 * CMake, GitLab, the Prettier bars) take a list. The seven glyphs that read it
 * annotate the parameter `any` locally, because tools/measure.ts deliberately
 * hands them a value that is both at once — an array that also answers to
 * toString() — so that one flat render can measure every glyph's ink.
 */
export type Extra = Colour | readonly Colour[];

export type Glyph = (f: Colour, k: Colour, extra?: Extra) => string;

const n = (v: number): number => Number(v.toFixed(2));

const R = (x: number, y: number, w: number, h: number, rx: number, f: Colour): string =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ''} fill="${f}"/>`;
const C = (cx: number, cy: number, r: number, f: Colour): string =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${f}"/>`;
const E = (cx: number, cy: number, rx: number, ry: number, f: Colour): string =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${f}"/>`;
const P = (d: string, f: Colour, eo?: boolean): string =>
  `<path d="${d}" fill="${f}"${eo ? ' fill-rule="evenodd"' : ''}/>`;
const G = (pts: string, f: Colour): string => `<polygon points="${pts}" fill="${f}"/>`;
const rot = (deg: number, body: string): string => `<g transform="rotate(${n(deg)})">${body}</g>`;
// Horizontal mirror. For a shape whose two halves face each other — a brace
// pair, a bracket pair — writing the second half by hand is what lets the two
// drift apart; deriving it guarantees they cannot.
const mir = (body: string): string => `<g transform="scale(-1 1)">${body}</g>`;
// Rounded-rectangle outline as a single sub-path, so it can be combined with
// another sub-path under fill-rule="evenodd" to make a frame.
const rrPath = (x: number, y: number, w: number, h: number, rx: number): string => {
  const r = Math.min(rx, w / 2, h / 2);
  return (
    `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)}` +
    `V${n(y + h - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(y + h)}` +
    `H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y + h - r)}` +
    `V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)}Z`
  );
};

const frame = (x: number, y: number, w: number, h: number, rx: number, t: number, f: Colour): string =>
  P(rrPath(x, y, w, h, rx) + rrPath(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(0.4, rx - t)), f, true);

const circlePath = (cx: number, cy: number, r: number): string =>
  `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;

const ring = (cx: number, cy: number, r: number, t: number, f: Colour): string =>
  P(circlePath(cx, cy, r) + circlePath(cx, cy, r - t), f, true);

const ellipsePath = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0Z`;

// A straight bar between two points — thin knock-out facets, branch lines, etc.
const bar = (x1: number, y1: number, x2: number, y2: number, w: number, f: Colour): string => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return `<g transform="translate(${n((x1 + x2) / 2)} ${n((y1 + y2) / 2)}) rotate(${n(ang)})">${R(-len / 2, -w / 2, len, w, 0, f)}</g>`;
};

const ringE = (cx: number, cy: number, rx: number, ry: number, t: number, f: Colour): string =>
  P(ellipsePath(cx, cy, rx, ry) + ellipsePath(cx, cy, rx - t, ry - t), f, true);

/* ------------------------------------------------------------------ *
 * Generic pictograms
 * ------------------------------------------------------------------ */

// Shared by `shield` and `shieldCheck`. The tick used to be laid over a call to
// `glyphs.shield`, which makes the literal reference itself while it is still
// being built — legal at runtime, but it leaves the whole library untyped.
const SHIELD = 'M0 -11.8 10.6 -8.2v7.5C10.6 5.8 6.2 10.3 0 12.2-6.2 10.3-10.6 5.8-10.6 -0.7v-7.5Z';

// Curly braces — JSON / CSS modules.
// The closing brace is the opening one mirrored. It used to be a second
// hand-written path, and that path was the first ROTATED rather than mirrored:
// the two braces ended up with their terminals swapped top-for-bottom (the
// left one ran to y 13.6, the right to 13.0), which read as a visible skew in
// the pair. Mirroring makes the symmetry structural.
const BRACE = 'M-2.4 -11.6a1.9 1.9 0 0 1 0 3.8 1.6 1.6 0 0 0-1.6 1.6v3.4a4.2 4.2 0 0 1-2.4 3.8 4.2 4.2 0 0 1 2.4 3.8v3.4a1.6 1.6 0 0 0 1.6 1.6 1.9 1.9 0 0 1 0 3.8 5.4 5.4 0 0 1-5.4-5.4v-3.4a1.6 1.6 0 0 0-1.6-1.6 1.9 1.9 0 0 1 0-3.8 1.6 1.6 0 0 0 1.6-1.6v-3.4a5.4 5.4 0 0 1 5.4-5.4Z';

// Key.
/*
 * The bits are struck perpendicular to the shaft, from a point on its centre
 * line, so the junction is an overlap rather than a coincidence. They used to
 * be horizontal rounded rects whose top-left corner was placed exactly on the
 * shaft's lower edge (x + y = 1.2) — a single-point contact that the corner
 * radius then rounded away entirely, leaving both bits floating 0.86 units off
 * the shaft. They also sat on the half of the shaft that is buried in the bow,
 * where there is no shaft to attach to; they now sit on the free half.
 */
const KEY_BIT = (u: number, f: Colour): string => {
  const p = 0.7071; // unit perpendicular to the 45° shaft
  const [ax, ay] = [u, -1.4 - u]; // on the shaft's centre line, x + y = -1.4
  const [tx, ty] = [ax + 4.1 * p, ay + 4.1 * p];
  return bar(ax, ay, tx, ty, 2.6, f) + C(tx, ty, 1.3, f);
};

export const glyphs = {
  lines: (f) =>
    R(-9, -8, 18, 2.8, 1.4, f) + R(-9, -2.4, 18, 2.8, 1.4, f) + R(-9, 3.2, 11, 2.8, 1.4, f),

  // Lines with leading bullets — log files.
  logLines: (f) =>
    C(-7.6, -6.6, 1.9, f) + R(-3.6, -8, 12.6, 2.8, 1.4, f) +
    C(-7.6, 0, 1.9, f) + R(-3.6, -1.4, 12.6, 2.8, 1.4, f) +
    C(-7.6, 6.6, 1.9, f) + R(-3.6, 5.2, 8, 2.8, 1.4, f),

  // Checklist — test files.
  listCheck: (f) =>
    P('M-10.6 -5.4 -7.4 -2.2 -1.6 -8 0.9 -5.5 -7.4 2 -13.1 -3.7Z', f) +
    R(2.6, -7.4, 9.4, 2.9, 1.45, f) +
    P('M-10.6 5.4 -7.4 8.6 -1.6 2.8 0.9 5.3 -7.4 13.6 -13.1 7.9Z', f) +
    R(2.6, 3.6, 9.4, 2.9, 1.45, f),

  // Table / spreadsheet grid.
  grid: (f, k) =>
    frame(-10.5, -9, 21, 18, 2.6, 2.4, f) +
    R(-10.5, -3.4, 21, 2.2, 0, f) +
    R(-10.5, 2.2, 21, 2.2, 0, f) +
    R(-3.6, -9, 2.2, 18, 0, f) +
    R(3.4, -9, 2.2, 18, 0, f),

  // Database cylinder.
  cylinder: (f, k) =>
    P('M-9.5 -6.6v13.2c0 2.6 4.25 4.6 9.5 4.6s9.5-2 9.5-4.6V-6.6Z', f) +
    E(0, -6.6, 9.5, 4.6, f) +
    E(0, -6.6, 5.6, 2.4, k) +
    R(-9.5, -1.6, 19, 2.2, 0, k) +
    R(-9.5, 3.4, 19, 2.2, 0, k),

  // Solid isometric cube.
  cube: (f, k) =>
    P('M0 -11 11 -5.2v11.4L0 12 -11 6.2V-5.2Z', f) +
    P('M0 -8.2 8 -4v1.1L0 -6.9 -8 -2.9V-4Z', k) +
    R(-1.2, -6.6, 2.4, 17, 1.2, k),

  // Three stacked blocks — modules.
  cubes: (f) =>
    R(-11, -11.5, 10.4, 10.4, 2.6, f) +
    R(0.6, -11.5, 10.4, 10.4, 2.6, f) +
    R(-5.2, 1.1, 10.4, 10.4, 2.6, f),

  // Jigsaw piece — components. Built as a square plus a knob and minus a socket
  // rather than one long outline: the corners stay crisp and the tab reads as a
  // tab instead of the shape bulging all over.
  puzzle: (f, k) =>
    C(0, -10.6, 4.1, f) +
    R(-10, -10, 20, 20, 2.6, f) +
    C(10.6, 0, 4.1, k),

  // Cog — services.
  gear: (f, k) => {
    let teeth = '';
    for (let i = 0; i < 8; i++) teeth += rot(i * 45, R(-2.3, -12, 4.6, 6, 1.4, f));
    return teeth + C(0, 0, 8.4, f) + C(0, 0, 3.5, k);
  },

  // Open cog ring — Rust.
  gearRing: (f, k) => {
    let teeth = '';
    for (let i = 0; i < 8; i++) teeth += rot(i * 45, R(-2, -12, 4, 5.5, 1.2, f));
    return teeth + ring(0, 0, 8.6, 2.9, f) + C(0, 0, 3.2, f);
  },

  // Wrench — utilities / config.
  wrench: (f) =>
    P(
      'M6.4 -12a6.6 6.6 0 0 0-6 9.4l-11.1 11.1a2.4 2.4 0 0 0 0 3.4l1.8 1.8a2.4 2.4 0 0 0 3.4 0L5.6 2.6A6.6 6.6 0 0 0 12 -5.4a0.9 0.9 0 0 0-1.5-0.4L6.9 -2.2 3.6 -5.5 7.2 -9.1A0.9 0.9 0 0 0 6.8 -10.6 6.6 6.6 0 0 0 6.4 -12Z',
      f
    ),

  // Hammer — build output.
  hammer: (f) =>
    rot(-38, R(-9.8, -11.2, 19.6, 7.2, 2.2, f) + R(-2.7, -5, 5.4, 16.2, 1.8, f)),

  // Lab flask — specs.
  flask: (f, k) =>
    P('M-4.4 -11.4h8.8a1.5 1.5 0 0 1 0 3h-0.7v5.3l7 12.1a2.4 2.4 0 0 1-2.1 3.6h-17a2.4 2.4 0 0 1-2.1-3.6l7-12.1v-5.3h-0.7a1.5 1.5 0 0 1 0-3Z', f) +
    P('M-4.6 4.2h9.2l2.4 4.2a0.9 0.9 0 0 1-0.8 1.4h-12.4a0.9 0.9 0 0 1-0.8-1.4Z', k),

  // Shield — guards / security.
  shield: (f) => P(SHIELD, f),

  // Shield with a tick — validators.
  shieldCheck: (f, k) =>
    P(SHIELD, f) +
    P('M-5.2 -0.6 -2 2.6 4.8 -4.2 7.2 -1.8 -2 7.4 -7.6 1.8Z', k),

  // Funnel — pipes.
  funnel: (f) =>
    P('M-11.4 -10.4h22.8a1 1 0 0 1 0.75 1.66L3 -0.6V9.4a1.4 1.4 0 0 1-0.7 1.2l-3.8 2.2a1.4 1.4 0 0 1-2.1-1.2V-0.6l-9.15-8.14A1 1 0 0 1-11.4 -10.4Z', f),

  // Sparkle wand — directives.
  wand: (f) =>
    P('M6.6 -12 12 -6.6-6.6 12-12 6.6Z', f) +
    P('M4.6 -11.2 6 -7.6 9.6 -6.2 6 -4.8 4.6 -1.2 3.2 -4.8-0.4 -6.2 3.2 -7.6Z', f) +
    P('M-8.4 -9.6 -7.6 -7.4 -5.4 -6.6 -7.6 -5.8 -8.4 -3.6 -9.2 -5.8 -11.4 -6.6 -9.2 -7.4Z', f),

  // Book — docs / stories.
  book: (f, k) =>
    P('M-10.6 -10.6h16.4a4.8 4.8 0 0 1 4.8 4.8v16.4H-6.6a4 4 0 0 0-4 4Z', f) +
    P('M-10.6 8.4a4 4 0 0 1 4-4h15.2v3.2H-6.6a0.8 0.8 0 0 0 0 1.6h9.4v3.2H-6.6a4 4 0 0 1-4-4Z', f) +
    R(-6.4, -6.8, 10.2, 2.6, 1.3, k) +
    R(-6.4, -1.8, 7, 2.6, 1.3, k),

  // Label / tag — types.
  tag: (f, k) =>
    P('M-11.4 -9.8a2 2 0 0 1 2-2h9.2a3 3 0 0 1 2.1 0.88l9.7 9.7a2 2 0 0 1 0 2.84l-9.4 9.4a2 2 0 0 1-2.84 0l-9.7-9.7A3 3 0 0 1-11.4 -0.6Z', f) +
    C(-5.4, -5.8, 2.5, k),

  // Arrows collapsing onto a centre line — minified assets.
  compress: (f) =>
    R(-1.7, -11.4, 3.4, 22.8, 1.7, f) +
    R(-11.4, -1.7, 5.6, 3.4, 1.7, f) + G('-6.2,-6.4 -6.2,6.4 -2.9,0', f) +
    R(5.8, -1.7, 5.6, 3.4, 1.7, f) + G('6.2,-6.4 6.2,6.4 2.9,0', f),

  braces: (f) => P(BRACE, f) + mir(P(BRACE, f)),

  // Angle brackets — markup.
  angles: (f) =>
    P('M-3.6 -9.2 -12 0l8.4 9.2 2.9-2.65L-6.1 0l5.4-6.55Z', f) +
    P('M3.6 -9.2 12 0l-8.4 9.2-2.9-2.65L6.1 0 0.7-6.55Z', f),

  // Shell prompt.
  prompt: (f) =>
    P('M-11.2 -8.4 -8.4 -11.2 0 -2.8a1.4 1.4 0 0 1 0 2L-8.4 7.6-11.2 4.8-4.4 -1.8Z', f) +
    R(0.6, 6.4, 11, 3.2, 1.6, f),

  // Terminal window with a prompt inside.
  terminal: (f, k) =>
    P(rrPath(-11.5, -9.5, 23, 19, 3) + rrPath(-9.1, -3.6, 18.2, 10.7, 1.2), f, true) +
    R(-11.5, -6.4, 23, 2, 0, f) +
    P('M-6.6 -1.4 -5.1 -2.9 -0.6 1.6a0.8 0.8 0 0 1 0 1.1l-4.5 4.5-1.5-1.5 3.5-3.55Z', f) +
    R(0.4, 4.4, 6.2, 1.9, 0.95, f),

  // Browser window.
  browser: (f, k) =>
    P(rrPath(-11.5, -9.5, 23, 19, 3) + rrPath(-9.1, -3.6, 18.2, 10.7, 1.2), f, true) +
    R(-11.5, -6.4, 23, 2, 0, f) +
    C(-8, -8, 1.15, k) + C(-4.2, -8, 1.15, k) + C(-0.4, -8, 1.15, k),

  // Globe — public assets / i18n.
  globe: (f) =>
    ring(0, 0, 11.4, 2.6, f) +
    R(-11.2, -1.4, 22.4, 2.8, 0, f) +
    ringE(0, 0, 5.4, 11.4, 2.5, f),

  // Power plug — plugins.
  plug: (f) =>
    R(-7.4, -12, 3.4, 7.4, 1.7, f) +
    R(4, -12, 3.4, 7.4, 1.7, f) +
    P('M-10.4 -3.6h20.8a1.4 1.4 0 0 1 1.4 1.4v1.2A8.6 8.6 0 0 1 3 7.4v3.2a1.4 1.4 0 0 1-1.4 1.4h-3.2a1.4 1.4 0 0 1-1.4-1.4V7.4A8.6 8.6 0 0 1-11.8 -1v-1.2A1.4 1.4 0 0 1-10.4 -3.6Z', f),

  // Processor die — core.
  chip: (f, k) => {
    let pins = '';
    for (const d of [0, 90, 180, 270]) {
      pins += rot(d, R(-6.2, -12, 2.6, 4.2, 1.3, f) + R(-1.3, -12, 2.6, 4.2, 1.3, f) + R(3.6, -12, 2.6, 4.2, 1.3, f));
    }
    return pins + P(rrPath(-8.4, -8.4, 16.8, 16.8, 2.6) + rrPath(-4.4, -4.4, 8.8, 8.8, 1.4), f, true);
  },

  // Stacked layers — middleware.
  layers: (f) =>
    P('M0 -12 12.2 -6.2 0 -0.4-12.2 -6.2Z', f) +
    P('M-12.2 0.4 -8.4 -1.4 0 2.6 8.4 -1.4 12.2 0.4 0 6.2Z', f) +
    P('M-12.2 6.4 -8.4 4.6 0 8.6 8.4 4.6 12.2 6.4 0 12.2Z', f),

  // Share — one node feeding two.
  share: (f) =>
    bar(-6.4, -1.8, 6.4, -7.8, 2.9, f) +
    bar(-6.4, 1.8, 6.4, 7.8, 2.9, f) +
    C(-7.6, 0, 4.6, f) + C(7.6, -8.4, 4.6, f) + C(7.6, 8.4, 4.6, f),

  // Fork in the road — routes.
  route: (f, k) =>
    bar(0, 11.8, 0, 1, 3.6, f) +
    bar(0, 2.4, -7.2, -4.8, 3.6, f) + G('-11.8,-11.8 -4.4,-10.4 -10.4,-4.4', f) +
    bar(0, 2.4, 7.2, -4.8, 3.6, f) + G('11.8,-11.8 4.4,-10.4 10.4,-4.4', f),

  // Eye — views.
  eye: (f, k) =>
    P('M0 -8.6c6.4 0 11 4.6 12.6 8.6-1.6 4-6.2 8.6-12.6 8.6S-11 4-12.6 0C-11 -4-6.4 -8.6 0 -8.6Z', f) +
    C(0, 0, 5, k) + C(0, 0, 2.6, f),

  // Dashboard blocks — layouts.
  layout: (f) =>
    R(-11, -11, 22, 6.4, 2, f) +
    R(-11, -2.2, 8.6, 13.2, 2, f) +
    R(-0.1, -2.2, 11.1, 13.2, 2, f),

  // Sliders — controllers.
  sliders: (f, k) =>
    R(-11.4, -9.4, 22.8, 3.2, 1.6, f) + C(3.2, -7.8, 4.4, f) + C(3.2, -7.8, 1.7, k) +
    R(-11.4, -1.6, 22.8, 3.2, 1.6, f) + C(-4.6, 0, 4.4, f) + C(-4.6, 0, 1.7, k) +
    R(-11.4, 6.2, 22.8, 3.2, 1.6, f) + C(5.4, 7.8, 4.4, f) + C(5.4, 7.8, 1.7, k),

  // Two-way arrows — DTOs / data transfer.
  exchange: (f) =>
    P('M-11.4 -6.4h16.4v-3.6a1.2 1.2 0 0 1 2.05-0.85l5.6 5.6a1.2 1.2 0 0 1 0 1.7l-5.6 5.6A1.2 1.2 0 0 1 5 1.2V-2.4h-16.4Z', f) +
    P('M11.4 6.4h-16.4v3.6a1.2 1.2 0 0 1-2.05 0.85l-5.6-5.6a1.2 1.2 0 0 1 0-1.7l5.6-5.6A1.2 1.2 0 0 1-5 -1.2V2.4h16.4Z', f),

  // Star — icon assets.
  star: (f) =>
    P('M0 -12 3.7 -4.5 12 -3.3 6 2.6 7.4 10.9 0 7 -7.4 10.9-6 2.6-12 -3.3-3.7 -4.5Z', f),

  // Paint brush — styles.
  brush: (f, k) =>
    P('M-11.6 -11.6h23.2v9.4a2 2 0 0 1-2 2h-19.2a2 2 0 0 1-2-2Z', f) +
    // Runs up to y -0.4 so it bites into the head, which ends at -0.2. It used to
    // start at 0.4, leaving the ferrule floating below the brush.
    R(-2.4, -0.4, 4.8, 5, 0, f) +
    P('M-3.8 4.2h7.6v3.6A4.2 4.2 0 0 1 0 12a4.2 4.2 0 0 1-3.8-4.2Z', f) +
    R(-1.1, 6.6, 2.2, 3, 1.1, k),

  // Life ring — helpers.
  lifebuoy: (f, k) =>
    ring(0, 0, 11.6, 3.6, f) + ring(0, 0, 6.2, 2.4, f) +
    rot(45, R(-1.9, -11.6, 3.8, 23.2, 0, f)) +
    rot(-45, R(-1.9, -11.6, 3.8, 23.2, 0, f)) +
    C(0, 0, 3.8, k),

  // Shipping box — assets / packages.
  box: (f, k) =>
    P('M0 -11.4 11.6 -6v12.2L0 11.6-11.6 6.2V-6Z', f) +
    P('M-11.6 -6 0 -0.6 11.6 -6l0 2.6L0 4 -11.6 -1.4Z', k) +
    P('M-5.8 -8.7 5.8 -3.3v3L-5.8 -5.7Z', k),

  // Photograph — images. Solid, with the sun and hills knocked out, so it stays
  // legible at 16px where a thin picture frame turns to mush.
  picture: (f, k) =>
    R(-11.4, -9, 22.8, 18, 3, f) +
    C(-4.6, -3.2, 3, k) +
    P('M-11.4 9 -3 -1.4 2.4 4.8 6.4 0.2 11.4 6V9Z', k),

  // Musical note — audio.
  note: (f) =>
    P('M11 -11.4v14.9a4.6 4.6 0 1 1-3.6-4.49V-5.6l-10.8 2.5V7.7a4.6 4.6 0 1 1-3.6-4.49V-4.6a2 2 0 0 1 1.55-1.95l14.4-3.34A1.6 1.6 0 0 1 11 -11.4Z', f),

  // Play triangle — video.
  play: (f, k) =>
    C(0, 0, 11.8, f) + P('M-3.6 -6.4 7 0-3.6 6.4Z', k),

  // Zipped parcel — archives.
  zip: (f, k) =>
    R(-9.6, -11.4, 19.2, 22.8, 3, f) +
    R(-2.2, -11.4, 4.4, 14.8, 0, k) +
    R(-2.2, -9.8, 4.4, 2.2, 0, f) + R(-2.2, -5.8, 4.4, 2.2, 0, f) + R(-2.2, -1.8, 4.4, 2.2, 0, f) +
    R(-3.8, 2.6, 7.6, 8.4, 1.9, f) + R(-1.3, 4.9, 2.6, 3.6, 1.3, k),

  // Padlock.
  padlock: (f, k) =>
    P('M0 -12a6.6 6.6 0 0 1 6.6 6.6v3h-3.9v-3A2.7 2.7 0 0 0 0 -8.1a2.7 2.7 0 0 0-2.7 2.7v3h-3.9v-3A6.6 6.6 0 0 1 0 -12Z', f) +
    R(-9.4, -2.4, 18.8, 14.4, 2.8, f) +
    C(0, 4.2, 2.4, k) + R(-1.2, 4.2, 2.4, 4, 1.2, k),

  key: (f, k) =>
    C(-4.6, -4.6, 7.4, f) + C(-4.6, -4.6, 2.9, k) +
    P('M0.6 0.6 11.4 -10.2l-2.6-2.6-13.4 13.4 2.6 2.6Z', f) +
    KEY_BIT(4.6, f) + KEY_BIT(7.6, f),

  // Award seal — certificates / licences.
  seal: (f, k) =>
    C(0, -3.6, 8.4, f) + C(0, -3.6, 4.2, k) +
    // The ribbon's top edge is tucked inside the disc, which reaches y 4.8 at the
    // centre and rises away from it. Starting the edge at 3.4 put the whole thing
    // below the disc — closest approach 0.53 units — so the medal came apart.
    P('M-6 1.8 -6 12 0 9 6 12 6 1.8 0 4.4Z', f),

  // Clock with a list — changelog.
  history: (f, k) =>
    R(-11.6, -10.6, 12.6, 3, 1.5, f) +
    R(-11.6, -4.6, 9.4, 3, 1.5, f) +
    R(-11.6, 1.4, 8, 3, 1.5, f) +
    C(4.6, 4.6, 7.4, f) + C(4.6, 4.6, 4.6, k) +
    P('M3.7 0.9h1.8v3.9l2.6 1.5-0.9 1.55-3.5-2Z', f),

  // Plus over minus — diffs.
  plusMinus: (f) =>
    P('M-2.4 -11.4h4.8v3.6h3.6v4.8h-3.6v3.6h-4.8v-3.6h-3.6v-4.8h3.6Z', f) +
    R(-6, 5.4, 12, 4.8, 1.6, f),

  // Fish hook — React hooks.
  hook: (f) =>
    P('M6.2 -12a4.6 4.6 0 0 1 4.6 4.6v3.6h-4.2v-3.6a0.4 0.4 0 0 0-0.4-0.4 0.4 0.4 0 0 0-0.4 0.4v11.2a7.6 7.6 0 0 1-15.2 0v-1.2h4.2v1.2a3.4 3.4 0 0 0 6.8 0v-11.2A4.6 4.6 0 0 1 6.2 -12Z', f) +
    P('M-11.4 2.4h6.2l-3.1 5.4Z', f),

  // Function braces with a rising curve — functions.
  fx: (f) =>
    P('M-6.2 -11.4a1.8 1.8 0 0 1 0 3.6 1.4 1.4 0 0 0-1.4 1.4v2.6h2.6v3.6h-2.6v11.2h-3.8V-0.2h-2.2v-3.6h2.2v-2.6a5 5 0 0 1 5-5Z', f) +
    P('M0.8 -3.8h4.4l2.2 3.6 2.2-3.6h4.4l-4.4 6.8 4.4 6.8h-4.4l-2.2-3.6-2.2 3.6h-4.4l4.4-6.8Z', f),

  // Server rack.
  serverRack: (f, k) =>
    P(rrPath(-11.4, -11.2, 22.8, 9.4, 2.2) + rrPath(-8.8, -8.6, 17.6, 4.2, 1), f, true) +
    C(6.4, -6.5, 1.4, f) +
    P(rrPath(-11.4, 1.8, 22.8, 9.4, 2.2) + rrPath(-8.8, 4.4, 17.6, 4.2, 1), f, true) +
    C(6.4, 6.5, 1.4, f),

  // Flow chart — workflows.
  flow: (f, k) =>
    P(rrPath(-11.6, -11.6, 10.4, 8, 2) + rrPath(-9.2, -9.2, 5.6, 3.2, 0.8), f, true) +
    P(rrPath(1.2, 3.6, 10.4, 8, 2) + rrPath(3.6, 6, 5.6, 3.2, 0.8), f, true) +
    R(-8, -3.6, 3.2, 7.4, 0, f) +
    P('M-8 0.6h12.4v3.2h-12.4Z', f) +
    P('M-6.4 -1.4 -2.4 2.2-6.4 5.8Z', f),

  // Ghost — mocks / fixtures.
  ghost: (f, k) =>
    P('M0 -11.6a10.4 10.4 0 0 1 10.4 10.4v12.2l-3.5-2.6-3.5 2.6-3.4-2.6-3.4 2.6-3.5-2.6-3.5 2.6V-1.2A10.4 10.4 0 0 1 0 -11.6Z', f) +
    C(-3.8, -2.6, 2.2, k) + C(3.8, -2.6, 2.2, k),

  // Translate — i18n.
  translate: (f, k) =>
    P('M-11.6 -11.6h11v3.4h-3.6v1.6h3.6v3.4h-1.35a11.6 11.6 0 0 1-2.05 4.2 12 12 0 0 0 2.15 1.4l-1.3 3.3a15 15 0 0 1-3.4-2.2 15 15 0 0 1-3.4 2.2l-1.3-3.3a12 12 0 0 0 2.15-1.4 11.6 11.6 0 0 1-2.05-4.2h-1.35v-3.4h3.6v-1.6h-2.7ZM-7.6 -3.2a7.6 7.6 0 0 0 1.5 2.6 7.6 7.6 0 0 0 1.5-2.6Z', f) +
    P('M4.4 -1.6h4.2l5 13.2h-3.9l-0.95-2.7h-4.5l-0.95 2.7h-3.9ZM5 5.6h2.9L6.45 1.4Z', f),

  // Ruler and pen — fonts (rendered as a serif "A" instead: see below).
  typeA: (f) =>
    P('M-2.6 -11.6h5.2l7.8 23.2h-5.2l-1.55-4.9h-7.3l-1.55 4.9h-5.2ZM-2.4 2.6h4.8L0 -5Z', f) +
    R(-8.6, 9.4, 17.2, 2.2, 1.1, f),

  /* ------------------------------------------------------------------ *
   * Brand and language marks
   * ------------------------------------------------------------------ */
  // React / JSX — nucleus plus three orbits. The orbits are deliberately fatter
  // and taller than the real logo: at 16px a faithfully thin ring closes up into
  // a solid blob, and the openings are what make it read as React at all.
  // The nucleus is sized to meet the inner edge of the orbits (inner ry 3.0): any
  // smaller and the gap between them reads as a ragged hexagon rather than a core.
  atom: (f) =>
    C(0, 0, 3.3, f) +
    ringE(0, 0, 11.8, 5.2, 2.2, f) +
    rot(60, ringE(0, 0, 11.8, 5.2, 2.2, f)) +
    rot(120, ringE(0, 0, 11.8, 5.2, 2.2, f)),

  // Python — two interlocking hooks.
  // `alt` is annotated locally: see the note on Extra above.
  python: (f, k, alt: any) => {
    const hook =
      'M-2.6 -12h5.2a4.6 4.6 0 0 1 4.6 4.6v4.8a4.6 4.6 0 0 1-4.6 4.6h-7.4a4.6 4.6 0 0 0-4.6 4.6v-8.6a4.6 4.6 0 0 1 4.6-4.6h9.4v-1.4h-11.8a4.6 4.6 0 0 1 4.6-4Z';
    return (
      P(hook, f) + C(1.6, -8.4, 1.5, k) +
      rot(180, P(hook, alt || f) + C(1.6, -8.4, 1.5, k))
    );
  },

  // Java / coffee — steaming cup.
  cup: (f, k) =>
    P('M-8.4 -3.2h13v5.4a6.5 6.5 0 0 1-13 0Z', f) +
    P('M5.6 -2.2h1.9a4.3 4.3 0 0 1 0 8.6h-1.3v-3.4h1.3a0.9 0.9 0 0 0 0-1.8h-1.9Z', f) +
    R(-10.4, 7.4, 17, 3.2, 1.6, f) +
    P('M-5 -11.8a3.4 3.4 0 0 1 1.2 4.2 3.4 3.4 0 0 0 0.4 3.4h-3.4a4.6 4.6 0 0 1-0.2-4.2 1.6 1.6 0 0 0-0.6-2Z', f) +
    P('M1.2 -11.8a3.4 3.4 0 0 1 1.2 4.2 3.4 3.4 0 0 0 0.4 3.4h-3.4a4.6 4.6 0 0 1-0.2-4.2 1.6 1.6 0 0 0-0.6-2Z', f),

  // Docker — whale carrying containers.
  whale: (f, k) => {
    let boxes = '';
    const w = 4.2, h = 3.6, gap = 0.9;
    for (let col = 0; col < 4; col++) boxes += R(-10.2 + col * (w + gap), -1.4, w, h, 0.5, f);
    for (let col = 1; col < 4; col++) boxes += R(-10.2 + col * (w + gap), -5.9, w, h, 0.5, f);
    boxes += R(-10.2 + 2 * (w + gap), -10.4, w, h, 0.5, f);
    return (
      boxes +
      P('M-11.8 3.2h21.6a1 1 0 0 1 1 1.2 8.6 8.6 0 0 1-8.5 7.2h-6a8.6 8.6 0 0 1-8.5-7.2 1 1 0 0 1 1-1.2Z', f) +
      // The tail rides on the hull. It used to start at x 9.4, which put it 0.1
      // units from the top-right container — close enough to read as a fused
      // seam — and left it touching nothing at all.
      P('M10 0.6a4.4 4.4 0 0 1 3.4 1.4l-1.6 2a2.4 2.4 0 0 0-1.8-0.8Z', f)
    );
  },

  // Ruby — cut gem, facets knocked out of the body.
  gem: (f, k) =>
    P('M-6.6 -10.8h13.2L11.8 -2.4 0 11.8-11.8 -2.4Z', f) +
    bar(-11.8, -2.4, 11.8, -2.4, 1.7, k) +
    bar(-6.6, -10.8, -4.4, -2.4, 1.5, k) +
    bar(6.6, -10.8, 4.4, -2.4, 1.5, k) +
    bar(-4.4, -2.4, 0, 11.8, 1.5, k) +
    bar(4.4, -2.4, 0, 11.8, 1.5, k),

  // Vue — nested chevrons.
  vue: (f, k) =>
    P('M-12 -8.4h4.8L0 4.2 7.2 -8.4H12L0 11.6Z', f) +
    P('M-6 -8.4h3.4L0 -3.8 2.6 -8.4H6L0 1.6Z', k),

  // Kotlin — the square whose right edge folds in to the centre, split in two.
  kotlin: (f, k, alt: any) =>
    G('-11.6,-11.6 11.6,-11.6 0,0 -11.6,0', alt || f) +
    G('-11.6,0 0,0 11.6,11.6 -11.6,11.6', f),

  // Swift — the swift bird as a single swoosh.
  swift: (f) =>
    P('M-8.6 -10.4c5.4 3.2 9.6 6.4 12.4 9.6a24 24 0 0 0-4.2-9.6c4.4 3.4 8.2 8 9.4 12.6a8.6 8.6 0 0 1-1 7.2c1.4 1.6 2 3 2 3s-3.4-2.2-7.6-2c-5.4 0.2-10.4-2.6-13.4-6.6 3.6 2.2 8.4 3.6 12.6 2.2-4.2-1.6-8.8-5.6-12-9.8 3.2 2.6 7.4 5.2 10.6 6-3.4-3-7-7.4-9.2-12.6Z', f),

  // Elixir — droplet.
  drop: (f, k) =>
    P('M0 -12c4.4 4.8 8.6 8.4 8.6 14a8.6 8.6 0 0 1-17.2 0c0-5.6 4.2-9.2 8.6-14Z', f) +
    P('M-2.4 -3.6a10 10 0 0 0-2.6 6.2 4.6 4.6 0 0 0 2.2 3.8 6.6 6.6 0 0 1-2.8-5.2 8.4 8.4 0 0 1 3.2-4.8Z', k),

  // Lua — moon and satellite.
  lua: (f, k) =>
    C(-2, 1, 10.2, f) + C(3.4, -3.4, 3.4, k) + C(7.8, -8, 3.4, f),

  // Julia — the three dots.
  julia: (f, k, colors: any) => {
    const [a, b, c] = colors || [f, f, f];
    return C(-6.4, 5.2, 5.9, a) + C(0, -6.4, 5.9, b) + C(6.4, 5.2, 5.9, c);
  },

  // Nim — crown.
  crown: (f, k) =>
    P('M-11.6 -6.6 -5.4 -1 0 -9.4 5.4 -1 11.6 -6.6 9.2 8.4h-18.4Z', f) +
    // Overlaps the body, which ends at y 8.4. The band used to start at 8.6,
    // leaving a 0.2-unit seam straight across the crown.
    R(-9.6, 8.2, 19.2, 3.6, 1.4, f),

  // GraphQL — hexagon with nodes.
  graphql: (f, k) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 90);
      pts.push([n(Math.cos(a) * 10.4), n(Math.sin(a) * 10.4)]);
    }
    let edges = '';
    for (let i = 0; i < 6; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % 6];
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      edges += `<g transform="translate(${n((x1 + x2) / 2)} ${n((y1 + y2) / 2)}) rotate(${n(ang)})">${R(-len / 2, -1.15, len, 2.3, 1.15, f)}</g>`;
    }
    edges += `<g transform="rotate(-60)">${R(-1.15, -10.4, 2.3, 20.8, 1.15, f)}</g>`;
    edges += `<g transform="rotate(60)">${R(-1.15, -10.4, 2.3, 20.8, 1.15, f)}</g>`;
    edges += R(-1.15, -10.4, 2.3, 20.8, 1.15, f);
    let nodes = '';
    for (const [x, y] of pts) nodes += C(x, y, 3.4, f);
    return edges + nodes;
  },

  // Hollow hexagon — ESLint.
  hexFrame: (f, k) => {
    const hex = (r: number): string => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 90);
        pts.push(`${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)}`);
      }
      return `M${pts.join('L')}Z`;
    };
    return P(hex(11.8) + hex(7.4), f, true) + P('M-3.4 -3.4 0 -1.4-3.4 0.6ZM0.4 1.4h4v2h-4Z', f);
  },

  // Prettier — its signature stack of coloured bars.
  prettierBars: (f, k, colors: any) => {
    const c = colors || [f, f, f, f, f];
    const row = (y: number, segs: [number, number][]): string => {
      let out = '';
      let x = -11.4;
      for (const [w, ci] of segs) {
        out += R(x, y, w, 5.4, 2.2, c[ci % c.length]);
        x += w + 1.8;
      }
      return out;
    };
    return (
      row(-10.2, [[9.6, 0], [11.4, 1]]) +
      row(-2.7, [[6, 2], [6, 3], [7.2, 4]]) +
      row(4.8, [[12.6, 1], [8.4, 0]])
    );
  },

  // Webpack — wireframe cube.
  webpackCube: (f, k) =>
    P('M0 -11.8 11.4 -5.6v11.2L0 11.8-11.4 5.6V-5.6Z', f) +
    P('M0 -8.4 8.4 -4v8L0 8.4-8.4 4V-4Z', k) +
    P('M0 -5.6 5.8 -2.4v5.6L0 6-5.8 3.2V-2.4Z', f),

  // Vite / Zap — lightning bolt.
  bolt: (f) => P('M2.4 -12-9 2.4h6.6L-1.6 12 11 -2.4H4Z', f),

  // Rollup — circular arrow.
  refresh: (f, k) =>
    P('M0 -11.2a11.2 11.2 0 1 1-9.8 5.8l3.6 2a7.1 7.1 0 1 0 6.2-3.7Z', f) +
    P('M-0.6 -14.4 6.6 -9.6-0.6 -4.8Z', f),

  // Jest — wizard hat.
  wizardHat: (f, k) =>
    P('M-1 -12.2 8 4.6-6.6 6.4Z', f) +
    P('M-11.6 6.2 9.2 3.6l0.9 3.2a1.6 1.6 0 0 1-1.2 2L-8.6 11.6a1.6 1.6 0 0 1-1.9-1.2Z', f) +
    C(2.4, -1.6, 1.9, k),

  // Twig — leaf on a stem.
  leaf: (f, k) =>
    P('M11 -11.6c1.6 9.6-2 17.4-9.6 19.6-4.6 1.4-9-0.6-10.4-4.6-1.6-4.6 1.2-9 7.4-11 4-1.2 8.4-2.4 12.6-4Z', f) +
    P('M-11.6 11.6c2.6-5 6.6-9.4 11.6-12.6l1.4 2.2c-4.4 2.8-8 6.6-10.2 11Z', k),

  // Fish — the fish shell.
  fish: (f, k) =>
    P('M-12 -6.4c5-3.6 12.4-3.6 17.4 0.4l5.6-3.6-1.6 6.4 1.6 6.4-5.6-3.6c-5 4-12.4 4-17.4 0.4 2.6-1.8 4-4 4-3.2 0-1.2-1.4-3.4-4-3.2Z', f) +
    C(-6.4, -1.6, 1.7, k),

  // Apache feather.
  feather: (f, k) =>
    P('M11.4 -11.6c-9.4 0.4-17 5.6-19.4 13.6l-3.4 3.4a1.4 1.4 0 0 0 0 2l1.2 1.2a1.4 1.4 0 0 0 2 0l3.4-3.4c8-2.4 13.2-10 16.2-16.8Z', f) +
    P('M6.6 -6.6c-4.2 1-7.8 3.2-10.2 6.4l-1.6-2c2.8-3.4 6.8-5.6 11.4-6.6Z', k),

  // Robot head.
  robot: (f, k) =>
    R(-1.4, -12, 2.8, 3.6, 1.4, f) + C(0, -12, 2, f) +
    P(rrPath(-10.6, -8.4, 21.2, 16.6, 4), f) +
    C(-4.6, -1.4, 2.6, k) + C(4.6, -1.4, 2.6, k) +
    R(-4.4, 3.6, 8.8, 2.2, 1.1, k) +
    R(-12, -4.4, 2.6, 7.4, 1.3, f) + R(9.4, -4.4, 2.6, 7.4, 1.3, f),

  // Jenkins butler.
  butler: (f, k) =>
    P('M0 -12a7.4 7.4 0 0 1 7.4 7.4c0 3.4-1.4 5.6-3 6.8l0.6 2.2 5 2a4 4 0 0 1 2.4 3.6v1.6h-24.8v-1.6a4 4 0 0 1 2.4-3.6l5-2 0.6-2.2c-1.6-1.2-3-3.4-3-6.8A7.4 7.4 0 0 1 0 -12Z', f) +
    C(-2.8, -5.2, 1.5, k) + C(2.8, -5.2, 1.5, k) +
    P('M0 5.6 4.4 8-0.4 11.6-4.4 8Z', k),

  // GitLab tanuki — the logo is literally five triangles.
  gitlab: (f, k, colors: any) => {
    const c = colors || [f, f, f];
    return (
      P('M0 11.8-4.6 -2.4h9.2Z', c[0]) +
      P('M0 11.8-11.6 -2.4h7L0 11.8Z', c[1]) +
      P('M-11.6 -2.4-13 -6.8a1 1 0 0 1 0.36-1.1L0 11.8Z', c[2]) +
      P('M0 11.8 11.6 -2.4h-7L0 11.8Z', c[1]) +
      P('M11.6 -2.4 13 -6.8a1 1 0 0 0-0.36-1.1L0 11.8Z', c[2]) +
      P('M-8.6 -11.4-4.6 -2.4h-7Z', c[0]) +
      P('M8.6 -11.4 4.6 -2.4h7Z', c[0])
    );
  },

  // Azure — the two chevron slabs.
  azure: (f, k) =>
    P('M-1.4 -11.6 5.2 -11.6 11.8 8.6-3.4 11.6 4 6.4-1 -4Z', f) +
    P('M-1.6 -8.2 3.2 4-12 8.6Z', f),

  // pnpm — nine squares with the corner missing.
  grid9: (f, k) => {
    let out = '';
    const s = 6.4, g = 1.4, o = -11.2;
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        if (r === 0 && c === 0) continue;
        out += R(o + c * (s + g), o + r * (s + g), s, s, 1.2, f);
      }
    return out;
  },

  // Yarn — ball of wool, wound as a crosshatch.
  yarn: (f, k) =>
    C(0, 0, 11.6, f) +
    bar(-11.4, -4.2, 8.2, 10.2, 1.8, k) +
    bar(-8.2, -10.2, 11.4, 4.2, 1.8, k) +
    bar(-4.2, -11.4, 10.2, 8.2, 1.8, k) +
    bar(-10.2, -8.2, 4.2, 11.4, 1.8, k),

  // Git — a branch merging back into the trunk.
  git: (f, k) =>
    bar(6.8, -7.6, 6.8, 0, 3.4, f) +
    bar(6.8, 0, -6.8, 0, 3.4, f) +
    C(6.8, 0, 1.7, f) +
    bar(-6.8, -7.6, -6.8, 7.6, 3.4, f) +
    C(-6.8, -7.6, 4.8, f) + C(-6.8, -7.6, 2, k) +
    C(-6.8, 7.6, 4.8, f) + C(-6.8, 7.6, 2, k) +
    C(6.8, -7.6, 4.8, f) + C(6.8, -7.6, 2, k),

  // The HTML5 / CSS3 badge: the official shield geometry, in two tones. `f` is
  // the outer shell, `alt` the lighter inner panel that covers the right half —
  // the numeral is set over the top of both by the caller.
  crest: (f, k, alt: any) =>
    P('M-10.6 -12H10.6L8.66 9.57 0 12-8.66 9.57Z', f) +
    P('M0 10.13V-7.79H8.7L7.06 8.53Z', alt || f),

  // Terraform — four parallelogram tiles.
  terraform: (f, k) => {
    const tile = (x: number, y: number): string => P(`M${n(x)} ${n(y)} ${n(x + 8)} ${n(y + 4.6)}v9.2L${n(x)} ${n(y + 9.2)}Z`, f);
    return tile(-11.4, -9.2) + tile(-2.6, -4.2) + tile(-2.6, -14.2) + tile(6.2, -9.2);
  },

  // Jupyter — three orbiting rings around a core.
  jupyter: (f, k) =>
    C(0, 0, 4.4, f) +
    P('M-10.8 -4.6a11.6 11.6 0 0 0 21.6 0h-3.6a8 8 0 0 1-14.4 0Z', f) +
    P('M10.8 4.6a11.6 11.6 0 0 1-21.6 0h3.6a8 8 0 0 0 14.4 0Z', f),

  // CMake — the three-triangle pyramid.
  cmake: (f, k, colors: any) => {
    const c = colors || [f, f, f];
    return (
      P('M0 -11.8-11.6 10.6Z', c[0]) +
      P('M0 -11.8-11.6 10.6 -0.6 3.4Z', c[0]) +
      P('M0 -11.8 11.6 10.6 0.6 3.4Z', c[1]) +
      P('M-11.6 10.6 11.6 10.6 0 1.6Z', c[2])
    );
  },

  // Coffee cup with no steam — CoffeeScript.
  mug: (f, k) =>
    P('M-9.4 -7.6h14.6v8.4a7.3 7.3 0 0 1-14.6 0Z', f) +
    P('M6.2 -6.4h1.8a4.6 4.6 0 0 1 0 9.2h-1.4v-3.6h1.4a1 1 0 0 0 0-2h-1.8Z', f) +
    R(-11.4, 5.4, 18.6, 3.4, 1.7, f) +
    R(-9.4, -7.6, 14.6, 2.6, 0, k),
} satisfies Record<string, Glyph>;

export type GlyphName = keyof typeof glyphs;
