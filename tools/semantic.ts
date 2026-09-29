/*
 * Semantic highlighting, resolved the way VS Code resolves it.
 *
 * A semantic token is a type and a set of modifiers — `property.readonly` —
 * that a language server sends for a range of the text. VS Code turns it into
 * a style in two passes, and the second is where a theme gets surprised:
 *
 *   1. Every `semanticTokenColors` selector that matches scores: 10 for the
 *      language, 100 for the type (less one for each step up the type's
 *      supertypes — a C# `field` is a `property`), 100 for each modifier.
 *      Each ATTRIBUTE — foreground, bold, italic, underline, strikethrough —
 *      is taken from the highest-scoring selector that sets it; ties go to the
 *      later selector.
 *   2. Every attribute still unset is looked for in the fallback TextMate
 *      scopes registered for the type — `entity.name.function` for a
 *      `function`, and whatever a language extension adds for its own types —
 *      resolved against the theme's TextMate rules by prefix, one scope at a
 *      time.
 *
 * What comes out overrides the TextMate token attribute by attribute: an
 * attribute neither pass set leaves the TextMate colouring alone. So a
 * semantic rule that says nothing about bold keeps whatever bold TextMate
 * gave, and one whose fallback lands on the declaration rule is bold where it
 * should not be — which is how an overloaded C# operator came out blue and
 * bold before M9.
 *
 * The algorithm is VS Code's own (ColorThemeData.getTokenStyle and
 * resolveScopes, TokenClassificationRegistry.parseTokenSelector, 1.139),
 * transcribed rather than approximated, because an approximation of it is
 * exactly what a theme author already has in their head.
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/** A colour a word can be expected to be: a syntax ink, or body or comment text. */
export type Role =
  | 'variable' | 'property' | 'operator' | 'keyword' | 'generic' | 'string'
  | 'function' | 'number' | 'type' | 'interface' | 'enumMember'
  | 'normal' | 'muted';

/** Bold italic, bold, italic, or neither. */
export type Style = 'bi' | 'b' | 'i' | '';

