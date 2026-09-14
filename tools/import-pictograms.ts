/*
 * Imports the pictogram geometry the icon set uses for everything that has no
 * official logo, and writes it to tools/pictogram-paths.ts:
 *
 *   node tools/import-pictograms.ts
 *
 * Why these are imported rather than drawn
 * ----------------------------------------
 * Up to V3 every pictogram in this set was drawn here by hand out of capsules,
 * rounded polygons and stroked arcs. That library was internally consistent and
 * it was still the weakest half of the set: a hand-drawn flask, clipboard and
 * terminal are three drawings by one person who is not an icon designer, and at
 * 16px the difference between those and the imported brand marks beside them
 * was the difference between "an icon" and "a shape".
 *
 * V4 replaces all of them with artwork from Iconify, on the same principle the
 * marks have followed since V3: the GEOMETRY is somebody else's, done properly,
 * and only the TREATMENT is ours — the box, the measured centring, the palette,
 * the duotone split, the shadow.
 *
 * The source
 * ----------
 * Phosphor 2.1.1 (MIT), `-duotone` — one family for the whole library, because
 * a pictogram set assembled from five families reads as five sets. Phosphor is
 * the right one: it is drawn on a 256 grid with round caps and joins (nothing
 * in it comes to a bare point, which was the rule V3 wrote for its own shapes),
 * it is broad enough to answer every file role this set has to name, and its
 * duotone variant is already the split this set's colour system wants — a
 * surface at low opacity behind full-opacity detail.
 *
 * A handful of concepts Phosphor does not draw are taken from other Iconify
 * collections; each is noted at its entry with the licence it comes under.
 *
 * DUOTONE
 * -------
 * Upstream duotone is one colour at two opacities. This set does not use
 * opacity — it paints on a near-black ground where a 20% shape is invisible —
 * so the import RESOLVES the opacity into slots: anything upstream dims goes to
 * slot 1 (the tint, a lighter tone of the identity colour) and everything else
 * to slot 0 (the ink). tools/palette.ts derives the pair from the one colour
 * tools/icon-spec.ts names, so a pictogram costs one colour, not two.
 *
 * The output is checked in, so building the icons never touches the network.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PHOSPHOR = '2.1.1';

/**
 * One pictogram to import: the Iconify id it comes from, and why that icon and
 * not its neighbour. The note is the point of this table — "which drawing means
 * `dto`" is a judgement, and the next person to ask should find the answer here
 * rather than re-deriving it from the file name.
 */
type Source = { id: string; note?: string };

const ph = (name: string, note?: string): Source => ({ id: `ph:${name}-duotone`, note });

/* -------------------------------------------------------------- *
 * The library
 * -------------------------------------------------------------- */

