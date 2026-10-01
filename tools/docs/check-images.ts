/*
 * Checks every image and every relative link the docs hold, and fails on any that does not resolve.
 *
 *   node tools/docs/check-images.ts             relative images on disk, and every https image over the network
 *   node tools/docs/check-images.ts --offline   relative images on disk only (part of `npm run check`)
 *
 * The screenshots are linked by relative path — `docs/preview/hero.png` from
 * the README, `preview/hero.png` from docs/PREVIEW.md. GitHub resolves those
 * in whatever branch is being read, and `vsce package` rewrites the README's to
 * github.com/<repository>/raw/HEAD/…, so the Marketplace listing shows the
 * default branch's current screenshots and nothing has to be bumped when they
 * are regenerated. They used to be absolute URLs pinned to `main`, and then to
 * a commit that had to be moved by hand; both went stale silently, because
 * Markdown does not complain about a missing image, it renders nothing.
 *
 * What is left to go wrong is a path that points at no file, and that is a
 * question the tree can answer without a network — so it is asked on every
 * `npm run check`. The https images (the badges) still need the network, and
 * are only fetched when this runs without `--offline`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const ROOT: string = path.join(HERE, '..', '..');

/** Every page of documentation: the Markdown at the root (the README in both languages, the changelog) and in docs/. */
const markdownIn = (directory: string): string[] =>
  fs
    .readdirSync(path.join(ROOT, directory))
    .filter((name: string): boolean => name.endsWith('.md'))
    .sort()
    .map((name: string): string => path.join(directory, name));
const DOCS: string[] = [...markdownIn('.'), ...markdownIn('docs')];
const offline: boolean = process.argv.includes('--offline');

type Image = { file: string; target: string };

/** Every distinct image a markdown file references, as written. */
const imagesIn = (file: string): Image[] => {
  const text: string = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const targets: Set<string> = new Set([...text.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((match): string => match[1]));
  return [...targets].map((target: string): Image => ({ file, target }));
};

const images: Image[] = DOCS.filter((file: string): boolean => fs.existsSync(path.join(ROOT, file))).flatMap(imagesIn);
const remote: Image[] = images.filter(({ target }): boolean => /^https?:\/\//.test(target));
const local: Image[] = images.filter(({ target }): boolean => !/^https?:\/\//.test(target));

const problems: string[] = [];

for (const { file, target } of local) {
  const resolved: string = path.join(ROOT, path.dirname(file), target);
  if (!fs.existsSync(resolved)) problems.push(`${target} (in ${file}) is not in the tree`);
}

/*
 * The pages link each other and the source by relative path too, and a page
 * renamed or moved breaks those as quietly as an image. Anchors are not
 * followed: a heading is free to be reworded, a file is not free to vanish.
 */
const linksIn = (file: string): Image[] => {
  // Code is not a link, fenced or inline: `f(x)` after a `]` would read as one.
  const text: string = fs
    .readFileSync(path.join(ROOT, file), 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '``');
  const targets: Set<string> = new Set(
    [...text.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g)]
      .map((match): string => match[1].split('#')[0])
      .filter((target: string): boolean => target !== '' && !/^[a-z]+:/i.test(target))
  );
  return [...targets].map((target: string): Image => ({ file, target }));
};
const links: Image[] = DOCS.flatMap(linksIn);
for (const { file, target } of links) {
  if (!fs.existsSync(path.join(ROOT, path.dirname(file), decodeURIComponent(target)))) problems.push(`${target} (in ${file}) links a file that is not in the tree`);
}

/*
 * A pinned raw.githubusercontent.com screenshot is the thing this replaced:
 * it does not break, it quietly goes stale. Refused outright, so one cannot
 * creep back in by being pasted from an old README.
 */
for (const { file, target } of remote) {
  if (/\/docs\/preview\//.test(target)) problems.push(`${target} (in ${file}) links a screenshot absolutely — link docs/preview/ by relative path`);
}

if (!offline) {
  /* HEAD rather than GET: the only question is whether the URL resolves. */
  const results = await Promise.all(
    remote.map(async ({ file, target }) => {
      try {
        const response: Response = await fetch(target, { method: 'HEAD', redirect: 'follow' });
        return { file, target, status: response.status, ok: response.ok };
      } catch {
        return { file, target, status: 0, ok: false };
      }
    })
  );
  for (const { file, target, status, ok } of results) {
    if (!ok) problems.push(`${target} (in ${file}) answers ${status || 'nothing'}`);
  }
}

for (const problem of problems) console.error(`  ! ${problem}`);
console.log(
  problems.length
    ? `\n${problems.length} problem(s) in the docs`
    : `${local.length} relative image(s) and ${links.length} relative link(s) in the tree${offline ? '' : `, ${remote.length} remote image(s) resolve`}`
);

/*
 * `process.exitCode` and not `process.exit()`.
 *
 * fetch keeps its connections alive after the last response, and exiting hard
 * tears the event loop down while those sockets are still closing — which on
 * Windows is an assertion failure inside libuv rather than a clean exit. The
 * script printed that every image resolved and then returned 127, so a check
 * that had passed looked to every caller like a check that had crashed.
 */
process.exitCode = problems.length ? 1 : 0;
