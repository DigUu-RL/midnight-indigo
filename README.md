# Midnight Indigo

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/diguu-rl.midnight-indigo?label=marketplace&color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo&ssr=false#review-details)
[![License: MIT](https://img.shields.io/badge/license-MIT-6C5CE7)](LICENSE)

An ultra-dark theme for Visual Studio Code in eight colors, bundled with a matching file icon set built on the languages' own official logos.

**[Install from the Visual Studio Marketplace →](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)**

![Midnight — the color theme and the icon set](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/hero.png)

The editor background sits at `#020108` — near-black with the family's cast — so accent colors stay saturated without glare. Syntax colors are tuned per language rather than applied generically, and semantic highlighting is on by default so identifiers are colored by what they actually are, not by how they look.

The eight palettes are one theme in eight colors: the same structure, the same rules, the same legibility floor, so switching color never means switching to something that behaves differently. Each palette is designed for its own hue rather than rotated from the others — a string is green where the family leaves room for green, and something deliberate where it does not. **Midnight Indigo** is the original, and it is unchanged.

## What's included

This is a single extension. Install once, then pick a color theme and turn on the icons.

| | |
| --- | --- |
| **Midnight Indigo**, **Purple**, **Pink**, **Red**, **Orange**, **Green**, **Cyan**, **Blue** | Eight color themes — each 129 workbench colors, 39 TextMate rules and 34 semantic token rules |
| **Midnight Icons** | File icon theme — 222 SVG icons: 140 file/language icons and 40 contextual folder icons with open/closed variants. Shared by all eight themes |

Two grammar injections ship with the theme so a few constructs VS Code does not scope on its own can be colored distinctly:

- **JSX/TSX components** — component tags are colored apart from intrinsic HTML elements (`source.js`, `source.jsx`, `source.ts`, `source.tsx`)
- **C# delegates** — delegate declarations and invocations (`source.cs`)

## Preview

Every screenshot on this page is generated from this repository's own theme files and its own icon SVGs — the colors are the themes' and the icons are the real ones, not an artist's impression.

### The eight palettes

The same code in all eight, so the differences are the generator's rather than a photographer's:

![The eight Midnight palettes](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/palettes.png)

### The icon set

All 140 file and language icons:

![Every file and language icon](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/icons-files.png)

All 40 folder icons, closed and open:

![Every folder icon](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/icons-folders.png)

### Syntax

Four of the tuned languages are below. **[Every language is in the full gallery →](https://github.com/DigUu-RL/midnight-indigo/blob/main/docs/PREVIEW.md)** — 17 samples covering TypeScript, React/TSX, JavaScript, C#, Python, PowerShell, Markdown, JSON, HTML, SCSS, SQL, Go, Rust, Java, PHP, YAML and Shell.

Highlighting goes through the same TextMate grammars VS Code ships, including the two grammar injections below.

### TypeScript

![TypeScript](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/typescript.png)

### React / TSX

![React and TSX](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/tsx.png)

### C\#

![C#](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/csharp.png)

### Python

![Python](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/python.png)

## Install

### From the Marketplace

Search for **Midnight Indigo** in the Extensions view (`Ctrl+Shift+X`), or run:

```bash
code --install-extension diguu-rl.midnight-indigo
```

### Enable the themes

Both are opt-in after install:

1. **Color theme** — `Ctrl+K Ctrl+T` → **Midnight Indigo** (or Purple, Pink, Red, Orange, Green, Cyan, Blue)
2. **File icons** — `Ctrl+Shift+P` → *Preferences: File Icon Theme* → **Midnight Icons**

Or set them directly in `settings.json`:

```json
{
  "workbench.colorTheme": "Midnight Indigo",
  "workbench.iconTheme": "midnight-indigo-icons"
}
```

One icon set serves all eight themes, so changing color theme leaves the icons alone.

## How the eight palettes work

Each one is a design, written down, and [`tools/theme-palette.ts`](tools/theme-palette.ts) holds all eight of them. The notes below are the short version.

### The theme was already one hue

Measured in [OKLCH](https://bottosson.github.io/posts/oklab/), 30 of the theme's 39 colors land inside a 19-degree band around hue 290. The grounds, the borders, the selection, the foreground ramp and four of the syntax roles — variables, properties, operators, comments — are not thirty independent decisions. They are one hue seen at thirty lightnesses.

So that much *is* shared: give a variant its hue and the whole workbench follows from it. What does not follow is everything that carries an identity of its own — the accent, the keywords and their darker partner, and the six semantic roles. Those are named per family, because they are the palette.

### A variant used to be a rotation, and that was the problem

The previous generator moved every color by one angle: the family band by the full turn, the semantic roles by a capped fraction of it, with lightness and chroma held byte-identical across all eight. It was carefully built, and dumping the eight palettes side by side showed exactly what it produced — every ground at `indigo + Δ`, every string at `indigo + drift`, the `L` and `C` columns the same down all eight rows. A rotation of everything by the same angle is what `hue-rotate()` is. No tuning inside that scheme could produce a palette indigo had not already decided.

It also broke down at the far side of the wheel. Because the family turned fully and the semantics only drifted, green, cyan and blue landed *inside* the arc their own semantic roles occupy: the green variant came out with chrome at hue 150 and strings at 124, types at 176, interfaces at 75 — a code area collapsed onto the chrome hue, which is the one thing a syntax palette must not be.

Now each family names its own hues, so that cannot happen: no variant is asked to fit its semantics into the arc its family sits in. The machinery that used to arrange the crowded ones — a weighted isotonic regression shoving roles apart inside a window that was too small — is gone, replaced by a floor the build checks.

### Conventions kept where there is room, and re-decided where there is not

A string is green in every editor anyone has used, a function is blue, a number is warm. Purple, pink, red and blue can honor all of that, and do.

Where the family owns a role's home, the role moves, and the move is a decision rather than a nudge:

- **Orange** owns the amber band, so its numbers are warm red and its enum members rose — across the wheel's zero from the chrome, with the family's 60 degrees left empty behind them.
- **Green** owns green. Not because of the background — the grounds are near-black at every hue and a string clears them by 20:1 — but because of the variables, which are family by definition and sit at hue 152 and `L` 0.78 right where a green string would be. Clearing them means staying under 130 or going past 174, and the far side is the types', so the strings are yellow-green at 125 and the interfaces give up lime for gold.
- **Cyan** owns teal, so its types cross to the *other* side of its strings — jade at 168, with the strings at 135 between them and the greens.
- **Blue** sits on the functions, which step to azure-cyan at 215: still unmistakably blue, 43 degrees clear of the chrome, with the types dropping back to teal to make the room.

### Why OKLCH and not HSL

Because HSL's `L` is not lightness. It is the midpoint of the largest and smallest channel, which says nothing about how bright a color looks: hue 60 and hue 240 at identical `S` and `L` are a headlight and a bruise. OKLCH's `L` *is* perceived lightness, which is what makes one role table usable at eight hues.

Chroma stays absolute within a band for a related reason. It is tempting to store it as a fraction of what each hue can hold, since sRGB carries far more chroma at magenta than at green — but OKLCH chroma is *already* the perceptually comparable quantity, and normalizing it against the gamut undoes the thing OKLCH was chosen for. Tried, it produced `#FF53F7` keywords in the red variant. It was also built on a false premise: indigo's own operators, keywords, calls and enum members already sit at 100% of their hue's chroma, so "reuse the fraction" meant "sit on the gamut edge everywhere", and the edge is a long way out in magenta.

### Saturation is the other half of the design

Three multipliers per family — one for the grounds, one for the foreground ramp and family syntax, one for the ink — and they are what stop the eight from being one palette even where the hues are handled well.

Indigo's numbers do not mean the same thing at hue 27 as they do at 290. Red's ground at indigo's chroma is a visible maroon rather than a near-black with a hint in it, and its foreground ramp is salmon rather than a warm grey; orange is worse, because amber is where sRGB is widest and a tinted near-black there turns brown before it turns orange. Both run well under 1. Cyan and green have the opposite problem — cyan is the pinch in sRGB, with barely half the chroma available at the accent's lightness that violet has — and are given room to take what little their hue can hold.

That is also what lets two variants differ in *saturation and interval* rather than only in where the wheel was turned to, which is the difference between eight palettes and one palette photographed through eight gels.

### A hue gets the lightness it needs

OKLCH holds perceived lightness across hue and that is still not the whole story: a saturated hue near 100 at `L` 0.73 reads as khaki, not as yellow-green. The theme knew this before the generator existed — its warm roles all sit high, lime interfaces at 0.885 and amber numbers at 0.843, while its cool ones sit low.

The correction is applied as a *difference* between where a role's hue sits in indigo and where this family put it, so a role that has not moved gets nothing and indigo is untouched. It is why the green variant's gold interfaces and the orange variant's red numbers arrive at a sensible brightness without either being written down.

It applies only where a color is bright enough to be read as a color. There is no khaki at `L` 0.08 — there is near-black with a hint of hue in it — and correcting it there does not rescue anything, it just makes the theme paler: ungated, this took the orange variant's editor background from `L` 0.083 to 0.143 and its side bar to 0.176, a brownish grey rather than the near-black the theme is built on.

### The separations are checked, not arranged

No two roles that have to be told apart may sit closer than 22 degrees, and the build says which pair and in which family if a hue is ever edited into its neighbour. It is a floor now where the old generator had a ceiling, and the swap is the whole difference between a table that is designed and one that is relaxed: hues that arrive where they were put need a minimum stated, not a maximum negotiated.

Indigo is exempt, because it predates the floor and sits under it on purpose — its enum members and numbers are 19.5 degrees apart and are told apart by lightness instead.

Legibility is absolute rather than measured against indigo, because the variants are *meant* to differ: every code token clears WCAG AAA at 7:1, which the shipped theme already did — its dimmest token being the operators at 7.55:1 — so no variant can trade legibility for color. Chrome text is held to its own indigo value with slack, since that ramp is deliberately graded and the bottom of it, the comments at 3.76:1, sits below AA on purpose. White on the accent clears 3:1 in all eight.

### The original cannot move

[`tools/indigo-baseline.json`](tools/indigo-baseline.json) is the theme exactly as it shipped, and the build asserts that the indigo variant still regenerates it — every workbench color, every TextMate rule, every semantic rule. That check is the point of the whole arrangement: it is what lets the palette math be changed with the knowledge that the theme already open in someone's editor did not move. `npm run build:themes` fails and writes nothing if it does not hold.

## Language coverage

Semantic and TextMate rules are tuned specifically for JavaScript, TypeScript, JSX/TSX, C#, PowerShell, Python, Markdown and JSON.

Every other language falls back to the general rule set, which covers the standard scopes (keywords, strings, numbers, comments, types, functions, variables, operators, punctuation).

### Icon theme coverage

The set is built around one rule: an icon has to be identifiable at the 16px VS Code actually renders it.

- **The logo is the icon.** There is no tile. Each file icon is the language's or tool's own mark, drawn flat in its official colors and filling the whole icon — the Python snakes in `#3776AB` and `#FFD43B`, the Go wordmark with its three speed lines, the Dart arrow, the C++ letterform, the Java cup under red steam, the Ruby gem with its facets cut clean through. The outlines come from the projects' own artwork rather than from an impression of it; only the treatment is ours.
- **Flat, with a shadow.** Every mark casts a soft offset shadow in a darkened tint of its own color. Black would be invisible on a `#040208` ground, so the shadow is the mark's color taken down in lightness — enough depth to sit on the background rather than float above it, at a weight that survives being 16 pixels tall.
- **Holes are holes.** Anything cut out of a shape is genuinely transparent, so an icon still reads on the file explorer's hover and selection backgrounds. Marks whose letters are cut out of a solid block — TypeScript, npm, Swift — get the letters painted back in the color the logo has them in, instead of coming out as a solid blob.
- **Pictograms are duotone.** Everything with no logo of its own — the flask, the cog, the book, the terminal — is drawn in the icon's color plus a lighter tint of the same hue, derived rather than specified. The tint is the surface and full strength is what sits on it: glass and liquid, page and print, screen and prompt. One flat silhouette has to say everything with its outline, which at 16px means a cluster of slots that close up; two tones carry the structure instead.
- **Folders are solid.** A filled folder in the category's accent color with the pictogram sunk into the body in a darker tone of that same accent, so files and folders never read as the same object. The open state keeps the whole folder as its back and swings a front panel out over it.
- **Text is only text.** A format whose logo is a wordmark, or has no logo at all, is set as bare letters with nothing behind them — `YAML` in its own red, `ERL`, `PDF`, `ASM`, `INI`. Each string is set as large as it can be without overrunning the icon.
- **No badges.** File name patterns get their own icon rather than a marker pasted onto a base one: `*.spec.ts` is a flask, `*.module.ts` is a set of blocks, `*.service.ts` a cog, `*.guard.ts` a shield, `*.dto.ts` a pair of arrows. The color stays the language's, so you read the language and the role at the same time.

- **40 contextual folder icons**, each with an open and closed variant, matching several name synonyms per category: `components`, `hooks`, `functions`, `utils`, `helpers`, `services`, `controllers`, `models`, `views/pages`, `layouts`, `store/redux`, `context/providers`, `middleware`, `guards`, `routes`, `api`, `config`, `scripts/cli`, `tests/spec/e2e`, `mocks/fixtures`, `assets`, `images`, `icons`, `fonts`, `styles/themes`, `public`, `build/dist`, `docs`, `database/migrations`, `types/interfaces`, `constants/enums`, `core/lib`, `plugins/features`, `i18n`, `directives/pipes/decorators`, `validators`, `docker/kubernetes`, `workflows/.github`, `server`, `shared/common`, `security/auth`.
- **140 file and language icons** covering JS/TS/JSX/TSX, HTML/CSS/SCSS/SASS/LESS/Stylus, JSON/YAML/TOML/INI/XML/ENV, Markdown/MDX, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C/C++/C#/F#/VB.NET, PHP, SQL, Shell/Zsh/Fish/PowerShell/Batch, Perl, Lua, Dart, Elixir, Erlang, Haskell, Clojure, Scala, Groovy, R, Julia, Nim, Crystal, Zig, Objective-C, Solidity, Assembly, Vue, Svelte, Astro, GraphQL, Docker, Terraform, Jupyter, images, fonts, audio, video, archives, certificates, PDF/Office documents, and well-known config files (`package.json`, `.eslintrc`, `.prettierrc`, `tsconfig.json`, `webpack`/`vite`/`rollup`, `Dockerfile`, `Makefile`, `.gitignore`, `nginx.conf`, CI files).
- **Filename-pattern variants**, each a dedicated icon: `*.spec.ts(x)`, `*.test.ts(x)`, `*.d.ts`, `*.module.ts/scss/css`, `*.component.ts(x)`, `*.service.ts`, `*.stories.ts(x)`, `*.config.ts/js`, `*.min.js`, `*.guard.ts`, `*.pipe.ts`, `*.directive.ts`, `*.controller.ts`, `*.model.ts`, `*.dto.ts`, `*.entity.ts`.

The icons keep the languages' own colors in every theme. A Python file is `#3776AB` and `#FFD43B` whether the editor around it is indigo or green — the mark is the language's identity, not the theme's, and tinting it to match the chrome would cost the one thing the icon set is for.

### Where the logos come from

A language mark is not ours to invent, so the geometry is imported from the projects' own artwork by [`tools/import-marks.ts`](tools/import-marks.ts), which pins its sources and writes them into a checked-in file — building the icons never touches the network. Where a project has redrawn its logo the set carries the current one: CSS is the rebeccapurple mark adopted in November 2024, and GitLab the tanuki as simplified in 2022.

| | |
| --- | --- |
| [Simple Icons](https://simpleicons.org) 16.29.0 | CC0-1.0. Flat, single-path, already in a 24×24 box — the default source |
| [devicon](https://github.com/devicons/devicon) v2.17.0 | MIT. Used where the mark is genuinely multi-color (Python, Java, Dart, Vue, the HTML5 shield, C#, Azure); gradients are flattened to the brand's flat colors |

A logo only earns an import if it survives being drawn at 16px. Several upstream marks do not — Groovy's is an outlined wordmark on a star, Jenkins's and Jest's are line-art portraits, Vim's sets "Vim" inside its diamond, Lua's sets "Lua" inside its sphere. Those are redrawn solid and simplified in [`tools/marks.ts`](tools/marks.ts) from the same official artwork, together with the marks that have no redistributable source at all (PowerShell, the Office trio).

## Customize

You do not need to fork the theme to adjust it. Override any color in your own `settings.json`:

```json
{
  "workbench.colorCustomizations": {
    "[Midnight Indigo]": {
      "editor.background": "#000000"
    }
  },
  "editor.tokenColorCustomizations": {
    "[Midnight Indigo]": {
      "comments": "#5A5378"
    }
  }
}
```

The name in brackets is the theme's label, so an override applies to that one color only — `[Midnight Green]` for the green variant, and so on. To adjust all eight at once, drop the brackets and put the settings at the top level.

Everything under [`themes/`](themes/), the icons in [`icons/svg/`](icons/svg/) and the mapping under [`icons/theme/`](icons/theme/) are **generated** — VS Code reads them directly, but hand-editing them means your change is lost on the next build. Edit the source instead and re-run the generator:

| | |
| --- | --- |
| [`tools/color.ts`](tools/color.ts) | Colour-space maths — sRGB, WCAG contrast, and the gamut-safe OKLCH conversion the palettes are built in |
| [`tools/theme-palette.ts`](tools/theme-palette.ts) | The role table, and the eight per-family designs: their hues, their saturation, and the floor that keeps the tokens apart |
| [`tools/build-color-themes.ts`](tools/build-color-themes.ts) | The theme structure, written once against role names, plus every check the build makes |
| [`tools/indigo-baseline.json`](tools/indigo-baseline.json) | The theme as it shipped. The build refuses to write if indigo no longer reproduces it |
| [`tools/shapes.ts`](tools/shapes.ts) | The drawing primitives, and the two rules everything obeys: fill only, and holes are cut with `evenodd` rather than painted |
| [`tools/glyphs.ts`](tools/glyphs.ts) | The pictogram library — the shapes that are ours. Each is drawn inside a 24×24 box centred on `(0,0)` |
| [`tools/marks.ts`](tools/marks.ts) | The language and tool marks: official palettes over imported geometry, plus the ones drawn by hand |
| [`tools/import-marks.ts`](tools/import-marks.ts) | Fetches the official artwork and writes [`tools/mark-paths.ts`](tools/mark-paths.ts). Only re-run when adding a mark |
| [`tools/icon-spec.ts`](tools/icon-spec.ts) | Which mark, pictogram or string each icon gets, and in which colours |
| [`tools/palette.ts`](tools/palette.ts) | Every colour the icon build paints with, and which of them a variant may not repaint |
| [`tools/build-icons.ts`](tools/build-icons.ts) | The box, the folder geometry, the drawing, and the paint recipe per variant |
| [`tools/build-theme.ts`](tools/build-theme.ts) | The folder-name / extension / filename / language-id → icon mapping |

```bash
npm run build                    # themes, then icons
npm run build:themes             # the eight colour themes
npm run build:icons              # the icon set
npm run import:marks             # re-fetch the official logo geometry
npm run typecheck                # tsc, no emit
```

The build scripts are TypeScript, run straight by Node's type stripping — there is no compile step, no bundler and no `dist/`. `typescript` is a devDependency for checking only, and nothing in `tools/` is packaged into the extension. The types are load-bearing rather than decorative: `mark` and `glyph` on a spec are the unions of the real mark and pictogram names, and every entry in the extension / filename / language-id tables must name an icon the spec defines, so a typo is an error in the editor instead of a thrown build.

The icon build fails if a mapping points at an icon that does not exist, and the theme build fails if `package.json` does not contribute exactly the eight themes it writes — so neither pair can drift apart silently. `npm run preview:icons` additionally writes `icons/preview.html`, which shows every icon at 48px and at the 16px VS Code renders it.

Both sets are byte-for-byte reproducible, so `git diff` after a build is the regression test: a change that was meant to touch two icons and touches nine has said so before it is committed.

**Adding a colour** is an entry in `VARIANTS` — a family hue, three saturation multipliers, an accent, and where the keywords and the six semantic roles sit on the wheel — plus its name in `Family`, `FAMILY_ORDER`, `TITLE` and `contributes.themes`. It is more than one line on purpose: a variant is a design, and the parts that carry an identity are the parts worth deciding rather than deriving. Everything else follows, and the build will tell you if any two roles ended up closer than the 22-degree floor, if a token drops under AAA, or if the manifest and the themes disagree.

### Centring

Icons are not centred or sized by hand. `npm run measure:glyphs` rasterises every pictogram, mark and string in headless Edge, finds the lit pixels, and writes the result to `tools/glyph-bounds.json` and `tools/text-bounds.json`; the build then places each one from those numbers. It measures the **ink** rather than the bounding box, because the two are not the same thing:

- Artwork that punches holes in itself — the puzzle piece's socket, the gem's facets — has holes that count toward the bounding box but are not ink, so centring on the box leaves the visible shape leaning.
- Imported logos are drawn to their own optical balance inside whatever box upstream chose, and several do not fill it: the Go wordmark is twice as wide as it is tall, the Docker whale sits low. Measuring is what lets them all be fitted to one size regardless.
- SVG `text-anchor="middle"` centres a string's *advance width*, not its ink, and the baseline it wants depends on whether it has a descender (`npm`) or not (`MD`). The ink's measured width is also what lets an over-long string be scaled down instead of running out of the canvas.

Run it after adding or editing artwork or a string — the build stops and points here if it meets one it has no numbers for. It needs a Chromium-based browser; set `MIDNIGHT_INDIGO_BROWSER` if it cannot find one.

### Screenshots

```bash
npm run preview:theme                    # the hero and the language cards, in indigo
node tools/build-theme-preview.ts green  # ... in another family instead
```

Rewrites `docs/preview/` and [`docs/PREVIEW.md`](docs/PREVIEW.md) from the samples in [`tools/samples/`](tools/samples/). Highlighting goes through [Shiki](https://shiki.style) fed this repo's own theme JSON, the TextMate grammars VS Code ships, and the extension's two grammar injections, so a screenshot cannot claim a color the theme does not actually produce. Add a file to `tools/samples/` and an entry to `LANGUAGES` in the script to cover another language; the gallery page picks it up on the next run. Same browser requirement as above.

The hero and the language cards are shot in one family, because their job is to show the syntax rules and eight copies of the same C# sample would say nothing the first one did not. `palettes.png` is the one that shows all eight, and it is written on every run whichever family is named.

```bash
npm run preview:gallery
```

Rewrites the two icon galleries in `docs/preview/` — `icons-files.png` and `icons-folders.png` — from the SVGs in `icons/`, on the theme's own sidebar color. Run it after `npm run build:icons`, because it shoots whatever is currently built.

These have to be images, and they have to be linked absolutely: the Marketplace renders the README and nothing else, `docs/**` is excluded from the package, and a relative image path renders on GitHub but breaks on the listing. Every image in this file is therefore a `raw.githubusercontent.com` URL.

**Pinned to a commit, not to a branch.** These URLs used to name `main`, which has a hole in it: an image added on a branch does not exist on `main` until that branch is merged, so a *new* screenshot is a broken image in the README and in the pull request until then — silently, because Markdown does not complain about a 404, it renders nothing. A commit SHA resolves the moment the commit is pushed, on any branch, and keeps pointing at the screenshots this README was written about rather than at whatever `main` has now.

The cost is a step to remember: after regenerating screenshots, bump `IMAGE_REF` in [`tools/build-theme-preview.ts`](tools/build-theme-preview.ts) to the commit carrying them and update the URLs here.

```bash
npm run check:images
```

Fetches every image the docs link to and fails on any that does not resolve, which is the reminder. It is the one script in this repo that touches the network, and it is never part of a build.

## Development

```bash
git clone https://github.com/DigUu-RL/midnight-indigo.git
cd midnight-indigo
```

Press `F5` to launch an Extension Development Host with the theme loaded, then switch to it as described above. Changes to the theme JSON apply live; changes to `package.json` or the grammar injections need a reload of the host window.

To build a `.vsix`:

```bash
npm install -g @vscode/vsce
vsce package
```

## Contributing

Issues and pull requests are welcome at [github.com/DigUu-RL/midnight-indigo](https://github.com/DigUu-RL/midnight-indigo). When reporting a color problem, please include the language, a small code sample, and a screenshot — scope issues are much easier to fix with the exact token in hand (`Developer: Inspect Editor Tokens and Scopes` from the command palette shows it).

## License

[MIT](LICENSE). The icon sets import the outlines of the language marks from
Simple Icons (CC0-1.0) and devicon (MIT) — see
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). The logos themselves are the
trademarks of their respective owners and are used to identify the file types
they belong to.
