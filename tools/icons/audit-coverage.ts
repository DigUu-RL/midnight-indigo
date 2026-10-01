/*
 * The coverage audit of the icon set (M12). Resolves every file of a corpus of
 * real repositories the way VS Code does, against the built icon theme, and
 * says what the set answers with the plain-text page — the icon that means "no
 * idea" — and which exact file names only reach a format's generic icon:
 *
 *   npm run audit:coverage                  the corpus below
 *   npm run audit:coverage -- <repo> ...    local working trees as well
 *
 * The corpus is file NAMES, not files: each repository's tree is fetched once
 * without its blobs (a shallow, blob-less clone and `git ls-tree`) and cached in
 * the system's temp directory. The repositories were picked to reach the
 * corners the M12 checklist names — CI/CD, containers, observability, data,
 * science, graphics, hardware, ML/AI and assistant tooling — and a gap is
 * ranked by how many of them it appears in rather than how many files it has,
 * so one repository full of one format cannot crowd out a convention every
 * repository keeps.
 *
 * The resolution is VS Code's own, read out of its workbench (1.139):
 *
 *   A file gets a class for its name, for its parent directory, for every
 *   dotted suffix of its name and for its language id. A manifest key may be
 *   prefixed with a parent directory — `workflows/yml` — and the rule for each
 *   key is a CSS selector over those classes, so the most specific rule wins:
 *   an exact name over an extension, a longer extension over a shorter one, a
 *   key with a directory over the same key without. At equal specificity the
 *   rule emitted later wins, and the order is language ids, then extensions,
 *   then file names — so `.prompt.md` is Markdown by extension even though its
 *   language id is `prompt`.
 *
 *   The language id is what the editor detected, which this reproduces from
 *   the languages VS Code's built-in extensions contribute: an exact file name,
 *   then a file-name pattern, then the longest extension.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH: string = path.join(HERE, '..', '..', 'icons', 'theme', 'midnight-indigo-icon-theme.json');
const CACHE_DIRECTORY: string = path.join(os.tmpdir(), 'midnight-indigo-coverage-corpus');

/** GitHub repositories, by the corner of the file system each one reaches. */
const CORPUS: Record<string, readonly string[]> = {
  'web and JS tooling': ['microsoft/vscode', 'vercel/next.js', 'facebook/react', 'microsoft/playwright', 'biomejs/biome', 'denoland/deno', 'oven-sh/bun'],
  'containers and clusters': ['kubernetes/kubernetes', 'helm/charts', 'bitnami/charts', 'docker/compose', 'hashicorp/terraform-provider-aws', 'nixos/nixpkgs'],
  'CI/CD and forges': ['gitlabhq/gitlabhq', 'getsentry/sentry', 'astral-sh/uv'],
  observability: ['grafana/grafana', 'prometheus/prometheus'],
  data: ['apache/arrow', 'apache/airflow', 'dbt-labs/dbt-core', 'home-assistant/core'],
  science: ['scipy/scipy', 'numpy/numpy', 'astropy/astropy', 'jupyter/notebook'],
  'ML and AI': ['pytorch/pytorch', 'huggingface/transformers', 'ggml-org/llama.cpp', 'mlflow/mlflow', 'tensorflow/tensorflow'],
  'assistant tooling': ['github/awesome-copilot', 'modelcontextprotocol/servers', 'anthropics/claude-code', 'openai/codex', 'continuedev/continue'],
  graphics: ['godotengine/godot', 'KhronosGroup/glTF-Sample-Assets'],
  'hardware and engineering': ['zephyrproject-rtos/zephyr', 'qmk/qmk_firmware', 'prusa3d/PrusaSlicer', 'KiCad/kicad-footprints'],
  'systems languages and .NET': ['dotnet/aspnetcore', 'dotnet/runtime', 'rust-lang/rust', 'golang/go'],
};

