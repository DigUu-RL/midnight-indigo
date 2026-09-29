/*
 * The code the syntax colouring is held to, and the role each named word in
 * it has to land on. tools/check-syntax.ts runs it; tools/inventory.ts writes
 * it into docs/SYNTAX.md, where it is the per-language list of roles.
 */

import type { BundledLanguage } from 'shiki';
import type { Role, Style } from './semantic.ts';

export type ExpectOptions = {
  /** Which occurrence of the text, counting from 1. */
  nth?: number;
  /**
   * What TextMate alone gives the word, where a language server knows better.
   * For TypeScript the server's view is checked here too; for C# it is what
   * Roslyn was seen to send in VS Code, and only the TextMate view is checked.
   */
  textmate?: [Role, Style];
};

/** A word, the role it has to land on, and how it is drawn. */
export type Expectation = [text: string, role: Role, style: Style, options?: ExpectOptions];

export type CorpusFile = {
  /** Relative to tools/. */
  file: string;
  /** The Shiki language id. */
  lang: BundledLanguage;
  /** The VS Code language id, where TypeScript's semantic tokens are resolved for real. */
  typescript?: 'typescript' | 'typescriptreact' | 'javascript';
  expect: Expectation[];
};

/*
 * Every word named here was chosen because it is where a role is easiest to
 * lose: a declaration next to a use, a type inside a field, a keyword a grammar
 * scopes as a type. The roadmap's per-language checklist is this table.
 */
