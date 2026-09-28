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
import { BASELINE, sha256 } from './baseline.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const OUT = path.join(ROOT, 'docs', 'INVENTORY.md');

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
const undocumented = Object.keys(indigo.colors).filter((id) => !documented.has(id));

type Tally = { total: number; set: number; modern: number; modernUnset: number };
const tally = (rs: Row[]): Tally => ({
  total: rs.length,
  set: rs.filter((r) => r.set).length,
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
    `(commit \`${BASELINE.commit}\`), sha256 \`${short(BASELINE.sha256)}…\`. The build fails if the indigo variant does not serialize to it byte for byte.`
);
line(
  `- **VS Code colour reference:** [microsoft/vscode-docs@${vscode.current.ref.slice(0, 7)}](${vscode.source}) ` +
    `(${vscode.current.date}), against the same page at VS Code ${vscode.floor.vscode} — the \`engines\` floor — ` +
    `at \`${vscode.floor.ref.slice(0, 7)}\` (${vscode.floor.date}).`
);
line(`- **Screenshot ref:** the README and PREVIEW.md load their images from \`${imageRef.slice(0, 7)}\` (\`IMAGE_REF\`).`);
line();

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
  ['Owner', 'Set', 'Documented', 'Coverage', `Added since ${vscode.floor.vscode}, unset`],
  Object.entries(MILESTONES).map(([m, name]) => {
    const t = tally(rows.filter((r) => r.owner === m));
    return [`${m} ${name}`, t.set, t.total, pct(t.set, t.total), t.modernUnset];
  })
);
line(
  'M3 (interaction states) is not in the table because it owns no IDs of its own: it is the pass over the hover, focus, active and selected IDs the other milestones set.'
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

line('### IDs the theme sets that VS Code no longer documents');
line();
line(
  undocumented.length
    ? undocumented.map((id) => `\`${id}\``).join(', ') + ' — still read by VS Code or not, they are not on the page.'
    : 'None.'
);
line();

line('### Everything that falls back to defaults');
line();
line(`† marks an ID added after VS Code ${vscode.floor.vscode}.`);
line();
for (const s of Object.keys(vscode.sections)) {
  const unset = rows.filter((r) => r.section === s && !r.set);
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

if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (current !== text) {
    console.error('  ! docs/INVENTORY.md is out of date — run `npm run inventory` and commit the result');
    process.exitCode = 1;
  } else {
    console.log('docs/INVENTORY.md is up to date');
  }
} else {
  fs.writeFileSync(OUT, text, 'utf8');
  console.log(
    `wrote docs/INVENTORY.md — ${all.set}/${all.total} workbench IDs set, ${all.total - all.set} falling back to defaults`
  );
}