const SOURCES: Record<string, Source> = {
  /* ---------------- documents, data and text ---------------- */
  lines: ph('file-text', 'plain text, and the fallback for anything unrecognised'),
  logLines: ph('list-dashes', 'a log is rows of unkeyed lines, not a document'),
  listCheck: ph('list-checks', 'test files and validators — the passing runs'),
  grid: ph('table', 'CSV and anything else that is rows and columns'),
  cylinder: ph('database', 'SQL, and the stores whose own mark will not survive 16px'),
  scatter: ph('chart-scatter', 'columnar datasets — Parquet, Avro, Arrow'),
  pie: ph('chart-pie-slice', 'BI documents — Power BI, Tableau'),
  book: ph('book', 'stories and long-form documents'),
  books: ph('books', 'a documentation folder is a shelf, not one book'),
  ebook: ph('book-bookmark', 'EPUB and friends — a book with a reader in it'),
  certificate: ph('certificate', 'LICENSE: a document that grants something'),
  history: ph('clock-counter-clockwise', 'CHANGELOG'),
  padlock: ph('lock-laminated', 'lockfiles — a resolved, sealed dependency tree'),
  lockSimple: ph('lock-simple', 'constants: values that do not move'),
  key: ph('key', 'certificates and key material'),
  fingerprint: ph('fingerprint', 'credentials and secrets'),
  scroll: ph('scroll', 'notices, manifests and other read-me-first documents'),

  /* ---------------- version control ---------------- */
  gitDiff: ph('git-diff', 'patches and diffs'),
  // MingCute's commit is the same diagram with a node heavy enough to survive
  // the file tree; Phosphor's is a hairline with a ring on it. (Apache 2.0.)
  gitCommit: { id: 'mingcute:git-commit-fill', note: 'commit tooling — commitlint, changesets, releases' },
  gitPullRequest: ph('git-pull-request', 'PR and issue templates'),

  /* ---------------- media and binary ---------------- */
  binary: ph('binary', 'compiled objects and libraries'),
  picture: ph('image'),
  typeA: ph('text-aa', 'font files'),
  musicNote: ph('music-notes'),
  film: ph('film-strip', 'video'),
  clapper: ph('film-slate', 'editing projects rather than finished video'),
  // Fluent rather than Phosphor: Phosphor's subtitle card is a faint outline
  // with two hairlines in it, and at 16px it is a blank rectangle. Fluent draws
  // the caption bars heavy enough to still be caption bars. (MIT.)
  subtitle: { id: 'fluent:subtitles-24-filled', note: 'subtitle and caption tracks' },
  zip: ph('file-zip'),
  disk: ph('disc', 'disk images — ISO, DMG, VHD'),
  floppy: ph('floppy-disk', 'backups and saved state'),
  vectorPen: ph('bezier-curve', 'SVG, AI, EPS — art that is curves rather than pixels'),
  camera: ph('camera', 'raw captures off a sensor'),
  waveform: ph('waveform', 'audio projects and sessions'),

  /* ---------------- packages, boxes and modules ---------------- */
  package: ph('package', 'an installable artefact — deb, msi, vsix, whl'),
  cube: ph('cube', 'assets: one thing made of parts'),
  mesh: ph('cube-transparent', '3D models — a cube you can see the far edges of'),
  squares: ph('squares-four', 'modules: many small units under one name'),
  archiveTray: ph('archive', 'archived or vendored material'),
  folders: ph('folders', 'workspaces and monorepo roots'),
  container: ph('shipping-container', 'dev containers'),

  /* ---------------- code roles ---------------- */
  flask: ph('flask', 'specs — the experiment, not the checklist'),
  testTube: ph('test-tube', 'a second test shape, for the runners'),
  wrench: ph('wrench', 'configuration'),
  compress: ph('arrows-in-simple', 'minified output'),
  tag: ph('tag', 'type declarations — a label put on something else'),
  puzzle: ph('puzzle-piece', 'components'),
  gear: ph('gear-six', 'services'),
  gearFine: ph('gear-fine', 'unit files and daemons'),
  shield: ph('shield', 'security'),
  shieldCheck: ph('shield-check', 'guards — security that has already answered'),
  shieldWarning: ph('shield-warning', 'security policies and advisories'),
  funnel: ph('funnel', 'pipes and interceptors'),
  wand: ph('magic-wand', 'directives'),
  sliders: ph('sliders-horizontal', 'controllers'),
  exchange: ph('arrows-left-right', 'DTOs — a shape that exists to cross a boundary'),
  /*
   * The brackets are the one family taken at Phosphor's BOLD weight rather than
   * its duotone, and the reason is worth writing down because it will come up
   * again. A duotone icon is a surface with detail on it, and for a bracket the
   * surface is a rounded blob and the detail is the bracket — so at 16px the
   * blob is all that survives and every one of them reads as the same lozenge.
   * JSON and XML are not files a set can afford to lose. The bold weight drops
   * the surface and draws the bracket itself, which is the whole icon anyway.
   */
  braces: { id: 'ph:brackets-curly-bold', note: 'JSON and the config formats shaped like it' },
  // `code-simple` rather than `brackets-angle`: XML is < >, and the angle
  // bracket on its own reads as a chevron pair pointing outward.
  angles: { id: 'ph:code-simple-bold', note: 'XML and its dialects' },
  parens: { id: 'ph:brackets-round-bold', note: 'the Lisps, whose syntax IS the parenthesis' },
  fx: ph('function', 'functions'),
  anchor: ph('anchor-simple', 'hooks'),
  terminal: ph('terminal-window', 'scripts and shells'),
  browser: ph('browser', 'anything the browser is the runtime for'),
  layout: ph('layout'),
  eye: ph('eye', 'views'),
  globe: ph('globe-hemisphere-west', 'public and web-facing'),
  hammer: ph('hammer', 'build systems'),
  brush: ph('paint-brush-broad', 'styles'),
  palette: ph('palette', 'colour themes and palettes'),
  star: ph('star', 'icons'),
  chip: ph('cpu', 'core'),
  circuit: ph('circuitry', 'hardware description — Verilog, VHDL'),
  gpu: ph('graphics-card', 'shaders and GPU kernels'),
  printer: ph('printer', 'G-code and print jobs'),
  plug: ph('plug', 'plugins'),
  serverRack: ph('hard-drives', 'servers'),
  flow: ph('flow-arrow', 'pipelines and workflows'),
  route: ph('path', 'routes'),
  share: ph('share-network', 'shared code'),
  layers: ph('stack', 'middleware'),
  atom: ph('atom', 'context and state'),
  ghost: ph('ghost', 'mocks and fixtures'),
  robot: ph('robot', 'robots.txt and crawler rules'),
  translate: ph('translate', 'i18n'),
  lifebuoy: ph('lifebuoy', 'helpers'),
  leaf: ph('leaf', 'Twig and the leaf-marked template languages'),
  drop: ph('drop', 'Liquid templates'),
  brain: ph('brain', 'the logic languages, and model files'),
  command: ph('command', 'AppleScript, AutoHotkey — scripting the desktop itself'),
  dog: ph('dog', 'Husky'),
  speedometer: ph('speedometer', 'benchmarks and performance budgets'),
  timer: ph('timer', 'schedules — cron and its relatives'),
  compass: ph('compass-tool', 'CAD drawings'),
  shapes: ph('shapes', 'design documents'),
  diagram: ph('graph', 'Mermaid, PlantUML, Graphviz — a drawn graph'),
  treeStructure: ph('tree-structure', 'schemas and sitemaps'),
  rss: ph('rss-simple', 'feeds'),
  send: ph('paper-plane-tilt', 'HTTP request collections — .http, .rest, Postman'),
  keyboard: ph('keyboard', 'keymaps and shortcut definitions'),
  users: ph('users-three', 'CODEOWNERS and team files'),
  chat: ph('chat-circle-text', 'discussion templates'),
  cloud: ph('cloud', 'cloud descriptors with no vendor mark of their own'),
  network: ph('network', 'captures, hosts files, topology'),
  wave: ph('wave-sine', 'signals and waveform data'),
  mapFold: ph('map-trifold', 'source maps'),
  mapPin: ph('map-pin', 'geodata'),
  magnet: ph('magnet', 'torrents'),
  gamepad: ph('game-controller', 'ROMs and saves'),
  math: ph('math-operations', 'notebooks and computer-algebra documents'),
  sparkle: ph('sparkle', 'assistant rules and prompts'),
  link: ph('link-simple', 'shortcuts'),
  bug: ph('bug', 'crash dumps and debug symbols'),
  envelope: ph('envelope-simple', 'mail'),
  calendar: ph('calendar-dots'),
  contactCard: ph('identification-card', 'vCards'),
  trash: ph('trash', 'temporary and discarded files'),
};

