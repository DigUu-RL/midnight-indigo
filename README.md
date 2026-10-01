# Midnight Indigo

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/diguu-rl.midnight-indigo?label=marketplace&color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/diguu-rl.midnight-indigo?color=6C5CE7)](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo&ssr=false#review-details)
[![License: MIT](https://img.shields.io/badge/license-MIT-6C5CE7)](LICENSE)

An ultra-dark theme for Visual Studio Code in eight colors, with a file icon set built on the languages' own logos. [Leia em português](README.pt-BR.md).

**[Install from the Visual Studio Marketplace →](https://marketplace.visualstudio.com/items?itemName=diguu-rl.midnight-indigo)**

![Midnight — the color theme and the icon set](docs/preview/hero.png)

The editor sits at `#020108` — near-black with the theme's cast — so colors stay saturated without glare through a long session. The code is the brightest, most colorful thing on the screen; everything around it, from the side bar to the terminal and chat, is part of the same design and says what it means in as few colors as it can.

## What's included

One extension. Install it once, then pick a color theme and turn on the icons.

| | |
| --- | --- |
| **Midnight Indigo**, **Purple**, **Pink**, **Red**, **Orange**, **Green**, **Cyan**, **Blue** | Eight color themes, each setting 877 of VS Code's colors, 75 TextMate rules and 59 semantic token rules |
| **Midnight Icons** | A file icon theme: 305 file and language icons and 53 folders, matched to 636 extensions, 372 file names and 118 languages — shared by all eight themes |

## Eight colors, one theme

![The eight Midnight palettes](docs/preview/palettes.png)

The eight are one theme in eight colors: the same structure, the same rules, the same legibility floor, so switching color never means switching to something that behaves differently. Each palette is designed for its own hue rather than tinted from another. A string is green where the family leaves room for green, and something deliberate where it does not — in Midnight Green the strings are yellow-green, because green is the theme's own.

**Midnight Indigo** is the original. Its colors are held, by a check in the build, to what v3.0.0 shipped; the few that changed since were changed on purpose, for legibility or meaning, and each is recorded with its reason.

![The explorer and editor in all eight themes](docs/preview/workbench-variants.png)

How the palettes are made is in [**the color system**](docs/COLOR-SYSTEM.md).

## The whole workbench

Every part of VS Code is drawn by the theme, not left to VS Code's defaults: menus, the command center, tabs, notifications, the Settings editor, notebooks, debugging, testing, the terminal, diffs, merges, the Source Control graph, comment threads, chat, inline chat, suggested edits and the Agents window.

A color that means something means it everywhere. **Red** is an error — the squiggle, the failed test, the terminal's red and a removed line are one red, and no keyword is ever drawn in it. **Yellow** is a warning and a conflict, **blue** a change, **green** an addition or a pass. The AI speaks in the theme's own accent, and only where it acts.

| | |
| --- | --- |
| ![A diff in Midnight Indigo](docs/preview/workbench-diff.png) | ![Source Control in Midnight Orange](docs/preview/workbench-source-control.png) |
| A diff, in Indigo | Source Control, in Orange |
| ![Debugging in Midnight Cyan](docs/preview/workbench-debug.png) | ![Chat in Midnight Purple](docs/preview/workbench-chat.png) |
| Debugging, in Cyan | Chat, in Purple |

These are screenshots of VS Code itself, with the theme installed. The rules behind them — surfaces, states, signals — are [**the design system**](docs/DESIGN-SYSTEM.md).

## Syntax

### Keywords are the signature

A keyword is the loudest word in the code, so it is what says which theme this is. Keywords are **bold italic** in every theme and every language, and each theme writes them in its own color: pink in Indigo, orange in Orange, green in Green. Their shape is a cue that does not depend on color.

The rest of the code follows a few rules that hold everywhere: declarations are bold and uses are plain, so a function is bold where it is defined and plain where it is called; operators are color only, never bold or italic; comments recede, but never below a contrast you can read.

### Semantic highlighting

Semantic highlighting is on by default. With it, a name is colored by what the language server says it is — a class, a parameter, a constant, an enum member — not by how it looks. The theme covers the tokens TypeScript, C# (Roslyn), Python (Pylance), Rust (rust-analyzer), Go (gopls) and Java send, and draws each exactly as its TextMate scope, so a word is the same color whether semantic highlighting has arrived yet or not.

Rules are written for, and checked against real code in, TypeScript, JavaScript, JSX/TSX, C#, Python, Rust, Go, Java, Kotlin, PHP, HTML, CSS, SCSS, SQL, Markdown, YAML, JSON, PowerShell and Shell. Every other language falls back to a general rule set over the standard scopes.

| | |
| --- | --- |
| ![TypeScript](docs/preview/typescript.png) | ![C#](docs/preview/csharp.png) |
| ![React and TSX](docs/preview/tsx.png) | ![Python](docs/preview/python.png) |

**[Every language is in the full gallery →](docs/PREVIEW.md)** What every scope and token is drawn as is in [`SYNTAX.md`](docs/SYNTAX.md).

## Icons

![Every file and language icon](docs/preview/icons-files.png)

The set is built around one rule: an icon has to be recognizable at the 16 pixels VS Code draws it at.

- **The logo is the icon.** No tiles: each file icon is the language's or tool's own mark, imported from its official artwork, flat, in its own colors — the same in every theme.
- **Placed by weight.** Every icon is measured and centred by its ink, not its box, and checked so that no two look alike at 16px.
- **No badges.** `*.spec.ts` is a flask, `*.service.ts` a cog, `*.dto.ts` a pair of arrows — in the language's color, so you read the language and the role at once.
- **Folders say what they are for.** Their color is their role — interface, content, logic, data, network, quality, security, tooling, dormant — and calmer than the logos, so they never outweigh the files inside them.

![Every folder icon](docs/preview/icons-folders.png)

How the set is drawn, and everything it covers, is in [**the icon system**](docs/ICON-SYSTEM.md).

## Accessibility

Every theme is held to its own targets: 7:1 for code, 4.5:1 for other text, 3:1 for what is meant to recede and for squiggles, focus rings and icons. Keywords, deprecated names and focus have cues that do not depend on color, and every signal that differs by hue is checked under simulated color-vision deficiency. [`ACCESSIBILITY.md`](docs/ACCESSIBILITY.md) has every measurement, in all eight themes.

## Made for current VS Code

The theme is built against the colors VS Code documents today — it sets 871 of 971 — and checked in VS Code 1.140, including the modern tab layout, chat, inline chat, suggested edits, the Agents window and the Source Control graph. The rest are left to VS Code on purpose, and [`INVENTORY.md`](docs/INVENTORY.md) says why for each.

It installs on VS Code 1.60 and later. An older VS Code ignores the colors it does not know, and the surfaces they belong to keep its own defaults.

## Install

Search for **Midnight Indigo** in the Extensions view (`Ctrl+Shift+X`), or run:

```bash
code --install-extension diguu-rl.midnight-indigo
```

Both themes are opt-in after install:

1. **Color theme** — `Ctrl+K Ctrl+T` → **Midnight Indigo** (or Purple, Pink, Red, Orange, Green, Cyan, Blue)
2. **File icons** — `Ctrl+Shift+P` → *Preferences: File Icon Theme* → **Midnight Icons**

Or in `settings.json`:

```json
{
  "workbench.colorTheme": "Midnight Indigo",
  "workbench.iconTheme": "midnight-indigo-icons"
}
```

## Customize

Override any color in your own `settings.json`, without forking the theme:

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

The name in brackets is the theme's label, so an override applies to that theme only — `[Midnight Green]` for the green one. Drop the brackets to apply it to all eight.

## Documentation

| | |
| --- | --- |
| [Design system](docs/DESIGN-SYSTEM.md) | The rules: tokens, surfaces, interaction states, signals, the AI, code and what sits on top of it |
| [Color system](docs/COLOR-SYSTEM.md) | How the eight palettes are made, and what the build checks |
| [Syntax](docs/SYNTAX.md) | What every TextMate scope and semantic token is drawn as |
| [Icon system](docs/ICON-SYSTEM.md) | How the icons are drawn, placed and checked, and what they cover |
| [Tokens](docs/TOKENS.md) | Every token, with its value in every theme |
| [Accessibility](docs/ACCESSIBILITY.md) | Every contrast pair and cue, measured in every theme |
| [Inventory](docs/INVENTORY.md) | What the extension contains, and what it leaves to VS Code |
| [Regression](docs/REGRESSION.md) | How a visible change is kept from landing unseen |
| [Development](docs/DEVELOPMENT.md) | Building, checking, screenshots and releasing |

## Contributing

Issues and pull requests are welcome at [github.com/DigUu-RL/midnight-indigo](https://github.com/DigUu-RL/midnight-indigo). When reporting a color problem, please include the language, a small code sample and a screenshot — `Developer: Inspect Editor Tokens and Scopes` from the command palette shows the exact token. [`DEVELOPMENT.md`](docs/DEVELOPMENT.md) explains how to build and check a change.

## License

[MIT](LICENSE). The icons import the outlines of the language marks from Simple Icons (CC0-1.0) and devicon (MIT), and the pictograms from Phosphor and other Iconify collections — see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). The logos are trademarks of their respective owners, used to identify the file types they belong to.
