/*
 * The accessibility audit (M13), made of the themes as they were written:
 *
 *   node tools/theme/check-accessibility.ts           write docs/ACCESSIBILITY.md and its pt-BR twin
 *   node tools/theme/check-accessibility.ts --check   fail if a target is missed or either doc is stale
 *
 * The theme build already holds each surface to floors of its own, milestone
 * by milestone, against the tokens it is about to write. This reads the eight
 * JSON files back instead — what VS Code will actually load — and measures, in
 * one place, every pair the M13 checklist names: the code, the text ramp,
 * CodeLens, inlay hints, diagnostics, the terminal, chat, the Agents window,
 * buttons, selections, focus, line numbers, placeholders, disabled text and
 * the status bar. Each pair has a target, and the targets are the theme's own:
 *
 *   body       7:1  (WCAG AAA)  the code, which is read for hours
 *   text     4.5:1  (WCAG AA)   any other text, the type parameters included
 *   auxiliary  3:1              text meant to recede: comments, CodeLens,
 *                               hints, placeholders, line numbers
 *   component  3:1  (WCAG 1.4.11) a squiggle, a focus ring, an icon
 *   exempt                      disabled controls and rendered whitespace,
 *                               which WCAG leaves out; measured, not held
 *
 * It also checks what does not depend on colour at all — keywords set in bold
 * italic, deprecated names struck through, a solid focus ring — and whether
 * the signals that DO depend on colour survive the three common deficiencies of
 * colour vision, simulated. The environments that cannot be simulated honestly
 * (a real OLED panel, a real dim monitor) are modelled and reported, not held.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contrastRatio,
  deltaE,
  hexToRgb,
  oklchFromHex,
  over,
  relativeLuminance,
  simulateColourVision,
  type Colour,
  type ColourVision,
} from '../shared/color.ts';
import { FAMILY_ORDER, type Family } from './theme-palette.ts';
import { tokensFor, type Tokens } from './theme-tokens.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const ROOT: string = path.join(HERE, '..', '..');

type Language = 'en' | 'pt';
type Words = Record<Language, string>;

const DOCS: Record<Language, string> = {
  en: path.join(ROOT, 'docs', 'ACCESSIBILITY.md'),
  pt: path.join(ROOT, 'docs', 'ACCESSIBILITY.pt-BR.md'),
};

type Rule = { name?: string; scope?: string | string[]; settings: { foreground?: string; fontStyle?: string } };
type SemanticRule = string | { foreground?: string; fontStyle?: string; strikethrough?: boolean };
type Theme = { colors: Record<string, string>; tokenColors: Rule[]; semanticTokenColors: Record<string, SemanticRule> };

const themeOf = (family: Family): Theme =>
  JSON.parse(fs.readFileSync(path.join(ROOT, 'themes', `midnight-${family}-color-theme.json`), 'utf8'));

const titleOf = (family: Family): string => family[0].toUpperCase() + family.slice(1);

/* -------------------------------------------------------------- *
 * Targets
 * -------------------------------------------------------------- */

type Target = 'body' | 'text' | 'auxiliary' | 'component' | 'exempt';

const TARGET_RATIO: Record<Target, number> = { body: 7, text: 4.5, auxiliary: 3, component: 3, exempt: 0 };

const TARGET_NAME: Record<Target, Words> = {
  body: { en: 'body 7:1', pt: 'corpo 7:1' },
  text: { en: 'text 4.5:1', pt: 'texto 4.5:1' },
  auxiliary: { en: 'auxiliary 3:1', pt: 'auxiliar 3:1' },
  component: { en: 'component 3:1', pt: 'componente 3:1' },
  exempt: { en: 'exempt', pt: 'isento' },
};

/* -------------------------------------------------------------- *
 * The pairs
 * -------------------------------------------------------------- */

/*
 * An ink is a colour ID, or a function that finds one in the theme — the code
 * rows, which are every foreground the syntax rules use rather than one key.
 * A ground is a stack of colour IDs painted over the editor, bottom first,
 * because half of VS Code's grounds are overlays with no contrast of their own.
 */
type Measured = { colour: Colour; name: string };
type Ink = string | ((theme: Theme, tokens: Tokens) => Measured);

/** `namesInk`: the row picks its ink per variant, and the table says which one it picked. */
type Pair = { area: Words; what: Words; ink: Ink; ground: string[]; target: Target; namesInk?: true };

const CODE: Words = { en: 'Code', pt: 'Código' };
const SELECTION_GROUND: string[] = ['editor.selectionBackground'];

/*
 * The rules that colour a log line by its level (M14) paint with the diagnostic
 * signals — the error red, the warning yellow — which the theme holds to AA as
 * the labels they are, not to the 7:1 of code. They are measured on their own row.
 */
const isLogLevelRule = (rule: Rule): boolean => [rule.scope ?? []].flat().every((scope: string): boolean => /^log.(error|warning|info|debug)$/.test(scope));

/** Every foreground the syntax rules paint with, TextMate and semantic — the log levels aside. */
const codeInks = (theme: Theme): Colour[] => {
  const inks: Colour[] = [
    ...theme.tokenColors.filter((rule: Rule): boolean => !isLogLevelRule(rule)).map((rule: Rule): string | undefined => rule.settings.foreground),
    ...Object.values(theme.semanticTokenColors).map((rule: SemanticRule): string | undefined =>
      typeof rule === 'string' ? rule : rule.foreground
    ),
  ].filter((colour: string | undefined): colour is string => colour !== undefined);
  return [...new Set(inks)];
};

