/*
 * The eight palettes.
 *
 * WHAT CHANGED, AND WHY IT HAD TO.
 *
 * The previous version of this file generated the seven non-indigo variants by
 * rotation: every colour kept indigo's lightness and chroma exactly, and only
 * its hue moved — the family band by the full turn, the semantic roles by a
 * capped fraction of it. It was carefully built and it produced, measurably, a
 * filter. Dumping the eight palettes side by side showed it plainly: every
 * ground sat at `indigo + Δ` for one Δ per family, every semantic role at
 * `indigo + drift` for one drift per family, and the L and C columns were
 * identical down all eight. A rotation of every colour by the same angle is
 * what `hue-rotate()` is. No amount of tuning inside that scheme could produce
 * a palette that had not already been decided by indigo.
 *
 * It also broke down at the far side of the wheel. Because the family turned
 * fully and the semantics only drifted, the green, cyan and blue families
 * landed *inside* the arc their own semantic roles occupy: the green variant
 * came out with chrome at hue 150 and strings at 124, types at 176 and
 * interfaces at 75 — a code area collapsed onto the chrome hue, which is the
 * one thing a syntax palette must not be. The old `arrange()` — a weighted
 * isotonic regression over the crowded arc — existed to fight that, and it
 * fought it by shoving roles a few degrees apart inside a window that was
 * fundamentally too small. It is gone, along with the drift, the pull and the
 * guard ceilings that fed it. The crowding it managed cannot happen now,
 * because no variant is asked to fit its semantics into the arc its family sits
 * in: each one is given the arc it should use.
 *
 * WHAT THIS DOES INSTEAD. A variant is a design, written down. `VARIANTS` below
 * holds, per family, the hue of every colour that carries an identity of its
 * own — the family, the accent, the signature pole and its dark partner, and
 * each of the six semantic roles — chosen for that family rather than derived
 * from indigo's. Alongside them sit three chroma multipliers, and those are
 * what stop the eight from being one palette even where the hues are handled
 * well: a hot family at indigo's chroma makes every line of body text look
 * sunburnt, and a cold one at indigo's chroma cannot reach it at all. Red and
 * orange therefore run a quieter ground and a quieter foreground ramp than
 * indigo does; cyan and green run a louder one. Two variants can now differ in
 * saturation and in the *intervals* between their roles, not only in where the
 * whole wheel was turned to, which is the difference between eight palettes and
 * one palette photographed through eight gels.
 *
 * WHAT STAYED. The three things that were right.
 *
 *   OKLCH, because L is perceived lightness and rotating in anything else makes
 *   the yellows blow out and the blues go muddy from the same numbers.
 *
 *   `lift`, which gives a role the altitude its hue needs — a saturated hue
 *   near 100 at L 0.73 reads as khaki, not as bright yellow-green — gated so
 *   that it touches ink and never touches the near-black grounds. Ungated it
 *   turned the orange variant's editor background into a brownish grey, and an
 *   ultra-dark theme that is ultra-dark in six of its eight colours is not the
 *   same theme.
 *
 *   The baseline. Indigo's row is its measured values and every one of its
 *   multipliers is 1, so `paletteFor('indigo')` reproduces the shipped theme
 *   exactly; build-color-themes.ts asserts it key for key. That assertion is
 *   the safety net that let this file be rewritten at all — it is what says the
 *   theme thousands of editors already have open did not move.
 *
 * HOW THE SEMANTIC HUES WERE CHOSEN. Two rules, applied in this order.
 *
 *   A role keeps its convention where the family leaves room. A string is green
 *   in every editor anyone has used, a function is blue, a number is warm; the
 *   purple, pink, red and blue variants can honour all of that and do.
 *
 *   Where the family occupies a role's home, that role moves, and the move is a
 *   decision rather than a nudge. The orange family owns the amber band, so its
 *   numbers are warm red and its enum members rose. The green family owns
 *   green, so its strings are yellow-green — still the greenest thing on the
 *   screen after the chrome — and its interfaces gold. The cyan family owns
 *   teal, so its types are jade, on the far side of its strings. Every one of
 *   those is a palette a person could have drawn, which is exactly what the
 *   rotation could never produce.
 *
 * The floor under all of it is `SEPARATION`, checked by the build rather than
 * assumed here: no two roles that have to be told apart may sit closer than it.
 */

