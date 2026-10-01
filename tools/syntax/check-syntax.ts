/*
 * Holds the syntax colouring to a real corpus, in all eight variants:
 *
 *   node tools/syntax/check-syntax.ts
 *
 * The theme build checks what a colour IS — its contrast, its distance from
 * its neighbours. It cannot check what a colour is FOR, because that depends
 * on which scope a grammar actually gives a word, and grammars are not
 * consistent: Java scopes a class name `storage.type.java`, which the keyword
 * rule catches; Python scopes `self.x` `meta.attribute.python`, which the
 * decorator rule caught; YAML scopes a key inside the scope of a string. None
 * of that is visible in the rules. It is only visible in tokenized code.
 *
 * So this tokenizes code — tools/syntax/samples/ (the screenshots) and tools/syntax/corpus/
 * (one file per language, written to reach every role the roadmap names) —
 * with Shiki, which is the same TextMate engine and the same grammars VS Code
 * ships, against the built themes, and checks four things.
 *
 *   ROLES      Named words land on the role written down for them below, in
 *              every family: `Registry` in `new Registry()` is the type colour
 *              in bold, whatever that colour is in green.
 *   INVARIANTS Over every token of every file: a keyword is the keyword
 *              colour in bold italic, an operator is the operator colour and
 *              nothing else, punctuation is never bold, and no scope that
 *              names something falls through every rule to plain text.
 *   SEMANTIC   Semantic highlighting, resolved the way VS Code resolves it —
 *              the selector scoring, the type hierarchy, the fallback to
 *              TextMate scopes, attribute by attribute (tools/syntax/semantic.ts).
 *              TypeScript is resolved for real, through the TypeScript
 *              language service; the other servers from a table of the tokens
 *              they send.
 *   AGREEMENT  Where TypeScript's semantic tokens repaint a word, the word is
 *              checked again in the repainted view: a role is expected to
 *              hold with semantic highlighting on and off, unless the
 *              expectation says what TextMate alone cannot know.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHighlighter, type ThemeRegistrationAny } from 'shiki';
import { CORPUS, type CorpusFile } from './syntax-corpus.ts';
import { FAMILY_ORDER, type Family } from '../theme/theme-palette.ts';
import { tokensFor, type Tokens } from '../theme/theme-tokens.ts';
import {
  SERVER_DECISIONS,
  SERVER_TOKENS,
  resolveSemanticStyle,
  typescriptSemanticTokens,
  type Role,
  type SemanticStyle,
  type SemanticTheme,
  type Style,
} from './semantic.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const ROOT: string = path.join(HERE, '..', '..');

/* -------------------------------------------------------------- *
 * Roles and styles
 * -------------------------------------------------------------- */

export const colourOf = (tokens: Tokens, role: Role): string =>
  role === 'normal' ? tokens.text.normal : role === 'muted' ? tokens.text.muted : tokens.syntax[role];

const SHIKI_ITALIC = 1;
const SHIKI_BOLD = 2;

const styleOfShiki = (fontStyle: number): Style =>
  `${fontStyle & SHIKI_BOLD ? 'b' : ''}${fontStyle & SHIKI_ITALIC ? 'i' : ''}` as Style;

/* -------------------------------------------------------------- *
 * Tokens
 * -------------------------------------------------------------- */

/** One scope-level piece of a line: what TextMate made of it, and where it is. */
type Piece = {
  start: number;
  end: number;
  text: string;
  scopes: string[];
  /** Whether any rule reached any of its scopes. */
  matched: boolean;
  colour: string;
  style: Style;
};

const readCorpus = (file: string): string => fs.readFileSync(path.join(HERE, file), 'utf8');

/** Where the nth occurrence of a word is, as whole-word matching where the word starts or ends in one. */
const locate = (code: string, text: string, nth: number): [number, number] | undefined => {
  const escaped: string = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const before: string = /^\w/.test(text) ? '(?<![\\w$-])' : '';
  const after: string = /\w$/.test(text) ? '(?![\\w-])' : '';
  const pattern = new RegExp(`${before}${escaped}${after}`, 'g');
  let found: RegExpExecArray | null = null;
  for (let count = 0; count < nth; count++) {
    found = pattern.exec(code);
    if (!found) return undefined;
  }
  return found ? [found.index, found.index + text.length] : undefined;
};

/** A semantic repaint of a piece: what it becomes where a semantic token covers it. */
const repaint = (piece: Piece, style: SemanticStyle | undefined): Piece => {
  if (!style) return piece;
  const bold: boolean = style.bold ?? piece.style.includes('b');
  const italic: boolean = style.italic ?? piece.style.includes('i');
  return {
    ...piece,
    colour: style.foreground ?? piece.colour,
    style: `${bold ? 'b' : ''}${italic ? 'i' : ''}` as Style,
  };
};

/* -------------------------------------------------------------- *
 * Invariants
 * -------------------------------------------------------------- */

/** Scopes that name a keyword. */
const KEYWORD_SCOPE = /^(keyword|storage\.type|storage\.modifier)(\.|$)/;

