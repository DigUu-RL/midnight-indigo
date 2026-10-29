/*
 * The design tool for the seven family palettes:
 *
 *   npm run design:families                        all seven
 *   npm run design:families -- --family=red,blue   the ones named
 *
 * It PROPOSES a palette; it never builds one. The build does not run it, and
 * nothing it prints reaches themes/ until someone has read it, judged it and
 * pasted it into tools/theme/theme-palette.ts as plain numbers. That split is
 * the point. A search makes a good first draft and a poor source of truth:
 * change one of its constants and all seven families move at once, quietly,
 * and a theme people have open in their editors is not something to
 * regenerate by accident. Frozen values keep the build deterministic and each
 * family what COLOR-SYSTEM says it is — a design, written down — and this file
 * is the record of how the draft was made.
 *
 * WHAT GOES IN is a brief per family (`BRIEFS`): the hue of its grounds and the
 * lightness and chroma of each step of its surface ladder, the hue and chroma
 * of its text, where each of the eleven syntax inks starts, and the accent and
 * the two signals that are colours of their own. Every number in a brief is a
 * decision. The tool takes none of those; it only finishes them.
 *
 * WHAT IT DOES with them:
 *
 *   Contrast is solved, not hoped for. A colour that has to read on a ground
 *   is raised in lightness, a step at a time, until it does: the inks and the
 *   body text to 7:1 on the background, the type parameters and the secondary
 *   text to 4.5:1, the faint and muted text to 3:1 (muted on the selection,
 *   where comments are hardest to read).
 *
 *   Chroma has a ceiling. No ink takes more than 86% of the chroma sRGB can
 *   hold at its lightness and hue: the last stretch before the edge of the
 *   gamut is where a colour stops being saturated and starts being neon.
 *
 *   Separation is searched for. A local search moves one ink at a time — its
 *   lightness, its chroma or its hue, each within limits set per role — and
 *   keeps any move that does not make the palette worse. Worse is measured in
 *   OKLab ΔE between all eleven inks, because distance in hue says nothing
 *   about two inks told apart by lightness, which is how half of them are: the
 *   closest pair counts in full and the next three less and less. An ink
 *   louder than the keywords costs, because the keyword is the family's
 *   signature; so does any ink within 10 ΔE of the error or the warning,
 *   because a squiggle has to show on the word it is under.
 *
 *   The run is repeatable. The search draws from Lehmer's generator with fixed
 *   seeds, runs once per seed and keeps the better run, so the same brief
 *   always gives the same palette.
 *
 * WHAT COMES OUT, per family: the measurements beside the shipped palette's,
 * the 68 tokens beside the shipped ones, and the design as a literal for
 * theme-palette.ts — every palette role in absolute OKLCH, at the precision
 * that converts back to the same hex. It writes nothing.
 *
 * The algorithm is the Midnight Palettes prototype's (issue #12 keeps its
 * JavaScript), and the briefs are the ones the family issues approved, #15 to
 * #21: for those briefs this reproduces the issues' tables to the byte.
 */

import {
  contrastRatio,
  deltaE,
  hexFromLinearRgb,
  hexFromOklch,
  linearRgbFromOklch,
  oklchFromHex,
  signedHueDelta,
  type Colour,
  type Oklch,
} from '../shared/color.ts';
import { FAMILY_ORDER, ROLES, WHITE, type Family, type Ink, type RoleName, type Signals } from './theme-palette.ts';
import { SIGNAL_HUE, SIGNAL_TOLERANCE, flatten, tokensFor, type Tokens } from './theme-tokens.ts';

/* -------------------------------------------------------------- *
 * The briefs
 * -------------------------------------------------------------- */

type DesignedFamily = Exclude<Family, 'indigo'>;

const SURFACES = ['background', 'frame', 'surface', 'currentLine', 'surfaceRaised', 'surfaceHover', 'surfaceFocus', 'surfaceSelected', 'border', 'borderStrong'] as const;
type Surface = (typeof SURFACES)[number];

/** The eleven syntax inks, in the order the search draws them from — which is part of what makes a run repeatable. */
const SYNTAX_INKS = ['variable', 'property', 'operator', 'keyword', 'generic', 'string', 'func', 'number', 'type', 'iface', 'enumMember'] as const;
type SyntaxInk = (typeof SYNTAX_INKS)[number];

type FamilyBrief = {
  /** The hue of every ground, line and selection. */
  groundHue: number;
  /** Each step of the surface ladder, darkest ground to strongest border. */
  surfaces: Record<Surface, [lightness: number, chroma: number]>;
  /** The hue of the foreground ramp, and the chroma its steps are a share of. */
  textHue: number;
  textChroma: number;
  /** Where the search starts each ink from. */
  inks: Record<SyntaxInk, Oklch>;
  /** The accent before it is darkened for white text to read on it. */
  accent: Oklch;
  /** The two signals that are colours of their own, taken as given. */
  warning: Oklch;
  error: Oklch;
};

