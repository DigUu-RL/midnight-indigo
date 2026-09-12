/*
 * Imports the official brand geometry the icon set draws its language marks
 * from, and writes it to tools/mark-paths.ts:
 *
 *   node tools/import-marks.ts
 *
 * Why this exists
 * ---------------
 * A language mark is not ours to invent. "Python" is two specific interlocking
 * snakes, "Go" is a specific wordmark with three speed lines behind it, and an
 * approximation drawn from memory is the thing that makes an icon set look
 * almost-right — which is worse than looking nothing like the logo at all. So
 * the outlines come from the projects' own artwork, and only the *treatment*
 * (size, palette, shadow, glow) is ours. tools/marks.ts is where the treatment
 * is applied, and it is also where the marks that have no usable upstream SVG
 * are drawn by hand from the same references.
 *
 * Sources, both pinned so a re-run reproduces the same file
 * --------------------------------------------------------
 *   simple-icons 16.29.0  CC0-1.0 (public domain) — https://simpleicons.org
 *       Flat, single-path, already in a 24x24 box. The default source.
 *   devicon v2.17.0       MIT — https://github.com/devicons/devicon
 *       Used only where the mark is genuinely multi-colour (Python's two
 *       snakes, the HTML5 and CSS3 shields, Dart, Vue, C#, Azure) and a
 *       single-colour silhouette would not be the logo any more. Gradients are
 *       flattened to the brand's flat colours by `fills` below — the icon set
 *       is flat, and a gradient would be the only one in it.
 *
 * What is NOT here
 * ----------------
 * A logo only earns an import if it survives being drawn at 16px, which is the
 * size VS Code renders a file icon at. Several upstream marks do not: Groovy's
 * is an outlined wordmark on a star, Jenkins's is a line-art portrait, Jest's
 * is a line-art wizard, Vim's sets "Vim" inside its diamond, Lua's sets "Lua"
 * inside its sphere. At 16px each of those is a smudge. Those are redrawn in
 * tools/marks.ts, solid and simplified, from the same official artwork.
 *
 * The output is checked in, so building the icons never touches the network.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SIMPLE_ICONS = '16.29.0';
const DEVICON = 'v2.17.0';

const SI_ICON = `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS}/icons/`;

/*
 * simple-icons ships the brand's official colour next to its geometry, and this
 * reads it rather than asking anyone to copy it across.
 *
 * The two halves of a mark used to come from different places: the outline was
 * imported, and the hex beside it in tools/marks.ts was typed in by hand from
 * the brand's guidelines. That is fine for a dozen marks and is not fine for a
 * hundred and forty — a wrong digit is invisible in review, survives every
 * check the build makes, and ships an icon in a colour the project does not
 * use. So a single-colour mark now declares no palette at all and takes the
 * hex the artwork came with.
 *
 * The multi-colour marks still name their slots in tools/marks.ts, because
 * there is no single official colour to read: what those need is a decision
 * about which of the brand's colours goes in which slot.
 */
const SI_DATA = `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS}/data/simple-icons.json`;

