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

import { contrastRatio, signedHueDelta, hexFromOklch, wrapDegrees, type Colour, type Oklch } from '../shared/color.ts';

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
 *   signal   error and warning: the two diagnostics no syntax colour can play
 *            (`signalRole` says why). Absolute hues, named per family, and the
 *            one band no family scales the chroma of — an error is as loud in
 *            the quietest variant as in the loudest.
 */
type Band = 'ground' | 'chrome' | 'accent' | 'pole' | 'semantic' | 'signal';

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

/**
 * A diagnostic with a colour of its own. The other signals borrow a syntax ink
 * (`Signals`), and these two cannot: an error in the keyword colour is a
 * squiggle the colour of the word it underlines — and indigo's keywords are the
 * pink the roadmap rules out for errors — while every ink warm enough to be a
 * warning is a pastel amber or lime that numbers and interfaces are written in.
 * So the error is a saturated red darker than the syntax band and the warning a
 * saturated yellow at its top: set apart from the code by chroma and lightness,
 * not by hue alone. tools/theme/build-color-themes.ts checks the distance.
 *
 * They are also the terminal's red and yellow (M6), so a failed build prints
 * in the colour the editor's squiggle is drawn in. `from` names the base of a
 * bright terminal partner, as it does for the signature and semantic roles.
 */
const signalRole = (lightness: number, chroma: number, hue: number, from?: string): Role =>
  ({ l: lightness, c: chroma, h: hue, band: 'signal', from });

/*
 * Measured out of the shipped theme with tools/shared/color.ts, one entry per distinct
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
  // Not in the shipped theme: the terminal's bright magenta where the properties
  // play its magenta (M9), their colour at the bright row's lightness.
  propertyBright: semanticRole(0.82, 0.11, 299.5, 'property'),

  /* --- the signature pole: keywords and punctuation --- */
  keyword: signatureRole(0.734, 0.2024, 347.1), //                      #FF6AC1  keywords, punctuation, terminal.ansiMagenta
  keywordBright: signatureRole(0.789, 0.1549, 344.9, 'keyword'), //     #FF8FD1  terminal.ansiBrightMagenta
  generic: signatureRole(0.531, 0.2015, 5.6), //                        #C2185B  type parameters, lifted by FLOORS
  // Not a colour of its own (M13): the type-parameter crimson where it was before
  // FLOORS lifted it, kept for the debugging status bar, whose white text needs
  // the depth. `from` gives it the generic's hue in every family.
  genericDeep: signatureRole(0.531, 0.2015, 5.6, 'generic'), //         #C2185B  the debugging status bar

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

  /* --- diagnostics that are not syntax: M4, so not in the shipped theme --- */
  error: signalRole(0.66, 0.21, 22), //                                     errors, failed tests, terminal.ansiRed
  errorBright: signalRole(0.76, 0.16, 20, 'error'), //                      terminal.ansiBrightRed
  warning: signalRole(0.83, 0.175, 94), //                                  warnings, the paused frame, terminal.ansiYellow
  warningBright: signalRole(0.91, 0.15, 92, 'warning'), //                  terminal.ansiBrightYellow
} satisfies Record<string, Role>;

export type RoleName = keyof typeof ROLES;

/** Painted the same in every variant: text on the accent, which must be white. */
export const WHITE: Colour = '#FFFFFF';

/* -------------------------------------------------------------- *
 * The seven other designs
 * -------------------------------------------------------------- */

/** The roles a variant names outright, because each carries its own identity. */
type Named = 'keyword' | 'generic' | 'string' | 'func' | 'number' | 'type' | 'enumMember' | 'iface';

/** The inks a signal can be borrowed from: every syntax colour bright enough to be read as one. */
export type Ink = Named | 'property' | 'operator';

/**
 * Which ink says "success", "info" and "hint" in a family, and which two finish
 * the six-colour chart series. Error and warning are not here: they are palette
 * roles of their own, and `signalRole` says why.
 *
 * Borrowed rather than made, because the rule is that the theme does not grow a
 * colour without a role and these already have one: a red that is only ever an
 * error squiggle would be the one colour on the screen the palette did not
 * design. It is written down per family rather than computed for the reason the
 * hues are. Nearest-hue matching was tried and gives indigo an orange error —
 * the enum members sit 30 degrees from red, the keywords 38 — and indigo's
 * errors are pink for the same reason its deleted lines already are.
 *
 * tools/theme/build-color-themes.ts checks that each one still lands near the colour
 * it is named for, and that no two share an ink.
 */
