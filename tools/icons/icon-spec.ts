/*
 * What every icon is made of. Shared by build-icons.ts (which draws them) and
 * measure.ts (which measures them), so the two can never disagree about what
 * text is set at what size.
 *
 * An icon is one of three things:
 *
 *   A MARK — the language's or tool's own logo, from tools/icons/marks.ts. It brings
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
import type { FolderRole } from './palette.ts';

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
  /** What the directory is for, which decides the colour its facade is painted (tools/icons/palette.ts). */
  role: FolderRole;
  glyph?: GlyphName;
  mark?: MarkName;
};

/** What `label()` and the measuring pass need to set one string. */
export type LetteringOptions = { size?: number; track?: number };

export const FONT_STACK =
  '"Segoe UI Semibold","Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif';
export const FONT_WEIGHT = 700;

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
const FONT_SIZE_BY_LENGTH: Record<number, number> = { 1: 24, 2: 20, 3: 16, 4: 13 };
const LETTER_SPACING_BY_LENGTH: Record<number, number> = { 1: 0, 2: -0.8, 3: -0.6, 4: -0.4 };

export const fontSizeFor = (str: string, opts: LetteringOptions = {}): number =>
  opts.size || FONT_SIZE_BY_LENGTH[Math.min([...str].length, 4)] || 10.4;
export const letterSpacingFor = (str: string, opts: LetteringOptions = {}): number =>
  opts.track !== undefined ? opts.track : LETTER_SPACING_BY_LENGTH[Math.min([...str].length, 4)] || -0.4;
export const textMetricsKey = (str: string, size: number, track: number): string => `${str}|${size}|${track}`;

const WHITE: Colour = '#FFFFFF';

/* The language colours the file variants inherit. */
const JS: Colour = '#F7DF1E';
const TS: Colour = '#3178C6';
const REACT: Colour = '#61DAFB';
const PYTHON: Colour = '#3776AB';
const PYTHON_YELLOW: Colour = '#FFD43B';
const DOTNET: Colour = '#512BD4';
/* The assistant files' colour, which the rules, the prompts and the agents share. */
const AI: Colour = '#C084FC';

/*
 * Two icons that are the same drawing in the same colour are one icon twice.
 * Until M12 there were four such pairs — a `config.ts` and a `tsconfig.json`
 * were the same TypeScript wrench, a `module.js` and an `.mjs` the same yellow
 * squares, `.scss` and `.sass` the same mark — each built, shipped and
 * audited twice. The associations now point at one of each, and
 * tools/icons/check-icons.ts refuses a new pair.
 */