export type SemanticStyle = {
  foreground?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

type Settings = { foreground?: string; fontStyle?: string };

export type SemanticTheme = {
  tokenColors: { scope?: string | string[]; settings: Settings }[];
  semanticTokenColors: Record<string, Settings | string>;
};

/* -------------------------------------------------------------- *
 * The registry
 * -------------------------------------------------------------- */

/*
 * Supertypes. VS Code's own `member` is the deprecated name of `method`; the
 * rest are what the C# extension declares for the types it adds
 * (ms-dotnettools.csharp 2.160, `semanticTokenTypes`). Types are registered
 * globally, so these hold in every language.
 */
const SUPER_TYPES: Record<string, string> = {
  member: 'method',
  controlKeyword: 'keyword',
  recordClass: 'class',
  recordStruct: 'struct',
  delegate: 'method',
  module: 'namespace',
  field: 'property',
  constant: 'variable',
  extensionMethod: 'method',
  stringVerbatim: 'string',
  stringEscapeCharacter: 'string',
};

const hierarchyOf = (type: string): string[] => {
  const chain: string[] = [type];
  while (SUPER_TYPES[chain[chain.length - 1]]) chain.push(SUPER_TYPES[chain[chain.length - 1]]);
  return chain;
};

type Selector = { type: string; modifiers: string[]; language?: string };

const parseSelector = (selector: string): Selector => {
  const [body, language] = selector.split(':');
  const [type, ...modifiers] = body.split('.');
  return { type, modifiers, language };
};

/** VS Code's score for a selector against a token, or -1. */
const scoreOf = (selector: Selector, type: string, modifiers: string[], language: string): number => {
  let score = 0;
  if (selector.language !== undefined) {
    if (selector.language !== language) return -1;
    score += 10;
  }
  if (selector.type !== '*') {
    const step: number = hierarchyOf(type).indexOf(selector.type);
    if (step === -1) return -1;
    score += 100 - step;
  }
  for (const modifier of selector.modifiers) if (!modifiers.includes(modifier)) return -1;
  return score + selector.modifiers.length * 100;
};

/*
 * The fallback scopes, in registration order: VS Code's (its
 * tokenClassificationRegistry), then the C# extension's `semanticTokenScopes`
 * for `csharp`, which register as `type:csharp`. Only the entries a C# file
 * can produce are transcribed; the Razor and embedded-language ones are not.
 */
type DefaultRule = { selector: Selector; probes: string[] };

const defaults = (entries: [string, string[]][]): DefaultRule[] =>
  entries.map(([selector, probes]): DefaultRule => ({ selector: parseSelector(selector), probes }));

const DEFAULT_RULES: DefaultRule[] = defaults([
  ['comment', ['comment']],
  ['string', ['string']],
  ['keyword', ['keyword.control']],
  ['number', ['constant.numeric']],
  ['regexp', ['constant.regexp']],
  ['operator', ['keyword.operator']],
  ['namespace', ['entity.name.namespace']],
  ['type', ['entity.name.type', 'support.type']],
  ['struct', ['entity.name.type.struct']],
  ['class', ['entity.name.type.class', 'support.class']],
  ['interface', ['entity.name.type.interface']],
  ['enum', ['entity.name.type.enum']],
  ['typeParameter', ['entity.name.type.parameter']],
  ['function', ['entity.name.function', 'support.function']],
  ['method', ['entity.name.function.member', 'support.function']],
  ['macro', ['entity.name.function.preprocessor']],
  ['variable', ['variable.other.readwrite', 'entity.name.variable']],
  ['parameter', ['variable.parameter']],
  ['property', ['variable.other.property']],
  ['enumMember', ['variable.other.enummember']],
  ['event', ['variable.other.event']],
  ['decorator', ['entity.name.decorator', 'entity.name.function']],
  ['variable.readonly', ['variable.other.constant']],
  ['property.readonly', ['variable.other.constant.property']],
  ['type.defaultLibrary', ['support.type']],
  ['class.defaultLibrary', ['support.class']],
  ['interface.defaultLibrary', ['support.class']],
  ['variable.defaultLibrary', ['support.variable', 'support.other.variable']],
  ['variable.defaultLibrary.readonly', ['support.constant']],
  ['property.defaultLibrary', ['support.variable.property']],
  ['property.defaultLibrary.readonly', ['support.constant.property']],
  ['function.defaultLibrary', ['support.function']],
  ['member.defaultLibrary', ['support.function']],
  ['typeParameter:csharp', ['entity.name.type.type-parameter']],
  ['keyword:csharp', ['keyword.cs']],
  ['excludedCode:csharp', ['support.other.excluded.cs']],
  ['controlKeyword:csharp', ['keyword.control.cs']],
  ['operatorOverloaded:csharp', ['entity.name.function.member.overload.cs']],
  ['preprocessorText:csharp', ['meta.preprocessor.string.cs']],
  ['punctuation:csharp', ['punctuation.cs']],
  ['stringVerbatim:csharp', ['string.verbatim.cs']],
  ['stringEscapeCharacter:csharp', ['constant.character.escape.cs']],
  ['delegate:csharp', ['entity.name.type.delegate.cs']],
  ['module:csharp', ['entity.name.type.module.cs']],
  ['field:csharp', ['entity.name.variable.field.cs']],
  ['constant:csharp', ['variable.other.constant']],
  ['extensionMethod:csharp', ['entity.name.function.extension.cs']],
]);

/* -------------------------------------------------------------- *
 * Resolution
 * -------------------------------------------------------------- */

const ATTRIBUTES = ['foreground', 'bold', 'italic', 'underline', 'strikethrough'] as const;
type Attribute = (typeof ATTRIBUTES)[number];

/** A style as VS Code reads `{ foreground, fontStyle }`: a fontStyle string sets all four flags. */
const fromSettings = ({ foreground, fontStyle }: Settings): SemanticStyle => ({
  foreground,
  ...(fontStyle === undefined
    ? {}
    : {
        bold: fontStyle.includes('bold'),
        italic: fontStyle.includes('italic'),
        underline: fontStyle.includes('underline'),
        strikethrough: fontStyle.includes('strikethrough'),
      }),
});

/** A single scope against the theme's TextMate rules, by VS Code's prefix scoring. */
const resolveScopes = (theme: SemanticTheme, probes: string[]): SemanticStyle | undefined => {
  for (const probe of probes) {
    let foreground: string | undefined;
    let fontStyle: string | undefined;
    let foregroundScore = -1;
    let fontScore = -1;
    for (const rule of theme.tokenColors) {
      const selectors: string[] = rule.scope === undefined ? [] : Array.isArray(rule.scope) ? rule.scope : rule.scope.split(',');
      let score = -1;
      for (const selector of selectors.map((candidate: string): string => candidate.trim())) {
        // A descendant selector needs a scope path; a single probe never has one.
        if (selector.includes(' ')) continue;
        if (probe === selector || probe.startsWith(`${selector}.`)) score = Math.max(score, 65536 + selector.length);
      }
      if (score < 0) continue;
      if (rule.settings.foreground && score >= foregroundScore) {
        foreground = rule.settings.foreground;
        foregroundScore = score;
      }
      if (typeof rule.settings.fontStyle === 'string' && score >= fontScore) {
        fontStyle = rule.settings.fontStyle;
        fontScore = score;
      }
    }
    if (foreground !== undefined || fontStyle !== undefined) return fromSettings({ foreground, fontStyle });
  }
  return undefined;
};

/** The style VS Code gives a semantic token in a theme, or undefined where it leaves TextMate alone. */
export const resolveSemanticStyle = (
  theme: SemanticTheme,
  type: string,
  modifiers: string[],
  language: string
): SemanticStyle | undefined => {
  const result: SemanticStyle = {};
  const best: Record<Attribute, number> = { foreground: -1, bold: -1, italic: -1, underline: -1, strikethrough: -1 };
  const take = (score: number, style: SemanticStyle): void => {
    if (style.foreground && best.foreground <= score) {
      best.foreground = score;
      result.foreground = style.foreground;
    }
    for (const attribute of ['bold', 'italic', 'underline', 'strikethrough'] as const) {
      if (style[attribute] !== undefined && best[attribute] <= score) {
        best[attribute] = score;
        result[attribute] = style[attribute];
      }
    }
  };

  for (const [selector, value] of Object.entries(theme.semanticTokenColors)) {
    const score: number = scoreOf(parseSelector(selector), type, modifiers, language);
    if (score >= 0) take(score, typeof value === 'string' ? { foreground: value } : fromSettings(value));
  }
  for (const attribute of ATTRIBUTES) if (best[attribute] !== -1) best[attribute] = Number.MAX_VALUE;
  for (const rule of DEFAULT_RULES) {
    const score: number = scoreOf(rule.selector, type, modifiers, language);
    if (score < 0) continue;
    const style: SemanticStyle | undefined = resolveScopes(theme, rule.probes);
    if (style) take(score, style);
  }

  return ATTRIBUTES.some((attribute: Attribute): boolean => result[attribute] !== undefined) ? result : undefined;
};

/* -------------------------------------------------------------- *
 * TypeScript, for real
 * -------------------------------------------------------------- */

export type SemanticToken = { start: number; end: number; type: string; modifiers: string[] };

/*
 * The legend VS Code's TypeScript extension reads TypeScript's 2020 encoding
 * with: TypeScript's own `member` is VS Code's `method`.
 */
const TYPESCRIPT_TYPES = ['class', 'enum', 'interface', 'namespace', 'typeParameter', 'type', 'parameter', 'variable', 'enumMember', 'property', 'function', 'method'];
const TYPESCRIPT_MODIFIERS = ['declaration', 'static', 'async', 'readonly', 'defaultLibrary', 'local'];
const TYPE_OFFSET = 8;
const MODIFIER_MASK = (1 << TYPE_OFFSET) - 1;

/** The semantic tokens VS Code's TypeScript extension would receive for a file. */
export const typescriptSemanticTokens = (file: string, code: string): SemanticToken[] => {
  const fileName: string = file.replace(/\\/g, '/');
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.Preserve,
    allowJs: true,
    strict: true,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  };
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: (): string[] => [fileName],
    getScriptVersion: (): string => '1',
    getScriptSnapshot: (name: string): ts.IScriptSnapshot | undefined =>
      name === fileName ? ts.ScriptSnapshot.fromString(code) : fs.existsSync(name) ? ts.ScriptSnapshot.fromString(fs.readFileSync(name, 'utf8')) : undefined,
    getCurrentDirectory: (): string => path.dirname(fileName),
    getCompilationSettings: (): ts.CompilerOptions => options,
    getDefaultLibFileName: (compilerOptions: ts.CompilerOptions): string => ts.getDefaultLibFilePath(compilerOptions),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
  const service: ts.LanguageService = ts.createLanguageService(host);
  const { spans } = service.getEncodedSemanticClassifications(
    fileName,
    { start: 0, length: code.length },
    ts.SemanticClassificationFormat.TwentyTwenty
  );
  const tokens: SemanticToken[] = [];
  for (let index = 0; index < spans.length; index += 3) {
    const [start, length, classification] = [spans[index], spans[index + 1], spans[index + 2]];
    const type: string | undefined = TYPESCRIPT_TYPES[(classification >> TYPE_OFFSET) - 1];
    if (!type) continue;
    const modifierSet: number = classification & MODIFIER_MASK;
    const modifiers: string[] = TYPESCRIPT_MODIFIERS.filter((_modifier: string, bit: number): boolean => (modifierSet & (1 << bit)) !== 0);
    tokens.push({ start, end: start + length, type, modifiers });
  }
  service.dispose();
  return tokens;
};

