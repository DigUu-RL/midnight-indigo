/*
 * The eight palettes.
 *
 * A variant is the same theme at a different hue, and that sentence is doing
 * more work than it looks. The theme was never "indigo plus a rainbow": every
 * one of its 39 colours sits at one of two kinds of place on the wheel.
 *
 *   FAMILY colours are indigo *by definition*. Measured in OKLCH, the grounds,
 *   the borders, the selection, the accent, the foreground ramp and four of the
 *   syntax roles (variables, properties, operators, comments) all land inside
 *   a 19-degree band around hue 290. They are not thirty independent decisions;
 *   they are one hue seen at thirty lightnesses. The signature pole the
 *   keywords are painted in sits at a fixed +57 from it, and its darker partner
 *   at +76 — a relationship, not a coordinate. All of that ROTATES.
 *
 *   SEMANTIC colours mean something outside this theme. A string is green in
 *   every editor anyone has used; a function is blue, a number is warm. Rotate
 *   those with the family and the orange variant ends up with magenta strings,
 *   which is not "the same theme in orange", it is a different theme.
 *
 * So the family rotates fully and the semantics rotate by PULL — enough that
 * each variant reads as one deliberate palette rather than a rainbow dropped on
 * a tinted chrome, not so much that a string stops being green.
 *
 * A VARIANT IS REBUILT, NOT TINTED. That distinction is the reason for three
 * of the things below, and it was learned the hard way: the first version of
 * this held lightness and chroma fixed and moved only the family's hue, and
 * every variant came out looking like the original seen through coloured glass.
 * Measuring said why — the semantic layer, which is most of what is on a
 * screen, sat 0.009 to 0.035 away from indigo in OKLab, which is to say it had
 * not moved. Hence `share`, which gives every token some of the rotation
 * instead of freezing the ones with the strongest conventions; `driftFor`,
 * which saturates rather than clamps so that two families never land on the
 * same answer; and `lift`, which gives a role the altitude its new hue needs.
 *
 * WHAT ACTUALLY COLLIDES. Not the ground: chrome sits at L 0.08-0.42 and syntax
 * at L 0.52-0.93, so a green string on a green sidebar is separated by 20:1 of
 * contrast and reads perfectly. What collides is two TOKENS at the same
 * lightness whose hues have drifted together — and that is a real risk here,
 * because in the green, cyan and blue variants the family hue lands inside the
 * arc the semantic roles occupy. `arrange()` below is what keeps them apart.
 *
 * Everything is expressed relative to the theme as it shipped, so the indigo
 * variant regenerates the original file exactly. build-color-themes.ts asserts
 * that, and the assertion is the whole safety net: it is what says a change to
 * the maths here did not quietly restyle the theme people already use.
 */

import { arc, hex, wrap, type Colour } from './color.ts';

/* -------------------------------------------------------------- *
 * The families
 * -------------------------------------------------------------- */

/*
 * The hue the shipped theme is built around — the centre of that 19-degree
 * band, not any single colour in it. Every `fam` offset below is measured from
 * here, so INDIGO's entry being exactly this number is what makes the indigo
 * variant reproduce byte for byte.
 */
const BASE_HUE = 290;

/**
 * OKLCH hue per variant. Picked for even spacing where the names allow it: the
 * tight pairs (red/orange at 33 degrees, indigo/purple at 30) are as far apart
 * as those names can be pulled without one of them stopping being the colour it
 * is called.
 */
export const FAMILIES = {
  red: 27,
  orange: 60,
  green: 150,
  cyan: 200,
  blue: 258,
  indigo: BASE_HUE,
  purple: 320,
  pink: 350,
} as const satisfies Record<string, number>;

export type Family = keyof typeof FAMILIES;

/** Listing order, for the manifest and the docs: warm to cool, indigo home. */
export const FAMILY_ORDER: Family[] = [
  'indigo', 'purple', 'pink', 'red', 'orange', 'green', 'cyan', 'blue',
];

/* -------------------------------------------------------------- *
 * How far the semantics follow
 * -------------------------------------------------------------- */

/*
 * The fraction of the family's rotation that the semantic roles take on.
 *
 * At 0 the variants share one rainbow and only the chrome changes — and that is
 * not a hypothetical, it is what the first version of this did. Measured as
 * OKLab distance from indigo, its semantic layer moved by 0.009 to 0.035 across
 * all seven other variants: the tokens were, to the eye, the same colours.
 * Since the tokens are most of what is on the screen, the variants read as one
 * theme with a tint laid over it rather than as eight palettes.
 *
 * At 1 the semantics are just more family, and a string is whatever the wheel
 * says. Half way is enough for the whole code area to arrive somewhere new
 * while a string is still recognisably a string.
 */