/** Icons that name a format rather than a tool: an exact file name that only reaches one of these may deserve better. */
const GENERIC_ICONS: ReadonlySet<string> = new Set(
  ['text', 'json', 'yaml', 'xml', 'ini', 'toml', 'markdown', 'javascript', 'typescript', 'mjs', 'python', 'shell', 'lock', 'log'].map(
    (iconName: string): string => `_file_${iconName}`
  )
);
const FALLBACK: string = '_file_text';
/** How many repositories a gap must turn up in before it is worth reading. */
const MINIMUM_REPOSITORIES: number = 3;

export type Manifest = {
  file: string;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  languageIds: Record<string, string>;
};

type LanguageContribution = { id: string; extensions?: string[]; filenames?: string[]; filenamePatterns?: string[] };

/* ---------------- the corpus ---------------- */

const treeOfGitHubRepository = (repository: string): string[] => {
  const cachePath: string = path.join(CACHE_DIRECTORY, `${repository.replace('/', '__')}.txt`);
  if (!fs.existsSync(cachePath)) {
    const clonePath: string = path.join(CACHE_DIRECTORY, `${repository.replace('/', '__')}.git`);
    fs.rmSync(clonePath, { recursive: true, force: true });
    execFileSync('git', ['clone', '--quiet', '--filter=blob:none', '--no-checkout', '--depth', '1', `https://github.com/${repository}`, clonePath], {
      stdio: 'ignore',
    });
    const tree: string = execFileSync('git', ['-C', clonePath, 'ls-tree', '-r', '--name-only', 'HEAD'], { encoding: 'utf8', maxBuffer: 1 << 30 });
    fs.writeFileSync(cachePath, tree, 'utf8');
    fs.rmSync(clonePath, { recursive: true, force: true });
  }
  return fs.readFileSync(cachePath, 'utf8').split('\n').filter(Boolean);
};

const treeOfWorkingCopy = (directory: string): string[] =>
  execFileSync('git', ['-C', directory, 'ls-files'], { encoding: 'utf8', maxBuffer: 1 << 30 }).split('\n').filter(Boolean);

/* ---------------- VS Code's language detection ---------------- */

const findVsCodeExtensions = (): string => {
  const installRoots: string[] = [
    path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Microsoft VS Code'),
    path.join(process.env.ProgramFiles ?? '', 'Microsoft VS Code'),
    '/usr/share/code',
    '/Applications/Visual Studio Code.app/Contents/Resources/app',
  ];
  for (const installRoot of installRoots) {
    if (!fs.existsSync(installRoot)) continue;
    const candidates: string[] = [path.join(installRoot, 'resources', 'app', 'extensions'), path.join(installRoot, 'extensions')];
    for (const entry of fs.readdirSync(installRoot)) candidates.push(path.join(installRoot, entry, 'resources', 'app', 'extensions'));
    const found: string | undefined = candidates.find((candidate: string): boolean => fs.existsSync(path.join(candidate, 'json', 'package.json')));
    if (found) return found;
  }
  throw new Error('VS Code is not installed where this looks for it; its built-in languages decide language ids');
};

const globToRegExp = (glob: string): RegExp =>
  new RegExp(
    '^' +
      glob
        .toLowerCase()
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*\//g, '\u0000')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
        .replace(/\u0000/g, '(?:.*/)?') +
      '$'
  );

export type LanguageDetector = (filePath: string) => string | null;

export const buildLanguageDetector = (): LanguageDetector => {
  const extensionsDirectory: string = findVsCodeExtensions();
  const byFileName: Map<string, string> = new Map();
  const byExtension: Map<string, string> = new Map();
  const byPattern: { pattern: string; matcher: RegExp; languageId: string }[] = [];
  for (const extensionName of fs.readdirSync(extensionsDirectory)) {
    const packagePath: string = path.join(extensionsDirectory, extensionName, 'package.json');
    if (!fs.existsSync(packagePath)) continue;
    const languages: LanguageContribution[] = JSON.parse(fs.readFileSync(packagePath, 'utf8')).contributes?.languages ?? [];
    for (const language of languages) {
      for (const fileName of language.filenames ?? []) byFileName.set(fileName.toLowerCase(), language.id);
      for (const extension of language.extensions ?? []) byExtension.set(extension.toLowerCase(), language.id);
      for (const pattern of language.filenamePatterns ?? []) byPattern.push({ pattern, matcher: globToRegExp(pattern), languageId: language.id });
    }
  }
  byPattern.sort((first, second): number => second.pattern.length - first.pattern.length);
  return (filePath: string): string | null => {
    const lowerPath: string = filePath.toLowerCase();
    const baseName: string = path.posix.basename(lowerPath);
    const exact: string | undefined = byFileName.get(baseName);
    if (exact) return exact;
    for (const { pattern, matcher, languageId } of byPattern) {
      if (matcher.test(pattern.includes('/') ? lowerPath : baseName)) return languageId;
    }
    let longest: string | null = null;
    let longestLength: number = 0;
    for (const [extension, languageId] of byExtension) {
      if (extension.length > longestLength && baseName.endsWith(extension)) {
        longest = languageId;
        longestLength = extension.length;
      }
    }
    return longest;
  };
};

