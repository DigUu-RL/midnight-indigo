/*
 * Emits an icon-theme manifest under icons/theme/. Called by build-icons.ts
 * once per variant with the icon names it just generated, so a mapping can
 * never point at an icon that does not exist — the build fails instead.
 *
 * Every variant shares this file, which is the point: the extension-to-icon,
 * filename-to-icon and languageId-to-icon tables below are the same for all of
 * them. A variant only chooses which folder the SVGs are read from.
 *
 * The tables are declared `satisfies Record<string, FileIcon>` (or FolderIcon),
 * so a mapping that names an icon the spec does not define is a type error in
 * the editor. The runtime check below stays: it catches the other direction —
 * an icon the spec defines but the build failed to write.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { FileIcon, FolderIcon } from './icon-spec.ts';

const definitionKey = (kind: string, name: string): string => `_${kind}_${name.replace(/-/g, '_')}`;

const fileIconKey = (name: string): string => definitionKey('file', name);
const folderIconKey = (name: string): string => definitionKey('folder', name);

/* Folder name -> folder icon. */
const folderNameToIcon = {
  components: 'components', component: 'components', widgets: 'components',
  hooks: 'hooks', hook: 'hooks',
  functions: 'functions', function: 'functions', fn: 'functions', lambda: 'functions',
  utils: 'utils', util: 'utils', utility: 'utils', utilities: 'utils',
  helpers: 'helpers', helper: 'helpers',
  services: 'services', service: 'services', providers: 'services', provider: 'services',
  controllers: 'controllers', controller: 'controllers', handlers: 'controllers', handler: 'controllers',
  models: 'models', model: 'models', entities: 'models', entity: 'models',
  views: 'views', view: 'views', pages: 'views', page: 'views', screens: 'views',
  layouts: 'layouts', layout: 'layouts',
  store: 'store', stores: 'store', redux: 'store', state: 'store',
  context: 'context', contexts: 'context',
  middleware: 'middleware', middlewares: 'middleware', interceptors: 'middleware', interceptor: 'middleware',
  routes: 'routes', route: 'routes', router: 'routes', routing: 'routes',
  api: 'api', apis: 'api', endpoints: 'api', graphql: 'api',
  config: 'config', configs: 'config', configuration: 'config', settings: 'config',
  scripts: 'scripts', script: 'scripts', cli: 'scripts', bin: 'scripts', tools: 'scripts',
  tests: 'tests', test: 'tests', __tests__: 'tests', spec: 'tests', specs: 'tests', e2e: 'tests', coverage: 'tests',
  mocks: 'mocks', mock: 'mocks', fixtures: 'mocks', fixture: 'mocks', __mocks__: 'mocks', stubs: 'mocks',
  assets: 'assets', asset: 'assets', static: 'assets', resources: 'assets',
  images: 'images', img: 'images', imgs: 'images', pictures: 'images',
  media: 'media', video: 'media', videos: 'media', movies: 'media',
  audio: 'audio', sounds: 'audio', sound: 'audio', music: 'audio', sfx: 'audio',
  icons: 'icons', icon: 'icons', svg: 'icons',
  fonts: 'fonts', font: 'fonts', typography: 'fonts',
  styles: 'styles', style: 'styles', css: 'styles', scss: 'styles', sass: 'styles',
  themes: 'themes', theme: 'themes', palettes: 'themes', skins: 'themes',
  // `client` is the front end's source, not what it serves, so it is interface.
  public: 'public', www: 'public', web: 'public', client: 'views',
  build: 'build', dist: 'build', out: 'build', output: 'build', generated: 'build', target: 'build',
  docs: 'docs', doc: 'docs', documentation: 'docs',
  database: 'database', db: 'database', migrations: 'database', migration: 'database',
  seeders: 'database', seeder: 'database', seeds: 'database',
  schemas: 'schemas', schema: 'schemas', proto: 'schemas', protos: 'schemas',
  types: 'types', type: 'types', interfaces: 'types', interface: 'types', typings: 'types', '@types': 'types',
  dto: 'types', dtos: 'types',
  constants: 'constants', constant: 'constants', consts: 'constants', enums: 'constants', enum: 'constants',
  core: 'core', lib: 'core', libs: 'core', vendor: 'core', node_modules: 'core',
  packages: 'packages', apps: 'packages', workspaces: 'packages', monorepo: 'packages',
  plugins: 'plugins', plugin: 'plugins', modules: 'plugins', features: 'plugins', feature: 'plugins', extensions: 'plugins',
  i18n: 'i18n', locales: 'i18n', locale: 'i18n', lang: 'i18n', languages: 'i18n', translations: 'i18n',
  guards: 'guards', guard: 'guards',
  /*
   * Since M11 a folder's colour is its role, so a synonym has to belong to the
   * role as well as resemble the name. Directives, pipes and decorators used to
   * be guards, and would now be drawn in security's red; events and listeners
   * used to be validators, in quality's green. Each goes where its job is: a
   * directive is behaviour on the interface, a pipe is what a value is passed
   * through, a decorator is a function, an event is work that answers later.
   */
  directives: 'components', directive: 'components',
  pipes: 'middleware', pipe: 'middleware',
  decorators: 'functions', decorator: 'functions',
  validators: 'validators', validator: 'validators', validation: 'validators',
  events: 'jobs', listeners: 'jobs', notifications: 'jobs',
  jobs: 'jobs', queues: 'jobs', tasks: 'jobs', cron: 'jobs', scheduler: 'jobs', workers: 'jobs',
  docker: 'docker', kubernetes: 'docker', k8s: 'docker', deploy: 'docker', deployment: 'docker', infra: 'docker',
  workflows: 'workflows', '.github': 'workflows', ci: 'workflows', pipelines: 'workflows', '.gitlab': 'workflows',
  server: 'server', backend: 'server', api_server: 'server',
  shared: 'shared', common: 'shared', global: 'shared',
  security: 'security', auth: 'security', admin: 'security', permissions: 'security',

  /* --- V4: the directories a repository grows that the set never named --- */
  logs: 'logs', log: 'logs',
  temp: 'temp', tmp: 'temp', cache: 'temp', '.cache': 'temp', trash: 'temp',
  archive: 'archive', archived: 'archive', legacy: 'archive', deprecated: 'archive',
  keys: 'keys', certs: 'keys', certificates: 'keys', ssl: 'keys', secrets: 'keys',
  benchmarks: 'benchmarks', bench: 'benchmarks', perf: 'benchmarks', performance: 'benchmarks',
  design: 'design', designs: 'design', mockups: 'design', wireframes: 'design',
  ai: 'ai', '.claude': 'ai', '.cursor': 'ai', prompts: 'ai', agents: 'ai', llm: 'ai',
  // M12: where the other assistants keep their files, and the skills: 7.
  skills: 'ai', '.agents': 'ai', '.codex': 'ai', '.gemini': 'ai', '.continue': 'ai', instructions: 'ai',
} satisfies Record<string, FolderIcon>;

