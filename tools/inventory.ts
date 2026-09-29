/*
 * Writes docs/INVENTORY.md — what the extension contains, what VS Code offers
 * that it does not colour yet, and the fingerprints of the previews:
 *
 *   node tools/inventory.ts           rewrite it
 *   node tools/inventory.ts --check   fail if it is out of date
 *
 * Why this exists
 * ---------------
 * Every later milestone in the roadmap changes one of these numbers on purpose,
 * and the point of writing them down is that it cannot happen by accident. The
 * file is generated, checked in, and compared by `npm run check`, so a change
 * that adds forty workbench colours, drops an icon association or regenerates
 * a screenshot shows up as a diff in this file, in the same commit, where a
 * reviewer reads it — rather than as a number somebody remembers differently.
 *
 * WHAT "FALLS BACK TO DEFAULTS" MEANS. A colour theme only sets the IDs it
 * names; every other surface is painted by VS Code's own dark theme. The list
 * of IDs comes from tools/vscode-colors.json (see tools/import-vscode-colors.ts),
 * and every documented ID the theme does not name is one of those surfaces.
 * Some of them are fine as they are — many default to a transparent colour or
 * derive from an ID the theme does set — so the list is a map of where to look,
 * not a list of bugs.
 *
 * Nothing here reads the network or the clock, so two runs on the same tree
 * write the same bytes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AMENDMENTS, BASELINE, sha256 } from './baseline.ts';
import { FAMILY_ORDER, signalsFor } from './theme-palette.ts';
import { DOCS, OVERLAY, SIGNAL_TOLERANCE, STATES, docOf, flatten, tokensFor, type Group } from './theme-tokens.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const OUT = path.join(ROOT, 'docs', 'INVENTORY.md');
const TOKENS_OUT = path.join(ROOT, 'docs', 'TOKENS.md');

const read = (...p: string[]): string => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const readJson = (...p: string[]): any => JSON.parse(read(...p));
const short = (hash: string): string => hash.slice(0, 12);
const pct = (n: number, of: number): string => `${((100 * n) / of).toFixed(1)}%`;

type Theme = {
  colors: Record<string, string>;
  tokenColors: { scope: string | string[]; settings: { fontStyle?: string } }[];
  semanticTokenColors: Record<string, unknown>;
};

/* -------------------------------------------------------------- *
 * The extension
 * -------------------------------------------------------------- */

const manifest = readJson('package.json');
const themes: { label: string; path: string }[] = manifest.contributes.themes;
const built = themes.map((t) => ({ label: t.label, theme: readJson(t.path) as Theme }));
const indigo = built[0].theme;

/** The structure every variant has to share: same keys, same rule count. */
const shape = (t: Theme): string =>
  JSON.stringify([
    Object.keys(t.colors),
    t.tokenColors.map((r) => r.scope),
    Object.keys(t.semanticTokenColors),
  ]);
const divergent = built.filter((b) => shape(b.theme) !== shape(indigo)).map((b) => b.label);

const scopes = indigo.tokenColors.flatMap((r) => (Array.isArray(r.scope) ? r.scope : [r.scope]));