const commentInk = (theme: Theme): Colour =>
  theme.tokenColors.find((rule: Rule): boolean => [rule.scope ?? []].flat().includes('comment'))!.settings.foreground!;

const genericInk = (theme: Theme): Colour => {
  const rule: SemanticRule = theme.semanticTokenColors.typeParameter;
  return typeof rule === 'string' ? rule : rule.foreground!;
};

/** The role a code ink plays, read from the tokens, for naming the worst one. */
const roleOf = (colour: Colour, tokens: Tokens): string => {
  const roles: [string, Colour][] = [...Object.entries(tokens.syntax), ...Object.entries(tokens.text)];
  return roles.find(([, value]: [string, Colour]): boolean => value === colour)?.[0] ?? colour;
};

/** The log level that reads worst on the editor. */
const worstLogLevel = (theme: Theme): Measured => {
  const under: Colour = groundOf(theme, []);
  const [worst] = theme.tokenColors
    .filter(isLogLevelRule)
    .sort((first: Rule, second: Rule): number => contrastRatio(first.settings.foreground!, under) - contrastRatio(second.settings.foreground!, under));
  return { colour: worst.settings.foreground!, name: [worst.scope ?? []].flat()[0] };
};

/** The body ink that reads worst on a ground: every ink but the comments and the type parameters. */
const worstBodyInk =
  (ground: string[]) =>
  (theme: Theme, tokens: Tokens): Measured => {
    const under: Colour = groundOf(theme, ground);
    const excluded: Set<Colour> = new Set([commentInk(theme), genericInk(theme)]);
    const [worst] = codeInks(theme)
      .filter((ink: Colour): boolean => !excluded.has(ink))
      .sort((first: Colour, second: Colour): number => contrastRatio(first, under) - contrastRatio(second, under));
    return { colour: worst, name: roleOf(worst, tokens) };
  };