const BRIEFS: Record<DesignedFamily, FamilyBrief> = {
  /* Ametista (#15): the violet keyword is the only saturated purple in the code; a velvet ground with more chroma than the warm families. */
  purple: {
    groundHue: 312,
    surfaces: {
      background: [0.09, 0.028], frame: [0.1, 0.03], surface: [0.11, 0.032], currentLine: [0.15, 0.045], surfaceRaised: [0.168, 0.05],
      surfaceHover: [0.18, 0.052], surfaceFocus: [0.275, 0.09], surfaceSelected: [0.325, 0.105], border: [0.205, 0.055], borderStrong: [0.365, 0.09],
    },
    textHue: 315,
    textChroma: 0.045,
    inks: {
      keyword: { h: 303, l: 0.74, c: 0.18 }, property: { h: 345, l: 0.8, c: 0.11 }, operator: { h: 318, l: 0.72, c: 0.05 }, variable: { h: 315, l: 0.87, c: 0.03 },
      generic: { h: 332, l: 0.6, c: 0.2 }, string: { h: 158, l: 0.85, c: 0.12 }, func: { h: 258, l: 0.78, c: 0.13 }, number: { h: 72, l: 0.83, c: 0.12 },
      type: { h: 198, l: 0.84, c: 0.1 }, iface: { h: 122, l: 0.89, c: 0.15 }, enumMember: { h: 32, l: 0.79, c: 0.13 },
    },
    accent: { h: 305, l: 0.56, c: 0.2 },
    warning: { h: 90, l: 0.86, c: 0.17 },
    error: { h: 25, l: 0.64, c: 0.22 },
  },
  /* Flor neon (#16): a hot pink keyword, lilac properties, leaf-green strings and types; apricot numbers and salmon enum members, told apart by lightness. */
  pink: {
    groundHue: 352,
    surfaces: {
      background: [0.088, 0.024], frame: [0.098, 0.026], surface: [0.108, 0.028], currentLine: [0.148, 0.04], surfaceRaised: [0.165, 0.045],
      surfaceHover: [0.178, 0.047], surfaceFocus: [0.27, 0.085], surfaceSelected: [0.32, 0.1], border: [0.2, 0.05], borderStrong: [0.36, 0.085],
    },
    textHue: 350,
    textChroma: 0.04,
    inks: {
      keyword: { h: 356, l: 0.74, c: 0.19 }, property: { h: 298, l: 0.79, c: 0.12 }, operator: { h: 345, l: 0.72, c: 0.05 }, variable: { h: 350, l: 0.87, c: 0.028 },
      generic: { h: 322, l: 0.6, c: 0.2 }, string: { h: 152, l: 0.85, c: 0.13 }, func: { h: 240, l: 0.78, c: 0.12 }, number: { h: 62, l: 0.83, c: 0.12 },
      type: { h: 192, l: 0.84, c: 0.11 }, iface: { h: 120, l: 0.89, c: 0.16 }, enumMember: { h: 28, l: 0.8, c: 0.12 },
    },
    accent: { h: 355, l: 0.57, c: 0.2 },
    warning: { h: 92, l: 0.86, c: 0.17 },
    error: { h: 27, l: 0.63, c: 0.23 },
  },
  /* Brasa (#17): red as heat, not alarm. A lighter rose-crimson keyword, and an error darker, more saturated and further round. */
  red: {
    groundHue: 22,
    surfaces: {
      background: [0.086, 0.018], frame: [0.096, 0.02], surface: [0.105, 0.021], currentLine: [0.145, 0.03], surfaceRaised: [0.162, 0.034],
      surfaceHover: [0.175, 0.036], surfaceFocus: [0.265, 0.07], surfaceSelected: [0.315, 0.085], border: [0.2, 0.04], borderStrong: [0.355, 0.07],
    },
    textHue: 25,
    textChroma: 0.03,
    inks: {
      keyword: { h: 14, l: 0.75, c: 0.16 }, property: { h: 305, l: 0.79, c: 0.11 }, operator: { h: 25, l: 0.72, c: 0.045 }, variable: { h: 30, l: 0.87, c: 0.026 },
      generic: { h: 340, l: 0.58, c: 0.19 }, string: { h: 155, l: 0.84, c: 0.12 }, func: { h: 245, l: 0.79, c: 0.11 }, number: { h: 72, l: 0.84, c: 0.13 },
      type: { h: 195, l: 0.83, c: 0.1 }, iface: { h: 125, l: 0.89, c: 0.15 }, enumMember: { h: 48, l: 0.79, c: 0.14 },
    },
    accent: { h: 22, l: 0.55, c: 0.19 },
    warning: { h: 97, l: 0.87, c: 0.18 },
    error: { h: 32, l: 0.61, c: 0.22 },
  },
  /* Crepúsculo (#18): a horizon-orange keyword, sky-pink numbers and coral enum members, indigo type parameters; an amber near-black that stays out of brown. */
  orange: {
    groundHue: 58,
    surfaces: {
      background: [0.086, 0.014], frame: [0.096, 0.016], surface: [0.105, 0.017], currentLine: [0.145, 0.025], surfaceRaised: [0.162, 0.028],
      surfaceHover: [0.175, 0.03], surfaceFocus: [0.265, 0.06], surfaceSelected: [0.315, 0.07], border: [0.2, 0.035], borderStrong: [0.355, 0.06],
    },
    textHue: 65,
    textChroma: 0.03,
    inks: {
      keyword: { h: 55, l: 0.77, c: 0.17 }, property: { h: 295, l: 0.79, c: 0.12 }, operator: { h: 60, l: 0.72, c: 0.045 }, variable: { h: 65, l: 0.87, c: 0.028 },
      generic: { h: 275, l: 0.58, c: 0.18 }, string: { h: 148, l: 0.84, c: 0.12 }, func: { h: 242, l: 0.79, c: 0.12 }, number: { h: 340, l: 0.79, c: 0.13 },
      type: { h: 192, l: 0.83, c: 0.1 }, iface: { h: 120, l: 0.88, c: 0.17 }, enumMember: { h: 15, l: 0.77, c: 0.13 },
    },
    accent: { h: 52, l: 0.6, c: 0.17 },
    warning: { h: 88, l: 0.85, c: 0.17 },
    error: { h: 27, l: 0.64, c: 0.22 },
  },
  /* Floresta (#19): an emerald keyword, so the strings leave green for wheat; coral numbers, orchid enum members, turquoise types. */
  green: {
    groundHue: 158,
    surfaces: {
      background: [0.088, 0.022], frame: [0.098, 0.024], surface: [0.108, 0.026], currentLine: [0.148, 0.038], surfaceRaised: [0.165, 0.042],
      surfaceHover: [0.178, 0.044], surfaceFocus: [0.27, 0.08], surfaceSelected: [0.32, 0.09], border: [0.2, 0.05], borderStrong: [0.36, 0.08],
    },
    textHue: 160,
    textChroma: 0.035,
    inks: {
      keyword: { h: 152, l: 0.8, c: 0.18 }, property: { h: 298, l: 0.79, c: 0.12 }, operator: { h: 158, l: 0.72, c: 0.045 }, variable: { h: 160, l: 0.87, c: 0.028 },
      generic: { h: 300, l: 0.58, c: 0.19 }, string: { h: 72, l: 0.85, c: 0.1 }, func: { h: 245, l: 0.79, c: 0.12 }, number: { h: 28, l: 0.78, c: 0.13 },
      type: { h: 195, l: 0.84, c: 0.11 }, iface: { h: 118, l: 0.91, c: 0.15 }, enumMember: { h: 350, l: 0.79, c: 0.12 },
    },
    accent: { h: 155, l: 0.55, c: 0.14 },
    warning: { h: 95, l: 0.85, c: 0.18 },
    error: { h: 25, l: 0.64, c: 0.22 },
  },
  /* Abissal (#20): a surface-cyan keyword, jade types and seaweed strings; coral numbers, shell-pink enum members, sand interfaces, deep-blue functions. */
  cyan: {
    groundHue: 220,
    surfaces: {
      background: [0.088, 0.022], frame: [0.098, 0.024], surface: [0.108, 0.026], currentLine: [0.148, 0.038], surfaceRaised: [0.165, 0.042],
      surfaceHover: [0.178, 0.044], surfaceFocus: [0.27, 0.08], surfaceSelected: [0.32, 0.09], border: [0.2, 0.05], borderStrong: [0.36, 0.08],
    },
    textHue: 212,
    textChroma: 0.035,
    inks: {
      keyword: { h: 210, l: 0.81, c: 0.14 }, property: { h: 305, l: 0.79, c: 0.12 }, operator: { h: 215, l: 0.72, c: 0.04 }, variable: { h: 212, l: 0.87, c: 0.028 },
      generic: { h: 325, l: 0.58, c: 0.19 }, string: { h: 128, l: 0.86, c: 0.14 }, func: { h: 258, l: 0.78, c: 0.13 }, number: { h: 35, l: 0.79, c: 0.13 },
      type: { h: 168, l: 0.85, c: 0.12 }, iface: { h: 72, l: 0.86, c: 0.11 }, enumMember: { h: 350, l: 0.8, c: 0.12 },
    },
    accent: { h: 212, l: 0.56, c: 0.12 },
    warning: { h: 98, l: 0.86, c: 0.17 },
    error: { h: 25, l: 0.64, c: 0.22 },
  },
  /* Cobalto (#21): a cobalt keyword with ice-cyan functions above it; sea-green types, mint strings, straw interfaces, terracotta and rose for warmth. */
  blue: {
    groundHue: 262,
    surfaces: {
      background: [0.09, 0.035], frame: [0.1, 0.038], surface: [0.11, 0.04], currentLine: [0.15, 0.055], surfaceRaised: [0.168, 0.06],
      surfaceHover: [0.18, 0.062], surfaceFocus: [0.275, 0.1], surfaceSelected: [0.325, 0.115], border: [0.205, 0.065], borderStrong: [0.365, 0.1],
    },
    textHue: 258,
    textChroma: 0.045,
    inks: {
      keyword: { h: 262, l: 0.74, c: 0.16 }, property: { h: 305, l: 0.79, c: 0.12 }, operator: { h: 262, l: 0.72, c: 0.05 }, variable: { h: 258, l: 0.87, c: 0.03 },
      generic: { h: 330, l: 0.58, c: 0.19 }, string: { h: 152, l: 0.85, c: 0.12 }, func: { h: 222, l: 0.85, c: 0.11 }, number: { h: 42, l: 0.8, c: 0.13 },
      type: { h: 185, l: 0.84, c: 0.1 }, iface: { h: 115, l: 0.9, c: 0.16 }, enumMember: { h: 350, l: 0.79, c: 0.12 },
    },
    accent: { h: 258, l: 0.55, c: 0.18 },
    warning: { h: 85, l: 0.84, c: 0.17 },
    error: { h: 25, l: 0.64, c: 0.22 },
  },
};