/* -------------------------------------------------------------- *
 * Fetch
 * -------------------------------------------------------------- */

type IconifyResponse = {
  width?: number;
  height?: number;
  icons?: Record<string, { body: string; width?: number; height?: number }>;
};

const API = 'https://api.iconify.design';

async function fetchIcons(prefix: string, names: string[]): Promise<Map<string, { body: string; box: number }>> {
  const out = new Map<string, { body: string; box: number }>();
  for (let i = 0; i < names.length; i += 50) {
    const chunk = names.slice(i, i + 50);
    const res = await fetch(`${API}/${prefix}.json?icons=${chunk.join(',')}`);
    if (!res.ok) throw new Error(`${prefix}: HTTP ${res.status}`);
    const data = (await res.json()) as IconifyResponse;
    for (const name of chunk) {
      const icon = data.icons?.[name];
      if (!icon) throw new Error(`${prefix}:${name} does not exist upstream`);
      const w = icon.width ?? data.width ?? 24;
      const h = icon.height ?? data.height ?? 24;
      if (w !== h) throw new Error(`${prefix}:${name} is ${w}x${h}; only square artwork is imported`);
      out.set(name, { body: icon.body, box: w });
    }
  }
  return out;
}

/* -------------------------------------------------------------- *
 * Upstream body -> slotted paths
 * -------------------------------------------------------------- */

type Part = { c: number; d: string; evenOdd?: true };

const num = (v: string | undefined, fallback = 0): number => (v === undefined ? fallback : Number(v));
const attr = (attrs: string, name: string): string | undefined =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];

/**
 * Anything that is not a <path> is turned into one, so the checked-in file is a
 * single shape the build can paint without knowing what it used to be.
 */
function elementToPathData(tag: string, attrs: string): string {
  const n = (name: string, fallback = 0): number => num(attr(attrs, name), fallback);
  switch (tag) {
    case 'path':
      return attr(attrs, 'd') ?? '';
    case 'circle': {
      const [cx, cy, r] = [n('cx'), n('cy'), n('r')];
      return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
    }
    case 'ellipse': {
      const [cx, cy, rx, ry] = [n('cx'), n('cy'), n('rx'), n('ry')];
      return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
    }
    case 'rect': {
      const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
      const r = Math.min(n('rx', n('ry')), w / 2, h / 2);
      if (!r) return `M${x} ${y}h${w}v${h}h${-w}Z`;
      return (
        `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}` +
        `a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`
      );
    }
    case 'polygon':
    case 'polyline': {
      const pts = (attr(attrs, 'points') ?? '').trim().split(/[\s,]+/);
      if (pts.length < 4) return '';
      return `M${pts[0]} ${pts[1]}` + pts.slice(2).reduce((s, v, i) => (i % 2 ? `${s} ${v}` : `${s}L${v}`), '') + 'Z';
    }
    default:
      throw new Error(`unsupported element <${tag}> in imported artwork`);
  }
}

