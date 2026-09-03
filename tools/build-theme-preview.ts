/*
 * Renders the screenshots the README and the Marketplace listing use, into
 * docs/preview/:
 *
 *   npm run preview:theme
 *
 *   hero.png      A mock editor window — activity bar, file tree drawn with the
 *                 real icon SVGs, tab strip, code, status bar — so the listing
 *                 shows the theme and the icon set together, the way they are
 *                 actually seen.
 *   <lang>.png    One code sample per language, from tools/samples/.
 *
 * Highlighting is done by Shiki, fed this repo's own theme JSON and the same
 * TextMate grammars VS Code ships, so the colours are the theme's rather than
 * an approximation. The one thing it cannot reproduce is semantic
 * highlighting — but the theme's TextMate rules mirror its semantic rules
 * (functions #5CB3FF, classes #64D8CB, interfaces #D6E64B, parameters italic
 * #B8B2D9), so what you see here is what the editor gives you.
 *
 * Chromium renders the page; there is no image library involved, which is also
 * why the window is sized from the line count rather than cropped afterwards.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** JSON the build reads at runtime rather than importing, so no loader flags. */
const readJson = (...p: string[]): any => JSON.parse(fs.readFileSync(path.join(...p), 'utf8'));

const ROOT = path.join(HERE, '..');
const SAMPLES = path.join(HERE, 'samples');
const SVG = path.join(ROOT, 'icons', 'svg');
const OUT = path.join(ROOT, 'docs', 'preview');
const TMP = path.join(os.tmpdir(), 'midnight-indigo-preview');

const theme = readJson(ROOT, 'themes', 'midnight-indigo-color-theme.json');
const C = theme.colors;

