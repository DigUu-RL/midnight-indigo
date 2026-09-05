/*
 * What every icon is made of. Shared by build-icons.ts (which draws them) and
 * measure.ts (which measures them), so the two can never disagree about what
 * text is set at what size.
 *
 * An icon is one of three things:
 *
 *   A MARK — the language's or tool's own logo, from tools/marks.ts. It brings
 *   its official colours with it, so most entries here are a single word. That
 *   is the point: if an icon needs a colour written next to it, either the logo
 *   is ours (a pictogram) or something is being overridden on purpose.
 *
 *   A PICTOGRAM plus a colour — for everything that has no logo, and for the
 *   file *variants* (.spec.ts, .module.ts, ...), where the colour says which
 *   language it is and the pictogram says what the file does.
 *
 *   TEXT — bare letters, no shape behind them. Used for the formats whose logo
 *   IS a wordmark (YAML) and for the ones with no logo at all (INI, BAT, ASM).
 */

import type { Colour } from './shapes.ts';
import type { GlyphName } from './glyphs.ts';
import type { MarkName } from './marks.ts';

export type FileSpec = {
  /** The official logo. Brings its own palette unless `colors` overrides it. */
  mark?: MarkName;
  /** One of our pictograms. Needs `colors`. */
  glyph?: GlyphName;
  /** Bare text, no shape behind it. */
  text?: string;
  /** The palette. Slot 0 is the icon's identity colour in every variant. */
  colors?: readonly Colour[];
  /** Overrides the automatic size for `text`. */
  size?: number;
  /** Nudges `text` off the optical centre — only the lettered marks need it. */
  dy?: number;
  track?: number;
  /** Paints `text` with something other than the identity colour. */
  textFill?: Colour;
  /** Shrinks or grows the artwork inside the icon's box. */
  scale?: number;
};

export type FolderSpec = {
  /** The colour the folder body is painted with. */
  accent: Colour;
  glyph?: GlyphName;
  mark?: MarkName;
};

/** What `label()` and the measuring pass need to set one string. */
export type TextOpts = { size?: number; track?: number };

export const FONT =
  '"Segoe UI Semibold","Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif';
export const WEIGHT = 700;

/*
 * Text is the weak spot of any icon set, and V2 took the tile away — so a
 * lettered icon is now nothing but its letters, and they can have the whole box.
 *
 * These are deliberately set a size too large for the widest string of each
 * length: build-icons.ts only ever SHRINKS a string, and it shrinks from the
 * measured ink, so each one ends up as large as it can be without overrunning
 * the box. Setting a size that the widest string just fits would leave the
 * narrow ones ("INI", "CI") looking half-drawn next to the marks.
 */
const TEXT_SIZE: Record<number, number> = { 1: 24, 2: 20, 3: 16, 4: 13 };
const TEXT_TRACK: Record<number, number> = { 1: 0, 2: -0.8, 3: -0.6, 4: -0.4 };

export const sizeFor = (str: string, opts: TextOpts = {}): number =>
  opts.size || TEXT_SIZE[Math.min([...str].length, 4)] || 10.4;
export const trackFor = (str: string, opts: TextOpts = {}): number =>
  opts.track !== undefined ? opts.track : TEXT_TRACK[Math.min([...str].length, 4)] || -0.4;
export const textKey = (str: string, size: number, track: number): string => `${str}|${size}|${track}`;

const WHITE: Colour = '#FFFFFF';

/* The language colours the file variants inherit. */
const JS: Colour = '#F7DF1E';
const TS: Colour = '#3178C6';
const REACT: Colour = '#61DAFB';