/* -------------------------------------------------------------- *
 * The gamut, measured as the drafts were
 * -------------------------------------------------------------- */

/*
 * hexFromOklch tests a colour against sRGB on its encoded channels; the
 * prototype tested linear light, with the same 0.0001 of tolerance, and
 * bisected 22 times. The two disagree only within a hair of the boundary, and
 * a hair is enough. The search is chaotic: a ceiling a ten-thousandth lower
 * changes one ink's last bit, a move that was kept is refused, and twelve
 * thousand steps later the red family's success signal is another ink. Built
 * on hexFromOklch and maxChromaAt, this tool missed the approved tables by as
 * much as 123 in a channel. So the drafts are measured the way they were made.
 * The build is not: it converts the frozen values with hexFromOklch, and
 * `frozen` checks that each one lands on the hex proposed here.
 */
const GAMUT_TOLERANCE = 1e-4;
const BISECTIONS = 22;
/** More chroma than sRGB holds at any hue: where the search for a hue's ceiling starts. */
const BEYOND_GAMUT = 0.4;

const isInGamut = (point: Oklch): boolean =>
  linearRgbFromOklch(point).every((channel: number): boolean => channel >= -GAMUT_TOLERANCE && channel <= 1 + GAMUT_TOLERANCE);

/** The point's own chroma if it fits, or the most that does, by bisection. */
const fittedChroma = (point: Oklch): number => {
  if (isInGamut(point)) return point.c;
  let lowest: number = 0;
  let highest: number = point.c;
  for (let step = 0; step < BISECTIONS; step++) {
    const middle: number = (lowest + highest) / 2;
    if (isInGamut({ ...point, c: middle })) lowest = middle;
    else highest = middle;
  }
  return lowest;
};