/* Extension -> file icon. Compound keys such as "spec.ts" win over "ts". */
const extensionToIcon = {
  js: 'javascript', cjs: 'javascript', jsx: 'jsx', mjs: 'mjs',
  ts: 'typescript', tsx: 'jsx', mts: 'mjs', cts: 'typescript',
  vue: 'vue', svelte: 'svelte', astro: 'astro', coffee: 'coffeescript',
  hbs: 'handlebars', handlebars: 'handlebars', pug: 'pug', jade: 'pug',
  ejs: 'ejs', njk: 'twig', twig: 'twig',
  graphql: 'graphql', gql: 'graphql', proto: 'protobuf', thrift: 'protobuf',
  html: 'html', htm: 'html', xhtml: 'html',
  css: 'css', scss: 'sass', sass: 'sass', less: 'less', styl: 'stylus',
  json: 'json', json5: 'json', jsonc: 'json', xml: 'xml', xsd: 'xml',
  yaml: 'yaml', yml: 'yaml', toml: 'toml', ini: 'ini', cfg: 'ini', conf: 'ini', env: 'env',
  md: 'markdown', markdown: 'markdown', mdx: 'mdx',
  py: 'python', pyi: 'python', pyc: 'python', pyw: 'python',
  rb: 'ruby', erb: 'ruby', gemspec: 'ruby',
  go: 'go', rs: 'rust', java: 'java', class: 'java', jar: 'java',
  kt: 'kotlin', kts: 'kotlin', swift: 'swift',
  c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hxx: 'cpp',
  cs: 'csharp', csx: 'csharp', fs: 'fsharp', fsx: 'fsharp', fsi: 'fsharp', vb: 'vbnet',
  php: 'php', phtml: 'php', sql: 'sql',
  sh: 'shell', bash: 'shell', zsh: 'zsh', fish: 'fish',
  ps1: 'powershell', psm1: 'powershell', psd1: 'powershell', bat: 'batch', cmd: 'batch',
  pl: 'perl', pm: 'perl', lua: 'lua', dart: 'dart',
  ex: 'elixir', exs: 'elixir', erl: 'erlang', hrl: 'erlang',
  hs: 'haskell', lhs: 'haskell', clj: 'clojure', cljs: 'clojure', cljc: 'clojure', edn: 'clojure',
  scala: 'scala', sc: 'scala', groovy: 'groovy', gradle: 'groovy',
  r: 'r', rmd: 'r', jl: 'julia', nim: 'nim', cr: 'crystal', zig: 'zig',
  m: 'objectivec', mm: 'objectivec', sol: 'solidity', asm: 'assembly', s: 'assembly',
  tf: 'terraform', tfvars: 'terraform', tfstate: 'terraform', ipynb: 'jupyter',
  log: 'log', pem: 'cert', crt: 'cert', key: 'cert', cer: 'cert', p12: 'cert', pfx: 'cert',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  ico: 'image', bmp: 'image', avif: 'image', tiff: 'image', tif: 'image', heic: 'image',
  ttf: 'font', otf: 'font', woff: 'font', woff2: 'font', eot: 'font',
  mp3: 'audio', wav: 'audio', flac: 'audio', ogg: 'audio', m4a: 'audio', aac: 'audio',
  wma: 'audio', opus: 'audio', aiff: 'audio', mid: 'audio', midi: 'audio',
  mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
  wmv: 'video', flv: 'video', m4v: 'video', mpeg: 'video', mpg: 'video', ogv: 'video',
  zip: 'archive', tar: 'archive', gz: 'archive', rar: 'archive', '7z': 'archive', bz2: 'archive', xz: 'archive',
  tgz: 'archive', zst: 'archive', lz: 'archive', lzma: 'archive', cab: 'archive', arj: 'archive',
  pdf: 'pdf', doc: 'word', docx: 'word', rtf: 'word', odt: 'word', dot: 'word', dotx: 'word',
  xls: 'excel', xlsx: 'excel', csv: 'csv', tsv: 'csv', ppt: 'powerpoint', pptx: 'powerpoint',
  ods: 'excel', xlsm: 'excel', odp: 'powerpoint',
  exe: 'binary', dll: 'binary', so: 'binary', dylib: 'binary', bin: 'binary', o: 'binary',
  // `.obj` is a compiled object file and a Wavefront mesh; the mesh is the one
  // a person is more likely to be looking at in an editor.
  a: 'binary', lib: 'binary', elf: 'binary', com: 'binary',
  vim: 'vim', diff: 'diff', patch: 'diff', txt: 'text', lock: 'lock',

  /* --- more languages, each with a mark of its own --- */
  elm: 'elm', hx: 'haxe', hxml: 'haxe', ml: 'ocaml', mli: 'ocaml',
  f: 'fortran', f90: 'fortran', f95: 'fortran', f03: 'fortran', for: 'fortran',
  rkt: 'racket', purs: 'purescript', gleam: 'gleam', nix: 'nix',
  wasm: 'webassembly', wat: 'webassembly',
  tex: 'latex', sty: 'latex', cls: 'latex', bib: 'latex',
  adoc: 'asciidoc', asciidoc: 'asciidoc',

  /* --- frameworks and platforms --- */
  ino: 'arduino', blend: 'blender', fig: 'figma',
  gd: 'godot', tscn: 'godot', tres: 'godot', godot: 'godot',
  unity: 'unity', prefab: 'unity', asset: 'unity', unitypackage: 'unity',
  ui: 'qt', qml: 'qt', pro: 'qt', qrc: 'qt',
  prisma: 'prisma',

  /* ---------------------------------------------------------------- *
   * Formats the set used to answer with the plain-text page.
   * ---------------------------------------------------------------- */
  eml: 'email', msg: 'email', mbox: 'email', emlx: 'email',
  ics: 'calendar', ical: 'calendar', ifb: 'calendar',
  vcf: 'contact', vcard: 'contact',
  geojson: 'geo', kml: 'geo', kmz: 'geo', gpx: 'geo', topojson: 'geo', shp: 'geo',
  svg: 'vector', ai: 'vector', eps: 'vector', sketch: 'vector', afdesign: 'vector',
  obj: 'model3d', fbx: 'model3d', gltf: 'model3d', glb: 'model3d', stl: 'model3d',
  dae: 'model3d', '3ds': 'model3d', ply: 'model3d', usdz: 'model3d',
  srt: 'subtitle', vtt: 'subtitle', sub: 'subtitle', ass: 'subtitle', ssa: 'subtitle',
  epub: 'ebook', mobi: 'ebook', azw: 'ebook', azw3: 'ebook', fb2: 'ebook', djvu: 'ebook',
  // .vhd is a virtual hard disk and it is VHDL source; in an editor it is the
  // source, so the disk image keeps .vhdx and the language takes .vhd.
  iso: 'diskimage', dmg: 'diskimage', img: 'diskimage',
  vhdx: 'diskimage', vmdk: 'diskimage', qcow2: 'diskimage', toast: 'diskimage',
  lnk: 'shortcut', url: 'shortcut', webloc: 'shortcut', desktop: 'shortcut',
  pdb: 'debug', dmp: 'debug', mdmp: 'debug', stackdump: 'debug', core: 'debug',
  parquet: 'dataset', avro: 'dataset', orc: 'dataset', arrow: 'dataset',
  feather: 'dataset', hdf5: 'dataset', h5: 'dataset', npy: 'dataset', npz: 'dataset',
  nb: 'math', sage: 'math', mac: 'math', mt: 'math', gp: 'math',
  pcap: 'capture', pcapng: 'capture', cap: 'capture', har: 'capture',
  sav: 'game', rom: 'game', nes: 'game', gba: 'game', gbc: 'game',
  n64: 'game', z64: 'game', smc: 'game', sfc: 'game',
  torrent: 'torrent', magnet: 'torrent',
  raw: 'raw', cr2: 'raw', cr3: 'raw', nef: 'raw', arw: 'raw', dng: 'raw',
  orf: 'raw', rw2: 'raw', raf: 'raw',
  deb: 'package', rpm: 'package', apk: 'package', ipa: 'package', msi: 'package',
  pkg: 'package', appimage: 'package', flatpak: 'package',
  vsix: 'package', crx: 'package', xpi: 'package', whl: 'package', egg: 'package',
  nupkg: 'package', gem: 'package', war: 'java', ear: 'java',
  bak: 'temp', tmp: 'temp', temp: 'temp', swp: 'temp', swo: 'temp', old: 'temp', orig: 'temp',

  /* ---------------------------------------------------------------- *
   * V4: the rest of the file system.
   *
   * Compound keys matter more here than anywhere else in this table: VS Code
   * matches the LONGEST extension after the first dot, so
   * `MyApi.postman_collection.json` reaches Postman rather than JSON without
   * needing a file-name rule for every collection anyone ever exports.
   * ---------------------------------------------------------------- */

  /* --- languages a set usually stops before --- */
  cbl: 'cobol', cob: 'cobol', cpy: 'cobol',
  pas: 'pascal', pp: 'pascal', dpr: 'pascal', dfm: 'pascal',
  adb: 'ada', ads: 'ada', tcl: 'tcl', tk: 'tcl', abap: 'abap',
  lisp: 'lisp', lsp: 'lisp', cl: 'lisp', el: 'lisp', asd: 'lisp',
  scm: 'scheme', ss: 'scheme', sld: 'scheme',
  awk: 'awk', sed: 'awk',
  applescript: 'applescript', scpt: 'applescript', ahk: 'autohotkey',

  /* --- hardware, graphics and science --- */
  v: 'verilog', sv: 'verilog', svh: 'verilog', vh: 'verilog',
  vhd: 'vhdl', vhdl: 'vhdl', vcd: 'waveform',
  kicad_pcb: 'pcb', kicad_sch: 'pcb', sch: 'pcb', brd: 'pcb', gbr: 'pcb',
  glsl: 'shader', hlsl: 'shader', wgsl: 'shader', metal: 'shader',
  frag: 'shader', vert: 'shader', comp: 'shader', geom: 'shader', shader: 'shader',
  cu: 'cuda', cuh: 'cuda',
  mlx: 'matlab', mat: 'matlab',
  sas: 'statistics', dta: 'statistics', sps: 'statistics',
  onnx: 'mlmodel', pt: 'mlmodel', pth: 'mlmodel', pkl: 'mlmodel',
  safetensors: 'mlmodel', gguf: 'mlmodel', ggml: 'mlmodel', tflite: 'mlmodel',
  dwg: 'cad', dxf: 'cad', step: 'cad', stp: 'cad', iges: 'cad', igs: 'cad',
  sldprt: 'cad', sldasm: 'cad', f3d: 'cad', skp: 'cad',
  gcode: 'gcode', ngc: 'gcode',

  /* --- templating dialects --- */
  liquid: 'liquid', j2: 'jinja', jinja: 'jinja', jinja2: 'jinja',

  /* --- the small files in a repository's root --- */
  http: 'http', rest: 'http', 'postman_collection.json': 'postman',
  map: 'sourcemap', keymap: 'keymap', kbd: 'keymap',
  tmtheme: 'colortheme', itermcolors: 'colortheme',
  mmd: 'diagram', mermaid: 'diagram', puml: 'diagram', plantuml: 'diagram',
  gv: 'diagram', drawio: 'diagram', excalidraw: 'diagram', bpmn: 'diagram',
  psd: 'design', psb: 'design', xd: 'design',
  afphoto: 'design', afpub: 'design', procreate: 'design', cdr: 'design',
  cron: 'schedule',
  service: 'unitfile', socket: 'unitfile', timer: 'unitfile', mount: 'unitfile', target: 'unitfile',
  rss: 'feed', atom: 'feed',
  bkp: 'backup', backup: 'backup',
  'code-workspace': 'workspace',

  /* --- creative project files --- */
  als: 'audioproject', flp: 'audioproject', logicx: 'audioproject',
  aup: 'audioproject', aup3: 'audioproject', ptx: 'audioproject', rpp: 'audioproject',
  prproj: 'videoproject', veg: 'videoproject', kdenlive: 'videoproject',
  fcpxml: 'videoproject', aep: 'videoproject',
  pbix: 'bi', pbit: 'bi', twb: 'bi', twbx: 'bi',

  /* --- tools whose file is the tool --- */
  xcodeproj: 'xcode', pbxproj: 'xcode', xcworkspace: 'xcode',
  xcconfig: 'xcode', xcscheme: 'xcode',
  uproject: 'unreal', uasset: 'unreal', umap: 'unreal',
  podspec: 'cocoapods', bzl: 'bazel', bazel: 'bazel',

  /* --- M10: icons the set drew and nothing pointed at --- */
  'pkr.hcl': 'packer', 'pkr.json': 'packer',
  sqlite: 'sqlite', sqlite3: 'sqlite', db3: 'sqlite', s3db: 'sqlite', sl3: 'sqlite',
  mongodb: 'mongodb', 'mongodb.js': 'mongodb',

  /* ---------------------------------------------------------------- *
   * M12: what the coverage audit found (`npm run audit:coverage`).
   *
   * Each group says what the files used to reach and how many of the audit's
   * 47 repositories they turned up in. Most point at an icon the set already
   * drew: the audit's first finding was that the set had the right picture
   * and nothing sent the file to it.
   *
   * A key may name the directory the file sits in — `workflows/yml` — which
   * VS Code has matched since the icon theme learned parent folders, and which
   * outranks the bare extension. The M10 note below says a workflow cannot be
   * matched by path; that was true of the editor it was written against.
   * ---------------------------------------------------------------- */

  /* --- files that belong to their folder --- */
  // Every .yml under .github/workflows was YAML: 41 repositories, 1330 files.
  'workflows/yml': 'githubactions', 'workflows/yaml': 'githubactions',
  // The forms under .github/ISSUE_TEMPLATE were YAML and Markdown: 42.
  'issue_template/yml': 'issuetemplate', 'issue_template/yaml': 'issuetemplate', 'issue_template/md': 'issuetemplate',
  // .circleci/config.yml was YAML: 5. The file-name rule `.circleci` it had
  // named the folder, which a file-name rule never matches.
  '.circleci/yml': 'circleci', '.circleci/yaml': 'circleci',
  // The settings of Claude Code, its plugins and Gemini were JSON: 8.
  '.claude/json': 'ai', '.claude-plugin/json': 'ai', '.gemini/json': 'ai',
  // An agent is any Markdown file in .github/agents or .claude/agents: 5.
  'agents/md': 'ai-agent',
  // Helm's template helpers were the page: 11, with 511 files.
  'templates/tpl': 'helm',

  /* --- assistant files: Markdown by extension, and VS Code's own languages --- */
  // The extension outranks the language id, so these were Markdown although
  // VS Code knew them as prompts, instructions and agents: 7, with 539 files.
  'prompt.md': 'ai-prompt', 'instructions.md': 'ai', 'agent.md': 'ai-agent', 'chatmode.md': 'ai-agent',

  /* --- .NET --- */
  // The Razor view engine's files were the page: 3, with 1620.
  razor: 'razor', cshtml: 'razor',
  // Project files were the XML angles: 6, with 5980 .csproj.
  csproj: 'msbuild', fsproj: 'msbuild', vbproj: 'msbuild', vcxproj: 'msbuild', proj: 'msbuild', props: 'msbuild', targets: 'msbuild',
  // A solution is Visual Studio's workspace, which is what .code-workspace is: 4.
  sln: 'workspace', slnx: 'workspace',

  /* --- build and language tooling --- */
  // CMake's modules and toolchains were the page: 10, with 2176 files.
  cmake: 'cmake',
  hcl: 'hcl',
  // Cython is Python compiled to C, and was the page: 5.
  pyx: 'python', pxd: 'python', pxi: 'python',

  /* --- formats with no icon of their own until M12 --- */
  rst: 'restructuredtext',
  // .snap was the package icon, for Snapcraft; in the repositories it was
  // 11,750 test snapshots in 14 of them, and no Snapcraft package in any.
  snap: 'snapshot', snapshot: 'snapshot', golden: 'snapshot', expected: 'snapshot',
  // Captured output: the expected stderr of a compiler test, a program's log. 6.
  stderr: 'log', stdout: 'log',
  tpl: 'template', tmpl: 'template', gotmpl: 'template', template: 'template',
  example: 'template', sample: 'template', dist: 'template',
  po: 'translation', pot: 'translation', mo: 'translation',
  xliff: 'translation', xlf: 'translation', strings: 'translation', stringsdict: 'translation',
  dts: 'devicetree', dtsi: 'devicetree',

  /* --- formats an existing icon already answers --- */
  // JSON Lines is JSON, a record a line; VS Code calls it `jsonl`: 8.
  jsonl: 'json', ndjson: 'json',
  xsl: 'xml', xslt: 'xml',
  // HDR and GPU texture formats, and the image formats Apple and X11 keep: 5.
  exr: 'image', hdr: 'image', ktx: 'image', ktx2: 'image', dds: 'image',
  basis: 'image', tga: 'image', xpm: 'image', icns: 'image',
  // FITS is astronomy's image-and-table format, netCDF climate science's: 3.
  fits: 'dataset', nc: 'dataset',
  '3mf': 'model3d',
  kicad_mod: 'pcb', kicad_sym: 'pcb', kicad_pro: 'pcb', kicad_prl: 'pcb', kicad_dru: 'pcb', kicad_wks: 'pcb',
  // Firmware images, what a board is flashed with: 2.
  hex: 'binary', uf2: 'binary',
  // Apple's property lists and the other files of an Xcode project: 14.
  plist: 'xcode', entitlements: 'xcode', xcworkspacedata: 'xcode', xcprivacy: 'xcode',
  storyboard: 'xcode', xib: 'xcode',
  // Public keys, signing requests and detached signatures: 11.
  pub: 'cert', csr: 'cert', der: 'cert', asc: 'cert', sig: 'cert',

  'spec.ts': 'typescript-spec', 'test.ts': 'typescript-test', 'd.ts': 'typescript-d',
  'module.ts': 'typescript-module', 'component.ts': 'typescript-component',
  'service.ts': 'typescript-service', 'stories.ts': 'typescript-stories',
  'config.ts': 'tsconfig', 'guard.ts': 'typescript-guard',
  'pipe.ts': 'typescript-pipe', 'directive.ts': 'typescript-directive',
  'controller.ts': 'typescript-controller', 'model.ts': 'typescript-model',
  'dto.ts': 'typescript-dto', 'entity.ts': 'typescript-entity',
  'repository.ts': 'typescript-model', 'resolver.ts': 'typescript-controller',
  'interceptor.ts': 'typescript-pipe', 'middleware.ts': 'typescript-pipe',
  'spec.tsx': 'jsx-spec', 'test.tsx': 'jsx-test',
  'stories.tsx': 'jsx-stories', 'component.tsx': 'jsx-component',
  'spec.js': 'javascript-spec', 'test.js': 'javascript-test',
  'config.js': 'jsconfig', 'min.js': 'javascript-min', 'module.js': 'mjs',
  'spec.jsx': 'jsx-spec', 'test.jsx': 'jsx-test', 'stories.jsx': 'jsx-stories',
  'min.css': 'javascript-min',
  'module.scss': 'scss-module', 'module.css': 'css-module', 'module.less': 'css-module',
} satisfies Record<string, FileIcon>;