export const files = {
  /* --- JavaScript / TypeScript family --- */
  javascript: { mark: 'javascript' },
  typescript: { mark: 'typescript' },
  jsx: { mark: 'react' },
  mjs: { glyph: 'cubes', colors: [JS] },

  'javascript-spec': { glyph: 'flask', colors: [JS] },
  'javascript-test': { glyph: 'listCheck', colors: [JS] },
  'javascript-config': { glyph: 'wrench', colors: [JS] },
  'javascript-min': { glyph: 'compress', colors: [JS] },
  'javascript-module': { glyph: 'cubes', colors: [JS] },

  'typescript-spec': { glyph: 'flask', colors: [TS] },
  'typescript-test': { glyph: 'listCheck', colors: [TS] },
  'typescript-d': { glyph: 'tag', colors: [TS] },
  'typescript-module': { glyph: 'cubes', colors: [TS] },
  'typescript-component': { glyph: 'puzzle', colors: [TS] },
  'typescript-service': { glyph: 'gear', colors: [TS] },
  'typescript-stories': { glyph: 'book', colors: [TS] },
  'typescript-config': { glyph: 'wrench', colors: [TS] },
  'typescript-guard': { glyph: 'shield', colors: [TS] },
  'typescript-pipe': { glyph: 'funnel', colors: [TS] },
  'typescript-directive': { glyph: 'wand', colors: [TS] },
  'typescript-controller': { glyph: 'sliders', colors: [TS] },
  'typescript-model': { glyph: 'cylinder', colors: [TS] },
  'typescript-dto': { glyph: 'exchange', colors: [TS] },
  'typescript-entity': { glyph: 'grid', colors: [TS] },

  'jsx-spec': { glyph: 'flask', colors: [REACT] },
  'jsx-test': { glyph: 'listCheck', colors: [REACT] },
  'jsx-stories': { glyph: 'book', colors: [REACT] },
  'jsx-component': { glyph: 'puzzle', colors: [REACT] },

  /* --- Web frameworks and templating --- */
  vue: { mark: 'vue' },
  svelte: { mark: 'svelte' },
  astro: { mark: 'astro' },
  coffeescript: { mark: 'coffeescript' },
  handlebars: { mark: 'handlebars' },
  pug: { mark: 'pug' },
  // EJS and Twig have no SVG mark to import: EJS's logo is its lettering, and
  // Twig's is the leaf from its wordmark.
  ejs: { text: 'EJS', colors: ['#B4CA65'] },
  twig: { glyph: 'leaf', colors: ['#78C043'] },
  graphql: { mark: 'graphql' },
  protobuf: { text: 'PB', colors: ['#4285F4'] },

  /* --- Markup and styles --- */
  html: { mark: 'html5' },
  css: { mark: 'css' },
  // Sass is one brand with two syntaxes, so .scss and .sass carry one mark.
  scss: { mark: 'sass' },
  sass: { mark: 'sass' },
  // Both logos are logotypes set in a script face that closes up at 16px, so
  // they are set as text instead, in the brand's own colour.
  less: { text: 'LESS', colors: ['#1D365D'] },
  stylus: { text: 'ST', colors: ['#333333'] },
  'scss-module': { glyph: 'braces', colors: ['#CC6699'] },
  'css-module': { glyph: 'braces', colors: ['#1572B6'] },

  /* --- Data and config formats --- */
  // JSON's mark is a pair of braces closed into a ring, which at icon size is a
  // ring and nothing else. The braces themselves are what say JSON.
  json: { glyph: 'braces', colors: ['#F2C94C'] },
  xml: { glyph: 'angles', colors: ['#005FAD'] },
  yaml: { text: 'YAML', colors: ['#CB171E'] },
  toml: { mark: 'toml' },
  ini: { text: 'INI', colors: ['#7C8794'] },
  env: { mark: 'dotenv' },
  markdown: { mark: 'markdown' },
  mdx: { mark: 'mdx' },
  csv: { glyph: 'grid', colors: ['#22A06B'] },
  sql: { glyph: 'cylinder', colors: ['#E38C00'] },

  /* --- Languages --- */
  python: { mark: 'python' },
  // The cup sits under its steam, so the mark is taller than it is wide; a
  // touch of extra size keeps the cup itself as heavy as its neighbours.
  java: { mark: 'java', scale: 1.12 },
  csharp: { mark: 'csharp' },
  fsharp: { mark: 'fsharp' },
  vbnet: { mark: 'dotnet' },
  php: { mark: 'php' },
  ruby: { mark: 'ruby' },
  go: { mark: 'go' },
  rust: { mark: 'rust' },
  c: { mark: 'c' },
  cpp: { mark: 'cplusplus' },
  objectivec: { text: 'OC', colors: ['#438EFF'] },
  swift: { mark: 'swift' },
  kotlin: { mark: 'kotlin' },
  dart: { mark: 'dart' },
  scala: { mark: 'scala' },
  groovy: { mark: 'groovy' },
  clojure: { mark: 'clojure' },
  haskell: { mark: 'haskell' },
  elixir: { mark: 'elixir' },
  // Erlang's logo is its wordmark, and its letters close up at icon size.
  erlang: { text: 'ERL', colors: ['#A90533'] },
  lua: { mark: 'lua' },
  perl: { mark: 'perl' },
  r: { mark: 'r' },
  julia: { mark: 'julia' },
  nim: { mark: 'nim' },
  crystal: { mark: 'crystal' },
  zig: { mark: 'zig' },
  solidity: { mark: 'solidity' },
  assembly: { text: 'ASM', colors: ['#B08B4F'] },

  /* --- Shells --- */
  shell: { mark: 'gnubash' },
  zsh: { mark: 'zsh' },
  fish: { mark: 'fishshell' },
  powershell: { mark: 'powershell' },
  batch: { text: 'BAT', colors: ['#B0B4BC'] },
  vim: { mark: 'vim' },

  /* --- Infrastructure and tooling --- */
  docker: { mark: 'docker' },
  terraform: { mark: 'terraform' },
  jupyter: { mark: 'jupyter' },
  git: { mark: 'git' },
  nginx: { mark: 'nginx' },
  htaccess: { mark: 'apache' },
  robots: { glyph: 'robot', colors: ['#8B93A1'] },
  manifest: { glyph: 'browser', colors: ['#3B82F6'] },
  procfile: { text: 'P', colors: ['#6762A6'] },
  vagrant: { mark: 'vagrant' },
  makefile: { glyph: 'hammer', colors: ['#6D8086'] },
  cmake: { mark: 'cmake' },
  jenkins: { mark: 'jenkins' },
  ci: { text: 'CI', colors: ['#3EAAAF'] },
  gitlabci: { mark: 'gitlab' },
  azure: { mark: 'azure' },

  /* --- JS ecosystem tooling --- */
  npm: { mark: 'npm', text: 'npm', textFill: WHITE, size: 9.6, dy: 0.3 },
  yarnlock: { mark: 'yarn' },
  pnpm: { mark: 'pnpm' },
  eslint: { mark: 'eslint' },
  prettier: { mark: 'prettier' },
  stylelint: { mark: 'stylelint' },
  babel: { mark: 'babel' },
  webpack: { mark: 'webpack' },
  vite: { mark: 'vite' },
  rollup: { mark: 'rollup' },
  jest: { mark: 'jest' },
  tsconfig: { glyph: 'wrench', colors: [TS] },
  jsconfig: { glyph: 'wrench', colors: [JS] },
  browserslist: { glyph: 'browser', colors: ['#FFD539'] },
  editorconfig: { text: 'EC', colors: ['#DCE6E6'] },

  /* --- Documents and generic assets --- */
  text: { glyph: 'lines', colors: ['#94A3B8'] },
  log: { glyph: 'logLines', colors: ['#A8A29E'] },
  license: { glyph: 'seal', colors: ['#C9A227'] },
  changelog: { glyph: 'history', colors: ['#A855F7'] },
  lock: { glyph: 'padlock', colors: ['#94A3B8'] },
  cert: { glyph: 'key', colors: ['#10B981'] },
  diff: { glyph: 'plusMinus', colors: ['#8B5CF6'] },
  binary: { text: '10', colors: ['#8A8580'] },
  image: { glyph: 'picture', colors: ['#26A69A'] },
  font: { glyph: 'typeA', colors: ['#6366F1'] },
  audio: { glyph: 'note', colors: ['#EC4899'] },
  video: { glyph: 'play', colors: ['#38BDF8'] },
  archive: { glyph: 'zip', colors: ['#F59E0B'] },
  // Adobe's mark is not ours to ship, and a PDF badge is its letters anyway.
  pdf: { text: 'PDF', colors: ['#E5252A'] },
  // The Office marks are the app's tile with its initial set over it.
  word: { mark: 'word', text: 'W', textFill: WHITE, size: 15, dy: 0.2 },
  excel: { mark: 'excel', text: 'X', textFill: WHITE, size: 15, dy: 0.2 },
  powerpoint: { mark: 'powerpoint', text: 'P', textFill: WHITE, size: 15, dy: 0.2 },
} satisfies Record<string, FileSpec>;