import { signedHueDelta, hexFromOklch, wrapDegrees, type Colour } from './color.ts';

/* -------------------------------------------------------------- *
 * The families
 * -------------------------------------------------------------- */

/*
 * The hue the shipped theme is built around — the centre of the 19-degree band
 * its chrome occupies, not any single colour in it. Every `fam` offset in the
 * role table is measured from here, so indigo's `hue` being exactly this number
 * is what makes the indigo variant reproduce byte for byte.
 */
const BASE_HUE = 290;

export type Family =
  | 'indigo' | 'purple' | 'pink' | 'red' | 'orange' | 'green' | 'cyan' | 'blue';

/** Listing order, for the manifest and the docs: indigo home, then round. */
export const FAMILY_ORDER: Family[] = [
  'indigo', 'purple', 'pink', 'red', 'orange', 'green', 'cyan', 'blue',
];

/* -------------------------------------------------------------- *
 * The role table — indigo, measured
 * -------------------------------------------------------------- */

/*
 * Five kinds of colour, and the band decides both where a role's hue comes from
 * and which chroma multiplier it is scaled by.
 *
 *   ground   the near-blacks, the lines and the selection. Rotates with the
 *            family; `h` is an offset from it.
 *   chrome   the foreground ramp and the three syntax roles that are family by
 *            definition. Also an offset from the family, scaled separately —
 *            a ground can carry a tint the body text cannot.
 *   accent   focus, buttons, the active tab. Given outright per family, because
 *            it is the one colour a user would call "the theme's colour", and
 *            it is the only band exempt from `lift`: its lightness is a
 *            decision, not a correction.
 *   pole     keywords and type parameters. `h` is indigo's absolute hue; each
 *            family names its own.
 *   semantic strings, functions, numbers, types, enum members, interfaces —
 *            likewise absolute, likewise named per family.
 */
type Band = 'ground' | 'chrome' | 'accent' | 'pole' | 'semantic';

/*
 * Lightness and chroma are indigo's; `h` is an offset or an absolute hue.
 *
 * `from` is a plain string rather than a `RoleName`, which would be the honest
 * type and is not one TypeScript can have: `RoleName` is `keyof typeof ROLES`,
 * so naming it here would make the role table's type depend on itself. It is
 * narrowed at the one place it is read.
 */
type Role = { l: number; c: number; h: number; band: Band; from?: string };

const groundRole = (l: number, c: number, h: number): Role => ({ l, c, h, band: 'ground' });
const chromeRole = (l: number, c: number, h: number): Role => ({ l, c, h, band: 'chrome' });
const accentRole = (l: number, c: number, h: number): Role => ({ l, c, h, band: 'accent' });

/**
 * A signature or semantic role. `from` names the base a `*Bright` terminal
 * colour follows: each bright is its base at another lightness, so it rides
 * along with wherever the base was placed instead of being specified twice.
 */
const signatureRole = (l: number, c: number, h: number, from?: string): Role =>
  ({ l, c, h, band: 'pole', from });
const semanticRole = (l: number, c: number, h: number, from?: string): Role =>
  ({ l, c, h, band: 'semantic', from });

/*
 * Measured out of the shipped theme with tools/color.ts, one entry per distinct
 * colour in it. The comment on each line is the indigo variant's output, which
 * is also the value that was there before any of this existed.
 */
