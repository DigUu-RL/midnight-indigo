/*
 * The roles the theme is written in.
 *
 * tools/theme-palette.ts decides what colour each palette entry is in each
 * family; tools/build-color-themes.ts decides which VS Code key gets which
 * colour. Before this file the second read the first directly — `p.bgTab`,
 * `p.selDim` — and that is a name for a colour, not for a job. `bgTab` is the
 * active tab, and also the hovered list row and the inactive selection, and
 * nothing said that the three were meant to move together rather than happening
 * to share a hex.
 *
 * So there is a layer in between. A TOKEN is a job — `surfaceHover`, `muted`,
 * `error` — and the build writes against jobs only. Each one is documented in
 * DOCS below, and the type makes that exhaustive: a token without a sentence
 * saying what it is for does not compile. That is the whole enforcement of
 * "no colour without a role", and the build adds the runtime half — every
 * colour it emits has to be one of these tokens, so a stray hexadecimal in the
 * theme is an error rather than a thing someone notices in review.
 *
 * NOTHING HERE IS A NEW COLOUR. Every token is a palette entry, a derivation
 * of one (an overlay, below), or a choice between palette entries that the
 * family makes (`signalsFor`). The eight variants are therefore still one
 * model: the same tokens, the same derivations, a different palette under
 * them. And indigo still regenerates the theme it shipped as, which the build
 * asserts key for key.
 */

import { oklchFromHex, type Colour } from './color.ts';
import { WHITE, paletteFor, signalsFor, type Family, type Ink, type Palette } from './theme-palette.ts';

/* -------------------------------------------------------------- *
 * Overlays
 * -------------------------------------------------------------- */

/*
 * The alpha ladder. VS Code composites a translucent colour over whatever is
 * under it, which is what lets one highlight work on the editor, a peek view
 * and a diff alike — so the theme's highlights are overlays, and these are
 * the only opacities it uses. They are the ones the shipped theme already
 * had, named, plus `half` for disabled text.
 */
export const OVERLAY = {
  tint: 0x22, //   13%  a region: an inserted or removed line
  faint: 0x55, //  33%  at rest: the scrollbar, a bracket match, find context
  soft: 0x66, //   40%  a match: the word under the cursor, the current find
  half: 0x80, //   50%  disabled
  medium: 0x88, // 53%  under the pointer
  strong: 0x99, // 60%  a strong match; the same thing, not the focused one
  heavy: 0xaa, //  67%  pressed
} as const;

export type OverlayLevel = keyof typeof OVERLAY;

export const overlay = (colour: Colour, level: OverlayLevel): Colour =>
  colour + OVERLAY[level].toString(16).padStart(2, '0').toUpperCase();

/*
 * The derivations. A state is not a new colour, it is a colour at another
 * step of the ladder, and writing it as a function is what makes the step the
 * same everywhere it is taken — the scrollbar and, from M3 on, every other
 * control that has a hover.
 *
 *   rest → hover → active   the resting overlay, what the pointer makes it,
 *                           and what pressing makes it. Active usually trades
 *                           the dim accent for the full one as well.
 *   inactive                the same thing, but not the one with focus: the
 *                           line highlight of an unfocused editor, a
 *                           secondary cursor.
 *   disabled                half of whatever it would have been.
 *   focus                   is not here, on purpose. Focus is `state.focus`,
 *                           solid: it has to survive on every surface, and a
 *                           translucent focus ring is a ring that disappears
 *                           over the colour it happens to sit on.
 */
export const derive = {
  rest: (c: Colour): Colour => overlay(c, 'faint'),
  hover: (c: Colour): Colour => overlay(c, 'medium'),
  active: (c: Colour): Colour => overlay(c, 'heavy'),
  inactive: (c: Colour): Colour => overlay(c, 'strong'),
  disabled: (c: Colour): Colour => overlay(c, 'half'),
};

/* -------------------------------------------------------------- *
 * Signals
 * -------------------------------------------------------------- */

/*
 * What each signal is supposed to look like: the hue of VS Code's own default
 * for it, measured in OKLCH. A family picks which of its inks plays each one
 * (`signalsFor`); the build checks that the ink it picked lands within
 * SIGNAL_TOLERANCE of this. Wide, because the family decides — a pink theme's
 * red is its own rose — but not so wide that "error" can be orange.
 */
const SIGNAL_REFERENCE = {
  error: '#F14C4C', //   charts.red, editorError.foreground
  orange: '#D18616', //  charts.orange
  warning: '#CCA700', // charts.yellow, editorWarning.foreground
  success: '#89D185', // charts.green
  info: '#3794FF', //    charts.blue, editorInfo.foreground
  purple: '#B180D7', //  charts.purple
} as const;

export type Signal = keyof typeof SIGNAL_REFERENCE;

export const SIGNAL_HUE = Object.fromEntries(
  Object.entries(SIGNAL_REFERENCE).map(([k, hex]) => [k, oklchFromHex(hex).h])
) as Record<Signal, number>;

export const SIGNAL_TOLERANCE = 50;

/* -------------------------------------------------------------- *
 * The tokens
 * -------------------------------------------------------------- */

