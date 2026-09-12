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
  images: 'images', img: 'images', imgs: 'images', media: 'images', pictures: 'images',
  icons: 'icons', icon: 'icons', svg: 'icons',
  fonts: 'fonts', font: 'fonts', typography: 'fonts',
  styles: 'styles', style: 'styles', css: 'styles', scss: 'styles', sass: 'styles', themes: 'styles', theme: 'styles',
  public: 'public', www: 'public', web: 'public', client: 'public',
  build: 'build', dist: 'build', out: 'build', output: 'build', generated: 'build', target: 'build',
  docs: 'docs', doc: 'docs', documentation: 'docs',
  database: 'database', db: 'database', migrations: 'database', migration: 'database',
  seeders: 'database', seeder: 'database', seeds: 'database', schemas: 'database', schema: 'database',
  types: 'types', type: 'types', interfaces: 'types', interface: 'types', typings: 'types', '@types': 'types',
  dto: 'types', dtos: 'types',
  constants: 'constants', constant: 'constants', consts: 'constants', enums: 'constants', enum: 'constants',
  core: 'core', lib: 'core', libs: 'core', vendor: 'core', node_modules: 'core', packages: 'core',
  plugins: 'plugins', plugin: 'plugins', modules: 'plugins', features: 'plugins', feature: 'plugins', extensions: 'plugins',
  i18n: 'i18n', locales: 'i18n', locale: 'i18n', lang: 'i18n', languages: 'i18n', translations: 'i18n',
  guards: 'guards', guard: 'guards', directives: 'guards', directive: 'guards',
  pipes: 'guards', pipe: 'guards', decorators: 'guards', decorator: 'guards',
  validators: 'validators', validator: 'validators', validation: 'validators',
  events: 'validators', listeners: 'validators', jobs: 'validators', queues: 'validators',
  tasks: 'validators', notifications: 'validators',
  docker: 'docker', kubernetes: 'docker', k8s: 'docker', deploy: 'docker', deployment: 'docker', infra: 'docker',
  workflows: 'workflows', '.github': 'workflows', ci: 'workflows', pipelines: 'workflows', '.gitlab': 'workflows',
  server: 'server', backend: 'server', api_server: 'server',
  shared: 'shared', common: 'shared', global: 'shared',
  security: 'security', auth: 'security', admin: 'security', permissions: 'security',
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
  css: 'css', scss: 'scss', sass: 'sass', less: 'less', styl: 'stylus',
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
  iso: 'diskimage', dmg: 'diskimage', img: 'diskimage', vhd: 'diskimage',
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
  pkg: 'package', appimage: 'package', snap: 'package', flatpak: 'package',
  vsix: 'package', crx: 'package', xpi: 'package', whl: 'package', egg: 'package',
  nupkg: 'package', gem: 'package', war: 'java', ear: 'java',
  bak: 'temp', tmp: 'temp', temp: 'temp', swp: 'temp', swo: 'temp', old: 'temp', orig: 'temp',

  'spec.ts': 'typescript-spec', 'test.ts': 'typescript-test', 'd.ts': 'typescript-d',
  'module.ts': 'typescript-module', 'component.ts': 'typescript-component',
  'service.ts': 'typescript-service', 'stories.ts': 'typescript-stories',
  'config.ts': 'typescript-config', 'guard.ts': 'typescript-guard',
  'pipe.ts': 'typescript-pipe', 'directive.ts': 'typescript-directive',
  'controller.ts': 'typescript-controller', 'model.ts': 'typescript-model',
  'dto.ts': 'typescript-dto', 'entity.ts': 'typescript-entity',
  'repository.ts': 'typescript-model', 'resolver.ts': 'typescript-controller',
  'interceptor.ts': 'typescript-pipe', 'middleware.ts': 'typescript-pipe',
  'spec.tsx': 'jsx-spec', 'test.tsx': 'jsx-test',
  'stories.tsx': 'jsx-stories', 'component.tsx': 'jsx-component',
  'spec.js': 'javascript-spec', 'test.js': 'javascript-test',
  'config.js': 'javascript-config', 'min.js': 'javascript-min', 'module.js': 'javascript-module',
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
  '.travis.yml': 'travis', '.circleci': 'circleci', '.gitlab-ci.yml': 'gitlabci',
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
  markdown: 'markdown', html: 'html', css: 'css', scss: 'scss', sass: 'sass', less: 'less',
  vue: 'vue', svelte: 'svelte', astro: 'astro', dockerfile: 'docker', graphql: 'graphql',
  ini: 'ini', properties: 'ini', diff: 'diff', makefile: 'makefile', plaintext: 'text',
  log: 'log', vb: 'vbnet', coffeescript: 'coffeescript', handlebars: 'handlebars', pug: 'pug',
  terraform: 'terraform', jupyter: 'jupyter', 'jupyter-notebook': 'jupyter',
  elm: 'elm', haxe: 'haxe', ocaml: 'ocaml', fortran: 'fortran', 'fortran-free-form': 'fortran',
  racket: 'racket', purescript: 'purescript', gleam: 'gleam', nix: 'nix',
  wat: 'webassembly', wasm: 'webassembly', latex: 'latex', tex: 'latex',
  bibtex: 'latex', asciidoc: 'asciidoc', 'git-commit': 'git', 'git-rebase': 'git',
  ignore: 'git', csv: 'csv', tsv: 'csv',
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
  const theme = {
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

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(theme, null, 2) + '\n', 'utf8');
  console.log(
    `       wrote icons/theme/${path.basename(manifestPath)} ` +
      `(${Object.keys(iconDefinitions).length} definitions)`
  );
}