const BROWSERS = [
  process.env.MIDNIGHT_INDIGO_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter((b): b is string => Boolean(b));

function findBrowser(): string {
  for (const b of BROWSERS) if (fs.existsSync(b)) return b;
  throw new Error('No Chromium-based browser found. Set MIDNIGHT_INDIGO_BROWSER to one.');
}

/* Sample file -> Shiki language id, caption, and whether the theme tunes it. */
const LANGUAGES = [
  { file: 'sample.ts', lang: 'typescript', label: 'TypeScript', name: 'member.service.ts', tuned: true },
  { file: 'sample.tsx', lang: 'tsx', label: 'React / TSX', name: 'MemberList.tsx', tuned: true },
  { file: 'sample.js', lang: 'javascript', label: 'JavaScript', name: 'server.js', tuned: true },
  { file: 'sample.cs', lang: 'csharp', label: 'C#', name: 'MemberService.cs', tuned: true },
  { file: 'sample.py', lang: 'python', label: 'Python', name: 'members.py', tuned: true },
  { file: 'sample.ps1', lang: 'powershell', label: 'PowerShell', name: 'promote.ps1', tuned: true },
  { file: 'sample.md', lang: 'markdown', label: 'Markdown', name: 'README.md', tuned: true },
  { file: 'sample.json', lang: 'json', label: 'JSON', name: 'package.json', tuned: true },
  { file: 'sample.html', lang: 'html', label: 'HTML', name: 'index.html' },
  { file: 'sample.scss', lang: 'scss', label: 'SCSS', name: 'roster.scss' },
  { file: 'sample.sql', lang: 'sql', label: 'SQL', name: 'promotions.sql' },
  { file: 'sample.go', lang: 'go', label: 'Go', name: 'members.go' },
  { file: 'sample.rs', lang: 'rust', label: 'Rust', name: 'members.rs' },
  { file: 'sample.java', lang: 'java', label: 'Java', name: 'MemberService.java' },
  { file: 'sample.php', lang: 'php', label: 'PHP', name: 'MemberService.php' },
  { file: 'sample.yaml', lang: 'yaml', label: 'YAML', name: 'release.yml' },
  { file: 'sample.sh', lang: 'bash', label: 'Shell', name: 'promote.sh' },
];

/* The file tree shown in the hero. */
type TreeRow = readonly [depth: number, icon: string, label: string, state?: 'open' | 'active'];
const TREE: TreeRow[] = [
  [0, 'folder-open', 'src', 'open'],
  [1, 'folder-components-open', 'components', 'open'],
  [2, 'file-jsx', 'MemberList.tsx'],
  [2, 'file-jsx-spec', 'MemberList.spec.tsx'],
  [2, 'file-scss-module', 'MemberList.module.scss'],
  [1, 'folder-services', 'services'],
  [1, 'folder-guards', 'guards'],
  [1, 'folder-types', 'types'],
  [1, 'file-typescript-module', 'app.module.ts'],
  [1, 'file-typescript-service', 'member.service.ts', 'active'],
  [1, 'file-typescript-spec', 'member.service.spec.ts'],
  [1, 'file-typescript-dto', 'promote.dto.ts'],
  [0, 'folder-tests', 'tests'],
  [0, 'folder-docker', 'docker'],
  [0, 'file-json', 'tsconfig.json'],
  [0, 'file-npm', 'package.json'],
  [0, 'file-docker', 'Dockerfile'],
  [0, 'file-markdown', 'README.md'],
  [0, 'file-git', '.gitignore'],
];

const FONT = "'Cascadia Code','Cascadia Mono',Consolas,'Courier New',monospace";
const UI_FONT = "'Segoe UI',system-ui,-apple-system,sans-serif";
const LINE_H = 21;
const FONT_SIZE = 13.5;

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const icon = (name: string): string => {
  const file = path.join(SVG, `${name}.svg`);
  if (!fs.existsSync(file)) throw new Error(`preview references a missing icon: ${name}.svg`);
  return `data:image/svg+xml;base64,${fs.readFileSync(file).toString('base64')}`;
};

// Shiki emits one <span class="line"> per line; pair each with a gutter number.
function withGutter(html: string, lineCount: number): string {
  const gutter = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  return (
    `<div class="code"><pre class="gutter">${gutter}</pre>` +
    html.replace(/^<pre[^>]*>/, '<pre class="src">') +
    `</div>`
  );
}

const baseCss = `
  * { box-sizing: border-box; }
  body { margin: 0; background: ${C['editor.background']}; font-family: ${UI_FONT}; }
  .code { display: flex; }
  pre { margin: 0; font-family: ${FONT}; font-size: ${FONT_SIZE}px; line-height: ${LINE_H}px;
        tab-size: 4; -webkit-font-smoothing: antialiased; }
  pre.gutter { color: ${C['editorLineNumber.foreground']}; text-align: right;
               padding: 0 14px 0 18px; user-select: none; }
  pre.src { background: transparent !important; flex: 1; padding-right: 20px; }
  /* Shiki's line spans are already separated by newlines inside the <pre>;
     making them blocks as well would double every line's height. */
  .code .line { display: inline; }
`;

/* -------------------------------------------------------------- *
 * Per-language cards
 * -------------------------------------------------------------- */

function cardPage(html: string, item: any, lineCount: number): string {
  return `<!doctype html><meta charset="utf-8"><style>${baseCss}
  .card { background: ${C['editor.background']}; border: 1px solid ${C['tab.border']};
          border-radius: 10px; overflow: hidden; }
  .bar { display: flex; align-items: stretch; background: ${C['editorGroupHeader.tabsBackground']};
         border-bottom: 1px solid ${C['editorGroupHeader.border']}; }
  .tab { display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12.5px;
         color: ${C['tab.activeForeground']}; background: ${C['tab.activeBackground']};
         border-top: 1px solid ${C['tab.activeBorderTop']}; }
  .tab img { width: 16px; height: 16px; }
  .lang { margin-left: auto; padding: 8px 16px; font-size: 11.5px; letter-spacing: .06em;
          text-transform: uppercase; color: ${C['editorLineNumber.foreground']}; }
  .body { padding: 14px 0; }
  </style><div class="card"><div class="bar">
    <div class="tab"><img src="${icon(item.iconName)}" alt="">${esc(item.name)}</div>
    <div class="lang">${esc(item.label)}</div>
  </div><div class="body">${withGutter(html, lineCount)}</div></div>`;
}

/* -------------------------------------------------------------- *
 * Hero: a mock editor window
 * -------------------------------------------------------------- */

// Explorer, search, source control, extensions — drawn rather than imported,
// they only need to read as the activity bar at a glance.
const ACTIVITY_ICONS = [
  '<svg class="on" viewBox="0 0 24 24"><path d="M4 6h5l2 2.5h9V19H4Z"/></svg>',
  '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',
  '<svg viewBox="0 0 24 24"><circle cx="7" cy="6" r="2.4"/><circle cx="7" cy="18" r="2.4"/>' +
    '<circle cx="17" cy="9" r="2.4"/><path d="M7 8.4v7.2M17 11.4c0 3-3.4 3.4-6.6 3.4"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4Zm9 9h7v7h-7Zm-9 0h7v7H4Zm9-9h7v7h-7Z"/></svg>',
].join('');

function heroPage(html: string, lineCount: number): string {
  const rows = TREE.map(([depth, ic, label, state]) => {
    const bg = state === 'active' ? `background:${C['list.activeSelectionBackground']};` : '';
    const fg = state === 'active' ? C['list.activeSelectionForeground'] : C['sideBar.foreground'];
    const chevron = state === 'open' ? '⌄' : ic.startsWith('folder') ? '›' : '';
    return (
      `<div class="row" style="${bg}padding-left:${10 + depth * 14}px;color:${fg}">` +
      `<span class="chev">${chevron}</span><img src="${icon(ic)}" alt="">${esc(label)}</div>`
    );
  }).join('');

  return `<!doctype html><meta charset="utf-8"><style>${baseCss}
  .win { display: flex; flex-direction: column; height: 100vh; }
  .title { height: 34px; display: flex; align-items: center; justify-content: center;
           background: ${C['titleBar.activeBackground']}; color: ${C['titleBar.activeForeground']};
           border-bottom: 1px solid ${C['titleBar.border']}; font-size: 12px; }
  .main { flex: 1; display: flex; min-height: 0; }
  .activity { width: 48px; background: ${C['activityBar.background']};
              border-right: 1px solid ${C['activityBar.border']};
              display: flex; flex-direction: column; align-items: center; padding-top: 10px; gap: 16px; }
  .activity svg { width: 22px; height: 22px; display: block;
                  stroke: ${C['activityBar.inactiveForeground']}; fill: none;
                  stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; }
  .activity svg.on { stroke: ${C['activityBar.foreground']}; }
  .side { width: 262px; background: ${C['sideBar.background']};
          border-right: 1px solid ${C['sideBar.border']}; overflow: hidden; }
  .side h2 { margin: 0; padding: 9px 14px; font-size: 11px; font-weight: 600; letter-spacing: .08em;
             text-transform: uppercase; color: ${C['sideBarTitle.foreground']};
             background: ${C['sideBarSectionHeader.background']};
             border-bottom: 1px solid ${C['sideBarSectionHeader.border']}; }
  .row { display: flex; align-items: center; gap: 7px; height: 23px; font-size: 13px; }
  .row img { width: 16px; height: 16px; flex: none; }
  .chev { width: 10px; flex: none; font-size: 11px; color: ${C['editorLineNumber.foreground']}; }
  .editor { flex: 1; display: flex; flex-direction: column; min-width: 0;
            background: ${C['editor.background']}; }
  .tabs { display: flex; background: ${C['editorGroupHeader.tabsBackground']};
          border-bottom: 1px solid ${C['editorGroupHeader.border']}; }
  .tab { display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12.5px; }
  .tab img { width: 16px; height: 16px; }
  .tab.on { color: ${C['tab.activeForeground']}; background: ${C['tab.activeBackground']};
            border-top: 1px solid ${C['tab.activeBorderTop']}; }
  .tab.off { color: ${C['tab.inactiveForeground']}; background: ${C['tab.inactiveBackground']};
             border-top: 1px solid transparent; }
  .pane { flex: 1; overflow: hidden; padding-top: 10px; }
  .status { height: 24px; display: flex; align-items: center; gap: 18px; padding: 0 14px;
            font-size: 11.5px; background: ${C['statusBar.background']};
            color: ${C['statusBar.foreground']}; border-top: 1px solid ${C['statusBar.border']}; }
  .status .accent { color: ${C['editorLineNumber.activeForeground']}; }
  </style>
  <div class="win">
    <div class="title">member.service.ts — workspace</div>
    <div class="main">
      <div class="activity">${ACTIVITY_ICONS}</div>
      <div class="side"><h2>Explorer</h2>${rows}</div>
      <div class="editor">
        <div class="tabs">
          <div class="tab on"><img src="${icon('file-typescript-service')}" alt="">member.service.ts</div>
          <div class="tab off"><img src="${icon('file-jsx')}" alt="">MemberList.tsx</div>
          <div class="tab off"><img src="${icon('file-scss-module')}" alt="">MemberList.module.scss</div>
        </div>
        <div class="pane">${withGutter(html, lineCount)}</div>
      </div>
    </div>
    <div class="status">
      <span class="accent">main*</span><span>TypeScript</span>
      <span>Ln 24, Col 18</span><span>Spaces: 2</span><span>UTF-8</span>
    </div>
  </div>`;
}

/* -------------------------------------------------------------- *
 * Render
 * -------------------------------------------------------------- */

function shoot(browser: string, htmlFile: string, pngFile: string, width: number, height: number): void {
  execFileSync(
    browser,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      `--window-size=${width},${height}`,
      `--screenshot=${pngFile}`,
      `file:///${htmlFile.replace(/\\/g, '/')}`,
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] }
  );
}

