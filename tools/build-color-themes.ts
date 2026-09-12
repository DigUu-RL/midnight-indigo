/*
 * Emits one VS Code colour theme per family into themes/.
 * Run with `node tools/build-color-themes.ts`.
 *
 * The theme used to BE this file's output: 511 lines of hand-written JSON with
 * some forty hexadecimals spread through it. That was maintainable at one
 * variant and would not have survived eight — not because eight files is a lot
 * to store, but because a colour is not a value here, it is a decision applied
 * in nine places, and keeping nine copies of it in step by hand across eight
 * files is not a thing anyone does correctly for long.
 *
 * So the structure lives here once, written against role names, and
 * tools/theme-palette.ts decides what colour each role is in each family.
 * Nothing below knows what hue it is emitting.
 *
 * THE BASELINE. tools/indigo-baseline.json is the theme exactly as it shipped,
 * and `check` below asserts that the indigo variant still regenerates it, key
 * for key and colour for colour. That assertion is the point of the whole
 * arrangement: it is what lets the palette maths be changed with the knowledge
 * that the theme thousands of editors already have open did not move. If it
 * ever fails, the maths changed the original — which is either a bug, or a
 * deliberate change that has to be made to the baseline too, on purpose, in a
 * commit that says so.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrast } from './color.ts';
import {
  FAMILY_ORDER,
  SEPARATION,
  WHITE,
  paletteFor,
  tightest,
  type Family,
  type Palette,
} from './theme-palette.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEMES = path.join(HERE, '..', 'themes');

/** How each family is spelled in the theme picker. */
const TITLE = {
  indigo: 'Indigo',
  purple: 'Purple',
  pink: 'Pink',
  red: 'Red',
  orange: 'Orange',
  green: 'Green',
  cyan: 'Cyan',
  blue: 'Blue',
} as const satisfies Record<Family, string>;

/**
 * The label VS Code shows, and stores in `workbench.colorTheme`.
 *
 * Indigo's is "Midnight Indigo" and has to stay that, exactly. A colour theme
 * without an `id` is remembered by its label, so renaming this one to fit the
 * new family — "Midnight (Indigo)", say — would not rename anything: it would
 * silently reset the theme of every editor that already has it selected,
 * because the label their settings.json names would no longer exist.
 */
export const labelFor = (family: Family): string => `Midnight ${TITLE[family]}`;

/** The file each variant is written to, and named in package.json. */
export const fileFor = (family: Family): string => `midnight-${family}-color-theme.json`;

type Theme = {
  name: string;
  type: 'dark';
  semanticHighlighting: true;
  colors: Record<string, string>;
  tokenColors: unknown[];
  semanticTokenColors: Record<string, unknown>;
};

