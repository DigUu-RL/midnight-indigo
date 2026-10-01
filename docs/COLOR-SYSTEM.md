# Color system

How the eight palettes are made. [Versão em português](COLOR-SYSTEM.pt-BR.md).

Midnight Indigo is one theme in eight colors: Indigo, Purple, Pink, Red, Orange, Green, Cyan and Blue. They share one structure — the same [tokens](TOKENS.md), the same rules, the same legibility floor — and each is designed for its own hue rather than rotated from another. All eight are written in [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts); what each token is in each family is tabled in [`TOKENS.md`](TOKENS.md).

How the colors are *used* — which token goes where and why — is the [design system](DESIGN-SYSTEM.md). This page is about where the colors come from.

## The ground

The editor sits at `#020108` in Indigo: near-black with the family's cast, never pure black. Every family has its own near-black at the same lightness — `#000303` in Cyan, `#040100` in Orange — so accent colors stay saturated without glare, and the window is the theme's color even where nothing is drawn.

Above the ground is a ladder of surfaces — frame, side bar, current line, raised widgets, hover, focus, selection — each a step lighter than the one below. The build fails if any family's ladder runs backwards.

## Built in OKLCH

Every color is computed in [OKLCH](https://bottosson.github.io/posts/oklab/), whose `L` is perceived lightness. HSL's `L` is not: it is the midpoint of the largest and smallest channel, so hue 60 and hue 240 at the same `S` and `L` are a headlight and a bruise. One role table can only be used at eight hues if a lightness means the same thing at all of them.

Chroma stays absolute within a band, not a fraction of what each hue can hold. OKLCH chroma is already perceptually comparable, and normalizing it against the sRGB gamut undoes that: tried, it produced `#FF53F7` keywords in the red variant.

## Most of the theme is one hue

Measured in OKLCH, 30 of Indigo's original 39 colors sit inside a 19-degree band around hue 290: the grounds, the borders, the selection, the text ramp, and the variables, properties, operators and comments. They are one hue seen at thirty lightnesses.

So that much is shared: give a family its hue and the whole workbench follows. What does not follow is everything that carries an identity of its own — the accent, the keywords and their dark partner, and the six semantic inks (strings, functions, numbers, types, interfaces, enum members). Those are named per family, because they *are* the palette.

## A family is a design, not a rotation

An earlier generator moved every color by one angle, which is what `hue-rotate()` does: every variant had the same lightness and chroma columns as Indigo, and at the far side of the wheel the family landed on top of its own syntax — the green variant came out with chrome at hue 150 and strings at 124.

Now each family names its own hues. Conventions are kept where there is room — a string is green, a function blue, a number warm — and re-decided where the family owns that hue:

| Family | Keywords | What moved to make room |
| --- | --- | --- |
| **Indigo** | pink, as it always was | — the original |
| **Purple** | violet | — |
| **Pink** | hot pink | — |
| **Red** | a light coral | kept apart from the darker, more saturated red an error is drawn in |
| **Orange** | orange | numbers are a warm red and enum members rose, across the wheel's zero from the chrome |
| **Green** | green | strings are yellow-green, interfaces give up lime for gold — the variables sit at hue 152, where a green string would be |
| **Cyan** | cyan | types cross to jade, on the other side of the strings |
| **Blue** | periwinkle | functions step to azure-cyan, 43° clear of the chrome; types drop back to teal |

### Keywords in the family's own color

A keyword is the loudest word in the code, so it is what says which theme this is. Indigo writes its keywords in its pink; the other seven write theirs in their own color, each drawn for its family (its own lightness and chroma, through `redrawn`) rather than lifted from another role. They are bold italic in every family and every language.

Keywords can only move onto the family's hue if what was there moves off it. Properties and operators were family-colored by definition, and at the keyword's hue they were 2 to 7 ΔE from it — the same color. So in the seven, properties take the magenta or violet the keywords used to be, and operators become a quiet tint of the family, told from the variables by lightness.

### Saturation and lightness per family

Each family has three saturation multipliers — for the grounds, for the text ramp and family syntax, and for the inks. Indigo's chroma at hue 27 turns the ground maroon; at the amber hues, where sRGB is widest, a tinted near-black turns brown. Red and Orange run under 1. Cyan and Green, where sRGB is narrowest, are given room to take what their hue can hold. That is what lets two variants differ in saturation and interval, not only in where the wheel was turned.

Perceived lightness still is not the whole story: a saturated hue near 100 at `L` 0.73 reads as khaki, not yellow-green. Where a family moves a role's hue, the role's lightness follows the move by the difference between where that hue sits in Indigo and where the family put it — a role that has not moved gets nothing. It only applies where a color is bright enough to be read as one; applied to the near-black grounds, it made them a brownish grey.

## Signals are colors of their own

Error and warning are not syntax inks. Each family places a saturated red below the syntax band and a saturated yellow at its top, clear of every code ink and of the accent, so a squiggle is never the color of the word it underlines. Success, info and hint are the family's own green, blue and teal inks, chosen per family and checked to stay within 50° of the color they stand for. The [design system](DESIGN-SYSTEM.md#signals-one-meaning-per-color) says where each is used.

## What the build checks

[`tools/theme/build-color-themes.ts`](../tools/theme/build-color-themes.ts) refuses to write the themes when any of this stops holding, in any family:

- **Separation.** No two roles that have to be told apart sit closer than 22° of hue. The build names the pair and the family. Indigo is exempt because it predates the floor: its enum members and numbers are 19.5° apart and differ in lightness instead.
- **Legibility.** Every code ink reads at 7:1 (WCAG AAA) on the editor, and the type parameters at 4.5:1. The text ramp is held to its own targets; the comment grey sits under AA on purpose and never under 3:1. The full audit, read back from the shipped theme files, is [`ACCESSIBILITY.md`](ACCESSIBILITY.md).
- **Order.** The surfaces and the text ramp keep their order.
- **Tokens only.** No color reaches a theme unless it is a token, or a token at one of nine named opacities.
- **Signals.** The error and warning are at least 7 ΔE from every code ink and the accent, and each signal within 50° of the color it is named for.

## Indigo is held to what shipped

[`tools/theme/indigo-baseline.json`](../tools/theme/indigo-baseline.json) is Midnight Indigo exactly as v3.0.0 shipped it, pinned by its SHA-256. The build asserts that the Indigo variant still reproduces it byte for byte — every workbench color, every TextMate rule, every semantic rule — so the palette math can change without moving the theme already open in someone's editor.

When a shipped value has to change, the baseline is not edited. The change is an amendment in [`tools/theme/baseline.ts`](../tools/theme/baseline.ts): the key, what it was, what it is, and why. The build refuses an amendment whose old value is not what the file says. Colors the baseline never had may be added around it. [`INVENTORY.md`](INVENTORY.md#baseline-amendments) lists every amendment with its reason.

## Adding a family

A family is an entry in `VARIANTS` in [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts): a hue, three saturation multipliers, an accent, where the keywords and the six semantic inks sit on the wheel, where the error and warning sit, and which of its inks plays success, info, hint and the remaining chart colors. Then its name in `Family`, `FAMILY_ORDER`, `TITLE` and `contributes.themes` in `package.json`. It is more than one line on purpose: the parts that carry an identity are the parts worth deciding. Everything else follows, and the build says if two roles ended up too close, an ink dropped under its target, or the manifest and the themes disagree.
