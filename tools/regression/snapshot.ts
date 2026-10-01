/*
 * The snapshots: what the extension draws, written down in a form a reviewer
 * can read in a diff, and held to the tree by `npm run check`:
 *
 *   node tools/regression/snapshot.ts           rewrite tools/regression/snapshots/
 *   node tools/regression/snapshot.ts --check   fail, with the changes spelled out, if they are out of date
 *
 * Why this exists when the generated files are committed anyway: a colour
 * change lands as eight edits in eight 2,000-line JSON files, an icon nudged
 * half a unit as a rewritten path, and a mapping that moved as one line among
 * six hundred. All of it is in the diff and none of it can be read there. The
 * snapshots say the same things one fact to a line —
 *
 *   structure.txt        the shape every theme shares: its rules and their
 *                        scopes in order, its semantic selectors, how many
 *                        workbench colours it sets; and the icon theme's
 *                        definitions and how many names each table maps
 *   colours.tsv          every workbench colour, TextMate rule and semantic
 *                        rule, one row each, with the eight variants side by
 *                        side, so a change to one family reads as one cell
 *   icon-associations.txt  a fixed set of real paths and folder names, and
 *                        the icon VS Code's own resolution gives each one
 *   icon-geometry.txt    where each built icon's ink sits, read from the
 *                        optical audit: its box, its centre of mass, its area
 *
 * — so a change that moves any of them fails the check until the snapshot is
 * rewritten, and the rewrite is the readable record of what moved, in the same
 * commit as the change that moved it. The check prints the changed lines
 * themselves, keyed, so the failure is already the review.
 *
 * Every line is `key<TAB>value`, sorted or in the order the theme writes, and
 * nothing here reads the clock, the network or the machine, so two runs on
 * one tree write the same bytes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildResolver, type Manifest, type Resolution } from '../icons/audit-coverage.ts';
import type { IconOptics, OpticsReport } from '../icons/icon-optics.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const ROOT: string = path.join(HERE, '..', '..');
const SNAPSHOT_DIRECTORY: string = path.join(HERE, 'snapshots');

const readJson = <T>(...segments: string[]): T => JSON.parse(fs.readFileSync(path.join(ROOT, ...segments), 'utf8'));

type ThemeContribution = { label: string; path: string };
type TokenRule = { name: string; scope: string | string[]; settings: { foreground?: string; fontStyle?: string } };
type SemanticValue = string | { foreground?: string; fontStyle?: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean };
type Theme = {
  name: string;
  colors: Record<string, string>;
  tokenColors: TokenRule[];
  semanticTokenColors: Record<string, SemanticValue>;
  semanticHighlighting?: boolean;
};
type IconManifest = Manifest & {
  iconDefinitions: Record<string, { iconPath: string }>;
  folder: string;
  folderExpanded: string;
  rootFolder?: string;
  rootFolderExpanded?: string;
  folderNames: Record<string, string>;
  folderNamesExpanded: Record<string, string>;
};

const packageManifest: { contributes: { themes: ThemeContribution[]; iconThemes: { id: string; path: string }[] } } = readJson('package.json');
const themes: { label: string; family: string; theme: Theme }[] = packageManifest.contributes.themes.map((contribution: ThemeContribution) => ({
  label: contribution.label,
  family: contribution.label.replace(/^Midnight /, '').toLowerCase(),
  theme: readJson<Theme>(contribution.path),
}));
const iconManifestPath: string = packageManifest.contributes.iconThemes[0].path;
const iconManifest: IconManifest = readJson<IconManifest>(iconManifestPath);

const scopesOf = (rule: TokenRule): string[] => [rule.scope].flat();
/** A style as a short word: `b`, `i`, `bi`, `s` for struck, `u` for underlined; `plain` when it is explicitly none. */
const styleWord = (fontStyle: string | undefined): string => {
  if (fontStyle === undefined) return '';
  const words: string[] = fontStyle.split(/\s+/).filter(Boolean);
  const letters: string = ['bold', 'italic', 'underline', 'strikethrough']
    .filter((word: string): boolean => words.includes(word))
    .map((word: string): string => ({ bold: 'b', italic: 'i', underline: 'u', strikethrough: 's' })[word] as string)
    .join('');
  return letters || 'plain';
};
const ruleCell = (settings: TokenRule['settings']): string => [settings.foreground ?? '-', styleWord(settings.fontStyle)].filter(Boolean).join(' ');
const semanticCell = (value: SemanticValue): string => {
  if (typeof value === 'string') return value;
  const flags: string = (['bold', 'italic', 'underline', 'strikethrough'] as const)
    .filter((flag): boolean => value[flag] !== undefined)
    .map((flag): string => `${value[flag] ? '+' : '-'}${flag}`)
    .join(' ');
  return [value.foreground ?? '-', styleWord(value.fontStyle), flags].filter(Boolean).join(' ');
};

