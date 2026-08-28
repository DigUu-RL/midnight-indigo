# Midnight Indigo

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/diguu-rl.midnight-indigo?label=marketplace&color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo&ssr=false#review-details)
[![License: MIT](https://img.shields.io/badge/license-MIT-6C5CE7)](LICENSE)

An ultra-dark purple/indigo theme for Visual Studio Code, bundled with a matching flat pastel file icon set.

**[Install from the Visual Studio Marketplace →](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)**

The editor background sits at `#020108` — near-black with an indigo cast — so accent colors stay saturated without glare. Syntax colors are tuned per language rather than applied generically, and semantic highlighting is on by default so identifiers are colored by what they actually are, not by how they look.

## What's included

This is a single extension that contributes both parts. Install once, then enable each one where you want it.

| | |
| --- | --- |
| **Midnight Indigo** | Color theme — 129 workbench colors, 39 TextMate rules, 34 semantic token rules |
| **Midnight Indigo Icons** | File icon theme — 222 SVG icons: 140 file/language icons and 40 contextual folder icons with open/closed variants |

Two grammar injections ship with the theme so a few constructs VS Code does not scope on its own can be colored distinctly:

- **JSX/TSX components** — component tags are colored apart from intrinsic HTML elements (`source.js`, `source.jsx`, `source.ts`, `source.tsx`)
- **C# delegates** — delegate declarations and invocations (`source.cs`)

## Install

### From the Marketplace

Search for **Midnight Indigo** in the Extensions view (`Ctrl+Shift+X`), or run:

```bash
code --install-extension diguu-rl.midnight-indigo
```

### Enable the themes

Both are opt-in after install:

1. **Color theme** — `Ctrl+K Ctrl+T` → **Midnight Indigo**
2. **File icons** — `Ctrl+Shift+P` → *Preferences: File Icon Theme* → **Midnight Indigo Icons**

Or set them directly in `settings.json`:

```json
{
  "workbench.colorTheme": "Midnight Indigo",
  "workbench.iconTheme": "midnight-indigo-icons"
}
```

## Language coverage

Semantic and TextMate rules are tuned specifically for JavaScript, TypeScript, JSX/TSX, C#, PowerShell, Python, Markdown and JSON.

Every other language falls back to the general rule set, which covers the standard scopes (keywords, strings, numbers, comments, types, functions, variables, operators, punctuation).

### Icon theme coverage

- **40 contextual folder icons**, each with an open and closed variant, matching several name synonyms per category: `components`, `hooks`, `functions`, `utils`, `helpers`, `services`, `controllers`, `models`, `views/pages`, `layouts`, `store/redux`, `context/providers`, `middleware`, `guards`, `routes`, `api`, `config`, `scripts/cli`, `tests/spec/e2e`, `mocks/fixtures`, `assets`, `images`, `icons`, `fonts`, `styles/themes`, `public`, `build/dist`, `docs`, `database/migrations`, `types/interfaces`, `constants/enums`, `core/lib`, `plugins/features`, `i18n`, `directives/pipes/decorators`, `validators`, `docker/kubernetes`, `workflows/.github`, `server`, `shared/common`, `security/auth`.
- **140 file and language icons** covering JS/TS/JSX/TSX, HTML/CSS/SCSS/SASS/LESS/Stylus, JSON/YAML/TOML/INI/XML/ENV, Markdown/MDX, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C/C++/C#/F#/VB.NET, PHP, SQL, Shell/Zsh/Fish/PowerShell/Batch, Perl, Lua, Dart, Elixir, Erlang, Haskell, Clojure, Scala, Groovy, R, Julia, Nim, Crystal, Zig, Objective-C, Solidity, Assembly, Vue, Svelte, Astro, GraphQL, Docker, Terraform, Jupyter, images, fonts, audio, video, archives, certificates, PDF/Office documents, and well-known config files (`package.json`, `.eslintrc`, `.prettierrc`, `tsconfig.json`, `webpack`/`vite`/`rollup`, `Dockerfile`, `Makefile`, `.gitignore`, `nginx.conf`, CI files).
- **Filename-pattern variants**, marked with a small badge over the base icon: `*.spec.ts(x)`, `*.test.ts(x)`, `*.d.ts`, `*.module.ts/scss/css`, `*.component.ts(x)`, `*.service.ts`, `*.stories.ts(x)`, `*.config.ts/js`, `*.min.js`, `*.guard.ts`, `*.pipe.ts`, `*.directive.ts`, `*.controller.ts`, `*.model.ts`, `*.dto.ts`, `*.entity.ts`.

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

To change the icons, edit the `fill` attribute of the relevant file in `icons/svg/` — VS Code reads the SVGs directly, nothing needs to be regenerated. The folder/extension/filename → icon mapping lives in [`icons/theme/midnight-indigo-icon-theme.json`](icons/theme/midnight-indigo-icon-theme.json).

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
