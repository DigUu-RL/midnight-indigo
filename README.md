# Midnight Indigo

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/diguu-rl.midnight-indigo?label=marketplace&color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo&ssr=false#review-details)
[![License: MIT](https://img.shields.io/badge/license-MIT-6C5CE7)](LICENSE)

An ultra-dark purple/indigo theme for Visual Studio Code, bundled with a matching file icon set built on the languages' own official logos.

**[Install from the Visual Studio Marketplace →](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)**

![Midnight Indigo — the color theme and the icon set](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/main/docs/preview/hero.png)

The editor background sits at `#020108` — near-black with an indigo cast — so accent colors stay saturated without glare. Syntax colors are tuned per language rather than applied generically, and semantic highlighting is on by default so identifiers are colored by what they actually are, not by how they look.

## What's included

This is a single extension that contributes both parts. Install once, then enable each one where you want it.

| | |
| --- | --- |
| **Midnight Indigo** | Color theme — 129 workbench colors, 39 TextMate rules, 34 semantic token rules |
| **Midnight Indigo Icons** | File icon theme — 222 SVG icons: 140 file/language icons and 40 contextual folder icons with open/closed variants |
| **Midnight Indigo Icons (Neon)** | The same 222 icons, lit: every color raised until it glows, and the shadow replaced by that glow |

Two grammar injections ship with the theme so a few constructs VS Code does not scope on its own can be colored distinctly:

- **JSX/TSX components** — component tags are colored apart from intrinsic HTML elements (`source.js`, `source.jsx`, `source.ts`, `source.tsx`)
- **C# delegates** — delegate declarations and invocations (`source.cs`)

## Preview

Four of the tuned languages are below. **[Every language is in the full gallery →](https://github.com/DigUu-RL/midnight-indigo/blob/main/docs/PREVIEW.md)** — 17 samples covering TypeScript, React/TSX, JavaScript, C#, Python, PowerShell, Markdown, JSON, HTML, SCSS, SQL, Go, Rust, Java, PHP, YAML and Shell.

Every screenshot is generated from this repository's own theme file using the same TextMate grammars VS Code ships, including the two grammar injections below — so the colors are the theme's, not an artist's impression.

### TypeScript

![TypeScript](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/main/docs/preview/typescript.png)

### React / TSX

![React and TSX](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/main/docs/preview/tsx.png)

### C\#

![C#](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/main/docs/preview/csharp.png)

### Python

![Python](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/main/docs/preview/python.png)

## Install

### From the Marketplace

Search for **Midnight Indigo** in the Extensions view (`Ctrl+Shift+X`), or run:

```bash
code --install-extension diguu-rl.midnight-indigo
```

### Enable the themes

Both are opt-in after install:

1. **Color theme** — `Ctrl+K Ctrl+T` → **Midnight Indigo**
2. **File icons** — `Ctrl+Shift+P` → *Preferences: File Icon Theme* → **Midnight Indigo Icons** or **Midnight Indigo Icons (Neon)**

Or set them directly in `settings.json`:

```json
{
  "workbench.colorTheme": "Midnight Indigo",
  "workbench.iconTheme": "midnight-indigo-icons"
}
```

Use `"midnight-indigo-neon-icons"` for the neon set. Both cover exactly the same files and folders, so switching between them changes nothing but the look.

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

### The neon variant

The neon set is the same 222 icons — same marks, same pictograms, same measured centres, same mappings. Only the paint differs: every color is lifted until it reads as lit rather than merely legible, the shadow is replaced by a glow, and folders invert their weight — the body dims to a dark tint and the rim becomes the lit line.

An official color cannot simply be reused as neon ink, because a color that is right at rest is not one that reads as *lit*: Lua's `#000080` lands at 1.1:1 against the theme's ground, and every logo whose official form is black lands at 1.0:1. So the palette derives the ink instead, keeping the brand's hue and raising saturation and lightness until it clears a contrast floor. TypeScript stays blue and JavaScript stays yellow.

The same problem exists in the classic set, in a milder form — with the tile gone, a dark brand color is now ink on near-black rather than a background to read against. `readable()` lifts those the same way, except for the logos whose official form is black: those ship a white version for dark backgrounds, and that is the one the set uses.

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

The icons in [`icons/svg/`](icons/svg/) and [`icons/svg-neon/`](icons/svg-neon/), and both mappings under [`icons/theme/`](icons/theme/), are **generated** — VS Code reads them directly, but hand-editing them means your change is lost on the next build. Edit the source instead and re-run the generator:

| | |
| --- | --- |
| [`tools/shapes.ts`](tools/shapes.ts) | The drawing primitives, and the two rules everything obeys: fill only, and holes are cut with `evenodd` rather than painted |
| [`tools/glyphs.ts`](tools/glyphs.ts) | The pictogram library — the shapes that are ours. Each is drawn inside a 24×24 box centred on `(0,0)` |
| [`tools/marks.ts`](tools/marks.ts) | The language and tool marks: official palettes over imported geometry, plus the ones drawn by hand |
| [`tools/import-marks.ts`](tools/import-marks.ts) | Fetches the official artwork and writes [`tools/mark-paths.ts`](tools/mark-paths.ts). Only re-run when adding a mark |
| [`tools/icon-spec.ts`](tools/icon-spec.ts) | Which mark, pictogram or string each icon gets, and in which colours |
| [`tools/palette.ts`](tools/palette.ts) | Every colour the build paints with, and the derivations between variants |
| [`tools/build-icons.ts`](tools/build-icons.ts) | The box, the folder geometry, the drawing, and the paint recipe per variant |
| [`tools/build-theme.ts`](tools/build-theme.ts) | The folder-name / extension / filename / language-id → icon mapping, shared by every variant |

```bash
npm run build:icons              # every variant
node tools/build-icons.ts neon   # just one
npm run import:marks             # re-fetch the official logo geometry
npm run typecheck                # tsc, no emit
```

The build scripts are TypeScript, run straight by Node's type stripping — there is no compile step, no bundler and no `dist/`. `typescript` is a devDependency for checking only, and nothing in `tools/` is packaged into the extension. The types are load-bearing rather than decorative: `mark` and `glyph` on a spec are the unions of the real mark and pictogram names, and every entry in the extension / filename / language-id tables must name an icon the spec defines, so a typo is an error in the editor instead of a thrown build.

The build fails if a mapping points at an icon that does not exist, so the two can never drift apart. `npm run preview:icons` additionally writes `icons/preview.html` and `icons/preview-neon.html`, which show every icon at 48px and at the 16px VS Code renders it.

**Adding a variant** is a paint recipe and nothing else. The geometry, the glyph library, the measurements and the mappings are all shared: add a derivation to `tools/palette.ts`, a `file`/`folder` pair to `VARIANTS` in `tools/build-icons.ts`, and an entry to `contributes.iconThemes`. Nothing an existing variant emits changes — the classic set is byte-for-byte reproducible, so `git diff` after a build is the regression test.

### Centring

Icons are not centred or sized by hand. `npm run measure:glyphs` rasterises every pictogram, mark and string in headless Edge, finds the lit pixels, and writes the result to `tools/glyph-bounds.json` and `tools/text-bounds.json`; the build then places each one from those numbers. It measures the **ink** rather than the bounding box, because the two are not the same thing:

- Artwork that punches holes in itself — the puzzle piece's socket, the gem's facets — has holes that count toward the bounding box but are not ink, so centring on the box leaves the visible shape leaning.
- Imported logos are drawn to their own optical balance inside whatever box upstream chose, and several do not fill it: the Go wordmark is twice as wide as it is tall, the Docker whale sits low. Measuring is what lets them all be fitted to one size regardless.
- SVG `text-anchor="middle"` centres a string's *advance width*, not its ink, and the baseline it wants depends on whether it has a descender (`npm`) or not (`MD`). The ink's measured width is also what lets an over-long string be scaled down instead of running out of the canvas.

Run it after adding or editing artwork or a string — the build stops and points here if it meets one it has no numbers for. It needs a Chromium-based browser; set `MIDNIGHT_INDIGO_BROWSER` if it cannot find one.

### Screenshots

```bash
npm run preview:theme
```

Rewrites `docs/preview/` and [`docs/PREVIEW.md`](docs/PREVIEW.md) from the samples in [`tools/samples/`](tools/samples/). Highlighting goes through [Shiki](https://shiki.style) fed this repo's own theme JSON, the TextMate grammars VS Code ships, and the extension's two grammar injections, so a screenshot cannot claim a color the theme does not actually produce. Add a file to `tools/samples/` and an entry to `LANGUAGES` in the script to cover another language; the gallery page picks it up on the next run. Same browser requirement as above.

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