const ROLES = {
  /* --- grounds --- */
  bg: groundRole(0.083, 0.0297, -0.4), //          #020108  editor, gutter, terminal
  bgDeep: groundRole(0.096, 0.025, 0.6), //        #030209  title bar, activity bar
  bgSide: groundRole(0.098, 0.023, 12.1), //       #040208  side bar, panel, tab strip
  ansiBlack: groundRole(0.114, 0.0342, 0.1), //    #050310  terminal.ansiBlack
  bgLine: groundRole(0.131, 0.0346, 2.1), //       #080514  current-line highlight
  bgLift: groundRole(0.143, 0.0327, 1.7), //       #0A0716  widgets, status bar, inputs
  bgTab: groundRole(0.144, 0.0328, 4.9), //        #0B0716  active tab, list hover

  /* --- lines and selection --- */
  line: groundRole(0.195, 0.0562, -0.3), //        #150F2C  borders, indent guides
  selDim: groundRole(0.231, 0.0801, -3.3), //      #1C1440  word highlight, list focus
  sel: groundRole(0.268, 0.0975, -4.1), //         #241A52  selection
  whitespace: groundRole(0.286, 0.0828, -1.1), //  #2A2150  rendered whitespace
  border: groundRole(0.326, 0.0891, 0.3), //       #352A5E  input and dropdown borders

  /* --- the accent pair --- */
  accentDim: accentRole(0.423, 0.1316, 286.5), //   #4B3E91  badges, widget borders
  accent: accentRole(0.568, 0.2021, 283.1), //      #6C5CE7  focus, buttons, active tab

  /* --- the foreground ramp --- */
  fgFaint: chromeRole(0.412, 0.0743, 0.9), //      #4B4370  line numbers, dimmed icons
  fgMuted: chromeRole(0.524, 0.0703, 0.9), //      #6A6390  comments, placeholders
  fgDim: chromeRole(0.634, 0.0523, 2.7), //        #8B85A8  side bar, status bar
  fg: chromeRole(0.681, 0.0543, 2.3), //           #9993B8  editor foreground
  fgBright: chromeRole(0.745, 0.0488, 3.3), //     #ADA7C9  active tab, selected row
  cursor: chromeRole(0.737, 0.0909, 10.5), //      #B39DDB  caret, active line number
  fgWhite: chromeRole(0.943, 0.0176, 6.6), //      #EDEAF7  terminal.ansiBrightWhite

  /* --- syntax that is family --- */
  variable: chromeRole(0.781, 0.0553, 2.1), //     #B8B2D9  variables, parameters
  property: chromeRole(0.751, 0.1344, 9.5), //     #BB9AF7  properties, JSON keys
  operator: chromeRole(0.705, 0.1642, -1.8), //    #9D8CFF  operators

  /* --- the signature pole: keywords and punctuation --- */
  keyword: signatureRole(0.734, 0.2024, 347.1), //                      #FF6AC1  keywords, punctuation
  keywordBright: signatureRole(0.789, 0.1549, 344.9, 'keyword'), //     #FF8FD1  terminal.ansiBrightRed
  generic: signatureRole(0.531, 0.2015, 5.6), //                        #C2185B  type parameters
  genericBright: signatureRole(0.642, 0.1877, 356.7, 'generic'), //     #E0508F  terminal.ansiBrightMagenta

  /* --- syntax that means something outside this theme --- */
  string: semanticRole(0.803, 0.0984, 150.8), //                    #8FD19E  strings, added lines
  stringBright: semanticRole(0.869, 0.0946, 150.8, 'string'), //    #A6E6B4  terminal.ansiBrightGreen
  func: semanticRole(0.745, 0.1388, 247.3), //                      #5CB3FF  functions, modified lines
  funcBright: semanticRole(0.82, 0.0962, 245.5, 'func'), //         #8FCBFF  terminal.ansiBrightBlue
  number: semanticRole(0.843, 0.11, 74.6), //                       #F6C177  numbers, decorators
  type: semanticRole(0.812, 0.1071, 185.5), //                      #64D8CB  classes, types, headings
  typeBright: semanticRole(0.884, 0.0918, 184.5, 'type'), //        #8FEDE0  terminal.ansiBrightCyan
  enumMember: semanticRole(0.811, 0.1242, 55.1), //                 #FFAB70  enum members, inline code
  iface: semanticRole(0.885, 0.1738, 115.1), //                     #D6E64B  interfaces, enums
  ifaceBright: semanticRole(0.926, 0.1363, 112.4, 'iface'), //      #E8F080  terminal.ansiBrightYellow
} satisfies Record<string, Role>;