const PAIRS: Pair[] = [
  { area: CODE, what: { en: 'Every ink but comments and type parameters (the worst)', pt: 'Toda tinta exceto comentários e parâmetros de tipo (a pior)' }, ink: worstBodyInk([]), ground: [], target: 'body', namesInk: true },
  { area: CODE, what: { en: 'The same, under a selection', pt: 'O mesmo, sob uma seleção' }, ink: worstBodyInk(SELECTION_GROUND), ground: SELECTION_GROUND, target: 'text', namesInk: true },
  { area: CODE, what: { en: 'Type parameters (generics)', pt: 'Parâmetros de tipo (generics)' }, ink: (theme: Theme): Measured => ({ colour: genericInk(theme), name: 'generic' }), ground: [], target: 'text' },
  { area: CODE, what: { en: 'Type parameters, under a selection', pt: 'Parâmetros de tipo, sob uma seleção' }, ink: (theme: Theme): Measured => ({ colour: genericInk(theme), name: 'generic' }), ground: SELECTION_GROUND, target: 'auxiliary' },
  { area: CODE, what: { en: 'Log levels in the Output view and .log files (the worst)', pt: 'Níveis de log no Output e em arquivos .log (o pior)' }, ink: worstLogLevel, ground: [], target: 'text', namesInk: true },
  { area: CODE, what: { en: 'Comments', pt: 'Comentários' }, ink: (theme: Theme): Measured => ({ colour: commentInk(theme), name: 'comment' }), ground: [], target: 'auxiliary' },
  { area: CODE, what: { en: 'Comments, under a selection', pt: 'Comentários, sob uma seleção' }, ink: (theme: Theme): Measured => ({ colour: commentInk(theme), name: 'comment' }), ground: SELECTION_GROUND, target: 'auxiliary' },

  ...(['editor.foreground', 'foreground'] as const).map((ink: string): Pair => ({
    area: { en: 'Main foreground', pt: 'Foreground principal' }, what: { en: `\`${ink}\` on the editor`, pt: `\`${ink}\` no editor` }, ink, ground: [], target: 'body',
  })),
  { area: { en: 'Main foreground', pt: 'Foreground principal' }, what: { en: '`foreground` on the side bar', pt: '`foreground` na side bar' }, ink: 'foreground', ground: ['sideBar.background'], target: 'text' },
  { area: { en: 'Secondary foreground', pt: 'Foreground secundário' }, what: { en: '`sideBar.foreground`', pt: '`sideBar.foreground`' }, ink: 'sideBar.foreground', ground: ['sideBar.background'], target: 'text' },
  { area: { en: 'Secondary foreground', pt: 'Foreground secundário' }, what: { en: '`descriptionForeground` on a widget', pt: '`descriptionForeground` num widget' }, ink: 'descriptionForeground', ground: ['editorWidget.background'], target: 'text' },

  { area: { en: 'CodeLens', pt: 'CodeLens' }, what: { en: 'On the editor', pt: 'No editor' }, ink: 'editorCodeLens.foreground', ground: [], target: 'auxiliary' },
  { area: { en: 'Inlay hints', pt: 'Inlay hints' }, what: { en: 'On its chip', pt: 'No seu chip' }, ink: 'editorInlayHint.foreground', ground: ['editorInlayHint.background'], target: 'auxiliary' },
  { area: { en: 'Inlay hints', pt: 'Inlay hints' }, what: { en: 'On its chip, on the current line', pt: 'No seu chip, na linha atual' }, ink: 'editorInlayHint.foreground', ground: ['editor.lineHighlightBackground', 'editorInlayHint.background'], target: 'auxiliary' },

  ...(['editorError.foreground', 'editorWarning.foreground', 'editorInfo.foreground', 'editorHint.foreground'] as const).map((ink: string): Pair => ({
    area: { en: 'Diagnostics', pt: 'Diagnósticos' }, what: { en: `\`${ink}\` (squiggle)`, pt: `\`${ink}\` (squiggle)` }, ink, ground: [], target: 'component',
  })),
  ...(['list.errorForeground', 'list.warningForeground'] as const).map((ink: string): Pair => ({
    area: { en: 'Diagnostics', pt: 'Diagnósticos' }, what: { en: `\`${ink}\` (a file name)`, pt: `\`${ink}\` (nome de arquivo)` }, ink, ground: ['sideBar.background'], target: 'text',
  })),

  { area: { en: 'Terminal', pt: 'Terminal' }, what: { en: '`terminal.foreground`', pt: '`terminal.foreground`' }, ink: 'terminal.foreground', ground: ['terminal.background'], target: 'body' },
  ...(['Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White', 'BrightRed', 'BrightGreen', 'BrightYellow', 'BrightBlue', 'BrightMagenta', 'BrightCyan', 'BrightWhite'] as const).map(
    (name: string): Pair => ({ area: { en: 'Terminal', pt: 'Terminal' }, what: { en: `ANSI ${name}`, pt: `ANSI ${name}` }, ink: `terminal.ansi${name}`, ground: ['terminal.background'], target: 'text' })
  ),
  { area: { en: 'Terminal', pt: 'Terminal' }, what: { en: 'ANSI BrightBlack (dimmed output)', pt: 'ANSI BrightBlack (saída esmaecida)' }, ink: 'terminal.ansiBrightBlack', ground: ['terminal.background'], target: 'auxiliary' },
  { area: { en: 'Terminal', pt: 'Terminal' }, what: { en: 'Text under a selection', pt: 'Texto sob uma seleção' }, ink: 'terminal.foreground', ground: ['terminal.background', 'terminal.selectionBackground'], target: 'text' },

  { area: { en: 'Chat', pt: 'Chat' }, what: { en: 'A request, in its bubble', pt: 'Um pedido, no seu balão' }, ink: 'foreground', ground: ['panel.background', 'chat.requestBubbleBackground'], target: 'text' },
  { area: { en: 'Chat', pt: 'Chat' }, what: { en: 'A slash command, in a request', pt: 'Um slash command, num pedido' }, ink: 'chat.slashCommandForeground', ground: ['panel.background', 'chat.requestBubbleBackground', 'chat.slashCommandBackground'], target: 'text' },
  { area: { en: 'Chat', pt: 'Chat' }, what: { en: 'Inline chat', pt: 'Chat inline' }, ink: 'inlineChat.foreground', ground: ['inlineChat.background'], target: 'text' },
  { area: { en: 'Chat', pt: 'Chat' }, what: { en: 'Inline chat placeholder', pt: 'Placeholder do chat inline' }, ink: 'inlineChatInput.placeholderForeground', ground: ['inlineChatInput.background'], target: 'auxiliary' },

  { area: { en: 'Agents', pt: 'Agents' }, what: { en: 'The Agents panel', pt: 'O painel Agents' }, ink: 'agentsPanel.foreground', ground: ['agentsPanel.background'], target: 'text' },
  { area: { en: 'Agents', pt: 'Agents' }, what: { en: 'The active session', pt: 'A sessão ativa' }, ink: 'activeSessionView.foreground', ground: ['agents.background', 'activeSessionView.background'], target: 'text' },
  { area: { en: 'Agents', pt: 'Agents' }, what: { en: 'An inactive session', pt: 'Uma sessão inativa' }, ink: 'inactiveSessionView.foreground', ground: ['agents.background', 'inactiveSessionView.background'], target: 'text' },
  { area: { en: 'Agents', pt: 'Agents' }, what: { en: 'The chat input', pt: 'O input do chat' }, ink: 'agentsChatInput.foreground', ground: ['agentsPanel.background', 'agentsChatInput.background'], target: 'text' },
  { area: { en: 'Agents', pt: 'Agents' }, what: { en: 'The chat input placeholder', pt: 'O placeholder do input' }, ink: 'agentsChatInput.placeholderForeground', ground: ['agentsPanel.background', 'agentsChatInput.background'], target: 'auxiliary' },

  { area: { en: 'Buttons', pt: 'Botões' }, what: { en: 'Primary', pt: 'Primário' }, ink: 'button.foreground', ground: ['editorWidget.background', 'button.background'], target: 'text' },
  { area: { en: 'Buttons', pt: 'Botões' }, what: { en: 'Primary, under the pointer', pt: 'Primário, sob o ponteiro' }, ink: 'button.foreground', ground: ['editorWidget.background', 'button.hoverBackground'], target: 'text' },
  { area: { en: 'Buttons', pt: 'Botões' }, what: { en: 'Secondary', pt: 'Secundário' }, ink: 'button.secondaryForeground', ground: ['editorWidget.background', 'button.secondaryBackground'], target: 'text' },
  { area: { en: 'Buttons', pt: 'Botões' }, what: { en: 'A checkbox', pt: 'Um checkbox' }, ink: 'checkbox.foreground', ground: ['sideBar.background', 'checkbox.background'], target: 'text' },

  { area: { en: 'Selections', pt: 'Seleções' }, what: { en: 'Text on the editor selection', pt: 'Texto na seleção do editor' }, ink: 'editor.foreground', ground: SELECTION_GROUND, target: 'text' },
  { area: { en: 'Selections', pt: 'Seleções' }, what: { en: 'The selected row of a list', pt: 'A linha selecionada de uma lista' }, ink: 'list.activeSelectionForeground', ground: ['sideBar.background', 'list.activeSelectionBackground'], target: 'text' },
  { area: { en: 'Selections', pt: 'Seleções' }, what: { en: 'The selected item of a menu', pt: 'O item selecionado de um menu' }, ink: 'menu.selectionForeground', ground: ['menu.background', 'menu.selectionBackground'], target: 'text' },

  ...(
    [
      ['editor.background', { en: 'the editor', pt: 'o editor' }],
      ['sideBar.background', { en: 'the side bar', pt: 'a side bar' }],
      ['activityBar.background', { en: 'the activity bar', pt: 'a activity bar' }],
      ['statusBar.background', { en: 'the status bar', pt: 'a status bar' }],
      ['editorWidget.background', { en: 'a widget', pt: 'um widget' }],
      ['input.background', { en: 'an input', pt: 'um input' }],
    ] as [string, Words][]
  ).map(
    ([ground, where]: [string, Words]): Pair => ({
      area: { en: 'Focus', pt: 'Foco' }, what: { en: `The ring, on ${where.en}`, pt: `O anel, sobre ${where.pt}` }, ink: 'focusBorder', ground: [ground], target: 'component',
    })
  ),
  { area: { en: 'Focus', pt: 'Foco' }, what: { en: 'The focused row of a list', pt: 'A linha focada de uma lista' }, ink: 'list.focusOutline', ground: ['sideBar.background'], target: 'component' },

  { area: { en: 'Line numbers', pt: 'Números de linha' }, what: { en: 'A line number', pt: 'Um número de linha' }, ink: 'editorLineNumber.foreground', ground: [], target: 'auxiliary' },
  { area: { en: 'Line numbers', pt: 'Números de linha' }, what: { en: "The cursor's line number", pt: 'O número da linha do cursor' }, ink: 'editorLineNumber.activeForeground', ground: [], target: 'text' },
  { area: { en: 'Icons', pt: 'Ícones' }, what: { en: 'An inactive activity-bar icon', pt: 'Um ícone inativo da activity bar' }, ink: 'activityBar.inactiveForeground', ground: ['activityBar.background'], target: 'component' },

  { area: { en: 'Placeholders', pt: 'Placeholders' }, what: { en: 'In an input', pt: 'Num input' }, ink: 'input.placeholderForeground', ground: ['input.background'], target: 'auxiliary' },
  { area: { en: 'Placeholders', pt: 'Placeholders' }, what: { en: 'In an empty editor', pt: 'Num editor vazio' }, ink: 'editor.placeholder.foreground', ground: [], target: 'auxiliary' },
  { area: { en: 'Placeholders', pt: 'Placeholders' }, what: { en: 'Ghost text (a suggestion)', pt: 'Ghost text (uma sugestão)' }, ink: 'editorGhostText.foreground', ground: [], target: 'auxiliary' },

  { area: { en: 'Disabled', pt: 'Desabilitado' }, what: { en: '`disabledForeground`', pt: '`disabledForeground`' }, ink: 'disabledForeground', ground: ['sideBar.background'], target: 'exempt' },
  { area: { en: 'Disabled', pt: 'Desabilitado' }, what: { en: 'Rendered whitespace', pt: 'Espaços renderizados' }, ink: 'editorWhitespace.foreground', ground: [], target: 'exempt' },

  { area: { en: 'Status bar', pt: 'Status bar' }, what: { en: 'An item', pt: 'Um item' }, ink: 'statusBar.foreground', ground: ['statusBar.background'], target: 'text' },
  { area: { en: 'Status bar', pt: 'Status bar' }, what: { en: 'While debugging', pt: 'Durante o debug' }, ink: 'statusBar.debuggingForeground', ground: ['statusBar.debuggingBackground'], target: 'text' },
  { area: { en: 'Status bar', pt: 'Status bar' }, what: { en: 'An error item', pt: 'Um item de erro' }, ink: 'statusBarItem.errorForeground', ground: ['statusBar.background', 'statusBarItem.errorBackground'], target: 'text' },
  { area: { en: 'Status bar', pt: 'Status bar' }, what: { en: 'A warning item', pt: 'Um item de aviso' }, ink: 'statusBarItem.warningForeground', ground: ['statusBar.background', 'statusBarItem.warningBackground'], target: 'text' },
];