const PULL = 0.5;

/*
 * And the most it may amount to, in degrees. PULL alone is a ratio, and the
 * turn it scales reaches 180, which is enough to carry green to red.
 *
 * It saturates rather than clamps, and the difference is not cosmetic. A hard
 * `min(drift, MAX)` gives the same answer to every turn past the limit, so the
 * red variant (97 degrees from indigo) and the orange one (130) were handed an
 * identical drift and came out with an identical semantic layer — the same
 * strings, the same types, the same interfaces, in two themes that are supposed
 * to be different colours. Green and cyan collapsed onto each other the same
 * way. `tanh` is asymptotic instead: it approaches the limit without ever
 * reaching it, so two different turns always produce two different palettes,
 * and small turns still get very nearly the whole of `PULL`.
 */
const MAX_DRIFT = 55;

const driftFor = (turn: number): number =>
  MAX_DRIFT * Math.tanh((turn * PULL) / MAX_DRIFT);

/*
 * How much of that drift a role takes, from its `hold`.
 *
 * The floor is what changed. It used to be zero — `1 - hold` — which meant the
 * roles with the strongest conventions behind them did not move at all, and
 * those are precisely the ones that cover the most screen: strings and function
 * calls. Freezing them froze the variant. Now every role travels, and `hold`
 * decides how far rather than whether: a string moves not quite half as far as
 * the interfaces do, which is enough to belong to its palette and not so far
 * that it stops being green.
 */
const share = (hold: number): number => 0.45 + 0.55 * (1 - hold);

/*
 * The lightness a hue needs on top of its own to stop looking like mud.
 *
 * OKLCH holds *perceived* lightness across hue, which is exactly what a
 * rotation needs and is still not the whole story: a saturated hue near 100 at
 * L 0.73 does not read as a bright yellow-green, it reads as khaki. Yellows
 * need altitude in a way violets do not.
 *
 * The theme knew this before this file existed. Its warm roles all sit high —
 * lime interfaces at L 0.885, amber numbers at 0.843, orange enum members at
 * 0.811 — while its cool ones sit low: operators at 0.705, keywords at 0.734.
 * That is not a coincidence about those roles, it is the same correction, made
 * by hand, one colour at a time.
 *
 * So it is applied as a DIFFERENCE between where a role's hue was and where it
 * has moved to. A role that stays put gets nothing, which is what keeps indigo
 * exact; a role rotated into the yellow band is lifted by as much as the theme
 * would have lifted it, and one rotated out of it drops back down.
 */
const LIFT_PEAK = 95; // the hue that needs it most
const LIFT_MAX = 0.09; // and how much, in OKLCH lightness

function lift(hue: number): number {
  const away = Math.abs(arc(LIFT_PEAK, hue));
  if (away >= 90) return 0;
  const t = Math.cos((away * Math.PI) / 180);
  return LIFT_MAX * t * t;
}

/*
 * And how much of that lift a role at a given lightness is owed. None, in the
 * dark.
 *
 * The correction is for mud, and mud is a thing that happens to colours bright
 * enough to be read as colours. There is no khaki at L 0.08: there is
 * near-black with a hint of hue in it, and "lifting it out of the trough" does
 * not rescue anything, it just makes the theme paler. Ungated, this took the
 * orange variant's editor background from L 0.083 to 0.143 and its side bar to
 * 0.176 — `#120701` and `#170F05`, a brownish grey rather than the near-black
 * the whole theme is built on. An ultra-dark theme that is only ultra-dark in
 * six of its eight colours is not the same theme.
 *
 * So the lift fades in across the band where the theme stops making grounds and
 * starts making ink. Grounds, borders and selection get none of it; the tokens
 * get all of it; the accent, which sits between the two, gets most.
 *
 * It is keyed to the role's own lightness rather than its hue, which is what
 * keeps indigo exact: the same factor multiplies both ends of the difference,
 * so a role that has not moved still gets nothing.
 */
const LIFT_FROM = 0.4;
const LIFT_FULL = 0.62;

