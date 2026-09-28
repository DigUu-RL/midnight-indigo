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
import { contrastRatio, oklchFromHex, over, relativeLuminance, signedHueDelta } from './color.ts';
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

function themeFor(family: Family, t: Tokens): Theme {
  const { surface: s, text: x, link, accent: a, syntax: k, state: st, chart, ansi } = t;

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
    'toolbar.hoverBackground': derive.hover(s.borderStrong),
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
    'editorIndentGuide.background1': s.border,
    'editorIndentGuide.activeBackground1': a.muted,
    'editorWhitespace.foreground': x.ghost,
    'editorRuler.foreground': s.border,
    'editorBracketMatch.background': derive.rest(s.surfaceSelected),
    'editorBracketMatch.border': st.focus,
    'editorBracketHighlight.foreground1': k.keyword,
    'editorBracketHighlight.foreground2': k.function,
    'editorBracketHighlight.foreground3': k.interface,
    'editorBracketHighlight.foreground4': k.generic,
    'editorBracketHighlight.unexpectedBracket.foreground': k.operator,
    'editorGutter.background': s.background,
    'editorGutter.modifiedBackground': st.modified,
    'editorGutter.addedBackground': st.added,
    'editorGutter.deletedBackground': st.deleted,
    'editorOverviewRuler.border': s.frame,
    'editorCodeLens.foreground': x.muted,
    'editorWidget.background': s.surfaceRaised,
    'editorWidget.border': a.muted,
    'editorHoverWidget.background': s.surfaceRaised,
    'editorHoverWidget.border': a.muted,
    'editorSuggestWidget.background': s.surfaceRaised,
    'editorSuggestWidget.border': s.borderStrong,
    'editorSuggestWidget.selectedBackground': s.surfaceFocus,
    'editorSuggestWidget.highlightForeground': k.keyword,
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
    'menubar.selectionBackground': derive.hover(s.borderStrong),
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
    'modernActivityBarItem.hoverBackground': s.surfaceHover,
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
    'statusBarItem.prominentBackground': s.surfaceFocus,
    'statusBarItem.prominentForeground': x.normal,
    'statusBarItem.prominentHoverBackground': s.surfaceSelected,
    'statusBarItem.prominentHoverForeground': x.bright,
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
    'tab.selectedBackground': s.surfaceHover,
    'tab.selectedForeground': x.bright,
    'tab.selectedBorderTop': a.muted,
    'tab.activeModifiedBorder': st.modified,
    'tab.inactiveModifiedBorder': derive.inactive(st.modified),
    'tab.unfocusedActiveModifiedBorder': derive.inactive(st.modified),
    'tab.unfocusedInactiveModifiedBorder': overlay(st.modified, 'faint'),
    'tab.lastPinnedBorder': s.borderStrong,
    'tab.dragAndDropBorder': a.base,
    'modernTab.activeBackground': s.border,
    'modernTab.activeForeground': x.bright,
    'modernTab.hoverBackground': s.surfaceHover,
    'modernTab.hoverForeground': x.normal,
    'modernEditorTab.activeBackground': s.surfaceHover,
    'modernEditorTab.activeForeground': x.bright,
    'modernEditorTab.activeActionBackground': s.surfaceHover,
    'modernEditorTab.hoverBackground': s.surfaceHover,
    'modernEditorTab.hoverForeground': x.normal,
    'modernEditorTab.hoverActionBackground': s.surfaceHover,
    'modernEditorTab.activeHoverBackground': s.surfaceHover,
    'modernEditorTab.activeHoverActionBackground': s.surfaceHover,
    'modernEditorTab.selectedActionBackground': s.surfaceHover,
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
    'inputOption.activeBorder': st.focus,
    'inputOption.activeForeground': x.white,
    'inputOption.hoverBackground': derive.hover(s.borderStrong),
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
    'radio.activeBorder': st.focus,
    'radio.inactiveBorder': s.borderStrong,
    'radio.inactiveHoverBackground': derive.hover(s.borderStrong),
    'list.activeSelectionBackground': s.border,
    'list.activeSelectionForeground': x.bright,
    'list.inactiveSelectionBackground': s.border,
    'list.inactiveSelectionForeground': x.normal,
    'list.hoverBackground': overlay(s.surfaceFocus, 'soft'),
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
    'settings.rowHoverBackground': derive.rest(s.surfaceFocus),
    'settings.focusedRowBackground': derive.hover(s.surfaceFocus),
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
    'notebook.cellStatusBarItemHoverBackground': derive.hover(s.borderStrong),
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
    'diffEditor.insertedTextBackground': overlay(st.added, 'tint'),
    'diffEditor.removedTextBackground': overlay(st.deleted, 'tint'),
    'gitDecoration.modifiedResourceForeground': st.modified,
    'gitDecoration.addedResourceForeground': st.added,
    'gitDecoration.deletedResourceForeground': st.deleted,
    'gitDecoration.untrackedResourceForeground': st.untracked,
    'peekViewEditor.background': s.background,
    'peekViewResult.background': s.surface,
    'peekView.border': a.muted,
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
     * each signal's ink has to land within SIGNAL_TOLERANCE of the hue VS Code
     * itself uses for it, and no two signals — nor two chart series — may be
     * the same ink, or a chart would draw two series in one colour. They are
     * read as text in the problems view and the hovers, so they are held to
     * AA; the chart series only have to be told from the ground, which is
     * 3:1 for anything that is not text.
     */
    const signals = signalsFor(family);
    const inks = Object.values(signals);
    if (new Set(inks).size !== inks.length) {
      problems.push(`${family}: two signals share an ink — ${JSON.stringify(signals)}`);
    }
    const signalColour: Record<Signal, string> = {
      error: t.state.error, warning: t.state.warning, success: t.state.success, info: t.state.info,
      orange: t.chart.orange, purple: t.chart.purple,
    };
    for (const [signal, colour] of Object.entries(signalColour) as [Signal, string][]) {
      const off = Math.abs(signedHueDelta(SIGNAL_HUE[signal], oklchFromHex(colour).h));
      if (off > SIGNAL_TOLERANCE) {
        problems.push(
          `${family}: ${signal} is ${signals[signal]} (${colour}), ${off.toFixed(0)}° from the hue it stands for — ` +
            `the tolerance is ${SIGNAL_TOLERANCE}°`
        );
      }
    }
    for (const signal of ['error', 'warning', 'success', 'info'] as const) {
      const got = contrastRatio(t.state[signal], s.background);
      if (got < 4.5) problems.push(`${family}: ${signal} reads at ${got.toFixed(2)}:1, under AA`);
    }
    for (const [series, colour] of Object.entries(t.chart)) {
      const got = contrastRatio(colour, s.background);
      if (got < 3) problems.push(`${family}: chart ${series} is ${got.toFixed(2)}:1 against the ground, under 3:1`);
    }
    const git = [t.state.modified, t.state.added, t.state.deleted, t.state.untracked];
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