export type RoleName = keyof typeof ROLES;

/** Painted the same in every variant: text on the accent, which must be white. */
export const WHITE: Colour = '#FFFFFF';

/* -------------------------------------------------------------- *
 * The seven other designs
 * -------------------------------------------------------------- */

/** The roles a variant names outright, because each carries its own identity. */
type Named = 'keyword' | 'generic' | 'string' | 'func' | 'number' | 'type' | 'enumMember' | 'iface';

type Variant = {
  /** The family hue: the chrome, and everything measured as an offset from it. */
  hue: number;
  /**
   * Chroma, relative to indigo's. `ground` tints the near-blacks and the
   * selection, `chrome` the foreground ramp and the three family syntax roles,
   * `ink` the pole and the semantic layer.
   *
   * These are not a fudge factor, they are the second half of the design. sRGB
   * holds far more chroma in the warm hues than the cold ones at any given
   * lightness, so indigo's numbers do not mean the same thing at hue 27 as they
   * do at 290: red's ground at 1.0 is a visible maroon rather than a near-black
   * with a hint in it, and its foreground ramp at 1.0 is salmon rather than a
   * warm grey. Cold families have the opposite problem and are given room to
   * take what little their hue can hold.
   */
  groundChroma: number;
  chromeChroma: number;
  inkChroma: number;
  /** The accent, outright: hue, chroma, and the lightness white must read on. */
  accent: { h: number; c: number; l: number };
  /** Where each named role sits on the wheel in this family. */
  hues: Record<Named, number>;
};

/*
 * `accentDim` is the accent's darker partner — badges, widget borders, the
 * scrollbar. It is derived rather than named, by the step indigo takes between
 * the two, so the pair stays a pair in every family and a variant has one
 * accent to decide instead of two that could drift apart.
 */
const DIM_HUE = signedHueDelta(ROLES.accent.h, ROLES.accentDim.h); //     +3.4
const DIM_CHROMA = ROLES.accentDim.c / ROLES.accent.c; //      0.651
const DIM_LIGHT = ROLES.accentDim.l - ROLES.accent.l; //      -0.145