/* -------------------------------------------------------------- *
 * structure.txt
 * -------------------------------------------------------------- */

/** The shape a theme has with every value taken out of it. */
const shapeOf = (theme: Theme): string[] => [
  `theme\tsemanticHighlighting ${theme.semanticHighlighting ?? 'unset'}`,
  `theme\tworkbench colours ${Object.keys(theme.colors).length}`,
  `theme\tTextMate rules ${theme.tokenColors.length}`,
  `theme\tsemantic rules ${Object.keys(theme.semanticTokenColors).length}`,
  ...theme.tokenColors.map((rule: TokenRule, index: number): string => `rule ${String(index + 1).padStart(3, '0')}\t${rule.name}\t${scopesOf(rule).join(', ')}`),
  ...Object.keys(theme.semanticTokenColors).map((selector: string): string => `semantic\t${selector}`),
];

const structureProblems: string[] = [];
const referenceShape: string[] = shapeOf(themes[0].theme);
for (const { label, theme } of themes.slice(1)) {
  const shape: string[] = shapeOf(theme);
  if (shape.join('\n') !== referenceShape.join('\n')) structureProblems.push(`${label} does not share ${themes[0].label}'s structure`);
  const keys: string = Object.keys(theme.colors).join('\n');
  if (keys !== Object.keys(themes[0].theme.colors).join('\n')) structureProblems.push(`${label} sets other workbench colours, or in another order, than ${themes[0].label}`);
}

const associationTables = ['fileExtensions', 'fileNames', 'folderNames', 'folderNamesExpanded', 'languageIds'] as const;
const structureLines: string[] = [
  ...packageManifest.contributes.themes.map((contribution: ThemeContribution): string => `contributes theme\t${contribution.label}\t${contribution.path}`),
  ...packageManifest.contributes.iconThemes.map((iconTheme): string => `contributes icon theme\t${iconTheme.id}\t${iconTheme.path}`),
  ...referenceShape,
  `icons\tdefinitions ${Object.keys(iconManifest.iconDefinitions).length}`,
  ...associationTables.map((table): string => `icons\t${table} ${Object.keys(iconManifest[table] ?? {}).length}`),
  `icons\tdefaults file ${iconManifest.file}, folder ${iconManifest.folder}, open ${iconManifest.folderExpanded}`,
  ...Object.entries(iconManifest.iconDefinitions)
    .sort(([first], [second]): number => first.localeCompare(second))
    .map(([definition, { iconPath }]): string => `icon\t${definition}\t${iconPath}`),
];

/* -------------------------------------------------------------- *
 * colours.tsv
 * -------------------------------------------------------------- */

const colourLines: string[] = [
  ['key', ...themes.map(({ family }) => family)].join('\t'),
  ...Object.keys(themes[0].theme.colors).map((key: string): string => [key, ...themes.map(({ theme }) => theme.colors[key] ?? '-')].join('\t')),
  ...themes[0].theme.tokenColors.map((rule: TokenRule, index: number): string =>
    [`rule ${String(index + 1).padStart(3, '0')} ${rule.name}`, ...themes.map(({ theme }) => ruleCell(theme.tokenColors[index]?.settings ?? {}))].join('\t')
  ),
  ...Object.keys(themes[0].theme.semanticTokenColors).map((selector: string): string =>
    [`semantic ${selector}`, ...themes.map(({ theme }) => (selector in theme.semanticTokenColors ? semanticCell(theme.semanticTokenColors[selector]) : '-'))].join('\t')
  ),
];

/* -------------------------------------------------------------- *
 * icon-associations.txt
 * -------------------------------------------------------------- */

/*
 * Real paths, picked to reach every kind of association the manifest has: a
 * language by extension, a tool by its exact file name, a file whose name
 * outranks its extension, a key with a parent directory, a compound
 * extension, and the fallback. They are resolved by extension and name only —
 * the language-id step needs VS Code's own language table, which belongs to
 * whatever VS Code is installed, and a snapshot that changed with it would be
 * a snapshot of the machine. Kept in the order they are written.
 */
