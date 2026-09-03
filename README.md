# Midnight Indigo

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/diguu-rl.midnight-indigo?label=marketplace&color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo&ssr=false#review-details)
[![License: MIT](https://img.shields.io/badge/license-MIT-6C5CE7)](LICENSE)

An ultra-dark purple/indigo theme for Visual Studio Code, bundled with a matching file icon set built on real language logos.

**[Install from the Visual Studio Marketplace →](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)**

![Midnight Indigo — the color theme and the icon set](https://raw.githubusercontent.com/DigUu-RL/midnight-indigo/main/docs/preview/hero.png)

The editor background sits at `#020108` — near-black with an indigo cast — so accent colors stay saturated without glare. Syntax colors are tuned per language rather than applied generically, and semantic highlighting is on by default so identifiers are colored by what they actually are, not by how they look.

## What's included

This is a single extension that contributes both parts. Install once, then enable each one where you want it.

| | |
| --- | --- |
| **Midnight Indigo** | Color theme — 129 workbench colors, 39 TextMate rules, 34 semantic token rules |
| **Midnight Indigo Icons** | File icon theme — 222 SVG icons: 140 file/language icons and 40 contextual folder icons with open/closed variants |
| **Midnight Indigo Icons (Neon)** | The same 222 icons, lit: brand-colored ink glowing on a dark ground instead of a brand-colored tile |

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

- **Files are a solid tile.** Each file icon is a 26×26 rounded tile in the language's brand color, carrying its official mark — the JavaScript yellow `#F7DF1E` with `JS`, the PHP violet, the Java cup, the Python hooks, the Docker whale, the Git branch. Languages with no logo of their own get the acronym they are known by, set large and heavy on the tile so it reads without leaning into the screen. Every glyph is drawn on the same centred grid, so nothing sits off-axis.
- **Folders are an outline.** A stroked lavender folder, so files and folders never read as the same object. The category pictogram sits at the folder's lower-right — where a badge used to be — but it is the pictogram itself, drawn large and ringed with a hairline in the editor background color (`#020108`) that separates it from the folder beneath.
- **No badges.** File name patterns get their own icon rather than a marker pasted onto a base one: `*.spec.ts` is a flask, `*.module.ts` is a set of blocks, `*.service.ts` a cog, `*.guard.ts` a shield, `*.dto.ts` a pair of arrows. The tile stays the language color, so you read the language and the role at the same time.

- **40 contextual folder icons**, each with an open and closed variant, matching several name synonyms per category: `components`, `hooks`, `functions`, `utils`, `helpers`, `services`, `controllers`, `models`, `views/pages`, `layouts`, `store/redux`, `context/providers`, `middleware`, `guards`, `routes`, `api`, `config`, `scripts/cli`, `tests/spec/e2e`, `mocks/fixtures`, `assets`, `images`, `icons`, `fonts`, `styles/themes`, `public`, `build/dist`, `docs`, `database/migrations`, `types/interfaces`, `constants/enums`, `core/lib`, `plugins/features`, `i18n`, `directives/pipes/decorators`, `validators`, `docker/kubernetes`, `workflows/.github`, `server`, `shared/common`, `security/auth`.
- **140 file and language icons** covering JS/TS/JSX/TSX, HTML/CSS/SCSS/SASS/LESS/Stylus, JSON/YAML/TOML/INI/XML/ENV, Markdown/MDX, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C/C++/C#/F#/VB.NET, PHP, SQL, Shell/Zsh/Fish/PowerShell/Batch, Perl, Lua, Dart, Elixir, Erlang, Haskell, Clojure, Scala, Groovy, R, Julia, Nim, Crystal, Zig, Objective-C, Solidity, Assembly, Vue, Svelte, Astro, GraphQL, Docker, Terraform, Jupyter, images, fonts, audio, video, archives, certificates, PDF/Office documents, and well-known config files (`package.json`, `.eslintrc`, `.prettierrc`, `tsconfig.json`, `webpack`/`vite`/`rollup`, `Dockerfile`, `Makefile`, `.gitignore`, `nginx.conf`, CI files).
- **Filename-pattern variants**, each a dedicated icon: `*.spec.ts(x)`, `*.test.ts(x)`, `*.d.ts`, `*.module.ts/scss/css`, `*.component.ts(x)`, `*.service.ts`, `*.stories.ts(x)`, `*.config.ts/js`, `*.min.js`, `*.guard.ts`, `*.pipe.ts`, `*.directive.ts`, `*.controller.ts`, `*.model.ts`, `*.dto.ts`, `*.entity.ts`.

### The neon variant

The neon set is the same 222 icons — same geometry, same glyphs, same measured centres, same mappings. Only the paint differs: the tile becomes the dark indigo ground, the brand color moves onto the ink, and a soft glow sits under the artwork.

The brand color cannot simply be reused as ink, because a color chosen to be read *against* is not one that reads *on* a dark ground: Kotlin's `#241C3A` lands at 1.09:1 against the tile and Lua's `#00007B` at 1.08:1 — 32 of the 140 file icons would have been invisible. So the palette derives the ink instead, keeping the brand's hue and raising saturation and lightness until it clears a contrast floor. TypeScript stays blue and JavaScript stays yellow; every icon in the set clears 3.5:1.

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
| [`tools/glyphs.ts`](tools/glyphs.ts) | The pictogram library. Every glyph is drawn fill-only inside a 24×24 box centred on `(0,0)` |
| [`tools/icon-spec.ts`](tools/icon-spec.ts) | Which colour and which glyph or acronym each icon gets |
| [`tools/palette.ts`](tools/palette.ts) | Every colour the build paints with, and the derivations between variants |
| [`tools/build-icons.ts`](tools/build-icons.ts) | The tile and folder geometry, the drawing, and the paint recipe per variant |
| [`tools/build-theme.ts`](tools/build-theme.ts) | The folder-name / extension / filename / language-id → icon mapping, shared by every variant |

```bash
npm run build:icons              # every variant
node tools/build-icons.ts neon   # just one
npm run typecheck                # tsc, no emit
```

The build scripts are TypeScript, run straight by Node's type stripping — there is no compile step, no bundler and no `dist/`. `typescript` is a devDependency for checking only, and nothing in `tools/` is packaged into the extension. The types are load-bearing rather than decorative: `glyph` is the union of the 89 real glyph names, and every entry in the extension / filename / language-id tables must name an icon the spec defines, so a typo is an error in the editor instead of a thrown build.

The build fails if a mapping points at an icon that does not exist, so the two can never drift apart. `npm run preview:icons` additionally writes `icons/preview.html` and `icons/preview-neon.html`, which show every icon at 48px and at the 16px VS Code renders it.

**Adding a variant** is a paint recipe and nothing else. The geometry, the glyph library, the measurements and the mappings are all shared: add a derivation to `tools/palette.ts`, a `file`/`folder` pair to `VARIANTS` in `tools/build-icons.ts`, and an entry to `contributes.iconThemes`. Nothing an existing variant emits changes — the classic set is byte-for-byte reproducible, so `git diff` after a build is the regression test.

### Centring

Icons are not centred by hand. `npm run measure:glyphs` rasterises every glyph and acronym in headless Edge, finds the lit pixels, and writes the result to `tools/glyph-bounds.json` and `tools/text-bounds.json`; the build then places each one from those numbers. It measures the **ink** rather than the bounding box, because the two are not the same thing:

- Glyphs that punch holes in themselves — the puzzle piece's socket, the gem's facets — have holes that count toward the bounding box but are not ink, so centring on the box leaves the visible shape leaning.
- SVG `text-anchor="middle"` centres an acronym's *advance width*, not its ink, and the baseline a string wants depends on whether it has a descender (`php`) or not (`MD`).

Run it after adding or editing a glyph or an acronym — the build stops and points here if it meets one it has no numbers for. It needs a Chromium-based browser; set `MIDNIGHT_INDIGO_BROWSER` if it cannot find one.

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

[MIT](LICENSE)
