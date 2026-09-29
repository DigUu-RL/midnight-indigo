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
import {
  WHITE,
  paletteFor,
  signalsFor,
  terminalMagentaFor,
  type Family,
  type Ink,
  type Palette,
  type RoleName,
  type Signals,
} from './theme-palette.ts';

/* -------------------------------------------------------------- *
 * Overlays
 * -------------------------------------------------------------- */

/*
 * The alpha ladder. VS Code composites a translucent colour over whatever is
 * under it, which is what lets one highlight work on the editor, a peek view
 * and a diff alike — so the theme's highlights are overlays, and these are
 * the only opacities it uses. They are the ones the shipped theme already
 * had, named, plus `half` for disabled text, `wash` (M4) for the line a
 * debugger is paused on, which at `tint` mixed with the violet current line
 * into a grey that read as no colour at all, and `trace` (M7) for a whole line
 * a diff changed: the text that changed in it sits on top at `tint`, and at
 * `tint` under `tint` the two made one band too heavy to read body text on.
 */
export const OVERLAY = {
  trace: 0x11, //   7%  a whole line that changed, under the text that changed in it
  tint: 0x22, //   13%  a region: inserted or removed text, a merge block
  wash: 0x33, //   20%  a line that is where execution is: the paused frame, the selected frame
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
 * same everywhere it is taken — the scrollbar, the toolbar, the tabs, the
 * Settings rows. STATES below says which derivation each state uses.
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
 * Interaction states
 * -------------------------------------------------------------- */

/*
 * The grammar every control is written in: what each state looks like, and
 * which channel carries it. Channels matter as much as colours — a state told
 * apart from its neighbour by hue alone is lost to anyone who does not see the
 * hue — so each state has a channel of its own: focus is a ring, selection is
 * a ground and brighter text, the active tab is a rule, a toggle that is on is
 * a filled ground.
 *
 * The order is the promise. Hover is the lightest step above rest; selection
 * is always stronger than hover; pressing is stronger than hovering. Check 11
 * in tools/build-color-themes.ts measures every control that has states, in
 * every family, as the colours it composites to on the ground it is drawn on.
 *
 * The accent is kept for what is current or asked for — focus, the active
 * view's rule, a toggle that is on, a prominent action — and never used for
 * hover, selection or pressing, which stay on the surface ladder: an accent
 * that marks everything marks nothing.
 */
export type InteractionState =
  | 'normal'
  | 'hover'
  | 'focus'
  | 'active'
  | 'selected'
  | 'disabled'
  | 'prominent'
  | 'danger';

export const STATES: Record<InteractionState, string> = {
  normal: 'The ground the control sits on, and text at `normal` or `secondary`. Nothing drawn that the state does not need.',
  hover:
    'A lighter ground, never a border, never the accent, and always the weakest step above rest. A row — in a list, a menu of actions, the Settings editor, the modern layout — takes the focus ground at `soft`, a preview of focus that shows on every surface, raised or not. An icon button takes `borderStrong` at `faint`, leaving room for pressing above it. On a control filled with the accent, hover recedes toward the ground instead: the fill is already the brightest thing there.',
  focus:
    '`state.focus`, solid, as a ring — the only state drawn as an outline, so it reads over whatever ground the other states put under it and never depends on the ground changing. Checked at 3:1 against every surface it can sit on.',
  active:
    'Pressed: the hover colour at `heavy` (`derive.active`), or the next surface up. Never the same as selected, nor as a toggle that is on.',
  selected:
    'A ground stronger than hover plus `bright` text, on the surface ladder. The active tab and the active view add a rule in the accent; a selection in a list without focus keeps its ground and loses the ring and the bright text.',
  disabled: 'Half of what it would have been (`derive.disabled`), so it keeps its shape and loses its weight.',
  prominent:
    'The accent as a fill with `accent.on` text: the primary button, a badge, a prominent status-bar item. A toggle that is on is the accent at `soft` with a `accent.muted` rim, so that on and focused never look alike.',
  danger:
    'The error ink: solid as text, an icon or a ring; at `faint` behind white text; at `soft` under the pointer.',
};

/* -------------------------------------------------------------- *
 * Signals
 * -------------------------------------------------------------- */

/*
 * What each signal is supposed to look like: the hue of VS Code's own default
 * for it, measured in OKLCH. Error and warning are palette roles of their own;
 * for the rest a family picks which of its inks plays each one (`signalsFor`).
 * The build checks that every one lands within SIGNAL_TOLERANCE of this. Wide,
 * because the family decides, but not so wide that "error" can be orange.
 */
const SIGNAL_REFERENCE = {
  error: '#F14C4C', //   charts.red, editorError.foreground
  orange: '#D18616', //  charts.orange
  warning: '#CCA700', // charts.yellow, editorWarning.foreground
  success: '#89D185', // charts.green
  info: '#3794FF', //    charts.blue, editorInfo.foreground
  hint: '#64D8CB', //    VS Code's hint is a grey; this is the roadmap's teal
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
    conflicting: Colour;
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
    surfaceHover: 'The active tab, and at an overlay the tab under the pointer; the notification-center header, a selected notebook cell — the lightest ground that is still a ground.',
    surfaceFocus: 'The focused row in a list, the selected suggestion, a matched word: attention without selection. At its resting overlay, the row under the pointer.',
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
    base: "The theme's colour: buttons, badges, the active tab's rule, the pressed scrollbar — and the AI's identity, wherever it speaks or acts: the command a request addresses it by, the border that runs while it works, its suggestion in the gutter, a session in progress.",
    muted: "The accent at rest: widget borders, the unfocused active tab, the scrollbar, the AI's avatar and the inline chat's frame.",
    on: 'Text and icons on the accent. White in every family, and checked at 3:1.',
  },
  syntax: {
    variable: 'Variables, parameters (italic) and command-line flags. Family-coloured, told apart from the text by lightness.',
    property: "Properties, fields, object and JSON keys, YAML keys, CSS properties and SQL columns. The family's light chrome in indigo; in the other seven, the hue the keywords had before M9.",
    operator: "Operators, word operators included. Colour only, never bold or italic. Indigo's violet; in the other seven, a quiet tint of the family.",
    keyword: "Keywords and punctuation, always bold italic (punctuation plain). The theme's signature: pink in indigo, the family's own colour in the other seven.",
    generic: 'Type parameters, type arguments and lifetimes: a dark partner of the signature.',
    string: 'Strings, and the JSON values that are strings.',
    function: 'Functions, methods, macros and commands: bold where declared, plain where called.',
    number: 'Numbers with their units, colours, decorators, attributes and annotations.',
    type: 'Classes, structs, records, type references, markup tags and Markdown headings.',
    interface: 'Interfaces, traits and enums.',
    enumMember: 'Enum members, named constants, CSS keyword values and inline code.',
  },
  state: {
    focus: 'Keyboard focus. Solid, never translucent, so it cannot vanish into what it sits on.',
    active: 'Where the input goes: the caret, the active line number, the primary cursor.',
    success: 'Something passed. The ink the family names as its green, and only ever drawn with a shape — a tick, a gutter bar — never as text among the strings it shares a colour with.',
    info: 'Something to know. The ink the family names as its blue.',
    warning: 'Something to look at. A palette colour of its own: a saturated yellow at the top of the lightness band, clear of the pastel numbers and interfaces.',
    error: 'Something is wrong. A palette colour of its own: a saturated red below the syntax band, never the keyword ink.',
    hint: 'A suggestion, not a problem: the ink the family names as its teal, drawn by VS Code as dots rather than a squiggle.',
    modified: "A changed line, file or setting, a renamed file, moved code: the info ink, the family's blue.",
    added: "An added line or file, untracked or staged — Git's letter tells those apart, the colour says it is an addition: the success ink, the family's green.",
    deleted: 'A removed line or file: the error red, never the keyword ink code is written in.',
    conflicting: 'A merge conflict still to resolve: the warning amber, the one Git state that asks for attention.',
    deprecated: 'Something that still works and should not be used: muted, to be struck through.',
  },
  chart: {
    red: 'The first chart series, and the error signal.',
    orange: 'A chart series between red and yellow. Not a signal.',
    yellow: 'A chart series, and the warning signal.',
    green: 'A chart series, and the success signal.',
    blue: 'A chart series, and the info signal.',
    purple: 'A chart series, and an "important" alert in rendered Markdown. Not a signal.',
  },
  ansi: {
    black: "The terminal's black: a step above the ground, so it is visible as a background.",
    red: 'Terminal red: the error. A failed build prints in the colour the squiggle is drawn in, never in a syntax ink.',
    green: 'Terminal green: the success ink, which is the string colour.',
    yellow: 'Terminal yellow: the warning.',
    blue: 'Terminal blue: the info ink, which is the function colour.',
    magenta: 'Terminal magenta: the keywords, where the family draws them magenta, pink or violet; the magenta properties where the keywords are another colour.',
    cyan: 'Terminal cyan: the hint ink, which is the type colour.',
    white: 'Terminal white: body text.',
    brightBlack: 'Terminal bright black, the grey command-line tools print what matters least in: the comment grey.',
    brightRed: 'Terminal bright red: the error, lighter.',
    brightGreen: 'Terminal bright green: the success ink, lighter.',
    brightYellow: 'Terminal bright yellow: the warning, lighter.',
    brightBlue: 'Terminal bright blue: the info ink, lighter.',
    brightMagenta: 'Terminal bright magenta: the magenta, lighter.',
    brightCyan: 'Terminal bright cyan: the hint ink, lighter.',
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

/**
 * The lighter partner of each ink the terminal borrows, for its bright row. An
 * ink without one cannot play a terminal colour, and `tokensFor` says so.
 */
const BRIGHT: Partial<Record<Ink, keyof Palette>> = {
  string: 'stringBright',
  func: 'funcBright',
  type: 'typeBright',
  keyword: 'keywordBright',
};

export function tokensFor(family: Family): Tokens {
  const p = paletteFor(family);
  const signal = signalsFor(family);
  const ink = (borrowed: keyof Signals): Colour => p[INK[signal[borrowed]]];
  const brightInk = (borrowed: keyof Signals): Colour => {
    const partner: keyof Palette | undefined = BRIGHT[signal[borrowed]];
    if (!partner) throw new Error(`${family}: ${borrowed} is ${signal[borrowed]}, which has no bright partner for the terminal`);
    return p[partner];
  };
  const [magenta, brightMagenta]: [RoleName, RoleName] = terminalMagentaFor(family);

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
      warning: p.warning,
      error: p.error,
      hint: ink('hint'),
      modified: ink('info'),
      added: ink('success'),
      deleted: p.error,
      conflicting: p.warning,
      deprecated: p.fgMuted,
    },
    chart: {
      red: p.error,
      orange: ink('orange'),
      yellow: p.warning,
      green: ink('success'),
      blue: ink('info'),
      purple: ink('purple'),
    },
    ansi: {
      black: p.ansiBlack,
      red: p.error,
      green: ink('success'),
      yellow: p.warning,
      blue: ink('info'),
      magenta: p[magenta],
      cyan: ink('hint'),
      white: p.fg,
      brightBlack: p.fgMuted,
      brightRed: p.errorBright,
      brightGreen: brightInk('success'),
      brightYellow: p.warningBright,
      brightBlue: brightInk('info'),
      brightMagenta: p[brightMagenta],
      brightCyan: brightInk('hint'),
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
