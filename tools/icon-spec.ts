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

export const fileIcons = {
  /* --- JavaScript / TypeScript family --- */
  javascript: { mark: 'javascript' },
  typescript: { mark: 'typescript' },
  jsx: { mark: 'react' },
  mjs: { glyph: 'squares', colors: [JS] },

  'javascript-spec': { glyph: 'flask', colors: [JS] },
  'javascript-test': { glyph: 'listCheck', colors: [JS] },
  'javascript-config': { glyph: 'wrench', colors: [JS] },
  'javascript-min': { glyph: 'compress', colors: [JS] },
  'javascript-module': { glyph: 'squares', colors: [JS] },

  'typescript-spec': { glyph: 'flask', colors: [TS] },
  'typescript-test': { glyph: 'listCheck', colors: [TS] },
  'typescript-d': { glyph: 'tag', colors: [TS] },
  'typescript-module': { glyph: 'squares', colors: [TS] },
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
  // Sass is one brand with two syntaxes, so .scss and .sass carry one mark.
  scss: { mark: 'sass' },
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
  // this is the database shape in MySQL's blue.
  mysql: { glyph: 'cylinder', colors: ['#4479A1'] },
  redis: { mark: 'redis' },
  sqlite: { mark: 'sqlite' },
  prisma: { mark: 'prisma' },
  firebase: { mark: 'firebase' },
  supabase: { mark: 'supabase' },

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
  electron: { mark: 'electron' },
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
  // survives 16px. Its fileIcons used to resolve to PHP's elephant, which said
  // which language it was and nothing about what the file did.
  composer: { glyph: 'package', colors: ['#885630'] },
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
  math: { glyph: 'math', colors: ['#F2A65A'] },
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
  scheme: { glyph: 'parens', colors: ['#4E7EDB'] },
  prolog: { glyph: 'brain', colors: ['#C05A5A'] },
  // sed and awk are not languages anyone ships a logo for; they are the shell.
  awk: { glyph: 'terminal', colors: ['#A3B18A'] },
  applescript: { glyph: 'command', colors: ['#A0AEC0'] },
  autohotkey: { glyph: 'keyboard', colors: ['#5C9ACF'] },

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
  jinja: { glyph: 'braces', colors: ['#B41717'] },

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
  hosts: { glyph: 'network', colors: ['#77A0C7'] },
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
} satisfies Record<string, FileSpec>;

export const folderIcons = {
  components: { accent: '#C084FC', glyph: 'puzzle' },
  hooks: { accent: '#22D3EE', glyph: 'anchor' },
  functions: { accent: '#FBBF24', glyph: 'fx' },
  utils: { accent: '#A3E635', glyph: 'wrench' },
  helpers: { accent: '#34D399', glyph: 'lifebuoy' },
  services: { accent: '#60A5FA', glyph: 'gear' },
  controllers: { accent: '#F472B6', glyph: 'sliders' },
  models: { accent: '#F59E0B', glyph: 'grid' },
  views: { accent: '#38BDF8', glyph: 'eye' },
  layouts: { accent: '#A78BFA', glyph: 'layout' },
  store: { accent: '#FB923C', glyph: 'archiveTray' },
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
  media: { accent: '#F9A8D4', glyph: 'film' },
  icons: { accent: '#FDE047', glyph: 'star' },
  fonts: { accent: '#818CF8', glyph: 'typeA' },
  styles: { accent: '#F9A8D4', glyph: 'brush' },
  public: { accent: '#5EEAD4', glyph: 'globe' },
  build: { accent: '#94A3B8', glyph: 'hammer' },
  docs: { accent: '#93C5FD', glyph: 'books' },
  database: { accent: '#FBBF24', glyph: 'cylinder' },
  types: { accent: '#60A5FA', glyph: 'tag' },
  constants: { accent: '#FCA5A5', glyph: 'lockSimple' },
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

  /* --- V4: the directories a repository grows that the set never named --- */
  logs: { accent: '#A8A29E', glyph: 'logLines' },
  temp: { accent: '#78716C', glyph: 'trash' },
  archive: { accent: '#B7A98B', glyph: 'archiveTray' },
  packages: { accent: '#DDA15E', glyph: 'folders' },
  schemas: { accent: '#7DD3FC', glyph: 'treeStructure' },
  themes: { accent: '#E879F9', glyph: 'palette' },
  keys: { accent: '#FDE68A', glyph: 'key' },
  benchmarks: { accent: '#FDBA74', glyph: 'speedometer' },
  jobs: { accent: '#93C5FD', glyph: 'timer' },
  design: { accent: '#F0ABFC', glyph: 'shapes' },
  audio: { accent: '#F9A8D4', glyph: 'musicNote' },
  // Assistant rules, prompts and the .claude / .cursor directories — a folder
  // that did not exist when this set was started.
  ai: { accent: '#C4B5FD', glyph: 'sparkle' },
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