/* Exact file name -> file icon. */
const fileNameToIcon = {
  'package.json': 'npm', 'package-lock.json': 'npm', 'npm-shrinkwrap.json': 'npm', '.npmrc': 'npm', '.npmignore': 'npm',
  'yarn.lock': 'yarnlock', '.yarnrc': 'yarnlock', '.yarnrc.yml': 'yarnlock',
  'pnpm-lock.yaml': 'pnpm', 'pnpm-workspace.yaml': 'pnpm',
  '.gitignore': 'git', '.gitattributes': 'git', '.gitmodules': 'git', '.gitkeep': 'git', '.mailmap': 'git',
  'readme.md': 'markdown', 'readme': 'markdown', 'contributing.md': 'markdown', 'code_of_conduct.md': 'markdown',
  license: 'license', 'license.md': 'license', 'license.txt': 'license',
  licence: 'license', 'licence.md': 'license', copying: 'license',
  'changelog.md': 'changelog', changelog: 'changelog', 'changelog.txt': 'changelog', 'history.md': 'changelog',
  '.editorconfig': 'editorconfig',
  '.eslintrc': 'eslint', '.eslintrc.json': 'eslint', '.eslintrc.js': 'eslint', '.eslintrc.cjs': 'eslint',
  '.eslintrc.yml': 'eslint', '.eslintignore': 'eslint', 'eslint.config.js': 'eslint', 'eslint.config.mjs': 'eslint',
  '.prettierrc': 'prettier', '.prettierrc.json': 'prettier', '.prettierrc.js': 'prettier',
  '.prettierrc.yml': 'prettier', '.prettierignore': 'prettier', 'prettier.config.js': 'prettier',
  '.stylelintrc': 'stylelint', '.stylelintrc.json': 'stylelint', 'stylelint.config.js': 'stylelint',
  'babel.config.js': 'babel', '.babelrc': 'babel', 'babel.config.json': 'babel',
  'webpack.config.js': 'webpack', 'webpack.config.ts': 'webpack', 'webpack.common.js': 'webpack',
  'vite.config.js': 'vite', 'vite.config.ts': 'vite', 'vite.config.mts': 'vite',
  'rollup.config.js': 'rollup', 'rollup.config.mjs': 'rollup',
  'tsconfig.json': 'tsconfig', 'tsconfig.base.json': 'tsconfig', 'tsconfig.build.json': 'tsconfig',
  'jsconfig.json': 'jsconfig',
  'jest.config.js': 'jest', 'jest.config.ts': 'jest', 'jest.setup.js': 'jest', 'jest.config.mjs': 'jest',
  dockerfile: 'docker', 'dockerfile.dev': 'docker', 'docker-compose.yml': 'docker',
  'docker-compose.yaml': 'docker', '.dockerignore': 'docker',
  makefile: 'makefile', 'gnumakefile': 'makefile', 'cmakelists.txt': 'cmake',
  'nginx.conf': 'nginx', '.htaccess': 'htaccess', 'robots.txt': 'robots',
  'manifest.json': 'manifest', 'site.webmanifest': 'manifest',
  procfile: 'procfile', vagrantfile: 'vagrant',
  '.browserslistrc': 'browserslist', jenkinsfile: 'jenkins',
  '.travis.yml': 'travis', '.gitlab-ci.yml': 'gitlabci',
  'bitbucket-pipelines.yml': 'bitbucket', 'renovate.json': 'renovate', '.renovaterc': 'renovate',
  'azure-pipelines.yml': 'azure', '.vimrc': 'vim',
  '.env': 'env', '.env.local': 'env', '.env.development': 'env', '.env.production': 'env', '.env.example': 'env',
  'go.mod': 'go', 'go.sum': 'go', 'cargo.toml': 'rust', 'cargo.lock': 'rust',
  'gemfile': 'ruby', 'rakefile': 'ruby', 'requirements.txt': 'python', 'pyproject.toml': 'python',

  /* --- runtimes --- */
  '.nvmrc': 'nodejs', '.node-version': 'nodejs', 'server.js': 'nodejs',
  'deno.json': 'deno', 'deno.jsonc': 'deno', 'deno.lock': 'deno',
  'bun.lockb': 'bun', 'bun.lock': 'bun', 'bunfig.toml': 'bun',

  /* --- frameworks --- */
  'angular.json': 'angular', '.angular-cli.json': 'angular', 'ng-package.json': 'angular',
  'next.config.js': 'nextjs', 'next.config.mjs': 'nextjs', 'next.config.ts': 'nextjs',
  'nuxt.config.js': 'nuxt', 'nuxt.config.ts': 'nuxt',
  'tailwind.config.js': 'tailwind', 'tailwind.config.ts': 'tailwind', 'tailwind.config.cjs': 'tailwind',
  'postcss.config.js': 'postcss', 'postcss.config.cjs': 'postcss', 'postcss.config.mjs': 'postcss',
  'manage.py': 'django', 'artisan': 'laravel',
  'pubspec.yaml': 'flutter', 'pubspec.lock': 'flutter',
  'electron.vite.config.ts': 'electron', 'tauri.conf.json': 'tauri',

  /* --- build, package and workspace --- */
  'build.gradle': 'gradle', 'build.gradle.kts': 'gradle', 'settings.gradle': 'gradle',
  'gradle.properties': 'gradle', 'gradlew': 'gradle',
  'pom.xml': 'maven', 'mvnw': 'maven',
  'composer.json': 'composer', 'composer.lock': 'composer',
  'poetry.lock': 'poetry', 'nuget.config': 'nuget', 'packages.config': 'nuget',
  'environment.yml': 'conda', 'environment.yaml': 'conda',
  'turbo.json': 'turborepo', 'nx.json': 'nx', 'lerna.json': 'lerna',

  /* --- test runners --- */
  'cypress.config.js': 'cypress', 'cypress.config.ts': 'cypress', 'cypress.json': 'cypress',
  'playwright.config.js': 'playwright', 'playwright.config.ts': 'playwright',
  'vitest.config.js': 'vitest', 'vitest.config.ts': 'vitest',
  '.mocharc.json': 'mocha', '.mocharc.yml': 'mocha', '.mocharc.js': 'mocha',
  '.storybook': 'storybook', 'main.stories.ts': 'storybook',

  /* --- infrastructure --- */
  'chart.yaml': 'helm', 'values.yaml': 'helm',
  'kustomization.yaml': 'kubernetes', 'kustomization.yml': 'kubernetes', 'skaffold.yaml': 'kubernetes',
  'ansible.cfg': 'ansible', 'playbook.yml': 'ansible', 'playbook.yaml': 'ansible',
  'netlify.toml': 'netlify', 'vercel.json': 'vercel', 'now.json': 'vercel',
  'wrangler.toml': 'cloudflare', 'wrangler.jsonc': 'cloudflare', '_headers': 'cloudflare', '_redirects': 'cloudflare',
  'pulumi.yaml': 'pulumi', 'serverless.yml': 'serverless', 'serverless.yaml': 'serverless',

  /* --- data stores --- */
  'schema.prisma': 'prisma',
  'firebase.json': 'firebase', '.firebaserc': 'firebase', 'firestore.rules': 'firebase',
  'ormconfig.json': 'postgresql', 'my.cnf': 'mysql', 'redis.conf': 'redis',

  /* --- schemas and API descriptions --- */
  'openapi.yaml': 'openapi', 'openapi.yml': 'openapi', 'openapi.json': 'openapi',
  'swagger.yaml': 'swagger', 'swagger.yml': 'swagger', 'swagger.json': 'swagger',

  /* --- assistant and prompt files --- */
  '.cursorrules': 'ai', 'claude.md': 'ai', 'agents.md': 'ai',
  'copilot-instructions.md': 'ai', '.aider.conf.yml': 'ai',

  /* --- Nix, which names its files rather than extending them --- */
  'flake.nix': 'nix', 'flake.lock': 'nix', 'shell.nix': 'nix', 'default.nix': 'nix',

  /* ---------------------------------------------------------------- *
   * V4: the files a repository keeps in its root that are neither source
   * nor documentation. Most of these have no extension at all, which is
   * why they all used to resolve to the plain-text page.
   * ---------------------------------------------------------------- */
  'sitemap.xml': 'sitemap', hosts: 'hosts', crontab: 'schedule',
  codeowners: 'codeowners', 'security.md': 'securitypolicy',
  'issue_template.md': 'issuetemplate', 'pull_request_template.md': 'prtemplate',
  'commitlint.config.js': 'commitconfig', '.commitlintrc': 'commitconfig',
  '.commitlintrc.json': 'commitconfig', '.releaserc': 'commitconfig',
  'release.config.js': 'commitconfig', '.versionrc': 'commitconfig',
  '.huskyrc': 'husky', 'pre-commit': 'husky', 'commit-msg': 'husky', 'pre-push': 'husky',
  'devcontainer.json': 'devcontainer', '.devcontainer.json': 'devcontainer',
  notice: 'notice', 'notice.md': 'notice', 'notice.txt': 'notice',
  authors: 'notice', 'authors.md': 'notice', contributors: 'notice', maintainers: 'notice',
  '.netrc': 'secrets', '.htpasswd': 'secrets', credentials: 'secrets',
  '.secrets': 'secrets', 'secrets.json': 'secrets', '.vault-token': 'secrets',
  'cloud-init.yml': 'cloudconfig', 'cloud-init.yaml': 'cloudconfig',
  'cloudformation.yml': 'cloudconfig', 'cloudformation.yaml': 'cloudconfig',

  /* --- tools whose file is the tool --- */
  brewfile: 'homebrew', 'brewfile.lock.json': 'homebrew',
  podfile: 'cocoapods', 'podfile.lock': 'cocoapods',
  'build.bazel': 'bazel', 'workspace.bazel': 'bazel', '.bazelrc': 'bazel',
  'module.bazel': 'bazel', workspace: 'bazel',
  'grafana.ini': 'grafana',
  'prometheus.yml': 'prometheus', 'prometheus.yaml': 'prometheus', 'alertmanager.yml': 'prometheus',
  '.sentryclirc': 'sentry', 'sentry.properties': 'sentry',
  'sonar-project.properties': 'sonarqube',
  'vault.hcl': 'vault',

  /*
   * --- M10: icons the set drew and nothing pointed at ---
   *
   * The audit found eight definitions no mapping reached: SVGs built, shipped
   * and never shown. These are the files that are unambiguously each tool's.
   * `action.yml` is the file that IS an action; the workflows under
   * .github/workflows are matched by their folder, in the M12 block above.
   */
  'action.yml': 'githubactions', 'action.yaml': 'githubactions',
  'esbuild.config.js': 'esbuild', 'esbuild.config.mjs': 'esbuild', 'esbuild.config.ts': 'esbuild',
  'mongod.conf': 'mongodb', '.mongoshrc.js': 'mongodb',
  'application.properties': 'spring', 'application.yml': 'spring', 'application.yaml': 'spring',
  'bootstrap.css': 'bootstrap', 'bootstrap.min.css': 'bootstrap',
  'bootstrap.js': 'bootstrap', 'bootstrap.min.js': 'bootstrap', 'bootstrap.bundle.min.js': 'bootstrap',

  /* ---------------------------------------------------------------- *
   * M12: what the coverage audit found. Counts are repositories of 47.
   * ---------------------------------------------------------------- */

  /* --- tools with a mark of their own --- */
  'dependabot.yml': 'dependabot', 'dependabot.yaml': 'dependabot',
  'conftest.py': 'pytest', 'pytest.ini': 'pytest',
  '.clang-format': 'llvm', '_clang-format': 'llvm', '.clang-tidy': 'llvm', '.clangd': 'llvm',
  '.pre-commit-config.yaml': 'precommit', '.pre-commit-config.yml': 'precommit', '.pre-commit-hooks.yaml': 'precommit',
  'codecov.yml': 'codecov', 'codecov.yaml': 'codecov', '.codecov.yml': 'codecov',
  'ruff.toml': 'ruff', '.ruff.toml': 'ruff',
  'uv.lock': 'uv', 'uv.toml': 'uv',
  // Written in HCL, but each is one tool's.
  '.terraform.lock.hcl': 'terraform', 'docker-bake.hcl': 'docker',

  /* --- assistant files --- */
  // SKILL.md was Markdown: 27 repositories, 768 files — the most common
  // assistant file in the corpus, ahead of AGENTS.md.
  'skill.md': 'ai', 'gemini.md': 'ai',
  'mcp.json': 'mcp', '.mcp.json': 'mcp',

  /* --- containers and clusters --- */
  // Compose's own name for its file since v2, and the overrides: 12.
  'compose.yaml': 'docker', 'compose.yml': 'docker',
  'compose.override.yaml': 'docker', 'compose.override.yml': 'docker',
  'docker-compose.override.yml': 'docker', 'docker-compose.override.yaml': 'docker',
  '.helmignore': 'helm', 'chart.lock': 'helm', 'values.schema.json': 'helm', 'helmfile.yaml': 'helm',

  /* --- the languages' own tooling --- */
  'setup.cfg': 'python-config', 'tox.ini': 'python-config', 'mypy.ini': 'python-config', '.mypy.ini': 'python-config',
  '.flake8': 'python-config', '.pylintrc': 'python-config', pylintrc: 'python-config', '.coveragerc': 'python-config',
  // What makes a directory a Python package, and pins its interpreter: 16.
  'setup.py': 'python', 'manifest.in': 'python', 'py.typed': 'python', 'requirements.in': 'python',
  pipfile: 'python', 'pipfile.lock': 'python', '.python-version': 'python',
  // Rust's own toolchain, linter and formatter: 9.
  'rust-toolchain': 'rust', 'rust-toolchain.toml': 'rust', 'clippy.toml': 'rust', '.clippy.toml': 'rust',
  'rustfmt.toml': 'rust', '.rustfmt.toml': 'rust', '.cargo/config.toml': 'rust', '.cargo/config': 'rust',
  'go.work': 'go', 'go.work.sum': 'go', '.golangci.yml': 'go', '.golangci.yaml': 'go', '.go-version': 'go',
  'cmakepresets.json': 'cmake', 'cmakeuserpresets.json': 'cmake',
  // Build and task runners with no mark to import, which are what make is: 6.
  'meson.build': 'makefile', 'meson_options.txt': 'makefile', 'meson.options': 'makefile',
  justfile: 'makefile', '.justfile': 'makefile', 'taskfile.yml': 'makefile', 'taskfile.yaml': 'makefile',
  'settings.gradle.kts': 'gradle',
  'directory.packages.props': 'nuget',

  /* --- the small files in a repository's root --- */
  // Kubernetes' CODEOWNERS: 3, with 598 files.
  owners: 'codeowners', owners_aliases: 'codeowners',
  copyright: 'license', patents: 'license', unlicense: 'license', 'license.rst': 'license',
  'license-mit': 'license', 'license-apache': 'license', license_apache2: 'license',
  'license.bsd': 'license', 'licenses.txt': 'license', 'licenses.md': 'license',
  // How to cite the project: its credits, as NOTICE and AUTHORS are: 6.
  'citation.cff': 'notice',
  // A linter's configuration is the format it lints: 9.
  '.yamllint': 'yaml', '.yamllint.yml': 'yaml', '.yamllint.yaml': 'yaml', '.shellcheckrc': 'shell',
  '.markdownlint.json': 'markdown', '.markdownlint.jsonc': 'markdown', '.markdownlint.yaml': 'markdown',
  '.markdownlint.yml': 'markdown', '.markdownlintrc': 'markdown', '.markdownlint-cli2.jsonc': 'markdown',
  '.markdownlint-cli2.yaml': 'markdown',
  '.keep': 'git',
  // Environment templates stay environment files; `.example` alone is a template.
  '.env.local.example': 'env', '.env.sample': 'env', '.env.template': 'env', '.env.dist': 'env', '.flaskenv': 'env',
} satisfies Record<string, FileIcon>;