/* ---------------- VS Code's icon resolution ---------------- */

type Rule = { specificity: number; order: number; iconKey: string };
export type Resolution = { iconKey: string; by: 'file name' | 'extension' | 'language id' | 'fallback' };

const splitDirectoryKey = (key: string): { directory: string | null; rest: string } => {
  const slash: number = key.lastIndexOf('/');
  return slash >= 0 ? { directory: key.slice(0, slash), rest: key.slice(slash + 1) } : { directory: null, rest: key };
};

export const buildResolver = (manifest: Manifest, detectLanguage: LanguageDetector): ((filePath: string) => Resolution) => {
  /*
   * Every rule is indexed by the one class a file must have for it to match —
   * its name, or its extension — and carries the rest of its selector: the
   * directory it wants, and how many classes it has.
   */
  type IndexedRule = Rule & { directory: string | null; by: Resolution['by'] };
  const byName: Map<string, IndexedRule[]> = new Map();
  const byExtension: Map<string, IndexedRule[]> = new Map();
  let order: number = 0;
  const add = (index: Map<string, IndexedRule[]>, key: string, rule: IndexedRule): void => {
    index.set(key, [...(index.get(key) ?? []), rule]);
  };
  const byLanguage: Map<string, IndexedRule> = new Map();
  for (const [languageId, iconKey] of Object.entries(manifest.languageIds)) {
    byLanguage.set(languageId, { specificity: 2, order: order++, iconKey, directory: null, by: 'language id' });
  }
  if (manifest.languageIds.json && !manifest.languageIds.jsonc) byLanguage.set('jsonc', byLanguage.get('json')!);
  for (const [key, iconKey] of Object.entries(manifest.fileExtensions)) {
    const { directory, rest } = splitDirectoryKey(key.toLowerCase());
    const segments: number = rest.split('.').length;
    add(byExtension, rest, { specificity: segments + 2 + (directory ? 1 : 0), order: order++, iconKey, directory, by: 'extension' });
  }
  for (const [key, iconKey] of Object.entries(manifest.fileNames)) {
    const { directory, rest } = splitDirectoryKey(key.toLowerCase());
    const segments: number = rest.split('.').length;
    add(byName, rest, { specificity: segments + 3 + (directory ? 1 : 0), order: order++, iconKey, directory, by: 'file name' });
  }

  return (filePath: string): Resolution => {
    const parts: string[] = filePath.toLowerCase().split('/');
    const baseName: string = parts[parts.length - 1];
    const parent: string | null = parts.length > 1 ? parts[parts.length - 2] : null;
    const candidates: IndexedRule[] = [];
    const matchesDirectory = (rule: IndexedRule): boolean => rule.directory === null || rule.directory === parent;
    candidates.push(...(byName.get(baseName) ?? []).filter(matchesDirectory));
    const segments: string[] = baseName.split('.');
    for (let start = 1; start < segments.length; start++) {
      candidates.push(...(byExtension.get(segments.slice(start).join('.')) ?? []).filter(matchesDirectory));
    }
    const languageId: string | null = detectLanguage(filePath);
    const languageRule: IndexedRule | undefined = languageId ? byLanguage.get(languageId) : undefined;
    if (languageRule) candidates.push(languageRule);
    if (!candidates.length) return { iconKey: manifest.file, by: 'fallback' };
    const winner: IndexedRule = candidates.reduce((best: IndexedRule, rule: IndexedRule): IndexedRule =>
      rule.specificity > best.specificity || (rule.specificity === best.specificity && rule.order > best.order) ? rule : best
    );
    return { iconKey: winner.iconKey, by: winner.by };
  };
};