const VARIANTS: Record<Family, Variant> = {
  /*
   * INDIGO — the shipped theme, and the reference for everything else. Its
   * numbers are measurements, its multipliers are 1, and neither may change:
   * build-color-themes.ts asserts that this row still regenerates the theme
   * people already have selected, key for key.
   */
  indigo: {
    hue: BASE_HUE,
    groundChroma: 1, chromeChroma: 1, inkChroma: 1,
    accent: { h: ROLES.accent.h, c: ROLES.accent.c, l: ROLES.accent.l },
    hues: {
      keyword: ROLES.keyword.h, generic: ROLES.generic.h,
      enumMember: ROLES.enumMember.h, number: ROLES.number.h, iface: ROLES.iface.h,
      string: ROLES.string.h, type: ROLES.type.h, func: ROLES.func.h,
    },
  },

  /*
   * PURPLE — indigo's near neighbour, and so the one variant at real risk of
   * being indistinguishable from it. What separates them is not the 30 degrees
   * between the families, it is which way the signature leans: indigo answers
   * its violet chrome with pink keywords and a crimson partner *below* them on
   * the wheel, purple answers its magenta chrome with warm rose-red keywords
   * and puts the partner above, between the keywords and the family. The
   * chrome runs a shade quieter, because magenta at indigo's chroma makes the
   * body text read as lilac rather than as text.
   */
  purple: {
    hue: 320,
    groundChroma: 0.95, chromeChroma: 0.95, inkChroma: 0.98,
    accent: { h: 311, c: 0.2, l: 0.566 },
    hues: {
      keyword: 15, generic: 350,
      enumMember: 38, number: 68, iface: 108, string: 145, type: 200, func: 258,
    },
  },

  /*
   * PINK — hot chrome, cool code, which is the inverse of indigo's arrangement
   * and the reason the two do not read as the same theme. Rose grounds with a
   * violet signature: the keywords step *back* down the wheel to 302, so the
   * loudest thing in the editor is cool against a warm workbench. The semantic
   * body then runs the full warm-to-cool sweep with nothing competing for the
   * rose end, which is the family's alone, and it runs a little louder than
   * indigo's — cool ink has to hold its own against hot chrome.
   *
   * The type parameters do NOT follow the keywords down. Dragging them to the
   * far side of the pole put them on 268, which is a perfectly good indigo and
   * a bad answer, because this role is `terminal.ansiMagenta` and the function
   * colour is `ansiBlue`: two blues, one of them named magenta. So they sit at
   * 330 instead, between the pole and the family — close to both in hue and
   * nowhere near either in lightness, at L 0.53 against 0.73 and a near-black.
   * That is indigo's own arrangement, and it is the arrangement because the
   * terminal's sixteen colours have to keep meaning what they are called.
   */
  pink: {
    hue: 350,
    groundChroma: 0.9, chromeChroma: 0.92, inkChroma: 1.05,
    accent: { h: 342, c: 0.2, l: 0.576 },
    hues: {
      keyword: 302, generic: 330,
      enumMember: 52, number: 90, iface: 132, string: 165, type: 202, func: 240,
    },
  },

  /*
   * RED — the first family that owns part of the semantic wheel, and so the
   * first that had to be re-laid rather than turned. Enum members at 55 and
   * numbers at 75 sit almost on top of a family at 27; both step up and out,
   * to 62 and 90, which pushes the interfaces to gold and the strings to a
   * cleaner green than indigo's. The signature goes magenta at 337, because
   * indigo's own relationship — the family plus 57 — lands on 84, and yellow
   * keywords on a red theme are mustard.
   *
   * Both multipliers are well under 1 and that is the substance of the variant,
   * not a detail: red is the hue sRGB is most generous with, and matching
   * indigo's chroma gives a maroon workbench and salmon body text. Quietened,
   * the grounds go back to being near-black with a warmth in them and the ramp
   * back to being a warm grey, which is what the ramp is for.
   */
  red: {
    hue: 27,
    groundChroma: 0.72, chromeChroma: 0.85, inkChroma: 0.92,
    accent: { h: 20, c: 0.185, l: 0.576 },
    hues: {
      keyword: 337, generic: 300,
      enumMember: 65, number: 95, iface: 140, string: 170, type: 205, func: 252,
    },
  },

  /*
   * ORANGE — the family sits in the middle of the warm band, so the two warm
   * semantic roles cannot stay warm in the way they were. They cross instead of
   * crowding: the numbers go to warm red at 22 and the enum members to rose at
   * 350, on the other side of the wheel's zero from the amber chrome, and the
   * keywords take the magenta at 316 that the family plus 57 (an olive 117)
   * could never have been. What is left — lime, green, teal, blue — spreads
   * across the whole cool half with the family's 60 degrees empty behind it.
   *
   * The quietest ground of the eight, for the same reason as red and more so:
   * amber is where sRGB is widest, and a tinted near-black at this hue turns
   * brown before it turns orange.
   */
  orange: {
    hue: 60,
    groundChroma: 0.68, chromeChroma: 0.8, inkChroma: 0.95,
    accent: { h: 52, c: 0.155, l: 0.586 },
    hues: {
      keyword: 316, generic: 285,
      enumMember: 350, number: 22, iface: 120, string: 152, type: 190, func: 248,
    },
  },

  /*
   * GREEN — the hardest of the eight, because the family owns the one hue with
   * the strongest convention on it. A string cannot be green here, and the
   * reason is not the background: the grounds are near-black at every hue, and
   * a string clears them by 20:1 whatever colour either one is. It is the
   * variables. They are family by definition, so in this family they sit at
   * hue 152 and L 0.78, and a green string at 150 and L 0.80 is the same
   * colour as the identifier beside it.
   *
   * That pins the answer more tightly than it looks. Clearing the chrome means
   * the strings stay under 130 or go past 174, and the far side is already the
   * types' — so 125, a yellow-green, and still the greenest thing on the
   * screen after the workbench itself. The interfaces give up lime for gold at
   * 65 rather than fight them for the band.
   * Numbers move to warm red and enum members to rose, which empties the whole
   * warm quarter of anything that could be confused with the chrome, and the
   * keywords take magenta at 326 — green's complement, the pairing that makes
   * this variant look deliberate rather than salvaged.
   *
   * Types stay cyan at 195: 45 degrees off the family, and cyan against green
   * separates on chroma as much as on hue, so it holds.
   *
   * The loudest ink of the eight, and the strings are why. A yellow-green is
   * the one hue where `lift` works against itself — the altitude that keeps it
   * from reading as khaki also drains it toward a pale wheat — so what the
   * correction costs is given back in chroma.
   */
  green: {
    hue: 150,
    groundChroma: 1.1, chromeChroma: 1.05, inkChroma: 1.12,
    accent: { h: 155, c: 0.16, l: 0.566 },
    hues: {
      keyword: 326, generic: 290,
      enumMember: 355, number: 30, iface: 65, string: 125, type: 195, func: 245,
    },
  },

  /*
   * CYAN — the family takes the teal the types were using, so the types cross
   * to the *other* side of the strings: jade at 168, with the strings at 135
   * between them and the greens. That is the one place in the eight where a
   * semantic role changes which side of its neighbour it sits on, and it is
   * what keeps the cool half from stacking three roles into 60 degrees.
   * Functions hold their blue at 255, well clear.
   *
   * The loudest ink and ground of the set. Cyan is the pinch in sRGB — at the
   * lightness the accent lives at there is barely half the chroma available
   * that violet has — so matching indigo's numbers here would mean a variant
   * that is not so much cyan as pale grey-blue.
   */
  cyan: {
    hue: 200,
    groundChroma: 1.15, chromeChroma: 1.1, inkChroma: 1.05,
    accent: { h: 205, c: 0.135, l: 0.576 },
    hues: {
      keyword: 345, generic: 295,
      enumMember: 30, number: 60, iface: 92, string: 135, type: 168, func: 255,
    },
  },

  /*
   * BLUE — the family sits on the functions, which are the one role besides
   * strings with a convention nobody breaks. They do not break it: they step to
   * azure-cyan at 215, still unmistakably blue, 43 degrees clear of the chrome
   * and bold besides, and the types drop back to teal at 180 to make the room.
   * Everything warm then has the whole other half of the wheel to itself, so
   * blue is the only crowded family whose numbers, enum members and interfaces
   * all keep their conventional hues.
   *
   * The signature is the one relationship indigo's own arithmetic still gets
   * nearly right at this hue: family plus 57 lands on 315, and the pole sits a
   * few degrees under it at 310 so that no two of the eight signatures are the
   * same colour — the one cross-variant constraint the per-family tables have
   * to satisfy that none of them can see on its own.
   */
  blue: {
    hue: 258,
    groundChroma: 1.05, chromeChroma: 1, inkChroma: 1.02,
    accent: { h: 255, c: 0.19, l: 0.566 },
    hues: {
      keyword: 310, generic: 340,
      enumMember: 15, number: 50, iface: 108, string: 148, type: 180, func: 215,
    },
  },
};