/** A stack of grounds as the colour it paints, over the editor. */
const groundOf = (theme: Theme, ground: string[]): Colour =>
  ground.reduce((under: Colour, id: string): Colour => {
    const colour: string | undefined = theme.colors[id];
    if (!colour) throw new Error(`the theme does not set ${id}`);
    return over(colour, under);
  }, theme.colors['editor.background']);

const measure = (theme: Theme, tokens: Tokens, pair: Pair): Measured & { ratio: number } => {
  const under: Colour = groundOf(theme, pair.ground);
  const found: Measured =
    typeof pair.ink === 'string' ? { colour: theme.colors[pair.ink], name: pair.ink } : pair.ink(theme, tokens);
  if (!found.colour) throw new Error(`the theme does not set ${found.name}`);
  return { ...found, ratio: contrastRatio(over(found.colour, under), under) };
};

/* -------------------------------------------------------------- *
 * Distinction without colour
 * -------------------------------------------------------------- */

const VISIONS: ColourVision[] = ['protanopia', 'deuteranopia', 'tritanopia'];

/*
 * The pairs whose difference is a hue, and so the pairs a deficiency can take
 * away. `cue` is what else tells them apart: nothing, for the squiggles — an
 * error and a warning are the same wavy line — so those are held to 10 ΔE in
 * every simulation, far past the 3 at which two colours side by side stop
 * looking the same. The rest carry a shape or a letter VS Code draws with
 * them, and are only held to 3: the colour is the second channel there.
 */