/*
 * Scopes a grammar files under keyword or storage that are not keywords, each
 * with the role the theme gives it instead. The rules for them are in the
 * theme; this is the list of what those rules had to take back.
 */
const NOT_KEYWORDS: RegExp[] = [
  /^keyword\.operator(\.|$)/, //                 operators
  /^keyword\.control\.ternary(\.|$)/, //         the ternary, where a grammar calls it control flow
  /^keyword\.other\.unit(\.|$)/, //              px, rem, ms: part of the number
  /^storage\.type\.function\.arrow(\.|$)/, //    =>
  /^storage\.type\.primitive(\.|$)/, //          int, double: types
  /^storage\.type\.(java|generic\.java|object\.array\.java)$/, //  Java's type names
  /^storage\.type\.(boolean|byte|error|numeric|rune|string|uintptr)\.go$/, // Go's built-in types
  /^storage\.type\.annotation(\.|$)/, //         @Override: an annotation
  /^storage\.modifier\.(import|package)\.java$/, // Java's package names
  /^storage\.modifier\.lifetime(\.|$)/, //       'a: a lifetime
];

/** Scopes that name something, and so must be reached by some rule. */
const NAMING_SCOPE = /^(entity|variable|support|constant|storage|keyword|string|comment)\./;

/*
 * Scopes a grammar names and the theme leaves to the editor's foreground on
 * purpose, with the reason. Anything else that reaches no rule is a gap.
 */
const LEFT_PLAIN: [scope: RegExp, reason: string][] = [
  [/^constant\.other\.php$/, "the `php` of `<?php` and the name in `declare(strict_types)`: directives, not values"],
];

const checkInvariants = (where: string, piece: Piece, tokens: Tokens): string[] => {
  const problems: string[] = [];
  const leaf: string = piece.scopes[piece.scopes.length - 1] ?? '';
  const inComment: boolean = piece.scopes.some((scope: string): boolean => scope.startsWith('comment'));
  const describe = (): string => `${where}: "${piece.text.trim()}" (${leaf})`;

  if (KEYWORD_SCOPE.test(leaf) && !NOT_KEYWORDS.some((pattern: RegExp): boolean => pattern.test(leaf)) && !inComment) {
    if (piece.colour !== tokens.syntax.keyword || piece.style !== 'bi') {
      problems.push(`${describe()} is a keyword drawn ${piece.colour} "${piece.style}", not the keyword colour in bold italic`);
    }
  }
  if (/^keyword\.operator(\.|$)/.test(leaf) || /^storage\.type\.function\.arrow(\.|$)/.test(leaf) || /^keyword\.control\.ternary(\.|$)/.test(leaf)) {
    if (piece.colour !== tokens.syntax.operator || piece.style !== '') {
      problems.push(`${describe()} is an operator drawn ${piece.colour} "${piece.style}", not the operator colour alone`);
    }
  }
  if (/^punctuation\./.test(leaf) && piece.style.includes('b')) {
    problems.push(`${describe()} is punctuation drawn bold`);
  }
  if (NAMING_SCOPE.test(leaf) && !piece.matched && !LEFT_PLAIN.some(([pattern]): boolean => pattern.test(leaf))) {
    problems.push(`${describe()} names something and no rule reaches it: it falls back to the foreground`);
  }
  return problems;
};

/* -------------------------------------------------------------- *
 * Run
 * -------------------------------------------------------------- */

type BuiltTheme = ThemeRegistrationAny & SemanticTheme & { name: string; colors: Record<string, string> };

const themeOf = (family: Family): BuiltTheme =>
  JSON.parse(fs.readFileSync(path.join(ROOT, 'themes', `midnight-${family}-color-theme.json`), 'utf8')) as BuiltTheme;