function liftGate(lightness: number): number {
  const t = Math.max(0, Math.min(1, (lightness - LIFT_FROM) / (LIFT_FULL - LIFT_FROM)));
  return t * t * (3 - 2 * t); // smoothstep, so nothing changes abruptly mid-ramp
}

/*
 * The arc the signature pole refuses to land in.
 *
 * The pole is 57 degrees around from the family — the relationship that gives
 * indigo its pink keywords — and taking that step clockwise from an
 * already-warm family lands in the yellow-green trough: red's keywords came out
 * `#D59F00` mustard and orange's `#A2B500` olive. So the pole takes its 57
 * degrees in whichever direction stays out of this arc, which flips the answer
 * for exactly those two families and leaves the other six alone. Indigo's is
 * unchanged, which it has to be.
 *
 * WHY THIS AND `lift` BOTH EXIST, since they are aimed at the same trough: the
 * lift raises a role that has moved into the yellows, and for the keywords
 * alone that would nearly be enough — red's would come out `#F7B900`, a
 * defensible gold. It is not enough for `generic`, the pole's darker partner,
 * because that role's whole job is to sit low, at L 0.53. A dark yellow is
 * olive at any altitude and lifting it out of the trough would cost it the
 * darkness it exists for; without the flip it comes out `#958800` in red and
 * `#479000` in orange. The lift fixes hues that pass through the trough. The
 * flip keeps the theme's signature from setting up camp in it.
 */
const YELLOW: readonly [number, number] = [58, 150];

const poleSign = (family: number): number =>
  wrap(family + ROLES.keyword.h) >= YELLOW[0] && wrap(family + ROLES.keyword.h) <= YELLOW[1] ? -1 : 1;

/*
 * The most hue separation any pair of tokens will be asked for.
 *
 * It is a ceiling, not a floor, and that distinction is the whole design. A
 * flat "no two tokens closer than N degrees" sounds right and is wrong here,
 * because the shipped theme does not obey it: enum members and numbers sit 19
 * degrees apart, interfaces and strings 36. Those are not oversights — they are
 * a warm pair and a cool pair, told apart by lightness and chroma rather than
 * by hue, and a rule that "fixed" them would restyle the theme people already
 * have.
 *
 * So every pair's requirement is whatever it already was in the shipped theme,
 * capped here. The rule cannot make any pair better separated than the author
 * made it; it can only stop a rotation from making one worse. Which is also why
 * the indigo variant is a fixed point: nothing in it violates a requirement
 * derived from itself, so `arrange()` leaves it alone and the original file
 * comes back out.
 *
 * There are two ceilings because there are two kinds of neighbour. Against
 * another semantic role, or against the family's own syntax colours, hue is
 * most of what tells them apart: they are all plain text at much the same
 * lightness. Against the keyword pole it is not — keywords are set bold italic
 * and carry half again the chroma of anything near them, so they stay
 * unmistakable at a separation that would be too close for a pair of plain
 * identifiers.
 *
 * THE NUMBER IS LOW ON PURPOSE, and this was the hardest thing here to get
 * right. Order is preserved around the wheel, so a requirement is not paid once
 * — it is paid by every role behind it. In the orange variant the enum members
 * start out sitting almost exactly on the family hue, and asking 34 degrees of
 * clearance there did not move the enum members 34 degrees, it moved the whole
 * warm chain behind them and pushed the strings out to teal. Dropping the
 * ceiling to 26 costs a few degrees between roles that were never confusable
 * anyway, and buys back the strings: the worst any variant now drags one is 19
 * degrees, against 31 at a ceiling of 34.
 */
const GUARD = 26;
const GUARD_KEYWORD = 22;

/* -------------------------------------------------------------- *
 * The role table
 * -------------------------------------------------------------- */

type Band = 'family' | 'signature' | 'semantic';

/** Lightness and chroma are absolute; what `h` means depends on the band. */
type Role = { l: number; c: number; h: number; band: Band; hold: number };

/** A family role: `h` is the offset from the variant's hue. */
const fam = (l: number, c: number, h: number): Role => ({ l, c, h, band: 'family', hold: 1 });

/**
 * A signature role: the keyword pole, `h` degrees around from the family — in
 * whichever direction `poleSign` sends it. See YELLOW below for why the
 * direction is not simply "positive".
 */
const sig = (l: number, c: number, h: number): Role => ({ l, c, h, band: 'signature', hold: 1 });