async function main() {
  const { createHighlighter } = await import('shiki');
  const browser = findBrowser();

  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });

  const items = LANGUAGES.map((l) => {
    const code = fs.readFileSync(path.join(SAMPLES, l.file), 'utf8').replace(/\s+$/, '');
    const ext = path.extname(l.file).slice(1);
    return { ...l, code, lines: code.split('\n').length, iconName: iconFor(ext) };
  });

  /*
   * The extension's own grammar injections, so the preview shows what the
   * editor shows — component tags in JSX/TSX, .NET delegates in C#.
   *
   * `injectTo` has to name the target SCOPES ("source.cs"), not the Shiki
   * language ids ("csharp"). Passing language ids is accepted silently and the
   * injection simply never fires, so the scopes are parsed straight out of each
   * grammar's own injectionSelector to keep the two in step.
   */
  const injections = ['jsx-components', 'csharp-delegates'].map((file) => {
    const grammar = readJson(ROOT, 'injections', `${file}.tmLanguage.json`);
    const scopes = (grammar.injectionSelector as string).split(',').map((s: string) => s.trim().replace(/^L:/, ''));
    return { ...grammar, name: `midnight-indigo-${file}`, injectTo: scopes };
  });

  const highlighter = await createHighlighter({
    themes: [theme],
    langs: [...new Set(items.map((i) => i.lang)), ...injections],
  });

  const render = (code: string, lang: string): string =>
    highlighter.codeToHtml(code, { lang, theme: theme.name, structure: 'classic' });

  // Hero
  const hero = items.find((i) => i.lang === 'typescript');
  if (!hero) throw new Error('no typescript sample to build the hero from');
  const heroFile = path.join(TMP, 'hero.html');
  fs.writeFileSync(heroFile, heroPage(render(hero.code, hero.lang), hero.lines), 'utf8');
  // A fixed window that clips both panes, the way a real editor screenshot does.
  shoot(browser, heroFile, path.join(OUT, 'hero.png'), 1180, 34 + 33 + 10 + 24 + 28 * LINE_H); // whole lines only, no half-clipped row
  console.log('wrote docs/preview/hero.png');

  // One card per language
  for (const item of items) {
    const file = path.join(TMP, `${item.lang}.html`);
    fs.writeFileSync(file, cardPage(render(item.code, item.lang), item, item.lines), 'utf8');
    const width = 860;
    const height = 33 + 28 + item.lines * LINE_H + 2;
    shoot(browser, file, path.join(OUT, `${item.lang}.png`), width, height);
  }
  console.log(`wrote ${items.length} language previews to docs/preview/`);

  writeGallery(items);
  console.log('wrote docs/PREVIEW.md');
}