/*
 * Where a language server repaints a keyword and no theme can say otherwise:
 * a semantic selector sees a type and modifiers, never the text. Each is a
 * word, the type the server sends for it, and why it stands.
 */
export const SERVER_DECISIONS: [text: string, type: string, reason: string][] = [
  ['const', 'type', 'TypeScript sends the `const` of `as const` as a type, so VS Code draws it as one, in every theme'],
];

/* -------------------------------------------------------------- *
 * The other servers, from what they send
 * -------------------------------------------------------------- */

export type ServerToken = { language: string; type: string; modifiers: string[]; role: Role; style: Style | 'inherit' };

const server = (language: string, rows: [selector: string, role: Role, style: Style | 'inherit'][]): ServerToken[] =>
  rows.map(([selector, role, style]): ServerToken => {
    const [type, ...modifiers] = selector.split('.');
    return { language, type, modifiers, role, style };
  });

/*
 * The token types and modifiers each server sends, and the role each has to
 * land on — the same role its TextMate scope has, which is the point. C# is
 * Roslyn through ms-dotnettools.csharp; Python is Pylance; Rust is
 * rust-analyzer; Go is gopls; Java is the Red Hat language server. `inherit`
 * is an attribute the resolution leaves to TextMate on purpose: a string's
 * italics are the grammar's business.
 *
 * Roslyn sends no `declaration` modifier, so with semantic highlighting on a
 * C# method is drawn the same where it is declared and where it is called —
 * plain. The C# grammar cannot tell the two apart either (both are
 * `entity.name.function.cs`, so without semantic tokens both are bold). No
 * rule a theme can write distinguishes them; this table records what C# gets.
 */
