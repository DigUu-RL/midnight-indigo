/*
 * What the baseline is, and how a theme is compared against it.
 *
 * tools/theme/indigo-baseline.json is themes/midnight-indigo-color-theme.json exactly
 * as v3.0.0 shipped it — commit 6601ba7, the last one before the theme was
 * generated. Its bytes are that commit's bytes, which is what SHA256 below
 * pins: an edit to the baseline cannot slip through as a reformat, because it
 * changes the hash, and the hash lives in a .ts file that a reviewer reads.
 *
 * WHY THE COMPARISON IS NOT OF THE RAW FILES. The shipped file was formatted by
 * hand, and not consistently — some arrays that fit on a line are broken over
 * four, some that do not fit are left on one — so no serializer reproduces its
 * whitespace, and one written to would be a copy of the file with extra steps.
 * What the build CAN guarantee byte for byte is the thing it writes:
 * `serialize(baseline)` is compared against `serialize(built)`, the exact bytes
 * that land in themes/, which covers every key, every value and every key's
 * position. The only thing that does not survive a parse is a duplicated key —
 * JSON.parse keeps the last one and says nothing — so `duplicateKeys` looks
 * for those in the raw text first.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const BASELINE = {
  file: path.join(HERE, 'indigo-baseline.json'),
  sha256: '1dfdc462e3e79b468ad8bef9872f2adce89c7847a2151b6f48f0723093115a66',
  commit: '6601ba7',
  version: '3.0.0',
} as const;

/*
 * Deliberate changes to what the baseline says.
 *
 * The file stays the bytes v3.0.0 shipped — that is what the hash above is for
 * — and a change to the shipped theme is written here instead: which key, what
 * it was, what it is now, and the milestone and reason. The build applies these
 * to the parsed baseline before comparing, and refuses one whose `was` is not
 * what the file actually says, so an amendment cannot quietly outlive the value
 * it replaced or be written against a key the baseline never had.
 */
export type Amendment = { key: string; was: string; now: string; by: string; why: string };

export const AMENDMENTS: Amendment[] = [
  {
    key: 'list.hoverBackground',
    was: '#0B0716',
    now: '#1C144066',
    by: 'M3',
    why: 'the row under the pointer was the ground of every floating list — the suggest widget, the quick pick, the code-action menu — and could not be seen there; it is now the focus ground as an overlay, which shows on every surface',
  },
  {
    key: 'list.inactiveSelectionBackground',
    was: '#0B0716',
    now: '#150F2C',
    by: 'M3',
    why: 'the selection of an unfocused list was the same colour as a hovered row; it now keeps the selection ground, and the focused list is told apart by its focus ring and brighter text',
  },
  {
    key: 'terminal.ansiRed',
    was: '#FF6AC1',
    now: '#F84A54',
    by: 'M6',
    why: "the terminal's red was the keyword pink, so a failed build printed in the colour code is written in, and in other families in a violet; it is now the error, the colour of the squiggle",
  },
  {
    key: 'terminal.ansiBrightRed',
    was: '#FF8FD1',
    now: '#FF898B',
    by: 'M6',
    why: 'the same, lighter',
  },
  {
    key: 'terminal.ansiYellow',
    was: '#D6E64B',
    now: '#ECC400',
    by: 'M6',
    why: "the terminal's yellow was the interface lime, and in the red family a green; it is now the warning",
  },
  {
    key: 'terminal.ansiBrightYellow',
    was: '#E8F080',
    now: '#FFDF7B',
    by: 'M6',
    why: 'the same, lighter',
  },
  {
    key: 'terminal.ansiMagenta',
    was: '#C2185B',
    now: '#FF6AC1',
    by: 'M6',
    why: 'the type-parameter crimson was a second red beside the new one, and at 3.5:1 under AA; the keyword pink that red gave up is the magenta instead',
  },
  {
    key: 'terminal.ansiBrightMagenta',
    was: '#E0508F',
    now: '#FF8FD1',
    by: 'M6',
    why: 'the same, lighter: the pink that was bright red',
  },
  {
    key: 'terminal.ansiBrightBlack',
    was: '#4B4370',
    now: '#6E6795',
    by: 'M6, M13',
    why: 'the grey tools print hints and dimmed output in was the line-number grey at 2.3:1; it is now the comment grey, which recedes the same way and can be read (and which M13 lifted a shade, below)',
  },
  {
    key: 'editorGutter.deletedBackground',
    was: '#FF6AC1',
    now: '#F84A54',
    by: 'M7',
    why: 'a removed line was marked in the keyword pink, the colour code is written in, and in other families a violet; removal is now the error red, as the roadmap reserves red for it',
  },
  {
    key: 'diffEditor.removedTextBackground',
    was: '#FF6AC122',
    now: '#F84A5422',
    by: 'M7',
    why: 'the same, for removed text in the diff editor',
  },
  {
    key: 'gitDecoration.deletedResourceForeground',
    was: '#FF6AC1',
    now: '#F84A54',
    by: 'M7',
    why: 'the same, for a deleted file in the explorer and the Source Control view',
  },
  {
    key: 'gitDecoration.untrackedResourceForeground',
    was: '#D6E64B',
    now: '#8FD19E',
    by: 'M7',
    why: 'an untracked file was the interface lime, a yellow beside the amber that now means a conflict; it is an addition Git has not been told about, so it is the added green, and its letter U tells it from a staged A',
  },
  {
    key: 'editorLineNumber.foreground',
    was: '#4B4370',
    now: '#5C5583',
    by: 'M13',
    why: 'line numbers were 2.3:1 on the editor; they are read — the line an error names — so they are held to 3:1, the floor for incidental text',
  },
  {
    key: 'activityBar.inactiveForeground',
    was: '#4B4370',
    now: '#5C5583',
    by: 'M13',
    why: 'an inactive activity-bar icon is a control, and was 2.3:1 on the bar; WCAG asks 3:1 of a control, which is where it now sits',
  },
  {
    key: 'editorBracketHighlight.foreground4',
    was: '#C2185B',
    now: '#D7336B',
    by: 'M13',
    why: 'the fourth bracket pair is the type-parameter crimson, lifted to AA with it',
  },
  {
    key: 'editorCodeLens.foreground',
    was: '#6A6390',
    now: '#6E6795',
    by: 'M13',
    why: 'the comment grey, lifted a shade so a comment under a selection keeps 3:1',
  },
  {
    key: 'titleBar.inactiveForeground',
    was: '#6A6390',
    now: '#6E6795',
    by: 'M13',
    why: 'the same',
  },
  {
    key: 'tab.inactiveForeground',
    was: '#6A6390',
    now: '#6E6795',
    by: 'M13',
    why: 'the same',
  },
  {
    key: 'panelTitle.inactiveForeground',
    was: '#6A6390',
    now: '#6E6795',
    by: 'M13',
    why: 'the same',
  },
  {
    key: 'input.placeholderForeground',
    was: '#6A6390',
    now: '#6E6795',
    by: 'M13',
    why: 'the same',
  },
];