export const CORPUS: CorpusFile[] = [
  {
    file: 'corpus/typescript.ts',
    lang: 'typescript',
    typescript: 'typescript',
    expect: [
      ['import', 'keyword', 'bi'],
      ['type', 'keyword', 'bi'],
      ['Member', 'variable', ''],
      ['Member', 'interface', '', { nth: 3, textmate: ['generic', ''] }],
      ['namespace', 'keyword', 'bi'],
      ['Audit', 'normal', ''],
      ['Handler', 'type', ''],
      ['TEvent', 'generic', ''],
      ['extends', 'keyword', 'bi'],
      ['event', 'variable', 'i'],
      ['=>', 'operator', ''],
      ['function', 'keyword', 'bi'],
      ['Logged', 'function', 'b'],
      ['Registry', 'type', 'b'],
      ['T', 'generic', ''],
      ['static', 'keyword', 'bi'],
      ['readonly', 'keyword', 'bi'],
      ['shared', 'property', 'i', { textmate: ['property', ''] }],
      ['new', 'operator', ''],
      ['Registry', 'type', 'b', { nth: 2 }],
      ['Registry', 'type', 'b', { nth: 3, textmate: ['type', ''] }],
      ['Registry', 'type', 'b', { nth: 4 }],
      ['create', 'function', 'bi', { textmate: ['function', 'b'] }],
      ['entries', 'property', ''],
      ['Map', 'interface', '', { textmate: ['type', ''] }],
      ['handler', 'function', 'b', { textmate: ['property', ''] }],
      ['@', 'number', 'i'],
      ['find', 'function', 'b'],
      ['id', 'variable', 'i'],
      ['found', 'variable', ''],
      ['this', 'keyword', 'bi'],
      ['get', 'function', ''],
      ['?.', 'keyword', ''],
      ['role', 'property', ''],
      ['??', 'operator', ''],
      ['Roles', 'variable', ''],
      ['===', 'operator', ''],
      ['undefined', 'keyword', 'bi', { nth: 2 }],
      ['${', 'keyword', ''],
    ],
  },
  { file: 'corpus/members.ts', lang: 'typescript', typescript: 'typescript', expect: [['Member', 'interface', '']] },
  {
    file: 'corpus/components.tsx',
    lang: 'tsx',
    typescript: 'typescriptreact',
    expect: [
      ['export', 'keyword', 'bi'],
      ['default', 'keyword', 'bi'],
      ['function', 'keyword', 'bi'],
      ['Badge', 'function', 'b'],
      ['span', 'type', ''],
      ['const', 'keyword', 'bi'],
      ['=', 'operator', '', { nth: 2 }],
      ['=>', 'operator', ''],
      ['memo', 'function', '', { nth: 2 }],
      ['class', 'keyword', 'bi'],
      ['Legacy', 'type', 'b'],
      ['extends', 'keyword', 'bi'],
      ['Component', 'type', 'b', { nth: 2 }],
      ['render', 'function', 'b'],
    ],
  },
  {
    file: 'corpus/csharp.cs',
    lang: 'csharp',
    expect: [
      ['using', 'keyword', 'bi'],
      ['System', 'normal', ''],
      ['Serializable', 'type', 'b', { textmate: ['type', ''] }],
      ['record', 'keyword', 'bi'],
      ['struct', 'keyword', 'bi'],
      ['Point', 'type', 'b'],
      ['X', 'variable', 'i'],
      ['Max', 'property', 'i', { textmate: ['property', ''] }],
      ['Width', 'property', ''],
      ['init', 'keyword', 'bi'],
      ['Describe', 'function', 'i', { textmate: ['function', 'b'] }],
      ['T', 'generic', ''],
      ['shape', 'variable', 'i'],
      ['where', 'keyword', 'bi'],
      ['switch', 'keyword', 'bi'],
      ['p', 'variable', ''],
      ['when', 'keyword', 'bi'],
      ['??', 'operator', ''],
      ['+', 'operator', '', { nth: 2 }],
    ],
  },
  {
    file: 'corpus/python.py',
    lang: 'python',
    expect: [
      ['import', 'keyword', 'bi'],
      ['@', 'number', 'i'],
      ['dataclass', 'number', 'i', { nth: 2 }],
      ['class', 'keyword', 'bi'],
      ['Point', 'type', 'b'],
      ['int', 'type', ''],
      ['__add__', 'function', ''],
      ['self', 'variable', 'i'],
      ['x', 'property', '', { nth: 3 }],
      ['yield', 'keyword', 'bi'],
      ['async', 'keyword', 'bi'],
      ['await', 'keyword', 'bi'],
      ['sleep', 'function', ''],
      ['len', 'function', ''],
      ['None', 'keyword', 'bi'],
    ],
  },
  {
    file: 'corpus/rust.rs',
    lang: 'rust',
    expect: [
      ['mod', 'keyword', 'bi'],
      ['shapes', 'normal', ''],
      ['trait', 'keyword', 'bi'],
      ['Shape', 'interface', ''],
      ['Unit', 'type', ''],
      ['self', 'keyword', 'bi'],
      ['Square', 'type', 'b'],
      ["'a", 'generic', ''],
      ['u32', 'number', ''],
      ['impl', 'keyword', 'bi'],
      ['area', 'function', 'b'],
      ['macro_rules!', 'function', ''],
      ['format!', 'function', ''],
      ['Some', 'enumMember', ''],
      ['let', 'keyword', 'bi'],
      ['square', 'variable', ''],
    ],
  },
  {
    file: 'corpus/go.go',
    lang: 'go',
    expect: [
      ['package', 'keyword', 'bi'],
      ['corpus', 'normal', ''],
      ['ID', 'type', ''],
      ['string', 'type', ''],
      ['Low', 'enumMember', ''],
      ['iota', 'keyword', 'bi'],
      ['Stack', 'type', ''],
      ['any', 'type', ''],
      ['items', 'property', ''],
      ['interface', 'keyword', 'bi'],
      ['Push', 'function', 'b'],
      ['s', 'variable', 'i'],
      ['append', 'function', ''],
      ['make', 'function', ''],
      [':=', 'operator', ''],
    ],
  },
  {
    file: 'corpus/java.java',
    lang: 'java',
    expect: [
      ['package', 'keyword', 'bi'],
      ['workspace', 'normal', ''],
      ['List', 'normal', ''],
      ['record', 'keyword', 'bi'],
      ['Point', 'type', 'b'],
      ['int', 'type', ''],
      ['FunctionalInterface', 'number', 'i'],
      ['Shape', 'type', 'b'],
      ['String', 'type', ''],
      ['Override', 'number', 'i'],
      ['List', 'type', '', { nth: 2 }],
      ['Point', 'generic', '', { nth: 2 }],
      ['toString', 'function', 'b'],
      ['size', 'function', ''],
    ],
  },
  {
    file: 'corpus/kotlin.kt',
    lang: 'kotlin',
    expect: [
      ['package', 'keyword', 'bi'],
      ['data', 'keyword', 'bi'],
      ['Point', 'type', 'b'],
      ['Int', 'type', ''],
      ['@JvmInline', 'number', 'i'],
      ['fun', 'keyword', 'bi'],
      ['largest', 'function', 'b'],
      ['maxOf', 'function', ''],
      ['override', 'keyword', 'bi'],
    ],
  },
  {
    file: 'corpus/styles.css',
    lang: 'css',
    expect: [
      ['--accent', 'variable', ''],
      ['6c5ce7', 'number', ''],
      ['calc', 'function', ''],
      ['1rem', 'number', ''],
      ['main', 'type', ''],
      ['card', 'property', 'i'],
      ['hover', 'property', 'i'],
      ['color', 'property', ''],
      ['var', 'function', ''],
      ['sans-serif', 'enumMember', ''],
      ['ease-in-out', 'enumMember', ''],
      ['media', 'keyword', 'bi'],
      ['min-width', 'property', ''],
      ['grid', 'enumMember', ''],
    ],
  },
  {
    file: 'corpus/queries.sql',
    lang: 'sql',
    expect: [
      ['SELECT', 'keyword', 'bi'],
      ['m', 'type', ''],
      ['id', 'property', ''],
      ['COUNT', 'function', ''],
      ['<>', 'operator', ''],
      ['owner', 'string', ''],
      ['2', 'number', ''],
      ['@role', 'variable', 'i'],
    ],
  },
  {
    file: 'corpus/front-matter.md',
    lang: 'markdown',
    expect: [
      ['Roles', 'type', 'b', { nth: 2 }],
      ['the ADR', 'function', ''],
      ['Role.Owner', 'enumMember', ''],
    ],
  },
  {
    file: 'samples/sample.ts',
    lang: 'typescript',
    typescript: 'typescript',
    expect: [
      ['Role', 'interface', ''],
      ['Owner', 'enumMember', ''],
      ['id', 'property', '', { textmate: ['property', ''] }],
      ['role', 'property', '', { nth: 2 }],
      ['Role', 'interface', '', { nth: 2, textmate: ['type', ''] }],
      ['Date', 'interface', '', { textmate: ['type', ''] }],
      ['MemberService', 'type', 'b'],
      ['cache', 'property', ''],
      ['Map', 'type', 'b'],
      ['promote', 'function', 'b'],
      ['Promise', 'interface', '', { textmate: ['type', ''] }],
      ['NotFoundError', 'type', 'b'],
    ],
  },
  {
    file: 'samples/sample.tsx',
    lang: 'tsx',
    typescript: 'typescriptreact',
    expect: [
      ['export', 'keyword', 'bi'],
      ['function', 'keyword', 'bi'],
      ['MemberList', 'function', 'b'],
      ['Avatar', 'type', 'b', { nth: 3 }],
      ['section', 'type', ''],
      ['input', 'type', ''],
    ],
  },
  {
    file: 'samples/sample.js',
    lang: 'javascript',
    typescript: 'javascript',
    expect: [['ok', 'property', '']],
  },
  { file: 'samples/sample.cs', lang: 'csharp', expect: [['Member', 'type', 'b', { nth: 2, textmate: ['type', ''] }], ['_repo', 'property', '']] },
  { file: 'samples/sample.py', lang: 'python', expect: [['OWNER', 'enumMember', ''], ['role', 'property', '', { nth: 4 }]] },
  { file: 'samples/sample.go', lang: 'go', expect: [['members', 'normal', ''], ['Repository', 'type', '']] },
  { file: 'samples/sample.rs', lang: 'rust', expect: [['std', 'normal', ''], ['HashMap', 'type', ''], ['Ok', 'enumMember', '']] },
  { file: 'samples/sample.java', lang: 'java', expect: [] },
  { file: 'samples/sample.php', lang: 'php', expect: [['Owner', 'enumMember', '']] },
  { file: 'samples/sample.ps1', lang: 'powershell', expect: [] },
  { file: 'samples/sample.sql', lang: 'sql', expect: [['display_name', 'property', '']] },
  {
    file: 'samples/sample.scss',
    lang: 'scss',
    expect: [['$indigo', 'variable', ''], ['focus-ring', 'function', 'b'], ['outline', 'property', ''], ['solid', 'enumMember', ''], ['2px', 'number', ''], ['&', 'keyword', '']],
  },
  {
    file: 'samples/sample.html',
    lang: 'html',
    expect: [['html', 'type', '', { nth: 2 }], ['lang', 'property', 'i'], ['middot', 'keyword', 'bi']],
  },
  { file: 'samples/sample.yaml', lang: 'yaml', expect: [['name', 'property', ''], ['release', 'string', ''], ['runs-on', 'property', '']] },
  { file: 'samples/sample.sh', lang: 'bash', expect: [['-fsSL', 'variable', 'i'], ['curl', 'function', ''], ['readonly', 'keyword', 'bi']] },
  { file: 'samples/sample.md', lang: 'markdown', expect: [] },
  { file: 'samples/sample.json', lang: 'json', expect: [] },
];