const iconTheme = readJson(manifest.contributes.iconThemes[0].path.replace(/^\.\//, ''));
const svgCount = fs.readdirSync(path.join(ROOT, 'icons', 'svg')).filter((f) => f.endsWith('.svg')).length;
const count = (key: string): number => Object.keys(iconTheme[key] ?? {}).length;

/* -------------------------------------------------------------- *
 * VS Code's colour IDs, and who owns each one
 * -------------------------------------------------------------- */

const vscode = readJson('tools', 'vscode-colors.json') as {
  source: string;
  current: { ref: string; date: string };
  floor: { vscode: string; ref: string; date: string };
  sections: Record<string, string[]>;
  floorIds: string[];
};
const atFloor = new Set(vscode.floorIds);

/*
 * The roadmap milestone that is responsible for each ID. Mostly that is the
 * documentation's own section, but several sections are grab-bags — "Editor
 * colors" holds the diagnostics, the inlay hints, the sticky scroll and the
 * diff gutter all at once — so the prefixes below are checked first.
 *
 * Every ID has an owner. A section VS Code adds later is not silently left to
 * nobody: the build stops until BY_SECTION names who is responsible for it.
 */
const MILESTONES: Record<string, string> = {
  M1: 'Tokens and surfaces',
  M2: 'Workbench',
  M4: 'Diagnostics, debug and testing',
  M5: 'Editor intelligence',
  M6: 'Terminal',
  M7: 'Diff, merge and Git',
  M8: 'Chat and agents',
  M9: 'Syntax',
};

const BY_PREFIX: [RegExp, string][] = [
  // The editor's own ground: what the M1 surface and text tokens are applied to first.
  [/^(editor.(background|foreground|selection|inactiveSelection|lineHighlight|inactiveLineHighlight|placeholder|compositionBorder)|editorCursor|editorMultiCursor|editorLineNumber|editorGutter.background)/, 'M1'],
  [/^(debug|testing|editor.(stackFrame|focusedStackFrame|inlineValues))/, 'M4'],
  [/^(editorCommentsWidget|editorGutter.comment|editorOverviewRuler.commentDraft|commentsView)/, 'M7'],
  [/^markdownAlert/, 'M9'],
  [/^(chat|inlineChat|interactive|agent|aiCustomization|inlineEdit)/, 'M8'],
  [/^editorOverviewRuler\.inlineChat/, 'M8'],
  [/^(minimap\.chatEditHighlight|editorMinimap\.inlineChat)/, 'M8'],
  [/^(search\.|searchEditor\.)/, 'M5'],
  [/^terminal/, 'M6'],
  [/^(diffEditor|multiDiffEditor|merge|mergeEditor|gitDecoration|scmGraph|minimapGutter)/, 'M7'],
  [/^editorGutter\.(modified|added|deleted)/, 'M7'],
  [/^editorOverviewRuler\.(modified|added|deleted|currentContent|incomingContent|commonContent)/, 'M7'],
  [/^(editorError|editorWarning|editorInfo|editorHint|editorUnnecessaryCode|problems[A-Z]|inputValidation|editorMarkerNavigation)/, 'M4'],
  [/^(editorOverviewRuler|minimap)\.(error|warning|info)/, 'M4'],
  [/^list\.(error|warning)Foreground/, 'M4'],
  [/^(editorInlayHint|editorCodeLens|editorStickyScroll|editorLightBulb|editorSuggestWidget|editorHoverWidget|editorGhostText|symbolIcon|peekView)/, 'M5'],
  [/^editor\.(findMatch|findRange|rangeHighlight|wordHighlight|hoverHighlight|symbolHighlight|selectionHighlight|snippet)/, 'M5'],
  [/^editorOverviewRuler\.(findMatch|rangeHighlight|selectionHighlight|wordHighlight)/, 'M5'],
];

const BY_SECTION: Record<string, string> = {
  'Contrast colors': 'M1',
  'Base colors': 'M1',
  'Window border': 'M1',
  'Text colors': 'M1',
  'Modern UI colors': 'M2',
  'Action colors': 'M2',
  'Button control': 'M2',
  'Dropdown control': 'M2',
  'Input control': 'M2',
  'Scrollbar control': 'M2',
  Badge: 'M2',
  'Progress bar': 'M2',
  'Lists and trees': 'M2',
  'Activity Bar': 'M2',
  Profiles: 'M2',
  'Side Bar': 'M2',
  'Editor Groups & Tabs': 'M2',
  'Editor widget colors': 'M2',
  'Panel colors': 'M2',
  'Status Bar colors': 'M2',
  'Title Bar colors': 'M2',
  'Menu Bar colors': 'M2',
  'Command Center colors': 'M2',
  'Notification colors': 'M2',
  'Banner colors': 'M2',
  'Extensions colors': 'M2',
  'Quick picker colors': 'M2',
  'Keybinding label colors': 'M2',
  'Keyboard shortcut table colors': 'M2',
  'Settings Editor colors': 'M2',
  'Breadcrumbs colors': 'M2',
  'Action Bar colors': 'M2',
  'Simple Find Widget colors': 'M2',
  'Editor colors': 'M5',
  Minimap: 'M5',
  'Diff editor colors': 'M7',
  'Merge conflicts colors': 'M7',
  'Git colors': 'M7',
  'Source Control Graph colors': 'M7',
  'Chat colors': 'M8',
  'Agent sessions colors': 'M8',
  'Inline Chat colors': 'M8',
  'Panel Chat colors': 'M8',
  'Agent Session colors': 'M8',
  'Peek view colors': 'M5',
  'Symbol Icons colors': 'M5',
  'Snippets colors': 'M5',
  'Integrated Terminal colors': 'M6',
  'Debug colors': 'M4',
  'Debug Icons colors': 'M4',
  'Testing colors': 'M4',
  'Notebook colors': 'M2',
  'Welcome page colors': 'M2',
  'Chart colors': 'M1',
  'Gauge colors': 'M2',
  'Ports colors': 'M6',
  'Comments View colors': 'M7',
  Markdown: 'M9',
};

/*
 * IDs a milestone looked at and decided VS Code's default is right for. They
 * are still unset, but they are no longer "not looked at yet", and the list
 * below says so and why. Setting one of them later is allowed — it fails the
 * inventory until it is taken off this list, so the decision is reversed on
 * purpose rather than forgotten.
 */
const LEFT_TO_VSCODE: Record<string, string> = {
  contrastBorder: 'an extra border for high-contrast themes; on a dark theme it outlines every element',
  contrastActiveBorder: 'the same, for the active element',
  'window.activeBorder': 'a border round the whole window; the frame already ends at the title bar',
  'window.inactiveBorder': 'the same, for an unfocused window',
  'editor.selectionForeground': 'repaints selected text in one colour, which throws away the syntax colours inside every selection',
  'editor.selectionHighlightBorder': 'the fill already marks the other occurrences; a border on top boxes every one of them',

  // M2. Most of these default to nothing, and nothing is the design: a ground
  // that lets the one under it show, or a second border where one already
  // marks the state.
  'list.activeSelectionIconForeground': 'repaints every icon in a selected row in one colour, file icons included; unset, the file icons keep their own, and codicons — symbol icons, view icons — take the row text colour',
  'list.inactiveSelectionIconForeground': 'the same, for the selection of an unfocused list',
  'quickInputList.focusIconForeground': 'the same, for the focused row of the quick pick',
  'list.focusForeground': 'the focused row is marked by its ground and its outline; its text keeps the colour it has',
  'list.hoverForeground': 'the hovered row is marked by its ground; its text keeps the colour it has',
  'list.focusAndSelectionOutline': 'falls back to `list.focusOutline`, which is the focus colour already',
  'list.inactiveFocusBackground': 'an unfocused list shows its selection and nothing else — a second marker for where focus was is noise',
  'list.inactiveFocusOutline': 'the same, as an outline',
  'list.filterMatchBorder': "follows `editor.findMatchHighlightBorder`, so a filter match and a find match stay one thing — that one is M5's",
  'toolbar.hoverOutline': 'an outline for high-contrast themes; the hover ground already marks the button',
  'button.border': 'follows `contrastBorder`, which is left unset: a filled button needs no outline on a dark ground',
  'menubar.selectionBorder': 'the same, for the menu bar entry under the pointer',
  'menu.selectionBorder': 'the same, for the menu item under the pointer',
  'radio.inactiveForeground': 'an unselected option keeps the text colour of the control it is in',
  'radio.inactiveBackground': 'an unselected option has no ground of its own',
  'dropdown.listBackground': 'falls back to `dropdown.background`, so the open list is the same surface as the closed control',
  'scrollbar.background': 'the track stays clear; the slider is the only part that is drawn',
  'activityBar.activeBackground': 'the active view is marked by its accent rule and its brighter icon; a ground behind it as well is a second marker',
  'activityBar.activeFocusBorder': 'keyboard focus draws the focus ring already',
  'activityBarTop.background': 'with the activity bar on top it sits in the side-bar title, and takes that ground',
  'activityBarTop.activeBackground': 'the same as the side activity bar: the accent rule marks the active view',
  'sideBarTitle.border': 'the title and the first section header are already separated by the header border',
  'sideBarStickyScroll.border': 'the sticky rows are separated by their shadow, as the editor sticky scroll is',
  'panelStickyScroll.border': 'the same, in the panel',
  'editorGroupHeader.tabsBorder': '`editorGroupHeader.border` already rules the strip off from the editor',
  'editorGroup.emptyBackground': 'an empty group is the editor ground, like a full one',
  'tab.activeBorder': 'the active tab is marked at the top, by `tab.activeBorderTop`; a rule at the bottom as well boxes it in',
  'tab.unfocusedActiveBorder': 'the same, in an unfocused group',
  'tab.hoverBorder': 'the hovered tab is marked by its ground',
  'tab.unfocusedHoverBorder': 'the same, in an unfocused group',
  'modernEditorTab.inactiveBackground': 'transparent by default, so an inactive tab is the strip it sits on — the same as the classic tabs',
  'editorWidget.resizeBorder': 'falls back to the widget border, which is what is being dragged',
  'panelTitle.border': 'the active panel is marked by `panelTitle.activeBorder`; a rule under the whole strip is a second one',
  'outputView.background': 'the output view is a read-only editor and takes the editor ground',
  'outputViewStickyScroll.background': 'follows `outputView.background`',
  'welcomePage.background': 'the welcome page is an editor and takes the editor ground',
  'notebook.focusedCellBackground': 'the focused cell is marked by its border in the focus colour; a ground as well tints the code inside it',
  'notebook.cellHoverBackground': 'derived from `notebook.focusedCellBackground`, so it is clear too',
  'notebook.inactiveSelectedCellBorder': 'a selected cell in an unfocused notebook keeps its selection ground; a border as well boxes it',
  'notebook.outputContainerBackgroundColor': 'an output sits on the notebook ground, as terminal output sits on the terminal',
  'notebook.outputContainerBorderColor': 'the cell border already frames the output with its cell',

  // M4. The squiggle is the mark; everything below would draw a second one
  // over the code it flags.
  'editorError.background': 'a band behind every flagged range tints the code inside it; the squiggle already marks the range',
  'editorWarning.background': 'the same, for warnings',
  'editorInfo.background': 'the same, for infos',
  'editorError.border': 'a double rule under the squiggle, for high-contrast themes; on a dark theme it is a second underline',
  'editorWarning.border': 'the same, for warnings',
  'editorInfo.border': 'the same, for infos',
  'editorHint.border': 'the same, for hints, whose dots are the mark',
  'editorUnnecessaryCode.border': 'the same, for unused code, which is already faded',
  'editorUnnecessaryCode.opacity':
    'an opacity rather than a colour: VS Code fades unused code to two thirds of itself, which on this ground already reads as muted without losing its syntax colour',
  'testing.message.info.lineBackground':
    'an info message is inline text after the line; a band behind the line as well would mark every logged line of a run',

  // M5. A highlight is a fill behind the code; a border on it boxes every
  // occurrence, and a foreground repaints the code inside it in one colour.
  'editor.findMatchForeground': 'repaints the current match in one colour, which throws away the syntax colours inside it',
  'editor.findMatchHighlightForeground': 'the same, for the other matches',
  'editor.findMatchHighlightBorder': 'the fill already marks the other matches; only the current one carries a rim, so it is told from them by more than a stronger fill',
  'editor.findRangeHighlightBorder': 'the fill marks the range being searched; a border boxes it',
  'editor.rangeHighlightBorder': 'the fill marks the revealed range; a border boxes it',
  'editor.symbolHighlightBorder': 'the fill marks the symbol jumped to; a border boxes it',
  'editor.wordHighlightBorder': 'the fill marks every read of the symbol; a border boxes each one',
  'editor.wordHighlightStrongBorder': 'the same, for writes',
  'editor.wordHighlightTextBorder': 'the same, for textual occurrences',
  'searchEditor.findMatchBorder': 'the same as the editor: the fill marks a match',
  'peekViewEditor.matchHighlightBorder': 'the same, in the peek editor',
  'editor.snippetTabstopHighlightBorder': 'the fill marks the tab stop being edited; a border boxes it',
  'editor.snippetFinalTabstopHighlightBackground': 'the final stop is where the cursor lands, and is marked by its rim alone, so it is not mistaken for a stop still to fill',
  'editorBracketMatch.foreground': 'repaints the matched brackets in one colour, which throws away the pair colours',
  'editorUnicodeHighlight.background': 'the warning rim marks the character; a band behind it as well tints the code',
  'editorGhostText.border': 'ghost text is marked by its muted colour; a box round it reads as a widget, not as text that is not there yet',
  'editorGhostText.background': 'the same, as a ground',
  'editorOverviewRuler.background': 'the ruler lane is the editor ground already',
  'minimap.foregroundOpacity':
    'an opacity rather than a colour: the minimap draws the syntax colours at full strength in a few pixels, which on this ground reads as texture, not as code',

  // M6. The terminal's highlights follow the editor's; its completion icons
  // already follow the symbol icons M5 set, which is the design.
  'terminal.selectionForeground': "repaints selected output in one colour, which throws away the ANSI colours inside every selection — the same reason as the editor's",
  'terminal.findMatchHighlightBorder': 'the fill already marks the other matches; only the current one carries a rim, as in the editor',
  'terminalSymbolIcon.aliasForeground': 'follows `symbolIcon.methodForeground`: an alias runs a command, and is drawn in the function colour',
  'terminalSymbolIcon.methodForeground': 'follows `symbolIcon.methodForeground`, the function colour',
  'terminalSymbolIcon.argumentForeground': 'follows `symbolIcon.variableForeground`, the variable colour',
  'terminalSymbolIcon.flagForeground': 'follows `symbolIcon.enumeratorForeground`: a flag is one of a fixed set, drawn in the interface and enum colour',
  'terminalSymbolIcon.optionForeground': 'the same, for an option',
  'terminalSymbolIcon.optionValueForeground': "follows `symbolIcon.enumeratorMemberForeground`: an option's value is a member of its set",
  'terminalSymbolIcon.fileForeground': 'follows `symbolIcon.fileForeground`, the secondary text colour, as files are in the suggest list',
  'terminalSymbolIcon.folderForeground': 'follows `symbolIcon.folderForeground`, the same',
  'terminalSymbolIcon.symbolicLinkFileForeground': 'follows `symbolIcon.fileForeground`',
  'terminalSymbolIcon.symbolicLinkFolderForeground': 'follows `symbolIcon.folderForeground`',
  'terminalSymbolIcon.symbolText': 'follows `symbolIcon.fileForeground`: plain completions are secondary text',
  'terminalSymbolIcon.branchForeground': 'follows `symbolIcon.fileForeground`: Git refs are names, not code, and read as secondary text, told apart by their icons',
  'terminalSymbolIcon.commitForeground': 'the same, for a commit',
  'terminalSymbolIcon.tagForeground': 'the same, for a tag',
  'terminalSymbolIcon.remoteForeground': 'the same, for a remote',
  'terminalSymbolIcon.stashForeground': 'the same, for a stash',
  'terminalSymbolIcon.pullRequestForeground': 'the same, for a pull request',
  'terminalSymbolIcon.pullRequestDoneForeground': 'the same, for a merged pull request',

  // M7. Changed text is marked by its ground, as a highlight is; a conflict
  // by its header lines and its grounds.
  'diffEditor.insertedTextBorder': 'a rim round inserted text, for high-contrast themes; the ground already marks it, and a rim boxes every changed word',
  'diffEditor.removedTextBorder': 'the same, for removed text',
  'merge.border': 'a rule round the headers and blocks of an inline conflict, for high-contrast themes; the tinted header lines already mark where each block starts',

  // M8.
  'agentsNewSessionButton.background': 'transparent by default: the New Session button is outlined, like a secondary action, and its border and hover mark it',
};

/*
 * IDs the theme sets although the colour reference does not list them, and
 * why. Each is registered by the VS Code the review ran in (1.139) and paints
 * something a milestone is responsible for, which the reference has not
 * caught up with yet. A set ID missing from the page and from this list stops
 * the build, as an ID on the page that nobody owns does.
 */
const NOT_DOCUMENTED: Record<string, string> = {
  'chat.inputWorkingBorderColor1': "the border that runs round the chat input while a request is in flight — M8's working state",
  'chat.sessionStateIndicator.inProgressBorder': 'a chat editor with a request in progress',
  'chat.sessionStateIndicator.unvisitedBorder': 'a chat editor whose answer has not been seen',
  'chat.sessionStateIndicator.needsInputBorder': 'a chat editor waiting for the person',
  'chat.findMatchBackground': 'the current find match in a chat transcript, kept the same as in the editor',
  'chat.findMatchHighlightBackground': 'the other find matches in a chat transcript, the same',
};

const unmapped = Object.keys(vscode.sections).filter((s) => !(s in BY_SECTION));
if (unmapped.length) {
  throw new Error(
    `tools/vscode-colors.json has sections this file does not assign: ${unmapped.join(', ')} — add them to BY_SECTION`
  );
}

const ownerOf = (id: string, section: string): string =>
  BY_PREFIX.find(([re]) => re.test(id))?.[1] ?? BY_SECTION[section];

type Row = { id: string; section: string; owner: string; set: boolean; modern: boolean };
const rows: Row[] = Object.entries(vscode.sections).flatMap(([section, ids]) =>
  ids.map((id) => ({
    id,
    section,
    owner: ownerOf(id, section),
    set: id in indigo.colors,
    modern: !atFloor.has(id),
  }))
);
const documented = new Set(rows.map((r) => r.id));
const reversed = Object.keys(LEFT_TO_VSCODE).filter((id) => id in indigo.colors || !documented.has(id));
if (reversed.length) {
  throw new Error(
    `LEFT_TO_VSCODE names ${reversed.join(', ')}, which the theme now sets or VS Code no longer documents — take them off the list`
  );
}
const undocumented = Object.keys(indigo.colors).filter((id) => !documented.has(id));
const unexplained = undocumented.filter((id) => !(id in NOT_DOCUMENTED));
const stale = Object.keys(NOT_DOCUMENTED).filter((id) => documented.has(id) || !(id in indigo.colors));
if (unexplained.length || stale.length) {
  throw new Error(
    [
      unexplained.length && `the theme sets ${unexplained.join(', ')}, which VS Code does not document — say why in NOT_DOCUMENTED`,
      stale.length && `NOT_DOCUMENTED names ${stale.join(', ')}, which VS Code now documents or the theme no longer sets — take them off the list`,
    ]
      .filter(Boolean)
      .join('; ')
  );
}

type Tally = { total: number; set: number; left: number; modern: number; modernUnset: number };
const tally = (rs: Row[]): Tally => ({
  total: rs.length,
  set: rs.filter((r) => r.set).length,
  left: rs.filter((r) => r.id in LEFT_TO_VSCODE).length,
  modern: rs.filter((r) => r.modern).length,
  modernUnset: rs.filter((r) => r.modern && !r.set).length,
});
const all = tally(rows);

/* -------------------------------------------------------------- *
 * The previews
 * -------------------------------------------------------------- */

const PREVIEW_SCRIPTS = ['tools/build-theme-preview.ts', 'tools/build-icon-preview.ts'];
const previewIds = [
  ...new Set(PREVIEW_SCRIPTS.flatMap((f) => [...read(f).matchAll(/\bC\['([A-Za-z0-9.]+)'\]/g)].map((m) => m[1]))),
].sort();

const imageRef = /const IMAGE_REF = '([0-9a-f]+)'/.exec(read('tools', 'build-theme-preview.ts'))?.[1] ?? '?';

const hashFile = (...p: string[]): string => sha256(fs.readFileSync(path.join(ROOT, ...p)));
const samples = fs.readdirSync(path.join(HERE, 'samples')).sort();
const pngs = fs.readdirSync(path.join(ROOT, 'docs', 'preview')).filter((f) => f.endsWith('.png')).sort();

/* -------------------------------------------------------------- *
 * The document
 * -------------------------------------------------------------- */

const out: string[] = [];
const line = (s = ''): void => void out.push(s);
const table = (head: string[], body: (string | number)[][]): void => {
  line(`| ${head.join(' | ')} |`);
  // Numbers right, words left.
  const numeric = head.map((_, i) => body.every((r) => typeof r[i] === 'number' || /^[\d.]+%$/.test(String(r[i]))));
  line(`| ${numeric.map((n) => (n ? '---:' : '---')).join(' | ')} |`);
  for (const r of body) line(`| ${r.join(' | ')} |`);
  line();
};

line('# Inventory');
line();
line('> Generated by `npm run inventory` from the built themes, the icon theme and');
line('> [`tools/vscode-colors.json`](../tools/vscode-colors.json). Do not edit it by hand —');
line('> `npm run check` fails when it no longer matches the tree, which is the point:');
line('> a change to any number below shows up in the same diff as the change that caused it.');
line();

line('## Reference');
line();
line(
  `- **Baseline:** [\`tools/indigo-baseline.json\`](../tools/indigo-baseline.json) is Midnight Indigo as v${BASELINE.version} shipped it ` +
    `(commit \`${BASELINE.commit}\`), sha256 \`${short(BASELINE.sha256)}…\`. The build fails if the indigo variant does not serialize to it byte for byte, ` +
    `with the ${AMENDMENTS.length} amendments below applied.`
);
line(
  `- **VS Code colour reference:** [microsoft/vscode-docs@${vscode.current.ref.slice(0, 7)}](${vscode.source}) ` +
    `(${vscode.current.date}), against the same page at VS Code ${vscode.floor.vscode} — the \`engines\` floor — ` +
    `at \`${vscode.floor.ref.slice(0, 7)}\` (${vscode.floor.date}).`
);
line(`- **Screenshot ref:** the README and PREVIEW.md load their images from \`${imageRef.slice(0, 7)}\` (\`IMAGE_REF\`).`);
line();

line('### Baseline amendments');
line();
line(
  'Shipped values changed on purpose. The baseline file stays the bytes that shipped; these are applied to it before the comparison, and the build refuses one whose old value is not what the file says.'
);
line();
table(
  ['Key', 'Was', 'Now', 'By', 'Why'],
  AMENDMENTS.map((a) => [`\`${a.key}\``, `\`${a.was}\``, `\`${a.now}\``, a.by, a.why])
);

line('## What the extension contains');
line();
table(
  ['', 'Count'],
  [
    ['Colour themes', themes.length],
    ['Workbench colours, per theme', Object.keys(indigo.colors).length],
    ['TextMate rules, per theme', indigo.tokenColors.length],
    ['TextMate scopes across those rules', scopes.length],
    ['Semantic token rules, per theme', Object.keys(indigo.semanticTokenColors).length],
    ['Icon definitions', count('iconDefinitions')],
    ['SVGs in `icons/svg/`', svgCount],
    ['File-extension associations', count('fileExtensions')],
    ['Exact-filename associations', count('fileNames')],
    ['Folder-name associations (closed)', count('folderNames')],
    ['Folder-name associations (open)', count('folderNamesExpanded')],
    ['Language-id associations', count('languageIds')],
  ]
);
line(
  divergent.length
    ? `**The variants do not share one structure:** ${divergent.join(', ')} differ from Midnight Indigo.`
    : 'All eight themes share one structure — the same workbench keys, the same TextMate rules in the same order, the same semantic rules — so every count above holds for each of them.'
);
line();

line('## Workbench coverage');
line();
line(
  `The theme sets **${all.set} of the ${all.total}** colour IDs VS Code documents (${pct(all.set, all.total)}). ` +
    `**${all.modern}** of those IDs were added after VS Code ${vscode.floor.vscode}, and the theme sets ` +
    `${all.modern - all.modernUnset} of them. Everything it does not set is painted by VS Code's default dark theme.`
);
line();

line('### By milestone');
line();
table(
  ['Owner', 'Set', 'Left to VS Code', 'Documented', 'Coverage', `Added since ${vscode.floor.vscode}, unset`],
  Object.entries(MILESTONES).map(([m, name]) => {
    const t = tally(rows.filter((r) => r.owner === m));
    return [`${m} ${name}`, t.set, t.left, t.total, pct(t.set, t.total), t.modernUnset];
  })
);
line('"Left to VS Code" counts the IDs a milestone decided not to set; they are listed, with the reason, below.');
line();
line(
  'M3 (interaction states) is not in the table because it owns no IDs of its own: it is the pass over the hover, focus, active and selected IDs the other milestones set, written down as the state grammar in [`docs/TOKENS.md`](TOKENS.md#interaction-states) and held by check 11 of the theme build.'
);
line();

line('### By section');
line();
line("The sections are the colour reference's own.");
line();
table(
  ['Section', 'Owner', 'Set', 'Documented', `Added since ${vscode.floor.vscode}, unset`],
  Object.keys(vscode.sections).map((s) => {
    const rs = rows.filter((r) => r.section === s);
    const t = tally(rs);
    const owners = [...new Set(rs.map((r) => r.owner))].sort().join(', ');
    return [s, owners, t.set, t.total, t.modernUnset];
  })
);

line('### IDs the theme sets that VS Code does not document');
line();
if (undocumented.length) {
  line(
    'Registered by VS Code and read by it, but not on the colour reference. Each is counted in the colours the theme sets, and in no coverage figure above.'
  );
  line();
  table(
    ['ID', 'Owner', 'What it paints'],
    undocumented.map((id) => [`\`${id}\``, ownerOf(id, ''), NOT_DOCUMENTED[id]])
  );
} else {
  line('None.');
  line();
}

line('### Left to VS Code on purpose');
line();
table(
  ['ID', 'Owner', 'Why'],
  rows.filter((r) => r.id in LEFT_TO_VSCODE).map((r) => [`\`${r.id}\``, r.owner, LEFT_TO_VSCODE[r.id]])
);

line('### Everything that falls back to defaults');
line();
line(`† marks an ID added after VS Code ${vscode.floor.vscode}. The IDs above, left to VS Code on purpose, are not repeated here.`);
line();
for (const s of Object.keys(vscode.sections)) {
  const unset = rows.filter((r) => r.section === s && !r.set && !(r.id in LEFT_TO_VSCODE));
  if (!unset.length) continue;
  line(`<details><summary>${s} — ${unset.length} unset</summary>`);
  line();
  for (const r of unset) line(`- \`${r.id}\`${r.modern ? ' †' : ''} (${r.owner})`);
  line();
  line('</details>');
  line();
}

line('## Preview corpus');
line();
line(
  'The screenshots are rendered by headless Chromium from the files below. They are pinned by hash so that a run which changes a picture shows up here, whether it was meant to or not.'
);
line();
line('### Code');
line();
table(
  ['Sample', 'Lines', 'sha256'],
  samples.map((f) => [
    `[\`${f}\`](../tools/samples/${f})`,
    read('tools', 'samples', f).split('\n').length,
    `\`${short(hashFile('tools', 'samples', f))}\``,
  ])
);
line('### Workbench');
line();
line(
  `The workbench the hero and the icon galleries draw uses ${previewIds.length} of the theme's workbench colours: ` +
    previewIds.map((id) => `\`${id}\``).join(', ') +
    '.'
);
line();
line('### Screenshots');
line();
table(
  ['Image', 'sha256'],
  pngs.map((f) => [`\`docs/preview/${f}\``, `\`${short(hashFile('docs', 'preview', f))}\``])
);

const text = out.join('\n').replace(/\n+$/, '\n');

/* -------------------------------------------------------------- *
 * docs/TOKENS.md — the roles, and what each is in each family
 * -------------------------------------------------------------- */

const families = FAMILY_ORDER.map((f) => ({ f, t: flatten(tokensFor(f)) }));
const tokenCount = families[0].t.length;
const tok: string[] = [];
const tline = (s = ''): void => void tok.push(s);

tline('# Tokens');
tline();
tline('> Generated by `npm run inventory` from [`tools/theme-tokens.ts`](../tools/theme-tokens.ts). Do not edit it by hand.');
tline();
tline(
  `The theme is written in ${tokenCount} tokens. A token is a job — \`surfaceRaised\`, \`muted\`, \`error\` — and ` +
    'the build writes every VS Code key against one, never against a colour. Each family gives the same tokens different ' +
    'values; the build refuses a colour that is not a token, a token without a documented role, a surface or text ramp ' +
    'that runs backwards, and a signal that has drifted away from the colour it is named for.'
);
tline();
tline('## Overlays');
tline();
tline(
  'Translucent colours are a token plus one step of this ladder, and no other opacity. ' +
    'Derivations: `rest` = faint, `hover` = medium, `active` = heavy, `inactive` = strong, `disabled` = half. ' +
    'Focus is never an overlay: it is `state.focus`, solid.'
);
tline();
tline('| Step | Alpha |');
tline('| --- | ---: |');
for (const [name, a] of Object.entries(OVERLAY)) tline(`| \`${name}\` | \`${a.toString(16).toUpperCase()}\` (${Math.round((a / 255) * 100)}%) |`);
tline();
tline('## Interaction states');
tline();
tline(
  'What each state looks like and which channel carries it. The build measures every control that has states, in every family, as the colours it composites to on its own ground: each state at least 3 ΔE (OKLab × 100) from rest unless it draws a mark of its own, the pairs that must never be confused at least as far apart, hover always the weakest step, the accent kept off hover, pressing and selection, and every focus ring solid and at 3:1 on every surface.'
);
tline();
tline('| State | Grammar |');
tline('| --- | --- |');
for (const [state, text] of Object.entries(STATES)) tline(`| \`${state}\` | ${text} |`);
tline();
for (const group of Object.keys(DOCS) as Group[]) {
  tline(`## \`${group}\``);
  tline();
  tline('| Token | Role |');
  tline('| --- | --- |');
  for (const [name] of families[0].t.filter(([n]) => n.startsWith(`${group}.`))) {
    tline(`| \`${name}\` | ${docOf(name)} |`);
  }
  tline();
  tline(`| Token | ${FAMILY_ORDER.join(' | ')} |`);
  tline(`| --- | ${FAMILY_ORDER.map(() => '---').join(' | ')} |`);
  for (const [i, [name]] of families[0].t.entries()) {
    if (!name.startsWith(`${group}.`)) continue;
    tline(`| \`${name.slice(group.length + 1)}\` | ${families.map(({ t }) => `\`${t[i][1]}\``).join(' | ')} |`);
  }
  tline();
}
tline('## Signals');
tline();
tline(
  'Which ink each family lends to each signal. Written down per family, and checked: every one lands within ' +
    `${SIGNAL_TOLERANCE}° of the hue VS Code uses for it, and no two share an ink. Error and warning are not lent: ` +
    'they are palette colours of their own (`state.error`, `state.warning` above), held clear of every code ink and the accent, ' +
    'and told apart from each other and from info by lightness as well as hue. Every ID that means a diagnostic — the squiggle, ' +
    'the ruler, the Problems view, the debug console, the test result — is checked to be its token.'
);
tline();
tline(`| Family | ${Object.keys(signalsFor('indigo')).join(' | ')} |`);
tline(`| --- | ${Object.keys(signalsFor('indigo')).map(() => '---').join(' | ')} |`);
for (const f of FAMILY_ORDER) tline(`| ${f} | ${Object.values(signalsFor(f)).map((s) => `\`${s}\``).join(' | ')} |`);

const tokensText = tok.join('\n') + '\n';

const OUTPUTS: [string, string][] = [
  [OUT, text],
  [TOKENS_OUT, tokensText],
];

if (process.argv.includes('--check')) {
  for (const [file, want] of OUTPUTS) {
    const name = path.relative(ROOT, file).replace(/\\/g, '/');
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (current !== want) {
      console.error(`  ! ${name} is out of date — run \`npm run inventory\` and commit the result`);
      process.exitCode = 1;
    } else {
      console.log(`${name} is up to date`);
    }
  }
} else {
  for (const [file, want] of OUTPUTS) fs.writeFileSync(file, want, 'utf8');
  console.log(
    `wrote docs/INVENTORY.md — ${all.set}/${all.total} workbench IDs set, ${all.total - all.set} falling back to defaults`
  );
  console.log(`wrote docs/TOKENS.md — ${tokenCount} tokens across ${FAMILY_ORDER.length} families`);
}