type Signal = { first: string; second: string; cue: Words | null };

const SIGNALS: Signal[] = [
  { first: 'editorError.foreground', second: 'editorWarning.foreground', cue: null },
  { first: 'editorError.foreground', second: 'editorInfo.foreground', cue: null },
  { first: 'editorWarning.foreground', second: 'editorInfo.foreground', cue: null },
  { first: 'editorError.foreground', second: 'editorHint.foreground', cue: { en: 'hints are dots, not a squiggle', pt: 'hints são pontos, não squiggle' } },
  { first: 'gitDecoration.addedResourceForeground', second: 'gitDecoration.deletedResourceForeground', cue: { en: 'the letters A and D; a deletion is struck through', pt: 'as letras A e D; a remoção é riscada' } },
  { first: 'gitDecoration.addedResourceForeground', second: 'gitDecoration.modifiedResourceForeground', cue: { en: 'the letters A/U and M', pt: 'as letras A/U e M' } },
  { first: 'gitDecoration.modifiedResourceForeground', second: 'gitDecoration.deletedResourceForeground', cue: { en: 'the letters M and D', pt: 'as letras M e D' } },
  { first: 'gitDecoration.conflictingResourceForeground', second: 'gitDecoration.addedResourceForeground', cue: { en: 'the letter C / !', pt: 'a letra C / !' } },
  { first: 'editorGutter.addedBackground', second: 'editorGutter.modifiedBackground', cue: { en: 'a modified bar is hatched', pt: 'a barra de modificação é hachurada' } },
  { first: 'editorGutter.addedBackground', second: 'editorGutter.deletedBackground', cue: { en: 'a deletion is a triangle', pt: 'a remoção é um triângulo' } },
  { first: 'testing.iconPassed', second: 'testing.iconFailed', cue: { en: 'a tick and a cross', pt: 'um tique e um xis' } },
];

const SIGNAL_FLOOR = { bare: 10, cued: 3 } as const;

const signalDistance = (theme: Theme, signal: Signal, vision: ColourVision | null): number => {
  const ground: Colour = theme.colors['editor.background'];
  const seen = (id: string): Colour => {
    const colour: Colour = over(theme.colors[id], ground);
    return vision ? simulateColourVision(colour, vision) : colour;
  };
  return deltaE(seen(signal.first), seen(signal.second));
};

/** The structural cues the theme itself sets, as facts that hold or do not. */
type Fact = { what: Words; holds: (theme: Theme) => boolean };

const semanticStyle = (theme: Theme, selector: string): SemanticRule | undefined => theme.semanticTokenColors[selector];