/** A point as a hex, its chroma reduced until it fits rather than its channels clipped. */
const hexAt = (point: Oklch): Colour => hexFromLinearRgb(linearRgbFromOklch({ ...point, c: fittedChroma(point) }));

/** The most chroma sRGB holds at this lightness and hue. */
const gamutChroma = (lightness: number, hue: number): number => fittedChroma({ l: lightness, c: BEYOND_GAMUT, h: hue });

/* -------------------------------------------------------------- *
 * Readable on purpose
 * -------------------------------------------------------------- */

const BODY_CONTRAST = 7;
const TEXT_CONTRAST = 4.5;
const AUXILIARY_CONTRAST = 3;

/** How far a colour is raised or lowered per step while its contrast is solved, and where that stops. */
const LIGHTNESS_STEP = 0.005;
const LIGHTEST = 0.97;
const DARKEST = 0.2;

/**
 * The colour at `point`, raised until it reads at `ratio` on `ground`.
 * `chromaAt` is what the colour may take at each lightness on the way up.
 */
const raisedUntil = (point: Oklch, ratio: number, ground: Colour, chromaAt: (lightness: number) => number = (): number => point.c): Colour => {
  let lightness: number = point.l;
  let colour: Colour = hexAt({ l: lightness, c: chromaAt(lightness), h: point.h });
  while (contrastRatio(colour, ground) < ratio && lightness < LIGHTEST) {
    lightness += LIGHTNESS_STEP;
    colour = hexAt({ l: lightness, c: chromaAt(lightness), h: point.h });
  }
  return colour;
};

/** The colour at `point`, lowered until white text reads on it at AA — a button's label is text. */
const loweredForWhite = (point: Oklch): Colour => {
  let lightness: number = point.l;
  let colour: Colour = hexAt(point);
  while (contrastRatio(colour, WHITE) < TEXT_CONTRAST && lightness > DARKEST) {
    lightness -= LIGHTNESS_STEP;
    colour = hexAt({ ...point, l: lightness });
  }
  return colour;
};

/** A lighter partner — the terminal's bright row, a link under the pointer: more light, a little less chroma, the same hue. */
const lightened = (colour: Colour, lightnessStep: number = 0.08, chromaShare: number = 0.85): Colour => {
  const measured: Oklch = oklchFromHex(colour);
  return hexAt({ l: Math.min(0.95, measured.l + lightnessStep), c: measured.c * chromaShare, h: measured.h });
};

/* -------------------------------------------------------------- *
 * The search
 * -------------------------------------------------------------- */

/** The share of the gamut's chroma an ink may take: the rest is neon. */
const GAMUT_SHARE = 0.86;

type SearchBounds = { lightness: [number, number]; chroma: [number, number]; hueDrift: number };

/*
 * How far the search may take each ink from where its brief put it. The
 * variables stay a near-grey just under white, the operators a quiet tint, the
 * keywords loud and the type parameters the darkest ink; the semantic inks
 * share one band and may each drift 12 degrees from their starting hue.
 */
const SEMANTIC_BOUNDS: SearchBounds = { lightness: [0.72, 0.92], chroma: [0.105, 0.19], hueDrift: 12 };

const BOUNDS: Record<SyntaxInk, SearchBounds> = {
  variable: { lightness: [0.85, 0.89], chroma: [0.02, 0.04], hueDrift: 4 },
  operator: { lightness: [0.66, 0.78], chroma: [0.03, 0.06], hueDrift: 5 },
  keyword: { lightness: [0.7, 0.82], chroma: [0.14, 0.22], hueDrift: 6 },
  generic: { lightness: [0.54, 0.66], chroma: [0.14, 0.22], hueDrift: 10 },
  property: SEMANTIC_BOUNDS,
  string: SEMANTIC_BOUNDS,
  func: SEMANTIC_BOUNDS,
  number: SEMANTIC_BOUNDS,
  type: SEMANTIC_BOUNDS,
  iface: SEMANTIC_BOUNDS,
  enumMember: SEMANTIC_BOUNDS,
};

/** The largest move one step makes: lightness and chroma span this much, centred on where the ink is, and hue this many degrees. */
const LIGHTNESS_MOVE = 0.06;
const CHROMA_MOVE = 0.05;
const HUE_MOVE = 8;

const SEARCH_STEPS = 12000;
const SEEDS: number[] = [11, 29];

/** What the closest pairs weigh in the score, closest first. */
const PAIR_WEIGHTS: number[] = [1, 0.5, 0.25, 0.1];
/** The least ΔE an ink keeps from the error and the warning before it costs, and what each unit short costs. */
const SIGNAL_CLEARANCE = 10;
const SIGNAL_COST = 3;
/** How much chroma an ink may have over the keyword's, and what each unit over the keyword's costs once it does. */
const KEYWORD_MARGIN = 0.01;
const LOUDNESS_COST = 300;

