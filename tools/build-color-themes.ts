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
 * So the structure lives here once, written against the tokens in
 * tools/theme-tokens.ts — jobs like `surfaceRaised` and `muted`, each with a
 * sentence saying what it is for — and tools/theme-palette.ts decides what
 * colour each one is in each family. Nothing below knows what hue it is
 * emitting, and nothing below may emit a colour that is not a token.
 *
 * THE BASELINE. tools/indigo-baseline.json is the theme exactly as it shipped,
 * and `check` below asserts that the indigo variant still regenerates every
 * key of it, value for value and in the same order. That assertion is the
 * point of the whole arrangement: it is what lets the palette maths be changed
 * with the knowledge that the theme thousands of editors already have open did
 * not move. If it ever fails, the maths changed the original — which is either
 * a bug, or a deliberate change that has to be made to the baseline too, on
 * purpose, in a commit that says so.
 *
 * The theme may say MORE than the baseline — that is how VS Code's newer
 * surfaces get coloured at all — but it may not say anything the baseline says
 * differently. New keys sit wherever they read best; the baseline's own keys
 * have to come out byte for byte once the new ones are set aside.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASELINE, amendedBaseline, duplicateKeys, firstDifference, readBaseline, serialize, sha256 } from './baseline.ts';
import { contrastRatio, deltaE, oklchFromHex, over, relativeLuminance, signedHueDelta } from './color.ts';
import {
  FAMILY_ORDER,
  SEPARATION,
  WHITE,
  paletteFor,
  closestPair,
  signalsFor,
  type Family,
} from './theme-palette.ts';
import {
  OVERLAY,
  SIGNAL_HUE,
  SIGNAL_TOLERANCE,
  derive,
  docOf,
  flatten,
  overlay,
  tokensFor,
  type Signal,
  type Tokens,
} from './theme-tokens.ts';

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

/*
 * The symbol icons — suggest list, outline, breadcrumbs, the symbol picker —
 * are the syntax inks the same symbols are written in (check 13 holds them
 * to it). What the code does not colour — namespaces, objects — is body
 * text, and what is not code at all — files, words, snippets — is secondary.
 */
export const symbolInksFor = ({ syntax, text }: Tokens): Record<string, string> => ({
  class: syntax.type,
  struct: syntax.type,
  interface: syntax.interface,
  enumerator: syntax.interface,
  enumeratorMember: syntax.enumMember,
  constant: syntax.enumMember,
  typeParameter: syntax.generic,
  function: syntax.function,
  method: syntax.function,
  constructor: syntax.function,
  event: syntax.function,
  property: syntax.property,
  field: syntax.property,
  key: syntax.property,
  variable: syntax.variable,
  string: syntax.string,
  number: syntax.number,
  unit: syntax.number,
  boolean: syntax.keyword,
  null: syntax.keyword,
  keyword: syntax.keyword,
  operator: syntax.operator,
  namespace: text.normal,
  module: text.normal,
  package: text.normal,
  object: text.normal,
  array: text.normal,
  reference: text.secondary,
  color: text.secondary,
  file: text.secondary,
  folder: text.secondary,
  text: text.secondary,
  snippet: text.secondary,
});