const FACTS: Fact[] = [
  {
    what: { en: 'Keywords are bold italic, so the most frequent role is told apart by its letterforms too.', pt: 'Keywords são bold italic, então o papel mais frequente também se distingue pela forma das letras.' },
    holds: (theme: Theme): boolean => {
      const keyword: SemanticRule | undefined = semanticStyle(theme, 'keyword');
      return typeof keyword === 'object' && keyword.fontStyle === 'bold italic';
    },
  },
  {
    what: { en: 'A deprecated name is struck through: `*.deprecated` from a language server, `invalid.deprecated` from a grammar. VS Code strikes through a name a diagnostic marks deprecated (TypeScript, C#) by itself.', pt: 'Um nome obsoleto é riscado: `*.deprecated` vindo do servidor de linguagem, `invalid.deprecated` da gramática. O VS Code risca sozinho o nome que um diagnóstico marca como obsoleto (TypeScript, C#).' },
    holds: (theme: Theme): boolean => {
      const semantic: SemanticRule | undefined = semanticStyle(theme, '*.deprecated');
      const textMate: Rule | undefined = theme.tokenColors.find((rule: Rule): boolean => [rule.scope ?? []].flat().includes('invalid.deprecated'));
      return typeof semantic === 'object' && semantic.strikethrough === true && (textMate?.settings.fontStyle ?? '').includes('strikethrough');
    },
  },
  {
    what: { en: 'Focus is a solid ring (`focusBorder`, `list.focusOutline`), never a translucent tint that could vanish into what it sits on.', pt: 'O foco é um anel sólido (`focusBorder`, `list.focusOutline`), nunca um tom translúcido que possa sumir no que está por baixo.' },
    holds: (theme: Theme): boolean => ['focusBorder', 'list.focusOutline'].every((id: string): boolean => /^#[0-9A-F]{6}$/i.test(theme.colors[id] ?? '')),
  },
  {
    what: { en: 'A selection changes the surface: the editor, list and terminal selections are each at least 3 ΔE from the ground under them.', pt: 'Uma seleção muda a superfície: as seleções do editor, das listas e do terminal ficam a pelo menos 3 ΔE do fundo.' },
    holds: (theme: Theme): boolean =>
      (
        [
          ['editor.selectionBackground', 'editor.background'],
          ['list.activeSelectionBackground', 'sideBar.background'],
          ['terminal.selectionBackground', 'terminal.background'],
        ] as [string, string][]
      ).every(([selection, ground]: [string, string]): boolean => deltaE(over(theme.colors[selection], theme.colors[ground]), theme.colors[ground]) >= 3),
  },
  {
    what: { en: 'Error, warning and info differ in lightness as well as hue (at least 0.05 in OKLCH L), so they separate on a greyscale screen.', pt: 'Erro, aviso e info diferem em luminosidade além do matiz (pelo menos 0,05 no L do OKLCH), então se separam numa tela em tons de cinza.' },
    holds: (theme: Theme): boolean => {
      const lightness: number[] = ['editorError.foreground', 'editorWarning.foreground', 'editorInfo.foreground'].map((id: string): number => oklchFromHex(theme.colors[id]).l);
      return lightness.every((first: number, index: number): boolean => lightness.slice(index + 1).every((second: number): boolean => Math.abs(first - second) >= 0.05));
    },
  },
];

/* -------------------------------------------------------------- *
 * Environments
 * -------------------------------------------------------------- */

/*
 * WCAG's ratio adds 0.05 to both luminances for the light a screen reflects.
 * Halving the screen's own light — a dimmed laptop, a monitor at 50% — is the
 * same as doubling that flare, and pulls every ratio toward 1. This is a model,
 * not a measurement: it says which pairs have the least room, not how any one
 * panel renders them.
 */
const dimmedRatio = (first: Colour, second: Colour, brightness: number): number => {
  const [high, low] = [relativeLuminance(first), relativeLuminance(second)].sort((a: number, b: number): number => b - a);
  return (high * brightness + 0.05) / (low * brightness + 0.05);
};

/*
 * The grounds that have to be SEEN against the editor — not the side bar,
 * which is a hair from it by design and set off by a border — and which an
 * OLED panel at low brightness is likeliest to crush into it.
 */
const SEEN_GROUNDS: string[] = ['editor.lineHighlightBackground', 'editorWidget.background', 'editor.selectionBackground'];

/* -------------------------------------------------------------- *
 * Run
 * -------------------------------------------------------------- */

type Row = { pair: Pair; values: Record<Family, Measured & { ratio: number }> };

const problems: string[] = [];
const themes: Record<Family, Theme> = Object.fromEntries(FAMILY_ORDER.map((family: Family) => [family, themeOf(family)])) as Record<Family, Theme>;
const tokens: Record<Family, Tokens> = Object.fromEntries(FAMILY_ORDER.map((family: Family) => [family, tokensFor(family)])) as Record<Family, Tokens>;

const rows: Row[] = PAIRS.map((pair: Pair): Row => {
  const values = {} as Row['values'];
  for (const family of FAMILY_ORDER) {
    values[family] = measure(themes[family], tokens[family], pair);
    const { ratio, name } = values[family];
    if (ratio < TARGET_RATIO[pair.target]) {
      problems.push(`${family}: ${pair.area.en} — ${pair.what.en} (${name}) reads at ${ratio.toFixed(2)}:1, under ${TARGET_NAME[pair.target].en}`);
    }
  }
  return { pair, values };
});

for (const family of FAMILY_ORDER) {
  for (const signal of SIGNALS) {
    const floor: number = signal.cue ? SIGNAL_FLOOR.cued : SIGNAL_FLOOR.bare;
    for (const vision of [null, ...VISIONS]) {
      const distance: number = signalDistance(themes[family], signal, vision);
      if (distance < floor) problems.push(`${family}: ${signal.first} and ${signal.second} are ${distance.toFixed(1)} ΔE apart ${vision ? `with ${vision}` : ''}, under ${floor}`);
    }
  }
  for (const fact of FACTS) if (!fact.holds(themes[family])) problems.push(`${family}: no longer true — ${fact.what.en}`);
}

/* -------------------------------------------------------------- *
 * The documents
 * -------------------------------------------------------------- */

const ratioText = (ratio: number): string => ratio.toFixed(1);

const TEXT = {
  title: { en: 'Accessibility', pt: 'Acessibilidade' },
  generated: {
    en: '> Generated by `npm run audit:accessibility` from the eight theme files, and held by `npm run check`. Do not edit it by hand. [Versão em português](ACCESSIBILITY.pt-BR.md).',
    pt: '> Gerado por `npm run audit:accessibility` a partir dos oito arquivos de tema, e mantido por `npm run check`. Não edite à mão. [English version](ACCESSIBILITY.md).',
  },
  intro: {
    en: 'Midnight Indigo is an ultra-dark theme meant for long sessions. This page measures every pair the theme is responsible for, in all eight variants, against targets that are the theme\'s own and are enforced: a variant that misses one does not pass the check.',
    pt: 'O Midnight Indigo é um tema ultra-escuro feito para sessões longas. Esta página mede cada par pelo qual o tema responde, nas oito variantes, contra metas que são do próprio tema e são impostas: uma variante que perde uma não passa no check.',
  },
  targets: { en: 'Targets', pt: 'Metas' },
  targetRows: {
    en: [
      ['body 7:1', 'The code, and the text it is written among: WCAG AAA. Read for hours, so held to the highest bar.'],
      ['text 4.5:1', 'Any other text — menus, buttons, the terminal, chat — and the type parameters: WCAG AA.'],
      ['auxiliary 3:1', 'Text designed to recede: comments, CodeLens, inlay hints, placeholders, line numbers. Still readable; never competing with the code.'],
      ['component 3:1', 'What is seen rather than read: a squiggle, a focus ring, an icon. WCAG 1.4.11.'],
      ['exempt', 'Disabled controls and rendered whitespace, which WCAG leaves out on purpose. Measured here, not held.'],
    ],
    pt: [
      ['corpo 7:1', 'O código, e o texto no meio dele: WCAG AAA. Lido por horas, então a meta mais alta.'],
      ['texto 4.5:1', 'Qualquer outro texto — menus, botões, terminal, chat — e os parâmetros de tipo: WCAG AA.'],
      ['auxiliar 3:1', 'Texto feito para recuar: comentários, CodeLens, inlay hints, placeholders, números de linha. Legível, sem competir com o código.'],
      ['componente 3:1', 'O que é visto e não lido: um squiggle, um anel de foco, um ícone. WCAG 1.4.11.'],
      ['isento', 'Controles desabilitados e espaços renderizados, que a WCAG deixa de fora de propósito. Medidos aqui, não impostos.'],
    ],
  },
  contrast: { en: 'Contrast', pt: 'Contraste' },
  contrastIntro: {
    en: 'Each ratio is measured as VS Code paints it: an overlay is composited over what it sits on first, since a translucent colour has no contrast of its own. Where a code row names the worst ink, it is the one with the least room in that variant.',
    pt: 'Cada razão é medida como o VS Code pinta: um overlay é composto sobre o que está por baixo antes, já que uma cor translúcida não tem contraste próprio. Onde uma linha de código aponta a pior tinta, é a que tem menos folga naquela variante.',
  },
  area: { en: 'Area', pt: 'Área' },
  what: { en: 'Pair', pt: 'Par' },
  target: { en: 'Target', pt: 'Meta' },
  worst: { en: 'Worst ink', pt: 'Pior tinta' },
  withoutColour: { en: 'Without colour', pt: 'Sem cor' },
  withoutColourIntro: {
    en: 'Nothing critical depends on seeing a hue. These hold in every variant, and the check fails if one stops holding:',
    pt: 'Nada crítico depende de enxergar um matiz. Isto vale em todas as variantes, e o check falha se deixar de valer:',
  },
  vision: { en: 'Colour vision', pt: 'Visão de cor' },
  visionIntro: {
    en: `The signals that do differ by hue, simulated for the three common deficiencies (Machado et al., 2009, full severity) and measured in OKLab ΔE × 100 — about 2 is the smallest difference anyone notices side by side. A pair with no other cue is held to ${SIGNAL_FLOOR.bare}; a pair VS Code also tells apart by a shape or a letter is held to ${SIGNAL_FLOOR.cued}. Each cell is the worst of the eight variants.`,
    pt: `Os sinais que diferem pelo matiz, simulados para as três deficiências mais comuns (Machado et al., 2009, severidade total) e medidos em ΔE OKLab × 100 — cerca de 2 é a menor diferença que alguém nota lado a lado. Um par sem outra pista é mantido em ${SIGNAL_FLOOR.bare}; um par que o VS Code também distingue por forma ou letra, em ${SIGNAL_FLOOR.cued}. Cada célula é a pior das oito variantes.`,
  },
  signal: { en: 'Signals', pt: 'Sinais' },
  cue: { en: 'Other cue', pt: 'Outra pista' },
  none: { en: 'none — colour only', pt: 'nenhuma — só cor' },
  normal: { en: 'Normal', pt: 'Normal' },
  environments: { en: 'Environments', pt: 'Ambientes' },
  dimIntro: {
    en: 'A screen at half brightness, modelled as doubling the flare WCAG assumes (see the source for why this is a model and not a measurement). The pairs with the least room:',
    pt: 'Uma tela com metade do brilho, modelada como o dobro do reflexo que a WCAG assume (o código explica por que é um modelo e não uma medição). Os pares com menos folga:',
  },
  full: { en: 'Full', pt: 'Cheio' },
  half: { en: 'Half', pt: 'Metade' },
  oled: {
    en: 'On OLED, the editor ground is never `#000000`, but its brightest channel is a few steps above zero, so most of it is close to switched off: fast scrolling can smear there, as it can with any ultra-dark theme. That is the identity, not a defect this audit tries to fix. What a dim panel can also crush is a near-black ground that has to be seen against the editor; each is shown here as its distance from the editor in ΔE:',
    pt: 'Em OLED, o fundo do editor nunca é `#000000`, mas o seu canal mais claro fica poucos passos acima de zero, então quase tudo fica perto de apagado: a rolagem rápida pode borrar ali, como em qualquer tema ultra-escuro. Isso é a identidade, não um defeito que esta auditoria tenta corrigir. O que um painel com pouco brilho também pode esmagar é um fundo quase preto que precisa ser visto contra o editor; cada um aparece aqui pela sua distância do editor em ΔE:',
  },
  ground: { en: 'Ground', pt: 'Fundo' },
  channel: { en: 'Brightest channel', pt: 'Canal mais claro' },
  review: {
    en: 'Zoom, UI scale, editor zoom and other monospace fonts cannot change a colour, so they are reviewed rather than measured: the theme was looked at in VS Code with the window zoomed, the editor font enlarged, and in Consolas, Cascadia Mono, Courier New and Lucida Console, to confirm that bold italic keywords, strikethrough and the thin marks (squiggles, focus rings, bracket guides) survive each.',
    pt: 'Zoom, escala da UI, zoom do editor e outras fontes monoespaçadas não mudam uma cor, então são revisados, não medidos: o tema foi visto no VS Code com a janela ampliada, a fonte do editor aumentada, e em Consolas, Cascadia Mono, Courier New e Lucida Console, para confirmar que keywords bold italic, o riscado e as marcas finas (squiggles, anéis de foco, guias de colchetes) sobrevivem a cada uma.',
  },
} as const;

const table = (header: string[], body: string[][], align: string[]): string =>
  [`| ${header.join(' | ')} |`, `| ${align.join(' | ')} |`, ...body.map((cells: string[]): string => `| ${cells.join(' | ')} |`)].join('\n');

const render = (language: Language): string => {
  const say = (words: Words): string => words[language];
  const families: string[] = FAMILY_ORDER.map(titleOf);

  const contrastRows: string[][] = rows.map(({ pair, values }: Row): string[] => {
    const inkNames: string = [...new Set(FAMILY_ORDER.map((family: Family): string => values[family].name))]
      .map((name: string): string => `\`${name}\``)
      .join(', ');
    return [
      say(pair.area),
      pair.namesInk ? `${say(pair.what)}: ${inkNames}` : say(pair.what),
      say(TARGET_NAME[pair.target]),
      ...FAMILY_ORDER.map((family: Family): string => ratioText(values[family].ratio)),
    ];
  });

  const signalRows: string[][] = SIGNALS.map((signal: Signal): string[] => {
    const worst = (vision: ColourVision | null): string =>
      Math.min(...FAMILY_ORDER.map((family: Family): number => signalDistance(themes[family], signal, vision))).toFixed(0);
    return [`\`${signal.first}\` / \`${signal.second}\``, signal.cue ? say(signal.cue) : say(TEXT.none), worst(null), ...VISIONS.map(worst)];
  });

  const dimPairs: [Words, (theme: Theme) => [Colour, Colour]][] = [
    [{ en: 'Body text on the editor', pt: 'Texto no editor' }, (theme: Theme) => [theme.colors['editor.foreground'], theme.colors['editor.background']]],
    [{ en: 'Comments on the editor', pt: 'Comentários no editor' }, (theme: Theme) => [commentInk(theme), theme.colors['editor.background']]],
    [{ en: 'Type parameters on the editor', pt: 'Parâmetros de tipo no editor' }, (theme: Theme) => [genericInk(theme), theme.colors['editor.background']]],
    [{ en: 'Line numbers', pt: 'Números de linha' }, (theme: Theme) => [theme.colors['editorLineNumber.foreground'], theme.colors['editor.background']]],
  ];
  const dimRows: string[][] = dimPairs.map(([what, pairOf]): string[] => {
    const worstAt = (brightness: number): string =>
      Math.min(...FAMILY_ORDER.map((family: Family): number => dimmedRatio(...pairOf(themes[family]), brightness))).toFixed(1);
    return [say(what), worstAt(1), worstAt(0.5)];
  });

  const oledRows: string[][] = FAMILY_ORDER.map((family: Family): string[] => {
    const theme: Theme = themes[family];
    const editor: Colour = theme.colors['editor.background'];
    const steps: string[] = SEEN_GROUNDS.map((id: string): string => deltaE(over(theme.colors[id], editor), editor).toFixed(1));
    const channel: number = Math.max(...hexToRgb(editor)) * 255;
    return [titleOf(family), `\`${editor}\``, channel.toFixed(0), ...steps];
  });

  return [
    `# ${say(TEXT.title)}`,
    '',
    say(TEXT.generated),
    '',
    say(TEXT.intro),
    '',
    `## ${say(TEXT.targets)}`,
    '',
    table([say(TEXT.target), ''], TEXT.targetRows[language].map(([name, meaning]) => [`**${name}**`, meaning]), ['---', '---']),
    '',
    `## ${say(TEXT.contrast)}`,
    '',
    say(TEXT.contrastIntro),
    '',
    table([say(TEXT.area), say(TEXT.what), say(TEXT.target), ...families], contrastRows, ['---', '---', '---', ...families.map(() => '---:')]),
    '',
    `## ${say(TEXT.withoutColour)}`,
    '',
    say(TEXT.withoutColourIntro),
    '',
    ...FACTS.map((fact: Fact): string => `- ${say(fact.what)}`),
    '',
    `### ${say(TEXT.vision)}`,
    '',
    say(TEXT.visionIntro),
    '',
    table([say(TEXT.signal), say(TEXT.cue), say(TEXT.normal), 'Protanopia', 'Deuteranopia', 'Tritanopia'], signalRows, ['---', '---', '---:', '---:', '---:', '---:']),
    '',
    `## ${say(TEXT.environments)}`,
    '',
    say(TEXT.dimIntro),
    '',
    table([say(TEXT.what), say(TEXT.full), say(TEXT.half)], dimRows, ['---', '---:', '---:']),
    '',
    say(TEXT.oled),
    '',
    table(['', say(TEXT.ground), say(TEXT.channel), ...SEEN_GROUNDS.map((id: string): string => `\`${id}\``)], oledRows, ['---', '---', '---:', '---:', '---:', '---:']),
    '',
    say(TEXT.review),
    '',
  ].join('\n');
};

const outputs: [string, string][] = (Object.entries(DOCS) as [Language, string][]).map(([language, file]: [Language, string]): [string, string] => [file, render(language)]);

if (process.argv.includes('--check')) {
  for (const [file, want] of outputs) {
    const got: string = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (got !== want) problems.push(`${path.relative(ROOT, file)} is out of date — run: npm run audit:accessibility`);
  }
} else if (!problems.length) {
  for (const [file, want] of outputs) fs.writeFileSync(file, want, 'utf8');
}

if (problems.length) {
  for (const problem of problems) console.error(`  ! ${problem}`);
  throw new Error(`${problems.length} accessibility problem(s)`);
}
console.log(`accessibility: ${PAIRS.length} pairs, ${SIGNALS.length} signals, ${FACTS.length} cues, ${FAMILY_ORDER.length} families — all hold`);