const si = (slug: string): string => `${SI_ICON}${slug}.svg`;
const dv = (name: string, variant = 'original'): string =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon@${DEVICON}/icons/${name}/${name}-${variant}.svg`;

/** The simple-icons slug a URL refers to, if it is a simple-icons URL at all. */
const slugOf = (url: string): string | undefined =>
  url.startsWith(SI_ICON) ? url.slice(SI_ICON.length).replace(/\.svg$/, '') : undefined;

/**
 * One mark to import. `fills` is only needed for the multi-colour sources: it
 * maps a fill in the upstream file (or a gradient reference) to the colour SLOT
 * the mark uses, and anything not named there is dropped — which is how the
 * shields lose the grey half-tone panels that a flat set has no use for.
 */
type Source = {
  url: string;
  /** Upstream fill (lower-cased) -> slot index. Single-path marks need none. */
  fills?: Record<string, number>;
  note?: string;
};

const SOURCES: Record<string, Source> = {
  /* --- simple-icons: flat, one path, one colour --- */
  apache: { url: si('apache') },
  astro: { url: si('astro') },
  babel: { url: si('babel') },
  c: { url: si('c') },
  clojure: { url: si('clojure') },
  coffeescript: { url: si('coffeescript') },
  cplusplus: { url: si('cplusplus') },
  crystal: { url: si('crystal') },
  // The logo CSS got in November 2024: "CSS" in rebeccapurple, the colour named
  // for Rebecca Meyer. It replaces the blue CSS3 shield, which was never a W3C
  // mark for the language itself.
  css: { url: si('css') },
  docker: { url: si('docker') },
  dotenv: { url: si('dotenv') },
  dotnet: { url: si('dotnet') },
  elixir: { url: si('elixir') },
  eslint: { url: si('eslint') },
  fishshell: { url: si('fishshell') },
  fsharp: { url: si('fsharp') },
  git: { url: si('git') },
  // The tanuki as GitLab simplified it in 2022 — one solid head, not the seven
  // triangles of the old mark.
  gitlab: { url: si('gitlab') },
  gnubash: { url: si('gnubash') },
  go: { url: si('go') },
  graphql: { url: si('graphql') },
  handlebars: { url: si('handlebarsdotjs') },
  haskell: { url: si('haskell') },
  javascript: { url: si('javascript') },
  jupyter: { url: si('jupyter') },
  markdown: { url: si('markdown') },
  mdx: { url: si('mdx') },
  nginx: { url: si('nginx') },
  nim: { url: si('nim') },
  perl: { url: si('perl') },
  php: { url: si('php') },
  pnpm: { url: si('pnpm') },
  pug: { url: si('pug') },
  r: { url: si('r') },
  react: { url: si('react') },
  rollup: { url: si('rollupdotjs') },
  ruby: { url: si('ruby') },
  rust: { url: si('rust') },
  sass: { url: si('sass') },
  scala: { url: si('scala') },
  solidity: { url: si('solidity') },
  stylelint: { url: si('stylelint') },
  svelte: { url: si('svelte') },
  swift: { url: si('swift') },
  terraform: { url: si('terraform') },
  toml: { url: si('toml') },
  typescript: { url: si('typescript') },
  vagrant: { url: si('vagrant') },
  vite: { url: si('vite') },
  webpack: { url: si('webpack') },
  yarn: { url: si('yarn') },
  zig: { url: si('zig') },
  zsh: { url: si('zsh') },

  /* --- the logos the set used to letter, and that survive being lettered --- *
   *
   * Both of these had a real mark all along and the set was lettering them
   * anyway. Their neighbours in that audit did not make it: Less, Stylus,
   * EditorConfig, JSON, MySQL, Travis and Composer were all imported, drawn at
   * 16px, and put back as lettering or as one of our pictograms, because each
   * of those logos is a logotype, a line-art mascot or a ring. They are named
   * here so the next person to notice the gap does not import them a third
   * time — the rule at the top of this file is what decided it, and the
   * reasons are recorded next to each entry in tools/icon-spec.ts.
   */
  erlang: { url: si('erlang') },
  yaml: { url: si('yaml') },

  /* --- CI, which was one lettered "CI" for three different services --- */
  bitbucket: { url: si('bitbucket') },
  circleci: { url: si('circleci') },
  githubactions: { url: si('githubactions') },
  renovate: { url: si('renovate') },

  /* --- frameworks and runtimes --- */
  angular: { url: si('angular') },
  bootstrap: { url: si('bootstrap') },
  bun: { url: si('bun') },
  deno: { url: si('deno') },
  django: { url: si('django') },
  electron: { url: si('electron') },
  flutter: { url: si('flutter') },
  laravel: { url: si('laravel') },
  nextdotjs: { url: si('nextdotjs') },
  nodedotjs: { url: si('nodedotjs') },
  nuxt: { url: si('nuxt') },
  spring: { url: si('spring') },
  tailwindcss: { url: si('tailwindcss') },
  tauri: { url: si('tauri') },

  /* --- build, package and workspace tooling --- */
  anaconda: { url: si('anaconda') },
  apachemaven: { url: si('apachemaven') },
  esbuild: { url: si('esbuild') },
  gradle: { url: si('gradle') },
  lerna: { url: si('lerna') },
  nuget: { url: si('nuget') },
  nx: { url: si('nx') },
  poetry: { url: si('poetry') },
  postcss: { url: si('postcss') },
  turborepo: { url: si('turborepo') },

  /* --- test runners --- */
  cypress: { url: si('cypress') },
  mocha: { url: si('mocha') },
  storybook: { url: si('storybook') },
  vitest: { url: si('vitest') },

  /* --- infrastructure and hosting --- */
  ansible: { url: si('ansible') },
  cloudflare: { url: si('cloudflare') },
  helm: { url: si('helm') },
  kubernetes: { url: si('kubernetes') },
  netlify: { url: si('netlify') },
  packer: { url: si('packer') },
  pulumi: { url: si('pulumi') },
  serverless: { url: si('serverless') },
  vercel: { url: si('vercel') },

  /* --- data stores --- */
  firebase: { url: si('firebase') },
  mongodb: { url: si('mongodb') },
  postgresql: { url: si('postgresql') },
  prisma: { url: si('prisma') },
  redis: { url: si('redis') },
  sqlite: { url: si('sqlite') },
  supabase: { url: si('supabase') },

  /* --- more languages --- */
  elm: { url: si('elm') },
  fortran: { url: si('fortran') },
  gleam: { url: si('gleam') },
  haxe: { url: si('haxe') },
  nixos: { url: si('nixos') },
  ocaml: { url: si('ocaml') },
  purescript: { url: si('purescript') },
  racket: { url: si('racket') },
  webassembly: { url: si('webassembly') },

  /* --- documents, schemas and design --- */
  asciidoctor: { url: si('asciidoctor') },
  latex: { url: si('latex') },
  openapiinitiative: { url: si('openapiinitiative') },
  swagger: { url: si('swagger') },

  /* --- formats from outside the web stack, which is the point --- *
   *
   * A 3D scene, a CAD sketch, a game scene, a sketchboard and a microcontroller
   * sketch are not what most repositories hold, and that is exactly why they
   * were missing: an icon set grows around the files its author happens to
   * open. These are the ones with a real mark; the rest of that world is
   * covered by the pictograms.
   */
  arduino: { url: si('arduino') },
  blender: { url: si('blender') },
  figma: { url: si('figma') },
  godotengine: { url: si('godotengine') },
  qt: { url: si('qt') },
  unity: { url: si('unity') },

  /* --- devicon: the marks that are two-tone by nature --- */
  python: {
    url: dv('python'),
    // The upstream file paints each snake with a gradient; the brand's flat
    // colours are the two ends of those gradients. The third path is a soft
    // ground shadow under the mark, which is not part of the logo.
    fills: { 'url(#python-original-a)': 0, 'url(#python-original-b)': 1 },
    note: 'gradients flattened to the flat brand blue/yellow; ground shadow dropped',
  },
  dart: {
    url: dv('dart'),
    fills: { '#0075c9': 0, '#00a8e1': 1, '#00c4b3': 2, '#22d3c5': 3 },
  },
  vue: { url: dv('vuejs'), fills: { '#35495e': 0, '#41b883': 1 } },
  // The steaming cup, in the two colours the mark has always been drawn in:
  // a blue cup under red steam.
  java: { url: dv('java'), fills: { '#0074bd': 0, '#ea2d2e': 1 } },
  // The numeral on the shield is drawn in two tones, white over a grey
  // half-tone. A flat set has one tone, so both map to the same slot and the
  // numeral comes out solid.
  html5: { url: dv('html5'), fills: { '#e44d26': 0, '#f16529': 1, '#ebebeb': 2, '#fff': 2 } },
  csharp: { url: dv('csharp'), fills: { '#9b4f96': 0, '#68217a': 1, '#fff': 2 } },
  azure: {
    url: dv('azure'),
    // Two gradient slabs and one solid wedge make the "A"; the fourth path is a
    // translucent shadow the flat mark has no use for.
    fills: { 'url(#azure-original-a)': 0, '#0078d4': 0, 'url(#azure-original-c)': 1 },
    note: 'gradients flattened; translucent shadow slab dropped',
  },
};

/* -------------------------------------------------------------- *
 * Extraction
 * -------------------------------------------------------------- */

type Part = { d: string; c: number };

const attr = (tag: string, name: string): string | undefined =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

function extract(name: string, src: Source, svg: string): { box: number; parts: Part[] } {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error(`${name}: no viewBox`);
  const [minX, minY, w, h] = viewBox.split(/[\s,]+/).map(Number);
  if (minX !== 0 || minY !== 0 || w !== h) throw new Error(`${name}: unexpected viewBox "${viewBox}"`);

  // Groups and transforms would have to be flattened into the path data, and no
  // source below uses them. Fail loudly rather than silently dropping artwork.
  if (/<(g|use|image|text)\b/.test(svg)) throw new Error(`${name}: source has elements this importer cannot flatten`);

  const parts: Part[] = [];
  for (const tag of svg.match(/<path\b[^>]*>/g) || []) {
    const d = attr(tag, 'd');
    if (!d) continue;
    const fill = (attr(tag, 'fill') || '').toLowerCase();
    let slot = 0;
    if (src.fills) {
      const mapped = src.fills[fill];
      if (mapped === undefined) continue; // a half-tone or decoration a flat mark drops
      slot = mapped;
    }
    // Every source below relies on the default nonzero winding — its holes are
    // reverse-wound sub-paths. A source that asked for evenodd would come out
    // with its holes filled in, so refuse it rather than draw it wrong.
    if (attr(tag, 'fill-rule') === 'evenodd' || attr(tag, 'clip-rule') === 'evenodd') {
      throw new Error(`${name}: source uses fill-rule="evenodd", which this importer does not carry through`);
    }
    parts.push({ d, c: slot });
  }
  if (!parts.length) throw new Error(`${name}: no paths survived`);
  return { box: w, parts };
}

/* -------------------------------------------------------------- *
 * Emit
 * -------------------------------------------------------------- */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'mark-paths.ts');

const names = Object.keys(SOURCES).sort();
const imported: Record<
  string,
  { box: number; parts: Part[]; url: string; note?: string; hex?: string }
> = {};

/** slug -> official hex, from simple-icons' own metadata. */
const brandHex = new Map<string, string>();
{
  const res = await fetch(SI_DATA);
  if (!res.ok) throw new Error(`simple-icons metadata: ${res.status} ${SI_DATA}`);
  const data = (await res.json()) as { icons?: unknown[] } | unknown[];
  const rows = (Array.isArray(data) ? data : data.icons || []) as {
    title: string;
    slug?: string;
    hex: string;
  }[];
  // simple-icons only stores `slug` when it differs from the slugified title.
  const slugify = (t: string): string =>
    t
      .toLowerCase()
      .replace(/\+/g, 'plus')
      .replace(/\./g, 'dot')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]/g, '');
  for (const row of rows) brandHex.set(row.slug || slugify(row.title), `#${row.hex}`);
  console.log(`  brand colours: ${brandHex.size} from simple-icons ${SIMPLE_ICONS}\n`);
}