/* VS Code language id -> file icon, for files with no recognisable extension. */
const languageIdToIcon = {
  javascript: 'javascript', javascriptreact: 'jsx', typescript: 'typescript', typescriptreact: 'jsx',
  python: 'python', ruby: 'ruby', go: 'go', rust: 'rust', java: 'java', kotlin: 'kotlin', swift: 'swift',
  c: 'c', cpp: 'cpp', csharp: 'csharp', fsharp: 'fsharp', php: 'php', sql: 'sql',
  shellscript: 'shell', powershell: 'powershell', bat: 'batch', perl: 'perl', lua: 'lua', dart: 'dart',
  elixir: 'elixir', erlang: 'erlang', haskell: 'haskell', clojure: 'clojure', scala: 'scala',
  groovy: 'groovy', r: 'r', julia: 'julia', 'objective-c': 'objectivec', 'objective-cpp': 'objectivec',
  solidity: 'solidity', json: 'json', jsonc: 'json', yaml: 'yaml', toml: 'toml', xml: 'xml',
  markdown: 'markdown', html: 'html', css: 'css', scss: 'sass', sass: 'sass', less: 'less',
  vue: 'vue', svelte: 'svelte', astro: 'astro', dockerfile: 'docker', graphql: 'graphql',
  ini: 'ini', properties: 'ini', diff: 'diff', makefile: 'makefile', plaintext: 'text',
  log: 'log', vb: 'vbnet', coffeescript: 'coffeescript', handlebars: 'handlebars', pug: 'pug',
  terraform: 'terraform', jupyter: 'jupyter', 'jupyter-notebook': 'jupyter',
  elm: 'elm', haxe: 'haxe', ocaml: 'ocaml', fortran: 'fortran', 'fortran-free-form': 'fortran',
  racket: 'racket', purescript: 'purescript', gleam: 'gleam', nix: 'nix',
  wat: 'webassembly', wasm: 'webassembly', latex: 'latex', tex: 'latex',
  bibtex: 'latex', asciidoc: 'asciidoc', 'git-commit': 'git', 'git-rebase': 'git',
  ignore: 'git', csv: 'csv', tsv: 'csv',

  /* --- V4: the languages whose extension is already spoken for --- *
   *
   * Prolog is .pl and .pro, which Perl and Qt got to first; MATLAB is .m,
   * which Objective-C got to first. The language id is the only place those
   * can be answered correctly, and it is the better answer anyway: it is what
   * the editor itself decided the file is.
   */
  prolog: 'prolog', lisp: 'lisp', 'common-lisp': 'lisp', scheme: 'scheme',
  tcl: 'tcl', cobol: 'cobol', pascal: 'pascal', objectpascal: 'pascal',
  ada: 'ada', abap: 'abap', matlab: 'matlab', applescript: 'applescript', ahk: 'autohotkey',
  verilog: 'verilog', systemverilog: 'verilog', vhdl: 'vhdl',
  shaderlab: 'shader', hlsl: 'shader', glsl: 'shader', 'cuda-cpp': 'cuda',
  awk: 'awk', http: 'http',

  /*
   * --- M12: the languages VS Code ships that reached the page ---
   *
   * The audit read the languages VS Code's built-in extensions contribute and
   * found thirteen with no icon here. A language id only decides a file no
   * extension rule matches — `.env.staging`, a compose file under any name,
   * a Markdown file under .claude/agents — so these back up the tables above.
   */
  dotenv: 'env', dockercompose: 'docker', jsonl: 'json', snippets: 'json', xsl: 'xml',
  jade: 'pug', juliamarkdown: 'julia', razor: 'razor', restructuredtext: 'restructuredtext',
  prompt: 'ai-prompt', instructions: 'ai', chatagent: 'ai-agent', skill: 'ai',
} satisfies Record<string, FileIcon>;