function themeFor(family: Family, p: Palette): Theme {
  const colors = {
    focusBorder: p.accent,
    foreground: p.fg,
    'selection.background': p.sel,
    'editor.background': p.bg,
    'editor.foreground': p.fg,
    'editorLineNumber.foreground': p.fgFaint,
    'editorLineNumber.activeForeground': p.cursor,
    'editorCursor.foreground': p.cursor,
    'editor.selectionBackground': p.sel,
    'editor.selectionHighlightBackground': p.selDim,
    'editor.inactiveSelectionBackground': p.line,
    'editor.lineHighlightBackground': p.bgLine,
    'editor.lineHighlightBorder': p.bgLine,
    'editor.wordHighlightBackground': p.selDim + '66',
    'editor.wordHighlightStrongBackground': p.sel + '99',
    'editor.findMatchBackground': p.accent + '66',
    'editor.findMatchHighlightBackground': p.accentDim + '55',
    'editorIndentGuide.background1': p.line,
    'editorIndentGuide.activeBackground1': p.accentDim,
    'editorWhitespace.foreground': p.whitespace,
    'editorRuler.foreground': p.line,
    'editorBracketMatch.background': p.sel + '55',
    'editorBracketMatch.border': p.accent,
    'editorBracketHighlight.foreground1': p.keyword,
    'editorBracketHighlight.foreground2': p.func,
    'editorBracketHighlight.foreground3': p.iface,
    'editorBracketHighlight.foreground4': p.generic,
    'editorBracketHighlight.unexpectedBracket.foreground': p.operator,
    'editorGutter.background': p.bg,
    'editorGutter.modifiedBackground': p.func,
    'editorGutter.addedBackground': p.string,
    'editorGutter.deletedBackground': p.keyword,
    'editorOverviewRuler.border': p.bgDeep,
    'editorCodeLens.foreground': p.fgMuted,
    'editorWidget.background': p.bgLift,
    'editorWidget.border': p.accentDim,
    'editorHoverWidget.background': p.bgLift,
    'editorHoverWidget.border': p.accentDim,
    'editorSuggestWidget.background': p.bgLift,
    'editorSuggestWidget.border': p.border,
    'editorSuggestWidget.selectedBackground': p.selDim,
    'editorSuggestWidget.highlightForeground': p.keyword,
    'titleBar.activeBackground': p.bgDeep,
    'titleBar.activeForeground': p.fg,
    'titleBar.inactiveBackground': p.bgDeep,
    'titleBar.inactiveForeground': p.fgMuted,
    'titleBar.border': p.line,
    'activityBar.background': p.bgDeep,
    'activityBar.foreground': p.fg,
    'activityBar.inactiveForeground': p.fgFaint,
    'activityBar.border': p.line,
    'activityBarBadge.background': p.accent,
    'activityBarBadge.foreground': WHITE,
    'sideBar.background': p.bgSide,
    'sideBar.foreground': p.fgDim,
    'sideBar.border': p.line,
    'sideBarTitle.foreground': p.fg,
    'sideBarSectionHeader.background': p.bgLift,
    'sideBarSectionHeader.border': p.line,
    'statusBar.background': p.bgLift,
    'statusBar.foreground': p.fgDim,
    'statusBar.border': p.line,
    'statusBar.debuggingBackground': p.generic,
    'statusBar.noFolderBackground': p.bgLift,
    'statusBarItem.hoverBackground': p.selDim,
    'statusBarItem.remoteBackground': p.accentDim,
    'tab.activeBackground': p.bgTab,
    'tab.activeForeground': p.fgBright,
    'tab.inactiveBackground': p.bg,
    'tab.inactiveForeground': p.fgMuted,
    'tab.border': p.line,
    'tab.activeBorderTop': p.accent,
    'tab.unfocusedActiveBorderTop': p.accentDim,
    'editorGroupHeader.tabsBackground': p.bgSide,
    'editorGroupHeader.border': p.line,
    'editorGroup.border': p.line,
    'panel.background': p.bgSide,
    'panel.border': p.line,
    'panelTitle.activeBorder': p.accent,
    'panelTitle.activeForeground': p.fg,
    'panelTitle.inactiveForeground': p.fgMuted,
    'input.background': p.bgLift,
    'input.border': p.border,
    'input.foreground': p.fg,
    'input.placeholderForeground': p.fgMuted,
    'dropdown.background': p.bgLift,
    'dropdown.border': p.border,
    'dropdown.foreground': p.fg,
    'list.activeSelectionBackground': p.line,
    'list.activeSelectionForeground': p.fgBright,
    'list.inactiveSelectionBackground': p.bgTab,
    'list.hoverBackground': p.bgTab,
    'list.focusBackground': p.selDim,
    'list.highlightForeground': p.keyword,
    'scrollbar.shadow': p.bgDeep,
    'scrollbarSlider.background': p.accentDim + '55',
    'scrollbarSlider.hoverBackground': p.accentDim + '88',
    'scrollbarSlider.activeBackground': p.accent + 'AA',
    'button.background': p.accent,
    'button.foreground': WHITE,
    'badge.background': p.accentDim,
    'badge.foreground': WHITE,
    'terminal.background': p.bg,
    'terminal.foreground': p.fg,
    'terminal.ansiBlack': p.ansiBlack,
    'terminal.ansiRed': p.keyword,
    'terminal.ansiGreen': p.string,
    'terminal.ansiYellow': p.iface,
    'terminal.ansiBlue': p.func,
    'terminal.ansiMagenta': p.generic,
    'terminal.ansiCyan': p.type,
    'terminal.ansiWhite': p.fg,
    'terminal.ansiBrightBlack': p.fgFaint,
    'terminal.ansiBrightRed': p.keywordBright,
    'terminal.ansiBrightGreen': p.stringBright,
    'terminal.ansiBrightYellow': p.ifaceBright,
    'terminal.ansiBrightBlue': p.funcBright,
    'terminal.ansiBrightMagenta': p.genericBright,
    'terminal.ansiBrightCyan': p.typeBright,
    'terminal.ansiBrightWhite': p.fgWhite,
    'diffEditor.insertedTextBackground': p.string + '22',
    'diffEditor.removedTextBackground': p.keyword + '22',
    'gitDecoration.modifiedResourceForeground': p.func,
    'gitDecoration.addedResourceForeground': p.string,
    'gitDecoration.deletedResourceForeground': p.keyword,
    'gitDecoration.untrackedResourceForeground': p.iface,
    'peekViewEditor.background': p.bg,
    'peekViewResult.background': p.bgSide,
    'peekView.border': p.accentDim,
  };

  const tokenColors = [
    {
      name: "Comentários",
      scope: [
        "comment",
        "punctuation.definition.comment",
      ],
      settings: { foreground: p.fgMuted, fontStyle: "italic" },
    },
    {
      name: "Palavras-chave",
      scope: [
        "keyword",
        "keyword.control",
        "keyword.control.flow",
        "keyword.other",
        "storage.type",
        "storage.modifier",
        "keyword.declaration",
        "keyword.other.important",
        "keyword.control.import",
        "keyword.control.from",
        "keyword.control.export",
      ],
      settings: { foreground: p.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Nomes reservados de declaração de tipo NÃO herdam a cor do nome do tipo (fix defensivo interface/enum/struct/record/class)",
      scope: [
        "storage.type.interface",
        "storage.type.enum",
        "storage.type.struct",
        "storage.type.record",
        "storage.type.class",
      ],
      settings: { foreground: p.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Constantes de linguagem (true/false/null/undefined/this/self)",
      scope: [
        "constant.language",
        "variable.language.this",
        "variable.language.self",
        "variable.language.super",
      ],
      settings: { foreground: p.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Strings",
      scope: [
        "string",
        "string.quoted",
        "string.template",
      ],
      settings: { foreground: p.string },
    },
    {
      name: "Sequências de escape dentro de strings",
      scope: [
        "constant.character.escape",
        "constant.character.escape.backslash",
      ],
      settings: { foreground: p.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Interpolação de strings (marcadores ${} #{} $())",
      scope: [
        "punctuation.definition.template-expression",
        "punctuation.section.embedded",
      ],
      settings: { foreground: p.keyword },
    },
    {
      name: "Pontuação e chaves/colchetes/vírgulas",
      scope: [
        "punctuation",
        "punctuation.definition.tag",
        "punctuation.separator",
        "punctuation.separator.comma",
        "punctuation.terminator.statement",
        "punctuation.definition.parameters",
        "punctuation.definition.block",
        "punctuation.definition.array",
        "punctuation.definition.dictionary",
        "meta.brace",
        "meta.brace.round",
        "meta.brace.square",
        "meta.brace.curly",
        "punctuation.accessor",
        "punctuation.definition.typeparameters",
        "punctuation.definition.generic",
        "meta.generic.punctuation",
        "punctuation.brace.angle",
      ],
      settings: { foreground: p.keyword, fontStyle: "" },
    },
    {
      name: "Números",
      scope: ["constant.numeric"],
      settings: { foreground: p.number },
    },
    {
      name: "Operadores (somente cor, nunca negrito/itálico)",
      scope: [
        "keyword.operator",
        "keyword.operator.logical",
        "keyword.operator.new",
        "keyword.operator.arrow",
        "keyword.operator.assignment",
        "keyword.operator.comparison",
        "keyword.operator.relational",
        "keyword.operator.arithmetic",
        "keyword.operator.bitwise",
        "keyword.operator.increment",
        "keyword.operator.decrement",
        "keyword.operator.ternary",
        "keyword.operator.optional",
        "keyword.operator.spread",
        "keyword.operator.rest",
        "keyword.operator.type",
        "keyword.operator.expression",
        "keyword.operator.instanceof",
        "keyword.operator.other",
        "punctuation.definition.arrow",
        "punctuation.operator",
        "storage.type.function.arrow",
        "keyword.operator.assignment.compound",
      ],
      settings: { foreground: p.operator, fontStyle: "" },
    },
    {
      name: "Métodos e funções - declaração",
      scope: [
        "entity.name.function",
        "meta.function.declaration entity.name.function",
        "meta.definition.method entity.name.function",
      ],
      settings: { foreground: p.func, fontStyle: "bold" },
    },
    {
      name: "Métodos e funções - chamada",
      scope: [
        "meta.function-call entity.name.function",
        "support.function",
        "entity.name.function.call",
        "meta.method-call entity.name.function",
        "variable.function",
      ],
      settings: { foreground: p.func, fontStyle: "" },
    },
    {
      name: "Membros estáticos (métodos, campos e propriedades static) - sempre itálico",
      scope: [
        "entity.name.function.static",
        "variable.other.property.static",
        "variable.other.object.property.static",
        "meta.definition.variable.static",
        "storage.modifier.static ~ entity.name.function",
        "meta.definition.property.static",
      ],
      settings: { fontStyle: "italic" },
    },
    {
      name: "Classes (inclui sealed - mesmo padrão de classes comuns)",
      scope: [
        "entity.name.class",
        "entity.name.type.class",
        "support.class",
        "entity.other.inherited-class",
      ],
      settings: { foreground: p.type, fontStyle: "bold" },
    },
    {
      name: "Delegates C# (Action / Func / Predicate) - mesma cor de métodos, em negrito",
      scope: [
        "support.type.delegate.cs",
        "support.class.action",
        "support.class.func",
        "support.class.action.cs",
        "support.class.func.cs",
      ],
      settings: { foreground: p.func, fontStyle: "bold" },
    },
    {
      name: "Function Components (JSX/TSX) - mesmo tratamento visual de classes",
      scope: [
        "support.class.component",
        "entity.name.function.component",
      ],
      settings: { foreground: p.type, fontStyle: "bold" },
    },
    {
      name: "Records e Structs (mesma regra de classes, apenas o nome do tipo)",
      scope: [
        "entity.name.type.record",
        "entity.name.type.struct",
      ],
      settings: { foreground: p.type, fontStyle: "bold" },
    },
    {
      name: "Classes/records/structs estáticos - apenas itálico, sem negrito (fallback léxico; ver semanticTokenColors para cobertura em qualquer ponto de uso)",
      scope: [
        "entity.name.class.static",
        "meta.class.static entity.name.class",
      ],
      settings: { foreground: p.type, fontStyle: "italic" },
    },
    {
      name: "Interfaces e Enums (mesma cor, apenas o nome do tipo)",
      scope: [
        "entity.name.type.interface",
        "entity.name.type.enum",
        "entity.other.inherited-class.interface",
        "meta.interface",
      ],
      settings: { foreground: p.iface, fontStyle: "" },
    },
    {
      name: "Valores de enum (cor diferenciada)",
      scope: [
        "variable.other.enummember",
        "constant.other.enum",
        "entity.name.variable.enum-member",
      ],
      settings: { foreground: p.enumMember },
    },
    {
      name: "Variáveis locais",
      scope: [
        "variable",
        "variable.other.readwrite",
        "variable.other.local",
        "meta.definition.variable variable.other",
      ],
      settings: { foreground: p.variable, fontStyle: "" },
    },
    {
      name: "Parâmetros de métodos - sempre itálico",
      scope: [
        "variable.parameter",
        "variable.parameter.function",
        "meta.parameter",
        "variable.other.parameter",
      ],
      settings: { foreground: p.variable, fontStyle: "italic" },
    },
    {
      name: "Propriedades e campos de classes",
      scope: [
        "variable.other.property",
        "variable.other.object.property",
        "meta.field.declaration",
        "variable.member",
        "support.variable.property",
      ],
      settings: { foreground: p.property, fontStyle: "" },
    },
    {
      name: "Generics (apenas o nome do tipo, os símbolos < > seguem a cor de pontuação)",
      scope: [
        "entity.name.type.parameter",
        "meta.type.parameters entity.name.type",
        "meta.type.arguments entity.name.type",
        "meta.type.parameters storage.type",
        "meta.type.arguments storage.type",
      ],
      settings: { foreground: p.generic, fontStyle: "" },
    },
    {
      name: "Decoradores / Atributos (JS, TS, Python, C#)",
      scope: [
        "meta.decorator",
        "punctuation.decorator",
        "entity.name.function.decorator",
        "meta.attribute",
      ],
      settings: { foreground: p.number, fontStyle: "italic" },
    },
    {
      name: "Tipos primitivos",
      scope: [
        "support.type",
        "storage.type.primitive",
        "entity.name.type.primitive",
      ],
      settings: { foreground: p.type, fontStyle: "" },
    },
    {
      name: "PowerShell - Variáveis ($var)",
      scope: [
        "variable.other.readwrite.powershell",
        "punctuation.definition.variable.powershell",
      ],
      settings: { foreground: p.variable },
    },
    {
      name: "PowerShell - Cmdlets",
      scope: [
        "support.function.powershell",
        "entity.name.function.powershell",
      ],
      settings: { foreground: p.func },
    },
    {
      name: "PowerShell - Parâmetros (-Param)",
      scope: ["variable.parameter.powershell"],
      settings: { foreground: p.variable, fontStyle: "italic" },
    },
    {
      name: "Markdown - Cabeçalhos",
      scope: [
        "markup.heading",
        "entity.name.section.markdown",
      ],
      settings: { foreground: p.type, fontStyle: "bold" },
    },
    {
      name: "Markdown - Negrito",
      scope: ["markup.bold"],
      settings: { foreground: p.fg, fontStyle: "bold" },
    },
    {
      name: "Markdown - Itálico",
      scope: ["markup.italic"],
      settings: { foreground: p.fg, fontStyle: "italic" },
    },
    {
      name: "Markdown - Links",
      scope: [
        "string.other.link",
        "markup.underline.link",
      ],
      settings: { foreground: p.func, fontStyle: "underline" },
    },
    {
      name: "Markdown - Código inline/bloco",
      scope: [
        "markup.inline.raw",
        "markup.fenced_code.block",
      ],
      settings: { foreground: p.enumMember },
    },
    {
      name: "Markdown - Citação",
      scope: ["markup.quote"],
      settings: { foreground: p.fgMuted, fontStyle: "italic" },
    },
    {
      name: "JSON - Chaves (keys)",
      scope: ["support.type.property-name.json"],
      settings: { foreground: p.property },
    },
    {
      name: "JSON - Valores string",
      scope: ["string.quoted.double.json"],
      settings: { foreground: p.string },
    },
    {
      name: "JSON - Constantes (true/false/null)",
      scope: ["constant.language.json"],
      settings: { foreground: p.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Tags/atributos genéricos de markup",
      scope: ["entity.other.attribute-name"],
      settings: { foreground: p.property, fontStyle: "italic" },
    },
  ];

  const semanticTokenColors = {
    class: { foreground: p.type, fontStyle: "bold" },
    'class.static': { foreground: p.type, fontStyle: "italic" },
    'class.sealed': { foreground: p.type, fontStyle: "bold" },
    delegate: { foreground: p.func, fontStyle: "bold" },
    struct: { foreground: p.type, fontStyle: "bold" },
    'struct.static': { foreground: p.type, fontStyle: "italic" },
    interface: { foreground: p.iface, fontStyle: "" },
    enum: { foreground: p.iface, fontStyle: "" },
    enumMember: { foreground: p.enumMember, fontStyle: "" },
    typeParameter: { foreground: p.generic, fontStyle: "" },
    type: { foreground: p.type, fontStyle: "" },
    method: { foreground: p.func, fontStyle: "" },
    'method.declaration': { foreground: p.func, fontStyle: "bold" },
    'method.definition': { foreground: p.func, fontStyle: "bold" },
    'method.static': { foreground: p.func, fontStyle: "italic" },
    'method.declaration.static': { foreground: p.func, fontStyle: "bold italic" },
    'method.static.declaration': { foreground: p.func, fontStyle: "bold italic" },
    function: { foreground: p.func, fontStyle: "" },
    'function.declaration': { foreground: p.func, fontStyle: "bold" },
    'function.definition': { foreground: p.func, fontStyle: "bold" },
    parameter: { foreground: p.variable, fontStyle: "italic" },
    'variable:typescript': { foreground: p.variable, fontStyle: "" },
    'variable:typescriptreact': { foreground: p.variable, fontStyle: "" },
    'variable:javascript': { foreground: p.variable, fontStyle: "" },
    'variable:javascriptreact': { foreground: p.variable, fontStyle: "" },
    'variable.static': { foreground: p.property, fontStyle: "italic" },
    property: { foreground: p.property, fontStyle: "" },
    'property.static': { foreground: p.property, fontStyle: "italic" },
    'property.readonly': { foreground: p.property, fontStyle: "" },
    'property.readonly.static': { foreground: p.property, fontStyle: "italic" },
    '*.readonly:csharp': { foreground: p.property },
    namespace: { foreground: p.fg, fontStyle: "" },
    operator: { foreground: p.operator, fontStyle: "" },
    keyword: { foreground: p.keyword, fontStyle: "bold italic" },
  };

  return {
    name: labelFor(family),
    type: 'dark',
    semanticHighlighting: true,
    colors,
    tokenColors,
    semanticTokenColors,
  };
}

/* -------------------------------------------------------------- *
 * Checks
 * -------------------------------------------------------------- */

/*
 * The roles that have to stay readable as text on the editor ground, and the
 * ground they are read against. Chrome colours are left out: a border is not
 * text, and holding it to a text contrast ratio would only force it brighter
 * than the theme wants it.
 */
const TOKENS = [
  'variable', 'property', 'operator', 'keyword',
  'string', 'func', 'type', 'iface', 'number', 'enumMember',
] as const;

/** Chrome text: the workbench, not the code. */
const UI_TEXT = ['fg', 'fgDim', 'fgBright', 'fgMuted'] as const;

/**
 * Every check the build makes, run over every variant before anything is
 * written. They are worth listing rather than trusting because each one has
 * already caught something: the baseline caught a guard rule that quietly
 * restyled the shipped theme, and the contrast floor caught what gamut
 * clipping does to a colour whose chroma does not exist at its new hue.
 */
function check(): string[] {
  const problems: string[] = [];
  const base = paletteFor('indigo');

  /* 1. Indigo still regenerates the theme as it shipped. */
  const baselinePath = path.join(HERE, 'indigo-baseline.json');
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as Theme;
  const built = themeFor('indigo', base);
  for (const [key, want] of Object.entries(baseline.colors)) {
    const got = built.colors[key];
    if (got !== want) problems.push(`baseline: colors["${key}"] was ${want}, is now ${got}`);
  }
  const drift = (a: unknown, b: unknown, what: string): void => {
    if (JSON.stringify(a) !== JSON.stringify(b)) problems.push(`baseline: ${what} changed`);
  };
  drift(baseline.tokenColors, built.tokenColors, 'tokenColors');
  drift(baseline.semanticTokenColors, built.semanticTokenColors, 'semanticTokenColors');
  const extra = Object.keys(built.colors).filter((k) => !(k in baseline.colors));
  if (extra.length) problems.push(`baseline: colors gained ${extra.join(', ')}`);

  /*
   * 2. Every variant is legible on its own terms.
   *
   * This test used to be "no variant differs from indigo's ratio by more than
   * 5%", which made sense while lightness and chroma were held across the whole
   * set and the only variation was rounding. It stopped making sense the moment
   * the variants started being rebuilt for their hue rather than rotated: they
   * are now *supposed* to differ, and a band around indigo's numbers measures
   * how little a palette moved, which is the opposite of what is wanted.
   *
   * So the floors are absolute, and they are the ones that mean something.
   * Every code token clears WCAG AAA at 7:1 — which the shipped theme already
   * did, its dimmest token being the operators at 7.55:1 — so no variant can
   * trade legibility for colour. Chrome text is held to its own indigo value
   * with real slack under it, because that ramp is deliberately graded and the
   * bottom of it, the comments at 3.76:1, sits below AA on purpose: a comment
   * is meant to recede, and holding it to 4.5 would brighten it past what the
   * theme is for.
   */
  const AAA = 7;
  const UI_SLACK = 0.9;
  const UI_FLOOR = 3.5;

  for (const family of FAMILY_ORDER) {
    const p = paletteFor(family);

    for (const role of TOKENS) {
      const got = contrast(p[role], p.bg);
      if (got < AAA) {
        problems.push(`${family}: ${role} reads at ${got.toFixed(2)}:1, under AAA (${AAA}:1)`);
      }
    }

    for (const role of UI_TEXT) {
      const want = contrast(base[role], base.bg);
      const got = contrast(p[role], p.bg);
      if (got < Math.max(UI_FLOOR, want * UI_SLACK)) {
        problems.push(
          `${family}: ${role} reads at ${got.toFixed(2)}:1 against the ground, ` +
            `indigo manages ${want.toFixed(2)}:1`
        );
      }
    }

    if (family === 'indigo') continue;

    // 3. White on the accent, which is the one pairing the palette cannot move.
    const onAccent = contrast(WHITE, p.accent);
    if (onAccent < 3) {
      problems.push(`${family}: white on the accent is only ${onAccent.toFixed(2)}:1`);
    }

    /*
     * 4. No two roles that have to be told apart sit on top of each other.
     *
     * This replaces the machinery that used to *arrange* the crowded variants —
     * a rotation delivered its hues wherever the turn happened to put them, so
     * something had to shuffle them afterwards, and in the green and orange
     * families that meant squeezing roles into whatever gap was left. The hues
     * are now written down per family, so the only thing worth asserting is
     * that nobody edits one into its neighbour. Indigo is exempt because it
     * predates the floor and sits under it on purpose: its enum members and
     * numbers are 19.5 degrees apart and are told apart by lightness instead.
     */
    const near = tightest(family);
    if (near.deg < SEPARATION) {
      problems.push(
        `${family}: ${near.a} and ${near.b} are only ${near.deg.toFixed(1)}° apart, ` +
          `under the ${SEPARATION}° floor`
      );
    }
  }

  /*
   * 5. package.json declares exactly what this build writes.
   *
   * A theme VS Code is not told about is a file on disk and nothing else, and
   * the failure is silent in both directions — a variant missing from the
   * manifest simply never appears in the picker, and one listed but never
   * written is an error only the user sees. tools/build-theme.ts already
   * refuses to emit an icon mapping that names a missing icon; this is the same
   * guarantee for the themes.
   */
  const manifest = JSON.parse(
    fs.readFileSync(path.join(HERE, '..', 'package.json'), 'utf8')
  ) as { contributes: { themes: { label: string; path: string }[] } };

  const declared = manifest.contributes.themes.map((t) => `${t.label} -> ${t.path}`);
  const expected = FAMILY_ORDER.map((f) => `${labelFor(f)} -> ./themes/${fileFor(f)}`);
  for (const want of expected) {
    if (!declared.includes(want)) problems.push(`package.json does not contribute "${want}"`);
  }
  for (const got of declared) {
    if (!expected.includes(got)) problems.push(`package.json contributes "${got}", which is not built`);
  }

  return problems;
}

/* -------------------------------------------------------------- *
 * Emit
 * -------------------------------------------------------------- */

const problems = check();
if (problems.length) {
  for (const p of problems) console.error(`  ! ${p}`);
  throw new Error(`${problems.length} problem(s) — nothing written`);
}

fs.mkdirSync(THEMES, { recursive: true });
for (const family of FAMILY_ORDER) {
  const palette = paletteFor(family);
  const file = fileFor(family);
  fs.writeFileSync(
    path.join(THEMES, file),
    JSON.stringify(themeFor(family, palette), null, 2) + '\n',
    'utf8'
  );
  // How much room the family's tightest pair has, so a design edit that walks
  // two roles toward each other is visible before it reaches the floor.
  const near = tightest(family);
  console.log(
    `  ${labelFor(family).padEnd(16)} -> themes/${file}` +
      `  (closest: ${near.a}/${near.b} ${near.deg.toFixed(0)}°)`
  );
}
console.log(`\nwrote ${FAMILY_ORDER.length} themes`);
