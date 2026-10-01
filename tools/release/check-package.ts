/*
 * What the published extension holds, checked before it is packaged:
 *
 *   node tools/release/check-package.ts
 *
 * `vsce` decides what goes into the .vsix from .vscodeignore, and an
 * ignore list fails open — a new file at the root, a doc or a script, ships
 * unless someone remembered to exclude it. This asks `vsce` for the list it
 * would package and holds it to what the extension is: the manifest, the
 * pages the Marketplace shows, every file package.json contributes, and the
 * SVGs the icon theme names. A file outside that fails, and so does one of
 * those that would be missing.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const ROOT: string = path.join(HERE, '..', '..');
const VSCE: string = path.join(ROOT, 'node_modules', '@vscode', 'vsce', 'vsce');

/** What the Marketplace and VS Code read besides the contributions: the manifest, its icon, and the pages of the listing. */
const LISTING: string[] = ['package.json', 'icon.png', 'README.md', 'CHANGELOG.md', 'LICENSE', 'THIRD-PARTY-NOTICES.md'];

type Manifest = { contributes: { themes: { path: string }[]; iconThemes: { path: string }[]; grammars: { path: string }[] } };
type IconTheme = { iconDefinitions: Record<string, { iconPath: string }> };

const normalize = (file: string): string => path.posix.normalize(file.replace(/\\/g, '/')).replace(/^\.\//, '');

const manifest: Manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const contributed: string[] = [
  ...manifest.contributes.themes.map((theme): string => theme.path),
  ...manifest.contributes.iconThemes.map((iconTheme): string => iconTheme.path),
  ...manifest.contributes.grammars.map((grammar): string => grammar.path),
].map(normalize);
const iconFiles: string[] = manifest.contributes.iconThemes.flatMap((iconTheme): string[] => {
  const theme: IconTheme = JSON.parse(fs.readFileSync(path.join(ROOT, iconTheme.path), 'utf8'));
  return Object.values(theme.iconDefinitions).map((definition): string => normalize(path.posix.join(path.posix.dirname(normalize(iconTheme.path)), definition.iconPath)));
});
const expected: Set<string> = new Set([...LISTING, ...contributed, ...iconFiles]);

const packaged: string[] = execFileSync(process.execPath, [VSCE, 'ls', '--no-dependencies'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  .split(/\r?\n/)
  .filter(Boolean)
  .map(normalize);

const unexpected: string[] = packaged.filter((file: string): boolean => !expected.has(file)).sort();
const missing: string[] = [...expected].filter((file: string): boolean => !packaged.includes(file)).sort();
for (const file of unexpected) console.error(`  ! ${file} would ship, and is neither the listing nor a contribution — exclude it in .vscodeignore`);
for (const file of missing) console.error(`  ! ${file} is part of the extension and would not ship`);
console.log(
  unexpected.length || missing.length
    ? `\nthe package is not what the extension is: ${unexpected.length} unexpected, ${missing.length} missing`
    : `the package holds exactly the extension: ${packaged.length} files`
);
process.exitCode = unexpected.length || missing.length ? 1 : 0;