const LEAF = /<(path|circle|ellipse|rect|polygon|polyline)\b([^>]*?)\/?>/g;
const GROUP = /<g\b([^>]*)>([\s\S]*?)<\/g>/;

/**
 * Resolves an upstream duotone body into our two slots.
 *
 * Upstream says "this shape is the same colour at 20%"; this set has no 20% —
 * on #040208 a 20% shape is the ground. So dimmed artwork becomes slot 1, which
 * palette.ts renders as a lighter tone of the identity colour at full strength,
 * and everything else becomes slot 0.
 */
function slottedParts(body: string): Part[] {
  // Flatten <g> wrappers, pushing an inherited dim onto their children.
  let flat = body;
  for (let guard = 0; guard < 12; guard++) {
    const m = GROUP.exec(flat);
    if (!m) break;
    const dim = Number(attr(m[1], 'opacity') ?? '1') < 1;
    const inner = dim
      ? m[2].replace(/<(path|circle|ellipse|rect|polygon|polyline)\b/g, '<$1 data-dim="1"')
      : m[2];
    flat = flat.slice(0, m.index) + inner + flat.slice(m.index + m[0].length);
  }
  if (/<g\b/.test(flat)) throw new Error('artwork still has unflattened groups');

  const parts: Part[] = [];
  for (const m of flat.matchAll(LEAF)) {
    const [, tag, attrs] = m;
    if (attr(attrs, 'fill') === 'none' && !attr(attrs, 'stroke')) continue;
    const dim = /data-dim="1"/.test(attrs) || Number(attr(attrs, 'opacity') ?? '1') < 1;
    const d = elementToPathData(tag, attrs);
    if (!d) continue;
    const part: Part = { c: dim ? 1 : 0, d };
    if (attr(attrs, 'fill-rule') === 'evenodd') part.evenOdd = true;
    parts.push(part);
  }
  if (!parts.length) throw new Error('artwork resolved to nothing');
  // The tint is a surface: it is painted first so the ink sits on top of it.
  return [...parts.filter((p) => p.c === 1), ...parts.filter((p) => p.c === 0)];
}

/* -------------------------------------------------------------- *
 * Emit
 * -------------------------------------------------------------- */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'pictogram-paths.ts');

const byPrefix = new Map<string, string[]>();
for (const { id } of Object.values(SOURCES)) {
  const [prefix, name] = id.split(':');
  if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
  byPrefix.get(prefix)!.push(name);
}

const fetched = new Map<string, { body: string; box: number }>();
for (const [prefix, names] of byPrefix) {
  const icons = await fetchIcons(prefix, [...new Set(names)]);
  for (const [name, icon] of icons) fetched.set(`${prefix}:${name}`, icon);
  console.log(`${prefix}: fetched ${icons.size} icons`);
}

const lines: string[] = [
  '/*',
  ' * GENERATED by tools/import-pictograms.ts — do not edit by hand.',
  ' *',
  ' * Pictogram geometry from Iconify, resolved into this set\'s two colour slots:',
  ' *   0 — the ink, the identity colour',
  ' *   1 — the tint, a lighter tone of it, derived in tools/palette.ts',
  ' *',
  ` * Phosphor ${PHOSPHOR} (MIT) — https://phosphoricons.com`,
  ' *',
  ' * `box` is the source viewBox\'s edge length; tools/glyphs.ts scales each',
  ' * piece into the 24-unit glyph box and paints the slots.',
  ' */',
  '',
  'export type PictogramPart = { c: number; d: string; evenOdd?: true };',
  'export type PictogramArt = { box: number; src: string; parts: readonly PictogramPart[] };',
  '',
  'export const pictogramPaths = {',
];

for (const [name, source] of Object.entries(SOURCES)) {
  const icon = fetched.get(source.id)!;
  const parts = slottedParts(icon.body);
  if (source.note) lines.push(`  // ${source.note}`);
  lines.push(`  ${name}: {`);
  lines.push(`    box: ${icon.box},`);
  lines.push(`    src: '${source.id}',`);
  lines.push('    parts: [');
  for (const p of parts) {
    lines.push(`    { c: ${p.c},${p.evenOdd ? ' evenOdd: true,' : ''} d: '${p.d.replace(/'/g, "\\'")}' },`);
  }
  lines.push('    ],');
  lines.push('  },');
}

lines.push('} satisfies Record<string, PictogramArt>;', '', 'export type ImportedPictogram = keyof typeof pictogramPaths;', '');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`wrote tools/pictogram-paths.ts (${Object.keys(SOURCES).length} pictograms)`);