for (const name of names) {
  const src = SOURCES[name];
  const res = await fetch(src.url);
  if (!res.ok) throw new Error(`${name}: ${res.status} ${src.url}`);
  const svg = await res.text();

  const slug = slugOf(src.url);
  const hex = slug ? brandHex.get(slug) : undefined;
  if (slug && !hex) throw new Error(`${name}: no brand colour for simple-icons slug "${slug}"`);

  imported[name] = { ...extract(name, src, svg), url: src.url, note: src.note, hex };
  process.stdout.write(
    `  ${name.padEnd(18)} ${String(imported[name].parts.length).padStart(2)} path(s)  ${hex ?? '(multi-colour)'}\n`
  );
}

const body = names
  .map((name) => {
    const m = imported[name];
    const parts = m.parts
      .map((p) => `    { c: ${p.c}, d: '${p.d.replace(/'/g, "\\'")}' },`)
      .join('\n');
    return (
      `  // ${m.url}${m.note ? `\n  // ${m.note}` : ''}\n` +
      `  ${name}: {\n    box: ${m.box},\n` +
      (m.hex ? `    hex: '${m.hex}',\n` : '') +
      `    parts: [\n${parts}\n    ],\n  },`
    );
  })
  .join('\n');

fs.writeFileSync(
  OUT,
  `/*
 * GENERATED by tools/import-marks.ts — do not edit by hand.
 *
 * Official brand geometry, imported from the projects' own artwork:
 *   simple-icons ${SIMPLE_ICONS} (CC0-1.0)  https://simpleicons.org
 *   devicon ${DEVICON} (MIT)          https://github.com/devicons/devicon
 *
 * \`box\` is the source viewBox's edge length; \`c\` indexes the colour slot the
 * part is painted with. \`hex\` is the brand's official colour as simple-icons
 * records it, present for every single-colour mark — tools/marks.ts uses it as
 * the default palette, so those marks declare no colour of their own. The
 * multi-colour marks have none: which brand colour goes in which slot is a
 * decision, and it is made there. tools/marks.ts scales each mark into the
 * 24x24 glyph box and decides what the slots are painted with in each variant.
 */

export type MarkPart = { c: number; d: string };
export type MarkArt = { box: number; hex?: string; parts: readonly MarkPart[] };

export const markPaths = {
${body}
} satisfies Record<string, MarkArt>;

export type ImportedMark = keyof typeof markPaths;
`,
  'utf8'
);

console.log(`wrote tools/mark-paths.ts (${names.length} marks)`);