export type BuildThemeOptions = {
  /** The file icons the build just wrote. */
  fileIcons: FileIcon[];
  /** The folder icons the build just wrote. */
  folderIcons: FolderIcon[];
  /** Absolute path of the manifest to emit. */
  manifestPath: string;
  /** Directory under icons/ the variant's SVGs live in. */
  svgDirectory: string;
};

type IconDefinitionMap = Record<string, { iconPath: string }>;
type NameToIconKey = Record<string, string>;

type Manifest = {
  iconDefinitions: IconDefinitionMap;
  folder: string;
  folderExpanded: string;
  rootFolder: string;
  rootFolderExpanded: string;
  file: string;
  folderNames: NameToIconKey;
  folderNamesExpanded: NameToIconKey;
  fileExtensions: NameToIconKey;
  fileNames: NameToIconKey;
  languageIds: NameToIconKey;
};

/*
 * The manifest has to be closed in all three directions, and the build fails
 * on the first gap (M10):
 *
 *   every SVG a definition names is on disk — a missing file is a blank icon,
 *   and VS Code does not say so;
 *   every name a mapping sends somewhere reaches a definition;
 *   every definition is reached by something — or it is an SVG that is built,
 *   shipped and never shown, which is what eight of them were until M10.
 *
 * The svg directory holding nothing the manifest does not name is the fourth
 * side of the same question, and it is asked here too.
 */