const main = async (): Promise<string[]> => {
  const problems: string[] = [];
  const themes: Record<Family, BuiltTheme> = Object.fromEntries(
    FAMILY_ORDER.map((family: Family): [Family, BuiltTheme] => [family, themeOf(family)])
  ) as Record<Family, BuiltTheme>;

  /*
   * The extension's own injection, as the preview loads it: `injectTo`
   * has to name the target scopes, which are read out of each grammar's
   * injectionSelector (tools/preview/build-theme-preview.ts says why).
   */
  const injections = ['csharp-delegates'].map((file: string) => {
    const grammar = JSON.parse(fs.readFileSync(path.join(ROOT, 'injections', `${file}.tmLanguage.json`), 'utf8'));
    const scopes: string[] = (grammar.injectionSelector as string).split(',').map((scope: string): string => scope.trim().replace(/^L:/, ''));
    return { ...grammar, name: `midnight-indigo-${file}`, injectTo: scopes };
  });
  const highlighter = await createHighlighter({
    themes: FAMILY_ORDER.map((family: Family): BuiltTheme => themes[family]),
    langs: [...new Set(CORPUS.map((entry: CorpusFile): string => entry.lang)), ...injections],
  });

  /* The files nobody lists would be files nobody checks. */
  const listed: Set<string> = new Set(CORPUS.map((entry: CorpusFile): string => entry.file));
  for (const folder of ['samples', 'corpus']) {
    for (const file of fs.readdirSync(path.join(HERE, folder))) {
      if (!listed.has(`${folder}/${file}`)) problems.push(`tools/syntax/${folder}/${file} is not in CORPUS, so nothing checks it`);
    }
  }

  const semanticTokensOf = new Map<string, ReturnType<typeof typescriptSemanticTokens>>();
  for (const entry of CORPUS) {
    if (entry.typescript) semanticTokensOf.set(entry.file, typescriptSemanticTokens(path.join(HERE, entry.file), readCorpus(entry.file)));
  }

  for (const family of FAMILY_ORDER) {
    const tokens: Tokens = tokensFor(family);
    const theme: BuiltTheme = themes[family];

    for (const entry of CORPUS) {
      const code: string = readCorpus(entry.file);
      const lines = highlighter.codeToTokensBase(code, { lang: entry.lang, theme, includeExplanation: true });
      const pieces: Piece[] = [];
      for (const line of lines) {
        for (const token of line) {
          let offset: number = token.offset;
          for (const part of token.explanation ?? []) {
            pieces.push({
              start: offset,
              end: offset + part.content.length,
              text: part.content,
              scopes: part.scopes.map((scope): string => scope.scopeName),
              matched: part.scopes.some((scope): boolean => (scope.themeMatches?.length ?? 0) > 0),
              colour: (token.color ?? '').toUpperCase(),
              style: styleOfShiki(token.fontStyle ?? 0),
            });
            offset += part.content.length;
          }
        }
      }

      /* With semantic highlighting on, where TypeScript covers a piece. */
      const semantic = semanticTokensOf.get(entry.file) ?? [];
      const serverDecided: Set<Piece> = new Set();
      const semanticPieces: Piece[] = pieces.map((piece: Piece): Piece => {
        const covering = semantic.find((token): boolean => token.start <= piece.start && piece.end <= token.end);
        if (!covering || !entry.typescript) return piece;
        const repainted: Piece = repaint(piece, resolveSemanticStyle(theme, covering.type, covering.modifiers, entry.typescript));
        if (SERVER_DECISIONS.some(([text, type]): boolean => piece.text.trim() === text && covering.type === type)) serverDecided.add(repainted);
        return repainted;
      });

      const where = `${family}: ${entry.file}`;
      for (const piece of pieces) if (piece.text.trim()) problems.push(...checkInvariants(`${where} [TextMate]`, piece, tokens));
      if (entry.typescript) {
        for (const piece of semanticPieces) {
          if (piece.text.trim() && !serverDecided.has(piece)) problems.push(...checkInvariants(`${where} [semantic]`, piece, tokens));
        }
      }

      for (const [text, role, style, options = {}] of entry.expect) {
        const range = locate(code, text, options.nth ?? 1);
        if (!range) {
          problems.push(`${where}: expects "${text}" (#${options.nth ?? 1}), which is not in the file`);
          continue;
        }
        const views: [string, Piece[], Role, Style][] = entry.typescript
          ? [
              ['semantic', semanticPieces, role, style],
              ['TextMate', pieces, ...(options.textmate ?? [role, style])],
            ]
          : [['TextMate', pieces, ...(options.textmate ?? [role, style])]];
        for (const [view, viewPieces, wantRole, wantStyle] of views) {
          const covered: Piece[] = viewPieces.filter((piece: Piece): boolean => piece.start < range[1] && range[0] < piece.end && piece.text.trim() !== '');
          const want: string = colourOf(tokens, wantRole);
          for (const piece of covered) {
            if (piece.colour !== want || piece.style !== wantStyle) {
              problems.push(
                `${where} [${view}]: "${text}" is ${piece.colour} "${piece.style}" (${piece.scopes[piece.scopes.length - 1]}), ` +
                  `expected ${wantRole} ${want} "${wantStyle}"`
              );
            }
          }
        }
      }
    }

    /* The servers VS Code cannot be asked here, from what they send. */
    for (const { language, type, modifiers, role, style } of SERVER_TOKENS) {
      const resolved: SemanticStyle | undefined = resolveSemanticStyle(theme, type, modifiers, language);
      const want: string = colourOf(tokens, role);
      const drawn: string = `${resolved?.bold ? 'b' : ''}${resolved?.italic ? 'i' : ''}`;
      const selector: string = [type, ...modifiers].join('.') + `:${language}`;
      if (resolved?.foreground !== want) {
        problems.push(`${family}: semantic ${selector} resolves to ${resolved?.foreground ?? 'nothing'}, expected ${role} ${want}`);
      }
      if (style !== 'inherit' && drawn !== style) {
        problems.push(`${family}: semantic ${selector} is drawn "${drawn}", expected "${style}"`);
      }
    }
  }
  return problems;
};

const problems: string[] = await main();
const unique: string[] = [...new Set(problems)];
if (unique.length) {
  for (const problem of unique.slice(0, 200)) console.error(`  ! ${problem}`);
  if (unique.length > 200) console.error(`  … and ${unique.length - 200} more`);
  throw new Error(`${unique.length} syntax problem(s)`);
}
console.log(`syntax: ${CORPUS.length} files, ${FAMILY_ORDER.length} families, ${SERVER_TOKENS.length} server tokens — all hold`);