export const fileIcons = {
  /* --- JavaScript / TypeScript family --- */
  javascript: { mark: 'javascript' },
  typescript: { mark: 'typescript' },
  jsx: { mark: 'react' },
  mjs: { glyph: 'squares', colors: [JS] },

  'javascript-spec': { glyph: 'flask', colors: [JS] },
  'javascript-test': { glyph: 'listCheck', colors: [JS] },
  'javascript-min': { glyph: 'compress', colors: [JS] },

  'typescript-spec': { glyph: 'flask', colors: [TS] },
  'typescript-test': { glyph: 'listCheck', colors: [TS] },
  'typescript-d': { glyph: 'tag', colors: [TS] },
  'typescript-module': { glyph: 'squares', colors: [TS] },
  'typescript-component': { glyph: 'puzzle', colors: [TS] },
  'typescript-service': { glyph: 'gear', colors: [TS] },
  'typescript-stories': { glyph: 'book', colors: [TS] },
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
  // Protocol Buffers has no mark in simple-icons, so this stays lettered.
  protobuf: { text: 'PB', colors: ['#4285F4'] },
  angular: { mark: 'angular' },
  nextjs: { mark: 'nextjs' },
  nuxt: { mark: 'nuxt' },
  bootstrap: { mark: 'bootstrap' },
  tailwind: { mark: 'tailwind' },
  postcss: { mark: 'postcss' },

  /* --- Markup and styles --- */
  html: { mark: 'html5' },
  css: { mark: 'css' },
  // Sass is one brand with two syntaxes, so .scss and .sass are one icon.
  sass: { mark: 'sass' },
  /*
   * Both marks were imported and both were put back as lettering, which is
   * worth recording so nobody imports them a third time. Neither project has a
   * symbol: the official artwork for each IS the logotype, Less's braces around
   * a lowercase word and Stylus's script signature. Rendered at 16px they are a
   * navy smudge and a pale squiggle. The set's rule is that a logo earns its
   * place by surviving that size, and these do not.
   */
  less: { text: 'LESS', colors: ['#1D365D'] },
  stylus: { text: 'ST', colors: ['#333333'] },
  'scss-module': { glyph: 'braces', colors: ['#CC6699'] },
  'css-module': { glyph: 'braces', colors: ['#1572B6'] },

  /* --- Data and config formats --- */
  // JSON's official mark is a pair of braces closed into a ring, and at icon
  // size it is a ring and nothing else — imported, measured, put back. The
  // braces on their own are what say JSON.
  json: { glyph: 'braces', colors: ['#F2C94C'] },
  xml: { glyph: 'angles', colors: ['#005FAD'] },
  yaml: { mark: 'yaml' },
  toml: { mark: 'toml' },
  // No logo exists for either: an INI file is a Windows convention rather than
  // a project, and CSV is a shape rather than a format anyone owns.
  ini: { text: 'INI', colors: ['#7C8794'] },
  env: { mark: 'dotenv' },
  markdown: { mark: 'markdown' },
  mdx: { mark: 'mdx' },
  asciidoc: { mark: 'asciidoctor' },
  latex: { mark: 'latex' },
  csv: { glyph: 'grid', colors: ['#22A06B'] },
  sql: { glyph: 'cylinder', colors: ['#E38C00'] },
  openapi: { mark: 'openapi' },
  swagger: { mark: 'swagger' },

  /* --- Languages --- */
  python: { mark: 'python' },
  // Java used to carry a hand-set scale of 1.12 so the cup under its thin
  // steam weighed as much as its neighbours. The optical sizing in
  // build-icons.ts makes that correction for every mark now, from the
  // measured fill, and the two together pushed the steam off the canvas.
  java: { mark: 'java' },
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
  erlang: { mark: 'erlang' },
  lua: { mark: 'lua' },
  perl: { mark: 'perl' },
  r: { mark: 'r' },
  julia: { mark: 'julia' },
  nim: { mark: 'nim' },
  crystal: { mark: 'crystal' },
  zig: { mark: 'zig' },
  solidity: { mark: 'solidity' },
  // No logo: assembly is not a project, and Objective-C never had a mark of
  // its own beyond Apple's.
  assembly: { text: 'ASM', colors: ['#B08B4F'] },
  elm: { mark: 'elm' },
  fortran: { mark: 'fortran' },
  gleam: { mark: 'gleam' },
  haxe: { mark: 'haxe' },
  nix: { mark: 'nix' },
  ocaml: { mark: 'ocaml' },
  purescript: { mark: 'purescript' },
  racket: { mark: 'racket' },
  webassembly: { mark: 'webassembly' },

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
  /*
   * These four used to be one icon: a lettered "CI" that Travis, CircleCI and
   * anything else with a pipeline all resolved to. Each of them has a mark, and
   * an icon set whose job is to tell fileIcons apart at a glance should not be
   * answering three different services with the same two letters.
   */
  githubactions: { mark: 'githubactions' },
  // Travis's mark is its mascot, drawn in line art that closes up at 16px, so
  // this is a pipeline in the service's own teal instead. CircleCI's mark is a
  // solid dot-and-ring and survives the size, so it keeps its logo.
  travis: { glyph: 'flow', colors: ['#3EAAAF'] },
  circleci: { mark: 'circleci' },
  bitbucket: { mark: 'bitbucket' },
  gitlabci: { mark: 'gitlab' },
  azure: { mark: 'azure' },
  renovate: { mark: 'renovate' },

  /* --- containers, clusters and clouds --- */
  kubernetes: { mark: 'kubernetes' },
  helm: { mark: 'helm' },
  ansible: { mark: 'ansible' },
  packer: { mark: 'packer' },
  pulumi: { mark: 'pulumi' },
  serverless: { mark: 'serverless' },
  netlify: { mark: 'netlify' },
  vercel: { mark: 'vercel' },
  cloudflare: { mark: 'cloudflare' },

  /* --- data stores --- */
  mongodb: { mark: 'mongodb' },
  postgresql: { mark: 'postgresql' },
  // MySQL's mark is its wordmark with a dolphin over it — unreadable small, so
  // this is the database shape in MySQL's teal over the dolphin's orange. It
  // was the wordmark's blue, which made it the same icon as a `.model.ts`.
  mysql: { glyph: 'cylinder', colors: ['#00758F', '#F29111'] },
  redis: { mark: 'redis' },
  sqlite: { mark: 'sqlite' },
  prisma: { mark: 'prisma' },
  firebase: { mark: 'firebase' },

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
  // EditorConfig's mark is a line-art mouse; at 16px it is a faint outline.
  editorconfig: { text: 'EC', colors: ['#DCE6E6'] },

  /* --- runtimes, bundlers and workspaces --- */
  nodejs: { mark: 'nodejs' },
  deno: { mark: 'deno' },
  bun: { mark: 'bun' },
  esbuild: { mark: 'esbuild' },
  turborepo: { mark: 'turborepo' },
  nx: { mark: 'nx' },
  lerna: { mark: 'lerna' },
  // Electron's mark is the atom drawn in hairlines. The M10 audit found it the
  // one mark in the set with no solid pixel at 16px even after the line-art
  // floor lifted its teal — a faint scribble. The atom is what the mark
  // depicts, so this is the pictogram of one, in the brand's own colour.
  electron: { glyph: 'atom', colors: ['#47848F'] },
  tauri: { mark: 'tauri' },
  storybook: { mark: 'storybook' },

  /* --- test runners --- */
  cypress: { mark: 'cypress' },
  vitest: { mark: 'vitest' },
  mocha: { mark: 'mocha' },
  // Playwright has no mark in simple-icons. The test tube rather than the
  // checklist: the checklist is what the validators and the .test files wear,
  // and a runner's config is the apparatus, not the results.
  playwright: { glyph: 'testTube', colors: ['#2EAD33'] },

  /* --- other ecosystems' package managers --- */
  gradle: { mark: 'gradle' },
  maven: { mark: 'maven' },
  nuget: { mark: 'nuget' },
  // Composer's mark is a line-art figure; the parcel says the same thing and
  // survives 16px. Its files used to resolve to PHP's elephant, which said
  // which language it was and nothing about what the file did — so it is the
  // variant grammar: the parcel says package, PHP's violet says whose. It was
  // Composer's brown, 13 ΔE from the generic package's orange.
  composer: { glyph: 'package', colors: ['#777BB4'] },
  poetry: { mark: 'poetry' },
  conda: { mark: 'anaconda' },

  /* --- frameworks outside the JS world --- */
  django: { mark: 'django' },
  laravel: { mark: 'laravel' },
  spring: { mark: 'spring' },
  flutter: { mark: 'flutter' },

  /* --- Documents and generic assets --- */
  text: { glyph: 'lines', colors: ['#94A3B8'] },
  log: { glyph: 'logLines', colors: ['#A8A29E'] },
  license: { glyph: 'certificate', colors: ['#C9A227'] },
  changelog: { glyph: 'history', colors: ['#A855F7'] },
  lock: { glyph: 'padlock', colors: ['#94A3B8'] },
  cert: { glyph: 'key', colors: ['#10B981'] },
  diff: { glyph: 'gitDiff', colors: ['#8B5CF6'] },
  binary: { glyph: 'binary', colors: ['#8A8580'] },
  image: { glyph: 'picture', colors: ['#26A69A'] },
  font: { glyph: 'typeA', colors: ['#6366F1'] },
  audio: { glyph: 'musicNote', colors: ['#EC4899'] },
  video: { glyph: 'film', colors: ['#38BDF8'] },
  archive: { glyph: 'zip', colors: ['#F59E0B'] },
  // Adobe's mark is not ours to ship, and a PDF badge is its letters anyway.
  pdf: { text: 'PDF', colors: ['#E5252A'] },

  /* ---------------------------------------------------------------- *
   * The formats an icon set does not usually reach.
   *
   * Every one of these used to fall through to the plain-text page, which is
   * the icon that means "no idea". They are not what most repositories hold —
   * a calendar export, a packet capture, a saved game, a CAD sketch — and that
   * is precisely why they were missing: a set grows around the files its author
   * happens to open. None of them has a logo to import, so each is one of our
   * own pictograms in a colour picked to sit apart from its neighbours in a
   * file list.
   * ---------------------------------------------------------------- */
  email: { glyph: 'envelope', colors: ['#7FA8D4'] },
  calendar: { glyph: 'calendar', colors: ['#E0574A'] },
  contact: { glyph: 'contactCard', colors: ['#4EA1D3'] },
  geo: { glyph: 'mapPin', colors: ['#34A853'] },
  vector: { glyph: 'vectorPen', colors: ['#FF8A3D'] },
  model3d: { glyph: 'mesh', colors: ['#9B7BD4'] },
  subtitle: { glyph: 'subtitle', colors: ['#8FB8DE'] },
  ebook: { glyph: 'ebook', colors: ['#C08457'] },
  diskimage: { glyph: 'disk', colors: ['#A0AEC0'] },
  shortcut: { glyph: 'link', colors: ['#8AB4F8'] },
  debug: { glyph: 'bug', colors: ['#E06C75'] },
  dataset: { glyph: 'scatter', colors: ['#4FD1C5'] },
  // Blue, not the orange it was: MATLAB is the same glyph in MathWorks' orange,
  // and the two were 15 ΔE apart.
  math: { glyph: 'math', colors: ['#7FB2F0'] },
  capture: { glyph: 'network', colors: ['#6EC1E4'] },
  game: { glyph: 'gamepad', colors: ['#A78BFA'] },
  torrent: { glyph: 'magnet', colors: ['#5C7CFA'] },
  raw: { glyph: 'camera', colors: ['#D9822B'] },
  package: { glyph: 'package', colors: ['#C2712F'] },
  temp: { glyph: 'trash', colors: ['#78716C'] },
  // Assistant rules and prompt fileIcons, which are recent enough that no
  // convention has settled on a shape for them yet.
  ai: { glyph: 'sparkle', colors: ['#C084FC'] },

  /* --- formats from outside the web stack, with marks of their own --- */
  arduino: { mark: 'arduino' },
  blender: { mark: 'blender' },
  figma: { mark: 'figma' },
  godot: { mark: 'godot' },
  qt: { mark: 'qt' },
  unity: { mark: 'unity' },
  // The Office marks are the app's tile with its initial set over it.
  word: { mark: 'word', text: 'W', textFill: WHITE, size: 15, dy: 0.2 },
  excel: { mark: 'excel', text: 'X', textFill: WHITE, size: 15, dy: 0.2 },
  powerpoint: { mark: 'powerpoint', text: 'P', textFill: WHITE, size: 15, dy: 0.2 },

  /* ---------------------------------------------------------------- *
   * V4: the rest of the file system.
   *
   * The set has always grown around the files its author opens, and the
   * previous pass admitted that about calendars and packet captures. This one
   * goes further out: the languages nobody starts a new project in but plenty
   * of people maintain, the hardware and scientific formats, the dozen small
   * files a repository keeps in its root that are not source and not
   * documentation either.
   *
   * The test each of these had to pass is the same one as everywhere else: is
   * there a DIFFERENT thing to say about this file than the icon it currently
   * falls through to says? A COBOL source and a Prolog source both used to be
   * the plain-text page, and neither of them is plain text.
   * ---------------------------------------------------------------- */

  /* --- languages a set usually stops before --- */
  cobol: { text: 'CBL', colors: ['#005CA5'] },
  pascal: { text: 'PAS', colors: ['#E3F171'] },
  ada: { text: 'ADA', colors: ['#02F88C'] },
  tcl: { text: 'TCL', colors: ['#C3B091'] },
  abap: { text: 'ABAP', colors: ['#0FAAFF'] },
  // The Lisps are the one family whose SYNTAX is the logo: everything else here
  // is named after what the file does, and this is named after how it looks.
  lisp: { glyph: 'parens', colors: ['#9A5BA0'] },
  scheme: { glyph: 'parens', colors: ['#3E8EE8'] },
  // Prolog was the brain, which is what a model file is; a logic language with
  // no logo is lettered, as its contemporaries above are.
  prolog: { text: 'PRO', colors: ['#C05A5A'] },
  // sed and awk are not languages anyone ships a logo for; they are the shell.
  awk: { glyph: 'terminal', colors: ['#A3B18A'] },
  applescript: { glyph: 'command', colors: ['#A0AEC0'] },
  // AutoHotkey's green H, not the blue it was: the keymap is the same keyboard
  // in grey, and the two were 10 ΔE apart.
  autohotkey: { glyph: 'keyboard', colors: ['#58A55C'] },

  /* --- hardware, graphics and science --- */
  // Verilog and VHDL describe circuits rather than programs, and they are told
  // apart here the way the rest of the set tells two roles apart: same shape,
  // different colour.
  verilog: { glyph: 'circuit', colors: ['#4CC38A'] },
  vhdl: { glyph: 'circuit', colors: ['#6B8EE8'] },
  // A waveform dump is the OUTPUT of the two above — the signal, not the design.
  waveform: { glyph: 'wave', colors: ['#B48EE8'] },
  pcb: { glyph: 'circuit', colors: ['#D98E3A'] },
  shader: { glyph: 'gpu', colors: ['#F06A38'] },
  cuda: { glyph: 'gpu', colors: ['#76B900'] },
  matlab: { glyph: 'math', colors: ['#E16737'] },
  statistics: { glyph: 'scatter', colors: ['#3B82F6'] },
  // Weights and traced graphs — .onnx, .pt, .safetensors, .gguf. Not datasets:
  // a dataset is rows, and a model is what was learned from them.
  mlmodel: { glyph: 'brain', colors: ['#EE7752'] },
  cad: { glyph: 'compass', colors: ['#C77D3E'] },
  gcode: { glyph: 'printer', colors: ['#5FC0A0'] },

  /* --- templating dialects with no mark of their own --- */
  liquid: { glyph: 'drop', colors: ['#4CA4DB'] },
  // Jinja has a mark; it was the braces in its red until M12, which at 16px
  // was the Sass module's braces in a neighbouring pink.
  jinja: { mark: 'jinja' },

  /* --- the small files in a repository's root --- */
  http: { glyph: 'send', colors: ['#4FB8AC'] },
  sitemap: { glyph: 'treeStructure', colors: ['#5B8DEF'] },
  feed: { glyph: 'rss', colors: ['#F26522'] },
  sourcemap: { glyph: 'mapFold', colors: ['#7C8DB5'] },
  keymap: { glyph: 'keyboard', colors: ['#9CA3AF'] },
  colortheme: { glyph: 'palette', colors: ['#C084FC'] },
  diagram: { glyph: 'diagram', colors: ['#6BA8F5'] },
  design: { glyph: 'shapes', colors: ['#F06292'] },
  schedule: { glyph: 'timer', colors: ['#8B9DC3'] },
  unitfile: { glyph: 'gearFine', colors: ['#A3A3A3'] },
  hosts: { glyph: 'addressBook', colors: ['#77A0C7'] },
  // Not the same file as a certificate: a certificate is public by design and
  // these are the ones that must never be committed.
  secrets: { glyph: 'fingerprint', colors: ['#E0A458'] },
  codeowners: { glyph: 'users', colors: ['#8AB4F8'] },
  securitypolicy: { glyph: 'shieldWarning', colors: ['#F87171'] },
  issuetemplate: { glyph: 'chat', colors: ['#A78BFA'] },
  prtemplate: { glyph: 'gitPullRequest', colors: ['#7EE787'] },
  commitconfig: { glyph: 'gitCommit', colors: ['#7FB3D5'] },
  husky: { glyph: 'dog', colors: ['#F0C674'] },
  devcontainer: { glyph: 'container', colors: ['#4FC3F7'] },
  workspace: { glyph: 'folders', colors: ['#B39DDB'] },
  notice: { glyph: 'scroll', colors: ['#D6C08A'] },
  backup: { glyph: 'floppy', colors: ['#94A3B8'] },
  cloudconfig: { glyph: 'cloud', colors: ['#8ECAE6'] },

  /* --- creative project files, which are not their exports --- */
  audioproject: { glyph: 'waveform', colors: ['#F472B6'] },
  videoproject: { glyph: 'clapper', colors: ['#A5B4FC'] },
  bi: { glyph: 'pie', colors: ['#F2C811'] },

  /* --- formats from outside the web stack, with marks of their own --- */
  // Adobe's marks are not in simple-icons — the project drops trademarks whose
  // owners ask it to — so a Photoshop document is `design` like the rest of the
  // layered-artwork formats, and an .ai file keeps the vector pen.
  xcode: { mark: 'xcode' },
  postman: { mark: 'postman' },
  grafana: { mark: 'grafana' },
  prometheus: { mark: 'prometheus' },
  sentry: { mark: 'sentry' },
  sonarqube: { mark: 'sonarqube' },
  bazel: { mark: 'bazel' },
  unreal: { mark: 'unreal' },
  cocoapods: { mark: 'cocoapods' },
  homebrew: { mark: 'homebrew' },
  vault: { mark: 'vault' },

  /* ---------------------------------------------------------------- *
   * M12: what the coverage audit found.
   *
   * `npm run audit:coverage` resolves the file names of 47 real repositories
   * the way VS Code does and ranks what falls through by how many of them it
   * turns up in. An icon was added only where the file says something the
   * icon it reached did not — and where the answer was an icon the set
   * already had, the file was pointed at that instead (tools/icons/build-theme.ts).
   * The count after each is the repositories it was found in.
   * ---------------------------------------------------------------- */

  /* --- tools with a mark, whose files reached only YAML, TOML or the page --- */
  dependabot: { mark: 'dependabot' }, // dependabot.yml: 27
  pytest: { mark: 'pytest' }, // conftest.py, pytest.ini: 14
  llvm: { mark: 'llvm' }, // .clang-format, .clang-tidy, .clangd: 13
  precommit: { mark: 'precommit' }, // .pre-commit-config.yaml: 10
  codecov: { mark: 'codecov' }, // codecov.yml: 7
  ruff: { mark: 'ruff' }, // ruff.toml: 7
  uv: { mark: 'uv' }, // uv.lock, uv.toml: 7
  // HCL is HashiCorp's language before it is Terraform's: docker-bake.hcl,
  // Nomad jobs and Vault policies are all written in it. 3, with 776 files.
  hcl: { mark: 'hashicorp' },

  /*
   * --- assistant files, told apart by what they do ---
   *
   * Every assistant file was the one sparkle, and a .github folder now holds
   * three kinds of them side by side — instructions the model always reads,
   * prompts a person runs, and agents it can hand work to — besides the MCP
   * configuration that connects it to tools. VS Code gives each its own
   * language. The sparkle stays with the rules and skills; the other three
   * are the variant grammar the TypeScript files use: the assistants' violet
   * says which family, the pictogram says what the file does. MCP has a mark.
   */
  'ai-agent': { glyph: 'headCircuit', colors: [AI] }, // .agent.md, .claude/agents: 5
  'ai-prompt': { glyph: 'lightning', colors: [AI] }, // .prompt.md: 3
  mcp: { mark: 'mcp' }, // mcp.json, .mcp.json: 11

  /* --- .NET: the project is the build, told apart by language --- */
  // The Razor view engine's files — Blazor components and MVC views alike —
  // resolved to the page. Razor has no mark; its syntax is the @. 3, with 1620.
  razor: { glyph: 'at', colors: [DOTNET] },
  // A project file is what builds the code beside it, so it is the hammer the
  // Makefile is, in .NET's violet. It was going to be one per language, in C#'s
  // and F#'s colours; at 16px those hammers were the Makefile's and each
  // other's. They reached the XML angles. 6, with 5980 .csproj.
  msbuild: { glyph: 'hammer', colors: [DOTNET] },

  /* --- Python's tooling, as tsconfig is TypeScript's --- */
  // setup.cfg, tox.ini, mypy.ini, .flake8, .pylintrc, .coveragerc: 9
  // Python's blue and yellow, the wrench and its surface: in the blue alone it
  // was tsconfig's wrench, 2 apart at 16px.
  'python-config': { glyph: 'wrench', colors: [PYTHON, PYTHON_YELLOW] },

  /* --- formats with no mark that reached the page --- */
  // reStructuredText, the documentation of half the Python world. 16, with 6914.
  restructuredtext: { text: 'RST', colors: ['#5FB3A1'] },
  // Recorded output a test compares against: Jest and insta snapshots, golden
  // files. .snap used to be a Snapcraft package, which no repository in the
  // corpus held; it was 11,750 snapshots in 14 of them.
  snapshot: { glyph: 'aperture', colors: ['#7BC96F'] },
  // A file made to be copied and filled in: .tpl, .tmpl, .template, .example,
  // .sample, .dist. 18 and 23.
  template: { glyph: 'stamp', colors: ['#C9A66B'] },
  // gettext catalogues, XLIFF and Apple's .strings. 6.
  translation: { glyph: 'translate', colors: ['#58A6FF'] },
  // The hardware of a board, described to the kernel. One repository, with
  // 13,853 files — it is what Zephyr and Linux describe every board in.
  devicetree: { glyph: 'cpu', colors: ['#4FB3C8'] },
} satisfies Record<string, FileSpec>;

