# Color system

How the eight palettes are made. [Versão em português](COLOR-SYSTEM.pt-BR.md).

Midnight Indigo is one theme in eight colors: Indigo, Purple, Pink, Red, Orange, Green, Cyan and Blue. They share one structure — the same [tokens](TOKENS.md), the same rules, the same legibility floor — and each is designed for its own hue rather than rotated from another. All eight are written in [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts); what each token is in each family is tabled in [`TOKENS.md`](TOKENS.md).

How the colors are *used* — which token goes where and why — is the [design system](DESIGN-SYSTEM.md). This page is about where the colors come from.

## The ground

The editor sits at `#020108` in Indigo: near-black with the family's cast, never pure black. Every family has its own near-black, all within a hair of the same lightness — `#000305` in Cyan, `#040201` in Orange — so accent colors stay saturated without glare, and the window is the theme's color even where nothing is drawn.

Above the ground is a ladder of surfaces — frame, side bar, current line, raised widgets, hover, focus, selection — each a step lighter than the one below. The build fails if any family's ladder runs backwards.

## Built in OKLCH

Every color is computed in [OKLCH](https://bottosson.github.io/posts/oklab/), whose `L` is perceived lightness. HSL's `L` is not: it is the midpoint of the largest and smallest channel, so hue 60 and hue 240 at the same `S` and `L` are a headlight and a bruise. Eight palettes can only be held to one set of targets if a lightness means the same thing at all eight hues.

Chroma is written as an absolute number, not as a fraction of what each hue can hold. OKLCH chroma is already perceptually comparable, and normalizing it against the sRGB gamut undoes that: tried, it produced `#FF53F7` keywords in the red variant. The gamut comes in only as a ceiling ([below](#contrast-solved-chroma-capped-separation-searched)).

## Indigo is a measurement; the seven are drawn

Indigo is the original, and its palette is a measurement of it. Measured in OKLCH, 30 of its 39 original colors sit inside a 19-degree band around hue 290 — the grounds, the borders, the selection, the text ramp, and the variables, properties, operators and comments, one hue seen at thirty lightnesses — and the rest are the colors with an identity of their own: the accent, the keywords and their dark partner, and the six semantic inks. That table of roles, `ROLES`, builds Indigo and nothing else.

The other seven take nothing from it. Each is drawn from nothing: its own ground and surface ladder, its own text ramp, its own eleven syntax inks, its own accent and signals, every role at an absolute lightness, chroma and hue. There is no multiplier, no offset from Indigo, no correction applied afterwards — the numbers in the file are the palette.

## A family is a design, not a rotation

An early generator moved every color by one angle, which is what `hue-rotate()` does: every variant had the same lightness and chroma columns as Indigo, and at the far side of the wheel the family landed on top of its own syntax — the green variant came out with chrome at hue 150 and strings at 124. Its successor named the hues of the colors that carry an identity per family, but still built every other number from Indigo's measurements, and it showed: in all seven, the two closest syntax inks were 5.9 to 7.6 ΔE apart — close enough to misread.

Now each family starts from a concept, and the inks are placed for it. Conventions are kept where there is room — a string is green, a function blue, a number warm — and re-decided where the family owns that hue:

| Family | Concept | Keywords | The main decision | Closest inks, before → now |
| --- | --- | --- | --- | --- |
| **Indigo** | the original | pink, as it always was | — held to what shipped | — |
| **Purple** | Ametista, amethyst | violet, the only saturated purple in the code | properties are orchid and type parameters a dark plum; types take cyan rather than teal, away from the mint strings | 7.6 → 13.7 ΔE |
| **Pink** | Flor neon, the neon flower | hot pink, the petal | properties are lilac and type parameters a dark violet; leaf-green strings and aqua types; apricot numbers and salmon enum members, told apart by lightness | 7.3 → 12.4 ΔE |
| **Red** | Brasa, the ember | rose-crimson, the warm half of the ember | the error is the scarlet half, further round, darker and more saturated; properties are orchid and type parameters a dark magenta; amber numbers and orange enum members, told apart by lightness; green strings and petrol types | 6.4 → 12.4 ΔE |
| **Orange** | Crepúsculo, dusk | orange, the sun on the horizon | numbers are the sky's pink and enum members a coral, across the wheel's zero from the keyword; type parameters are indigo and properties lavender, the night coming in; green strings, sky-blue functions and aqua types | 6.3 → 14.6 ΔE |
| **Green** | Floresta, the forest | emerald, the canopy | the keyword owns green, so strings leave it for wheat, which is also a chart's orange; coral numbers and orchid-pink enum members; properties are violet and type parameters a dark grape, green's complement; turquoise types, a clear blue for functions, lime interfaces | 7.0 → 14.5 ΔE |
| **Cyan** | Abissal, the deep sea | cyan, the surface of the sea | types are jade, far enough round to be green and not a second cyan, and seaweed strings are told from them by lightness; deep-blue functions; coral numbers, shell-pink enum members and sand interfaces, which are also a chart's orange; properties are orchid and type parameters a darker magenta | 6.2 → 12.0 ΔE |
| **Blue** | Cobalto, cobalt | cobalt, the pigment | functions are an ice cyan above the keyword, and the terminal's cyan; sea-green types and mint strings, told apart by lightness; terracotta numbers, rose enum members and straw interfaces for warmth; properties are violet and type parameters a dark magenta; the error leans to vermilion and sits a little darker, 0.05 under the keyword that draws the info squiggle | 5.9 → 12.6 ΔE |

### Keywords in the family's own color

A keyword is the loudest word in the code, so it is what says which theme this is. Indigo writes its keywords in its pink; the other seven write theirs in their own color, at a lightness and chroma that make that hue read as itself in bold italic. They are bold italic in every family and every language.

That only works if nothing else in the code is near the family's hue. In Indigo the properties and the operators are family-colored; in the seven, the properties are a violet, orchid or lilac clear of the keyword, and the operators are a near-grey of the ground, told from the variables by lightness.

### Contrast solved, chroma capped, separation searched

A family's numbers start as a brief: the hue of its grounds and the lightness and chroma of each step of its ladder, the hue and chroma of its text, where each syntax ink starts, the accent, and the error and warning. Every number in a brief is a decision. [`tools/theme/design-families.ts`](../tools/theme/design-families.ts) finishes them in three ways:

- **Contrast is solved, not hoped for.** A color that has to read on a ground is raised in lightness until it does: the inks and the body text to 7:1 on the background, the type parameters and the secondary text to 4.5:1, the faint and muted text to 3:1. The accent is lowered until white reads on it at 4.5:1, because a button's label is text.
- **Chroma has a ceiling.** No ink takes more than 86% of the chroma sRGB can hold at its lightness and hue: the last stretch before the edge of the gamut is where a color stops being saturated and starts being neon.
- **Separation is searched for.** A local search moves one ink at a time — its lightness, chroma or hue, each within limits set per role — and keeps any move that does not make the palette worse. Worse is measured in OKLab ΔE between all eleven inks, because distance in hue says nothing about two inks told apart by lightness, which is how half of them are. An ink louder than the keyword costs, and so does an ink too close to the error or the warning. The search runs from fixed seeds, so the same brief always gives the same palette.

The saturation a family can carry is part of its brief, not a rule applied to all eight. sRGB holds far more chroma in the warm hues than in the cold ones at the same lightness: Indigo's chroma at hue 27 turns a ground maroon, and at the amber hues a tinted near-black turns brown. So Red and Orange run quiet grounds (chroma 0.018 and 0.011), and Purple and Blue, where sRGB holds more at that lightness, carry velvet (0.029 and 0.035).

## Signals are colors of their own

Error and warning are not syntax inks. Each family places a saturated red darker than every code ink but the type parameters, and a saturated yellow among the brightest, clear of every code ink and of the accent, so a squiggle is never the color of the word it underlines. Success, info and hint borrow one of the family's own inks each — usually the strings, the functions and the types, but where the family owns that color the keyword plays it instead: Green's success, Cyan's hint and Blue's info are their keywords. Each borrowing is checked to stay within 50° of the color it stands for. The [design system](DESIGN-SYSTEM.md#signals-one-meaning-per-color) says where each is used.

## What the build checks

[`tools/theme/build-color-themes.ts`](../tools/theme/build-color-themes.ts) refuses to write the themes when any of this stops holding, in any family:

- **Separation.** In the seven, no two of the eleven syntax inks sit closer than 12 ΔE in OKLab. The build names the pair and the family. Indigo is exempt because it predates the floor and is held to what shipped instead: its enum members and numbers are 19.5° apart and differ in lightness.
- **Gamut ceiling.** In the seven, no syntax ink takes more than 86% of the chroma sRGB holds at its lightness and hue. The build measures the hex and allows two points for what rounding to 8 bits adds.
- **The keyword leads.** In the seven, no ink but the type parameters has more chroma than the keyword, by more than 0.01: the keyword is the family's signature.
- **Legibility.** Every code ink reads at 7:1 (WCAG AAA) on the editor, and the type parameters at 4.5:1. The text ramp is held to its own targets; the comment grey sits under AA on purpose and never under 3:1. White on the accent reads at 4.5:1. The full audit, read back from the shipped theme files, is [`ACCESSIBILITY.md`](ACCESSIBILITY.md).
- **Order.** The surfaces and the text ramp keep their order.
- **Tokens only.** No color reaches a theme unless it is a token, or a token at one of nine named opacities.
- **Signals.** The error and warning are at least 7 ΔE from every code ink and the accent, and each signal within 50° of the color it is named for. Error, warning and info, the three squiggles, are 20 ΔE apart and differ by at least 0.05 in lightness, so they are three weights even to someone who cannot tell the hues apart.

## Indigo is held to what shipped

[`tools/theme/indigo-baseline.json`](../tools/theme/indigo-baseline.json) is Midnight Indigo exactly as v3.0.0 shipped it, pinned by its SHA-256. The build asserts that the Indigo variant still reproduces it byte for byte — every workbench color, every TextMate rule, every semantic rule — so the palette math can change without moving the theme already open in someone's editor.

When a shipped value has to change, the baseline is not edited. The change is an amendment in [`tools/theme/baseline.ts`](../tools/theme/baseline.ts): the key, what it was, what it is, and why. The build refuses an amendment whose old value is not what the file says. Colors the baseline never had may be added around it. [`INVENTORY.md`](INVENTORY.md#baseline-amendments) lists every amendment with its reason.

## Adding a family

1. **Write the brief.** An entry in `BRIEFS` in [`tools/theme/design-families.ts`](../tools/theme/design-families.ts), with a comment saying what the family is: the ground hue and each step of the ladder, the text hue and chroma, where each ink starts, the accent, the error and the warning.
2. **Draft it.** `npm run design:families -- --family=<name>` prints the measurements, the 68 tokens, and the design as a literal, with the ink it proposes for success, info, hint and the remaining chart colors. It writes nothing.
3. **Freeze it.** Read it, judge it, and paste the literal into `DESIGNS` in [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts) as it is printed. The build reads the numbers and never runs the search, so nothing can move a family without a change to its own entry.
4. **Name it.** Its name in `Family`, `FAMILY_ORDER`, `TITLE` and `contributes.themes` in `package.json`.

It is more than one line on purpose: the parts that carry an identity are the parts worth deciding. The build says if two inks ended up too close, one dropped under its target or past the gamut ceiling, or the manifest and the themes disagree.