// The gallery is generated alongside the images so the two cannot drift: add a
// sample to tools/samples/ and LANGUAGES, and it appears here on the next run.
function writeGallery(items: any[]): void {
  const RAW = 'https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/main/docs/preview';
  const heading = (label: string): string => `## ${label.replace(/#/g, '\\#')}`;
  const tuned = items.filter((i) => i.tuned);
  const rest = items.filter((i) => !i.tuned);

  const section = (list: any[]): string =>
    list
      .map((i) => `${heading(i.label)}\n\n![${i.label} in Midnight Indigo](${RAW}/${i.lang}.png)`)
      .join('\n\n');

  const body = `# Preview

Every screenshot on this page is generated from [the theme file](../themes/midnight-indigo-color-theme.json) itself, highlighted with the same TextMate grammars VS Code ships and with the extension's own two grammar injections loaded — so these are the theme's real colors rather than an approximation. Regenerate them with \`npm run preview:theme\`.

![The color theme and the icon set together](${RAW}/hero.png)

# Tuned languages

These have TextMate and semantic rules written specifically for them.

${section(tuned)}

# Everything else

These fall back to the general rule set, which covers the standard scopes — keywords, strings, numbers, comments, types, functions, variables, operators and punctuation.

${section(rest)}
`;

  fs.writeFileSync(path.join(ROOT, 'docs', 'PREVIEW.md'), body, 'utf8');
}

// The tab icon for a sample, resolved through the icon theme's own mapping so
// the preview cannot show an icon the theme would not actually use.
function iconFor(ext: string): string {
  const map = readJson(ROOT, 'icons', 'theme', 'midnight-indigo-icon-theme.json');
  const def = map.fileExtensions[ext] || map.file;
  return path.basename(map.iconDefinitions[def].iconPath, '.svg');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