export type Signals = Record<'success' | 'info' | 'hint' | 'orange' | 'purple', Ink>;

/** The diagnostics that are palette roles rather than borrowed inks. */
export type OwnSignal = 'error' | 'warning';

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
  /**
   * The accent, outright: hue, chroma, and the lightness white must read on —
   * at AA, because a button's label is text. Orange, green and cyan sat a
   * shade too light for that until M13, at 4.2 to 4.4:1.
   */
  accent: { h: number; c: number; l: number };
  /** Where each named role sits on the wheel in this family. */
  hues: Record<Named, number>;
  /** Where the error and the warning sit: a red and a yellow, placed clear of this family's inks. */
  signalHues: Record<OwnSignal, number>;
  /** Which of those roles doubles as each other signal. */
  signals: Signals;
  /**
   * The pair that plays the terminal's magenta and bright magenta, when it is
   * not the keywords. The keywords are the signature pole, a magenta or a
   * violet in seven families; where they are a red, the terminal would have
   * two, so the family names another pair.
   */
  terminalMagenta?: [normal: RoleName, bright: RoleName];
  /**
   * Roles this family draws outright rather than deriving: an absolute hue,
   * chroma or lightness in place of indigo's measurement. A lightness given here
   * is a decision, like the accent's, so `lift` does not touch it. Indigo has
   * none — its roles are the measurements.
   */
  redrawn?: Partial<Record<RoleName, Partial<Oklch>>>;
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

/*
 * KEYWORDS IN THE FAMILY'S OWN COLOUR (M9).
 *
 * Indigo answers its violet chrome with pink keywords, and the seven designs
 * first copied that relationship: every family's keywords were a magenta or a
 * violet on the far side of the wheel from it. M9 turns that round. A keyword
 * is the loudest thing in the code, so it is the one that says which theme this
 * is — the orange variant writes its keywords in orange, the green one in green
 * — each drawn for its family rather than lifted from another colour: its hue,
 * and a lightness and chroma that make that hue read as itself in bold italic.
 *
 * Keywords can only move onto the family hue if what was there moves off it.
 * The properties and the operators were family by definition, and at the
 * keyword's hue they are 2 to 7 ΔE from it — the same colour. So the roles
 * swap. The properties take the hue the keywords had, the complementary
 * magenta or violet each family was designed with, and keep their own
 * lightness; the operators give up their hue for a quiet tint of the family,
 * told from the variables by lightness, which is what an operator between two
 * names needs to be.
 */
const OPERATOR_CHROMA = 0.05;