/**
 * A semantic role: `h` is its own hue, and `hold` is how hard it fights to keep
 * it when the wheel gets crowded — 1 for a convention nobody may break, down
 * toward 0 for a hue that is only this theme's own preference.
 *
 * Weighting these is what makes the crowded variants work. Green, cyan and blue
 * put the family hue right in the middle of the arc the semantic roles occupy,
 * so something has to move; without weights the relaxation picks its victim by
 * accident, and the green variant comes out with brown strings. With them, the
 * displacement flows to the roles that can afford it: a string stays green and
 * an interface — lime because this theme decided so, not because anything says
 * interfaces are lime — is what slides out of the way.
 */
const sem = (l: number, c: number, h: number, hold: number): Role => ({
  l, c, h, band: 'semantic', hold,
});

/*
 * Measured out of the shipped theme with tools/color.ts, one entry per distinct
 * colour in it. The comment on each line is the indigo variant's output, which
 * is also the value that was there before any of this existed.
 */
const ROLES = {
  /* --- grounds --- */
  bg: fam(0.083, 0.0297, -0.4), //             #020108  editor, gutter, terminal
  bgDeep: fam(0.096, 0.025, 0.6), //           #030209  title bar, activity bar
  bgSide: fam(0.098, 0.023, 12.1), //          #040208  side bar, panel, tab strip
  ansiBlack: fam(0.114, 0.0342, 0.1), //       #050310  terminal.ansiBlack
  bgLine: fam(0.131, 0.0346, 2.1), //          #080514  current-line highlight
  bgLift: fam(0.143, 0.0327, 1.7), //          #0A0716  widgets, status bar, inputs
  bgTab: fam(0.144, 0.0328, 4.9), //           #0B0716  active tab, list hover

  /* --- lines and selection --- */
  line: fam(0.195, 0.0562, -0.3), //           #150F2C  borders, indent guides
  selDim: fam(0.231, 0.0801, -3.3), //         #1C1440  word highlight, list focus
  sel: fam(0.268, 0.0975, -4.1), //            #241A52  selection
  whitespace: fam(0.286, 0.0828, -1.1), //     #2A2150  rendered whitespace
  border: fam(0.326, 0.0891, 0.3), //          #352A5E  input and dropdown borders
  accentDim: fam(0.423, 0.1316, -3.5), //      #4B3E91  badges, widget borders
  accent: fam(0.568, 0.2021, -6.9), //         #6C5CE7  focus, buttons, active tab

  /* --- the foreground ramp --- */
  fgFaint: fam(0.412, 0.0743, 0.9), //         #4B4370  line numbers, dimmed icons
  fgMuted: fam(0.524, 0.0703, 0.9), //         #6A6390  comments, placeholders
  fgDim: fam(0.634, 0.0523, 2.7), //           #8B85A8  side bar, status bar
  fg: fam(0.681, 0.0543, 2.3), //              #9993B8  editor foreground
  fgBright: fam(0.745, 0.0488, 3.3), //        #ADA7C9  active tab, selected row
  cursor: fam(0.737, 0.0909, 10.5), //         #B39DDB  caret, active line number
  fgWhite: fam(0.943, 0.0176, 6.6), //         #EDEAF7  terminal.ansiBrightWhite

  /* --- syntax that is family --- */
  variable: fam(0.781, 0.0553, 2.1), //        #B8B2D9  variables, parameters
  property: fam(0.751, 0.1344, 9.5), //        #BB9AF7  properties, JSON keys
  operator: fam(0.705, 0.1642, -1.8), //       #9D8CFF  operators

  /* --- the signature pole: keywords and punctuation --- */
  keyword: sig(0.734, 0.2024, 57.1), //        #FF6AC1  keywords, punctuation
  keywordBright: sig(0.789, 0.1549, 54.9), //  #FF8FD1  terminal.ansiBrightRed
  generic: sig(0.531, 0.2015, 75.6), //        #C2185B  type parameters
  genericBright: sig(0.642, 0.1877, 66.7), //  #E0508F  terminal.ansiBrightMagenta

  /* ---------------------------------------------------------------- *
   * Syntax that means something outside this theme.
   *
   * The `hold` column, in order: a string is green and a function is blue in
   * every editor anyone has used, so those two barely move. Numbers being warm
   * is a weaker convention. Classes being cyan is this theme's reading of "a
   * type is cool"; enum members being orange, and interfaces lime, are its own
   * inventions and are the first to give way.
   * ---------------------------------------------------------------- */
  string: sem(0.803, 0.0984, 150.8, 1.0), //       #8FD19E  strings, added lines
  stringBright: sem(0.869, 0.0946, 150.8, 1.0), // #A6E6B4  terminal.ansiBrightGreen
  func: sem(0.745, 0.1388, 247.3, 0.9), //         #5CB3FF  functions, modified lines
  funcBright: sem(0.82, 0.0962, 245.5, 0.9), //    #8FCBFF  terminal.ansiBrightBlue
  number: sem(0.843, 0.11, 74.6, 0.6), //          #F6C177  numbers, decorators
  type: sem(0.812, 0.1071, 185.5, 0.45), //        #64D8CB  classes, types, headings
  typeBright: sem(0.884, 0.0918, 184.5, 0.45), //  #8FEDE0  terminal.ansiBrightCyan
  enumMember: sem(0.811, 0.1242, 55.1, 0.35), //   #FFAB70  enum members, inline code
  iface: sem(0.885, 0.1738, 115.1, 0.25), //       #D6E64B  interfaces, enums
  ifaceBright: sem(0.926, 0.1363, 112.4, 0.25), // #E8F080  terminal.ansiBrightYellow
} satisfies Record<string, Role>;