export const folders = {
  components: { accent: '#C084FC', glyph: 'puzzle' },
  hooks: { accent: '#22D3EE', glyph: 'hook' },
  functions: { accent: '#FBBF24', glyph: 'fx' },
  utils: { accent: '#A3E635', glyph: 'wrench' },
  helpers: { accent: '#34D399', glyph: 'lifebuoy' },
  services: { accent: '#60A5FA', glyph: 'gear' },
  controllers: { accent: '#F472B6', glyph: 'sliders' },
  models: { accent: '#F59E0B', glyph: 'grid' },
  views: { accent: '#38BDF8', glyph: 'eye' },
  layouts: { accent: '#A78BFA', glyph: 'layout' },
  store: { accent: '#FB923C', glyph: 'box' },
  context: { accent: '#67E8F9', glyph: 'atom' },
  middleware: { accent: '#F87171', glyph: 'layers' },
  routes: { accent: '#4ADE80', glyph: 'route' },
  api: { accent: '#7DD3FC', glyph: 'exchange' },
  config: { accent: '#CBD5E1', glyph: 'braces' },
  scripts: { accent: '#FACC15', glyph: 'terminal' },
  tests: { accent: '#86EFAC', glyph: 'flask' },
  mocks: { accent: '#D8B4FE', glyph: 'ghost' },
  assets: { accent: '#F0ABFC', glyph: 'cube' },
  images: { accent: '#2DD4BF', glyph: 'picture' },
  icons: { accent: '#FDE047', glyph: 'star' },
  fonts: { accent: '#818CF8', glyph: 'typeA' },
  styles: { accent: '#F9A8D4', glyph: 'brush' },
  public: { accent: '#5EEAD4', glyph: 'globe' },
  build: { accent: '#94A3B8', glyph: 'hammer' },
  docs: { accent: '#93C5FD', glyph: 'book' },
  database: { accent: '#FBBF24', glyph: 'cylinder' },
  types: { accent: '#60A5FA', glyph: 'tag' },
  constants: { accent: '#FCA5A5', glyph: 'padlock' },
  core: { accent: '#C4B5FD', glyph: 'chip' },
  plugins: { accent: '#A5B4FC', glyph: 'plug' },
  i18n: { accent: '#4ADE80', glyph: 'translate' },
  guards: { accent: '#FCD34D', glyph: 'shieldCheck' },
  validators: { accent: '#6EE7B7', glyph: 'listCheck' },
  docker: { accent: '#38BDF8', mark: 'docker' },
  workflows: { accent: '#C084FC', glyph: 'flow' },
  server: { accent: '#7DD3FC', glyph: 'serverRack' },
  shared: { accent: '#F472B6', glyph: 'share' },
  security: { accent: '#FB7185', glyph: 'shield' },
} satisfies Record<string, FolderSpec>;

/** The icon names the two literals above actually define. */
export type FileIcon = keyof typeof files;
export type FolderIcon = keyof typeof folders;

export type TextRun = { str: string; size: number; track: number };

/** Every distinct (string, size, tracking) that gets set anywhere in the set. */
export function textRuns(): TextRun[] {
  const seen = new Map<string, TextRun>();
  for (const spec of Object.values(files) as FileSpec[]) {
    if (!spec.text) continue;
    const size = sizeFor(spec.text, spec);
    const track = trackFor(spec.text, spec);
    seen.set(textKey(spec.text, size, track), { str: spec.text, size, track });
  }
  return [...seen.values()];
}
