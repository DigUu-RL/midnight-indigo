'use strict';

/*
 * What every icon is made of: the tile colour, and either a glyph from
 * tools/glyphs.js or an acronym. Shared by build-icons.js (which draws them)
 * and measure.js (which measures them), so the two can never disagree about
 * what text is set at what size.
 */

const FONT =
  '"Segoe UI Semibold","Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif';
const WEIGHT = 700;

// Acronyms are the weak spot of any icon set, so they take as much of the tile
// as the character count allows, set tight and heavy.
const TEXT_SIZE = { 1: 19, 2: 15, 3: 11.4, 4: 8.8 };
const TEXT_TRACK = { 1: 0, 2: -0.7, 3: -0.5, 4: -0.35 };

const sizeFor = (str, opts = {}) => opts.size || TEXT_SIZE[Math.min([...str].length, 4)] || 8.8;
const trackFor = (str, opts = {}) =>
  opts.track !== undefined ? opts.track : TEXT_TRACK[Math.min([...str].length, 4)] || -0.35;
const textKey = (str, size, track) => `${str}|${size}|${track}`;

const LIGHT = '#FFFFFF';

const TS = '#3178C6';
const JS = '#F7DF1E'; // the official JavaScript yellow
const REACT = '#61DAFB';

const files = {
  /* --- JavaScript / TypeScript family --- */
  javascript: { bg: JS, text: 'JS' },
  typescript: { bg: TS, text: 'TS' },
  jsx: { bg: REACT, glyph: 'atom' },
  mjs: { bg: JS, glyph: 'cubes' },

  'javascript-spec': { bg: JS, glyph: 'flask' },
  'javascript-test': { bg: JS, glyph: 'listCheck' },
  'javascript-config': { bg: JS, glyph: 'wrench' },
  'javascript-min': { bg: JS, glyph: 'compress' },
  'javascript-module': { bg: JS, glyph: 'cubes' },

  'typescript-spec': { bg: TS, glyph: 'flask' },
  'typescript-test': { bg: TS, glyph: 'listCheck' },
  'typescript-d': { bg: TS, glyph: 'tag' },
  'typescript-module': { bg: TS, glyph: 'cubes' },
  'typescript-component': { bg: TS, glyph: 'puzzle' },
  'typescript-service': { bg: TS, glyph: 'gear' },
  'typescript-stories': { bg: TS, glyph: 'book' },
  'typescript-config': { bg: TS, glyph: 'wrench' },
  'typescript-guard': { bg: TS, glyph: 'shield' },
  'typescript-pipe': { bg: TS, glyph: 'funnel' },
  'typescript-directive': { bg: TS, glyph: 'wand' },
  'typescript-controller': { bg: TS, glyph: 'sliders' },
  'typescript-model': { bg: TS, glyph: 'cylinder' },
  'typescript-dto': { bg: TS, glyph: 'exchange' },
  'typescript-entity': { bg: TS, glyph: 'grid' },

  'jsx-spec': { bg: REACT, glyph: 'flask' },
  'jsx-test': { bg: REACT, glyph: 'listCheck' },
  'jsx-stories': { bg: REACT, glyph: 'book' },
  'jsx-component': { bg: REACT, glyph: 'puzzle' },

  /* --- Web frameworks and templating --- */
  vue: { bg: '#35495E', glyph: 'vue', fg: '#41B883' },
  svelte: { bg: '#FF3E00', text: 'S', fg: LIGHT },
  astro: { bg: '#FF5D01', text: 'A' },
  coffeescript: { bg: '#6F4E37', glyph: 'mug' },
  // The Handlebars moustache turns to two blobs at 16px; its own {{ }} reads.
  handlebars: { bg: '#F0772B', glyph: 'braces' },
  pug: { bg: '#A86454', text: 'PUG', fg: LIGHT },
  ejs: { bg: '#B4CA65', text: 'EJS' },
  twig: { bg: '#78C043', glyph: 'leaf' },
  graphql: { bg: '#E10098', glyph: 'graphql' },
  protobuf: { bg: '#4285F4', text: 'PB', fg: LIGHT },

  /* --- Markup and styles --- */
  // The only two icons that put a real badge on a dark tile rather than a glyph
  // on a brand-coloured one: the HTML5 and CSS3 marks are two-tone shields, and
  // flattening them to one colour is what made them look like blank crests.
  // Drawn larger than the standard glyph scale: the badge IS the icon here, so
  // it fills the tile rather than floating in it.
  html: { bg: '#2B1610', glyph: 'crest', fg: '#E34F26', extra: '#F06529', scale: 0.9, text: '5', textFill: LIGHT, size: 14, dy: 1.5 },
  css: { bg: '#0E2437', glyph: 'crest', fg: '#1572B6', extra: '#33A9DC', scale: 0.9, text: '3', textFill: LIGHT, size: 14, dy: 1.5 },
  scss: { bg: '#CD6799', text: 'S', fg: LIGHT },
  sass: { bg: '#8E4A6C', text: 'SASS', fg: LIGHT },
  less: { bg: '#1D365D', text: 'L' },
  stylus: { bg: '#FF6347', text: 'ST' },
  'scss-module': { bg: '#CD6799', glyph: 'braces', fg: LIGHT },
  'css-module': { bg: '#1572B6', glyph: 'braces', fg: LIGHT },

  /* --- Data and config formats --- */
  json: { bg: '#F2C94C', glyph: 'braces' },
  xml: { bg: '#F97316', glyph: 'angles' },
  yaml: { bg: '#E11D48', text: 'YML', fg: LIGHT },
  toml: { bg: '#9C4221', text: 'TOML', fg: LIGHT },
  ini: { bg: '#7C8794', text: 'INI', fg: LIGHT },
  env: { bg: '#ECD53F', text: 'ENV' },
  markdown: { bg: '#E8E6F3', text: 'MD' },
  mdx: { bg: '#FCB32C', text: 'MDX' },
  csv: { bg: '#22A06B', glyph: 'grid', fg: LIGHT },
  sql: { bg: '#E38C00', glyph: 'cylinder' },

  /* --- Languages --- */
  python: { bg: '#2B5F8E', glyph: 'python', fg: '#FFD43B', hole: '#2B5F8E', extra: '#F5FAFF' },
  java: { bg: '#E76F00', glyph: 'cup', fg: LIGHT },
  csharp: { bg: '#9B4F96', text: 'C#', fg: LIGHT },
  fsharp: { bg: '#378BBA', text: 'F#', fg: LIGHT },
  vbnet: { bg: '#512BD4', text: 'VB', fg: LIGHT },
  php: { bg: '#777BB4', text: 'php', fg: LIGHT },
  ruby: { bg: '#CC342D', glyph: 'gem', fg: LIGHT },
  go: { bg: '#00ADD8', text: 'GO', fg: LIGHT },
  rust: { bg: '#B7410E', glyph: 'gearRing', fg: LIGHT },
  c: { bg: '#A8B9CC', text: 'C' },
  cpp: { bg: '#00599C', text: 'C++', fg: LIGHT },
  objectivec: { bg: '#438EFF', text: 'OC', fg: LIGHT },
  swift: { bg: '#F05138', glyph: 'swift', fg: LIGHT },
  kotlin: { bg: '#241C3A', glyph: 'kotlin', fg: '#7F52FF', extra: '#E44857' },
  dart: { bg: '#0175C2', text: 'D', fg: LIGHT },
  scala: { bg: '#DE3423', text: 'SC', fg: LIGHT },
  groovy: { bg: '#4298B8', text: 'GR', fg: LIGHT },
  clojure: { bg: '#5881D8', text: 'CLJ', fg: LIGHT },
  haskell: { bg: '#5E5086', text: 'λ', fg: LIGHT, size: 20 },
  elixir: { bg: '#4B275F', glyph: 'drop', fg: LIGHT },
  erlang: { bg: '#A90533', text: 'ER', fg: LIGHT },
  lua: { bg: '#00007B', glyph: 'lua', fg: LIGHT },
  perl: { bg: '#39457E', text: 'PL', fg: LIGHT },
  r: { bg: '#276DC3', text: 'R', fg: LIGHT },
  julia: { bg: '#2B2340', glyph: 'julia', extra: ['#CB3C33', '#389826', '#9558B2'] },
  nim: { bg: '#FFE953', glyph: 'crown' },
  // Neither language has a mark that survives being drawn at 16px — the Crystal
  // shard and the Solidity rhombus stack both collapse into noise — so both use
  // the acronym, which is what the rest of the no-logo languages do anyway.
  crystal: { bg: '#1F2430', text: 'CR', fg: LIGHT },
  zig: { bg: '#F7A41D', text: 'Z' },
  solidity: { bg: '#2E3A4F', text: 'SOL', fg: LIGHT },
  assembly: { bg: '#7A5B2E', text: 'ASM', fg: LIGHT },

  /* --- Shells --- */
  shell: { bg: '#4EAA25', glyph: 'prompt', fg: LIGHT },
  zsh: { bg: '#3D3D46', text: 'zsh', fg: LIGHT },
  fish: { bg: '#3B8C3B', glyph: 'fish', fg: LIGHT },
  powershell: { bg: '#0B2E63', glyph: 'prompt', fg: LIGHT },
  batch: { bg: '#B0B4BC', text: 'BAT' },
  vim: { bg: '#019833', text: 'V', fg: LIGHT },

  /* --- Infrastructure and tooling --- */
  docker: { bg: '#2496ED', glyph: 'whale', fg: LIGHT },
  terraform: { bg: '#7B42BC', glyph: 'terraform', fg: LIGHT },
  jupyter: { bg: '#F37726', glyph: 'jupyter', fg: LIGHT },
  git: { bg: '#F05033', glyph: 'git', fg: LIGHT, hole: '#F05033' },
  nginx: { bg: '#009639', text: 'N', fg: LIGHT },
  htaccess: { bg: '#D22128', glyph: 'feather', fg: LIGHT },
  robots: { bg: '#4B5563', glyph: 'robot', fg: LIGHT },
  manifest: { bg: '#3B82F6', glyph: 'browser', fg: LIGHT },
  procfile: { bg: '#6762A6', text: 'P', fg: LIGHT },
  vagrant: { bg: '#1868F2', text: 'V', fg: LIGHT },
  makefile: { bg: '#6D8086', glyph: 'hammer', fg: LIGHT },
  cmake: { bg: '#10233A', glyph: 'cmake', extra: ['#00A94F', '#3D7EBB', '#E1231A'] },
  jenkins: { bg: '#D33833', glyph: 'butler', fg: LIGHT },
  ci: { bg: '#3EAAAF', text: 'CI', fg: LIGHT },
  gitlabci: { bg: '#35243B', glyph: 'gitlab', extra: ['#E24329', '#FC6D26', '#FCA326'] },
  azure: { bg: '#0078D4', glyph: 'azure', fg: LIGHT },

  /* --- JS ecosystem tooling --- */
  npm: { bg: '#CB3837', text: 'npm', fg: LIGHT },
  yarnlock: { bg: '#2C8EBB', glyph: 'yarn', fg: LIGHT },
  pnpm: { bg: '#F9AD00', glyph: 'grid9' },
  eslint: { bg: '#4B32C3', glyph: 'hexFrame', fg: LIGHT },
  prettier: { bg: '#1A2B34', glyph: 'prettierBars', extra: ['#F7B93E', '#EA5E5E', '#56B3B4', '#BF85BF', '#E8EEF2'] },
  stylelint: { bg: '#2A2A35', text: 'SL', fg: LIGHT },
  babel: { bg: '#F5DA55', text: 'B' },
  webpack: { bg: '#1C78C0', glyph: 'webpackCube', fg: LIGHT },
  vite: { bg: '#646CFF', glyph: 'bolt', fg: '#FFD62E' },
  rollup: { bg: '#EF3335', glyph: 'refresh', fg: LIGHT },
  jest: { bg: '#C21325', glyph: 'wizardHat', fg: LIGHT },
  tsconfig: { bg: TS, glyph: 'wrench' },
  jsconfig: { bg: JS, glyph: 'wrench' },
  browserslist: { bg: '#FFD539', glyph: 'browser' },
  editorconfig: { bg: '#DCE6E6', text: 'EC' },

  /* --- Documents and generic assets --- */
  text: { bg: '#64748B', glyph: 'lines', fg: LIGHT },
  log: { bg: '#78716C', glyph: 'logLines', fg: LIGHT },
  license: { bg: '#B08D57', glyph: 'seal' },
  changelog: { bg: '#A855F7', glyph: 'history', fg: LIGHT },
  lock: { bg: '#94A3B8', glyph: 'padlock' },
  cert: { bg: '#10B981', glyph: 'key' },
  diff: { bg: '#8B5CF6', glyph: 'plusMinus', fg: LIGHT },
  binary: { bg: '#57534E', text: '10', fg: LIGHT },
  image: { bg: '#26A69A', glyph: 'picture', fg: LIGHT },
  font: { bg: '#6366F1', glyph: 'typeA', fg: LIGHT },
  audio: { bg: '#EC4899', glyph: 'note', fg: LIGHT },
  video: { bg: '#38BDF8', glyph: 'play' },
  archive: { bg: '#F59E0B', glyph: 'zip' },
  pdf: { bg: '#E5252A', text: 'PDF', fg: LIGHT },
  word: { bg: '#2B579A', text: 'W', fg: LIGHT },
  excel: { bg: '#217346', text: 'X', fg: LIGHT },
  powerpoint: { bg: '#D24726', text: 'P', fg: LIGHT },
};

const folders = {
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
  docker: { accent: '#38BDF8', glyph: 'whale' },
  workflows: { accent: '#C084FC', glyph: 'flow' },
  server: { accent: '#7DD3FC', glyph: 'serverRack' },
  shared: { accent: '#F472B6', glyph: 'share' },
  security: { accent: '#FB7185', glyph: 'shield' },
};

// Every distinct (string, size, tracking) that gets set anywhere in the set.
function textRuns() {
  const seen = new Map();
  for (const spec of Object.values(files)) {
    if (!spec.text) continue;
    const size = sizeFor(spec.text, spec);
    const track = trackFor(spec.text, spec);
    seen.set(textKey(spec.text, size, track), { str: spec.text, size, track });
  }
  return [...seen.values()];
}

module.exports = { FONT, WEIGHT, sizeFor, trackFor, textKey, textRuns, files, folders, LIGHT };