export type RoleName = keyof typeof ROLES;

/** Painted the same in every variant: text on the accent, which must be white. */
export const WHITE: Colour = '#FFFFFF';

/*
 * The semantic roles that carry a distinct meaning, and so have to stay
 * distinguishable from each other. The `*Bright` terminal colours are left out
 * on purpose: each one is its base role at another lightness, so it follows
 * whatever the base is moved to rather than competing for its own slot.
 */
const CONTESTED: RoleName[] = ['enumMember', 'number', 'iface', 'string', 'type', 'func'];

/** Which bright follows which base, so the pair never drifts apart. */
const FOLLOWS: Partial<Record<RoleName, RoleName>> = {
  stringBright: 'string',
  funcBright: 'func',
  typeBright: 'type',
  ifaceBright: 'iface',
};

/* -------------------------------------------------------------- *
 * Keeping the tokens apart
 * -------------------------------------------------------------- */

/** Separation to require of a pair: what it already had, under a ceiling. */
const needed = (a: number, b: number, cap = GUARD): number => Math.min(cap, Math.abs(arc(a, b)));

/**
 * Weighted isotonic regression: the nearest non-decreasing sequence to `v`,
 * by pool-adjacent-violators. Each block that violates the order is replaced by
 * its weighted mean, repeatedly, until nothing is out of order.
 */
function isotonic(v: number[], w: number[]): number[] {
  const val: number[] = [];
  const wt: number[] = [];
  const len: number[] = [];

  for (let i = 0; i < v.length; i++) {
    val.push(v[i]);
    wt.push(w[i]);
    len.push(1);
    // Absorb backwards while the block before this one sits higher.
    while (val.length > 1 && val[val.length - 2] > val[val.length - 1]) {
      const [v2, w2, l2] = [val.pop()!, wt.pop()!, len.pop()!];
      const [v1, w1, l1] = [val.pop()!, wt.pop()!, len.pop()!];
      val.push((v1 * w1 + v2 * w2) / (w1 + w2));
      wt.push(w1 + w2);
      len.push(l1 + l2);
    }
  }

  const out: number[] = [];
  for (let b = 0; b < val.length; b++) for (let k = 0; k < len[b]; k++) out.push(val[b]);
  return out;
}

/**
 * Places the movable hues around the wheel so that every neighbouring pair
 * clears the gap it is owed, as close as possible to where each wanted to be.
 *
 * This started life as a relaxation — shove any two hues that are too close,
 * add a spring home, iterate — and that turned out to be the wrong tool twice
 * over. It cannot tell an over-constrained arc from a merely crowded one, so
 * when the orange variant asked for 76 degrees of clearance inside a 57-degree
 * window it did not fail, it quietly squeezed two roles into a gap of one
 * degree and emitted the palette. And a local shove can never move a role past
 * an obstacle, so a role that belongs on the far side of the keyword pole stays
 * trapped against it however long the loop runs.
 *
 * So the arrangement is solved instead of approximated. Two facts make that
 * easy. The roles keep their cyclic order — warm stays warm, cool stays cool,
 * which is what makes the eight variants recognisably one theme — and once
 * order is fixed, only *neighbouring* pairs can collide, so the whole
 * constraint set is a chain. The obstacles pin the chain at known points and
 * cut the circle into independent arcs, and each arc is then a weighted
 * isotonic regression: the closest ordered placement to what the roles asked
 * for, with the weights deciding who gives way.
 *
 * An arc whose gaps cannot fit has them scaled down together, so it degrades
 * evenly instead of starving whichever role the loop happened to reach last —
 * and `shortfall` reports it, so the build can say which variant is tight
 * rather than leaving it to be noticed in the editor.
 */