/*
 * Deliberate changes to the shipped TextMate rules, in the same shape: which
 * rule (by its name, which is how the shipped file tells them apart), which
 * field, what it was and what it is now. The build refuses one whose `was` is
 * not what the baseline's rule says, exactly as it does for the colours.
 *
 * Rules the theme ADDS need no amendment — they are set aside for the
 * comparison as new workbench keys are — so only a rule that existed and now
 * says something else is written here.
 */
export type RuleField = 'scope' | 'settings';

export type RuleAmendment = { rule: string; field: RuleField; was: unknown; now: unknown; by: string; why: string };

const FIELD_DECLARATION_PROPERTY = [
  'variable.other.property',
  'variable.other.object.property',
  'meta.field.declaration',
  'variable.member',
  'support.variable.property',
];

const INTERFACE_NAMES = [
  'entity.name.type.interface',
  'entity.name.type.enum',
  'entity.other.inherited-class.interface',
  'meta.interface',
];

export const RULE_AMENDMENTS: RuleAmendment[] = [
  {
    rule: 'Propriedades e campos de classes',
    field: 'scope',
    was: FIELD_DECLARATION_PROPERTY,
    now: FIELD_DECLARATION_PROPERTY.filter((scope: string): boolean => scope !== 'meta.field.declaration'),
    by: 'M9',
    why: 'the scope of a whole field declaration painted everything inside it that had no rule of its own the property colour — the type a field is annotated with, `Role` in `role: Role`, among them; the property is its name, which has a scope of its own',
  },
  {
    rule: 'Interfaces e Enums (mesma cor, apenas o nome do tipo)',
    field: 'scope',
    was: INTERFACE_NAMES,
    now: INTERFACE_NAMES.filter((scope: string): boolean => scope !== 'meta.interface'),
    by: 'M9',
    why: "the scope of a whole interface body painted what had no rule inside it the interface colour, against the rule's own name — only the type's name is the interface",
  },
  {
    rule: 'Comentários',
    field: 'settings',
    was: { foreground: '#6A6390', fontStyle: 'italic' },
    now: { foreground: '#6E6795', fontStyle: 'italic' },
    by: 'M13',
    why: 'a comment under a selection read at 2.8:1; the comment grey is lifted a shade so it keeps 3:1 there, and at 4.0:1 on the editor it still recedes',
  },
  {
    rule: 'Markdown - Citação',
    field: 'settings',
    was: { foreground: '#6A6390', fontStyle: 'italic' },
    now: { foreground: '#6E6795', fontStyle: 'italic' },
    by: 'M13',
    why: 'the same: a quote is written in the comment grey',
  },
  {
    rule: 'Generics (apenas o nome do tipo, os símbolos < > seguem a cor de pontuação)',
    field: 'settings',
    was: { foreground: '#C2185B', fontStyle: '' },
    now: { foreground: '#D7336B', fontStyle: '' },
    by: 'M13',
    why: 'the type parameters were the one role in the code under AA, at 3.5:1, and 2.5:1 under a selection; lifted to AA, they are still the darkest ink in the code',
  },
];