/** Lehmer's generator, as the prototype drew from it: the same seed, the same run. */
const lehmer = (seed: number): (() => number) => {
  let state: number = seed;
  return (): number => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
};

const clamp = (value: number, [lowest, highest]: [number, number]): number => Math.min(highest, Math.max(lowest, value));

/** An ink at a point of the search: under the gamut ceiling at every lightness, raised until it reads on the background. */
const inkAt = (ink: SyntaxInk, point: Oklch, background: Colour): Colour =>
  raisedUntil(point, ink === 'generic' ? TEXT_CONTRAST : BODY_CONTRAST, background, (lightness: number): number =>
    Math.min(point.c, GAMUT_SHARE * gamutChroma(lightness, point.h))
  );

const INK_PAIRS: [SyntaxInk, SyntaxInk][] = SYNTAX_INKS.flatMap((first: SyntaxInk, index: number): [SyntaxInk, SyntaxInk][] =>
  SYNTAX_INKS.slice(index + 1).map((second: SyntaxInk): [SyntaxInk, SyntaxInk] => [first, second])
);

/*
 * The search measures the same few thousand hexes millions of times over, so
 * what it measures of them is kept. Without this, a run takes more than twice
 * as long.
 */
const knownDistances: Map<string, number> = new Map();
const knownChromas: Map<Colour, number> = new Map();

const distanceBetween = (first: Colour, second: Colour): number => {
  const key: string = first + second;
  let distance: number | undefined = knownDistances.get(key);
  if (distance === undefined) knownDistances.set(key, (distance = deltaE(first, second)));
  return distance;
};

const chromaOf = (colour: Colour): number => {
  let chroma: number | undefined = knownChromas.get(colour);
  if (chroma === undefined) knownChromas.set(colour, (chroma = oklchFromHex(colour).c));
  return chroma;
};

/** How good a set of inks is: higher is better. */
const scoreOf = (inks: Record<SyntaxInk, Colour>, signals: Colour[]): number => {
  const distances: number[] = INK_PAIRS.map(([first, second]: [SyntaxInk, SyntaxInk]): number => distanceBetween(inks[first], inks[second])).sort(
    (first: number, second: number): number => first - second
  );
  const clearance: number = Math.min(
    ...SYNTAX_INKS.flatMap((ink: SyntaxInk): number[] => signals.map((signal: Colour): number => distanceBetween(inks[ink], signal)))
  );
  const keywordChroma: number = chromaOf(inks.keyword);
  let loudness: number = 0;
  for (const ink of SYNTAX_INKS) {
    if (ink === 'keyword' || ink === 'generic') continue;
    const chroma: number = chromaOf(inks[ink]);
    if (chroma > keywordChroma + KEYWORD_MARGIN) loudness += (chroma - keywordChroma) * LOUDNESS_COST;
  }
  const separation: number = PAIR_WEIGHTS.reduce((sum: number, weight: number, index: number): number => sum + weight * distances[index], 0);
  return separation + Math.min(0, clearance - SIGNAL_CLEARANCE) * SIGNAL_COST - loudness;
};

type SearchResult = { inks: Record<SyntaxInk, Colour>; score: number };

/** One run of the search from the brief's starting inks. */
const searched = (brief: FamilyBrief, background: Colour, seed: number): SearchResult => {
  const random: () => number = lehmer(seed);
  const signals: Colour[] = [hexAt(brief.error), hexAt(brief.warning)];
  const points = {} as Record<SyntaxInk, Oklch>;
  const inks = {} as Record<SyntaxInk, Colour>;
  for (const ink of SYNTAX_INKS) {
    points[ink] = { ...brief.inks[ink] };
    inks[ink] = inkAt(ink, points[ink], background);
  }

  let best: number = scoreOf(inks, signals);
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const ink: SyntaxInk = SYNTAX_INKS[Math.floor(random() * SYNTAX_INKS.length)];
    const bounds: SearchBounds = BOUNDS[ink];
    const before: Oklch = points[ink];
    const beforeInk: Colour = inks[ink];

    const move: number = random();
    if (move < 0.33) points[ink] = { ...before, l: clamp(before.l + (random() - 0.5) * LIGHTNESS_MOVE, bounds.lightness) };
    else if (move < 0.66) points[ink] = { ...before, c: clamp(before.c + (random() - 0.5) * CHROMA_MOVE, bounds.chroma) };
    else {
      const turned: number = before.h + (random() - 0.5) * HUE_MOVE;
      const hue: number = Math.abs(signedHueDelta(brief.inks[ink].h, turned)) > bounds.hueDrift ? before.h : turned;
      points[ink] = { ...before, h: (hue + 360) % 360 };
    }
    inks[ink] = inkAt(ink, points[ink], background);

    const score: number = scoreOf(inks, signals);
    if (score >= best) best = score;
    else {
      points[ink] = before;
      inks[ink] = beforeInk;
    }
  }
  return { inks, score: best };
};

/* -------------------------------------------------------------- *
 * The design
 * -------------------------------------------------------------- */

/*
 * Which ink a signal borrows: the one nearest in hue to the signal's colour,
 * among the inks that can play it, ties going to the first named. Proposed,
 * like everything here — the family issue may name another.
 */
const BORROWING: Record<keyof Signals, { hue: number; candidates: Ink[] }> = {
  success: { hue: 145, candidates: ['string', 'keyword', 'type', 'iface'] },
  info: { hue: 250, candidates: ['func', 'keyword'] },
  hint: { hue: 185, candidates: ['type', 'string', 'func', 'keyword'] },
  orange: { hue: 55, candidates: ['enumMember', 'number', 'keyword', 'property', 'iface'] },
  purple: { hue: 305, candidates: ['property', 'keyword', 'func', 'enumMember'] },
};

