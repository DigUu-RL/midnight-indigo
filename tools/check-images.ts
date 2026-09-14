/*
 * Fetches every image the docs link to and fails on any that does not resolve.
 *
 *   node tools/check-images.ts
 *
 * This exists because of a bug it would have caught. The README loads its
 * screenshots over https — it has to, since the Marketplace renders the README
 * and nothing else and a relative path breaks on the listing — and every URL
 * was pinned to `main`. A screenshot added on a branch does not exist on main
 * until the branch is merged, so `palettes.png` was a broken image in the
 * README, in the pull request, and anywhere else it was read, with nothing to
 * say so. Markdown does not complain about a 404; it just renders nothing.
 *
 * The URLs are pinned to a commit now (IMAGE_REF in build-theme-preview.ts),
 * which resolves as soon as the commit is pushed. That trades one silent
 * failure for another: forget to bump the ref after regenerating screenshots
 * and the docs quietly go on showing the old ones. So this is the check for
 * both. It is the one script here that touches the network, deliberately and
 * never as part of a build.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

const DOCS = ['README.md', 'CHANGELOG.md', path.join('docs', 'PREVIEW.md')];

/** Every distinct http(s) image URL a markdown file references. */
function imageUrls(file: string): string[] {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const found = new Set<string>();
  for (const m of text.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)) found.add(m[1]);
  return [...found];
}

const targets = DOCS.flatMap((file) =>
  fs.existsSync(path.join(ROOT, file)) ? imageUrls(file).map((url) => ({ file, url })) : []
);

if (!targets.length) {
  console.log('no image URLs found — nothing to check');
  process.exit(0);
}

/*
 * HEAD rather than GET: these are screenshots, several of them large, and the
 * only question being asked is whether the ref resolves.
 */
const results = await Promise.all(
  targets.map(async ({ file, url }) => {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      return { file, url, status: res.status, ok: res.ok };
    } catch (err) {
      return { file, url, status: 0, ok: false, err: String(err) };
    }
  })
);

const broken = results.filter((r) => !r.ok);
const short = (u: string): string => u.replace(/^https?:\/\/[^/]+\//, '');

for (const r of results.filter((r) => r.ok)) {
  console.log(`  ok   ${short(r.url)}`);
}

if (broken.length) {
  for (const r of broken) {
    console.error(`  ${String(r.status || 'ERR').padStart(3)}  ${short(r.url)}   (${r.file})`);
  }
  console.error(
    `\n${broken.length} of ${results.length} image(s) do not resolve.\n` +
      'If the screenshots were just regenerated, bump IMAGE_REF in ' +
      'tools/build-theme-preview.ts to the commit that carries them, and update ' +
      'the URLs in README.md.'
  );
} else {
  console.log(`\n${results.length} image(s) resolve.`);
}

/*
 * `process.exitCode` and not `process.exit()`.
 *
 * fetch keeps its connections alive after the last response, and exiting hard
 * tears the event loop down while those sockets are still closing — which on
 * Windows is an assertion failure inside libuv rather than a clean exit. The
 * script printed "31 image(s) resolve." and then returned 127, so a check that
 * had passed looked to every caller like a check that had crashed. Setting the
 * code and letting Node finish on its own is the same result without the race.
 */
process.exitCode = broken.length ? 1 : 0;