/** The family hue of each variant, for anything that needs to name it. */
export const FAMILIES = Object.fromEntries(
  FAMILY_ORDER.map((f) => [f, VARIANTS[f].hue])
) as Record<Family, number>;

/* -------------------------------------------------------------- *
 * The separation floor
 * -------------------------------------------------------------- */

/*
 * The least hue separation any two roles that must be told apart may have.
 *
 * It is a floor now, where the previous version had a ceiling, and the swap is
 * the whole difference between a table that is designed and a table that is
 * relaxed. A ceiling was what a rotation separationOwed: hues arrived wherever the turn
 * put them and the machinery asked for as much clearance as it could get away
 * with before over-constraining the arc. Named hues arrive where they were put,
 * so the only thing left to state is the minimum below which two roles start
 * being mistaken for each other — and the build asserts it rather than this
 * file arranging around it. If a hue in `VARIANTS` is ever edited into its
 * neighbour, the build says which pair and in which family, and writes nothing.
 *
 * 22 rather than a rounder number because that is what the shipped theme's own
 * the closest pair pair costs: indigo puts enum members and numbers 19.5 degrees apart
 * and interfaces and strings 35.7, telling the close pair apart by lightness
 * and chroma instead. A floor that condemned the original theme would be the
 * wrong floor, so the check exempts indigo's own arrangement and holds the
 * seven designed ones to a bar just above it.
 */