export type Tokens = {
  surface: {
    background: Colour;
    frame: Colour;
    surface: Colour;
    currentLine: Colour;
    surfaceRaised: Colour;
    surfaceHover: Colour;
    surfaceFocus: Colour;
    surfaceSelected: Colour;
    border: Colour;
    borderStrong: Colour;
  };
  text: {
    ghost: Colour;
    faint: Colour;
    muted: Colour;
    secondary: Colour;
    normal: Colour;
    bright: Colour;
    white: Colour;
  };
  link: {
    rest: Colour;
    active: Colour;
  };
  accent: {
    base: Colour;
    muted: Colour;
    on: Colour;
  };
  syntax: {
    variable: Colour;
    property: Colour;
    operator: Colour;
    keyword: Colour;
    generic: Colour;
    string: Colour;
    function: Colour;
    number: Colour;
    type: Colour;
    interface: Colour;
    enumMember: Colour;
  };
  state: {
    focus: Colour;
    active: Colour;
    success: Colour;
    info: Colour;
    warning: Colour;
    error: Colour;
    hint: Colour;
    modified: Colour;
    added: Colour;
    deleted: Colour;
    untracked: Colour;
    deprecated: Colour;
  };
  chart: {
    red: Colour;
    orange: Colour;
    yellow: Colour;
    green: Colour;
    blue: Colour;
    purple: Colour;
  };
  ansi: {
    black: Colour;
    red: Colour;
    green: Colour;
    yellow: Colour;
    blue: Colour;
    magenta: Colour;
    cyan: Colour;
    white: Colour;
    brightBlack: Colour;
    brightRed: Colour;
    brightGreen: Colour;
    brightYellow: Colour;
    brightBlue: Colour;
    brightMagenta: Colour;
    brightCyan: Colour;
    brightWhite: Colour;
  };
};

export type Group = keyof Tokens;

/** One sentence per token, in the same shape as the tokens: a missing one does not compile. */
type Docs = { [G in Group]: { [K in keyof Tokens[G]]: string } };

export const DOCS: Docs = {
  surface: {
    background: 'The editor itself, the gutter, the terminal and code blocks: the darkest ground, and the one everything else is measured against.',
    frame: 'The window frame — title bar and activity bar — a step above the editor so the edge of the window reads.',
    surface: 'Side bar, panel and tab strip: the chrome that holds the editor.',
    currentLine: "The cursor's line in the editor.",
    surfaceRaised: 'Anything that floats or holds input: widgets, hovers, the suggest list, inputs, dropdowns, the status bar.',
    surfaceHover: 'Under the pointer in a list, and the active tab — the lightest ground that is still a ground.',
    surfaceFocus: 'The focused row in a list, the selected suggestion, a matched word: attention without selection.',
    surfaceSelected: 'Selected text. Always a step past `surfaceFocus`, so a selection is never mistaken for a hover.',
    border: 'Every hairline: panel edges, tab edges, indent guides, rulers.',
    borderStrong: 'Borders that frame a control — inputs, dropdowns, the suggest list — and chart axes.',
  },
  text: {
    ghost: 'Text that should barely be there: rendered whitespace, a dimmed final line number.',
    faint: 'Line numbers and inactive activity-bar icons: present, not read.',
    muted: 'Comments, placeholders, inactive tabs. Deliberately under AA — a comment is meant to recede.',
    secondary: 'The side bar and status bar, and descriptions: read, but after the main text.',
    normal: 'Body text, in the editor and out of it.',
    bright: 'The active tab and the selected row: the one thing in a list that is current.',
    white: "The brightest text there is. The terminal's bright white.",
  },
  link: {
    rest: 'A link, in hovers and rendered Markdown. The function colour, as Markdown links are in the editor.',
    active: 'A link under the pointer.',
  },
  accent: {
    base: "The theme's colour: buttons, badges, the active tab's rule, the pressed scrollbar.",
    muted: 'The accent at rest: widget borders, the unfocused active tab, the scrollbar.',
    on: 'Text and icons on the accent. White in every family, and checked at 3:1.',
  },
  syntax: {
    variable: 'Variables and parameters. Family-coloured, told apart from the text by lightness.',
    property: 'Properties, fields and JSON keys.',
    operator: 'Operators. Colour only, never bold or italic.',
    keyword: 'Keywords and punctuation — the signature colour, and always bold italic.',
    generic: 'Type parameters: the signature pole at a lower lightness.',
    string: 'Strings, and the JSON values that are strings.',
    function: 'Functions and methods: bold where declared, plain where called.',
    number: 'Numbers and decorators.',
    type: 'Classes, structs, records, primitives and Markdown headings.',
    interface: 'Interfaces and enums.',
    enumMember: 'Enum members and inline code.',
  },
  state: {
    focus: 'Keyboard focus. Solid, never translucent, so it cannot vanish into what it sits on.',
    active: 'Where the input goes: the caret, the active line number, the primary cursor.',
    success: 'Something passed. The ink the family names as its green.',
    info: 'Something to know. The ink the family names as its blue.',
    warning: 'Something to look at. The ink the family names as its amber or yellow.',
    error: 'Something is wrong. The ink the family names as its red — in pink, the rose the family owns.',
    hint: 'A suggestion, not a problem: the secondary text colour, so it never competes with a warning.',
    modified: 'A changed file or line. The function colour.',
    added: 'An added file or line. The string colour.',
    deleted: 'A deleted file or line. The keyword colour.',
    untracked: 'A file Git does not know about. The interface colour.',
    deprecated: 'Something that still works and should not be used: muted, to be struck through.',
  },
  chart: {
    red: 'The first chart series, and the error signal.',
    orange: 'A chart series between red and yellow. Not a signal.',
    yellow: 'A chart series, and the warning signal.',
    green: 'A chart series, and the success signal.',
    blue: 'A chart series, and the info signal.',
    purple: 'A chart series. Not a signal.',
  },
  ansi: {
    black: "The terminal's black: a step above the ground, so it is visible as a background.",
    red: 'Terminal red: the keyword colour.',
    green: 'Terminal green: the string colour.',
    yellow: 'Terminal yellow: the interface colour.',
    blue: 'Terminal blue: the function colour.',
    magenta: 'Terminal magenta: the type-parameter colour.',
    cyan: 'Terminal cyan: the type colour.',
    white: 'Terminal white: body text.',
    brightBlack: 'Terminal bright black: line-number grey.',
    brightRed: 'Terminal bright red: the keyword colour, lighter.',
    brightGreen: 'Terminal bright green: the string colour, lighter.',
    brightYellow: 'Terminal bright yellow: the interface colour, lighter.',
    brightBlue: 'Terminal bright blue: the function colour, lighter.',
    brightMagenta: 'Terminal bright magenta: the type-parameter colour, lighter.',
    brightCyan: 'Terminal bright cyan: the type colour, lighter.',
    brightWhite: "Terminal bright white: the theme's whitest text.",
  },
};