const FILE_PROBES: string[] = [
  // Languages
  'src/app.ts', 'src/index.tsx', 'src/server.js', 'src/App.jsx', 'src/main.mjs', 'src/config.cjs', 'src/types.d.ts',
  'Program.cs', 'App.csproj', 'App.sln', 'main.py', 'notebook.ipynb', 'lib.rs', 'main.go', 'Main.java', 'Main.kt', 'build.gradle.kts',
  'index.php', 'deploy.ps1', 'module.psm1', 'run.sh', 'setup.bash', 'query.sql', 'main.c', 'main.cpp', 'header.h', 'App.swift',
  'main.dart', 'app.rb', 'mix.exs', 'main.lua', 'analysis.r', 'Main.hs', 'main.zig', 'app.vue', 'App.svelte', 'page.astro',
  // Markup, styles and data
  'index.html', 'styles.css', 'theme.scss', 'theme.sass', 'theme.less', 'data.json', 'settings.jsonc', 'config.yaml', 'release.yml',
  'Cargo.toml', 'data.xml', 'data.csv', 'README.md', 'guide.mdx', 'notes.txt', 'logo.svg', 'photo.png', 'photo.jpg', 'font.woff2',
  'archive.zip', 'schema.graphql', 'service.proto', 'app.log', 'local.env',
  // Variants a language's colour carries into
  'member.service.ts', 'member.service.spec.ts', 'app.module.ts', 'MemberList.spec.tsx', 'MemberList.test.tsx', 'promote.dto.ts',
  'auth.guard.ts', 'MemberList.module.scss', 'MemberList.stories.tsx', 'test_members.py', 'members_test.go',
  // Tools, by exact name
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'tsconfig.json', 'jsconfig.json',
  '.gitignore', '.gitattributes', '.editorconfig', '.env', '.env.local', '.npmrc', '.nvmrc', '.prettierrc', 'eslint.config.js',
  '.eslintrc.json', 'vite.config.ts', 'vitest.config.ts', 'jest.config.js', 'webpack.config.js', 'next.config.mjs',
  'tailwind.config.ts', 'postcss.config.js', 'babel.config.js', 'Dockerfile', 'docker-compose.yml', 'compose.yaml', '.dockerignore',
  'Makefile', 'CMakeLists.txt', 'go.mod', 'go.sum', 'requirements.txt', 'pyproject.toml', 'Pipfile', 'Gemfile', 'composer.json',
  'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'CLAUDE.md', 'AGENTS.md', '.vscodeignore', 'renovate.json', 'nginx.conf',
  // Keys with a parent directory
  '.github/workflows/ci.yml', '.vscode/settings.json', '.vscode/launch.json', '.devcontainer/devcontainer.json',
  // Nothing knows these
  'notes.unknownext', 'NOEXTENSION',
];

const FOLDER_PROBES: string[] = [
  'src', 'lib', 'components', 'hooks', 'services', 'utils', 'models', 'views', 'pages', 'api', 'routes', 'config', 'scripts',
  'tests', '__tests__', 'e2e', 'mocks', 'fixtures', 'assets', 'images', 'icons', 'fonts', 'styles', 'public', 'dist', 'build',
  'docs', 'database', 'migrations', 'types', 'i18n', 'docker', 'kubernetes', '.github', 'workflows', 'node_modules', 'packages',
  'auth', 'logs', 'temp', '.vscode', '.claude', 'prompts', 'agents', 'a-folder-nothing-names',
];

const resolveFile: (filePath: string) => Resolution = buildResolver(iconManifest, (): null => null);
const associationLines: string[] = [
  ...FILE_PROBES.map((filePath: string): string => {
    const resolution: Resolution = resolveFile(filePath);
    return `file ${filePath}\t${resolution.iconKey}\t${resolution.by}`;
  }),
  ...FOLDER_PROBES.flatMap((folderName: string): string[] => [
    `folder ${folderName}\t${iconManifest.folderNames[folderName] ?? `${iconManifest.folder}\tfallback`}`,
    `folder ${folderName} (open)\t${iconManifest.folderNamesExpanded[folderName] ?? `${iconManifest.folderExpanded}\tfallback`}`,
  ]),
];

/* -------------------------------------------------------------- *
 * icon-geometry.txt
 * -------------------------------------------------------------- */

/*
 * From tools/icons/icon-optics.json, which `npm run check` already holds to the
 * built SVGs by hash. Rounded to a hundredth of a unit — a 32nd of a pixel at
 * 16px — which is below anything that renders and above the audit's own
 * floating-point noise.
 */
const units = (value: number): string => value.toFixed(2);
const optics: OpticsReport = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'icons', 'icon-optics.json'), 'utf8'));
const geometryLines: string[] = Object.values(optics)
  .sort((first: IconOptics, second: IconOptics): number => first.name.localeCompare(second.name))
  .map((icon: IconOptics): string => {
    const { box, massCentre, pictogram } = icon;
    const cells: string[] = [
      `box ${[box.left, box.top, box.right, box.bottom].map(units).join(' ')}`,
      `mass ${units(massCentre.x)} ${units(massCentre.y)}`,
      `ink ${icon.inkArea.toFixed(1)}`,
      `16px ${icon.atSixteen.lit} lit`,
    ];
    if (pictogram) cells.push(`pictogram ${[pictogram.box.left, pictogram.box.top, pictogram.box.right, pictogram.box.bottom].map(units).join(' ')}`);
    return `${icon.name}\t${cells.join('\t')}`;
  });