/** Keywords at these hues are a magenta, a violet or a pink, and play the terminal's magenta; anywhere else the properties do. */
const isMagenta = (hue: number): boolean => hue >= 280 || hue < 10;

/** The bright terminal partner of each ink that has one in the palette. */
const BRIGHT_ROLE: Partial<Record<Ink, RoleName>> = {
  keyword: 'keywordBright',
  property: 'propertyBright',
  string: 'stringBright',
  func: 'funcBright',
  type: 'typeBright',
};

type Design = {
  roles: Record<RoleName, Colour>;
  signals: Signals;
  terminalMagenta?: [normal: RoleName, bright: RoleName];
  tokens: Tokens;
  score: number;
};

const designOf = (brief: FamilyBrief): Design => {
  const surfaces = Object.fromEntries(
    SURFACES.map((surface: Surface): [Surface, Colour] => {
      const [lightness, chroma]: [number, number] = brief.surfaces[surface];
      return [surface, hexAt({ l: lightness, c: chroma, h: brief.groundHue })];
    })
  ) as Record<Surface, Colour>;
  const background: Colour = surfaces.background;
  const text = (lightness: number, chromaShare: number): Oklch => ({ l: lightness, c: brief.textChroma * chromaShare, h: brief.textHue });

  const normal: Colour = raisedUntil(text(0.75, 0.85), BODY_CONTRAST, background);
  const runs: SearchResult[] = SEEDS.map((seed: number): SearchResult => searched(brief, background, seed));
  const { inks, score }: SearchResult = runs.reduce((best: SearchResult, run: SearchResult): SearchResult => (run.score > best.score ? run : best));

  const accent: Colour = loweredForWhite(brief.accent);
  const accentPoint: Oklch = oklchFromHex(accent);
  const error: Colour = hexAt(brief.error);
  const warning: Colour = hexAt(brief.warning);
  const [groundLightness, groundChroma]: [number, number] = brief.surfaces.background;

  const roles: Record<RoleName, Colour> = {
    bg: background,
    bgDeep: surfaces.frame,
    bgSide: surfaces.surface,
    ansiBlack: hexAt({ l: groundLightness + 0.035, c: groundChroma * 1.2, h: brief.groundHue }),
    bgLine: surfaces.currentLine,
    bgLift: surfaces.surfaceRaised,
    bgTab: surfaces.surfaceHover,
    line: surfaces.border,
    selDim: surfaces.surfaceFocus,
    sel: surfaces.surfaceSelected,
    whitespace: hexAt(text(0.3, 1.6)),
    border: surfaces.borderStrong,
    accentDim: hexAt({ l: accentPoint.l * 0.7, c: accentPoint.c * 0.72, h: accentPoint.h }),
    accent,
    fgFaint: raisedUntil(text(0.5, 1), AUXILIARY_CONTRAST, background),
    fgMuted: raisedUntil(text(0.56, 1), AUXILIARY_CONTRAST, surfaces.surfaceSelected),
    fgDim: raisedUntil(text(0.68, 0.9), TEXT_CONTRAST, background),
    fg: normal,
    fgBright: hexAt(text(Math.max(0.82, oklchFromHex(normal).l + 0.07), 0.8)),
    cursor: hexAt({ l: 0.8, c: 0.09, h: accentPoint.h }),
    fgWhite: hexAt(text(0.955, 0.3)),
    variable: inks.variable,
    property: inks.property,
    operator: inks.operator,
    propertyBright: lightened(inks.property),
    keyword: inks.keyword,
    keywordBright: lightened(inks.keyword),
    generic: inks.generic,
    // The debugging status bar: the type parameters' hue, as deep as white text needs it.
    genericDeep: loweredForWhite({ l: 0.5, c: 0.17, h: oklchFromHex(inks.generic).h }),
    string: inks.string,
    stringBright: lightened(inks.string),
    func: inks.func,
    funcBright: lightened(inks.func),
    number: inks.number,
    type: inks.type,
    typeBright: lightened(inks.type),
    enumMember: inks.enumMember,
    iface: inks.iface,
    error,
    errorBright: lightened(error, 0.1, 0.8),
    warning,
    warningBright: lightened(warning),
  };

  const borrowed = (signal: keyof Signals): Ink => {
    const { hue, candidates }: { hue: number; candidates: Ink[] } = BORROWING[signal];
    const distance = (ink: Ink): number => Math.abs(signedHueDelta(oklchFromHex(roles[ink]).h, hue));
    return [...candidates].sort((first: Ink, second: Ink): number => distance(first) - distance(second))[0];
  };
  const signals: Signals = {
    success: borrowed('success'),
    info: borrowed('info'),
    hint: borrowed('hint'),
    orange: borrowed('orange'),
    purple: borrowed('purple'),
  };
  const magenta: Ink = isMagenta(oklchFromHex(roles.keyword).h) ? 'keyword' : 'property';
  // The terminal's bright row is the borrowed ink lightened, whether or not the palette has a role for it: `problemsOf` says when it does not.
  const bright = (ink: Ink): Colour => lightened(roles[ink]);

  const tokens: Tokens = {
    surface: surfaces,
    text: {
      ghost: roles.whitespace,
      faint: roles.fgFaint,
      muted: roles.fgMuted,
      secondary: roles.fgDim,
      normal: roles.fg,
      bright: roles.fgBright,
      white: roles.fgWhite,
    },
    link: { rest: roles.func, active: roles.funcBright },
    accent: { base: roles.accent, muted: roles.accentDim, on: WHITE },
    syntax: {
      variable: roles.variable,
      property: roles.property,
      operator: roles.operator,
      keyword: roles.keyword,
      generic: roles.generic,
      string: roles.string,
      function: roles.func,
      number: roles.number,
      type: roles.type,
      interface: roles.iface,
      enumMember: roles.enumMember,
    },
    state: {
      focus: roles.accent,
      active: roles.cursor,
      success: roles[signals.success],
      info: roles[signals.info],
      warning,
      error,
      hint: roles[signals.hint],
      modified: roles[signals.info],
      added: roles[signals.success],
      deleted: error,
      conflicting: warning,
      deprecated: roles.fgMuted,
      debugging: roles.genericDeep,
    },
    chart: {
      red: error,
      orange: roles[signals.orange],
      yellow: warning,
      green: roles[signals.success],
      blue: roles[signals.info],
      purple: roles[signals.purple],
    },
    ansi: {
      black: roles.ansiBlack,
      red: error,
      green: roles[signals.success],
      yellow: warning,
      blue: roles[signals.info],
      magenta: roles[magenta],
      cyan: roles[signals.hint],
      white: roles.fg,
      brightBlack: roles.fgMuted,
      brightRed: roles.errorBright,
      brightGreen: bright(signals.success),
      brightYellow: roles.warningBright,
      brightBlue: bright(signals.info),
      brightMagenta: bright(magenta),
      brightCyan: bright(signals.hint),
      brightWhite: roles.fgWhite,
    },
  };

  return {
    roles,
    signals,
    terminalMagenta: magenta === 'keyword' ? undefined : [magenta, BRIGHT_ROLE[magenta]!],
    tokens,
    score,
  };
};

