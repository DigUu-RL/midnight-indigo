/*
 * Imports the list of workbench colour IDs VS Code documents, and writes it to
 * tools/vscode-colors.json:
 *
 *   node tools/import-vscode-colors.ts
 *
 * Why this exists
 * ---------------
 * A theme only colours the IDs it names. Every other surface falls back to VS
 * Code's default dark theme, and that fallback is silent: a panel the theme
 * never heard of simply renders in Dark Modern's greys, inside an editor that
 * is otherwise ultra-dark indigo. The only way to see those holes is to hold
 * the theme against the full list, which is what tools/inventory.ts does —
 * and this is where that list comes from.
 *
 * The source is the colour reference in microsoft/vscode-docs, grouped by the
 * same sections the page uses (Lists and trees, Integrated Terminal, Chat…),
 * which is also the grouping the roadmap works in.
 *
 * Two revisions, both pinned so a re-run reproduces the same file
 * ---------------------------------------------------------------
 *   CURRENT  what VS Code documents now.
 *   FLOOR    what it documented when 1.60 shipped — package.json's
 *            `engines.vscode` floor. An ID present now and absent then is one
 *            the theme was never written against, which is the working
 *            definition of "added in a modern version".
 *
 * Bump CURRENT on purpose, in a commit that says so, and re-run
 * `npm run inventory` so the coverage report moves with it.
 *
 * The output is checked in, so the inventory never touches the network.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'vscode-colors.json');

const DOC = 'api/references/theme-color.md';
const raw = (ref: string): string =>
  `https://raw.githubusercontent.com/microsoft/vscode-docs/${ref}/${DOC}`;

const CURRENT = { ref: '4f4413d9a9d3f7e59284da7cdbb21bc3b9f65c48', date: '2026-09-23' };
const FLOOR = { vscode: '1.60', ref: 'd621fbe3a937b16ab81c62fc322e2def6a4fd450', date: '2021-09-02' };

/** Section heading -> the IDs listed under it, in the page's order. */
function parse(markdown: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  const seen = new Set<string>();
  let section = '';
  for (const line of markdown.split('\n')) {
    const heading = /^## (.+?)\s*$/.exec(line);
    if (heading) {
      section = heading[1];
      continue;
    }
    const entry = /^- `([A-Za-z0-9._-]+)`:/.exec(line);
    if (!entry || !section) continue;
    // A handful of IDs are listed twice, under two sections. The first one wins.
    if (seen.has(entry[1])) continue;
    seen.add(entry[1]);
    (sections[section] ??= []).push(entry[1]);
  }
  return sections;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

const [current, floor] = await Promise.all([
  fetchText(raw(CURRENT.ref)).then(parse),
  fetchText(raw(FLOOR.ref)).then(parse),
]);

const floorIds = Object.values(floor).flat().sort();
const currentCount = Object.values(current).flat().length;
if (currentCount < 500) {
  throw new Error(`only ${currentCount} IDs parsed — the page's format has probably changed`);
}

const data = {
  source: `https://github.com/microsoft/vscode-docs/blob/${CURRENT.ref}/${DOC}`,
  current: CURRENT,
  floor: FLOOR,
  sections: current,
  floorIds,
};

fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(
  `wrote tools/vscode-colors.json — ${currentCount} IDs in ${Object.keys(current).length} sections ` +
    `(${floorIds.length} at ${FLOOR.vscode})`
);