function arrange(
  targets: number[],
  hold: number[],
  obstacles: number[],
  gapPair: number[][],
  gapFixed: number[][]
): { hues: number[]; shortfall: number } {
  const hues = [...targets];
  let shortfall = 0;

  // Unroll the circle from the first obstacle so ordering is plain arithmetic.
  const pins = obstacles.map((o, i) => ({ at: o, i })).sort((a, b) => a.at - b.at);
  const origin = pins[0].at;
  const un = (h: number): number => origin + wrap(h - origin);

  for (let p = 0; p < pins.length; p++) {
    const A = pins[p];
    const B = pins[(p + 1) % pins.length];
    const lo = un(A.at);
    const hi = p + 1 === pins.length ? origin + 360 : un(B.at);

    // The roles that fall in this arc, in order. A role sitting exactly on the
    // opening pin belongs to this arc, not the one before it.
    const here = targets
      .map((t, i) => ({ i, at: un(t) }))
      .filter((r) => r.at >= lo && r.at < hi)
      .sort((a, b) => a.at - b.at);
    if (!here.length) continue;

    const idx = here.map((r) => r.i);
    const first = idx[0];
    const last = idx[idx.length - 1];

    // The gaps to honour: pin to first, each neighbour to the next, last to pin.
    let gaps = [
      gapFixed[first][A.i],
      ...idx.slice(1).map((n, k) => gapPair[idx[k]][n]),
      gapFixed[last][B.i],
    ];

    // If they cannot fit the arc, everything in it gives way in proportion.
    const span = hi - lo;
    const total = gaps.reduce((a, b) => a + b, 0);
    if (total > span) {
      shortfall = Math.max(shortfall, total - span);
      gaps = gaps.map((g) => (g * span) / total);
    }

    /*
     * Substituting out the minimum offsets turns "each at least `gap` past the
     * one before" into "non-decreasing", which is what isotonic regression
     * solves. `at` is the running minimum position of each role.
     */
    const at: number[] = [];
    let run = lo;
    for (let k = 0; k < idx.length; k++) {
      run += gaps[k];
      at.push(run);
    }
    const ceiling = hi - gaps[gaps.length - 1] - at[at.length - 1] + lo;

    const y = isotonic(
      here.map((r, k) => r.at - at[k] + lo),
      idx.map((i) => hold[i])
    );

    // Clamping a non-decreasing sequence elementwise keeps it non-decreasing.
    for (let k = 0; k < idx.length; k++) {
      hues[idx[k]] = wrap(Math.min(Math.max(y[k], lo), ceiling) + at[k] - lo);
    }
  }

  return { hues, shortfall };
}

/* -------------------------------------------------------------- *
 * Building a palette
 * -------------------------------------------------------------- */

export type Palette = Record<RoleName, Colour>;

/** Where every role landed, and by how much the wheel came up short. */
export type Layout = { hues: Record<RoleName, number>; shortfall: number };