/* -------------------------------------------------------------- *
 * Measuring
 * -------------------------------------------------------------- */

/** The separation the build will hold the seven to (#13). */
const SEPARATION_FLOOR = 12;

const TOKEN_OF_INK: Record<SyntaxInk, keyof Tokens['syntax']> = {
  variable: 'variable',
  property: 'property',
  operator: 'operator',
  keyword: 'keyword',
  generic: 'generic',
  string: 'string',
  func: 'function',
  number: 'number',
  type: 'type',
  iface: 'interface',
  enumMember: 'enumMember',
};

type Pair = { first: string; second: string; distance: number };

type Measurements = {
  /** Every pair of inks, closest first. */
  pairs: Pair[];
  mean: number;
  /** The ink nearest the error or the warning. */
  nearestSignal: Pair;
  contrast: Record<SyntaxInk, number>;
  faintOnSurface: number;
  mutedOnSelection: number;
  normalOnBackground: number;
  whiteOnAccent: number;
};

const measured = (tokens: Tokens): Measurements => {
  const inkOf = (ink: SyntaxInk): Colour => tokens.syntax[TOKEN_OF_INK[ink]];
  const pairs: Pair[] = INK_PAIRS.map(([first, second]: [SyntaxInk, SyntaxInk]): Pair => ({ first, second, distance: deltaE(inkOf(first), inkOf(second)) })).sort(
    (first: Pair, second: Pair): number => first.distance - second.distance
  );
  const signalPairs: Pair[] = (['error', 'warning'] as const).flatMap((signal: 'error' | 'warning'): Pair[] =>
    SYNTAX_INKS.map((ink: SyntaxInk): Pair => ({ first: signal, second: ink, distance: deltaE(tokens.state[signal], inkOf(ink)) }))
  );
  return {
    pairs,
    mean: pairs.reduce((sum: number, pair: Pair): number => sum + pair.distance, 0) / pairs.length,
    nearestSignal: signalPairs.reduce((nearest: Pair, pair: Pair): Pair => (pair.distance < nearest.distance ? pair : nearest)),
    contrast: Object.fromEntries(SYNTAX_INKS.map((ink: SyntaxInk): [SyntaxInk, number] => [ink, contrastRatio(inkOf(ink), tokens.surface.background)])) as Record<
      SyntaxInk,
      number
    >,
    faintOnSurface: contrastRatio(tokens.text.faint, tokens.surface.surface),
    mutedOnSelection: contrastRatio(tokens.text.muted, tokens.surface.surfaceSelected),
    normalOnBackground: contrastRatio(tokens.text.normal, tokens.surface.background),
    whiteOnAccent: contrastRatio(WHITE, tokens.accent.base),
  };
};

/**
 * A palette role as frozen numbers, written as the literal to paste: its OKLCH
 * at the fewest decimals that the build's own conversion turns back into the
 * same hex, so what is pasted is exactly what was proposed.
 */
const frozen = (colour: Colour): string => {
  const exact: Oklch = oklchFromHex(colour);
  for (let decimals = 3; decimals <= 8; decimals++) {
    const [lightness, chroma, hue]: string[] = [exact.l.toFixed(decimals), exact.c.toFixed(decimals), exact.h.toFixed(decimals - 2)];
    if (hexFromOklch({ l: +lightness, c: +chroma, h: +hue }) === colour) return `{ l: ${lightness}, c: ${chroma}, h: ${hue} }`;
  }
  throw new Error(`${colour} does not survive a round trip through OKLCH`);
};