export const SERVER_TOKENS: ServerToken[] = [
  ...server('csharp', [
    ['namespace', 'normal', ''],
    ['class', 'type', 'b'],
    ['class.static', 'type', 'i'],
    ['recordClass', 'type', 'b'],
    ['struct', 'type', 'b'],
    ['recordStruct', 'type', 'b'],
    ['interface', 'interface', ''],
    ['enum', 'interface', ''],
    ['enumMember', 'enumMember', ''],
    ['delegate', 'function', 'b'],
    ['typeParameter', 'generic', ''],
    ['field', 'property', ''],
    ['field.static', 'property', 'i'],
    ['field.readonly', 'property', ''],
    ['property', 'property', ''],
    ['property.static', 'property', 'i'],
    ['constant', 'enumMember', ''],
    ['event', 'function', ''],
    ['method', 'function', ''],
    ['method.static', 'function', 'i'],
    ['extensionMethod', 'function', ''],
    ['parameter', 'variable', 'i'],
    ['variable', 'variable', ''],
    ['keyword', 'keyword', 'bi'],
    ['controlKeyword', 'keyword', 'bi'],
    ['operator', 'operator', ''],
    ['operatorOverloaded', 'operator', ''],
    ['string', 'string', 'inherit'],
    ['stringEscapeCharacter', 'keyword', 'bi'],
    ['number', 'number', 'inherit'],
    ['punctuation', 'keyword', ''],
  ]),
  ...server('python', [
    ['class', 'type', 'b'],
    ['class.declaration', 'type', 'b'],
    ['function', 'function', ''],
    ['function.declaration', 'function', 'b'],
    ['method', 'function', ''],
    ['method.declaration', 'function', 'b'],
    ['parameter', 'variable', 'i'],
    ['variable', 'variable', ''],
    ['variable.readonly', 'enumMember', ''],
    ['property', 'property', ''],
    ['decorator', 'number', 'i'],
    ['namespace', 'normal', ''],
    ['enumMember', 'enumMember', ''],
    ['typeParameter', 'generic', ''],
  ]),
  ...server('rust', [
    ['namespace', 'normal', ''],
    ['struct', 'type', 'b'],
    ['enum', 'interface', ''],
    ['enumMember', 'enumMember', ''],
    ['trait', 'interface', ''],
    ['typeAlias', 'type', ''],
    ['union', 'type', 'b'],
    ['builtinType', 'type', ''],
    ['typeParameter', 'generic', ''],
    ['lifetime', 'generic', ''],
    ['function', 'function', ''],
    ['function.declaration', 'function', 'b'],
    ['method', 'function', ''],
    ['method.declaration', 'function', 'b'],
    ['macro', 'function', ''],
    ['parameter', 'variable', 'i'],
    ['variable', 'variable', ''],
    ['property', 'property', ''],
    ['selfKeyword', 'keyword', 'bi'],
    ['boolean', 'keyword', 'bi'],
    ['attribute', 'number', 'i'],
    ['builtinAttribute', 'number', 'i'],
    ['derive', 'number', 'i'],
    ['escapeSequence', 'keyword', 'bi'],
    ['formatSpecifier', 'keyword', ''],
    ['keyword', 'keyword', 'bi'],
    ['operator', 'operator', ''],
  ]),
  ...server('go', [
    ['namespace', 'normal', ''],
    ['type', 'type', ''],
    ['type.defaultLibrary', 'type', ''],
    ['type.interface', 'interface', ''],
    ['typeParameter', 'generic', ''],
    ['function', 'function', ''],
    ['function.definition', 'function', 'b'],
    ['method', 'function', ''],
    ['method.definition', 'function', 'b'],
    ['function.defaultLibrary', 'function', ''],
    ['parameter', 'variable', 'i'],
    ['parameter.definition', 'variable', 'i'],
    ['variable', 'variable', ''],
    ['variable.readonly', 'enumMember', ''],
    ['keyword', 'keyword', 'bi'],
    ['operator', 'operator', ''],
  ]),
  ...server('java', [
    ['namespace', 'normal', ''],
    ['class', 'type', 'b'],
    ['record', 'type', 'b'],
    ['interface', 'interface', ''],
    ['enum', 'interface', ''],
    ['enumMember', 'enumMember', ''],
    ['annotation', 'number', 'i'],
    ['typeParameter', 'generic', ''],
    ['method', 'function', ''],
    ['method.declaration', 'function', 'b'],
    ['method.static', 'function', 'i'],
    ['property', 'property', ''],
    ['property.static', 'property', 'i'],
    ['recordComponent', 'property', ''],
    ['parameter', 'variable', 'i'],
    ['variable', 'variable', ''],
    ['modifier', 'keyword', 'bi'],
    ['keyword', 'keyword', 'bi'],
  ]),
];