export const SEPARATION = 22;

/** The roles held apart: the family cluster, the pole, and the semantic six. */
const CONTESTED: Named[] = ['enumMember', 'number', 'iface', 'string', 'type', 'func'];

/**
 * The closest pair of roles in a family, for the build to check.
 *
 * The family hue stands in for the whole chrome cluster: variables, properties
 * and operators sit within 12 degrees of it by design and are told apart by
 * lightness, so clearing the family clears all three. `generic` is left out for
 * the opposite reason — it is the one signature colour well below the syntax
 * band, at L 0.53 against 0.75 to 0.89, so nothing can be confused with it
 * whatever the hues do.
 */
export function closestPair(family: Family): { a: string; b: string; deg: number } {
  const v = VARIANTS[family];
  const points: [string, number][] = [
    ['family', v.hue],
    ['keyword', v.hues.keyword],
    ...CONTESTED.map((n) => [n, v.hues[n]] as [string, number]),
  ];

  let worst = { a: '', b: '', deg: 360 };
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const deg = Math.abs(signedHueDelta(points[i][1], points[j][1]));
      if (deg < worst.deg) worst = { a: points[i][0], b: points[j][0], deg };
    }
  }
  return worst;
}

/* -------------------------------------------------------------- *
 * Lightness the hue asks for
 * -------------------------------------------------------------- */

/*
 * The lightness a hue needs on top of its own to stop looking like mud.
 *
 * OKLCH holds *perceived* lightness across hue, which is exactly what this
 * palette needs and is still not the whole story: a saturated hue near 100 at
 * L 0.73 does not read as a bright yellow-green, it reads as khaki. Yellows
 * need altitude in a way violets do not.
 *
 * The theme knew this before this file existed. Its warm roles all sit high —
 * lime interfaces at L 0.885, amber numbers at 0.843, orange enum members at
 * 0.811 — while its cool ones sit low: operators at 0.705, keywords at 0.734.
 * That is not a coincidence about those roles, it is the same correction, made
 * by hand, one colour at a time.
 *
 * So it is applied as a DIFFERENCE between where a role's hue sits in indigo
 * and where this family put it. A role that has not moved gets nothing, which
 * is what keeps indigo exact; one placed in the yellow band is lifted by as
 * much as the theme would have lifted it, and one placed out of it drops back
 * down. It is why the green variant's gold interfaces and the orange variant's
 * red numbers arrive at a sensible brightness without either being written
 * down: `VARIANTS` names hues, and this decides what those hues cost.
 */
const LIFT_PEAK = 95; // the hue that needs it most
const LIFT_MAX = 0.09; // and how much, in OKLCH lightness