/*
 * Folders, by role (M11). The role is the colour and says what part of the
 * project the directory is; the pictogram tells the directories of one role
 * apart. The roles and their colours are in tools/icons/palette.ts.
 */
export const folderIcons = {
  /* --- interface: what the user sees --- */
  components: { role: 'interface', glyph: 'puzzleSolid' },
  views: { role: 'interface', glyph: 'eyeSolid' },
  layouts: { role: 'interface', glyph: 'layoutSolid' },
  styles: { role: 'interface', glyph: 'brushSolid' },
  themes: { role: 'interface', glyph: 'dropSolid' },
  design: { role: 'interface', glyph: 'penNibSolid' },

  /* --- content: the material the project ships --- */
  assets: { role: 'content', glyph: 'diamondSolid' },
  images: { role: 'content', glyph: 'pictureSolid' },
  media: { role: 'content', glyph: 'playSolid' },
  audio: { role: 'content', glyph: 'musicNoteSolid' },
  icons: { role: 'content', glyph: 'starSolid' },
  fonts: { role: 'content', glyph: 'letterT' },
  public: { role: 'content', glyph: 'browserSolid' },
  docs: { role: 'content', glyph: 'bookSolid' },
  i18n: { role: 'content', glyph: 'globeSolid' },

  /* --- logic: the code that computes --- */
  functions: { role: 'logic', glyph: 'fx' },
  utils: { role: 'logic', glyph: 'wrenchSolid' },
  helpers: { role: 'logic', glyph: 'lifebuoySolid' },
  hooks: { role: 'logic', glyph: 'anchorSolid' },
  core: { role: 'logic', glyph: 'chipSolid' },
  shared: { role: 'logic', glyph: 'shareSolid' },
  plugins: { role: 'logic', glyph: 'plugSolid' },
  packages: { role: 'logic', glyph: 'packageSolid' },

  /* --- data: what the code holds --- */
  models: { role: 'data', glyph: 'tableSolid' },
  store: { role: 'data', glyph: 'vaultSolid' },
  context: { role: 'data', glyph: 'circlesSolid' },
  database: { role: 'data', glyph: 'cylinderSolid' },
  schemas: { role: 'data', glyph: 'treeStructureSolid' },
  types: { role: 'data', glyph: 'tagSolid' },
  constants: { role: 'data', glyph: 'pi' },

  /* --- network: what answers a request --- */
  services: { role: 'network', glyph: 'gearSolid' },
  controllers: { role: 'network', glyph: 'slidersSolid' },
  middleware: { role: 'network', glyph: 'funnelSolid' },
  routes: { role: 'network', glyph: 'signpostSolid' },
  api: { role: 'network', glyph: 'exchangeBold' },
  server: { role: 'network', glyph: 'serverRackSolid' },
  jobs: { role: 'network', glyph: 'hourglassSolid' },

  /* --- quality: what proves it works --- */
  tests: { role: 'quality', glyph: 'flaskSolid' },
  mocks: { role: 'quality', glyph: 'ghostSolid' },
  validators: { role: 'quality', glyph: 'checkCircleSolid' },
  benchmarks: { role: 'quality', glyph: 'lightningSolid' },

  /* --- security: what keeps it closed --- */
  security: { role: 'security', glyph: 'lockKeySolid' },
  guards: { role: 'security', glyph: 'shieldCheckSolid' },
  keys: { role: 'security', glyph: 'keySolid' },

  /* --- tooling: the scaffolding round the project --- */
  config: { role: 'tooling', glyph: 'braces' },
  scripts: { role: 'tooling', glyph: 'prompt' },
  build: { role: 'tooling', glyph: 'hammerSolid' },
  docker: { role: 'tooling', mark: 'docker' },
  workflows: { role: 'tooling', glyph: 'forkBold' },
  // Assistant rules, prompts and the .claude / .cursor directories: they
  // configure a tool, as .github configures CI, so they are tooling.
  ai: { role: 'tooling', glyph: 'sparkleSolid' },

  /* --- dormant: what nobody means to open --- */
  logs: { role: 'dormant', glyph: 'rowsSolid' },
  temp: { role: 'dormant', glyph: 'trashSolid' },
  archive: { role: 'dormant', glyph: 'archiveSolid' },
} satisfies Record<string, FolderSpec>;

/** The icon names the two literals above actually define. */
export type FileIcon = keyof typeof fileIcons;
export type FolderIcon = keyof typeof folderIcons;

export type LetteringRun = { str: string; size: number; track: number };

/** Every distinct (string, size, tracking) that gets set anywhere in the set. */
export function letteringRuns(): LetteringRun[] {
  const seen = new Map<string, LetteringRun>();
  for (const spec of Object.values(fileIcons) as FileSpec[]) {
    if (!spec.text) continue;
    const size = fontSizeFor(spec.text, spec);
    const track = letterSpacingFor(spec.text, spec);
    seen.set(textMetricsKey(spec.text, size, track), { str: spec.text, size, track });
  }
  return [...seen.values()];
}