/** The hue each role lands on in a given variant, before it becomes a colour. */
export function huesFor(family: Family): Layout {
  const F = FAMILIES[family];
  const turn = arc(BASE_HUE, F);

  /*
   * The tilt the semantic roles take on. A plain fraction of the turn is not
   * enough on its own: the turn runs to 180 degrees, so even a third of it
   * would carry a green string to orange in the variants furthest from indigo.
   * Capping the drift is what keeps "the same theme, tilted" from becoming a
   * different palette at the far end of the wheel.
   */
  const drift = driftFor(turn);

  const pole = poleSign(F);

  const out = {} as Record<RoleName, number>;
  for (const [name, role] of Object.entries(ROLES) as [RoleName, Role][]) {
    out[name] =
      role.band === 'family'
        ? wrap(F + role.h)
        : role.band === 'signature'
          ? wrap(F + role.h * pole)
          : wrap(role.h + drift * share(role.hold));
  }

  /*
   * The obstacles a semantic role has to clear: the family cluster, and the
   * keyword pole. The cluster is one position rather than three — variables,
   * properties and operators sit within 12 degrees of the family hue by design
   * and are told apart by lightness, so clearing the group clears all of them.
   *
   * `generic` is not an obstacle. It is the one signature colour that sits well
   * below the syntax band (L 0.53 against 0.75-0.89), so no semantic role can
   * be confused with it whatever their hues do, and treating it as one only
   * over-constrains a wheel that is already crowded.
   */
  const obstacles = [F, out.keyword];

  /*
   * What each pair is owed, measured off the shipped theme rather than
   * asserted. `base` is where these hues sit when the family is indigo, which
   * is the arrangement the theme was designed with.
   */
  const base = CONTESTED.map((n) => ROLES[n].h);
  const hold = CONTESTED.map((n) => ROLES[n].hold);
  const caps = [GUARD, GUARD_KEYWORD];
  const baseObstacles = [BASE_HUE, BASE_HUE + ROLES.keyword.h];
  const wantPair = base.map((a) => base.map((b) => needed(a, b)));
  const wantFixed = base.map((a) => baseObstacles.map((o, k) => needed(a, o, caps[k])));

  const { hues, shortfall } = arrange(
    CONTESTED.map((n) => out[n]),
    hold,
    obstacles,
    wantPair,
    wantFixed
  );
  CONTESTED.forEach((n, i) => (out[n] = hues[i]));

  // The brights ride along with whatever their base ended up as.
  for (const [bright, of] of Object.entries(FOLLOWS) as [RoleName, RoleName][]) {
    out[bright] = wrap(out[of] + arc(ROLES[of].h, ROLES[bright].h));
  }

  return { hues: out, shortfall };
}

/* -------------------------------------------------------------- *
 * From a hue to a colour
 * -------------------------------------------------------------- */

/** Where a role sits when the family is indigo — the reference for everything. */
const homeHue = (role: Role): number =>
  role.band === 'semantic' ? wrap(role.h) : wrap(BASE_HUE + role.h);

/*
 * CHROMA IS ABSOLUTE, and that is a decision worth recording because the
 * obvious alternative is wrong in an interesting way.
 *
 * sRGB is not a cylinder. It holds far more chroma at magenta than at green, so
 * the tempting move is to store each role's chroma as a *fraction* of what its
 * hue can carry and reuse the fraction — that way, the argument goes, every
 * variant uses its own hue as fully as indigo uses its own, and nothing clips.
 *
 * It was tried, and it produced `#FF53F7` keywords in the red variant and
 * `#4EF15A` interfaces in the orange one: radioactive. Two reasons, and both
 * are worth knowing.
 *
 * The first is that OKLCH chroma is *already* the perceptually comparable
 * quantity — holding it constant across hue is the entire reason this palette
 * is built in OKLCH rather than HSL. Normalising it against the gamut undoes
 * that: it makes a colour as saturated as its hue permits rather than as
 * saturated as the design asked for, so the roomy hues run away.
 *
 * The second is that the premise was false. Measured against the boundary,
 * indigo's own operators, keywords, function calls and enum members sit at
 * 100% — they are already gamut-edge colours. "Reuse the fraction" therefore
 * meant "sit on the edge at every hue", and the edge is a long way out in
 * magenta.
 *
 * So the chroma in the role table is the chroma, everywhere. Where a hue cannot
 * hold it, `hex()` reduces it to the most that hue can — which for the near
 * black grounds is not a defect but the best available answer: the tint those
 * hues can carry at L 0.08 is simply smaller, and taking all of it is the
 * most colour there is to take.
 */

/** The 38 colours of one variant. */
export function paletteFor(family: Family): Palette {
  const { hues } = huesFor(family);
  const out = {} as Palette;

  for (const [name, role] of Object.entries(ROLES) as [RoleName, Role][]) {
    const h = hues[name];
    // Lightness: the role's own, plus whatever its new hue needs and its old
    // one did not — and only as much of that as a role this bright is owed.
    // A role that has not moved gets exactly its own.
    const l = Math.min(0.99, role.l + liftGate(role.l) * (lift(h) - lift(homeHue(role))));
    out[name] = hex({ l, c: role.c, h });
  }

  return out;
}

export { BASE_HUE, CONTESTED, GUARD, PULL, ROLES };