function themeFor(family: Family, t: Tokens): Theme {
  const { surface: s, text: x, link, accent: a, syntax: k, state: st, chart, ansi } = t;

  /** A row under the pointer: the focus ground at `soft` (STATES.hover). */
  const rowHover: string = overlay(s.surfaceFocus, 'soft');

  /** An inlay hint's chip: the focus ground at `faint`, under muted text, so a hint sits beneath the code it annotates. */
  const inlayChip: string = overlay(s.surfaceFocus, 'faint');

  /*
   * Bracket pairs, by depth. The first four are the shipped ones; five and six
   * take the type and number inks, the two left that are neither the brackets'
   * own keyword colour nor a signal. The pair guides are the same inks as
   * lines: at rest, and stronger for the pair the cursor is in.
   */
  const bracketInks: string[] = [k.keyword, k.function, k.interface, k.generic, k.type, k.number];


  const colors = {
    focusBorder: st.focus,
    foreground: x.normal,
    descriptionForeground: x.secondary,
    disabledForeground: derive.disabled(x.normal),
    errorForeground: st.error,
    'icon.foreground': x.normal,
    'widget.border': s.border,
    'widget.shadow': overlay(s.background, 'heavy'),
    'sash.hoverBorder': st.focus,
    'selection.background': s.surfaceSelected,
    'surface.background': s.surface,
    'surface.foreground': x.secondary,
    'surface.border': s.border,
    'editor.border': s.border,
    'modernPanel.border': s.border,
    'modernSash.gripForeground': x.faint,
    'modernUI.shellBackground': s.frame,
    'modernUI.inactiveShellBackground': s.frame,
    'toolbar.hoverBackground': derive.rest(s.borderStrong),
    'toolbar.activeBackground': derive.active(s.borderStrong),
    'actionBar.toggledBackground': overlay(a.base, 'soft'),
    'progressBar.background': a.base,
    'textLink.foreground': link.rest,
    'textLink.activeForeground': link.active,
    'textSeparator.foreground': s.borderStrong,
    'textPreformat.foreground': k.enumMember,
    'textPreformat.background': s.surfaceRaised,
    'textPreformat.border': s.border,
    'textBlockQuote.background': s.surfaceRaised,
    'textBlockQuote.border': a.muted,
    'textCodeBlock.background': s.background,
    'editor.background': s.background,
    'editor.foreground': x.normal,
    'editor.placeholder.foreground': x.muted,
    'editor.compositionBorder': st.active,
    'editorLineNumber.foreground': x.faint,
    'editorLineNumber.activeForeground': st.active,
    'editorLineNumber.dimmedForeground': x.ghost,
    'editorCursor.foreground': st.active,
    'editorCursor.background': s.background,
    'editorMultiCursor.primary.foreground': st.active,
    'editorMultiCursor.primary.background': s.background,
    'editorMultiCursor.secondary.foreground': derive.inactive(st.active),
    'editorMultiCursor.secondary.background': s.background,
    'editor.selectionBackground': s.surfaceSelected,
    'editor.selectionHighlightBackground': s.surfaceFocus,
    'editor.inactiveSelectionBackground': s.border,
    'editor.lineHighlightBackground': s.currentLine,
    'editor.lineHighlightBorder': s.currentLine,
    'editor.inactiveLineHighlightBackground': derive.inactive(s.currentLine),
    'editor.wordHighlightBackground': overlay(s.surfaceFocus, 'soft'),
    'editor.wordHighlightStrongBackground': overlay(s.surfaceSelected, 'strong'),
    'editor.findMatchBackground': overlay(a.base, 'soft'),
    'editor.findMatchHighlightBackground': derive.rest(a.muted),
    'editor.findMatchBorder': a.base,
    'editor.findRangeHighlightBackground': overlay(s.surfaceFocus, 'wash'),
    'editor.wordHighlightTextBackground': overlay(s.surfaceFocus, 'soft'),
    'editor.hoverHighlightBackground': overlay(s.surfaceFocus, 'soft'),
    'editor.rangeHighlightBackground': overlay(s.surfaceFocus, 'faint'),
    'editor.symbolHighlightBackground': overlay(a.base, 'soft'),
    'editor.linkedEditingBackground': overlay(st.active, 'tint'),
    'editor.snippetTabstopHighlightBackground': derive.rest(s.surfaceSelected),
    'editor.snippetFinalTabstopHighlightBorder': s.borderStrong,
    'editor.foldBackground': overlay(s.surfaceSelected, 'tint'),
    'editor.foldPlaceholderForeground': x.muted,
    'editorLink.activeForeground': link.active,
    'editorUnicodeHighlight.border': st.warning,
    'search.resultsInfoForeground': x.secondary,
    'searchEditor.findMatchBackground': derive.rest(a.muted),
    'searchEditor.textInputBorder': s.borderStrong,
    'editorInlayHint.foreground': x.muted,
    'editorInlayHint.background': inlayChip,
    'editorInlayHint.typeForeground': x.muted,
    'editorInlayHint.typeBackground': inlayChip,
    'editorInlayHint.parameterForeground': x.muted,
    'editorInlayHint.parameterBackground': inlayChip,
    'editorGhostText.foreground': x.muted,
    'editorIndentGuide.background': s.border,
    'editorIndentGuide.background1': s.border,
    'editorIndentGuide.background2': s.border,
    'editorIndentGuide.background3': s.border,
    'editorIndentGuide.background4': s.border,
    'editorIndentGuide.background5': s.border,
    'editorIndentGuide.background6': s.border,
    'editorIndentGuide.activeBackground': a.muted,
    'editorIndentGuide.activeBackground1': a.muted,
    'editorIndentGuide.activeBackground2': a.muted,
    'editorIndentGuide.activeBackground3': a.muted,
    'editorIndentGuide.activeBackground4': a.muted,
    'editorIndentGuide.activeBackground5': a.muted,
    'editorIndentGuide.activeBackground6': a.muted,
    'editorWhitespace.foreground': x.ghost,
    'editorRuler.foreground': s.border,
    'editorBracketMatch.background': derive.rest(s.surfaceSelected),
    'editorBracketMatch.border': st.focus,
    'editorBracketHighlight.foreground1': bracketInks[0],
    'editorBracketHighlight.foreground2': bracketInks[1],
    'editorBracketHighlight.foreground3': bracketInks[2],
    'editorBracketHighlight.foreground4': bracketInks[3],
    'editorBracketHighlight.foreground5': bracketInks[4],
    'editorBracketHighlight.foreground6': bracketInks[5],
    'editorBracketHighlight.unexpectedBracket.foreground': k.operator,
    ...Object.fromEntries(
      bracketInks.flatMap((ink: string, index: number): [string, string][] => [
        [`editorBracketPairGuide.background${index + 1}`, derive.rest(ink)],
        [`editorBracketPairGuide.activeBackground${index + 1}`, derive.inactive(ink)],
      ])
    ),
    'editorGutter.background': s.background,
    'editorGutter.foldingControlForeground': x.faint,
    'editorGutter.itemGlyphForeground': x.faint,
    'editorGutter.itemBackground': s.background,
    'editorGutter.modifiedBackground': st.modified,
    'editorGutter.addedBackground': st.added,
    'editorGutter.deletedBackground': st.deleted,
    'editorOverviewRuler.border': s.frame,
    'editorOverviewRuler.findMatchForeground': derive.inactive(a.base),
    'editorOverviewRuler.rangeHighlightForeground': derive.rest(a.base),
    'editorOverviewRuler.selectionHighlightForeground': s.borderStrong,
    'editorOverviewRuler.wordHighlightForeground': s.borderStrong,
    'editorOverviewRuler.wordHighlightStrongForeground': x.faint,
    'editorOverviewRuler.wordHighlightTextForeground': s.borderStrong,
    'editorOverviewRuler.bracketMatchForeground': x.faint,
    'minimap.background': s.background,
    'minimap.selectionHighlight': s.surfaceSelected,
    'minimap.findMatchHighlight': a.base,
    'minimap.selectionOccurrenceHighlight': s.borderStrong,
    'minimapSlider.background': derive.rest(a.muted),
    'minimapSlider.hoverBackground': derive.hover(a.muted),
    'minimapSlider.activeBackground': derive.active(a.base),
    'editorStickyScroll.background': s.surfaceRaised,
    'editorStickyScrollGutter.background': s.surfaceRaised,
    'editorStickyScrollHover.background': rowHover,
    'editorStickyScroll.shadow': s.frame,
    'editorStickyScroll.border': s.border,
    'editorLightBulb.foreground': st.hint,
    'editorLightBulbAutoFix.foreground': st.info,
    'editorLightBulbAi.foreground': st.hint,
    'editorCodeLens.foreground': x.muted,
    'editorWidget.background': s.surfaceRaised,
    'editorWidget.border': a.muted,
    'editorHoverWidget.background': s.surfaceRaised,
    'editorHoverWidget.border': a.muted,
    'editorSuggestWidget.background': s.surfaceRaised,
    'editorSuggestWidget.border': s.borderStrong,
    'editorSuggestWidget.selectedBackground': s.surfaceFocus,
    'editorSuggestWidget.highlightForeground': k.keyword,
    'editorSuggestWidget.foreground': x.normal,
    'editorSuggestWidget.selectedForeground': x.bright,
    'editorSuggestWidget.selectedIconForeground': x.bright,
    'editorSuggestWidget.focusHighlightForeground': k.keyword,
    'editorSuggestWidgetStatus.foreground': x.secondary,
    'editorHoverWidget.foreground': x.normal,
    'editorHoverWidget.highlightForeground': k.keyword,
    'editorHoverWidget.statusBarBackground': s.border,
    ...Object.fromEntries(Object.entries(symbolInksFor(t)).map(([symbol, ink]): [string, string] => [`symbolIcon.${symbol}Foreground`, ink])),
    'editorWidget.foreground': x.normal,
    'editorActionList.background': s.surfaceRaised,
    'editorActionList.foreground': x.normal,
    'editorActionList.focusBackground': s.surfaceFocus,
    'editorActionList.focusForeground': x.bright,
    'simpleFindWidget.sashBorder': s.borderStrong,
    'quickInput.background': s.surfaceRaised,
    'quickInput.foreground': x.normal,
    'quickInputTitle.background': s.border,
    'quickInputList.focusBackground': s.surfaceFocus,
    'quickInputList.focusForeground': x.bright,
    'pickerGroup.border': s.border,
    'pickerGroup.foreground': k.type,
    'keybindingLabel.background': s.border,
    'keybindingLabel.foreground': x.normal,
    'keybindingLabel.border': s.borderStrong,
    'keybindingLabel.bottomBorder': s.borderStrong,
    'menu.background': s.surfaceRaised,
    'menu.foreground': x.normal,
    'menu.border': s.borderStrong,
    'menu.selectionBackground': s.surfaceFocus,
    'menu.selectionForeground': x.bright,
    'menu.separatorBackground': s.borderStrong,
    'notifications.background': s.surfaceRaised,
    'notifications.foreground': x.normal,
    'notifications.border': s.border,
    'notificationCenter.border': s.borderStrong,
    'notificationCenterHeader.background': s.surfaceHover,
    'notificationCenterHeader.foreground': x.normal,
    'notificationToast.border': s.borderStrong,
    'notificationLink.foreground': link.rest,
    'notificationsErrorIcon.foreground': st.error,
    'notificationsWarningIcon.foreground': st.warning,
    'notificationsInfoIcon.foreground': st.info,
    'banner.background': s.border,
    'banner.foreground': x.bright,
    'banner.iconForeground': st.info,
    'titleBar.activeBackground': s.frame,
    'titleBar.activeForeground': x.normal,
    'titleBar.inactiveBackground': s.frame,
    'titleBar.inactiveForeground': x.muted,
    'titleBar.border': s.border,
    'menubar.selectionBackground': derive.rest(s.borderStrong),
    'menubar.selectionForeground': x.normal,
    'commandCenter.background': s.surfaceRaised,
    'commandCenter.foreground': x.secondary,
    'commandCenter.border': s.border,
    'commandCenter.activeBackground': s.surfaceFocus,
    'commandCenter.activeForeground': x.normal,
    'commandCenter.activeBorder': s.borderStrong,
    'commandCenter.inactiveForeground': x.muted,
    'commandCenter.inactiveBorder': s.border,
    'commandCenter.debuggingBackground': overlay(k.generic, 'faint'),
    'activityBar.background': s.frame,
    'activityBar.foreground': x.normal,
    'activityBar.inactiveForeground': x.faint,
    'activityBar.border': s.border,
    'activityBar.activeBorder': a.base,
    'activityBar.dropBorder': a.base,
    'activityBarBadge.background': a.base,
    'activityBarBadge.foreground': a.on,
    'activityBarTop.foreground': x.normal,
    'activityBarTop.inactiveForeground': x.faint,
    'activityBarTop.activeBorder': a.base,
    'activityBarTop.dropBorder': a.base,
    'activityWarningBadge.background': st.warning,
    'activityWarningBadge.foreground': s.background,
    'activityErrorBadge.background': st.error,
    'activityErrorBadge.foreground': s.background,
    'profileBadge.background': s.borderStrong,
    'profileBadge.foreground': x.white,
    'profiles.sashBorder': s.border,
    'modernActivityBar.background': s.frame,
    'modernActivityBar.inactiveBackground': s.frame,
    'modernActivityBar.border': s.border,
    'modernActivityBarItem.activeBackground': s.border,
    'modernActivityBarItem.activeForeground': x.bright,
    'modernActivityBarItem.hoverBackground': rowHover,
    'modernActivityBarItem.hoverForeground': x.normal,
    'sideBar.background': s.surface,
    'sideBar.foreground': x.secondary,
    'sideBar.border': s.border,
    'sideBar.dropBackground': derive.rest(a.base),
    'sideBarTitle.foreground': x.normal,
    'sideBarTitle.background': s.surface,
    'sideBarSectionHeader.background': s.surfaceRaised,
    'sideBarSectionHeader.foreground': x.normal,
    'sideBarSectionHeader.border': s.border,
    'sideBarActivityBarTop.border': s.border,
    'sideBarStickyScroll.background': s.surface,
    'sideBarStickyScroll.shadow': s.frame,
    'statusBar.background': s.surfaceRaised,
    'statusBar.foreground': x.secondary,
    'statusBar.border': s.border,
    'statusBar.focusBorder': st.focus,
    'statusBar.debuggingBackground': k.generic,
    'statusBar.debuggingForeground': x.white,
    'statusBar.debuggingBorder': s.border,
    'statusBar.noFolderBackground': s.surfaceRaised,
    'statusBar.noFolderForeground': x.secondary,
    'statusBar.noFolderBorder': s.border,
    'statusBarItem.hoverBackground': s.surfaceFocus,
    'statusBarItem.hoverForeground': x.normal,
    'statusBarItem.activeBackground': s.surfaceSelected,
    'statusBarItem.compactHoverBackground': s.surfaceFocus,
    'statusBarItem.focusBorder': st.focus,
    'statusBarItem.prominentBackground': a.muted,
    'statusBarItem.prominentForeground': a.on,
    'statusBarItem.prominentHoverBackground': a.base,
    'statusBarItem.prominentHoverForeground': a.on,
    'statusBarItem.remoteBackground': a.muted,
    'statusBarItem.remoteForeground': a.on,
    'statusBarItem.remoteHoverBackground': a.base,
    'statusBarItem.remoteHoverForeground': a.on,
    'statusBarItem.errorBackground': overlay(st.error, 'faint'),
    'statusBarItem.errorForeground': x.white,
    'statusBarItem.errorHoverBackground': overlay(st.error, 'soft'),
    'statusBarItem.errorHoverForeground': x.white,
    'statusBarItem.warningBackground': overlay(st.warning, 'faint'),
    'statusBarItem.warningForeground': x.white,
    'statusBarItem.warningHoverBackground': overlay(st.warning, 'soft'),
    'statusBarItem.warningHoverForeground': x.white,
    'statusBarItem.offlineBackground': overlay(st.error, 'faint'),
    'statusBarItem.offlineForeground': x.white,
    'statusBarItem.offlineHoverBackground': overlay(st.error, 'soft'),
    'statusBarItem.offlineHoverForeground': x.white,
    'tab.activeBackground': s.surfaceHover,
    'tab.activeForeground': x.bright,
    'tab.inactiveBackground': s.background,
    'tab.inactiveForeground': x.muted,
    'tab.border': s.border,
    'tab.activeBorderTop': a.base,
    'tab.unfocusedActiveBorderTop': a.muted,
    'tab.unfocusedActiveBackground': s.surfaceHover,
    'tab.unfocusedActiveForeground': derive.inactive(x.bright),
    'tab.unfocusedInactiveBackground': s.background,
    'tab.unfocusedInactiveForeground': derive.inactive(x.muted),
    'tab.hoverBackground': derive.hover(s.surfaceHover),
    'tab.hoverForeground': x.normal,
    'tab.unfocusedHoverBackground': derive.hover(s.surfaceHover),
    'tab.unfocusedHoverForeground': derive.inactive(x.normal),
    'tab.selectedBackground': s.border,
    'tab.selectedForeground': x.normal,
    'tab.selectedBorderTop': a.muted,
    'tab.activeModifiedBorder': st.modified,
    'tab.inactiveModifiedBorder': derive.inactive(st.modified),
    'tab.unfocusedActiveModifiedBorder': derive.inactive(st.modified),
    'tab.unfocusedInactiveModifiedBorder': overlay(st.modified, 'faint'),
    'tab.lastPinnedBorder': s.borderStrong,
    'tab.dragAndDropBorder': a.base,
    'modernTab.activeBackground': s.border,
    'modernTab.activeForeground': x.bright,
    'modernTab.hoverBackground': rowHover,
    'modernTab.hoverForeground': x.normal,
    'modernEditorTab.activeBackground': s.border,
    'modernEditorTab.activeForeground': x.bright,
    'modernEditorTab.activeActionBackground': s.border,
    'modernEditorTab.hoverBackground': rowHover,
    'modernEditorTab.hoverForeground': x.normal,
    'modernEditorTab.hoverActionBackground': rowHover,
    'modernEditorTab.activeHoverBackground': s.border,
    'modernEditorTab.activeHoverActionBackground': s.border,
    'modernEditorTab.selectedActionBackground': s.border,
    'editorGroupHeader.tabsBackground': s.surface,
    'editorGroupHeader.noTabsBackground': s.background,
    'editorGroupHeader.border': s.border,
    'editorGroup.border': s.border,
    'editorGroup.dropBackground': derive.rest(a.base),
    'editorGroup.focusedEmptyBorder': st.focus,
    'editorGroup.dropIntoPromptBackground': s.surfaceRaised,
    'editorGroup.dropIntoPromptForeground': x.normal,
    'editorGroup.dropIntoPromptBorder': a.muted,
    'editorPane.background': s.background,
    'sideBySideEditor.horizontalBorder': s.border,
    'sideBySideEditor.verticalBorder': s.border,
    'breadcrumb.background': s.background,
    'breadcrumb.foreground': x.secondary,
    'breadcrumb.focusForeground': x.bright,
    'breadcrumb.activeSelectionForeground': x.bright,
    'breadcrumbPicker.background': s.surfaceRaised,
    'panel.background': s.surface,
    'panel.border': s.border,
    'panel.dropBorder': a.base,
    'panelTitle.activeBorder': a.base,
    'panelTitle.activeForeground': x.normal,
    'panelTitle.inactiveForeground': x.muted,
    'panelTitleBadge.background': a.base,
    'panelTitleBadge.foreground': a.on,
    'panelInput.border': s.borderStrong,
    'panelSection.border': s.border,
    'panelSection.dropBackground': derive.rest(a.base),
    'panelSectionHeader.background': s.surfaceRaised,
    'panelSectionHeader.foreground': x.normal,
    'panelSectionHeader.border': s.border,
    'panelStickyScroll.background': s.surface,
    'panelStickyScroll.shadow': s.frame,
    'input.background': s.surfaceRaised,
    'input.border': s.borderStrong,
    'input.foreground': x.normal,
    'input.placeholderForeground': x.muted,
    'inputOption.activeBackground': overlay(a.base, 'soft'),
    'inputOption.activeBorder': a.muted,
    'inputOption.activeForeground': x.white,
    'inputOption.hoverBackground': derive.rest(s.borderStrong),
    'dropdown.background': s.surfaceRaised,
    'dropdown.border': s.borderStrong,
    'dropdown.foreground': x.normal,
    'checkbox.background': s.surfaceRaised,
    'checkbox.foreground': x.normal,
    'checkbox.border': s.borderStrong,
    'checkbox.selectBackground': s.surfaceRaised,
    'checkbox.selectBorder': x.normal,
    'checkbox.disabled.background': derive.disabled(s.surfaceRaised),
    'checkbox.disabled.foreground': derive.disabled(x.normal),
    'radio.activeBackground': overlay(a.base, 'soft'),
    'radio.activeForeground': x.white,
    'radio.activeBorder': a.muted,
    'radio.inactiveBorder': s.borderStrong,
    'radio.inactiveHoverBackground': derive.rest(s.borderStrong),
    'list.activeSelectionBackground': s.border,
    'list.activeSelectionForeground': x.bright,
    'list.inactiveSelectionBackground': s.border,
    'list.inactiveSelectionForeground': x.normal,
    'list.hoverBackground': rowHover,
    'list.focusBackground': s.surfaceFocus,
    'list.focusOutline': st.focus,
    'list.highlightForeground': k.keyword,
    'list.focusHighlightForeground': k.keyword,
    'list.deemphasizedForeground': x.muted,
    'list.invalidItemForeground': st.warning,
    'list.dropBackground': derive.rest(a.base),
    'list.dropBetweenBackground': a.base,
    'list.filterMatchBackground': derive.rest(a.muted),
    'listFilterWidget.background': s.surfaceRaised,
    'listFilterWidget.outline': a.muted,
    'listFilterWidget.noMatchesOutline': st.error,
    'listFilterWidget.shadow': overlay(s.background, 'heavy'),
    'tree.indentGuidesStroke': s.borderStrong,
    'tree.inactiveIndentGuidesStroke': s.border,
    'tree.tableColumnsBorder': s.border,
    'tree.tableOddRowsBackground': s.surfaceRaised,
    'keybindingTable.headerBackground': s.surfaceRaised,
    'keybindingTable.rowsBackground': s.surfaceRaised,
    'scrollbar.shadow': s.frame,
    'scrollbarSlider.background': derive.rest(a.muted),
    'scrollbarSlider.hoverBackground': derive.hover(a.muted),
    'scrollbarSlider.activeBackground': derive.active(a.base),
    'button.background': a.base,
    'button.foreground': a.on,
    'button.hoverBackground': derive.hover(a.base),
    'button.separator': overlay(a.on, 'soft'),
    'button.secondaryBackground': s.surfaceFocus,
    'button.secondaryForeground': x.bright,
    'button.secondaryHoverBackground': s.surfaceSelected,
    'button.secondaryBorder': s.borderStrong,
    'extensionButton.background': s.surfaceFocus,
    'extensionButton.foreground': x.bright,
    'extensionButton.hoverBackground': s.surfaceSelected,
    'extensionButton.border': s.borderStrong,
    'extensionButton.separator': overlay(a.on, 'soft'),
    'extensionButton.prominentBackground': a.base,
    'extensionButton.prominentForeground': a.on,
    'extensionButton.prominentHoverBackground': derive.hover(a.base),
    'extensionBadge.remoteBackground': a.base,
    'extensionBadge.remoteForeground': a.on,
    'extensionIcon.starForeground': chart.orange,
    'extensionIcon.verifiedForeground': link.rest,
    'extensionIcon.preReleaseForeground': st.success,
    'extensionIcon.sponsorForeground': chart.purple,
    'extensionIcon.privateForeground': x.muted,
    'mcpIcon.starForeground': chart.orange,
    'badge.background': a.muted,
    'badge.foreground': a.on,
    'gauge.background': s.border,
    'gauge.foreground': a.base,
    'gauge.border': s.borderStrong,
    'gauge.warningBackground': overlay(st.warning, 'faint'),
    'gauge.warningForeground': st.warning,
    'gauge.errorBackground': overlay(st.error, 'faint'),
    'gauge.errorForeground': st.error,
    'settings.headerForeground': x.bright,
    'settings.settingsHeaderHoverForeground': x.normal,
    'settings.headerBorder': s.border,
    'settings.sashBorder': s.border,
    'settings.modifiedItemIndicator': st.modified,
    'settings.rowHoverBackground': rowHover,
    'settings.focusedRowBackground': derive.active(s.surfaceFocus),
    'settings.focusedRowBorder': st.focus,
    'settings.dropdownBackground': s.surfaceRaised,
    'settings.dropdownForeground': x.normal,
    'settings.dropdownBorder': s.borderStrong,
    'settings.dropdownListBorder': a.muted,
    'settings.checkboxBackground': s.surfaceRaised,
    'settings.checkboxForeground': x.normal,
    'settings.checkboxBorder': s.borderStrong,
    'settings.textInputBackground': s.surfaceRaised,
    'settings.textInputForeground': x.normal,
    'settings.textInputBorder': s.borderStrong,
    'settings.numberInputBackground': s.surfaceRaised,
    'settings.numberInputForeground': x.normal,
    'settings.numberInputBorder': s.borderStrong,
    'welcomePage.tileBackground': s.surfaceRaised,
    'welcomePage.tileHoverBackground': s.surfaceFocus,
    'welcomePage.tileBorder': s.border,
    'welcomePage.progress.background': s.surfaceRaised,
    'welcomePage.progress.foreground': a.base,
    'walkThrough.embeddedEditorBackground': s.background,
    'walkthrough.stepTitle.foreground': x.bright,
    'notebook.editorBackground': s.background,
    'notebook.cellEditorBackground': s.surface,
    'notebook.cellBorderColor': s.border,
    'notebook.cellToolbarSeparator': s.border,
    'notebook.cellStatusBarItemHoverBackground': derive.rest(s.borderStrong),
    'notebook.cellInsertionIndicator': st.focus,
    'notebook.focusedCellBorder': st.focus,
    'notebook.focusedEditorBorder': st.focus,
    'notebook.inactiveFocusedCellBorder': s.border,
    'notebook.selectedCellBackground': s.surfaceHover,
    'notebook.selectedCellBorder': s.border,
    'notebook.symbolHighlightBackground': derive.rest(s.surfaceFocus),
    'notebookScrollbarSlider.background': derive.rest(a.muted),
    'notebookScrollbarSlider.hoverBackground': derive.hover(a.muted),
    'notebookScrollbarSlider.activeBackground': derive.active(a.base),
    'notebookStatusSuccessIcon.foreground': st.success,
    'notebookStatusRunningIcon.foreground': x.normal,
    'notebookStatusErrorIcon.foreground': st.error,
    'notebookEditorOverviewRuler.runningCellForeground': st.success,
    'terminal.background': s.background,
    'terminal.foreground': x.normal,
    'terminal.ansiBlack': ansi.black,
    'terminal.ansiRed': ansi.red,
    'terminal.ansiGreen': ansi.green,
    'terminal.ansiYellow': ansi.yellow,
    'terminal.ansiBlue': ansi.blue,
    'terminal.ansiMagenta': ansi.magenta,
    'terminal.ansiCyan': ansi.cyan,
    'terminal.ansiWhite': ansi.white,
    'terminal.ansiBrightBlack': ansi.brightBlack,
    'terminal.ansiBrightRed': ansi.brightRed,
    'terminal.ansiBrightGreen': ansi.brightGreen,
    'terminal.ansiBrightYellow': ansi.brightYellow,
    'terminal.ansiBrightBlue': ansi.brightBlue,
    'terminal.ansiBrightMagenta': ansi.brightMagenta,
    'terminal.ansiBrightCyan': ansi.brightCyan,
    'terminal.ansiBrightWhite': ansi.brightWhite,
    'terminal.border': s.border,
    'terminal.selectionBackground': s.surfaceSelected,
    'terminal.inactiveSelectionBackground': s.border,
    'terminal.findMatchBackground': overlay(a.base, 'soft'),
    'terminal.findMatchBorder': a.base,
    'terminal.findMatchHighlightBackground': derive.rest(a.muted),
    'terminal.hoverHighlightBackground': overlay(s.surfaceFocus, 'soft'),
    'terminal.dropBackground': derive.rest(a.base),
    'terminal.tab.activeBorder': a.base,
    'terminal.initialHintForeground': x.muted,
    'terminalCursor.foreground': st.active,
    'terminalCursor.background': s.background,
    'terminalCommandDecoration.defaultBackground': x.muted,
    'terminalCommandDecoration.successBackground': st.success,
    'terminalCommandDecoration.errorBackground': st.error,
    'terminalCommandGuide.foreground': s.borderStrong,
    'terminalOverviewRuler.border': s.frame,
    'terminalOverviewRuler.cursorForeground': derive.inactive(st.active),
    'terminalOverviewRuler.findMatchForeground': derive.inactive(a.base),
    'terminalStickyScroll.background': s.surfaceRaised,
    'terminalStickyScroll.border': s.border,
    'terminalStickyScrollHover.background': rowHover,
    'terminalSymbolIcon.inlineSuggestionForeground': x.muted,
    'ports.iconRunningProcessForeground': st.success,
    'diffEditor.insertedTextBackground': overlay(st.added, 'tint'),
    'diffEditor.removedTextBackground': overlay(st.deleted, 'tint'),
    'gitDecoration.modifiedResourceForeground': st.modified,
    'gitDecoration.addedResourceForeground': st.added,
    'gitDecoration.deletedResourceForeground': st.deleted,
    'gitDecoration.untrackedResourceForeground': st.added,
    'gitDecoration.stageModifiedResourceForeground': st.modified,
    'gitDecoration.stageDeletedResourceForeground': st.deleted,
    'gitDecoration.renamedResourceForeground': st.modified,
    'gitDecoration.conflictingResourceForeground': st.conflicting,
    'gitDecoration.ignoredResourceForeground': x.muted,
    'gitDecoration.submoduleResourceForeground': x.normal,
    'git.blame.editorDecorationForeground': x.muted,
    'editorGutter.modifiedSecondaryBackground': overlay(st.modified, 'heavy'),
    'editorGutter.addedSecondaryBackground': overlay(st.added, 'heavy'),
    'editorGutter.deletedSecondaryBackground': overlay(st.deleted, 'heavy'),
    'minimapGutter.modifiedBackground': st.modified,
    'minimapGutter.addedBackground': st.added,
    'minimapGutter.deletedBackground': st.deleted,
    'editorOverviewRuler.modifiedForeground': st.modified,
    'editorOverviewRuler.addedForeground': st.added,
    'editorOverviewRuler.deletedForeground': st.deleted,
    'diffEditor.insertedLineBackground': overlay(st.added, 'trace'),
    'diffEditor.removedLineBackground': overlay(st.deleted, 'trace'),
    'diffEditorGutter.insertedLineBackground': overlay(st.added, 'trace'),
    'diffEditorGutter.removedLineBackground': overlay(st.deleted, 'trace'),
    'diffEditorOverview.insertedForeground': st.added,
    'diffEditorOverview.removedForeground': st.deleted,
    'diffEditor.border': s.border,
    'diffEditor.diagonalFill': s.border,
    'diffEditor.unchangedRegionBackground': s.surfaceRaised,
    'diffEditor.unchangedRegionForeground': x.secondary,
    'diffEditor.unchangedRegionShadow': overlay(s.background, 'heavy'),
    'diffEditor.unchangedCodeBackground': overlay(s.surfaceFocus, 'faint'),
    'diffEditor.move.border': s.borderStrong,
    'diffEditor.moveActive.border': st.modified,
    'multiDiffEditor.background': s.background,
    'multiDiffEditor.headerBackground': s.surfaceRaised,
    'multiDiffEditor.border': s.border,
    'merge.currentHeaderBackground': overlay(st.hint, 'wash'),
    'merge.currentContentBackground': overlay(st.hint, 'tint'),
    'merge.incomingHeaderBackground': overlay(chart.purple, 'wash'),
    'merge.incomingContentBackground': overlay(chart.purple, 'tint'),
    'merge.commonHeaderBackground': overlay(x.muted, 'wash'),
    'merge.commonContentBackground': overlay(x.muted, 'tint'),
    'editorOverviewRuler.currentContentForeground': st.hint,
    'editorOverviewRuler.incomingContentForeground': chart.purple,
    'editorOverviewRuler.commonContentForeground': x.muted,
    'mergeEditor.change.background': overlay(st.added, 'trace'),
    'mergeEditor.change.word.background': overlay(st.added, 'tint'),
    'mergeEditor.changeBase.background': overlay(st.deleted, 'trace'),
    'mergeEditor.changeBase.word.background': overlay(st.deleted, 'tint'),
    'mergeEditor.conflict.input1.background': overlay(st.hint, 'tint'),
    'mergeEditor.conflict.input2.background': overlay(chart.purple, 'tint'),
    'mergeEditor.conflictingLines.background': overlay(st.conflicting, 'tint'),
    'mergeEditor.conflict.unhandledFocused.border': st.conflicting,
    'mergeEditor.conflict.unhandledUnfocused.border': derive.inactive(st.conflicting),
    'mergeEditor.conflict.handledFocused.border': x.muted,
    'mergeEditor.conflict.handledUnfocused.border': s.borderStrong,
    'mergeEditor.conflict.unhandled.minimapOverViewRuler': st.conflicting,
    'mergeEditor.conflict.handled.minimapOverViewRuler': x.muted,
    'scmGraph.foreground1': st.hint,
    'scmGraph.foreground2': chart.yellow,
    'scmGraph.foreground3': chart.blue,
    'scmGraph.foreground4': chart.orange,
    'scmGraph.foreground5': chart.purple,
    'scmGraph.historyItemRefColor': a.base,
    'scmGraph.historyItemRemoteRefColor': chart.purple,
    'scmGraph.historyItemBaseRefColor': chart.orange,
    'scmGraph.historyItemHoverLabelForeground': s.surface,
    'scmGraph.historyItemHoverDefaultLabelForeground': a.on,
    'scmGraph.historyItemHoverDefaultLabelBackground': a.muted,
    'scmGraph.historyItemHoverAdditionsForeground': st.added,
    'scmGraph.historyItemHoverDeletionsForeground': st.deleted,
    'editorCommentsWidget.unresolvedBorder': st.info,
    'editorCommentsWidget.resolvedBorder': s.borderStrong,
    'editorCommentsWidget.rangeBackground': overlay(st.info, 'tint'),
    'editorCommentsWidget.rangeActiveBackground': overlay(st.info, 'wash'),
    'editorCommentsWidget.replyInputBackground': s.surfaceRaised,
    'editorGutter.commentRangeForeground': s.borderStrong,
    'editorGutter.commentGlyphForeground': x.muted,
    'editorGutter.commentUnresolvedGlyphForeground': st.info,
    'editorGutter.commentDraftGlyphForeground': st.warning,
    'editorOverviewRuler.commentForeground': x.muted,
    'editorOverviewRuler.commentUnresolvedForeground': st.info,
    'editorOverviewRuler.commentDraftForeground': st.warning,
    'commentsView.resolvedIcon': x.muted,
    'commentsView.unresolvedIcon': st.info,
    /*
     * Chat and agents. The AI is the theme's own colour, the accent, and only
     * where it is the one speaking or acting: its avatar, the command a request
     * addresses it by, the border that runs while it works, its suggestion in
     * the gutter, a session in progress. What the person wrote is a neutral
     * bubble on the selection ground, as VS Code's own is; what the AI changed
     * is the kind of change M7 says it is; the rest is the workbench.
     */
    'chat.requestBackground': s.surface,
    'chat.requestBorder': s.border,
    'chat.requestBubbleBackground': overlay(s.surfaceSelected, 'faint'),
    'chat.requestBubbleHoverBackground': overlay(s.surfaceSelected, 'strong'),
    'chat.requestCodeBorder': s.borderStrong,
    'chat.slashCommandBackground': overlay(a.base, 'wash'),
    'chat.slashCommandForeground': x.bright,
    'chat.avatarBackground': a.muted,
    'chat.avatarForeground': a.on,
    'chat.editedFileForeground': st.modified,
    'chat.linesAddedForeground': st.added,
    'chat.linesRemovedForeground': st.deleted,
    'chat.checkpointSeparator': s.borderStrong,
    'chat.thinkingShimmer': x.white,
    'chat.inputWorkingBorderColor1': a.base,
    'chat.sessionStateIndicator.inProgressBorder': a.base,
    'chat.sessionStateIndicator.unvisitedBorder': st.success,
    'chat.sessionStateIndicator.needsInputBorder': st.warning,
    'chat.findMatchBackground': overlay(a.base, 'soft'),
    'chat.findMatchHighlightBackground': derive.rest(a.muted),
    'chatManagement.sashBorder': s.border,
    'aiCustomizationManagement.sashBorder': s.border,
    'interactive.activeCodeBorder': st.focus,
    'interactive.inactiveCodeBorder': s.border,
    'inlineChat.background': s.surfaceRaised,
    'inlineChat.foreground': x.normal,
    'inlineChat.border': a.muted,
    'inlineChat.shadow': overlay(s.background, 'heavy'),
    'inlineChatInput.background': s.surfaceRaised,
    'inlineChatInput.border': s.borderStrong,
    'inlineChatInput.focusBorder': st.focus,
    'inlineChatInput.placeholderForeground': x.muted,
    'inlineChatDiff.inserted': overlay(st.added, 'tint'),
    'inlineChatDiff.removed': overlay(st.deleted, 'tint'),
    'editorOverviewRuler.inlineChatInserted': st.added,
    'editorOverviewRuler.inlineChatRemoved': st.deleted,
    'editorMinimap.inlineChatInserted': st.added,
    'minimap.chatEditHighlight': derive.rest(a.base),
    'inlineEdit.originalBackground': overlay(st.deleted, 'trace'),
    'inlineEdit.modifiedBackground': overlay(st.added, 'trace'),
    'inlineEdit.originalChangedLineBackground': overlay(st.deleted, 'trace'),
    'inlineEdit.originalChangedTextBackground': overlay(st.deleted, 'trace'),
    'inlineEdit.modifiedChangedLineBackground': overlay(st.added, 'trace'),
    'inlineEdit.modifiedChangedTextBackground': overlay(st.added, 'trace'),
    'inlineEdit.originalBorder': st.deleted,
    'inlineEdit.modifiedBorder': st.added,
    'inlineEdit.tabWillAcceptOriginalBorder': st.deleted,
    'inlineEdit.tabWillAcceptModifiedBorder': st.added,
    'inlineEdit.gutterIndicator.background': overlay(s.background, 'half'),
    'inlineEdit.gutterIndicator.primaryBackground': overlay(a.base, 'soft'),
    'inlineEdit.gutterIndicator.primaryBorder': a.base,
    'inlineEdit.gutterIndicator.primaryForeground': a.on,
    'inlineEdit.gutterIndicator.secondaryBackground': s.surfaceRaised,
    'inlineEdit.gutterIndicator.secondaryBorder': a.muted,
    'inlineEdit.gutterIndicator.secondaryForeground': x.normal,
    'inlineEdit.gutterIndicator.successfulBackground': a.base,
    'inlineEdit.gutterIndicator.successfulBorder': a.base,
    'inlineEdit.gutterIndicator.successfulForeground': a.on,
    'agents.background': s.background,
    'agentsGradient.tintColor': a.muted,
    'agentsPanel.background': s.surface,
    'agentsPanel.foreground': x.secondary,
    'agentsPanel.border': s.border,
    'agentsCard.border': s.border,
    'agentsBottomPanel.border': s.border,
    'activeSessionView.background': s.surface,
    'activeSessionView.foreground': x.normal,
    'inactiveSessionView.background': s.background,
    'inactiveSessionView.foreground': x.secondary,
    'agentsChatInput.background': s.surfaceRaised,
    'agentsChatInput.foreground': x.normal,
    'agentsChatInput.border': s.borderStrong,
    'agentsChatInput.focusBorder': st.focus,
    'agentsChatInput.placeholderForeground': x.muted,
    'agentsNewSessionButton.foreground': x.normal,
    'agentsNewSessionButton.border': s.borderStrong,
    'agentsNewSessionButton.hoverBackground': derive.rest(s.borderStrong),
    'agentsBadge.background': a.muted,
    'agentsBadge.foreground': a.on,
    'agentsUnreadBadge.background': a.base,
    'agentsUnreadBadge.foreground': a.on,
    'agentSessionReadIndicator.foreground': x.faint,
    'agentSessionSelectedBadge.border': overlay(x.bright, 'faint'),
    'agentSessionSelectedUnfocusedBadge.border': overlay(x.normal, 'faint'),
    'agentStatusIndicator.background': s.surfaceRaised,
    'agentFeedbackEditorWidget.background': s.surfaceRaised,
    'agentFeedbackEditorWidget.border': a.muted,
    'agentFeedbackInputWidget.border': s.borderStrong,
    'agentsUpdateButton.downloadingBackground': overlay(a.base, 'soft'),
    'agentsUpdateButton.downloadedBackground': derive.active(a.base),
    'agentsMobileDiff.addedForeground': st.added,
    'agentsMobileDiff.modifiedForeground': st.modified,
    'agentsMobileDiff.deletedForeground': st.deleted,
    'peekViewEditor.background': s.background,
    'peekViewResult.background': s.surface,
    'peekView.border': a.muted,
    'peekViewTitle.background': s.surfaceRaised,
    'peekViewTitleLabel.foreground': x.bright,
    'peekViewTitleDescription.foreground': x.secondary,
    'peekViewEditorGutter.background': s.background,
    'peekViewEditor.matchHighlightBackground': overlay(a.base, 'soft'),
    'peekViewEditorStickyScroll.background': s.surfaceRaised,
    'peekViewEditorStickyScrollGutter.background': s.surfaceRaised,
    'peekViewResult.fileForeground': x.normal,
    'peekViewResult.lineForeground': x.secondary,
    'peekViewResult.matchHighlightBackground': derive.rest(a.muted),
    'peekViewResult.selectionBackground': s.border,
    'peekViewResult.selectionForeground': x.bright,
    'editorError.foreground': st.error,
    'editorWarning.foreground': st.warning,
    'editorInfo.foreground': st.info,
    'editorHint.foreground': st.hint,
    'editorOverviewRuler.errorForeground': st.error,
    'editorOverviewRuler.warningForeground': st.warning,
    'editorOverviewRuler.infoForeground': st.info,
    'minimap.errorHighlight': derive.inactive(st.error),
    'minimap.warningHighlight': derive.inactive(st.warning),
    'minimap.infoHighlight': derive.inactive(st.info),
    'problemsErrorIcon.foreground': st.error,
    'problemsWarningIcon.foreground': st.warning,
    'problemsInfoIcon.foreground': st.info,
    'list.errorForeground': st.error,
    'list.warningForeground': st.warning,
    'inputValidation.errorBackground': s.surfaceRaised,
    'inputValidation.errorForeground': x.normal,
    'inputValidation.errorBorder': st.error,
    'inputValidation.warningBackground': s.surfaceRaised,
    'inputValidation.warningForeground': x.normal,
    'inputValidation.warningBorder': st.warning,
    'inputValidation.infoBackground': s.surfaceRaised,
    'inputValidation.infoForeground': x.normal,
    'inputValidation.infoBorder': st.info,
    'editorMarkerNavigation.background': s.surfaceRaised,
    'editorMarkerNavigationError.background': st.error,
    'editorMarkerNavigationError.headerBackground': overlay(st.error, 'tint'),
    'editorMarkerNavigationWarning.background': st.warning,
    'editorMarkerNavigationWarning.headerBackground': overlay(st.warning, 'tint'),
    'editorMarkerNavigationInfo.background': st.info,
    'editorMarkerNavigationInfo.headerBackground': overlay(st.info, 'tint'),
    'debugExceptionWidget.background': overlay(st.error, 'tint'),
    'debugExceptionWidget.border': st.error,
    'debugToolBar.background': s.surfaceRaised,
    'debugToolBar.border': s.borderStrong,
    'editor.stackFrameHighlightBackground': overlay(st.warning, 'wash'),
    'editor.focusedStackFrameHighlightBackground': overlay(st.success, 'wash'),
    'editor.inlineValuesForeground': x.secondary,
    'editor.inlineValuesBackground': rowHover,
    'debugView.exceptionLabelForeground': x.white,
    'debugView.exceptionLabelBackground': overlay(st.error, 'faint'),
    'debugView.stateLabelForeground': x.normal,
    'debugView.stateLabelBackground': s.border,
    'debugView.valueChangedHighlight': overlay(st.info, 'soft'),
    'debugTokenExpression.name': k.property,
    'debugTokenExpression.value': x.normal,
    'debugTokenExpression.string': k.string,
    'debugTokenExpression.boolean': k.keyword,
    'debugTokenExpression.number': k.number,
    'debugTokenExpression.error': st.error,
    'debugTokenExpression.type': k.type,
    'debugIcon.breakpointForeground': st.error,
    'debugIcon.breakpointDisabledForeground': x.muted,
    'debugIcon.breakpointUnverifiedForeground': x.muted,
    'debugIcon.breakpointCurrentStackframeForeground': st.warning,
    'debugIcon.breakpointStackframeForeground': st.success,
    'debugIcon.startForeground': st.success,
    'debugIcon.pauseForeground': st.info,
    'debugIcon.stopForeground': st.error,
    'debugIcon.disconnectForeground': st.error,
    'debugIcon.restartForeground': st.success,
    'debugIcon.stepOverForeground': st.info,
    'debugIcon.stepIntoForeground': st.info,
    'debugIcon.stepOutForeground': st.info,
    'debugIcon.continueForeground': st.info,
    'debugIcon.stepBackForeground': st.info,
    'debugConsole.infoForeground': st.info,
    'debugConsole.warningForeground': st.warning,
    'debugConsole.errorForeground': st.error,
    'debugConsole.sourceForeground': x.secondary,
    'debugConsoleInputIcon.foreground': st.active,
    'testing.runAction': st.success,
    'testing.iconFailed': st.error,
    'testing.iconErrored': st.error,
    'testing.iconPassed': st.success,
    'testing.iconQueued': st.warning,
    'testing.iconUnset': x.muted,
    'testing.iconSkipped': x.muted,
    'testing.iconFailed.retired': derive.inactive(st.error),
    'testing.iconErrored.retired': derive.inactive(st.error),
    'testing.iconPassed.retired': derive.inactive(st.success),
    'testing.iconQueued.retired': derive.inactive(st.warning),
    'testing.iconUnset.retired': derive.inactive(x.muted),
    'testing.iconSkipped.retired': derive.inactive(x.muted),
    'testing.peekBorder': st.error,
    'testing.peekHeaderBackground': overlay(st.error, 'tint'),
    'testing.messagePeekBorder': st.info,
    'testing.messagePeekHeaderBackground': overlay(st.info, 'tint'),
    'testing.message.error.lineBackground': overlay(st.error, 'tint'),
    'testing.message.error.badgeBackground': st.error,
    'testing.message.error.badgeBorder': st.error,
    'testing.message.error.badgeForeground': s.background,
    'testing.message.info.decorationForeground': x.muted,
    'testing.coveredBackground': overlay(st.success, 'tint'),
    'testing.coveredBorder': overlay(st.success, 'faint'),
    'testing.coveredGutterBackground': overlay(st.success, 'tint'),
    'testing.uncoveredBackground': overlay(st.error, 'wash'),
    'testing.uncoveredBorder': overlay(st.error, 'faint'),
    'testing.uncoveredGutterBackground': overlay(st.error, 'wash'),
    'testing.uncoveredBranchBackground': overlay(st.error, 'faint'),
    'testing.coverCountBadgeBackground': a.muted,
    'testing.coverCountBadgeForeground': a.on,
    'charts.foreground': x.normal,
    'charts.lines': s.borderStrong,
    'charts.red': chart.red,
    'charts.blue': chart.blue,
    'charts.yellow': chart.yellow,
    'charts.orange': chart.orange,
    'charts.green': chart.green,
    'charts.purple': chart.purple,
    'chart.line': a.base,
    'chart.axis': s.borderStrong,
    'chart.guide': s.border,
  };

  const tokenColors = [
    {
      name: "Comentários",
      scope: [
        "comment",
        "punctuation.definition.comment",
      ],
      settings: { foreground: x.muted, fontStyle: "italic" },
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
      settings: { foreground: k.keyword, fontStyle: "bold italic" },
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
      settings: { foreground: k.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Constantes de linguagem (true/false/null/undefined/this/self)",
      scope: [
        "constant.language",
        "variable.language.this",
        "variable.language.self",
        "variable.language.super",
      ],
      settings: { foreground: k.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Strings",
      scope: [
        "string",
        "string.quoted",
        "string.template",
      ],
      settings: { foreground: k.string },
    },
    {
      name: "Sequências de escape dentro de strings",
      scope: [
        "constant.character.escape",
        "constant.character.escape.backslash",
      ],
      settings: { foreground: k.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Interpolação de strings (marcadores ${} #{} $())",
      scope: [
        "punctuation.definition.template-expression",
        "punctuation.section.embedded",
      ],
      settings: { foreground: k.keyword },
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
      settings: { foreground: k.keyword, fontStyle: "" },
    },
    {
      name: "Números",
      scope: ["constant.numeric"],
      settings: { foreground: k.number },
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
      settings: { foreground: k.operator, fontStyle: "" },
    },
    {
      name: "Métodos e funções - declaração",
      scope: [
        "entity.name.function",
        "meta.function.declaration entity.name.function",
        "meta.definition.method entity.name.function",
      ],
      settings: { foreground: k.function, fontStyle: "bold" },
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
      settings: { foreground: k.function, fontStyle: "" },
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
      settings: { foreground: k.type, fontStyle: "bold" },
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
      settings: { foreground: k.function, fontStyle: "bold" },
    },
    {
      name: "Function Components (JSX/TSX) - mesmo tratamento visual de classes",
      scope: [
        "support.class.component",
        "entity.name.function.component",
      ],
      settings: { foreground: k.type, fontStyle: "bold" },
    },
    {
      name: "Records e Structs (mesma regra de classes, apenas o nome do tipo)",
      scope: [
        "entity.name.type.record",
        "entity.name.type.struct",
      ],
      settings: { foreground: k.type, fontStyle: "bold" },
    },
    {
      name: "Classes/records/structs estáticos - apenas itálico, sem negrito (fallback léxico; ver semanticTokenColors para cobertura em qualquer ponto de uso)",
      scope: [
        "entity.name.class.static",
        "meta.class.static entity.name.class",
      ],
      settings: { foreground: k.type, fontStyle: "italic" },
    },
    {
      name: "Interfaces e Enums (mesma cor, apenas o nome do tipo)",
      scope: [
        "entity.name.type.interface",
        "entity.name.type.enum",
        "entity.other.inherited-class.interface",
        "meta.interface",
      ],
      settings: { foreground: k.interface, fontStyle: "" },
    },
    {
      name: "Valores de enum (cor diferenciada)",
      scope: [
        "variable.other.enummember",
        "constant.other.enum",
        "entity.name.variable.enum-member",
      ],
      settings: { foreground: k.enumMember },
    },
    {
      name: "Variáveis locais",
      scope: [
        "variable",
        "variable.other.readwrite",
        "variable.other.local",
        "meta.definition.variable variable.other",
      ],
      settings: { foreground: k.variable, fontStyle: "" },
    },
    {
      name: "Parâmetros de métodos - sempre itálico",
      scope: [
        "variable.parameter",
        "variable.parameter.function",
        "meta.parameter",
        "variable.other.parameter",
      ],
      settings: { foreground: k.variable, fontStyle: "italic" },
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
      settings: { foreground: k.property, fontStyle: "" },
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
      settings: { foreground: k.generic, fontStyle: "" },
    },
    {
      name: "Decoradores / Atributos (JS, TS, Python, C#)",
      scope: [
        "meta.decorator",
        "punctuation.decorator",
        "entity.name.function.decorator",
        "meta.attribute",
      ],
      settings: { foreground: k.number, fontStyle: "italic" },
    },
    {
      name: "Tipos primitivos",
      scope: [
        "support.type",
        "storage.type.primitive",
        "entity.name.type.primitive",
      ],
      settings: { foreground: k.type, fontStyle: "" },
    },
    {
      name: "PowerShell - Variáveis ($var)",
      scope: [
        "variable.other.readwrite.powershell",
        "punctuation.definition.variable.powershell",
      ],
      settings: { foreground: k.variable },
    },
    {
      name: "PowerShell - Cmdlets",
      scope: [
        "support.function.powershell",
        "entity.name.function.powershell",
      ],
      settings: { foreground: k.function },
    },
    {
      name: "PowerShell - Parâmetros (-Param)",
      scope: ["variable.parameter.powershell"],
      settings: { foreground: k.variable, fontStyle: "italic" },
    },
    {
      name: "Markdown - Cabeçalhos",
      scope: [
        "markup.heading",
        "entity.name.section.markdown",
      ],
      settings: { foreground: k.type, fontStyle: "bold" },
    },
    {
      name: "Markdown - Negrito",
      scope: ["markup.bold"],
      settings: { foreground: x.normal, fontStyle: "bold" },
    },
    {
      name: "Markdown - Itálico",
      scope: ["markup.italic"],
      settings: { foreground: x.normal, fontStyle: "italic" },
    },
    {
      name: "Markdown - Links",
      scope: [
        "string.other.link",
        "markup.underline.link",
      ],
      settings: { foreground: k.function, fontStyle: "underline" },
    },
    {
      name: "Markdown - Código inline/bloco",
      scope: [
        "markup.inline.raw",
        "markup.fenced_code.block",
      ],
      settings: { foreground: k.enumMember },
    },
    {
      name: "Markdown - Citação",
      scope: ["markup.quote"],
      settings: { foreground: x.muted, fontStyle: "italic" },
    },
    {
      name: "JSON - Chaves (keys)",
      scope: ["support.type.property-name.json"],
      settings: { foreground: k.property },
    },
    {
      name: "JSON - Valores string",
      scope: ["string.quoted.double.json"],
      settings: { foreground: k.string },
    },
    {
      name: "JSON - Constantes (true/false/null)",
      scope: ["constant.language.json"],
      settings: { foreground: k.keyword, fontStyle: "bold italic" },
    },
    {
      name: "Tags/atributos genéricos de markup",
      scope: ["entity.other.attribute-name"],
      settings: { foreground: k.property, fontStyle: "italic" },
    },
  ];

  const semanticTokenColors = {
    class: { foreground: k.type, fontStyle: "bold" },
    'class.static': { foreground: k.type, fontStyle: "italic" },
    'class.sealed': { foreground: k.type, fontStyle: "bold" },
    delegate: { foreground: k.function, fontStyle: "bold" },
    struct: { foreground: k.type, fontStyle: "bold" },
    'struct.static': { foreground: k.type, fontStyle: "italic" },
    interface: { foreground: k.interface, fontStyle: "" },
    enum: { foreground: k.interface, fontStyle: "" },
    enumMember: { foreground: k.enumMember, fontStyle: "" },
    typeParameter: { foreground: k.generic, fontStyle: "" },
    type: { foreground: k.type, fontStyle: "" },
    method: { foreground: k.function, fontStyle: "" },
    'method.declaration': { foreground: k.function, fontStyle: "bold" },
    'method.definition': { foreground: k.function, fontStyle: "bold" },
    'method.static': { foreground: k.function, fontStyle: "italic" },
    'method.declaration.static': { foreground: k.function, fontStyle: "bold italic" },
    'method.static.declaration': { foreground: k.function, fontStyle: "bold italic" },
    function: { foreground: k.function, fontStyle: "" },
    'function.declaration': { foreground: k.function, fontStyle: "bold" },
    'function.definition': { foreground: k.function, fontStyle: "bold" },
    parameter: { foreground: k.variable, fontStyle: "italic" },
    'variable:typescript': { foreground: k.variable, fontStyle: "" },
    'variable:typescriptreact': { foreground: k.variable, fontStyle: "" },
    'variable:javascript': { foreground: k.variable, fontStyle: "" },
    'variable:javascriptreact': { foreground: k.variable, fontStyle: "" },
    'variable.static': { foreground: k.property, fontStyle: "italic" },
    property: { foreground: k.property, fontStyle: "" },
    'property.static': { foreground: k.property, fontStyle: "italic" },
    'property.readonly': { foreground: k.property, fontStyle: "" },
    'property.readonly.static': { foreground: k.property, fontStyle: "italic" },
    '*.readonly:csharp': { foreground: k.property },
    namespace: { foreground: x.normal, fontStyle: "" },
    operator: { foreground: k.operator, fontStyle: "" },
    keyword: { foreground: k.keyword, fontStyle: "bold italic" },
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
 * text, and holding it to a text contrastRatio ratio would only force it brighter
 * than the theme wants it.
 */
const TOKENS = [
  'variable', 'property', 'operator', 'keyword',
  'string', 'func', 'type', 'iface', 'number', 'enumMember',
] as const;

/** Chrome text: the workbench, not the code. */
const UI_TEXT = ['fg', 'fgDim', 'fgBright', 'fgMuted'] as const;

/*
 * The controls that have interaction states, and the IDs each state is drawn
 * with. `ground` is what the control sits on; `rest` is the control's own
 * ground when it has one (a button, an inactive tab), and the ground when it
 * does not (a row). Every state is composited over the ground, because that is
 * how VS Code paints it — a hovered tab replaces the tab's own ground rather
 * than sitting on top of it. `marks` names the states that also draw
 * something in a channel of its own — the focus ring, the active tab's rule —
 * which tells them apart whatever their grounds do.
 *
 * `accent` controls are filled with the accent at rest, so the accent may
 * appear in their states. `recedes` marks the ones whose hover moves toward
 * the ground rather than away from it (STATES.hover says why), which exempts
 * them from the order check and nothing else.
 */
type StateKey = 'hover' | 'focus' | 'active' | 'selected' | 'selectedInactive' | 'on' | 'prominent';
type Control = {
  name: string;
  ground: string;
  rest?: string;
  states: Partial<Record<StateKey, string>>;
  marks?: Partial<Record<StateKey, string>>;
  accent?: boolean;
  recedes?: boolean;
};

const CONTROLS: Control[] = [
  {
    name: 'side-bar list',
    ground: 'sideBar.background',
    states: {
      hover: 'list.hoverBackground',
      focus: 'list.focusBackground',
      selected: 'list.activeSelectionBackground',
      selectedInactive: 'list.inactiveSelectionBackground',
    },
    marks: { focus: 'list.focusOutline', selected: 'list.focusOutline' },
  },
  { name: 'quick pick', ground: 'quickInput.background', states: { hover: 'list.hoverBackground', focus: 'quickInputList.focusBackground' } },
  { name: 'suggest list', ground: 'editorSuggestWidget.background', states: { hover: 'list.hoverBackground', selected: 'editorSuggestWidget.selectedBackground' } },
  { name: 'action list', ground: 'editorActionList.background', states: { hover: 'list.hoverBackground', focus: 'editorActionList.focusBackground' } },
  { name: 'menu', ground: 'menu.background', states: { hover: 'menu.selectionBackground' } },
  { name: 'menu bar', ground: 'titleBar.activeBackground', states: { hover: 'menubar.selectionBackground' } },
  {
    name: 'toolbar in the side bar',
    ground: 'sideBar.background',
    states: { hover: 'toolbar.hoverBackground', active: 'toolbar.activeBackground', on: 'actionBar.toggledBackground' },
  },
  {
    name: 'toolbar in a widget',
    ground: 'editorWidget.background',
    states: { hover: 'toolbar.hoverBackground', active: 'toolbar.activeBackground', on: 'actionBar.toggledBackground' },
  },
  { name: 'input toggle', ground: 'input.background', states: { hover: 'inputOption.hoverBackground', on: 'inputOption.activeBackground' } },
  { name: 'radio', ground: 'editorWidget.background', states: { hover: 'radio.inactiveHoverBackground', on: 'radio.activeBackground' } },
  {
    name: 'tab',
    ground: 'editorGroupHeader.tabsBackground',
    rest: 'tab.inactiveBackground',
    states: { hover: 'tab.hoverBackground', selected: 'tab.activeBackground' },
    marks: { selected: 'tab.activeBorderTop' },
  },
  {
    // Tabs selected alongside the active one. In the modern layout the active
    // tab is the editor's own ground, joined to it, so these are the only tabs
    // whose selection is a ground — and the one a hovered tab is set against.
    name: 'multi-selected tab',
    ground: 'editorGroupHeader.tabsBackground',
    rest: 'tab.inactiveBackground',
    states: { hover: 'tab.hoverBackground', selected: 'tab.selectedBackground' },
  },
  {
    name: 'modern editor tab',
    ground: 'editorGroupHeader.tabsBackground',
    states: { hover: 'modernEditorTab.hoverBackground', selected: 'modernEditorTab.activeBackground' },
  },
  { name: 'modern tab', ground: 'panel.background', states: { hover: 'modernTab.hoverBackground', selected: 'modernTab.activeBackground' } },
  {
    name: 'modern activity bar',
    ground: 'modernActivityBar.background',
    states: { hover: 'modernActivityBarItem.hoverBackground', selected: 'modernActivityBarItem.activeBackground' },
  },
  {
    name: 'status-bar item',
    ground: 'statusBar.background',
    states: {
      hover: 'statusBarItem.hoverBackground',
      focus: 'statusBar.background',
      active: 'statusBarItem.activeBackground',
      prominent: 'statusBarItem.prominentBackground',
    },
    marks: { focus: 'statusBarItem.focusBorder' },
  },
  {
    name: 'prominent status-bar item',
    ground: 'statusBar.background',
    rest: 'statusBarItem.prominentBackground',
    states: { hover: 'statusBarItem.prominentHoverBackground' },
    accent: true,
  },
  {
    name: 'remote status-bar item',
    ground: 'statusBar.background',
    rest: 'statusBarItem.remoteBackground',
    states: { hover: 'statusBarItem.remoteHoverBackground' },
    accent: true,
  },
  { name: 'error status-bar item', ground: 'statusBar.background', rest: 'statusBarItem.errorBackground', states: { hover: 'statusBarItem.errorHoverBackground' } },
  { name: 'warning status-bar item', ground: 'statusBar.background', rest: 'statusBarItem.warningBackground', states: { hover: 'statusBarItem.warningHoverBackground' } },
  { name: 'button', ground: 'editorWidget.background', rest: 'button.background', states: { hover: 'button.hoverBackground' }, accent: true, recedes: true },
  {
    name: 'secondary button',
    ground: 'editorWidget.background',
    rest: 'button.secondaryBackground',
    states: { hover: 'button.secondaryHoverBackground' },
  },
  {
    name: 'prominent extension button',
    ground: 'editorWidget.background',
    rest: 'extensionButton.prominentBackground',
    states: { hover: 'extensionButton.prominentHoverBackground' },
    accent: true,
    recedes: true,
  },
  { name: 'command center', ground: 'titleBar.activeBackground', rest: 'commandCenter.background', states: { hover: 'commandCenter.activeBackground' } },
  {
    name: 'Settings row',
    ground: 'editor.background',
    states: { hover: 'settings.rowHoverBackground', focus: 'settings.focusedRowBackground' },
    marks: { focus: 'settings.focusedRowBorder' },
  },
  { name: 'welcome tile', ground: 'editor.background', rest: 'welcomePage.tileBackground', states: { hover: 'welcomePage.tileHoverBackground' } },
  {
    name: 'scrollbar',
    ground: 'editor.background',
    rest: 'scrollbarSlider.background',
    states: { hover: 'scrollbarSlider.hoverBackground', active: 'scrollbarSlider.activeBackground' },
    accent: true,
  },
  {
    name: 'minimap slider',
    ground: 'minimap.background',
    rest: 'minimapSlider.background',
    states: { hover: 'minimapSlider.hoverBackground', active: 'minimapSlider.activeBackground' },
    accent: true,
  },
  {
    // The hovered line is painted over the sticky widget, not the editor.
    name: 'sticky scroll line',
    ground: 'editorStickyScroll.background',
    states: { hover: 'editorStickyScrollHover.background' },
  },
  {
    name: 'terminal sticky scroll line',
    ground: 'terminalStickyScroll.background',
    states: { hover: 'terminalStickyScrollHover.background' },
  },
  {
    name: 'notebook cell',
    ground: 'notebook.editorBackground',
    states: { focus: 'notebook.editorBackground', selected: 'notebook.selectedCellBackground' },
    marks: { focus: 'notebook.focusedCellBorder' },
  },
  {
    // A request bubble under the pointer replaces its own ground, as a tab does.
    name: 'chat request bubble',
    ground: 'sideBar.background',
    rest: 'chat.requestBubbleBackground',
    states: { hover: 'chat.requestBubbleHoverBackground' },
  },
  { name: 'New Session button', ground: 'agents.background', states: { hover: 'agentsNewSessionButton.hoverBackground' } },
];

/** The pairs of states that must never be mistaken for each other. */
const DISTINCT: [StateKey, StateKey][] = [
  ['hover', 'focus'],
  ['hover', 'active'],
  ['hover', 'selected'],
  ['hover', 'selectedInactive'],
  ['hover', 'on'],
  ['focus', 'active'],
  ['active', 'selected'],
  ['active', 'on'],
  ['hover', 'prominent'],
  ['active', 'prominent'],
];

/** The states that must be further from rest than hover is. */
const STRONGER_THAN_HOVER: StateKey[] = ['active', 'selected', 'selectedInactive'];

/** The outlines that mean keyboard focus, and nothing else may look like. */
const FOCUS_RINGS = [
  'focusBorder',
  'list.focusOutline',
  'statusBar.focusBorder',
  'statusBarItem.focusBorder',
  'settings.focusedRowBorder',
  'notebook.focusedCellBorder',
  'notebook.focusedEditorBorder',
  'editorGroup.focusedEmptyBorder',
  'inlineChatInput.focusBorder',
  'agentsChatInput.focusBorder',
  'interactive.activeCodeBorder',
];

/** Rims of controls that are on, which must not look like a focus ring. */
const NOT_FOCUS = ['inputOption.activeBorder', 'radio.activeBorder'];

/** The smallest ΔE (tools/color.ts) at which two grounds read as two states. */
const STATE_FLOOR = 3;

/*
 * 11. Every control's states can be told apart, in the order STATES promises.
 *
 * Four things, per control and per family. Every state differs from rest by
 * STATE_FLOOR, or draws a mark. The pairs in DISTINCT differ from each other
 * by the same floor, unless one of them has a mark and the other does not. Hover is the weakest step: pressing and selecting are further from
 * rest than it is. And hover, pressing and selecting stay off the accent,
 * except on a control that is filled with it.
 *
 * Then focus itself: every focus ring is `state.focus`, solid, and reads at
 * 3:1 — WCAG's floor for anything that is not text — on every surface it can
 * be drawn over (`borderStrong` is a line beside it, not a ground under it);
 * and nothing that means "on" borrows its colour.
 */
const checkStates = (family: Family, t: Tokens, c: Record<string, string>): string[] => {
  const problems: string[] = [];
  const bg: string = t.surface.background;
  const accents: Set<string> = new Set([t.accent.base, t.accent.muted]);

  for (const control of CONTROLS) {
    const ids: string[] = [control.ground, control.rest, ...Object.values(control.states), ...Object.values(control.marks ?? {})].filter(
      (id): id is string => id !== undefined
    );
    const missing: string[] = ids.filter((id) => !c[id]);
    if (missing.length) {
      problems.push(`${family}: ${control.name} names ${missing.join(', ')}, which the theme does not set`);
      continue;
    }
    const ground: string = over(c[control.ground], bg);
    const rest: string = control.rest ? over(c[control.rest], ground) : ground;
    const paint = (s: StateKey): string => over(c[control.states[s]!], ground);
    const marked = (s: StateKey): boolean => control.marks?.[s] !== undefined;
    const present: StateKey[] = Object.keys(control.states) as StateKey[];
    const where = `${family}: ${control.name}`;

    for (const s of present) {
      const d: number = deltaE(paint(s), rest);
      if (d < STATE_FLOOR && !marked(s)) problems.push(`${where} — ${s} is ${d.toFixed(1)} ΔE from rest, under ${STATE_FLOOR}`);
    }
    for (const [a, b] of DISTINCT) {
      if (!present.includes(a) || !present.includes(b) || marked(a) !== marked(b)) continue;
      const d: number = deltaE(paint(a), paint(b));
      if (d < STATE_FLOOR) problems.push(`${where} — ${a} and ${b} are ${d.toFixed(1)} ΔE apart, under ${STATE_FLOOR}`);
    }
    if (present.includes('hover') && !control.recedes) {
      const hover: number = deltaE(paint('hover'), rest);
      for (const s of STRONGER_THAN_HOVER.filter((s) => present.includes(s))) {
        const d: number = deltaE(paint(s), rest);
        if (d <= hover) problems.push(`${where} — ${s} (${d.toFixed(1)} ΔE) is no stronger than hover (${hover.toFixed(1)})`);
      }
    }
    if (!control.accent) {
      for (const s of (['hover', 'active', 'selected', 'selectedInactive'] as const).filter((s) => present.includes(s))) {
        const id: string = control.states[s]!;
        if (accents.has(c[id].slice(0, 7))) problems.push(`${where} — ${s} (${id}) is the accent; hover, pressing and selection stay on the surface ladder`);
      }
    }
  }

  const surfaces: [string, string][] = flatten(t).filter(([name]) => name.startsWith('surface.') && name !== 'surface.borderStrong');
  for (const id of FOCUS_RINGS) {
    if (c[id] !== t.state.focus) problems.push(`${family}: ${id} is ${c[id]}, not the solid focus colour ${t.state.focus}`);
  }
  for (const [name, colour] of surfaces) {
    const got: number = contrastRatio(t.state.focus, colour);
    if (got < 3) problems.push(`${family}: the focus ring reads at ${got.toFixed(2)}:1 on ${name}, under 3:1`);
  }
  for (const id of NOT_FOCUS) {
    if (c[id]?.slice(0, 7) === t.state.focus) problems.push(`${family}: ${id} is the focus colour, so a control that is on looks focused`);
  }
  return problems;
};

/* -------------------------------------------------------------- *
 * Diagnostics
 * -------------------------------------------------------------- */

const DIAGNOSTICS = ['error', 'warning', 'info', 'hint', 'success'] as const;
type Diagnostic = (typeof DIAGNOSTICS)[number];

/*
 * Every ID that means one of the diagnostics, wherever VS Code draws it: the
 * squiggle, the ruler, the minimap, the Problems view, the file in the
 * explorer, the input under validation, the marker widget, the debug console,
 * the test result, the notification, the status bar, and the terminal — its
 * red, yellow, green, blue and cyan, and the mark beside a command that failed
 * or passed. Check 12 holds each to
 * its token, solid or at a ladder step, so an error is one colour from the
 * editor to the test explorer rather than whatever each surface's default was.
 */
const DIAGNOSTIC_IDS: Record<Diagnostic, string[]> = {
  error: [
    'errorForeground',
    'editorError.foreground',
    'editorOverviewRuler.errorForeground',
    'minimap.errorHighlight',
    'problemsErrorIcon.foreground',
    'list.errorForeground',
    'listFilterWidget.noMatchesOutline',
    'inputValidation.errorBorder',
    'editorMarkerNavigationError.background',
    'editorMarkerNavigationError.headerBackground',
    'notificationsErrorIcon.foreground',
    'activityErrorBadge.background',
    'statusBarItem.errorBackground',
    'gauge.errorForeground',
    'debugExceptionWidget.background',
    'debugExceptionWidget.border',
    'debugView.exceptionLabelBackground',
    'debugTokenExpression.error',
    'debugConsole.errorForeground',
    'debugIcon.breakpointForeground',
    'debugIcon.stopForeground',
    'testing.iconFailed',
    'testing.iconErrored',
    'testing.peekBorder',
    'testing.message.error.lineBackground',
    'testing.message.error.badgeBackground',
    'testing.uncoveredBackground',
    'testing.uncoveredGutterBackground',
    'terminal.ansiRed',
    'terminalCommandDecoration.errorBackground',
  ],
  warning: [
    'editorWarning.foreground',
    'editorOverviewRuler.warningForeground',
    'minimap.warningHighlight',
    'problemsWarningIcon.foreground',
    'list.warningForeground',
    'inputValidation.warningBorder',
    'editorMarkerNavigationWarning.background',
    'notificationsWarningIcon.foreground',
    'activityWarningBadge.background',
    'statusBarItem.warningBackground',
    'gauge.warningForeground',
    'debugConsole.warningForeground',
    'editorUnicodeHighlight.border',
    'editor.stackFrameHighlightBackground',
    'debugIcon.breakpointCurrentStackframeForeground',
    'testing.iconQueued',
    'terminal.ansiYellow',
  ],
  info: [
    'editorInfo.foreground',
    'editorOverviewRuler.infoForeground',
    'minimap.infoHighlight',
    'problemsInfoIcon.foreground',
    'inputValidation.infoBorder',
    'editorMarkerNavigationInfo.background',
    'notificationsInfoIcon.foreground',
    'banner.iconForeground',
    'debugConsole.infoForeground',
    'testing.messagePeekBorder',
    'editorLightBulbAutoFix.foreground',
    'terminal.ansiBlue',
  ],
  hint: ['editorHint.foreground', 'editorLightBulb.foreground', 'editorLightBulbAi.foreground', 'terminal.ansiCyan'],
  success: [
    'testing.iconPassed',
    'testing.runAction',
    'testing.coveredBackground',
    'testing.coveredGutterBackground',
    'notebookStatusSuccessIcon.foreground',
    'editor.focusedStackFrameHighlightBackground',
    'debugIcon.breakpointStackframeForeground',
    'debugIcon.startForeground',
    'terminal.ansiGreen',
    'terminalCommandDecoration.successBackground',
    'ports.iconRunningProcessForeground',
  ],
};

/** Grounds painted behind whole lines of code while debugging or testing. */
const TINTED_LINES = [
  'editor.stackFrameHighlightBackground',
  'editor.focusedStackFrameHighlightBackground',
  'testing.message.error.lineBackground',
  'testing.coveredBackground',
  'testing.uncoveredBackground',
  'debugExceptionWidget.background',
];

/** The inks that are written in the editor, for measuring what a diagnostic sits among. */
const CODE_INKS = ['variable', 'property', 'operator', 'keyword', 'generic', 'string', 'function', 'number', 'type', 'interface', 'enumMember'] as const;

/** How far (ΔE) the error and the warning keep from every code ink and the accent. */
const SIGNAL_CLEARANCE = 7;
/** How far the three squiggles keep from each other, in ΔE and in lightness alone. */
const SQUIGGLE_DISTANCE = 20;
const SQUIGGLE_LIGHTNESS = 0.05;

/*
 * 12. The diagnostics are one language, told apart by more than hue.
 *
 * Every ID in DIAGNOSTIC_IDS is its diagnostic's token. The error and the
 * warning are their own colours, so they are held clear of every ink the code
 * is written in and of the accent — a squiggle the colour of the word it
 * underlines is no squiggle, and an error the colour of the focus ring reads as
 * focus. Error, warning and info are the three squiggles, drawn in the same
 * wave, so they differ in lightness as well as in hue: someone who cannot tell
 * the hues apart still sees three weights. (Hints are dots, a shape of their
 * own.) Code stays legible on every line a debugger or a test run tints:
 * each ink at AA over the tint, and the tint itself visible against the
 * editor and against the cursor's line. And uncovered code is a heavier mark
 * than covered code, so coverage too reads without its hues.
 */
const checkDiagnostics = (family: Family, tokens: Tokens, colours: Record<string, string>): string[] => {
  const problems: string[] = [];
  const editorGround: string = tokens.surface.background;

  for (const diagnostic of DIAGNOSTICS) {
    for (const id of DIAGNOSTIC_IDS[diagnostic]) {
      const colour: string | undefined = colours[id];
      if (!colour) problems.push(`${family}: ${id} is not set, and it is a ${diagnostic}`);
      else if (colour.slice(0, 7) !== tokens.state[diagnostic]) {
        problems.push(`${family}: ${id} is ${colour}, not the ${diagnostic} colour ${tokens.state[diagnostic]}`);
      }
    }
  }

  const neighbours: [string, string][] = [
    ...CODE_INKS.map((ink): [string, string] => [ink, tokens.syntax[ink]]),
    ['accent', tokens.accent.base],
  ];
  for (const signal of ['error', 'warning'] as const) {
    for (const [neighbourName, neighbour] of neighbours) {
      const distance: number = deltaE(tokens.state[signal], neighbour);
      if (distance < SIGNAL_CLEARANCE) {
        problems.push(`${family}: ${signal} is ${distance.toFixed(1)} ΔE from ${neighbourName}, under ${SIGNAL_CLEARANCE}`);
      }
    }
  }

  const squiggles = ['error', 'warning', 'info'] as const;
  for (const [index, first] of squiggles.entries()) {
    for (const second of squiggles.slice(index + 1)) {
      const distance: number = deltaE(tokens.state[first], tokens.state[second]);
      const lightnessGap: number = Math.abs(oklchFromHex(tokens.state[first]).l - oklchFromHex(tokens.state[second]).l);
      if (distance < SQUIGGLE_DISTANCE) problems.push(`${family}: ${first} and ${second} are ${distance.toFixed(1)} ΔE apart, under ${SQUIGGLE_DISTANCE}`);
      if (lightnessGap < SQUIGGLE_LIGHTNESS) {
        problems.push(`${family}: ${first} and ${second} differ by ${lightnessGap.toFixed(3)} in lightness — told apart by hue alone`);
      }
    }
  }

  // The type parameters are left out, as check 2 leaves them out: they sit
  // under AA on the bare editor by design, the one ink told apart by darkness.
  const readInks: [string, string][] = [
    ...neighbours.filter(([inkName]) => inkName !== 'accent' && inkName !== 'generic'),
    ['foreground', tokens.text.normal],
  ];
  for (const id of TINTED_LINES) {
    const tint: string = over(colours[id], editorGround);
    for (const [inkName, ink] of readInks) {
      const ratio: number = contrastRatio(ink, tint);
      if (ratio < 4.5) problems.push(`${family}: ${inkName} reads at ${ratio.toFixed(2)}:1 on ${id}, under AA`);
    }
    for (const [groundName, ground] of [['editor', editorGround], ['current line', over(colours['editor.lineHighlightBackground'], editorGround)]]) {
      const distance: number = deltaE(tint, ground);
      if (distance < STATE_FLOOR) problems.push(`${family}: ${id} is ${distance.toFixed(1)} ΔE from the ${groundName}, under ${STATE_FLOOR}`);
    }
  }

  // Coverage: what is not covered is what is looked for, so it is the heavier
  // mark — told from covered code by weight as well as by red against green.
  for (const part of ['Background', 'GutterBackground']) {
    const weight = (id: string): number => deltaE(over(colours[id], editorGround), editorGround);
    const covered: number = weight(`testing.covered${part}`);
    const uncovered: number = weight(`testing.uncovered${part}`);
    if (uncovered <= covered) {
      problems.push(`${family}: testing.uncovered${part} (${uncovered.toFixed(1)} ΔE) is no heavier than testing.covered${part} (${covered.toFixed(1)})`);
    }
  }
  return problems;
};

/* -------------------------------------------------------------- *
 * Editor intelligence
 * -------------------------------------------------------------- */

/** The symbol icons whose symbol the code also colours, and the semantic rule it is coloured by. */
const SYMBOL_SEMANTICS: Record<string, string> = {
  class: 'class',
  struct: 'struct',
  interface: 'interface',
  enumerator: 'enum',
  enumeratorMember: 'enumMember',
  typeParameter: 'typeParameter',
  function: 'function',
  method: 'method',
  property: 'property',
  variable: 'variable:typescript',
  namespace: 'namespace',
  operator: 'operator',
  keyword: 'keyword',
};

/*
 * Grounds a symbol icon keeps its colour on, each over the ground under it. A
 * focused or selected row is not one: VS Code repaints its icon in the row's
 * text colour, in the suggest list, the outline and the pickers alike.
 */
const SYMBOL_GROUNDS: [id: string, under: string][] = [
  ['editorSuggestWidget.background', 'editorSuggestWidget.background'],
  ['sideBar.background', 'sideBar.background'],
  ['quickInput.background', 'quickInput.background'],
  ['breadcrumb.background', 'breadcrumb.background'],
  ['breadcrumbPicker.background', 'breadcrumbPicker.background'],
];

/*
 * Everything the editor paints behind code to point at it — the selection and
 * its echoes, find, the word under the cursor, a revealed range, a snippet's
 * stop, a folded line, linked editing. Code has to stay legible on each, and
 * each has to show against the editor.
 */
const EDITOR_HIGHLIGHTS = [
  'editor.selectionBackground',
  'editor.selectionHighlightBackground',
  'editor.wordHighlightBackground',
  'editor.wordHighlightStrongBackground',
  'editor.wordHighlightTextBackground',
  'editor.hoverHighlightBackground',
  'editor.findMatchBackground',
  'editor.findMatchHighlightBackground',
  'editor.findRangeHighlightBackground',
  'editor.rangeHighlightBackground',
  'editor.symbolHighlightBackground',
  'editor.linkedEditingBackground',
  'editor.snippetTabstopHighlightBackground',
  'editor.foldBackground',
  'editorBracketMatch.background',
  'peekViewEditor.matchHighlightBackground',
] as const;

/** Highlights that appear together and have to be told apart where they do. */
const HIGHLIGHT_PAIRS: [string, string][] = [
  ['editor.findMatchBackground', 'editor.findMatchHighlightBackground'],
  ['editor.findMatchBackground', 'editor.selectionBackground'],
  ['editor.wordHighlightBackground', 'editor.wordHighlightStrongBackground'],
  ['editor.selectionBackground', 'editor.selectionHighlightBackground'],
  ['editor.selectionBackground', 'editor.wordHighlightBackground'],
  ['editor.findMatchHighlightBackground', 'editor.findRangeHighlightBackground'],
];

/** The inlay-hint pairs: each foreground on its chip. */
const INLAY_HINTS: [foreground: string, background: string][] = [
  ['editorInlayHint.foreground', 'editorInlayHint.background'],
  ['editorInlayHint.typeForeground', 'editorInlayHint.typeBackground'],
  ['editorInlayHint.parameterForeground', 'editorInlayHint.parameterBackground'],
];

/** The floor at which auxiliary text still reads: WCAG's 3:1 for large or incidental text. */
const AUXILIARY_FLOOR = 3;

/*
 * 13. Auxiliary information is secondary, and never disappears.
 *
 * Symbol icons are the syntax inks of the symbols they stand for — a class is
 * the class colour in the suggest list, the outline, the breadcrumbs and the
 * symbol picker — and each reads at 3:1 on every ground it keeps its colour
 * on. Inlay hints sit below the code: their text
 * reads at 3:1 on the chip, on the editor and on the cursor's line, and never
 * as strongly as body text does. Every highlight the editor paints behind code
 * keeps each code ink at AA and shows against the editor, and the highlights
 * that meet — the current match among the others, the selection among its
 * echoes — are told apart.
 */
const checkEditorIntelligence = (family: Family, tokens: Tokens, colours: Record<string, string>): string[] => {
  const problems: string[] = [];
  const editorGround: string = tokens.surface.background;
  const semantic = themeFor(family, tokens).semanticTokenColors as Record<string, { foreground?: string }>;
  const composite = (id: string, under: string): string => over(colours[id], over(colours[under], editorGround));

  for (const [symbol, ink] of Object.entries(symbolInksFor(tokens))) {
    const id = `symbolIcon.${symbol}Foreground`;
    if (colours[id] !== ink) problems.push(`${family}: ${id} is ${colours[id]}, not ${ink}`);
    for (const [groundId, under] of SYMBOL_GROUNDS) {
      const ratio: number = contrastRatio(ink, composite(groundId, under));
      if (ratio < AUXILIARY_FLOOR) problems.push(`${family}: ${id} reads at ${ratio.toFixed(2)}:1 on ${groundId}, under ${AUXILIARY_FLOOR}:1`);
    }
  }
  for (const [symbol, rule] of Object.entries(SYMBOL_SEMANTICS)) {
    const written: string | undefined = semantic[rule]?.foreground;
    const drawn: string = colours[`symbolIcon.${symbol}Foreground`];
    if (written !== drawn) problems.push(`${family}: the ${symbol} icon is ${drawn}, but a ${symbol} is written in ${written}`);
  }

  const bodyText: number = contrastRatio(tokens.text.normal, editorGround);
  const currentLine: string = over(colours['editor.lineHighlightBackground'], editorGround);
  for (const [foreground, background] of INLAY_HINTS) {
    for (const [groundName, ground] of [['editor', editorGround], ['current line', currentLine]]) {
      const chip: string = over(colours[background], ground);
      const ratio: number = contrastRatio(over(colours[foreground], chip), chip);
      if (ratio < AUXILIARY_FLOOR) problems.push(`${family}: ${foreground} reads at ${ratio.toFixed(2)}:1 on its chip over the ${groundName}, under ${AUXILIARY_FLOOR}:1`);
      if (ratio >= bodyText) problems.push(`${family}: ${foreground} reads as strongly as body text (${ratio.toFixed(2)}:1), so a hint is not beneath the code`);
    }
  }

  const readInks: [string, string][] = [
    ...CODE_INKS.filter((ink) => ink !== 'generic').map((ink): [string, string] => [ink, tokens.syntax[ink]]),
    ['foreground', tokens.text.normal],
  ];
  for (const id of EDITOR_HIGHLIGHTS) {
    if (!colours[id]) {
      problems.push(`${family}: ${id} is not set`);
      continue;
    }
    const highlight: string = over(colours[id], editorGround);
    for (const [inkName, ink] of readInks) {
      const ratio: number = contrastRatio(ink, highlight);
      if (ratio < 4.5) problems.push(`${family}: ${inkName} reads at ${ratio.toFixed(2)}:1 on ${id}, under AA`);
    }
    const distance: number = deltaE(highlight, editorGround);
    if (distance < STATE_FLOOR) problems.push(`${family}: ${id} is ${distance.toFixed(1)} ΔE from the editor, under ${STATE_FLOOR}`);
  }
  for (const [first, second] of HIGHLIGHT_PAIRS) {
    const distance: number = deltaE(over(colours[first], editorGround), over(colours[second], editorGround));
    if (distance < STATE_FLOOR) problems.push(`${family}: ${first} and ${second} are ${distance.toFixed(1)} ΔE apart, under ${STATE_FLOOR}`);
  }
  return problems;
};

/* -------------------------------------------------------------- *
 * Terminal
 * -------------------------------------------------------------- */

/** The six ANSI colours that are hues, in the order a terminal numbers them. */
const ANSI_HUES = ['Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan'] as const;

/** Every ANSI colour paired with its bright partner. */
const ANSI_PAIRS: [normal: string, bright: string][] = [...ANSI_HUES, 'Black', 'White'].map((name: string): [string, string] => [
  `terminal.ansi${name}`,
  `terminal.ansiBright${name}`,
]);

/**
 * VS Code's own terminal magenta. Red, yellow, green, blue and cyan are the
 * diagnostics and check 12 holds them there; magenta is the one ANSI hue no
 * signal stands for, so it is held to the colour it is named after instead.
 */
const ANSI_MAGENTA_REFERENCE = '#BC3FBC';

/*
 * How far two ANSI hues keep apart: SEPARATION degrees round the wheel, and 5
 * ΔE as colours. The ΔE is low on purpose. Green and cyan are the strings and
 * the types, pastels at one lightness told apart by hue alone, and they come
 * out 6 ΔE apart in the code as in the terminal; the floor keeps them from
 * becoming one colour, and the degrees keep them from becoming one hue.
 */
const ANSI_DISTANCE = 5;
/** How far (ΔE) the marks beside a command keep apart: a few pixels each, told apart at a glance. */
const DECORATION_DISTANCE = 15;
/** How far a bright colour may turn from its normal partner, in degrees. */
const ANSI_BRIGHT_DRIFT = 15;

/** Highlights the terminal paints behind its output that appear together. */
const TERMINAL_HIGHLIGHT_PAIRS: [string, string][] = [
  ['terminal.findMatchBackground', 'terminal.findMatchHighlightBackground'],
  ['terminal.findMatchBackground', 'terminal.selectionBackground'],
  ['terminal.findMatchHighlightBackground', 'terminal.selectionBackground'],
  ['terminal.selectionBackground', 'terminal.inactiveSelectionBackground'],
];

/** The marks beside a command, which have to be told from the ground and from each other. */
const COMMAND_DECORATIONS = [
  'terminalCommandDecoration.defaultBackground',
  'terminalCommandDecoration.successBackground',
  'terminalCommandDecoration.errorBackground',
] as const;

/*
 * 14. The terminal is part of the theme, and its sixteen colours keep their names.
 *
 * Tools print errors in red, warnings in yellow and success in green whatever
 * theme is on, so those three, blue and cyan are the diagnostics (check 12
 * holds them to their tokens), and magenta lands within SIGNAL_TOLERANCE of
 * VS Code's own. The six hues are told apart in each row, in degrees and as
 * colours; each bright colour is its normal partner, lighter and within a few
 * degrees. Every colour but black reads at AA on the terminal — bright black,
 * the grey tools print what matters least in, at 3:1 — so VS Code's
 * minimum-contrast correction never has to repaint one; each but bright black
 * still reads at 3:1 under a selection, and white on black reads at AA where a
 * program paints black as a ground. The cursor is
 * the editor's, the block cursor's character reads on it, find and the
 * selection are told apart, and the marks beside a command show on the ground
 * and differ from each other.
 */
const checkTerminal = (family: Family, colours: Record<string, string>): string[] => {
  const problems: string[] = [];
  const terminalGround: string = colours['terminal.background'];
  const onGround = (id: string): string => over(colours[id], terminalGround);

  const magentaOff: number = Math.abs(signedHueDelta(oklchFromHex(ANSI_MAGENTA_REFERENCE).h, oklchFromHex(colours['terminal.ansiMagenta']).h));
  if (magentaOff > SIGNAL_TOLERANCE) {
    problems.push(`${family}: terminal.ansiMagenta is ${magentaOff.toFixed(0)}° from the magenta it is named for — the tolerance is ${SIGNAL_TOLERANCE}°`);
  }

  for (const prefix of ['terminal.ansi', 'terminal.ansiBright']) {
    for (const [index, first] of ANSI_HUES.entries()) {
      for (const second of ANSI_HUES.slice(index + 1)) {
        const [firstId, secondId]: [string, string] = [prefix + first, prefix + second];
        const distance: number = deltaE(colours[firstId], colours[secondId]);
        if (distance < ANSI_DISTANCE) problems.push(`${family}: ${firstId} and ${secondId} are ${distance.toFixed(1)} ΔE apart, under ${ANSI_DISTANCE}`);
        const degrees: number = Math.abs(signedHueDelta(oklchFromHex(colours[firstId]).h, oklchFromHex(colours[secondId]).h));
        if (degrees < SEPARATION) problems.push(`${family}: ${firstId} and ${secondId} are ${degrees.toFixed(0)}° apart, under ${SEPARATION}°`);
      }
    }
  }

  for (const [normal, bright] of ANSI_PAIRS) {
    const normalColour = oklchFromHex(colours[normal]);
    const brightColour = oklchFromHex(colours[bright]);
    if (brightColour.l <= normalColour.l) problems.push(`${family}: ${bright} is no lighter than ${normal}`);
    // Black, white and bright black are greys, whose hue is noise.
    if (normal.endsWith('Black') || normal.endsWith('White')) continue;
    const drift: number = Math.abs(signedHueDelta(normalColour.h, brightColour.h));
    if (drift > ANSI_BRIGHT_DRIFT) problems.push(`${family}: ${bright} turns ${drift.toFixed(0)}° from ${normal}, over ${ANSI_BRIGHT_DRIFT}°`);
  }

  const selection: string = onGround('terminal.selectionBackground');
  for (const id of ANSI_PAIRS.flat().filter((id: string): boolean => id !== 'terminal.ansiBlack')) {
    const recedes: boolean = id === 'terminal.ansiBrightBlack';
    const onTerminal: number = contrastRatio(colours[id], terminalGround);
    const floor: number = recedes ? AUXILIARY_FLOOR : 4.5;
    if (onTerminal < floor) problems.push(`${family}: ${id} reads at ${onTerminal.toFixed(2)}:1 on the terminal, under ${floor}:1`);
    // Bright black is the comment grey, which the editor does not hold to
    // anything under a selection either.
    if (recedes) continue;
    const onSelection: number = contrastRatio(colours[id], selection);
    if (onSelection < AUXILIARY_FLOOR) problems.push(`${family}: ${id} reads at ${onSelection.toFixed(2)}:1 under the selection, under ${AUXILIARY_FLOOR}:1`);
  }
  const whiteOnBlack: number = contrastRatio(colours['terminal.ansiWhite'], colours['terminal.ansiBlack']);
  if (whiteOnBlack < 4.5) problems.push(`${family}: white on black reads at ${whiteOnBlack.toFixed(2)}:1, under AA`);

  if (colours['terminalCursor.foreground'] !== colours['editorCursor.foreground']) {
    problems.push(`${family}: the terminal cursor is ${colours['terminalCursor.foreground']}, not the editor's ${colours['editorCursor.foreground']}`);
  }
  const cursor: number = contrastRatio(colours['terminalCursor.foreground'], terminalGround);
  if (cursor < 3) problems.push(`${family}: the terminal cursor reads at ${cursor.toFixed(2)}:1, under 3:1`);
  const underCursor: number = contrastRatio(colours['terminalCursor.background'], colours['terminalCursor.foreground']);
  if (underCursor < 4.5) problems.push(`${family}: the character under the block cursor reads at ${underCursor.toFixed(2)}:1, under AA`);

  for (const [first, second] of TERMINAL_HIGHLIGHT_PAIRS) {
    const distance: number = deltaE(onGround(first), onGround(second));
    if (distance < STATE_FLOOR) problems.push(`${family}: ${first} and ${second} are ${distance.toFixed(1)} ΔE apart, under ${STATE_FLOOR}`);
  }

  for (const [index, id] of COMMAND_DECORATIONS.entries()) {
    const ratio: number = contrastRatio(colours[id], terminalGround);
    if (ratio < 3) problems.push(`${family}: ${id} reads at ${ratio.toFixed(2)}:1 on the terminal, under 3:1`);
    for (const other of COMMAND_DECORATIONS.slice(index + 1)) {
      const distance: number = deltaE(colours[id], colours[other]);
      if (distance < DECORATION_DISTANCE) problems.push(`${family}: ${id} and ${other} are ${distance.toFixed(1)} ΔE apart, under ${DECORATION_DISTANCE}`);
    }
  }

  const suggestGround: string = over(colours['editorSuggestWidget.background'], terminalGround);
  const inlineSuggestion: number = contrastRatio(colours['terminalSymbolIcon.inlineSuggestionForeground'], suggestGround);
  if (inlineSuggestion < AUXILIARY_FLOOR) {
    problems.push(`${family}: terminalSymbolIcon.inlineSuggestionForeground reads at ${inlineSuggestion.toFixed(2)}:1 in the suggest widget, under ${AUXILIARY_FLOOR}:1`);
  }
  return problems;
};

/* -------------------------------------------------------------- *
 * Diff, merge and Git
 * -------------------------------------------------------------- */

type GitState = 'added' | 'modified' | 'deleted' | 'conflicting';

/*
 * Every ID that says one of the kinds of change, wherever VS Code draws it:
 * the file in the explorer and the Source Control view, the gutter bar, the
 * minimap, the overview ruler, the diff and merge editors, the history hover.
 * Check 15 holds each to its token, so a removal is one red from the explorer
 * to the diff. The colour says what kind of change it is; the letter Git puts
 * beside the file — U or A, M or R, staged or not — says the rest.
 */
const GIT_IDS: Record<GitState, string[]> = {
  added: [
    'gitDecoration.addedResourceForeground',
    'gitDecoration.untrackedResourceForeground',
    'editorGutter.addedBackground',
    'editorGutter.addedSecondaryBackground',
    'minimapGutter.addedBackground',
    'editorOverviewRuler.addedForeground',
    'diffEditor.insertedTextBackground',
    'diffEditor.insertedLineBackground',
    'diffEditorGutter.insertedLineBackground',
    'diffEditorOverview.insertedForeground',
    'mergeEditor.change.background',
    'mergeEditor.change.word.background',
    'scmGraph.historyItemHoverAdditionsForeground',
  ],
  modified: [
    'gitDecoration.modifiedResourceForeground',
    'gitDecoration.stageModifiedResourceForeground',
    'gitDecoration.renamedResourceForeground',
    'editorGutter.modifiedBackground',
    'editorGutter.modifiedSecondaryBackground',
    'minimapGutter.modifiedBackground',
    'editorOverviewRuler.modifiedForeground',
    'diffEditor.moveActive.border',
    'tab.activeModifiedBorder',
    'settings.modifiedItemIndicator',
  ],
  deleted: [
    'gitDecoration.deletedResourceForeground',
    'gitDecoration.stageDeletedResourceForeground',
    'editorGutter.deletedBackground',
    'editorGutter.deletedSecondaryBackground',
    'minimapGutter.deletedBackground',
    'editorOverviewRuler.deletedForeground',
    'diffEditor.removedTextBackground',
    'diffEditor.removedLineBackground',
    'diffEditorGutter.removedLineBackground',
    'diffEditorOverview.removedForeground',
    'mergeEditor.changeBase.background',
    'mergeEditor.changeBase.word.background',
    'scmGraph.historyItemHoverDeletionsForeground',
  ],
  conflicting: [
    'gitDecoration.conflictingResourceForeground',
    'mergeEditor.conflictingLines.background',
    'mergeEditor.conflict.unhandledFocused.border',
    'mergeEditor.conflict.unhandledUnfocused.border',
    'mergeEditor.conflict.unhandled.minimapOverViewRuler',
  ],
};

/** The signal each kind of change is: the roadmap's green, blue, red and amber. */
const GIT_SIGNAL: Record<GitState, Diagnostic> = {
  added: 'success',
  modified: 'info',
  deleted: 'error',
  conflicting: 'warning',
};

/*
 * How far (ΔE) the four kinds of change keep apart. Low on purpose, for the
 * reason ANSI_DISTANCE is: in the green and cyan families the added green is a
 * yellow-green and the conflict amber sits 9 or 10 ΔE from it. They still read
 * as two colours side by side, and each file carries its letter as well.
 */
const GIT_DISTANCE = 9;

/** The file names Git colours in the explorer; ignored files recede, the rest are read. */
const GIT_NAMES: [id: string, floor: number][] = [
  ['gitDecoration.addedResourceForeground', 4.5],
  ['gitDecoration.untrackedResourceForeground', 4.5],
  ['gitDecoration.modifiedResourceForeground', 4.5],
  ['gitDecoration.stageModifiedResourceForeground', 4.5],
  ['gitDecoration.renamedResourceForeground', 4.5],
  ['gitDecoration.deletedResourceForeground', 4.5],
  ['gitDecoration.stageDeletedResourceForeground', 4.5],
  ['gitDecoration.conflictingResourceForeground', 4.5],
  ['gitDecoration.submoduleResourceForeground', 4.5],
  ['gitDecoration.ignoredResourceForeground', AUXILIARY_FLOOR],
];

/** The rows a file name can sit on in the explorer, each over the ground under it. */
const EXPLORER_ROWS: [id: string, under: string][] = [
  ['sideBar.background', 'sideBar.background'],
  ['list.hoverBackground', 'sideBar.background'],
  ['list.inactiveSelectionBackground', 'sideBar.background'],
];

/*
 * Grounds painted behind code to say how it changed. Each is a stack, drawn
 * in order: changed text sits on its changed line, and a conflict's lines in
 * the merge editor on the editor. Code has to stay legible on every stack,
 * and every stack has to show against the one under it.
 */
const DIFF_STACKS: string[][] = [
  ['diffEditor.insertedLineBackground'],
  ['diffEditor.insertedLineBackground', 'diffEditor.insertedTextBackground'],
  ['diffEditor.removedLineBackground'],
  ['diffEditor.removedLineBackground', 'diffEditor.removedTextBackground'],
  ['mergeEditor.change.background'],
  ['mergeEditor.change.background', 'mergeEditor.change.word.background'],
  ['mergeEditor.changeBase.background'],
  ['mergeEditor.changeBase.background', 'mergeEditor.changeBase.word.background'],
  ['mergeEditor.conflictingLines.background'],
  ['mergeEditor.conflict.input1.background'],
  ['mergeEditor.conflict.input2.background'],
  ['merge.currentContentBackground'],
  ['merge.currentHeaderBackground'],
  ['merge.incomingContentBackground'],
  ['merge.incomingHeaderBackground'],
  ['merge.commonContentBackground'],
  ['merge.commonHeaderBackground'],
  ['editorCommentsWidget.rangeBackground'],
  ['editorCommentsWidget.rangeActiveBackground'],
];

/** Grounds that meet and have to be told apart where they do. */
const DIFF_PAIRS: [string, string][] = [
  ['merge.currentContentBackground', 'merge.incomingContentBackground'],
  ['merge.currentContentBackground', 'merge.commonContentBackground'],
  ['merge.incomingContentBackground', 'merge.commonContentBackground'],
  ['merge.currentHeaderBackground', 'merge.currentContentBackground'],
  ['merge.incomingHeaderBackground', 'merge.incomingContentBackground'],
  ['merge.commonHeaderBackground', 'merge.commonContentBackground'],
  ['mergeEditor.conflict.input1.background', 'mergeEditor.conflict.input2.background'],
  ['editorCommentsWidget.rangeBackground', 'editorCommentsWidget.rangeActiveBackground'],
];

/** Marks a few pixels wide on the gutter, the ruler or the minimap: each at 3:1 on the editor. */
const CHANGE_MARKS = [
  'editorGutter.addedBackground',
  'editorGutter.modifiedBackground',
  'editorGutter.deletedBackground',
  'editorGutter.addedSecondaryBackground',
  'editorGutter.modifiedSecondaryBackground',
  'editorGutter.deletedSecondaryBackground',
  'editorOverviewRuler.addedForeground',
  'editorOverviewRuler.modifiedForeground',
  'editorOverviewRuler.deletedForeground',
  'diffEditorOverview.insertedForeground',
  'diffEditorOverview.removedForeground',
  'editorOverviewRuler.currentContentForeground',
  'editorOverviewRuler.incomingContentForeground',
  'editorOverviewRuler.commonContentForeground',
  'mergeEditor.conflict.unhandledFocused.border',
  'mergeEditor.conflict.unhandledUnfocused.border',
  'mergeEditor.conflict.handledFocused.border',
  'mergeEditor.conflict.unhandled.minimapOverViewRuler',
  'mergeEditor.conflict.handled.minimapOverViewRuler',
  'diffEditor.moveActive.border',
  'editorCommentsWidget.unresolvedBorder',
  'editorGutter.commentGlyphForeground',
  'editorGutter.commentUnresolvedGlyphForeground',
  'editorGutter.commentDraftGlyphForeground',
  'editorOverviewRuler.commentForeground',
  'editorOverviewRuler.commentUnresolvedForeground',
  'editorOverviewRuler.commentDraftForeground',
];

/** Pairs of marks that mean opposite things and sit in the same place. */
const MARK_PAIRS: [string, string][] = [
  ['mergeEditor.conflict.unhandledFocused.border', 'mergeEditor.conflict.handledFocused.border'],
  ['mergeEditor.conflict.unhandledUnfocused.border', 'mergeEditor.conflict.handledUnfocused.border'],
  ['mergeEditor.conflict.unhandled.minimapOverViewRuler', 'mergeEditor.conflict.handled.minimapOverViewRuler'],
  ['editorCommentsWidget.unresolvedBorder', 'editorCommentsWidget.resolvedBorder'],
  ['editorGutter.commentUnresolvedGlyphForeground', 'editorGutter.commentGlyphForeground'],
  ['editorGutter.commentUnresolvedGlyphForeground', 'editorGutter.commentDraftGlyphForeground'],
  ['commentsView.unresolvedIcon', 'commentsView.resolvedIcon'],
  ['diffEditor.move.border', 'diffEditor.moveActive.border'],
];

/** The Source Control graph's lanes, and the refs drawn as pills in its hover. */
const GRAPH_LANES = [1, 2, 3, 4, 5].map((lane: number): string => `scmGraph.foreground${lane}`);
const GRAPH_REFS = ['scmGraph.historyItemRefColor', 'scmGraph.historyItemRemoteRefColor', 'scmGraph.historyItemBaseRefColor'];
/** How far (ΔE) two lanes of the graph keep apart. */
const LANE_DISTANCE = 8;

/*
 * 15. A change says what kind it is, in one colour everywhere.
 *
 * Green is an addition, blue a change, red a removal and amber a conflict —
 * the success, info, error and warning signals, never a syntax ink taken on
 * its own, so a deleted file is not the keyword colour and a conflict is not
 * an interface. Every ID in GIT_IDS is its kind's token, and the four kinds
 * are told apart. The file names Git colours read at AA on every row of the
 * explorer (ignored files, which recede, at 3:1). Code stays at AA on every
 * ground a diff, a merge or a comment thread paints behind it; each ground
 * shows against the editor, changed text against its changed line, and the
 * grounds that meet — ours and theirs, a header and its block — against each
 * other. The marks on the gutter, the ruler and the minimap read at 3:1, and
 * the states that sit in one place — a conflict handled or not, a thread
 * resolved or not — are told apart. The graph's lanes are told apart, from
 * each other and from the current branch — a merged branch drawn in the
 * current one's colour reads as the same branch — and show on the side bar;
 * a ref's name reads on its pill.
 */
const checkDiffAndGit = (family: Family, tokens: Tokens, colours: Record<string, string>): string[] => {
  const problems: string[] = [];
  const editorGround: string = tokens.surface.background;
  const stack = (ids: string[]): string => ids.reduce((under: string, id: string): string => over(colours[id], under), editorGround);

  for (const [state, ids] of Object.entries(GIT_IDS) as [GitState, string[]][]) {
    const token: string = tokens.state[state];
    const signal: string = tokens.state[GIT_SIGNAL[state]];
    if (token !== signal) problems.push(`${family}: state.${state} is ${token}, not the ${GIT_SIGNAL[state]} signal ${signal}`);
    for (const id of ids) {
      const colour: string | undefined = colours[id];
      if (!colour) problems.push(`${family}: ${id} is not set, and it is ${state}`);
      else if (colour.slice(0, 7) !== token) problems.push(`${family}: ${id} is ${colour}, not the ${state} colour ${token}`);
    }
  }
  const states: GitState[] = Object.keys(GIT_IDS) as GitState[];
  for (const [index, first] of states.entries()) {
    for (const second of states.slice(index + 1)) {
      const distance: number = deltaE(tokens.state[first], tokens.state[second]);
      if (distance < GIT_DISTANCE) problems.push(`${family}: ${first} and ${second} are ${distance.toFixed(1)} ΔE apart, under ${GIT_DISTANCE}`);
    }
  }

  for (const [id, floor] of GIT_NAMES) {
    for (const [rowId, under] of EXPLORER_ROWS) {
      const row: string = over(colours[rowId], over(colours[under], editorGround));
      const ratio: number = contrastRatio(colours[id], row);
      if (ratio < floor) problems.push(`${family}: ${id} reads at ${ratio.toFixed(2)}:1 on ${rowId}, under ${floor}:1`);
    }
  }

  const readInks: [string, string][] = [
    ...CODE_INKS.filter((ink) => ink !== 'generic').map((ink): [string, string] => [ink, tokens.syntax[ink]]),
    ['foreground', tokens.text.normal],
  ];
  for (const ids of DIFF_STACKS) {
    const missing: string[] = ids.filter((id: string): boolean => !colours[id]);
    if (missing.length) {
      problems.push(`${family}: ${missing.join(', ')} is not set`);
      continue;
    }
    const ground: string = stack(ids);
    const name: string = ids.join(' over ');
    for (const [inkName, ink] of readInks) {
      const ratio: number = contrastRatio(ink, ground);
      if (ratio < 4.5) problems.push(`${family}: ${inkName} reads at ${ratio.toFixed(2)}:1 on ${name}, under AA`);
    }
    const under: string = stack(ids.slice(0, -1));
    const distance: number = deltaE(ground, under);
    if (distance < STATE_FLOOR) problems.push(`${family}: ${name} is ${distance.toFixed(1)} ΔE from what it sits on, under ${STATE_FLOOR}`);
  }
  for (const [first, second] of DIFF_PAIRS) {
    const distance: number = deltaE(stack([first]), stack([second]));
    if (distance < STATE_FLOOR) problems.push(`${family}: ${first} and ${second} are ${distance.toFixed(1)} ΔE apart, under ${STATE_FLOOR}`);
  }

  for (const id of CHANGE_MARKS) {
    const ratio: number = contrastRatio(stack([id]), editorGround);
    if (ratio < 3) problems.push(`${family}: ${id} reads at ${ratio.toFixed(2)}:1 on the editor, under 3:1`);
  }
  for (const [first, second] of MARK_PAIRS) {
    const distance: number = deltaE(stack([first]), stack([second]));
    if (distance < DECORATION_DISTANCE) problems.push(`${family}: ${first} and ${second} are ${distance.toFixed(1)} ΔE apart, under ${DECORATION_DISTANCE}`);
  }
  const sideBar: string = colours['sideBar.background'];
  for (const id of ['commentsView.resolvedIcon', 'commentsView.unresolvedIcon']) {
    const ratio: number = contrastRatio(colours[id], sideBar);
    if (ratio < 3) problems.push(`${family}: ${id} reads at ${ratio.toFixed(2)}:1 on the side bar, under 3:1`);
  }

  for (const [index, lane] of GRAPH_LANES.entries()) {
    const ratio: number = contrastRatio(colours[lane], sideBar);
    if (ratio < 3) problems.push(`${family}: ${lane} reads at ${ratio.toFixed(2)}:1 on the side bar, under 3:1`);
    for (const other of [...GRAPH_LANES.slice(index + 1), 'scmGraph.historyItemRefColor']) {
      const distance: number = deltaE(colours[lane], colours[other]);
      if (distance < LANE_DISTANCE) problems.push(`${family}: ${lane} and ${other} are ${distance.toFixed(1)} ΔE apart, under ${LANE_DISTANCE}`);
    }
  }
  const pillText: string = colours['scmGraph.historyItemHoverLabelForeground'];
  for (const ref of GRAPH_REFS) {
    const ratio: number = contrastRatio(pillText, colours[ref]);
    if (ratio < 3) problems.push(`${family}: a ref's name reads at ${ratio.toFixed(2)}:1 on ${ref}, under 3:1`);
  }
  const defaultPill: number = contrastRatio(
    colours['scmGraph.historyItemHoverDefaultLabelForeground'],
    over(colours['scmGraph.historyItemHoverDefaultLabelBackground'], colours['editorHoverWidget.background'])
  );
  if (defaultPill < 3) problems.push(`${family}: a plain ref's name reads at ${defaultPill.toFixed(2)}:1 on its pill, under 3:1`);
  return problems;
};

/* -------------------------------------------------------------- *
 * Chat and agents
 * -------------------------------------------------------------- */

/*
 * Where the AI is the one speaking or acting: its avatar, the command a
 * request addresses it by, the border that runs round the input while it
 * works, a session in progress, what it has left pending in the minimap, its
 * suggestion in the gutter, the inline chat's frame, its badges and the tint
 * of its window. Check 16 holds each to the accent — the theme's own colour,
 * indigo in Midnight Indigo — solid or at a ladder step, so the AI has one
 * identity and it is not a colour of its own.
 */
const AI_IDENTITY = [
  'chat.avatarBackground',
  'chat.slashCommandBackground',
  'chat.inputWorkingBorderColor1',
  'chat.sessionStateIndicator.inProgressBorder',
  'minimap.chatEditHighlight',
  'inlineChat.border',
  'inlineEdit.gutterIndicator.primaryBackground',
  'inlineEdit.gutterIndicator.primaryBorder',
  'inlineEdit.gutterIndicator.successfulBackground',
  'inlineEdit.gutterIndicator.successfulBorder',
  'agentsGradient.tintColor',
  'agentsBadge.background',
  'agentsUnreadBadge.background',
  'agentsUpdateButton.downloadingBackground',
  'agentsUpdateButton.downloadedBackground',
];

/*
 * What the person wrote. It is theirs, not the AI's, so it stays on the
 * surface ladder and never takes the accent.
 */
const PERSON = ['chat.requestBubbleBackground', 'chat.requestBubbleHoverBackground', 'chat.requestBackground'];

/*
 * What an agent changed, wherever chat shows it: the edited files and their
 * line counts, the inline chat's diff and its marks, a suggested edit, the
 * Agents window's diff. Each is the kind of change check 15 says it is.
 */
const AI_CHANGE_IDS: Record<GitState, string[]> = {
  added: [
    'chat.linesAddedForeground',
    'inlineChatDiff.inserted',
    'editorOverviewRuler.inlineChatInserted',
    'editorMinimap.inlineChatInserted',
    'inlineEdit.modifiedBackground',
    'inlineEdit.modifiedChangedLineBackground',
    'inlineEdit.modifiedChangedTextBackground',
    'inlineEdit.modifiedBorder',
    'inlineEdit.tabWillAcceptModifiedBorder',
    'agentsMobileDiff.addedForeground',
  ],
  modified: ['chat.editedFileForeground', 'agentsMobileDiff.modifiedForeground'],
  deleted: [
    'chat.linesRemovedForeground',
    'inlineChatDiff.removed',
    'editorOverviewRuler.inlineChatRemoved',
    'inlineEdit.originalBackground',
    'inlineEdit.originalChangedLineBackground',
    'inlineEdit.originalChangedTextBackground',
    'inlineEdit.originalBorder',
    'inlineEdit.tabWillAcceptOriginalBorder',
    'agentsMobileDiff.deletedForeground',
  ],
  conflicting: [],
};

/*
 * Text chat and the Agents window put on a ground, each with the stack of
 * grounds under it (drawn over the editor ground) and the floor it is held
 * to: AA for what is read, 3:1 for a glyph or a count on a badge.
 */
const CHAT_TEXT: [foreground: string, grounds: string[], floor: number][] = [
  ['foreground', ['sideBar.background', 'chat.requestBubbleBackground'], 4.5],
  ['foreground', ['sideBar.background', 'chat.requestBubbleHoverBackground'], 4.5],
  ['foreground', ['editor.background', 'chat.requestBubbleBackground'], 4.5],
  ['chat.slashCommandForeground', ['sideBar.background', 'chat.requestBubbleBackground', 'chat.slashCommandBackground'], 4.5],
  ['chat.slashCommandForeground', ['input.background', 'chat.slashCommandBackground'], 4.5],
  ['chat.avatarForeground', ['chat.avatarBackground'], 3],
  ['chat.editedFileForeground', ['sideBar.background'], 4.5],
  ['chat.linesAddedForeground', ['sideBar.background'], 4.5],
  ['chat.linesRemovedForeground', ['sideBar.background'], 4.5],
  ['chat.linesAddedForeground', ['input.background'], 4.5],
  ['chat.linesRemovedForeground', ['input.background'], 4.5],
  ['inlineChat.foreground', ['inlineChat.background'], 4.5],
  ['inlineChat.foreground', ['inlineChatInput.background'], 4.5],
  ['inlineChatInput.placeholderForeground', ['inlineChatInput.background'], AUXILIARY_FLOOR],
  ['inlineEdit.gutterIndicator.primaryForeground', ['editor.background', 'inlineEdit.gutterIndicator.primaryBackground'], 3],
  ['inlineEdit.gutterIndicator.secondaryForeground', ['editor.background', 'inlineEdit.gutterIndicator.secondaryBackground'], 3],
  ['inlineEdit.gutterIndicator.successfulForeground', ['editor.background', 'inlineEdit.gutterIndicator.successfulBackground'], 3],
  ['agentsPanel.foreground', ['agents.background', 'agentsPanel.background'], 4.5],
  ['activeSessionView.foreground', ['agents.background', 'activeSessionView.background'], 4.5],
  ['inactiveSessionView.foreground', ['agents.background', 'inactiveSessionView.background'], 4.5],
  ['agentsChatInput.foreground', ['agentsPanel.background', 'agentsChatInput.background'], 4.5],
  ['agentsChatInput.placeholderForeground', ['agentsPanel.background', 'agentsChatInput.background'], AUXILIARY_FLOOR],
  ['agentsNewSessionButton.foreground', ['agents.background'], 4.5],
  ['agentsNewSessionButton.foreground', ['agents.background', 'agentsNewSessionButton.hoverBackground'], 4.5],
  ['agentsBadge.foreground', ['agentsBadge.background'], 3],
  ['agentsUnreadBadge.foreground', ['agentsUnreadBadge.background'], 3],
  ['foreground', ['agentFeedbackEditorWidget.background'], 4.5],
];

/* Grounds an agent's change paints behind code, each a stack, as DIFF_STACKS are. */
const AI_CHANGE_STACKS: string[][] = [
  ['inlineChatDiff.inserted'],
  ['inlineChatDiff.removed'],
  ['inlineEdit.modifiedBackground', 'inlineEdit.modifiedChangedLineBackground'],
  ['inlineEdit.modifiedBackground', 'inlineEdit.modifiedChangedLineBackground', 'inlineEdit.modifiedChangedTextBackground'],
  ['inlineEdit.originalBackground', 'inlineEdit.originalChangedLineBackground'],
  ['inlineEdit.originalBackground', 'inlineEdit.originalChangedLineBackground', 'inlineEdit.originalChangedTextBackground'],
];

/*
 * The states of a chat session: working, finished and not yet seen, waiting
 * for the person. They sit in one place — the border of a chat editor — and
 * each draws its own icon beside it, so they are held to GIT_DISTANCE, as the
 * kinds of change are, rather than to DECORATION_DISTANCE: the success green
 * and the warning amber are 9 or 10 ΔE apart in the green and cyan families.
 */
const SESSION_STATES = [
  'chat.sessionStateIndicator.inProgressBorder',
  'chat.sessionStateIndicator.unvisitedBorder',
  'chat.sessionStateIndicator.needsInputBorder',
];

/*
 * 16. The AI has one identity, the person another, and chat keeps the
 * theme's language.
 *
 * Every ID in AI_IDENTITY is the accent — the theme's own colour, never a
 * colour kept for the AI alone — and nothing the person wrote is. Their
 * request is a bubble on the surface ladder that shows on the panel and the
 * editor; the command in it is the accent's chip, which shows on the bubble
 * and on the input. What an agent changed is the kind of change it is (check
 * 15's tokens), and code stays at AA on every ground that change paints, each
 * ground showing against what it sits on. Chat's text reads on its grounds.
 * The states of a session are told apart from each other and show on the side
 * bar; an unread count is told from a plain one; and an inactive session in
 * the Agents window recedes in its ground and its text alike, so it is told
 * from the active one by more than a ground a few ΔE darker.
 */
const checkChatAndAgents = (family: Family, tokens: Tokens, colours: Record<string, string>): string[] => {
  const problems: string[] = [];
  const editorGround: string = tokens.surface.background;
  const stack = (ids: string[]): string => ids.reduce((under: string, id: string): string => over(colours[id], under), editorGround);
  const accents: Set<string> = new Set([tokens.accent.base, tokens.accent.muted]);

  for (const id of AI_IDENTITY) {
    const colour: string | undefined = colours[id];
    if (!colour) problems.push(`${family}: ${id} is not set, and it is the AI`);
    else if (!accents.has(colour.slice(0, 7))) problems.push(`${family}: ${id} is ${colour}, not the accent — the AI's one identity`);
  }
  for (const id of PERSON) {
    if (accents.has(colours[id]?.slice(0, 7))) problems.push(`${family}: ${id} is the accent, so what the person wrote reads as the AI's`);
  }
  for (const [groundName, ground] of [['side bar', 'sideBar.background'], ['editor', 'editor.background']]) {
    const bubble: number = deltaE(stack([ground, 'chat.requestBubbleBackground']), stack([ground]));
    if (bubble < STATE_FLOOR) problems.push(`${family}: a request bubble is ${bubble.toFixed(1)} ΔE from the ${groundName}, under ${STATE_FLOOR}`);
  }
  for (const under of [['sideBar.background', 'chat.requestBubbleBackground'], ['input.background']]) {
    const chip: number = deltaE(stack([...under, 'chat.slashCommandBackground']), stack(under));
    if (chip < STATE_FLOOR) problems.push(`${family}: a slash command is ${chip.toFixed(1)} ΔE from ${under.at(-1)}, under ${STATE_FLOOR}`);
  }

  for (const [state, ids] of Object.entries(AI_CHANGE_IDS) as [GitState, string[]][]) {
    for (const id of ids) {
      const colour: string | undefined = colours[id];
      if (!colour) problems.push(`${family}: ${id} is not set, and it is ${state}`);
      else if (colour.slice(0, 7) !== tokens.state[state]) problems.push(`${family}: ${id} is ${colour}, not the ${state} colour ${tokens.state[state]}`);
    }
  }
  const readInks: [string, string][] = [
    ...CODE_INKS.filter((ink) => ink !== 'generic').map((ink): [string, string] => [ink, tokens.syntax[ink]]),
    ['foreground', tokens.text.normal],
  ];
  for (const ids of AI_CHANGE_STACKS) {
    const ground: string = stack(ids);
    const name: string = ids.join(' over ');
    for (const [inkName, ink] of readInks) {
      const ratio: number = contrastRatio(ink, ground);
      if (ratio < 4.5) problems.push(`${family}: ${inkName} reads at ${ratio.toFixed(2)}:1 on ${name}, under AA`);
    }
    const distance: number = deltaE(ground, stack(ids.slice(0, -1)));
    if (distance < STATE_FLOOR) problems.push(`${family}: ${name} is ${distance.toFixed(1)} ΔE from what it sits on, under ${STATE_FLOOR}`);
  }
  for (const id of ['editorOverviewRuler.inlineChatInserted', 'editorOverviewRuler.inlineChatRemoved', 'editorMinimap.inlineChatInserted']) {
    const ratio: number = contrastRatio(stack([id]), editorGround);
    if (ratio < 3) problems.push(`${family}: ${id} reads at ${ratio.toFixed(2)}:1 on the editor, under 3:1`);
  }
  const pending: number = deltaE(stack(['minimap.chatEditHighlight']), editorGround);
  if (pending < STATE_FLOOR) problems.push(`${family}: minimap.chatEditHighlight is ${pending.toFixed(1)} ΔE from the minimap, under ${STATE_FLOOR}`);

  for (const [foreground, grounds, floor] of CHAT_TEXT) {
    const missing: string[] = [foreground, ...grounds].filter((id: string): boolean => !colours[id]);
    if (missing.length) {
      problems.push(`${family}: ${foreground} on ${grounds.join(' over ')} names ${missing.join(', ')}, which the theme does not set`);
      continue;
    }
    const ground: string = stack(grounds);
    const ratio: number = contrastRatio(over(colours[foreground], ground), ground);
    if (ratio < floor) problems.push(`${family}: ${foreground} on ${grounds.join(' over ')} reads at ${ratio.toFixed(2)}:1, under ${floor}:1`);
  }

  const sideBar: string = stack(['sideBar.background']);
  for (const [index, first] of SESSION_STATES.entries()) {
    const ratio: number = contrastRatio(colours[first], sideBar);
    if (ratio < 3) problems.push(`${family}: ${first} reads at ${ratio.toFixed(2)}:1 on the side bar, under 3:1`);
    for (const second of SESSION_STATES.slice(index + 1)) {
      const distance: number = deltaE(colours[first], colours[second]);
      if (distance < GIT_DISTANCE) problems.push(`${family}: ${first} and ${second} are ${distance.toFixed(1)} ΔE apart, under ${GIT_DISTANCE}`);
    }
  }
  const badges: number = deltaE(colours['agentsUnreadBadge.background'], colours['agentsBadge.background']);
  if (badges < STATE_FLOOR) problems.push(`${family}: an unread count is ${badges.toFixed(1)} ΔE from a plain badge, under ${STATE_FLOOR}`);

  const activeText: number = contrastRatio(colours['activeSessionView.foreground'], stack(['agents.background', 'activeSessionView.background']));
  const inactiveText: number = contrastRatio(colours['inactiveSessionView.foreground'], stack(['agents.background', 'inactiveSessionView.background']));
  if (inactiveText >= activeText) {
    problems.push(`${family}: an inactive session's text (${inactiveText.toFixed(2)}:1) reads as strongly as the active one's (${activeText.toFixed(2)}:1)`);
  }
  const activeGround: number = relativeLuminance(stack(['agents.background', 'activeSessionView.background']));
  const inactiveGround: number = relativeLuminance(stack(['agents.background', 'inactiveSessionView.background']));
  if (inactiveGround > activeGround) problems.push(`${family}: an inactive session's ground is lighter than the active one's`);
  return problems;
};

/**
 * Every check the build makes, run over every variant before anything is
 * written. They are worth listing rather than trusting because each one has
 * already caught something: the baseline caught a guard rule that quietly
 * restyled the shipped theme, and the contrastRatio floor caught what gamut
 * clipping does to a colour whose chroma does not exist at its new hue.
 */
function check(): string[] {
  const problems: string[] = [];
  const base = paletteFor('indigo');

  /*
   * 1. Indigo still regenerates the theme as it shipped.
   *
   * Four parts, in the order they can fail. The file is the one that was
   * pinned; it has no key JSON.parse would silently drop; the build, with the
   * workbench keys the baseline never had set aside, writes exactly its bytes
   * once both are serialized the same way (tools/baseline.ts says why that and
   * not the raw file); and, for the error message, which keys moved. The third
   * is the assertion — the rest is there so that when it fails it says what
   * failed.
   *
   * Setting the new keys aside is a projection, not a filter on the result:
   * the baseline's keys are taken in the order the BUILD has them, so a
   * baseline key that moved past another still fails, and so does one that
   * went missing. Only `colors` grows. The TextMate and semantic rules are the
   * baseline's in full; changing them is M9's business and needs a baseline
   * change of its own.
   *
   * The baseline compared against is the file with AMENDMENTS applied
   * (tools/baseline.ts): the few shipped values changed on purpose, each with
   * what it was and why, so the file itself stays the bytes that shipped.
   */
  const { raw, theme } = readBaseline();
  const amended = amendedBaseline(theme as Theme);
  problems.push(...amended.problems);
  const baseline: Theme = { ...(theme as Theme), colors: amended.colors };
  const pinned = sha256(raw);
  if (pinned !== BASELINE.sha256) {
    problems.push(
      `baseline: tools/indigo-baseline.json is not the file that was pinned ` +
        `(sha256 ${pinned.slice(0, 12)}…, expected ${BASELINE.sha256.slice(0, 12)}…)`
    );
  }
  for (const key of duplicateKeys(raw.toString('utf8'))) {
    problems.push(`baseline: "${key}" appears twice, and JSON.parse keeps only the last`);
  }
  const built = themeFor('indigo', tokensFor('indigo'));
  const projected = {
    ...built,
    colors: Object.fromEntries(Object.entries(built.colors).filter(([key]) => key in baseline.colors)),
  };
  const want = serialize(baseline);
  const got = serialize(projected);
  if (want !== got) {
    problems.push(`baseline: indigo no longer serializes to the baseline — ${firstDifference(want, got)}`);
  }
  for (const [key, want] of Object.entries(baseline.colors)) {
    const got = built.colors[key];
    if (got !== want) problems.push(`baseline: colors["${key}"] was ${want}, is now ${got}`);
  }
  const drift = (a: unknown, b: unknown, what: string): void => {
    if (JSON.stringify(a) !== JSON.stringify(b)) problems.push(`baseline: ${what} changed`);
  };
  drift(baseline.tokenColors, built.tokenColors, 'tokenColors');
  drift(baseline.semanticTokenColors, built.semanticTokenColors, 'semanticTokenColors');

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
      const got = contrastRatio(p[role], p.bg);
      if (got < AAA) {
        problems.push(`${family}: ${role} reads at ${got.toFixed(2)}:1, under AAA (${AAA}:1)`);
      }
    }

    for (const role of UI_TEXT) {
      const want = contrastRatio(base[role], base.bg);
      const got = contrastRatio(p[role], p.bg);
      if (got < Math.max(UI_FLOOR, want * UI_SLACK)) {
        problems.push(
          `${family}: ${role} reads at ${got.toFixed(2)}:1 against the ground, ` +
            `indigo manages ${want.toFixed(2)}:1`
        );
      }
    }

    if (family === 'indigo') continue;

    // 3. White on the accent, which is the one pairing the palette cannot move.
    const onAccent = contrastRatio(WHITE, p.accent);
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
    const near = closestPair(family);
    if (near.deg < SEPARATION) {
      problems.push(
        `${family}: ${near.a} and ${near.b} are only ${near.deg.toFixed(1)}° apart, ` +
          `under the ${SEPARATION}° floor`
      );
    }
  }

  /*
   * 5. Every token says what it is for.
   *
   * The type already refuses a token without an entry in DOCS; this refuses an
   * entry that is there to satisfy the type. A sentence is the minimum.
   */
  const indigoTokens = flatten(tokensFor('indigo'));
  for (const [name] of indigoTokens) {
    if (docOf(name).trim().length < 12) problems.push(`tokens: ${name} has no documented role`);
  }

  for (const family of FAMILY_ORDER) {
    const t = tokensFor(family);
    const theme = themeFor(family, t);
    const L = relativeLuminance;

    /*
     * 6. Nothing reaches the theme that is not a token.
     *
     * A colour is a token's value, or a token's value with an alpha from the
     * overlay ladder on it. Anything else is a hexadecimal someone typed into
     * the build, which is exactly what the token layer exists to stop — and
     * it is caught here, by value, rather than by hoping a reviewer spots it.
     */
    const values = new Set(flatten(t).map(([, v]) => v));
    const alphas = new Set(Object.values(OVERLAY).map((a) => a.toString(16).padStart(2, '0').toUpperCase()));
    const stray = (where: string, colour: string | undefined): void => {
      if (colour === undefined) return;
      const solid = colour.slice(0, 7);
      const alpha = colour.slice(7);
      if (!values.has(solid) || (alpha && !alphas.has(alpha))) {
        problems.push(`${family}: ${where} is ${colour}, which is not a token${alpha ? ' at a ladder opacity' : ''}`);
      }
    };
    for (const [key, colour] of Object.entries(theme.colors)) stray(`colors["${key}"]`, colour);
    for (const rule of theme.tokenColors as { name: string; settings: { foreground?: string } }[]) {
      stray(`tokenColors "${rule.name}"`, rule.settings.foreground);
    }
    for (const [key, rule] of Object.entries(theme.semanticTokenColors as Record<string, { foreground?: string }>)) {
      stray(`semanticTokenColors["${key}"]`, rule.foreground);
    }

    /*
     * 7. The surfaces and the text keep their order.
     *
     * The names promise a hierarchy — a raised surface is above the one it
     * floats on, a selection is stronger than a hover, `bright` is brighter
     * than `normal` — and the palette maths could break that promise in one
     * family without anyone noticing, because each colour is placed on its
     * own. Equal is allowed where the design has two jobs at the same height
     * (a raised widget and a hovered row are within a hex digit of each other
     * in indigo); going backwards is not.
     */
    const s = t.surface;
    const ladder: [string, string][] = [
      ['background', s.background],
      ['surface', s.surface],
      ['currentLine', s.currentLine],
      ['surfaceRaised', s.surfaceRaised],
      ['surfaceHover', s.surfaceHover],
      ['surfaceFocus', s.surfaceFocus],
      ['surfaceSelected', s.surfaceSelected],
    ];
    const pairs: [string, string, string, string][] = [
      ...ladder.slice(1).map(([n, v], i) => [ladder[i][0], ladder[i][1], n, v] as [string, string, string, string]),
      ['background', s.background, 'frame', s.frame],
      ['border', s.border, 'borderStrong', s.borderStrong],
    ];
    const x = t.text;
    const ramp: [string, string][] = [
      ['ghost', x.ghost], ['faint', x.faint], ['muted', x.muted], ['secondary', x.secondary],
      ['normal', x.normal], ['bright', x.bright], ['white', x.white],
    ];
    pairs.push(...ramp.slice(1).map(([n, v], i) => [ramp[i][0], ramp[i][1], n, v] as [string, string, string, string]));
    for (const [lo, loV, hi, hiV] of pairs) {
      if (L(hiV) < L(loV)) problems.push(`${family}: ${hi} (${hiV}) is darker than ${lo} (${loV})`);
    }

    /*
     * 8. The signals mean the same thing in every family.
     *
     * Error has to look like an error whether the chrome is violet or amber:
     * each signal has to land within SIGNAL_TOLERANCE of the hue it stands
     * for, and no two borrowed signals — nor two chart series — may be the
     * same ink, or a chart would draw two series in one colour. The
     * diagnostics are read as text in the Problems view, the debug console and
     * the hovers, so they are held to AA on every ground those sit on; the
     * chart series only have to be told from the ground, which is 3:1 for
     * anything that is not text.
     */
    const signals = signalsFor(family);
    const inks = Object.values(signals);
    if (new Set(inks).size !== inks.length) {
      problems.push(`${family}: two signals share an ink — ${JSON.stringify(signals)}`);
    }
    const signalColour: Record<Signal, string> = {
      error: t.state.error, warning: t.state.warning, success: t.state.success, info: t.state.info,
      hint: t.state.hint, orange: t.chart.orange, purple: t.chart.purple,
    };
    for (const [signal, colour] of Object.entries(signalColour) as [Signal, string][]) {
      const off = Math.abs(signedHueDelta(SIGNAL_HUE[signal], oklchFromHex(colour).h));
      if (off > SIGNAL_TOLERANCE) {
        problems.push(
          `${family}: ${signal} (${colour}) is ${off.toFixed(0)}° from the hue it stands for — ` +
            `the tolerance is ${SIGNAL_TOLERANCE}°`
        );
      }
    }
    const readingGrounds: [string, string][] = [
      ['background', s.background],
      ['surface', s.surface],
      ['surfaceRaised', s.surfaceRaised],
    ];
    for (const signal of DIAGNOSTICS) {
      for (const [groundName, ground] of readingGrounds) {
        const got = contrastRatio(t.state[signal], ground);
        if (got < 4.5) problems.push(`${family}: ${signal} reads at ${got.toFixed(2)}:1 on ${groundName}, under AA`);
      }
    }
    for (const [series, colour] of Object.entries(t.chart)) {
      const got = contrastRatio(colour, s.background);
      if (got < 3) problems.push(`${family}: chart ${series} is ${got.toFixed(2)}:1 against the ground, under 3:1`);
    }
    const git = [t.state.modified, t.state.added, t.state.deleted, t.state.conflicting];
    if (new Set(git).size !== git.length) problems.push(`${family}: two Git states share a colour`);

    /*
     * 10. The workbench's own text reads on the ground it is drawn on.
     *
     * Checks 2 and 8 measure against the editor; these are the pairs the rest
     * of the window puts together — a menu, a status-bar item, a badge. Several
     * of the grounds are overlays, and an overlay has no contrast of its own,
     * so each pair names what it is painted over and is measured as the colour
     * the two make together. Where a control can sit on several grounds, the
     * one named is the lightest of them, which is the worst case for light
     * text. Text is held to AA; badges and the inverted icon of a toggle, which
     * are read as shapes, to 3:1.
     */
    const c = theme.colors as Record<string, string>;
    const TEXT: [fg: string, bg: string, ground: string, floor: number][] = [
      ['menu.foreground', 'menu.background', 'menu.background', 4.5],
      ['menu.selectionForeground', 'menu.selectionBackground', 'menu.background', 4.5],
      ['quickInput.foreground', 'quickInput.background', 'quickInput.background', 4.5],
      ['quickInputList.focusForeground', 'quickInputList.focusBackground', 'quickInput.background', 4.5],
      ['pickerGroup.foreground', 'quickInput.background', 'quickInput.background', 4.5],
      ['notifications.foreground', 'notifications.background', 'notifications.background', 4.5],
      ['banner.foreground', 'banner.background', 'banner.background', 4.5],
      ['keybindingLabel.foreground', 'keybindingLabel.background', 'editorHoverWidget.background', 4.5],
      ['breadcrumb.foreground', 'breadcrumb.background', 'breadcrumb.background', 4.5],
      ['commandCenter.foreground', 'commandCenter.background', 'titleBar.activeBackground', 4.5],
      ['button.foreground', 'button.hoverBackground', 'editorWidget.background', 4.5],
      ['button.secondaryForeground', 'button.secondaryBackground', 'editorWidget.background', 4.5],
      ['button.secondaryForeground', 'button.secondaryHoverBackground', 'editorWidget.background', 4.5],
      ['statusBar.debuggingForeground', 'statusBar.debuggingBackground', 'statusBar.debuggingBackground', 4.5],
      ['statusBarItem.prominentForeground', 'statusBarItem.prominentBackground', 'statusBar.background', 4.5],
      ['statusBarItem.remoteForeground', 'statusBarItem.remoteBackground', 'statusBar.background', 4.5],
      ['statusBarItem.remoteHoverForeground', 'statusBarItem.remoteHoverBackground', 'statusBar.background', 3],
      ['statusBarItem.errorForeground', 'statusBarItem.errorBackground', 'statusBar.background', 4.5],
      ['statusBarItem.errorHoverForeground', 'statusBarItem.errorHoverBackground', 'statusBar.background', 4.5],
      ['statusBarItem.warningForeground', 'statusBarItem.warningBackground', 'statusBar.background', 4.5],
      ['statusBarItem.warningHoverForeground', 'statusBarItem.warningHoverBackground', 'statusBar.background', 4.5],
      ['activityWarningBadge.foreground', 'activityWarningBadge.background', 'activityBar.background', 3],
      ['activityErrorBadge.foreground', 'activityErrorBadge.background', 'activityBar.background', 3],
      ['profileBadge.foreground', 'profileBadge.background', 'activityBar.background', 3],
      ['inputOption.activeForeground', 'inputOption.activeBackground', 'input.background', 3],
      ['statusBarItem.prominentHoverForeground', 'statusBarItem.prominentHoverBackground', 'statusBar.background', 3],
      ['list.activeSelectionForeground', 'list.activeSelectionBackground', 'sideBar.background', 4.5],
      ['list.inactiveSelectionForeground', 'list.inactiveSelectionBackground', 'sideBar.background', 4.5],
      ['quickInput.foreground', 'list.hoverBackground', 'quickInput.background', 4.5],
      ['tab.selectedForeground', 'tab.selectedBackground', 'editorGroupHeader.tabsBackground', 4.5],
      ['list.errorForeground', 'sideBar.background', 'sideBar.background', 4.5],
      ['list.warningForeground', 'sideBar.background', 'sideBar.background', 4.5],
      ['debugConsole.errorForeground', 'panel.background', 'panel.background', 4.5],
      ['debugConsole.warningForeground', 'panel.background', 'panel.background', 4.5],
      ['debugConsole.infoForeground', 'panel.background', 'panel.background', 4.5],
      ['debugConsole.sourceForeground', 'panel.background', 'panel.background', 4.5],
      ['inputValidation.errorForeground', 'inputValidation.errorBackground', 'sideBar.background', 4.5],
      ['inputValidation.warningForeground', 'inputValidation.warningBackground', 'sideBar.background', 4.5],
      ['inputValidation.infoForeground', 'inputValidation.infoBackground', 'sideBar.background', 4.5],
      ['editor.foreground', 'editorMarkerNavigation.background', 'editor.background', 4.5],
      ['editor.foreground', 'debugExceptionWidget.background', 'editor.background', 4.5],
      ['editor.inlineValuesForeground', 'editor.inlineValuesBackground', 'editor.background', 4.5],
      ['debugView.exceptionLabelForeground', 'debugView.exceptionLabelBackground', 'sideBar.background', 4.5],
      ['debugView.stateLabelForeground', 'debugView.stateLabelBackground', 'sideBar.background', 4.5],
      ['testing.message.error.badgeForeground', 'testing.message.error.badgeBackground', 'editor.background', 3],
      ['testing.coverCountBadgeForeground', 'testing.coverCountBadgeBackground', 'editor.background', 3],
    ];
    for (const [fg, bg, ground, floor] of TEXT) {
      if (!c[fg] || !c[bg] || !c[ground]) {
        problems.push(`${family}: contrast pair ${fg} on ${bg} names a colour the theme does not set`);
        continue;
      }
      const under: string = over(c[bg], over(c[ground], s.background));
      const got: number = contrastRatio(over(c[fg], under), under);
      if (got < floor) problems.push(`${family}: ${fg} on ${bg} reads at ${got.toFixed(2)}:1, under ${floor}:1`);
    }

    problems.push(...checkStates(family, t, c));
    problems.push(...checkDiagnostics(family, t, c));
    problems.push(...checkEditorIntelligence(family, t, c));
    problems.push(...checkTerminal(family, c));
    problems.push(...checkDiffAndGit(family, t, c));
    problems.push(...checkChatAndAgents(family, t, c));
  }

  /*
   * 9. package.json declares exactly what this build writes.
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
  const file = fileFor(family);
  fs.writeFileSync(path.join(THEMES, file), serialize(themeFor(family, tokensFor(family))), 'utf8');
  // How much room the family's closestPair pair has, so a design edit that walks
  // two roles toward each other is visible before it reaches the floor.
  const near = closestPair(family);
  console.log(
    `  ${labelFor(family).padEnd(16)} -> themes/${file}` +
      `  (closest: ${near.a}/${near.b} ${near.deg.toFixed(0)}°)`
  );
}
console.log(`\nwrote ${FAMILY_ORDER.length} themes`);