/*
 * Deliberate changes to the shipped semantic rules, by selector. Same shape,
 * same refusal of a `was` the baseline does not have.
 */
export type SemanticAmendment = { selector: string; was: unknown; now: unknown; by: string; why: string };

export const SEMANTIC_AMENDMENTS: SemanticAmendment[] = [
  {
    selector: 'typeParameter',
    was: { foreground: '#C2185B', fontStyle: '' },
    now: { foreground: '#D7336B', fontStyle: '' },
    by: 'M13',
    why: 'the same lift as the TextMate rule for generics',
  },
];

/** The baseline's semantic rules with SEMANTIC_AMENDMENTS applied, and anything wrong with the amendments themselves. */
export const amendedSemanticRules = (rules: Record<string, unknown>): { rules: Record<string, unknown>; problems: string[] } => {
  const amended: Record<string, unknown> = { ...rules };
  const problems: string[] = [];
  for (const amendment of SEMANTIC_AMENDMENTS) {
    if (!(amendment.selector in amended)) problems.push(`baseline: amendment to semantic rule "${amendment.selector}", which the baseline does not have`);
    else if (JSON.stringify(amended[amendment.selector]) !== JSON.stringify(amendment.was)) {
      problems.push(`baseline: amendment says semantic rule "${amendment.selector}" was ${JSON.stringify(amendment.was)}, the baseline says ${JSON.stringify(amended[amendment.selector])}`);
    } else amended[amendment.selector] = amendment.now;
  }
  return { rules: amended, problems };
};

/** The baseline's TextMate rules with RULE_AMENDMENTS applied, and anything wrong with the amendments themselves. */
export const amendedRules = (rules: { name: string; scope: unknown; settings: unknown }[]): { rules: typeof rules; problems: string[] } => {
  const amended: typeof rules = rules.map((rule) => ({ ...rule }));
  const problems: string[] = [];
  for (const amendment of RULE_AMENDMENTS) {
    const rule = amended.find((candidate) => candidate.name === amendment.rule);
    if (!rule) problems.push(`baseline: amendment to rule "${amendment.rule}", which the baseline does not have`);
    else if (JSON.stringify(rule[amendment.field]) !== JSON.stringify(amendment.was)) {
      problems.push(`baseline: amendment says rule "${amendment.rule}" had ${amendment.field} ${JSON.stringify(amendment.was)}, the baseline says ${JSON.stringify(rule[amendment.field])}`);
    } else rule[amendment.field] = amendment.now;
  }
  return { rules: amended, problems };
};

/** The baseline with its amendments applied, and anything wrong with the amendments themselves. */
export const amendedBaseline = (theme: { colors: Record<string, string> }): { colors: Record<string, string>; problems: string[] } => {
  const colors: Record<string, string> = { ...theme.colors };
  const problems: string[] = [];
  for (const a of AMENDMENTS) {
    if (!(a.key in colors)) problems.push(`baseline: amendment to "${a.key}", which the baseline does not set`);
    else if (colors[a.key] !== a.was) problems.push(`baseline: amendment says "${a.key}" was ${a.was}, the baseline says ${colors[a.key]}`);
    else colors[a.key] = a.now;
  }
  return { colors, problems };
};

/** The bytes the build writes a theme as. Everything is compared in this form. */
export const serialize = (theme: unknown): string => JSON.stringify(theme, null, 2) + '\n';

export const readBaseline = (): { raw: Buffer; theme: unknown } => {
  const raw = fs.readFileSync(BASELINE.file);
  return { raw, theme: JSON.parse(raw.toString('utf8')) };
};

/**
 * Every key that appears twice in the same object, as `path.key`.
 *
 * A scanner rather than a parser: it only has to know where strings, objects
 * and arrays start and end, and that a string directly followed by `:` is a
 * key. That is enough, because the file has already been through JSON.parse.
 */
export function duplicateKeys(text: string): string[] {
  const found: string[] = [];
  const stack: { keys: Set<string> | null; path: string }[] = [];
  let lastKey = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      const str = JSON.parse(text.slice(i, j + 1)) as string;
      let k = j + 1;
      while (/\s/.test(text[k] ?? '')) k++;
      const top = stack[stack.length - 1];
      if (text[k] === ':' && top?.keys) {
        if (top.keys.has(str)) found.push(`${top.path}${str}`);
        top.keys.add(str);
        lastKey = str;
      }
      i = j;
    } else if (ch === '{' || ch === '[') {
      const parent = stack[stack.length - 1];
      const where = parent?.keys ? `${parent.path}${lastKey}.` : parent ? `${parent.path}[].` : '';
      stack.push({ keys: ch === '{' ? new Set() : null, path: where });
    } else if (ch === '}' || ch === ']') {
      stack.pop();
    }
  }
  return found;
}

/** The first line at which two serialized themes part company, for the error. */
export function firstDifference(want: string, got: string): string {
  const a = want.split('\n');
  const b = got.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return `line ${i + 1}: baseline ${JSON.stringify(a[i]?.trim())}, built ${JSON.stringify(b[i]?.trim())}`;
    }
  }
  return 'no difference';
}
