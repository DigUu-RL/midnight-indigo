/*
 * Runs every offline check the repo has, in order, and says which failed:
 *
 *   npm run check
 *
 * Each check is an entry in CHECKS — a name and a function that throws when
 * it fails. Adding one is adding an entry; the runner does not stop at the
 * first failure, so one run reports everything that is wrong at once.
 *
 * What is NOT here: the network half of `npm run check:images` (the badges;
 * the screenshots are linked by relative path and checked offline) and the
 * screenshots themselves (they need a browser and take a minute). The
 * screenshots are still covered — the inventory pins each PNG by hash, so a
 * regenerated picture that changed makes the inventory check fail until the
 * change is looked at and the inventory rewritten.
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
    // Every screenshot the README and the docs link by relative path is in the tree.
    name: 'images resolve',
    run: () => void node('docs/check-images.ts', '--offline'),
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