const ownKeywords = (keyword: Partial<Oklch>, formerPole: number): Variant['redrawn'] => ({
  keyword,
  property: { h: formerPole },
  operator: { c: OPERATOR_CHROMA },
});

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
    signalHues: { error: 22, warning: 94 },
    signals: {
      success: 'string', info: 'func', hint: 'type',
      orange: 'enumMember', purple: 'property',
    },
  },

  /*
   * PURPLE — indigo's near neighbour, and so the one variant at real risk of
   * being indistinguishable from it. What separates them is not the 30 degrees
   * between the families, it is what the code is written in: indigo answers
   * its violet chrome with pink keywords, purple writes its keywords in its own
   * violet (M9) and gives the pink side of the wheel to its properties, at 345
   * where they clear the orange enum members. The chrome runs a shade quieter,
   * because magenta at indigo's chroma makes the body text read as lilac rather
   * than as text.
   */
  purple: {
    hue: 320,
    groundChroma: 0.95, chromeChroma: 0.95, inkChroma: 0.98,
    accent: { h: 311, c: 0.2, l: 0.566 },
    hues: {
      keyword: 308, generic: 350,
      enumMember: 38, number: 68, iface: 108, string: 145, type: 200, func: 258,
    },
    // The properties are the rose at 345, so the error leans the other way,
    // toward vermilion, and sits darker and louder than they do.
    signalHues: { error: 28, warning: 91 },
    signals: {
      success: 'string', info: 'func', hint: 'type',
      orange: 'enumMember', purple: 'keyword',
    },
    redrawn: ownKeywords({ l: 0.74, c: 0.19 }, 345),
  },

  /*
   * PINK — hot chrome, cool code, which is the inverse of indigo's arrangement
   * and the reason the two do not read as the same theme. Rose grounds, and
   * since M9 hot pink keywords at 352 — the family's own colour, the loudest
   * thing in the editor — with the violet the keywords used to be at 302 kept
   * for the properties, cool against the warm workbench. The semantic body then
   * runs the full warm-to-cool sweep, a little louder than indigo's: cool ink
   * has to hold its own against hot chrome.
   *
   * The type parameters sit at 330, between the keywords and the properties —
   * close to both in hue and nowhere near either in lightness, at L 0.59
   * against 0.74 and a near-black. That is indigo's own arrangement.
   *
   * The pink keywords are the terminal's magenta (M6).
   */
  pink: {
    hue: 350,
    groundChroma: 0.9, chromeChroma: 0.92, inkChroma: 1.05,
    accent: { h: 342, c: 0.2, l: 0.576 },
    hues: {
      keyword: 352, generic: 330,
      enumMember: 52, number: 90, iface: 132, string: 165, type: 202, func: 240,
    },
    /*
     * The family owns rose, so the error steps past it to a true red, darker
     * and more saturated than the rose chrome. The warning sits between the
     * straw numbers at 90 and the lime interfaces at 132.
     */
    signalHues: { error: 22, warning: 109 },
    signals: {
      success: 'string', info: 'func', hint: 'type',
      orange: 'enumMember', purple: 'property',
    },
    redrawn: ownKeywords({ l: 0.74, c: 0.19 }, 302),
  },

  /*
   * RED — the first family that owns part of the semantic wheel, and so the
   * first that had to be re-laid rather than turned. Enum members at 55 and
   * numbers at 75 sit almost on top of a family at 27; both step up and out,
   * to 62 and 90, which pushes the interfaces to gold and the strings to a
   * cleaner green than indigo's. The keywords are the family's red (M9), drawn
   * as a light coral — more light and less chroma than the error, which keeps
   * the saturated, darker red — and the magenta at 337 they had is the
   * properties', and the terminal's magenta.
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
      keyword: 18, generic: 300,
      enumMember: 65, number: 95, iface: 140, string: 170, type: 205, func: 252,
    },
    /*
     * Red is the family, and an error has to be red all the same: a magenta
     * error is the keyword colour, which the roadmap rules out. So it is the
     * family's red made loud — far more chroma than the salmon operators, and
     * lighter than the accent — and it is the one variant where the error is
     * told from the chrome, and from the coral keywords, by weight rather than
     * by hue. The warning is lemon, between the straw numbers at 95 and the
     * green interfaces at 140. The magenta properties are the purple in a
     * chart; the type parameters were, until an "important" alert (M9) had to
     * be read in that colour, and at 3.6:1 could not be.
     */
    signalHues: { error: 25, warning: 109 },
    signals: {
      success: 'string', info: 'func', hint: 'type',
      orange: 'enumMember', purple: 'property',
    },
    redrawn: ownKeywords({ l: 0.77, c: 0.16 }, 337),
    terminalMagenta: ['property', 'propertyBright'],
  },

  /*
   * ORANGE — the family sits in the middle of the warm band, so the two warm
   * semantic roles cannot stay warm in the way they were. They cross instead of
   * crowding: the numbers go to warm red at 22 and the enum members to rose at
   * 350, on the other side of the wheel's zero from the amber chrome. The
   * keywords are the family's orange (M9), and the properties take the violet
   * at 305, clear of the rose enum members. What is left — lime, green, teal,
   * blue — spreads across the whole cool half.
   *
   * The quietest ground of the eight, for the same reason as red and more so:
   * amber is where sRGB is widest, and a tinted near-black at this hue turns
   * brown before it turns orange.
   */
  orange: {
    hue: 60,
    groundChroma: 0.68, chromeChroma: 0.8, inkChroma: 0.95,
    accent: { h: 52, c: 0.155, l: 0.578 },
    hues: {
      keyword: 60, generic: 285,
      enumMember: 350, number: 22, iface: 120, string: 152, type: 190, func: 248,
    },
    // Amber is the family, so the warning steps up to a clean yellow short of
    // the lime interfaces, and a chart's orange is the keywords — a series is
    // not a signal.
    signalHues: { error: 22, warning: 94 },
    signals: {
      success: 'string', info: 'func', hint: 'type',
      orange: 'keyword', purple: 'property',
    },
    redrawn: ownKeywords({ l: 0.78, c: 0.17 }, 305),
    terminalMagenta: ['property', 'propertyBright'],
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
   * warm quarter of anything that could be confused with the chrome. The
   * keywords are the family's green (M9), far louder than the variables at the
   * same hue, and the properties take green's complement, a violet at 308.
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
    accent: { h: 155, c: 0.16, l: 0.548 },
    hues: {
      keyword: 155, generic: 290,
      enumMember: 355, number: 30, iface: 65, string: 125, type: 195, func: 245,
    },
    // The warm quarter is empty of chrome here, so both signals keep their
    // conventional hues; the warning sits between the gold interfaces at 65
    // and the yellow-green strings at 125.
    signalHues: { error: 22, warning: 88 },
    signals: {
      success: 'string', info: 'func', hint: 'type',
      orange: 'number', purple: 'property',
    },
    redrawn: ownKeywords({ l: 0.79, c: 0.18 }, 308),
    terminalMagenta: ['property', 'propertyBright'],
  },

  /*
   * CYAN — the family takes the teal the types were using, so the types cross
   * to the *other* side of the strings: jade at 168, with the strings at 135
   * between them and the greens. That is the one place in the eight where a
   * semantic role changes which side of its neighbour it sits on, and it is
   * what keeps the cool half from stacking three roles into 60 degrees.
   * Functions hold their blue at 255, well clear. The keywords are the
   * family's cyan (M9), and the properties the pink at 345.
   *
   * The loudest ink and ground of the set. Cyan is the pinch in sRGB — at the
   * lightness the accent lives at there is barely half the chroma available
   * that violet has — so matching indigo's numbers here would mean a variant
   * that is not so much cyan as pale grey-blue.
   */
  cyan: {
    hue: 200,
    groundChroma: 1.15, chromeChroma: 1.1, inkChroma: 1.05,
    accent: { h: 205, c: 0.135, l: 0.555 },
    hues: {
      keyword: 208, generic: 295,
      enumMember: 30, number: 60, iface: 92, string: 135, type: 168, func: 255,
    },
    // The interfaces hold the yellow at 92, so the warning is the lemon past
    // them, between them and the strings at 135.
    signalHues: { error: 20, warning: 109 },
    signals: {
      success: 'string', info: 'func', hint: 'type',
      orange: 'number', purple: 'property',
    },
    redrawn: ownKeywords({ l: 0.77, c: 0.14 }, 345),
    terminalMagenta: ['property', 'propertyBright'],
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
   * The keywords are the family's blue (M9), a periwinkle at 262 — clear of the
   * azure functions by 47 degrees — and the violet at 310 they had is the
   * properties'.
   */
  blue: {
    hue: 258,
    groundChroma: 1.05, chromeChroma: 1, inkChroma: 1.02,
    accent: { h: 255, c: 0.19, l: 0.566 },
    hues: {
      keyword: 262, generic: 340,
      enumMember: 15, number: 50, iface: 108, string: 148, type: 180, func: 215,
    },
    // The error clears the rose enum members at 15 by leaning toward
    // vermilion; the warning is the amber between the peach numbers at 50 and
    // the lemon interfaces at 108.
    signalHues: { error: 25, warning: 82 },
    signals: {
      success: 'string', info: 'func', hint: 'type',
      orange: 'number', purple: 'property',
    },
    redrawn: ownKeywords({ l: 0.74, c: 0.16 }, 310),
    terminalMagenta: ['property', 'propertyBright'],
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
 * band, at L 0.59 (0.53 before FLOORS) against 0.75 to 0.89, so nothing can be confused with it
 * whatever the hues do.
 */
export function closestPair(family: Family): { a: string; b: string; deg: number } {
  const v = VARIANTS[family];
  /*
   * Where the keywords are the family's own colour (M9), the chrome cluster
   * has left the family hue — the properties carry the old pole, the operators
   * are a near-grey — so the keywords stand for the family, and the properties
   * join the roles held apart.
   */
  const ownKeyword: boolean = v.redrawn?.keyword !== undefined;
  const points: [string, number][] = [
    ...(ownKeyword
      ? [['property', huesFor(family).property] as [string, number]]
      : [['family', v.hue] as [string, number]]),
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

    const redrawnHue: number | undefined = v.redrawn?.[key]?.h;
    out[key] =
      redrawnHue !== undefined
        ? wrapDegrees(redrawnHue)
        : role.band === 'ground' || role.band === 'chrome'
        ? wrapDegrees(v.hue + role.h)
        : role.band === 'accent'
          ? wrapDegrees(v.accent.h + (key === 'accentDim' ? DIM_HUE : 0))
          : role.band === 'signal'
            ? wrapDegrees(v.signalHues[key as OwnSignal])
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
  const redrawnChroma: number | undefined = variant.redrawn?.[name]?.c;
  if (redrawnChroma !== undefined) return redrawnChroma;
  switch (role.band) {
    case 'ground':
      return role.c * variant.groundChroma;
    case 'chrome':
      return role.c * variant.chromeChroma;
    case 'accent':
      return variant.accent.c * (name === 'accentDim' ? DIM_CHROMA : 1);
    case 'signal':
      return role.c;
    default:
      return role.c * variant.inkChroma;
  }
}

/*
 * LEGIBILITY FLOORS (M13).
 *
 * The least contrast a role may have against the lightest ground it is read
 * on, and the reason a floor rather than a lightness: the lightness a role
 * needs to clear a ground depends on its hue and on how light that family's
 * ground is, so a number written in the role table would be right in one
 * family and a guess in the other seven. The role keeps its hue and chroma and
 * is raised, in small steps, until it clears — and a role that already clears
 * is not touched.
 *
 *   generic  the type parameters were a "dark partner" at 3.5:1, and under a
 *            selection 2.5:1: the one role in the code under AA. `T` is read
 *            like any other name, so it gets AA, and stays the darkest ink.
 *   fgFaint  line numbers and the inactive activity-bar icons at 2.3:1. They
 *            are not body text, but they are read — the line an error names,
 *            which view a button opens — so WCAG's 3:1 for incidental text and
 *            controls, on the side bar, the lightest ground they sit on.
 *   fgMuted  the comments at 3.76:1 recede as designed, but under a selection
 *            they fell to 2.8:1. Held to 3:1 there, which lifts them a shade.
 */
const FLOORS: Partial<Record<RoleName, { against: RoleName; ratio: number }>> = {
  generic: { against: 'bg', ratio: 4.5 },
  fgFaint: { against: 'bgSide', ratio: 3 },
  fgMuted: { against: 'sel', ratio: 3 },
};

/** The 41 colours of one variant. */
export function paletteFor(family: Family): Palette {
  const v = VARIANTS[family];
  const hues = huesFor(family);
  const out = {} as Palette;
  const placed = {} as Record<RoleName, Oklch>;

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
    const redrawnLightness: number | undefined = v.redrawn?.[name]?.l;
    const l =
      redrawnLightness !== undefined
        ? redrawnLightness
        : role.band === 'accent'
        ? v.accent.l + (name === 'accentDim' ? DIM_LIGHT : 0)
        : Math.min(0.99, role.l + liftShareAtLightness(role.l) * (hueLightnessLift(h) - hueLightnessLift(indigoHueOf(name))));

    placed[name] = { l, c: chromaOf(name, v), h };
    out[name] = hexFromOklch(placed[name]);
  }

  for (const [name, floor] of Object.entries(FLOORS) as [RoleName, { against: RoleName; ratio: number }][]) {
    let lightness: number = placed[name].l;
    while (contrastRatio(out[name], out[floor.against]) < floor.ratio && lightness < 0.99) {
      lightness += 0.0005;
      out[name] = hexFromOklch({ ...placed[name], l: lightness });
    }
  }

  return out;
}

/** Which ink plays each signal in a family. */
export const signalsFor = (family: Family): Signals => VARIANTS[family].signals;

/** The roles that play the terminal's magenta and bright magenta in a family. */
export const terminalMagentaFor = (family: Family): [normal: RoleName, bright: RoleName] =>
  VARIANTS[family].terminalMagenta ?? ['keyword', 'keywordBright'];

export { BASE_HUE, CONTESTED, ROLES, VARIANTS };
