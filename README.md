# Midnight Indigo

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/diguu-rl.midnight-indigo?label=marketplace&color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo&ssr=false#review-details)
[![License: MIT](https://img.shields.io/badge/license-MIT-6C5CE7)](LICENSE)

An ultra-dark theme for Visual Studio Code in eight colors, bundled with a matching file icon set built on the languages' own official logos.

**[Install from the Visual Studio Marketplace →](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)**

![Midnight — the color theme and the icon set](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/d57c1e5dd621f6dcef2db035175cc571da78b27a/docs/preview/hero.png)

The editor background sits at `#020108` — near-black with the family's cast — so accent colors stay saturated without glare. Syntax colors are tuned per language rather than applied generically, and semantic highlighting is on by default so identifiers are colored by what they actually are, not by how they look.

The eight palettes are not eight themes. They are one theme at eight hues: the same lightnesses, the same contrast, the same rules, generated from a single source so that switching color never means switching to something that behaves differently. **Midnight Indigo** is the original, and it is unchanged.

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

They are generated, from one theme and one number per color. [`tools/theme-palette.ts`](tools/theme-palette.ts) holds the whole design; the notes below are the short version.

### The theme was already one hue

Measured in [OKLCH](https://bottosson.github.io/posts/oklab/), 30 of the theme's 39 colors land inside a 19-degree band around hue 290. The grounds, the borders, the selection, the accent, the foreground ramp and four of the syntax roles — variables, properties, operators, comments — are not thirty independent decisions. They are one hue seen at thirty lightnesses. The pink the keywords are set in sits at a fixed offset from it, and its darker partner further round; a relationship rather than a coordinate.

All of that rotates together. What is left — strings, functions, types, numbers — means something outside this theme, and moves less.

### Why OKLCH and not HSL

Because HSL's `L` is not lightness. It is the midpoint of the largest and smallest channel, which says nothing about how bright a color looks: hue 60 and hue 240 at identical `S` and `L` are a headlight and a bruise. Rotate a theme in HSL and the yellow variant blows out while the blue one goes muddy, from the same numbers. OKLCH's `L` *is* perceived lightness, so rotating hue is as close as arithmetic gets to "the same color, somewhere else on the wheel" — which is the entire premise here.

Chroma stays absolute for the same reason. It is tempting to store it as a fraction of what each hue can hold, since sRGB carries far more chroma at magenta than at green — but OKLCH chroma is *already* the perceptually comparable quantity, and normalizing it against the gamut undoes the thing OKLCH was chosen for. Tried, it produced `#FF53F7` keywords in the red variant. It was also built on a false premise: indigo's own operators, keywords, calls and enum members already sit at 100% of their hue's chroma, so "reuse the fraction" meant "sit on the gamut edge everywhere", and the edge is a long way out in magenta.

### A variant is rebuilt, not tinted

The first version of this held lightness and chroma fixed and rotated only the family hue, and every variant came out looking like the original under colored glass. Measuring said why: the semantic layer — most of what is actually on a screen — sat **0.009 to 0.035** away from indigo in OKLab. It had not moved at all.

Three things fix that, and each is in the generator for this reason:

- **Every token takes some of the rotation.** The share is weighted by how much convention is behind a role, but it has a floor: freezing the roles with the strongest conventions meant freezing strings and function calls, which are the two that cover the most screen.
- **The drift saturates instead of clamping.** A hard cap hands the same answer to every family past the limit, so red (97° from indigo) and orange (130°) were given an identical semantic layer — the same strings, the same types, in two themes that are supposed to be different colors. Green and cyan collapsed together the same way.
- **A hue gets the lightness it needs.** OKLCH holds perceived lightness across hue and that is still not the whole story: a saturated hue near 100 at `L` 0.73 reads as khaki, not as yellow-green. The theme knew this before the generator existed — its warm roles all sit high, lime interfaces at 0.885 and amber numbers at 0.843, while its cool ones sit low. That correction is applied as a *difference* between where a role's hue was and where it moved to, so a role that stays put gets nothing and indigo is untouched.

  It applies only where a color is bright enough to be read as a color. There is no khaki at `L` 0.08 — there is near-black with a hint of hue in it — and correcting it there does not rescue anything, it just makes the theme paler: ungated, this took the orange variant's editor background from `L` 0.083 to 0.143 and its side bar to 0.176, a brownish grey rather than the near-black the theme is built on. All eight grounds now sit within 0.008 of indigo's.

### A string still stays green

Crowded is not a metaphor. In the green, cyan and blue variants the family hue lands inside the arc the semantic roles occupy, and something has to move. The generator solves that arrangement — keeping the roles in their cyclic order, so warm stays warm — instead of nudging colors apart until they look separated, and it reports any variant it had to squeeze.

### The separations are the theme's own

There is no rule that two token colors must be some fixed number of degrees apart, because the theme does not obey one: enum members and numbers sit 19 degrees apart on purpose, told apart by lightness and chroma. So each pair is owed *whatever it already had*, under a ceiling. The generator cannot make anything better separated than the author made it; it can only stop a rotation from making it worse.

Legibility is held to an absolute standard rather than to indigo's, because the variants are meant to differ: every code token clears WCAG AAA at 7:1, which the shipped theme already did — its dimmest token being the operators at 7.55:1 — so no variant can trade legibility for color. Chrome text is held to its own indigo value with slack, since that ramp is deliberately graded and the bottom of it, the comments at 3.76:1, sits below AA on purpose.

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
| [`tools/color.ts`](tools/color.ts) | Colour-space maths — sRGB, WCAG contrast, and the OKLCH conversion the palettes rotate in |
| [`tools/theme-palette.ts`](tools/theme-palette.ts) | The eight families, the role table, and the rules that keep the tokens apart |
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

**Adding a colour** is one line — a name and an OKLCH hue in `FAMILIES` — plus its entry in `contributes.themes`. Everything else follows: the role table, the separations and the checks are shared, and the build will tell you if the new hue leaves the wheel too crowded to give every token the separation the original had.

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