/** The palette entry each ink name refers to. */
const INK: Record<Ink, keyof Palette> = {
  keyword: 'keyword',
  generic: 'generic',
  string: 'string',
  func: 'func',
  number: 'number',
  type: 'type',
  enumMember: 'enumMember',
  iface: 'iface',
  property: 'property',
  operator: 'operator',
};

export function tokensFor(family: Family): Tokens {
  const p = paletteFor(family);
  const signal = signalsFor(family);
  const ink = (s: Signal): Colour => p[INK[signal[s]]];

  return {
    surface: {
      background: p.bg,
      frame: p.bgDeep,
      surface: p.bgSide,
      currentLine: p.bgLine,
      surfaceRaised: p.bgLift,
      surfaceHover: p.bgTab,
      surfaceFocus: p.selDim,
      surfaceSelected: p.sel,
      border: p.line,
      borderStrong: p.border,
    },
    text: {
      ghost: p.whitespace,
      faint: p.fgFaint,
      muted: p.fgMuted,
      secondary: p.fgDim,
      normal: p.fg,
      bright: p.fgBright,
      white: p.fgWhite,
    },
    link: {
      rest: p.func,
      active: p.funcBright,
    },
    accent: {
      base: p.accent,
      muted: p.accentDim,
      on: WHITE,
    },
    syntax: {
      variable: p.variable,
      property: p.property,
      operator: p.operator,
      keyword: p.keyword,
      generic: p.generic,
      string: p.string,
      function: p.func,
      number: p.number,
      type: p.type,
      interface: p.iface,
      enumMember: p.enumMember,
    },
    state: {
      focus: p.accent,
      active: p.cursor,
      success: ink('success'),
      info: ink('info'),
      warning: ink('warning'),
      error: ink('error'),
      hint: p.fgDim,
      modified: p.func,
      added: p.string,
      deleted: p.keyword,
      untracked: p.iface,
      deprecated: p.fgMuted,
    },
    chart: {
      red: ink('error'),
      orange: ink('orange'),
      yellow: ink('warning'),
      green: ink('success'),
      blue: ink('info'),
      purple: ink('purple'),
    },
    ansi: {
      black: p.ansiBlack,
      red: p.keyword,
      green: p.string,
      yellow: p.iface,
      blue: p.func,
      magenta: p.generic,
      cyan: p.type,
      white: p.fg,
      brightBlack: p.fgFaint,
      brightRed: p.keywordBright,
      brightGreen: p.stringBright,
      brightYellow: p.ifaceBright,
      brightBlue: p.funcBright,
      brightMagenta: p.genericBright,
      brightCyan: p.typeBright,
      brightWhite: p.fgWhite,
    },
  };
}

/** Every token as `group.name`, with its value — for the checks and the docs. */
export const flatten = (t: Tokens): [string, Colour][] =>
  (Object.entries(t) as [Group, Record<string, Colour>][]).flatMap(([g, entries]) =>
    Object.entries(entries).map(([k, v]) => [`${g}.${k}`, v] as [string, Colour])
  );

/** The documentation sentence for `group.name`. */
export const docOf = (token: string): string => {
  const [g, k] = token.split('.') as [Group, string];
  return (DOCS[g] as Record<string, string>)[k] ?? '';
};