/* -------------------------------------------------------------- *
 * Write, or compare
 * -------------------------------------------------------------- */

const HEADERS: Record<string, string> = {
  'structure.txt': 'The shape every theme shares, and the icon theme. Generated by `npm run snapshot`; do not edit.',
  'colours.tsv': '',
  'icon-associations.txt': 'Paths and folder names, and the icon each resolves to (by name and extension; no language ids). Generated by `npm run snapshot`.',
  'icon-geometry.txt': 'Where each built icon\'s ink sits, in icon units on the 32-unit canvas, from tools/icons/icon-optics.json. Generated by `npm run snapshot`.',
};

const SNAPSHOTS: [string, string[]][] = [
  ['structure.txt', structureLines],
  ['colours.tsv', colourLines],
  ['icon-associations.txt', associationLines],
  ['icon-geometry.txt', geometryLines],
];

const render = (fileName: string, lines: string[]): string => (HEADERS[fileName] ? [`# ${HEADERS[fileName]}`, ...lines] : lines).join('\n') + '\n';

/** The key of a snapshot line is everything before its first tab. */
const keyed = (text: string): Map<string, string> =>
  new Map(
    text
      .split('\n')
      .filter((line: string): boolean => Boolean(line) && !line.startsWith('# '))
      .map((line: string): [string, string] => {
        const tab: number = line.indexOf('\t');
        return tab < 0 ? [line, ''] : [line.slice(0, tab), line.slice(tab + 1)];
      })
  );

/** What changed between two versions of a snapshot, one line per key, for the failure message. */
const changesBetween = (fileName: string, before: string, after: string): string[] => {
  const header: string[] = fileName === 'colours.tsv' ? (before.split('\n')[0] ?? '').split('\t').slice(1) : [];
  const was: Map<string, string> = keyed(before);
  const now: Map<string, string> = keyed(after);
  const changes: string[] = [];
  for (const [key, value] of now) {
    if (!was.has(key)) changes.push(`+ ${key}  ${value.replace(/\t/g, '  ')}`);
    else if (was.get(key) !== value) {
      if (header.length) {
        const oldCells: string[] = (was.get(key) as string).split('\t');
        const newCells: string[] = value.split('\t');
        const moved: string[] = newCells
          .map((cell: string, index: number): string => (cell === oldCells[index] ? '' : `${header[index] ?? `#${index + 1}`} ${oldCells[index]} → ${cell}`))
          .filter(Boolean);
        changes.push(`~ ${key}  ${moved.join('; ')}`);
      } else changes.push(`~ ${key}  ${(was.get(key) as string).replace(/\t/g, '  ')}  →  ${value.replace(/\t/g, '  ')}`);
    }
  }
  for (const key of was.keys()) if (!now.has(key)) changes.push(`- ${key}`);
  if (!changes.length && before !== after) changes.push('the order of the lines changed');
  return changes;
};

const SHOWN_PER_FILE: number = 12;

if (structureProblems.length) {
  for (const problem of structureProblems) console.error(`  ! ${problem}`);
  process.exitCode = 1;
} else if (process.argv.includes('--check')) {
  let outOfDate: number = 0;
  for (const [fileName, lines] of SNAPSHOTS) {
    const file: string = path.join(SNAPSHOT_DIRECTORY, fileName);
    const current: string = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const wanted: string = render(fileName, lines);
    if (current === wanted) continue;
    outOfDate++;
    const changes: string[] = changesBetween(fileName, current, wanted);
    console.error(`  ! snapshots/${fileName}: ${changes.length} change(s)`);
    for (const change of changes.slice(0, SHOWN_PER_FILE)) console.error(`      ${change}`);
    if (changes.length > SHOWN_PER_FILE) console.error(`      … and ${changes.length - SHOWN_PER_FILE} more`);
  }
  if (outOfDate) console.error('\n  If every change above is meant, run `npm run snapshot` and commit the snapshots with the change.');
  else console.log(`${SNAPSHOTS.length} snapshots match the tree`);
  process.exitCode = outOfDate ? 1 : 0;
} else {
  fs.mkdirSync(SNAPSHOT_DIRECTORY, { recursive: true });
  for (const [fileName, lines] of SNAPSHOTS) {
    const file: string = path.join(SNAPSHOT_DIRECTORY, fileName);
    const before: string = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const wanted: string = render(fileName, lines);
    fs.writeFileSync(file, wanted, 'utf8');
    const changes: number = before === wanted ? 0 : before ? changesBetween(fileName, before, wanted).length : lines.length;
    console.log(`wrote snapshots/${fileName} — ${lines.length} lines, ${changes} changed`);
  }
}
