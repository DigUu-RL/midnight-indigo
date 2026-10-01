# Design system

The rules the theme follows, in every family and on every surface. [Versão em português](DESIGN-SYSTEM.pt-BR.md).

Midnight Indigo is an ultra-dark theme for long sessions. Everything below serves one aim: the code is the brightest, most colorful thing on the screen, and everything around it says what it means in as few colors as it can. Where the colors come from is the [color system](COLOR-SYSTEM.md); this page is about where they go.

Every rule here is enforced. The theme build, the syntax check and the accessibility audit run in `npm run check` and fail when one stops holding — see [Enforced, not described](#enforced-not-described).

## Tokens, not colors

The theme is not written in colors. It is written in 68 tokens, each a job — `surfaceRaised`, `muted`, `error` — with a sentence saying what it is for, in [`tools/theme/theme-tokens.ts`](../tools/theme/theme-tokens.ts). Every one of VS Code's colors that the theme sets is written against a token; each family gives the tokens different values. [`TOKENS.md`](TOKENS.md) is generated from the source and lists every token with its value in every family.

| Group | What it holds |
| --- | --- |
| `surface` | The grounds, darkest to lightest: editor, frame, side bar, current line, raised widgets, hover, focus, selection, and the two borders. |
| `text` | The text ramp: ghost, faint, muted, secondary, normal, bright, white. |
| `accent` | The theme's own color, its quiet form, and the white that reads on it. |
| `syntax` | The eleven inks code is written in. |
| `state` | Focus, the caret, the signals, and Git's kinds of change. |
| `link`, `chart`, `ansi` | Links, the series charts draw in, and the terminal's sixteen colors. |

A translucent color is a token at one of nine named opacities — the overlay ladder, from `trace` (7%) to `heavy` (67%) — and no other.

## Grounds and text

The editor is the darkest ground. The chrome around it — frame, side bar, panel, tab strip — is a step lighter, so the edge of the window reads; anything that floats or takes input is a step lighter again. Hover, focus and selection continue the same ladder, so a state is a ground, not a new color.

Text follows one ramp. Body text is `normal`; `bright` marks the one current thing in a list; `secondary` is read after it; `muted` is what is meant to recede — comments, placeholders, inactive tabs — and never drops under 3:1; `faint` is glanced at, like line numbers.

## Interaction states

Hover, focus, pressed, selected, disabled, prominent and danger follow one grammar on every control, tabled in [`TOKENS.md`](TOKENS.md#interaction-states):

- **Hover** is the weakest step above rest. It is never a border and never the accent.
- **Selection** is always stronger than hover, so a selected row is never mistaken for one under the pointer.
- **Focus** is the only state drawn as a ring. It is solid, never translucent, and reads at 3:1 on every surface.
- **Pressed** is stronger than hover, and never the same as selected or as a toggle that is on.
- **Prominent** — the primary button, a badge — is the accent as a fill with white text at 4.5:1.
- **Disabled** is half of what it would have been: it keeps its shape and loses its weight.

The build measures about thirty controls in every family as the colors they actually composite to on their own ground, and fails when two states that must be told apart come closer than 3 ΔE.

## Signals: one meaning per color

A color that means something means it everywhere — from a squiggle to the Problems view, the terminal, a diff and the Source Control graph.

| Meaning | Token | Where it shows |
| --- | --- | --- |
| Something is wrong | `error` — a red of its own, below the syntax band | error squiggles, failed tests, the terminal's red, a removed line or a deleted file |
| Something to look at | `warning` — a yellow of its own, at the top of the band | warning squiggles, the terminal's yellow, a merge conflict |
| Something to know | `info` — the family's blue | info squiggles, a modified line or file, an open comment thread |
| Something passed | `success` — the family's green | passed tests, an added line, an untracked or staged file |
| A suggestion | `hint` — the family's teal | hint dots, the light bulb |

Error and warning used to be borrowed syntax inks, so a squiggle could be the color of the word it underlined. They are now colors no code token uses, at least 7 ΔE from every ink and the accent. The three squiggles also differ in lightness, so they can be told apart without hue.

- **Diff, merge and Git.** The color is the kind of change — green added, blue modified, red removed, amber conflicting — and Git's letter beside the file says the rest. A changed line is a faint wash of its kind; the text that changed in it sits on a stronger one.
- **The terminal.** The sixteen colors keep their names. Red is the error and yellow the warning, so a failed build prints in the color the editor marks an error in; bright black is the comment grey at 3:1, and every other color but black reads at 4.5:1 on the terminal, so VS Code's minimum-contrast correction never has to repaint one.
- **Debugging and testing.** The paused and the selected stack frame each carry their own glyph as well as a color; uncovered code is a heavier band than covered code.

## The AI is the accent, and only where it acts

Chat, inline chat, suggested edits and the Agents window use the theme's own accent — indigo in Midnight Indigo, each family's color elsewhere — and only where the AI speaks or acts: its avatar, the command a request addresses it by, the border that runs while it works, a session in progress, its suggestion in the gutter. It is never a color kept for the AI alone, and never a saturated block. What you wrote is a neutral bubble; what an agent changed is the kind of change it is, in Git's colors.

## Code, and what sits on top of it

Code is written in eleven inks — see [`SYNTAX.md`](SYNTAX.md) for every scope and semantic token, language by language. Three rules hold everywhere:

- **Keywords are bold italic**, in every family and language: they are the theme's signature, and their shape is a cue that does not depend on color.
- **Operators are color only**, never bold or italic. Punctuation is the keyword color, plain.
- **Declarations are bold, uses are plain.** A function is bold where it is declared and plain where it is called; a type is bold. Static members are italic.

Semantic highlighting is on by default, so a name is colored by what the language server says it is, not by how it looks. The rules cover the tokens TypeScript, Roslyn (C#), Pylance, rust-analyzer, gopls and the Java server send, and each is drawn as its TextMate scope is — a word is the same color with semantic highlighting on and off.

What the editor draws over the code is one quieter layer beneath it:

- **Auxiliary text recedes.** Inlay hints, CodeLens and ghost text are the comment grey — readable at 3:1, never as strong as body text.
- **Symbol icons are the syntax colors.** A class is the class color in the suggest list, the outline, the breadcrumbs and the symbol picker.
- **Highlights behind code keep the code legible.** The selection, find matches, the word under the cursor and every other range painted behind code show against the editor and keep every code ink at 4.5:1 on top.

## Legibility

The theme sets its own targets and holds every family to them: 7:1 for code, 4.5:1 for other text, 3:1 for what is meant to recede and for squiggles, focus rings and icons. Cues that do not depend on color — bold italic keywords, struck-through deprecated names, the solid focus ring, squiggles apart in lightness — are checked too, and every signal that differs by hue is simulated under protanopia, deuteranopia and tritanopia. [`ACCESSIBILITY.md`](ACCESSIBILITY.md) has the measurements.

## What the theme leaves to VS Code

The theme sets 871 of the 971 colors VS Code documents. The rest are left to VS Code on purpose — mostly borders and grounds whose default is nothing, and foregrounds that would repaint the code inside a highlight — and [`INVENTORY.md`](INVENTORY.md) lists each one with its reason.

## Enforced, not described

| Rule | Held by |
| --- | --- |
| Tokens, ordering, contrast, separation, states, signals, Git, terminal, chat | [`tools/theme/build-color-themes.ts`](../tools/theme/build-color-themes.ts) — the build writes nothing if one fails |
| Every scope and semantic token reaching its role, keywords bold italic | [`tools/syntax/check-syntax.ts`](../tools/syntax/check-syntax.ts), on a corpus of real code in all eight families |
| Every pair at its target, non-color cues, color vision | [`tools/theme/check-accessibility.ts`](../tools/theme/check-accessibility.ts) |
| Nothing visible changes unseen | [`tools/regression/`](../tools/regression/) — snapshots in `npm run check`, and real VS Code in `npm run regression`; see [`REGRESSION.md`](REGRESSION.md) |

How to run them is in [`DEVELOPMENT.md`](DEVELOPMENT.md).