function hueLightnessLift(hue: number): number {
  const away = Math.abs(signedHueDelta(LIFT_PEAK, hue));
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
 * the whole theme is built on.
 *
 * So the lift fades in across the band where the theme stops making grounds and
 * starts making ink. Grounds, borders and selection get none of it; the tokens
 * get all of it. The accent is exempt outright — its lightness is named per
 * family, so there is nothing to correct.
 */
const LIFT_FROM = 0.4;
const LIFT_FULL = 0.62;

function liftShareAtLightness(lightness: number): number {
  const t = Math.max(0, Math.min(1, (lightness - LIFT_FROM) / (LIFT_FULL - LIFT_FROM)));
  return t * t * (3 - 2 * t); // smoothstep, so nothing changes abruptly mid-ramp
}

/* -------------------------------------------------------------- *
 * Building a palette
 * -------------------------------------------------------------- */

export type Palette = Record<RoleName, Colour>;

/** Where a role sits when the family is indigo — the reference for everything. */
function indigoHueOf(name: RoleName): number {
  const role = ROLES[name];
  if (role.band === 'ground' || role.band === 'chrome') return wrapDegrees(BASE_HUE + role.h);
  return wrapDegrees(role.h);
}

/** The hue each role lands on in a given variant. */
export function huesFor(family: Family): Record<RoleName, number> {
  const v = VARIANTS[family];
  const out = {} as Record<RoleName, number>;

  for (const [key, role] of Object.entries(ROLES) as [RoleName, Role][]) {
    /*
     * A `*Bright` terminal colour is its base at another lightness, so it takes
     * the base's new hue plus whatever gap indigo put between the two — which
     * is a degree or three, and keeping it is what stops the pair from reading
     * as two different colours in a terminal.
     */
    if (role.from) {
      const base = role.from as RoleName;
      out[key] = wrapDegrees(out[base] + signedHueDelta(indigoHueOf(base), role.h));
      continue;
    }

    out[key] =
      role.band === 'ground' || role.band === 'chrome'
        ? wrapDegrees(v.hue + role.h)
        : role.band === 'accent'
          ? wrapDegrees(v.accent.h + (key === 'accentDim' ? DIM_HUE : 0))
          : wrapDegrees(v.hues[key as Named]);
  }

  return out;
}

/*
 * CHROMA IS ABSOLUTE WITHIN A BAND, and that is worth recording because the
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
 * So chroma is indigo's number, scaled by one multiplier for the whole band —
 * a judgement made once per family about how loud its grounds, its chrome and
 * its ink should be, rather than a formula applied per colour. Where a hue
 * cannot hold the result, `hex()` reduces it to the most that hue can, which
 * for the near-black grounds is not a defect but the best available answer:
 * the tint those hues can carry at L 0.08 is simply smaller, and taking all of
 * it is the most colour there is to take.
 */
function chromaOf(name: RoleName, variant: Variant): number {
  const role = ROLES[name];
  switch (role.band) {
    case 'ground':
      return role.c * variant.groundChroma;
    case 'chrome':
      return role.c * variant.chromeChroma;
    case 'accent':
      return variant.accent.c * (name === 'accentDim' ? DIM_CHROMA : 1);
    default:
      return role.c * variant.inkChroma;
  }
}

/** The 38 colours of one variant. */
export function paletteFor(family: Family): Palette {
  const v = VARIANTS[family];
  const hues = huesFor(family);
  const out = {} as Palette;

  for (const name of Object.keys(ROLES) as RoleName[]) {
    const role = ROLES[name];
    const h = hues[name];

    /*
     * Lightness: the accent's is named by the family and taken as given. Every
     * other role gets its own, plus whatever its new hue needs and its old one
     * did not — and only as much of that as a role this bright is owed. A role
     * that has not moved gets exactly its own, which is what keeps indigo the
     * theme it already was.
     */
    const l =
      role.band === 'accent'
        ? v.accent.l + (name === 'accentDim' ? DIM_LIGHT : 0)
        : Math.min(0.99, role.l + liftShareAtLightness(role.l) * (hueLightnessLift(h) - hueLightnessLift(indigoHueOf(name))));

    out[name] = hexFromOklch({ l, c: chromaOf(name, v), h });
  }

  return out;
}

export { BASE_HUE, CONTESTED, ROLES, VARIANTS };