const assertManifestIsClosed = (manifest: Manifest, manifestPath: string): void => {
  const problems: string[] = [];
  const manifestDirectory: string = path.dirname(manifestPath);
  const definitions: string[] = Object.keys(manifest.iconDefinitions);

  const referenced: Set<string> = new Set([
    manifest.file,
    manifest.folder,
    manifest.folderExpanded,
    manifest.rootFolder,
    manifest.rootFolderExpanded,
    ...[manifest.folderNames, manifest.folderNamesExpanded, manifest.fileExtensions, manifest.fileNames, manifest.languageIds].flatMap(
      (table: NameToIconKey): string[] => Object.values(table)
    ),
  ]);

  for (const definition of definitions) {
    const iconPath: string = path.join(manifestDirectory, manifest.iconDefinitions[definition].iconPath);
    if (!fs.existsSync(iconPath)) problems.push(`${definition} names ${manifest.iconDefinitions[definition].iconPath}, which is not on disk`);
    if (!referenced.has(definition)) problems.push(`${definition} is defined but no folder name, extension, file name or language id reaches it`);
  }
  for (const reference of referenced) {
    if (!manifest.iconDefinitions[reference]) problems.push(`${reference} is mapped to but never defined`);
  }

  const namedFiles: Set<string> = new Set(definitions.map((definition: string): string => path.basename(manifest.iconDefinitions[definition].iconPath)));
  const svgDirectory: string = path.join(manifestDirectory, path.dirname(manifest.iconDefinitions[manifest.file].iconPath));
  for (const svgFile of fs.readdirSync(svgDirectory)) {
    if (!namedFiles.has(svgFile)) problems.push(`${svgFile} is in the icon folder but no definition names it`);
  }

  if (problems.length) throw new Error(`the icon manifest is not closed:\n  ${problems.join('\n  ')}`);
};