/** What would stop the design from being pasted as it is, or the build from taking it. */
const problemsOf = (design: Design): string[] => {
  const held: Set<Colour> = new Set([...Object.values(design.roles), WHITE]);
  const unheld: string[] = flatten(design.tokens)
    .filter(([, colour]: [string, Colour]): boolean => !held.has(colour))
    .map(([token, colour]: [string, Colour]): string => `${token} ${colour} is no palette role: theme-palette.ts has nowhere to put it`);
  const borrowed: [keyof Signals, Ink][] = Object.entries(design.signals) as [keyof Signals, Ink][];
  const shared: string[] =
    new Set(Object.values(design.signals)).size === borrowed.length ? [] : ['two signals borrow the same ink, which the build refuses'];
  const offTarget: string[] = borrowed
    .filter(([signal, ink]: [keyof Signals, Ink]): boolean => Math.abs(signedHueDelta(SIGNAL_HUE[signal], oklchFromHex(design.roles[ink]).h)) > SIGNAL_TOLERANCE)
    .map(([signal, ink]: [keyof Signals, Ink]): string => `${signal} borrows ${ink}, more than the build's ${SIGNAL_TOLERANCE}° from the colour it is named for`);
  return [...unheld, ...shared, ...offTarget];
};

/* -------------------------------------------------------------- *
 * Printing
 * -------------------------------------------------------------- */

const decimal = (value: number, digits: number = 1): string => value.toFixed(digits);
const ratio = (value: number): string => `${value.toFixed(2)}:1`;
const pairName = (pair: Pair): string => `${pair.first}/${pair.second}`;
const shift = (shipped: string, proposed: string): string => `${shipped} → ${proposed}`;

const printMeasurements = (shipped: Measurements, proposed: Measurements): void => {
  const under = (measurements: Measurements): string => String(measurements.pairs.filter((pair: Pair): boolean => pair.distance < SEPARATION_FLOOR).length);
  console.log(
    `  separation  closest ${shift(decimal(shipped.pairs[0].distance), decimal(proposed.pairs[0].distance))} ΔE (${pairName(proposed.pairs[0])})` +
      ` · mean ${shift(decimal(shipped.mean), decimal(proposed.mean))} · pairs under ${SEPARATION_FLOOR} ${shift(under(shipped), under(proposed))}`
  );
  console.log(`  next        ${proposed.pairs.slice(1, 4).map((pair: Pair): string => `${pairName(pair)} ${decimal(pair.distance)}`).join(' · ')}`);
  console.log(
    `  signals     nearest ink ${shift(decimal(shipped.nearestSignal.distance), decimal(proposed.nearestSignal.distance))} ΔE (${pairName(proposed.nearestSignal)})`
  );
  console.log(`  contrast    ${SYNTAX_INKS.map((ink: SyntaxInk): string => `${ink} ${decimal(proposed.contrast[ink])}`).join(' · ')}`);
  console.log(
    `  text        faint on surface ${ratio(proposed.faintOnSurface)} · muted on selection ${ratio(proposed.mutedOnSelection)}` +
      ` · normal ${ratio(proposed.normalOnBackground)} · white on accent ${ratio(proposed.whiteOnAccent)}`
  );
};

const printTokens = (shipped: Tokens, proposed: Tokens): void => {
  const shippedColours: Map<string, Colour> = new Map(flatten(shipped));
  console.log(`  ${'token'.padEnd(24)}shipped  proposed  oklch`);
  for (const [token, colour] of flatten(proposed)) {
    const { l: lightness, c: chroma, h: hue }: Oklch = oklchFromHex(colour);
    console.log(`  ${token.padEnd(24)}${shippedColours.get(token)}  ${colour}   ${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)}`);
  }
};

const printDesign = (family: DesignedFamily, design: Design): void => {
  const roleNames: RoleName[] = Object.keys(ROLES) as RoleName[];
  const width: number = Math.max(...roleNames.map((name: RoleName): number => name.length));
  console.log(`  ${family}: {`);
  console.log('    roles: {');
  for (const name of roleNames) console.log(`      ${`${name}:`.padEnd(width + 2)}${frozen(design.roles[name])}, // ${design.roles[name]}`);
  console.log('    },');
  const signals: string = (Object.entries(design.signals) as [keyof Signals, Ink][]).map(([signal, ink]: [keyof Signals, Ink]): string => `${signal}: '${ink}'`).join(', ');
  console.log(`    signals: { ${signals} },`);
  if (design.terminalMagenta) console.log(`    terminalMagenta: ['${design.terminalMagenta[0]}', '${design.terminalMagenta[1]}'],`);
  console.log('  },');
};

/* -------------------------------------------------------------- *
 * Running
 * -------------------------------------------------------------- */

const DESIGNED: DesignedFamily[] = FAMILY_ORDER.filter((family: Family): family is DesignedFamily => family !== 'indigo');

const requested: string[] | undefined = process.argv
  .find((value: string): boolean => value.startsWith('--family='))
  ?.slice('--family='.length)
  .split(',')
  .filter(Boolean);
const unknown: string[] = (requested ?? []).filter((family: string): boolean => !(DESIGNED as string[]).includes(family));
if (unknown.length) throw new Error(`unknown famil${unknown.length === 1 ? 'y' : 'ies'} ${unknown.join(', ')} — expected some of: ${DESIGNED.join(', ')}`);

for (const family of requested ? (requested as DesignedFamily[]) : DESIGNED) {
  const design: Design = designOf(BRIEFS[family]);
  const shipped: Tokens = tokensFor(family);
  console.log(`\n${family}  (search score ${decimal(design.score, 2)})\n`);
  printMeasurements(measured(shipped), measured(design.tokens));
  console.log(`  borrowed    ${(Object.entries(design.signals) as [keyof Signals, Ink][]).map(([signal, ink]: [keyof Signals, Ink]): string => `${signal} ${ink}`).join(' · ')}`);
  console.log('');
  printTokens(shipped, design.tokens);
  console.log('');
  printDesign(family, design);
  for (const problem of problemsOf(design)) console.log(`  ! ${problem}`);
}