/* ---------------- the audit ---------------- */

type Gap = { repositories: Set<string>; files: number; examples: string[]; resolvedTo: Map<string, number> };

/** What a file is called for the purpose of grouping it: its last extension, or its whole name when it has none. */
const gapKeyOf = (filePath: string): string => {
  const baseName: string = path.posix.basename(filePath).toLowerCase();
  const dot: number = baseName.lastIndexOf('.');
  return dot > 0 ? baseName.slice(dot) : baseName;
};

const record = (gaps: Map<string, Gap>, key: string, repository: string, filePath: string, iconKey: string): void => {
  const gap: Gap = gaps.get(key) ?? { repositories: new Set(), files: 0, examples: [], resolvedTo: new Map() };
  gap.files++;
  if (!gap.repositories.has(repository) && gap.examples.length < 3) gap.examples.push(`${repository}: ${filePath}`);
  gap.repositories.add(repository);
  gap.resolvedTo.set(iconKey, (gap.resolvedTo.get(iconKey) ?? 0) + 1);
  gaps.set(key, gap);
};

const printGaps = (title: string, gaps: Map<string, Gap>): void => {
  const ranked: [string, Gap][] = [...gaps]
    .filter(([, gap]): boolean => gap.repositories.size >= MINIMUM_REPOSITORIES)
    .sort(([, first], [, second]): number => second.repositories.size - first.repositories.size || second.files - first.files);
  console.log(`\n${title} (${ranked.length} in ${MINIMUM_REPOSITORIES}+ repositories)\n`);
  for (const [key, gap] of ranked) {
    const icons: string = [...gap.resolvedTo.keys()].map((iconKey: string): string => iconKey.replace(/^_file_/, '')).join(', ');
    console.log(`  ${String(gap.repositories.size).padStart(3)} repos ${String(gap.files).padStart(6)} files  ${key.padEnd(34)} ${icons}`);
    for (const example of gap.examples) console.log(`${' '.repeat(26)}${example}`);
  }
};

const isMain: boolean = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (isMain) {
  fs.mkdirSync(CACHE_DIRECTORY, { recursive: true });
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const resolve = buildResolver(manifest, buildLanguageDetector());

  const trees: Map<string, string[]> = new Map();
  for (const repository of Object.values(CORPUS).flat()) {
    try {
      trees.set(repository, treeOfGitHubRepository(repository));
    } catch {
      console.error(`  ! could not fetch ${repository}; left out of this run`);
    }
  }
  for (const directory of process.argv.slice(2)) trees.set(path.basename(path.resolve(directory)), treeOfWorkingCopy(directory));

  const fallbacks: Map<string, Gap> = new Map();
  const genericNames: Map<string, Gap> = new Map();
  let fileCount: number = 0;
  let fallbackCount: number = 0;
  for (const [repository, tree] of trees) {
    for (const filePath of tree) {
      fileCount++;
      const resolution: Resolution = resolve(filePath);
      if (resolution.by === 'fallback') {
        fallbackCount++;
        record(fallbacks, gapKeyOf(filePath), repository, filePath, resolution.iconKey);
      } else if (GENERIC_ICONS.has(resolution.iconKey) && resolution.by !== 'file name') {
        record(genericNames, path.posix.basename(filePath).toLowerCase(), repository, filePath, resolution.iconKey);
      }
    }
  }

  console.log(
    `${fileCount} files in ${trees.size} repositories; ${fallbackCount} (${((100 * fallbackCount) / fileCount).toFixed(1)}%) fall back to the plain-text page`
  );
  printGaps('Extensions and names with no association — the plain-text page', fallbacks);
  printGaps('Exact file names that only reach a generic format icon', genericNames);
}
