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

const key = (kind: string, name: string): string => `_${kind}_${name.replace(/-/g, '_')}`;

const F = (name: string): string => key('file', name);
const D = (name: string): string => key('folder', name);

/* Folder name -> folder icon. */
const folderNames = {
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
const fileExtensions = {
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
  ico: 'image', bmp: 'image', svg: 'image', avif: 'image', tiff: 'image',
  ttf: 'font', otf: 'font', woff: 'font', woff2: 'font', eot: 'font',
  mp3: 'audio', wav: 'audio', flac: 'audio', ogg: 'audio', m4a: 'audio', aac: 'audio',
  mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video',
  zip: 'archive', tar: 'archive', gz: 'archive', rar: 'archive', '7z': 'archive', bz2: 'archive', xz: 'archive',
  pdf: 'pdf', doc: 'word', docx: 'word', rtf: 'word',
  xls: 'excel', xlsx: 'excel', csv: 'csv', tsv: 'csv', ppt: 'powerpoint', pptx: 'powerpoint',
  exe: 'binary', dll: 'binary', so: 'binary', dylib: 'binary', bin: 'binary', o: 'binary', wasm: 'binary',
  vim: 'vim', diff: 'diff', patch: 'diff', txt: 'text', lock: 'lock',

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
const fileNames = {
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
  'vite.config.js': 'vite', 'vite.config.ts': 'vite', 'vitest.config.ts': 'vite',
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
  '.travis.yml': 'ci', '.circleci': 'ci', '.gitlab-ci.yml': 'gitlabci',
  'azure-pipelines.yml': 'azure', '.vimrc': 'vim', '.nvmrc': 'text',
  '.env': 'env', '.env.local': 'env', '.env.development': 'env', '.env.production': 'env', '.env.example': 'env',
  'go.mod': 'go', 'go.sum': 'go', 'cargo.toml': 'rust', 'cargo.lock': 'rust',
  'gemfile': 'ruby', 'rakefile': 'ruby', 'requirements.txt': 'python', 'pyproject.toml': 'python',
  'composer.json': 'php', 'composer.lock': 'php',
} satisfies Record<string, FileIcon>;

/* VS Code language id -> file icon, for files with no recognisable extension. */
const languageIds = {
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
} satisfies Record<string, FileIcon>;

export type BuildThemeOptions = {
  /** The file icons the build just wrote. */
  files: FileIcon[];
  /** The folder icons the build just wrote. */
  folders: FolderIcon[];
  /** Absolute path of the manifest to emit. */
  out: string;
  /** Directory under icons/ the variant's SVGs live in. */
  svgDir: string;
};

type IconDefinitions = Record<string, { iconPath: string }>;
type IconMap = Record<string, string>;

export default function buildTheme({ files, folders, out, svgDir }: BuildThemeOptions): void {
  const fileSet: Set<string> = new Set(files);
  const folderSet: Set<string> = new Set(folders);

  const iconDefinitions: IconDefinitions = {};
  for (const name of files) iconDefinitions[F(name)] = { iconPath: `../${svgDir}/file-${name}.svg` };
  iconDefinitions._folder = { iconPath: `../${svgDir}/folder.svg` };
  iconDefinitions._folder_open = { iconPath: `../${svgDir}/folder-open.svg` };
  for (const name of folders) {
    iconDefinitions[D(name)] = { iconPath: `../${svgDir}/folder-${name}.svg` };
    iconDefinitions[`${D(name)}_open`] = { iconPath: `../${svgDir}/folder-${name}-open.svg` };
  }

  const mapFiles = (table: Record<string, string>, what: string): IconMap => {
    const out: IconMap = {};
    for (const [k, v] of Object.entries(table)) {
      if (!fileSet.has(v)) throw new Error(`${what}["${k}"] points at missing file icon "${v}"`);
      out[k] = F(v);
    }
    return out;
  };

  const folderMap: IconMap = {};
  const folderMapOpen: IconMap = {};
  for (const [k, v] of Object.entries(folderNames)) {
    if (!folderSet.has(v)) throw new Error(`folderNames["${k}"] points at missing folder icon "${v}"`);
    folderMap[k] = D(v);
    folderMapOpen[k] = `${D(v)}_open`;
  }

  const theme = {
    iconDefinitions,
    folder: '_folder',
    folderExpanded: '_folder_open',
    rootFolder: '_folder',
    rootFolderExpanded: '_folder_open',
    file: F('text'),
    folderNames: folderMap,
    folderNamesExpanded: folderMapOpen,
    fileExtensions: mapFiles(fileExtensions, 'fileExtensions'),
    fileNames: mapFiles(fileNames, 'fileNames'),
    languageIds: mapFiles(languageIds, 'languageIds'),
  };

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(theme, null, 2) + '\n', 'utf8');
  console.log(`       wrote icons/theme/${path.basename(out)} (${Object.keys(iconDefinitions).length} definitions)`);
}
