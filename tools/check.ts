/*
 * Runs every offline check the repo has, in order, and says which failed:
 *
 *   npm run check
 *
 * Each check is an entry in CHECKS — a name and a function that throws when
 * it fails. Adding one is adding an entry; the runner does not stop at the
 * first failure, so one run reports everything that is wrong at once.
 *
 * The check never writes to the tree. The builds below do, because building is
 * how their inputs are checked; the generated files are kept from before the
 * first one and put back if the build disagreed with them, and that
 * disagreement is itself a failure (see `generatedInTree`).
 *
 * What is NOT here: the network half of `npm run check:images` (the badges;
 * the screenshots are linked by relative path and checked offline) and
 * anything that needs a browser or VS Code — rendering the previews again,
 * measuring the icons again, the workbench and code corpora in real VS Code.
 * That is `npm run regression` (tools/regression/regression.ts). What the
 * check does hold offline is that none of those outputs is stale: the
 * inventory pins each screenshot by hash, and tools/regression/rendered-from.ts
 * pins what each one was rendered from.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './shared/hash.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

/** Runs a Node script from tools/, and throws with its output if it fails. */
const node = (script: string, ...args: string[]): string => {
  try {
    return execFileSync(process.execPath, [path.join(HERE, script), ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err: any) {
    throw new Error(`${err.stdout ?? ''}${err.stderr ?? ''}`.trim() || String(err));
  }
};

/** Every file a build writes, and its hash. */
const GENERATED = ['themes', path.join('icons', 'svg'), path.join('icons', 'theme')];
function fingerprint(): Map<string, string> {
  const out = new Map<string, string>();
  for (const dir of GENERATED) {
    for (const f of fs.readdirSync(path.join(ROOT, dir)).sort()) {
      out.set(path.join(dir, f), sha256(fs.readFileSync(path.join(ROOT, dir, f))));
    }
  }
  return out;
}

/*
 * The generated files as the tree had them before any check built anything.
 *
 * The builds below write into the tree, because they ARE the checks of their
 * own inputs. Left at that, `npm run check` would quietly bring a stale tree up
 * to date and pass — a source change committed without the themes it produces
 * would pass the check that was run before the commit, and the next one too.
 * So the tree's own copies are kept here, compared once everything is built,
 * and put back if the build disagreed with them: the check reports what the
 * tree holds and leaves it as it found it. `npm run build` is what writes.
 */
const generatedInTree: Map<string, Buffer> = new Map(
  GENERATED.flatMap((directory: string): [string, Buffer][] =>
    fs
      .readdirSync(path.join(ROOT, directory))
      .map((fileName: string): [string, Buffer] => [path.join(directory, fileName), fs.readFileSync(path.join(ROOT, directory, fileName))])
  )
);

const restoreGeneratedFiles = (): void => {
  for (const directory of GENERATED) {
    for (const fileName of fs.readdirSync(path.join(ROOT, directory))) {
      if (!generatedInTree.has(path.join(directory, fileName))) fs.rmSync(path.join(ROOT, directory, fileName));
    }
  }
  for (const [file, content] of generatedInTree) fs.writeFileSync(path.join(ROOT, file), content);
};

/** Files a directory holds that the manifest does not contribute: shipped in the package, and nothing loads them. */
const undeclaredFiles = (directory: string, declaredPaths: string[]): string[] => {
  const declared: Set<string> = new Set(declaredPaths.map((declaredPath: string): string => path.normalize(declaredPath)));
  const present: string[] = fs.readdirSync(path.join(ROOT, directory)).map((fileName: string): string => path.join(directory, fileName));
  return [
    ...present.filter((file: string): boolean => !declared.has(file)).map((file: string): string => `${file.replace(/\\/g, '/')} is in the folder but package.json does not contribute it — it would ship and nothing would load it`),
    ...[...declared]
      .filter((file: string): boolean => path.dirname(file) === path.normalize(directory) && !present.includes(file))
      .map((file: string): string => `package.json contributes ${file.replace(/\\/g, '/')}, which is not on disk`),
  ];
};

const build = (): void => {
  node('theme/build-color-themes.ts');
  node('icons/build-icons.ts');
};

const CHECKS: { name: string; run: () => void }[] = [
  {
    name: 'types',
    run: () => void node(path.join('..', 'node_modules', 'typescript', 'bin', 'tsc'), '-p', ROOT),
  },
  {
    // Baseline, contrast floors, hue separation, manifest — all inside the theme build.
    name: 'themes build',
    run: () => void node('theme/build-color-themes.ts'),
  },
  {
    // Every pair M13 names, read back from the written themes, against its target; cues that are not colour; colour vision simulated.
    name: 'accessibility',
    run: () => void node('theme/check-accessibility.ts', '--check'),
  },
  {
    // Every role, keyword and fallback held to tokenized code, with semantic highlighting on and off.
    name: 'syntax',
    run: () => void node('syntax/check-syntax.ts'),
  },
  {
    // Missing SVGs, mappings to icons that do not exist, icons nothing maps to, measured bounds.
    name: 'icons build',
    run: () => void node('icons/build-icons.ts'),
  },
  {
    // The optical audit is of the icons just built, and every icon is inside its limits.
    name: 'icon optics',
    run: () => void node('icons/check-icons.ts'),
  },
  {
    name: 'build is deterministic',
    run: () => {
      const first = fingerprint();
      build();
      const second = fingerprint();
      const moved = [...new Set([...first.keys(), ...second.keys()])].filter((f) => first.get(f) !== second.get(f));
      if (moved.length) throw new Error(`a second build changed ${moved.length} file(s): ${moved.slice(0, 5).join(', ')}`);
    },
  },
  {
    // What the build writes is what the tree holds; if not, the tree is put back as it was, and the check fails.
    name: 'generated files are committed',
    run: () => {
      const built = fingerprint();
      const inTree = new Map([...generatedInTree].map(([file, content]): [string, string] => [file, sha256(content)]));
      const differ = [...new Set([...built.keys(), ...inTree.keys()])]
        .sort()
        .filter((file: string): boolean => built.get(file) !== inTree.get(file))
        .map((file: string): string => `${file.replace(/\\/g, '/')} (${!inTree.has(file) ? 'not in the tree' : !built.has(file) ? 'no longer built' : 'out of date'})`);
      if (!differ.length) return;
      restoreGeneratedFiles();
      throw new Error(
        `the build disagrees with ${differ.length} generated file(s) in the tree — run \`npm run build\` and commit the result:\n` +
          differ.slice(0, 8).join('\n') +
          (differ.length > 8 ? `\n… and ${differ.length - 8} more` : '')
      );
    },
  },
  {
    // Every generated theme and icon theme is contributed, and every contribution is generated; a stray file ships and loads nowhere.
    name: 'outputs are declared',
    run: () => {
      const manifest: { contributes: { themes: { path: string }[]; iconThemes: { path: string }[] } } = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
      );
      const problems: string[] = [
        ...undeclaredFiles('themes', manifest.contributes.themes.map((theme) => theme.path)),
        ...undeclaredFiles(path.join('icons', 'theme'), manifest.contributes.iconThemes.map((iconTheme) => iconTheme.path)),
      ];
      if (problems.length) throw new Error(problems.join('\n'));
    },
  },
  {
    // Structure, colours in all eight variants, icon associations and icon geometry, one fact to a line.
    name: 'snapshots',
    run: () => void node('regression/snapshot.ts', '--check'),
  },
  {
    // The previews and the icon measurements were rendered from the inputs in the tree, not from older ones.
    name: 'rendered outputs are current',
    run: () => void node('regression/rendered-from.ts', '--check'),
  },
  {
    // Every screenshot and every page or source file the docs link by relative path is in the tree.
    name: 'images and links resolve',
    run: () => void node('docs/check-images.ts', '--offline'),
  },
  {
    // What vsce would package is the manifest, the listing's pages and what package.json contributes — nothing else, nothing less.
    name: 'package contents',
    run: () => void node('release/check-package.ts'),
  },
  {
    name: 'inventory is up to date',
    run: () => void node('docs/inventory.ts', '--check'),
  },
];

let failed = 0;
for (const { name, run } of CHECKS) {
  const started = Date.now();
  try {
    run();
    console.log(`  ok    ${name}  (${Date.now() - started} ms)`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}`);
    for (const l of String((err as Error).message ?? err).split('\n')) console.log(`        ${l}`);
  }
}

console.log(failed ? `\n${failed} of ${CHECKS.length} checks failed` : `\nall ${CHECKS.length} checks passed`);
process.exitCode = failed ? 1 : 0;