export default function buildTheme({
  fileIcons,
  folderIcons,
  manifestPath,
  svgDirectory,
}: BuildThemeOptions): void {
  const writtenFileIcons: Set<string> = new Set(fileIcons);
  const writtenFolderIcons: Set<string> = new Set(folderIcons);

  const iconDefinitions: IconDefinitionMap = {};
  for (const iconName of fileIcons) {
    iconDefinitions[fileIconKey(iconName)] = {
      iconPath: `../${svgDirectory}/file-${iconName}.svg`,
    };
  }
  iconDefinitions._folder = { iconPath: `../${svgDirectory}/folder.svg` };
  iconDefinitions._folder_open = { iconPath: `../${svgDirectory}/folder-open.svg` };
  for (const iconName of folderIcons) {
    iconDefinitions[folderIconKey(iconName)] = {
      iconPath: `../${svgDirectory}/folder-${iconName}.svg`,
    };
    iconDefinitions[`${folderIconKey(iconName)}_open`] = {
      iconPath: `../${svgDirectory}/folder-${iconName}-open.svg`,
    };
  }

  const mapNamesToFileIconKeys = (
    table: Record<string, string>,
    tableName: string
  ): NameToIconKey => {
    const mapped: NameToIconKey = {};
    for (const [name, iconName] of Object.entries(table)) {
      if (!writtenFileIcons.has(iconName)) {
        throw new Error(`${tableName}["${name}"] points at missing file icon "${iconName}"`);
      }
      mapped[name] = fileIconKey(iconName);
    }
    return mapped;
  };

  const closedFolders: NameToIconKey = {};
  const openFolders: NameToIconKey = {};
  for (const [folderName, iconName] of Object.entries(folderNameToIcon)) {
    if (!writtenFolderIcons.has(iconName)) {
      throw new Error(`folderNameToIcon["${folderName}"] points at missing folder icon "${iconName}"`);
    }
    closedFolders[folderName] = folderIconKey(iconName);
    openFolders[folderName] = `${folderIconKey(iconName)}_open`;
  }

  /*
   * The keys below are VS Code's, not ours. `folderNames`, `fileExtensions`,
   * `fileNames` and `languageIds` are the icon-theme manifest schema — renaming
   * them to match the tables they are built from would emit a file the editor
   * reads as empty, and it would do it silently: an unknown key is ignored, so
   * every icon would simply stop resolving with no error anywhere.
   */
  const theme: Manifest = {
    iconDefinitions,
    folder: '_folder',
    folderExpanded: '_folder_open',
    rootFolder: '_folder',
    rootFolderExpanded: '_folder_open',
    file: fileIconKey('text'),
    folderNames: closedFolders,
    folderNamesExpanded: openFolders,
    fileExtensions: mapNamesToFileIconKeys(extensionToIcon, 'extensionToIcon'),
    fileNames: mapNamesToFileIconKeys(fileNameToIcon, 'fileNameToIcon'),
    languageIds: mapNamesToFileIconKeys(languageIdToIcon, 'languageIdToIcon'),
  };

  assertManifestIsClosed(theme, manifestPath);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(theme, null, 2) + '\n', 'utf8');
  console.log(
    `       wrote icons/theme/${path.basename(manifestPath)} ` +
      `(${Object.keys(iconDefinitions).length} definitions)`
  );
}
