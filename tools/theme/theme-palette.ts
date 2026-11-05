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
 *
 * AND WHAT REPLACED IT (#11). The seven were redrawn from nothing: no family
 * starts from indigo's measurements any more, so none is a row of hues and
 * multipliers over `ROLES`. Each is a `FamilyDesign` instead — every role at an
 * absolute OKLCH, drafted by tools/theme/design-families.ts and frozen here as
 * plain numbers — held to floors measured in ΔE rather than in degrees. They
 * moved into `DESIGNS` one family at a time, Blue (#21) last; the role table
 * and the row machinery above now build indigo alone, and indigo stays exactly
 * what it is.
 */

import {
  contrastRatio,
  deltaE,
  hexFromOklch,
  maxChromaAt,
  oklchFromHex,
  signedHueDelta,
  wrapDegrees,
  type Colour,
  type Oklch,
} from '../shared/color.ts';

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

/*
 * Indigo always has a row here. Each of the other seven had one until it was
 * redrawn as a `FamilyDesign` (#15 to #21), and then the row went; indigo's is
 * the only one left.
 */
const VARIANTS: { indigo: Variant } & Partial<Record<Family, Variant>> = {
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
};

/** A family's row in `VARIANTS`, which only the families not yet redrawn have. */
const variantOf = (family: Family): Variant => {
  const variant: Variant | undefined = VARIANTS[family];
  if (!variant) throw new Error(`${family} has no row in VARIANTS: it is drawn as a FamilyDesign`);
  return variant;
};

/* -------------------------------------------------------------- *
 * The families drawn from nothing
 * -------------------------------------------------------------- */

/*
 * A family written down outright (#14): every role at an absolute OKLCH, and
 * nothing taken from indigo — no multiplier, no offset, no lift. The numbers
 * are what tools/theme/design-families.ts proposed for the family's brief,
 * reviewed, and pasted in as printed: each at the precision `hexFromOklch`
 * turns back into the hex the tool showed. The build never runs the search;
 * it reads these.
 *
 * `FLOORS` still applies on top, as a safety net. A frozen design clears them
 * already, and if an edit ever made one not, the role is raised rather than
 * the theme shipped under its floor.
 */
export type FamilyDesign = {
  /** The hue the brief gave the grounds: what the family is called by. */
  groundHue: number;
  roles: Record<RoleName, Oklch>;
  /** Which ink plays each borrowed signal, as in a row of `VARIANTS`. */
  signals: Signals;
  /** The pair that plays the terminal's magenta and bright magenta, when it is not the keywords. */
  terminalMagenta?: [normal: RoleName, bright: RoleName];
};

/** The families already redrawn. Indigo cannot be one: it is held to what shipped. */
const DESIGNS: Partial<Record<Exclude<Family, 'indigo'>, FamilyDesign>> = {
  /*
   * PURPLE · AMETISTA (#15) — indigo's near neighbour, and so the one family at
   * real risk of being taken for it. What separates them is not the 22 degrees
   * between the grounds, it is what the code is written in: indigo answers its
   * violet chrome with pink keywords, and here the keyword is the violet — at
   * 305, the only saturated purple in the code, so the family is named by the
   * loudest word on the screen. Everything else is placed so that nothing near
   * it competes. The pink side of the wheel goes to the properties, an orchid at
   * 333, and the type parameters are the same orchid sunk to a plum, told from
   * it by darkness. The operators are a near-grey of the ground, the variables
   * a near-white of it.
   *
   * The semantic inks are the convention, moved to the hues this ground leaves
   * them: mint strings at 158, a cyan for the types at 210 — the search took
   * them a dozen degrees off teal, away from the strings, and the pair is still
   * one of the closest — and a clear blue for the functions at 247; old gold
   * for the numbers at 83, lime interfaces at 116,
   * coral enum members at 25. The error shares the enum members' hue and is
   * told from them by weight: darker, and half as saturated again.
   *
   * The ground is velvet: more chroma in the near-blacks than any warm family
   * can carry, because violet is where sRGB holds it at that lightness. Its
   * focus and selection sit where indigo's do, not above them; the brief's
   * history is in tools/theme/design-families.ts.
   *
   * Closest inks: the operators and the functions, 13.7 ΔE apart. The table
   * this replaced put its closest pair at 7.6.
   */
  purple: {
    groundHue: 312,
    roles: {
      bg:             { l: 0.089, c: 0.029, h: 310.8 }, // #040107
      bgDeep:         { l: 0.104, c: 0.027, h: 313.4 }, // #060209
      bgSide:         { l: 0.109, c: 0.033, h: 310.4 }, // #07020C
      ansiBlack:      { l: 0.123, c: 0.036, h: 310.5 }, // #0A0310
      bgLine:         { l: 0.149, c: 0.046, h: 310.6 }, // #110519
      bgLift:         { l: 0.157, c: 0.047, h: 311.2 }, // #13061B
      bgTab:          { l: 0.179, c: 0.053, h: 311.8 }, // #190922
      line:           { l: 0.203, c: 0.056, h: 311.5 }, // #1F0E29
      selDim:         { l: 0.235, c: 0.078, h: 311.9 }, // #2A1038
      sel:            { l: 0.265, c: 0.102, h: 311.7 }, // #351048
      whitespace:     { l: 0.299, c: 0.072, h: 315.1 }, // #3B2146
      border:         { l: 0.366, c: 0.089, h: 311.9 }, // #4E2F60
      accentDim:      { l: 0.392, c: 0.144, h: 304.8 }, // #582982
      accent:         { l: 0.560, c: 0.200, h: 305.1 }, // #914AD0
      fgFaint:        { l: 0.500, c: 0.044, h: 314.9 }, // #6D5C75
      fgMuted:        { l: 0.561, c: 0.045, h: 315.4 }, // #7F6D87
      fgDim:          { l: 0.680, c: 0.041, h: 315.0 }, // #A291AA
      fg:             { l: 0.750, c: 0.038, h: 314.6 }, // #B7A7BF
      fgBright:       { l: 0.821, c: 0.036, h: 314.1 }, // #CDBED5
      cursor:         { l: 0.799, c: 0.091, h: 305.0 }, // #CBAFED
      fgWhite:        { l: 0.956, c: 0.014, h: 314.8 }, // #F4EEF7
      variable:       { l: 0.889, c: 0.020, h: 312.8 }, // #DFD7E4
      property:       { l: 0.813, c: 0.138, h: 333.1 }, // #F79FE8
      operator:       { l: 0.677, c: 0.033, h: 324.2 }, // #A291A3
      propertyBright: { l: 0.893, c: 0.086, h: 333.2 }, // #FFC7F4
      keyword:        { l: 0.699, c: 0.172, h: 305.5 }, // #B87EF2
      keywordBright:  { l: 0.779, c: 0.142, h: 305.6 }, // #CD9EFF
      generic:        { l: 0.583, c: 0.140, h: 336.2 }, // #AD579A
      genericDeep:    { l: 0.500, c: 0.171, h: 336.3 }, // #9B3187
      string:         { l: 0.865, c: 0.173, h: 158.4 }, // #53F4A7
      stringBright:   { l: 0.945, c: 0.086, h: 158.1 }, // #BCFFD7
      func:           { l: 0.719, c: 0.134, h: 246.6 }, // #56ABF3
      funcBright:     { l: 0.799, c: 0.108, h: 246.6 }, // #82C4FF
      number:         { l: 0.7663, c: 0.1356, h: 82.71 }, // #DDAA3D
      type:           { l: 0.8331, c: 0.1236, h: 209.57 }, // #4EDEF4
      typeBright:     { l: 0.912, c: 0.079, h: 210.0 }, // #A3F1FF
      enumMember:     { l: 0.727, c: 0.145, h: 24.8 }, // #F47F78
      iface:          { l: 0.921, c: 0.181, h: 116.1 }, // #DFF351
      error:          { l: 0.659, c: 0.220, h: 24.9 }, // #FC4447
      errorBright:    { l: 0.758, c: 0.144, h: 24.6 }, // #FF8982
      warning:        { l: 0.8590, c: 0.1696, h: 89.81 }, // #FCCA21
      warningBright:  { l: 0.938, c: 0.077, h: 89.4 }, // #FFE9B0
    },
    signals: { success: 'string', info: 'func', hint: 'type', orange: 'number', purple: 'keyword' },
  },

  /*
   * PINK · FLOR NEON (#16) — a flower on a dark stem: hot chrome and a hot
   * keyword, and the rest of the code in the colours of the plant around it,
   * which is the inverse of indigo's arrangement and the reason the two never
   * read as the same theme. The keyword is the petal, hot pink at 350, the
   * family's own colour and the loudest word on the screen. The violet side of
   * the wheel goes to the properties, a lilac at 310, and the type parameters
   * are a dark violet at 319 between the two, told from both by darkness, as
   * in indigo. The operators are a near-grey of the ground, the variables a
   * near-white of it.
   *
   * The strings are leaf green at 159 and the types the stem's aqua at 182,
   * apart by lightness as much as by hue; a clear blue for the functions at
   * 238 and a lime for the interfaces at 123. The warm quarter holds two inks,
   * apricot numbers at 62 and salmon enum members at 39, and they are the
   * closest pair: the numbers are a tenth lighter, the enum members two fifths
   * more saturated. The error is a true red at 27, past the salmon by
   * weight, and clear of the rose chrome by its hue.
   *
   * The ground is a rose near-black. Its focus and selection sit where indigo's
   * do, not above them; the brief's history is in
   * tools/theme/design-families.ts.
   *
   * Closest inks: the numbers and the enum members, 12.4 ΔE apart. The table
   * this replaced put its closest pair at 7.3.
   */
  pink: {
    groundHue: 352,
    roles: {
      bg:             { l: 0.091, c: 0.023, h: 350.1 }, // #060103
      bgDeep:         { l: 0.097, c: 0.028, h: 348.5 }, // #080104
      bgSide:         { l: 0.109, c: 0.025, h: 351.6 }, // #0A0205
      ansiBlack:      { l: 0.124, c: 0.028, h: 353.2 }, // #0E0307
      bgLine:         { l: 0.149, c: 0.040, h: 354.0 }, // #17040C
      bgLift:         { l: 0.159, c: 0.042, h: 351.8 }, // #1A050F
      bgTab:          { l: 0.178, c: 0.047, h: 352.7 }, // #200713
      line:           { l: 0.199, c: 0.049, h: 352.4 }, // #260B18
      selDim:         { l: 0.237, c: 0.075, h: 352.1 }, // #370B22
      sel:            { l: 0.265, c: 0.097, h: 352.0 }, // #45082A
      whitespace:     { l: 0.300, c: 0.064, h: 350.4 }, // #451F32
      border:         { l: 0.361, c: 0.085, h: 352.1 }, // #5E2842
      accentDim:      { l: 0.400, c: 0.145, h: 355.4 }, // #7E164B
      accent:         { l: 0.570, c: 0.201, h: 355.1 }, // #CA2F7D
      fgFaint:        { l: 0.499, c: 0.039, h: 350.2 }, // #755A66
      fgMuted:        { l: 0.559, c: 0.040, h: 348.9 }, // #876B78
      fgDim:          { l: 0.680, c: 0.035, h: 350.7 }, // #AA909B
      fg:             { l: 0.751, c: 0.034, h: 350.5 }, // #C0A6B1
      fgBright:       { l: 0.820, c: 0.033, h: 350.4 }, // #D6BCC7
      cursor:         { l: 0.800, c: 0.090, h: 355.6 }, // #EDA6C0
      fgWhite:        { l: 0.955, c: 0.012, h: 351.0 }, // #F7EDF1
      variable:       { l: 0.891, c: 0.028, h: 346.0 }, // #EAD4DF
      property:       { l: 0.786, c: 0.126, h: 309.9 }, // #D2A2F6
      operator:       { l: 0.678, c: 0.030, h: 338.9 }, // #A5919E
      propertyBright: { l: 0.866, c: 0.089, h: 310.2 }, // #E5C3FF
      keyword:        { l: 0.701, c: 0.198, h: 350.3 }, // #F460AF
      keywordBright:  { l: 0.781, c: 0.153, h: 350.2 }, // #FF8CC5
      generic:        { l: 0.588, c: 0.182, h: 318.9 }, // #A951C0
      genericDeep:    { l: 0.499, c: 0.169, h: 318.7 }, // #8A3A9F
      string:         { l: 0.7208, c: 0.1396, h: 159.36 }, // #42BF85
      stringBright:   { l: 0.800, c: 0.118, h: 159.6 }, // #74D5A3
      func:           { l: 0.719, c: 0.138, h: 238.4 }, // #3DAFF0
      funcBright:     { l: 0.799, c: 0.115, h: 238.2 }, // #71C8FF
      number:         { l: 0.822, c: 0.108, h: 62.2 }, // #F7B57A
      type:           { l: 0.876, c: 0.135, h: 182.1 }, // #54F3DD
      typeBright:     { l: 0.950, c: 0.072, h: 181.9 }, // #B9FFF2
      enumMember:     { l: 0.719, c: 0.155, h: 39.2 }, // #F47E56
      iface:          { l: 0.919, c: 0.155, h: 123.0 }, // #D1F57A
      error:          { l: 0.660, c: 0.226, h: 27.1 }, // #FF413C
      errorBright:    { l: 0.761, c: 0.143, h: 27.1 }, // #FF8B7F
      warning:        { l: 0.860, c: 0.170, h: 92.0 }, // #F9CC21
      warningBright:  { l: 0.939, c: 0.083, h: 91.8 }, // #FFEAAB
    },
    signals: { success: 'string', info: 'func', hint: 'type', orange: 'number', purple: 'property' },
  },

  /*
   * RED · BRASA (#17) — red as heat, not alarm: an ember, and the family that
   * owns the colour an error has to be drawn in. So the red is split in two and
   * the halves are told apart by weight. The keyword is the warm half, a
   * rose-crimson at 8 — lighter than the error and quieter, the family's own
   * colour and the loudest word in the code; the error is the scarlet, 24
   * degrees further round at 32, darker and more saturated, and at least
   * 10 ΔE from every ink, so a squiggle shows on the word it is under. The
   * accent is the ember itself, at 22, between the two.
   *
   * The pink side of the wheel goes to the properties, an orchid at 312, and
   * the type parameters are a dark magenta at 337, told from the keyword and
   * from the properties by darkness. The operators are a near-grey of the
   * ground, the variables a near-white of it.
   *
   * The warm quarter holds three inks around the ember: amber numbers at 70
   * and orange enum members at 51, which are the closest pair, the numbers a
   * tenth lighter and the enum members a third more saturated; and the keyword
   * itself, the same distance from the enum members. The cool half is open,
   * and the code goes there: green strings at 156, petrol types at 185 — a
   * tenth darker than the strings, which is what tells them apart — a steel
   * blue for the functions at 256 and a lime for the interfaces at 125.
   *
   * The ground is a warm near-black with two fifths less chroma than indigo's:
   * red is where sRGB is most generous, and a tinted near-black at this hue
   * turns maroon long before it turns red. Its focus and selection sit where
   * indigo's do; the brief's history is in tools/theme/design-families.ts.
   *
   * Closest inks: the numbers and the enum members, 12.4 ΔE apart, and the
   * keyword and the enum members at 12.4. The table this replaced put its
   * closest pair at 6.4.
   */
  red: {
    groundHue: 22,
    roles: {
      bg:             { l: 0.085, c: 0.018, h: 21.8 }, // #050101
      bgDeep:         { l: 0.100, c: 0.017, h: 20.5 }, // #070202
      bgSide:         { l: 0.104, c: 0.021, h: 21.4 }, // #090202
      ansiBlack:      { l: 0.119, c: 0.024, h: 21.3 }, // #0D0303
      bgLine:         { l: 0.145, c: 0.031, h: 21.7 }, // #150505
      bgLift:         { l: 0.159, c: 0.033, h: 21.5 }, // #190707
      bgTab:          { l: 0.174, c: 0.037, h: 21.6 }, // #1E0909
      line:           { l: 0.199, c: 0.039, h: 21.2 }, // #250E0E
      selDim:         { l: 0.236, c: 0.061, h: 23.0 }, // #361010
      sel:            { l: 0.264, c: 0.080, h: 21.3 }, // #441013
      whitespace:     { l: 0.300, c: 0.048, h: 26.2 }, // #432421
      border:         { l: 0.356, c: 0.069, h: 22.4 }, // #5B2C2B
      accentDim:      { l: 0.396, c: 0.136, h: 22.3 }, // #801A22
      accent:         { l: 0.565, c: 0.190, h: 22.2 }, // #CE343F
      fgFaint:        { l: 0.501, c: 0.030, h: 24.0 }, // #745D5B
      fgMuted:        { l: 0.560, c: 0.029, h: 23.9 }, // #856E6C
      fgDim:          { l: 0.680, c: 0.028, h: 23.8 }, // #A99290
      fg:             { l: 0.750, c: 0.026, h: 23.9 }, // #BEA8A6
      fgBright:       { l: 0.821, c: 0.023, h: 27.8 }, // #D3BFBC
      cursor:         { l: 0.800, c: 0.089, h: 22.6 }, // #F2A7A3
      fgWhite:        { l: 0.955, c: 0.009, h: 26.0 }, // #F6EEED
      variable:       { l: 0.890, c: 0.020, h: 25.2 }, // #E8D6D4
      property:       { l: 0.798, c: 0.117, h: 311.7 }, // #D6A7F4
      operator:       { l: 0.695, c: 0.030, h: 23.3 }, // #AF9694
      propertyBright: { l: 0.878, c: 0.082, h: 311.7 }, // #E9C8FF
      keyword:        { l: 0.700, c: 0.173, h: 7.9 }, // #F4698A
      keywordBright:  { l: 0.779, c: 0.134, h: 7.8 }, // #FF91A7
      generic:        { l: 0.594, c: 0.198, h: 337.2 }, // #C342A8
      genericDeep:    { l: 0.499, c: 0.169, h: 337.2 }, // #9B3185
      string:         { l: 0.823, c: 0.171, h: 156.1 }, // #4DE595
      stringBright:   { l: 0.903, c: 0.146, h: 156.1 }, // #85FCB6
      func:           { l: 0.721, c: 0.127, h: 256.0 }, // #6EA7F3
      funcBright:     { l: 0.802, c: 0.101, h: 256.1 }, // #93C1FF
      number:         { l: 0.826, c: 0.121, h: 70.3 }, // #F8B86A
      type:           { l: 0.721, c: 0.109, h: 185.1 }, // #3FBBAE
      typeBright:     { l: 0.801, c: 0.093, h: 185.1 }, // #72D2C6
      enumMember:     { l: 0.720, c: 0.162, h: 50.7 }, // #F28237
      iface:          { l: 0.921, c: 0.182, h: 124.7 }, // #CAF964
      error:          { l: 0.661, c: 0.220, h: 32.1 }, // #FC492B
      errorBright:    { l: 0.761, c: 0.144, h: 32.0 }, // #FF8C76
      warning:        { l: 0.8703, c: 0.1794, h: 96.94 }, // #F6D300
      warningBright:  { l: 0.949, c: 0.089, h: 96.7 }, // #FFEFAA
    },
    signals: { success: 'string', info: 'func', hint: 'type', orange: 'enumMember', purple: 'property' },
  },

  /*
   * ORANGE · CREPÚSCULO (#18) — dusk: the sun on the horizon and the sky above
   * it. The keyword is the horizon, an orange at 59 and the family's own
   * colour, the loudest word in the code; a chart's orange is the keyword too,
   * since a series is not a signal. The accent is the same sun a little
   * redder, at 52, and a little darker than white text on it needs: orange is
   * light for its contrast, and a find match drawn from it at the ceiling
   * washed the operators out.
   *
   * The sky takes the rest of the warm side, so nothing else in the code is
   * amber: the numbers are its pink at 329 and the enum members a coral at 4,
   * across the wheel's zero from the keyword, the enum members darker by a
   * tenth and more saturated. The error is the red past them at 27, 11.5 ΔE
   * from the nearest ink. Night comes in from the other side: the type
   * parameters are indigo at 280 and the properties a lavender at 292, the
   * same violet told apart by lightness. The operators are a near-grey of the
   * ground, the variables a near-white of it.
   *
   * The cool half carries the convention: green strings at 155, a sky blue for
   * the functions at 230, aqua types at 190 — lighter than the strings by
   * more than a tenth — and lime interfaces at 131, with the yellow warning
   * at 88 between them and the keyword.
   *
   * The quietest ground of the eight: amber is where sRGB is widest, and a
   * tinted near-black at this hue turns brown before it turns orange. Its
   * focus and selection sit where indigo's do; the brief's history is in
   * tools/theme/design-families.ts.
   *
   * Closest inks: the properties and the numbers, 14.6 ΔE apart, and the
   * operators and the keyword at 14.6. The table this replaced put its closest
   * pair at 6.3.
   */
  orange: {
    groundHue: 58,
    roles: {
      bg:             { l: 0.090, c: 0.011, h: 57.7 }, // #040201
      bgDeep:         { l: 0.096, c: 0.016, h: 43.8 }, // #060201
      bgSide:         { l: 0.105, c: 0.016, h: 60.5 }, // #070301
      ansiBlack:      { l: 0.122, c: 0.016, h: 63.8 }, // #0A0502
      bgLine:         { l: 0.144, c: 0.026, h: 55.5 }, // #120702
      bgLift:         { l: 0.158, c: 0.026, h: 59.9 }, // #150A03
      bgTab:          { l: 0.175, c: 0.029, h: 58.4 }, // #1A0D04
      line:           { l: 0.201, c: 0.036, h: 59.7 }, // #221205
      selDim:         { l: 0.236, c: 0.052, h: 58.6 }, // #301702
      sel:            { l: 0.266, c: 0.059, h: 58.5 }, // #3A1D03
      whitespace:     { l: 0.299, c: 0.048, h: 64.2 }, // #3E2812
      border:         { l: 0.354, c: 0.060, h: 57.2 }, // #53331A
      accentDim:      { l: 0.400, c: 0.103, h: 52.1 }, // #713400
      accent:         { l: 0.5704, c: 0.1464, h: 52.13 }, // #B85900
      fgFaint:        { l: 0.500, c: 0.030, h: 63.3 }, // #706052
      fgMuted:        { l: 0.559, c: 0.030, h: 65.3 }, // #817162
      fgDim:          { l: 0.679, c: 0.027, h: 65.4 }, // #A49587
      fg:             { l: 0.750, c: 0.025, h: 63.4 }, // #BAAB9E
      fgBright:       { l: 0.820, c: 0.025, h: 63.4 }, // #D0C1B4
      cursor:         { l: 0.801, c: 0.090, h: 52.1 }, // #EDAE88
      fgWhite:        { l: 0.955, c: 0.009, h: 62.6 }, // #F5EFEA
      variable:       { l: 0.891, c: 0.040, h: 69.7 }, // #EDD7BF
      property:       { l: 0.720, c: 0.138, h: 292.1 }, // #A793F3
      operator:       { l: 0.675, c: 0.030, h: 60.2 }, // #A59385
      propertyBright: { l: 0.800, c: 0.110, h: 292.0 }, // #BFB1FF
      keyword:        { l: 0.753, c: 0.153, h: 59.0 }, // #F5943B
      keywordBright:  { l: 0.833, c: 0.113, h: 58.9 }, // #FFB67C
      generic:        { l: 0.582, c: 0.198, h: 280.0 }, // #6964EB
      genericDeep:    { l: 0.499, c: 0.170, h: 279.9 }, // #5450C0
      string:         { l: 0.771, c: 0.142, h: 155.0 }, // #5ECF8C
      stringBright:   { l: 0.852, c: 0.122, h: 154.8 }, // #8AE6AB
      func:           { l: 0.782, c: 0.119, h: 229.6 }, // #5AC6F5
      funcBright:     { l: 0.863, c: 0.085, h: 229.6 }, // #96DDFF
      number:         { l: 0.839, c: 0.126, h: 329.4 }, // #F8ACF2
      type:           { l: 0.9025, c: 0.1336, h: 189.76 }, // #59FBF2
      typeBright:     { l: 0.950, c: 0.073, h: 189.7 }, // #B5FFF9
      enumMember:     { l: 0.720, c: 0.159, h: 3.5 }, // #F4759A
      iface:          { l: 0.918, c: 0.163, h: 131.1 }, // #BDFA82
      error:          { l: 0.659, c: 0.220, h: 26.9 }, // #FC4540
      errorBright:    { l: 0.759, c: 0.144, h: 27.1 }, // #FF8A7E
      warning:        { l: 0.8510, c: 0.1703, h: 88.16 }, // #FCC618
      warningBright:  { l: 0.931, c: 0.082, h: 88.3 }, // #FFE6A9
    },
    signals: { success: 'string', info: 'func', hint: 'type', orange: 'keyword', purple: 'property' },
    terminalMagenta: ['property', 'propertyBright'],
  },

  /*
   * GREEN · FLORESTA (#19) — a forest floor, and the family that owns the hue
   * with the strongest convention on it. The keyword is the canopy, an
   * emerald at 146 and the family's own colour, the loudest word in the code;
   * success borrows it, so an added line and the terminal's green are the
   * keyword too, which is safe because an addition is drawn as a shape — a
   * gutter bar, a band behind the line — never as text. The accent is the
   * same green a little cooler, at 155, and a little darker than white text
   * on it needs: a find match drawn from it any lighter washes the operators
   * out, and any darker sinks a toggled button into a pressed one.
   *
   * So a string cannot be green, and leaves the band altogether: wheat, a
   * honey at 65, and a chart's orange is the strings, 10 degrees from the
   * reference, where the numbers would have been 39 off. The warm side holds
   * the rest: coral numbers at 16 and an orchid-pink for the enum members at
   * 338, a tenth lighter. The error is the red past the numbers at 25, 10.1
   * ΔE from them. The interfaces keep the lime at 119, between the keyword
   * and the strings, with the yellow warning at 95 beside them.
   *
   * The far side of the wheel is green's complement: the properties a violet
   * at 310 and the type parameters a dark grape at 292, the same purple told
   * apart by lightness. The cool half carries the convention: turquoise types
   * at 185 and a clear blue for the functions at 251. The operators are a
   * near-grey of the ground, the variables a near-white of it, whose chroma
   * is low enough that the keyword beside them at the same hue is a colour
   * and they are not.
   *
   * Its focus and selection sit where indigo's do; the brief's history is in
   * tools/theme/design-families.ts.
   *
   * Closest inks: the variables and the types, 14.5 ΔE apart, and the
   * operators and the types at 14.5. The table this replaced put its closest
   * pair at 7.0.
   */
  green: {
    groundHue: 158,
    roles: {
      bg:             { l: 0.085, c: 0.020, h: 156.7 }, // #000301
      bgDeep:         { l: 0.101, c: 0.023, h: 160.0 }, // #000502
      bgSide:         { l: 0.107, c: 0.026, h: 156.7 }, // #000602
      ansiBlack:      { l: 0.123, c: 0.029, h: 156.7 }, // #000903
      bgLine:         { l: 0.148, c: 0.036, h: 155.9 }, // #000F05
      bgLift:         { l: 0.157, c: 0.036, h: 159.0 }, // #001107
      bgTab:          { l: 0.180, c: 0.042, h: 157.7 }, // #00170A
      line:           { l: 0.199, c: 0.047, h: 157.3 }, // #001C0D
      selDim:         { l: 0.229, c: 0.053, h: 158.5 }, // #002413
      sel:            { l: 0.265, c: 0.062, h: 157.8 }, // #002E19
      whitespace:     { l: 0.299, c: 0.056, h: 160.5 }, // #0E3624
      border:         { l: 0.361, c: 0.060, h: 157.9 }, // #1E4731
      accentDim:      { l: 0.382, c: 0.095, h: 154.8 }, // #00512B
      accent:         { l: 0.5445, c: 0.1351, h: 154.83 }, // #00864B
      fgFaint:        { l: 0.501, c: 0.036, h: 159.2 }, // #526A5C
      fgMuted:        { l: 0.559, c: 0.035, h: 159.4 }, // #637B6D
      fgDim:          { l: 0.681, c: 0.032, h: 160.7 }, // #889F92
      fg:             { l: 0.750, c: 0.030, h: 158.5 }, // #9FB4A7
      fgBright:       { l: 0.820, c: 0.028, h: 160.7 }, // #B5CABE
      cursor:         { l: 0.799, c: 0.090, h: 154.9 }, // #8ECFA4
      fgWhite:        { l: 0.954, c: 0.010, h: 164.9 }, // #EAF2EE
      variable:       { l: 0.891, c: 0.027, h: 163.1 }, // #CCE1D6
      property:       { l: 0.719, c: 0.169, h: 309.5 }, // #C483F3
      operator:       { l: 0.670, c: 0.031, h: 151.7 }, // #889B8C
      propertyBright: { l: 0.799, c: 0.136, h: 309.8 }, // #D8A4FF
      keyword:        { l: 0.814, c: 0.214, h: 146.1 }, // #4BE565
      keywordBright:  { l: 0.895, c: 0.182, h: 146.1 }, // #83FC90
      generic:        { l: 0.584, c: 0.196, h: 292.2 }, // #825CE3
      genericDeep:    { l: 0.501, c: 0.170, h: 292.2 }, // #6949BA
      string:         { l: 0.814, c: 0.118, h: 64.9 }, // #F7B26D
      stringBright:   { l: 0.895, c: 0.074, h: 65.3 }, // #FFD3A9
      func:           { l: 0.719, c: 0.131, h: 250.7 }, // #61A9F3
      funcBright:     { l: 0.798, c: 0.106, h: 250.9 }, // #89C2FF
      number:         { l: 0.721, c: 0.146, h: 15.7 }, // #F27B86
      type:           { l: 0.781, c: 0.118, h: 185.4 }, // #47D0C2
      typeBright:     { l: 0.861, c: 0.101, h: 185.2 }, // #7DE7DA
      enumMember:     { l: 0.837, c: 0.108, h: 338.0 }, // #F8AEE2
      iface:          { l: 0.921, c: 0.166, h: 119.0 }, // #D9F469
      error:          { l: 0.659, c: 0.220, h: 24.9 }, // #FC4447
      errorBright:    { l: 0.758, c: 0.144, h: 24.6 }, // #FF8982
      warning:        { l: 0.850, c: 0.175, h: 94.9 }, // #F2CB00
      warningBright:  { l: 0.931, c: 0.110, h: 95.1 }, // #FFE891
    },
    signals: { success: 'keyword', info: 'func', hint: 'type', orange: 'string', purple: 'property' },
    terminalMagenta: ['property', 'propertyBright'],
  },

  /*
   * CYAN · ABISSAL (#20) — the sea from below, where the light comes down
   * through it. The keyword is the surface, a clear cyan at 214 and the
   * family's own colour, the loudest word in the code; the accent and the
   * cursor are the same cyan, deeper. The hint borrows the keyword, so the
   * terminal's cyan is the family's too.
   *
   * The cool half is the water. The types are jade at 157, far enough round
   * from the keyword to be green and not a second cyan, and the success
   * borrows them, so an added line and the terminal's green are the types; the
   * strings are seaweed, a pale lime at 129 and the lightest ink here, told
   * from the types by lightness as much as by hue. The functions are a
   * deep blue at 253, under the surface's cyan by 39 degrees.
   *
   * The warm half is the reef: coral numbers at 25, shell-pink enum members at
   * 338 and sand interfaces at 67, which a chart's orange borrows. The coral is
   * the error's hue, and kept from it by everything else: the error is 0.06
   * darker and has 0.09 more chroma, 11.1 ΔE away. The yellow warning sits at
   * 98, past the sand, 10.1 ΔE from it. Properties are an orchid at 314 and the
   * type parameters a darker magenta at 323, told apart by lightness. The
   * operators are a near-grey of the ground and the variables a near-white of
   * it.
   *
   * Its focus and selection sit where indigo's do; the brief's history is in
   * tools/theme/design-families.ts.
   *
   * Closest inks: the operators and the functions, 12.0 ΔE apart, then the
   * variables and the keyword at 12.7. The table this replaced put its closest
   * pair at 6.2.
   */
  cyan: {
    groundHue: 220,
    roles: {
      bg:             { l: 0.090, c: 0.017, h: 224.6 }, // #000305
      bgDeep:         { l: 0.099, c: 0.018, h: 218.8 }, // #000406
      bgSide:         { l: 0.107, c: 0.020, h: 222.4 }, // #000508
      ansiBlack:      { l: 0.124, c: 0.023, h: 219.3 }, // #00080C
      bgLine:         { l: 0.148, c: 0.027, h: 223.0 }, // #000D13
      bgLift:         { l: 0.160, c: 0.028, h: 216.7 }, // #001015
      bgTab:          { l: 0.177, c: 0.033, h: 221.3 }, // #00141B
      line:           { l: 0.202, c: 0.037, h: 220.6 }, // #001A22
      selDim:         { l: 0.230, c: 0.042, h: 222.0 }, // #00212B
      sel:            { l: 0.264, c: 0.048, h: 220.2 }, // #002A35
      whitespace:     { l: 0.299, c: 0.052, h: 213.0 }, // #00343D
      border:         { l: 0.359, c: 0.050, h: 220.0 }, // #1A434F
      accentDim:      { l: 0.389, c: 0.068, h: 212.3 }, // #004E5A
      accent:         { l: 0.554, c: 0.097, h: 212.6 }, // #008194
      fgFaint:        { l: 0.500, c: 0.035, h: 211.8 }, // #4C696F
      fgMuted:        { l: 0.559, c: 0.035, h: 211.7 }, // #5D7A80
      fgDim:          { l: 0.681, c: 0.031, h: 212.7 }, // #839EA4
      fg:             { l: 0.749, c: 0.030, h: 213.2 }, // #99B3B9
      fgBright:       { l: 0.819, c: 0.028, h: 213.8 }, // #B0C9CF
      cursor:         { l: 0.799, c: 0.090, h: 212.9 }, // #73CDE0
      fgWhite:        { l: 0.955, c: 0.010, h: 212.5 }, // #E9F2F4
      variable:       { l: 0.891, c: 0.020, h: 208.8 }, // #CDDFE2
      property:       { l: 0.719, c: 0.133, h: 313.5 }, // #C28ADF
      operator:       { l: 0.671, c: 0.030, h: 207.8 }, // #819B9F
      propertyBright: { l: 0.800, c: 0.113, h: 313.7 }, // #D8A8F1
      keyword:        { l: 0.8185, c: 0.1238, h: 213.70 }, // #4BD8F4
      keywordBright:  { l: 0.897, c: 0.083, h: 214.1 }, // #9BECFF
      generic:        { l: 0.589, c: 0.141, h: 322.9 }, // #A45DAD
      genericDeep:    { l: 0.501, c: 0.170, h: 323.0 }, // #8F389A
      string:         { l: 0.920, c: 0.132, h: 129.2 }, // #C9F696
      stringBright:   { l: 0.950, c: 0.112, h: 129.2 }, // #D7FEAD
      func:           { l: 0.719, c: 0.129, h: 252.8 }, // #66A8F3
      funcBright:     { l: 0.800, c: 0.103, h: 252.5 }, // #8DC2FF
      number:         { l: 0.721, c: 0.128, h: 24.8 }, // #EA837C
      type:           { l: 0.742, c: 0.132, h: 156.8 }, // #59C489
      typeBright:     { l: 0.822, c: 0.113, h: 156.6 }, // #84DBA7
      enumMember:     { l: 0.839, c: 0.107, h: 337.6 }, // #F8AFE3
      iface:          { l: 0.837, c: 0.105, h: 66.5 }, // #F8BC7E
      error:          { l: 0.659, c: 0.220, h: 24.9 }, // #FC4447
      errorBright:    { l: 0.758, c: 0.144, h: 24.6 }, // #FF8982
      warning:        { l: 0.861, c: 0.170, h: 98.1 }, // #EFD127
      warningBright:  { l: 0.941, c: 0.112, h: 98.3 }, // #FFED93
    },
    signals: { success: 'type', info: 'func', hint: 'keyword', orange: 'iface', purple: 'property' },
    terminalMagenta: ['property', 'propertyBright'],
  },

  /*
   * BLUE · COBALTO (#21) — cobalt, the pigment: a deep blue that stays a colour
   * and never greys. The keyword is the cobalt at 257, the family's own colour;
   * the accent and the cursor are the same blue, and the info borrows the
   * keyword, so a modified file and the terminal's blue are the family's too.
   *
   * Above it is ice. The functions are a cyan at 214, 44 degrees round from the
   * keyword and 0.13 lighter, and the hint borrows them, so the terminal's cyan
   * is the functions'. Past them the cool half runs on into green: sea-green
   * types at 173 and mint strings at 164, only nine degrees apart and told apart
   * by lightness — the strings are the lightest ink here, 0.18 over the types
   * and 18.1 ΔE from them. The success borrows the strings, so an added line and
   * the terminal's green are mint.
   *
   * The warm half is the answer to all that cold: terracotta numbers at 40,
   * which a chart's orange borrows, rose enum members at 341 and straw
   * interfaces at 107, with the amber warning at 85 under them, 10.3 ΔE away.
   * Properties are a violet at 310 and the type parameters a dark magenta at
   * 328, told apart by lightness. The operators are a near-grey of the ground
   * and the variables a near-white of it.
   *
   * The error is a vermilion at 28, a little darker and less saturated than the
   * other six's. The info squiggle is the keyword, which the search keeps at
   * the floor of its band, 0.70, where a cobalt holds the most chroma and stands
   * furthest from the grey operators; the error has to sit 0.05 under it, and
   * any darker a deleted line's gutter mark reads under 3:1. It keeps 12.0 ΔE
   * from the terracotta numbers.
   *
   * Its focus and selection sit where indigo's do; the brief's history is in
   * tools/theme/design-families.ts.
   *
   * Closest inks: the operators and the keyword, 12.6 ΔE apart, then the
   * operators and the enum members, and the operators and the functions, at
   * 12.7. The table this replaced put its closest pair at 5.9.
   */
  blue: {
    groundHue: 262,
    roles: {
      bg:             { l: 0.090, c: 0.035, h: 259.1 }, // #00020C
      bgDeep:         { l: 0.101, c: 0.037, h: 257.7 }, // #00030F
      bgSide:         { l: 0.113, c: 0.037, h: 263.1 }, // #010412
      ansiBlack:      { l: 0.127, c: 0.042, h: 260.5 }, // #010617
      bgLine:         { l: 0.149, c: 0.056, h: 261.2 }, // #010922
      bgLift:         { l: 0.158, c: 0.055, h: 262.0 }, // #020B24
      bgTab:          { l: 0.178, c: 0.062, h: 262.2 }, // #030F2C
      line:           { l: 0.204, c: 0.065, h: 262.2 }, // #061534
      selDim:         { l: 0.229, c: 0.086, h: 262.3 }, // #051944
      sel:            { l: 0.264, c: 0.095, h: 261.9 }, // #082152
      whitespace:     { l: 0.299, c: 0.072, h: 258.4 }, // #152D51
      border:         { l: 0.366, c: 0.069, h: 261.9 }, // #2A3E63
      accentDim:      { l: 0.384, c: 0.130, h: 258.2 }, // #0C4087
      accent:         { l: 0.550, c: 0.180, h: 258.0 }, // #1F6DD8
      fgFaint:        { l: 0.499, c: 0.045, h: 257.9 }, // #53647D
      fgMuted:        { l: 0.561, c: 0.044, h: 256.6 }, // #64768F
      fgDim:          { l: 0.681, c: 0.041, h: 257.0 }, // #899AB2
      fg:             { l: 0.750, c: 0.039, h: 258.4 }, // #9FAFC7
      fgBright:       { l: 0.819, c: 0.036, h: 258.9 }, // #B6C5DC
      cursor:         { l: 0.801, c: 0.090, h: 258.0 }, // #9AC0F8
      fgWhite:        { l: 0.956, c: 0.013, h: 255.5 }, // #EBF1F9
      variable:       { l: 0.890, c: 0.019, h: 263.0 }, // #D4DBE8
      property:       { l: 0.721, c: 0.145, h: 310.3 }, // #C189E8
      operator:       { l: 0.763, c: 0.029, h: 265.4 }, // #A9B2C5
      propertyBright: { l: 0.801, c: 0.124, h: 310.5 }, // #D7A7F9
      keyword:        { l: 0.699, c: 0.137, h: 257.4 }, // #659FF2
      keywordBright:  { l: 0.779, c: 0.114, h: 257.3 }, // #88B9FF
      generic:        { l: 0.588, c: 0.141, h: 327.7 }, // #A85BA7
      genericDeep:    { l: 0.499, c: 0.170, h: 327.8 }, // #933593
      string:         { l: 0.900, c: 0.139, h: 163.8 }, // #7AFBC5
      stringBright:   { l: 0.950, c: 0.074, h: 163.7 }, // #C1FFE1
      func:           { l: 0.827, c: 0.125, h: 213.5 }, // #4CDBF7
      funcBright:     { l: 0.906, c: 0.076, h: 213.6 }, // #A4EEFF
      number:         { l: 0.735, c: 0.123, h: 39.5 }, // #EB8D6D
      type:           { l: 0.721, c: 0.119, h: 173.1 }, // #3FBD9E
      typeBright:     { l: 0.802, c: 0.102, h: 172.9 }, // #72D4B8
      enumMember:     { l: 0.824, c: 0.114, h: 340.7 }, // #F8A8DC
      iface:          { l: 0.920, c: 0.143, h: 106.7 }, // #F0EB72
      error:          { l: 0.648, c: 0.200, h: 27.9 }, // #F04E43
      errorBright:    { l: 0.748, c: 0.152, h: 28.0 }, // #FF8476
      warning:        { l: 0.840, c: 0.170, h: 85.0 }, // #FDC010
      warningBright:  { l: 0.920, c: 0.085, h: 85.0 }, // #FFE1A3
    },
    signals: { success: 'string', info: 'keyword', hint: 'func', orange: 'number', purple: 'property' },
    terminalMagenta: ['property', 'propertyBright'],
  },
};

const designOf = (family: Family): FamilyDesign | undefined => (family === 'indigo' ? undefined : DESIGNS[family]);

/** Whether a family is drawn as a `FamilyDesign`, and so held to the floors measured in ΔE. */
export const hasFamilyDesign = (family: Family): boolean => designOf(family) !== undefined;

/** The family hue of each variant, for anything that needs to name it: a design's ground hue, a row's chrome hue. */
export const FAMILIES = Object.fromEntries(
  FAMILY_ORDER.map((family: Family): [Family, number] => [family, designOf(family)?.groundHue ?? variantOf(family).hue])
) as Record<Family, number>;

/* -------------------------------------------------------------- *
 * The separation floor
 * -------------------------------------------------------------- */

/*
 * The least hue separation any two roles that must be told apart may have.
 *
 * It is a floor now, where the previous version had a ceiling, and the swap is
 * the whole difference between a table that is designed and a table that is
 * relaxed. A ceiling was what a rotation needed: hues arrived wherever the turn
 * put them and the machinery asked for as much clearance as it could get away
 * with before over-constraining the arc. Named hues arrive where they were put,
 * so the only thing left to state is the minimum below which two roles start
 * being mistaken for each other — and the build asserts it rather than this
 * file arranging around it. If a hue in `VARIANTS` is ever edited into its
 * neighbour, the build says which pair and in which family, and writes nothing.
 *
 * 22 rather than a rounder number because that is what the shipped theme's own
 * closest pair costs: indigo puts enum members and numbers 19.5 degrees apart
 * and interfaces and strings 35.7, telling the close pair apart by lightness
 * and chroma instead. A floor that condemned the original theme would be the
 * wrong floor, so the check exempts indigo's own arrangement and holds the
 * seven designed ones to a bar just above it.
 *
 * Between syntax roles it holds only the families still built from the role
 * table. One drawn as a `FamilyDesign` is held to `SEPARATION_DELTA_E`
 * instead, which measures what this cannot. The terminal's six hues stay held
 * to it in every family (build-color-themes.ts, check 14): an ANSI colour is
 * named for its hue, so there a distance in degrees is the point.
 */
export const SEPARATION = 22;

/** The roles held apart: the family cluster, the pole, and the semantic six. */
const CONTESTED: Named[] = ['enumMember', 'number', 'iface', 'string', 'type', 'func'];

/**
 * The closest pair of roles in a family still built from the role table, for
 * the build to hold to `SEPARATION`.
 *
 * The family hue stands in for the whole chrome cluster: variables, properties
 * and operators sit within 12 degrees of it by design and are told apart by
 * lightness, so clearing the family clears all three. `generic` is left out for
 * the opposite reason — it is the one signature colour well below the syntax
 * band, at L 0.59 (0.53 before FLOORS) against 0.75 to 0.89, so nothing can be confused with it
 * whatever the hues do.
 */
export function closestPair(family: Family): { a: string; b: string; deg: number } {
  const v = variantOf(family);
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

/*
 * THE FLOOR IN ΔE (#13), for the families drawn as designs.
 *
 * Distance in hue says whether two inks are different hues, and that is not
 * the question; the question is whether they can be confused. Half the inks in
 * a design are told apart by lightness or chroma at hues close together — the
 * red draft puts its strings and types 16 degrees apart, the blue one 9, and
 * neither pair can be mistaken — so a hue floor would condemn them, and it
 * passes the role-table families whose closest inks are 5.9 to 7.6 ΔE apart.
 * ΔE in OKLab measures lightness, chroma and hue at once. 12 is what the
 * redesign set out to clear, and every one of the seven drafts does.
 *
 * Over all eleven syntax inks, not the semantic six the hue floor holds apart:
 * a design places the variables, the operators and the type parameters too,
 * and nothing keeps them from drifting into a neighbour but this.
 */
export const SEPARATION_DELTA_E = 12;

/** The eleven syntax inks: every colour code is written in. */
export const SYNTAX_ROLES: RoleName[] = ['variable', 'property', 'operator', 'keyword', 'generic', 'string', 'func', 'number', 'type', 'enumMember', 'iface'];

export type InkPair = { first: RoleName; second: RoleName; distance: number };

/** The two syntax inks of a palette closest to each other in OKLab, and how far apart they are. */
export const closestInks = (palette: Record<RoleName, Colour>): InkPair => {
  let closest: InkPair = { first: SYNTAX_ROLES[0], second: SYNTAX_ROLES[1], distance: Infinity };
  SYNTAX_ROLES.forEach((first: RoleName, index: number): void => {
    for (const second of SYNTAX_ROLES.slice(index + 1)) {
      const distance: number = deltaE(palette[first], palette[second]);
      if (distance < closest.distance) closest = { first, second, distance };
    }
  });
  return closest;
};

/*
 * THE GAMUT CEILING (#13). No ink in a design takes more than this share of
 * the chroma sRGB holds at its lightness and hue: the last stretch before the
 * edge of the gamut is where a colour stops being saturated and starts being
 * neon — the `#FF53F7` keywords `chromaOf` remembers. The design tool drafts
 * every ink under it.
 *
 * The build measures the hex, and a hex is the nearest 8-bit colour to the one
 * drafted, so it can land a little outside. Of 400 000 colours drafted at
 * exactly 86% across the lightnesses inks are searched in, L 0.54 to 0.92,
 * rounding carried none past 87.8%. `GAMUT_ROUNDING` is that allowance and no
 * more: an ink edited toward the edge still fails, and by a long way.
 */
export const GAMUT_SHARE = 0.86;
export const GAMUT_ROUNDING = 0.02;

/** The share of the chroma sRGB holds at a colour's lightness and hue that the colour takes. */
export const gamutShareOf = (colour: Colour): number => {
  const { l: lightness, c: chroma, h: hue }: Oklch = oklchFromHex(colour);
  return chroma / maxChromaAt(lightness, hue);
};

/*
 * THE KEYWORD LEADS (#13). The keyword is the family's signature, so in a
 * design no ink is louder: none has more chroma than it, by more than this.
 * The type parameters are exempt, being the keyword's dark partner, too far
 * below it in lightness to be read as competing with it.
 */
export const KEYWORD_MARGIN = 0.01;

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

/** The hue each role lands on in a family still built from the role table. */
export function huesFor(family: Family): Record<RoleName, number> {
  const v = variantOf(family);
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

/** Where every role sits in a family still built from the role table: indigo's measurements, placed at the family's hues. */
const placedFromRoles = (family: Family): Record<RoleName, Oklch> => {
  const variant: Variant = variantOf(family);
  const hues: Record<RoleName, number> = huesFor(family);
  const placed = {} as Record<RoleName, Oklch>;

  for (const name of Object.keys(ROLES) as RoleName[]) {
    const role: Role = ROLES[name];
    const hue: number = hues[name];

    /*
     * Lightness: the accent's is named by the family and taken as given. Every
     * other role gets its own, plus whatever its new hue needs and its old one
     * did not — and only as much of that as a role this bright is owed. A role
     * that has not moved gets exactly its own, which is what keeps indigo the
     * theme it already was.
     */
    const redrawnLightness: number | undefined = variant.redrawn?.[name]?.l;
    const lightness: number =
      redrawnLightness !== undefined
        ? redrawnLightness
        : role.band === 'accent'
        ? variant.accent.l + (name === 'accentDim' ? DIM_LIGHT : 0)
        : Math.min(0.99, role.l + liftShareAtLightness(role.l) * (hueLightnessLift(hue) - hueLightnessLift(indigoHueOf(name))));

    placed[name] = { l: lightness, c: chromaOf(name, variant), h: hue };
  }

  return placed;
};

/** Every colour of one variant: a design's frozen roles, or the role table placed for the family — and either way, the floors under them. */
export const paletteFor = (family: Family): Palette => {
  const placed: Record<RoleName, Oklch> = designOf(family)?.roles ?? placedFromRoles(family);
  const palette = {} as Palette;
  for (const name of Object.keys(ROLES) as RoleName[]) palette[name] = hexFromOklch(placed[name]);

  for (const [name, floor] of Object.entries(FLOORS) as [RoleName, { against: RoleName; ratio: number }][]) {
    let lightness: number = placed[name].l;
    while (contrastRatio(palette[name], palette[floor.against]) < floor.ratio && lightness < 0.99) {
      lightness += 0.0005;
      palette[name] = hexFromOklch({ ...placed[name], l: lightness });
    }
  }

  return palette;
};

/** Which ink plays each signal in a family. */
export const signalsFor = (family: Family): Signals => (designOf(family) ?? variantOf(family)).signals;

/** The roles that play the terminal's magenta and bright magenta in a family. */
export const terminalMagentaFor = (family: Family): [normal: RoleName, bright: RoleName] =>
  (designOf(family) ?? variantOf(family)).terminalMagenta ?? ['keyword', 'keywordBright'];

export { BASE_HUE, CONTESTED, ROLES, VARIANTS };
