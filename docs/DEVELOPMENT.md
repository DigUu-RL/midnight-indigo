# Development

How to build the theme, check it, regenerate its screenshots and release it. [Versão em português](DEVELOPMENT.pt-BR.md).

## Setup

```bash
git clone https://github.com/DigUu-RL/midnight-indigo.git
cd midnight-indigo
npm install
```

Node 22.18 or later: the build scripts are TypeScript run straight by Node's type stripping — no compile step, no bundler, no `dist/`. `typescript` is a devDependency for checking only.

Press `F5` in VS Code to open an Extension Development Host with the theme loaded. Changes to the theme JSON apply live; changes to `package.json` or the grammar injection need a reload of the host window.

## Generated, not edited

Everything under [`themes/`](../themes/), [`icons/svg/`](../icons/svg/) and [`icons/theme/`](../icons/theme/) is generated. VS Code reads those files directly, but a hand edit is lost on the next build — edit the source and rebuild. `npm run check` refuses a generated file the build would not write.

The sources live in [`tools/`](../tools/), one folder per concern:

| Folder | What is in it |
| --- | --- |
| [`shared/`](../tools/shared/) | Color maths (sRGB, WCAG contrast, gamut-safe OKLCH), the headless browser, hashing |
| [`theme/`](../tools/theme/) | The palettes, the tokens, the color-theme build and its checks, the v3.0.0 baseline, the accessibility audit |
| [`syntax/`](../tools/syntax/) | The code samples and the corpus, and the syntax check |
| [`icons/`](../tools/icons/) | The icon specification, the imported artwork, the build, the measurements and the audits |
| [`preview/`](../tools/preview/) | The screenshots in [`docs/preview/`](preview/) |
| [`docs/`](../tools/docs/) | The inventory and the image check |
| [`regression/`](../tools/regression/) | The snapshots, and the visual regression run in a browser and in real VS Code |
| [`release/`](../tools/release/) | The check of what the package holds |

The files that matter most:

| File | What it holds |
| --- | --- |
| [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts) | The role table and the eight family designs — see [`COLOR-SYSTEM.md`](COLOR-SYSTEM.md) |
| [`tools/theme/theme-tokens.ts`](../tools/theme/theme-tokens.ts) | The tokens, each with the sentence that says what it is for, and the interaction states — see [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) |
| [`tools/theme/build-color-themes.ts`](../tools/theme/build-color-themes.ts) | The theme structure, written once against tokens, and every check the build makes |
| [`tools/theme/baseline.ts`](../tools/theme/baseline.ts) | The baseline's pinned hash, and the amendments to it |
| [`tools/icons/icon-spec.ts`](../tools/icons/icon-spec.ts) | Which mark, pictogram or lettering each icon gets, and in which colors — see [`ICON-SYSTEM.md`](ICON-SYSTEM.md) |
| [`tools/icons/build-theme.ts`](../tools/icons/build-theme.ts) | The extension, file-name, folder-name and language-id mapping, and the check that it is closed |
| [`tools/icons/palette.ts`](../tools/icons/palette.ts) | Every color the icon build paints with, the folder roles among them |
| [`tools/check.ts`](../tools/check.ts) | Every offline check; a new one is one entry in `CHECKS` |

## Commands

```bash
npm run build                    # themes, then icons
npm run build:themes             # the eight color themes
npm run build:icons              # the icon set
npm run check                    # every offline check — must pass before a commit
npm run typecheck                # tsc, no emit

npm run measure:glyphs           # re-measure the artwork after changing a mark or pictogram
npm run audit:icons              # re-audit the built icons
npm run audit:coverage           # resolve real repositories' file names against the icon theme
npm run audit:accessibility      # rewrite docs/ACCESSIBILITY.md
npm run inventory                # rewrite docs/INVENTORY.md, SYNTAX.md and TOKENS.md

npm run preview:theme            # the hero, the palettes and the language cards
npm run preview:gallery          # the two icon galleries
npm run preview:workbench        # the workbench screenshots, from reviewed shots of real VS Code

npm run snapshot                 # rewrite the snapshots after a change that is meant
npm run regression               # previews, baseline, measurements and real VS Code, compared
npm run regression -- --accept   # the last run's VS Code shots become the reviewed ones

npm run import:marks             # re-fetch the official logo geometry
npm run import:pictograms        # re-fetch the pictograms from Iconify
npm run import:vscode-colors     # re-fetch VS Code's documented color IDs
npm run check:images             # every image the docs link to, the badges included (network)
npm run check:package            # what vsce would package, against what the extension is

npm run package                  # midnight-indigo-<version>.vsix
```

The measurements, the audits and the screenshots need a Chromium-based browser; set `MIDNIGHT_INDIGO_BROWSER` if one is not found. `npm run regression` also needs VS Code. The three `import:` scripts are the only ones that touch the network, and none is part of a build.

## Checks

`npm run check` runs, without stopping at the first failure:

- the type check;
- the theme build, which holds the baseline, the token rules, contrast, hue separation, the interaction states, the signals, Git, the terminal and chat, and the manifest;
- the accessibility audit, against [`ACCESSIBILITY.md`](ACCESSIBILITY.md);
- the syntax check, which tokenizes the corpus in all eight families with semantic highlighting off and on;
- the icon build and the optical audit;
- a second build of both, which must not change a byte, and the generated files against the tree;
- the four snapshots — structure, every color in all eight families, icon associations and icon geometry;
- that every screenshot and measurement was rendered from the inputs in the tree;
- that every image and every page or file the docs link to is in the tree;
- the package: what `vsce` would ship is exactly the manifest, the docs the Marketplace reads, and what `package.json` contributes;
- that [`INVENTORY.md`](INVENTORY.md) still describes the tree.

[`REGRESSION.md`](REGRESSION.md) explains the snapshots and the regression run in full.

## Screenshots

Screenshots are generated, never edited, and committed in [`docs/preview/`](preview/).

- **The hero, the palettes and the language cards** are rendered with [Shiki](https://shiki.style) fed this repository's own theme files, the grammars VS Code ships and the extension's grammar injection, so a screenshot cannot claim a color the theme does not produce. Add a sample to [`tools/syntax/samples/`](../tools/syntax/samples/) and an entry to `LANGUAGES` in [`build-theme-preview.ts`](../tools/preview/build-theme-preview.ts) to cover another language.
- **The icon galleries** are the built SVGs on the side bar's color. Run them after `npm run build:icons`.
- **The workbench screenshots** are real VS Code, copied from the shots `npm run regression` took and someone reviewed and accepted. The script refuses a shot taken of other themes or icons than the tree's.

`npm run check` knows when a screenshot was rendered from inputs that have since changed, and names the command that brings it up to date.

Screenshots are linked by relative path. GitHub resolves it in whichever branch is read, and `vsce package` rewrites the README's links to the repository's `raw/HEAD`, so the Marketplace shows the default branch's current screenshots with nothing to bump.

## Releasing

1. **Check.** `npm run check` passes.
2. **Look.** `npm run regression` passes, or every sheet it names has been looked at and accepted. Regenerate whatever `npm run check` calls stale.
3. **Write it down.** Move `[Unreleased]` in [`CHANGELOG.md`](../CHANGELOG.md) under the new version and date. A version that changes what an installed theme looks like is a major one.
4. **Version.** `npm version <major|minor|patch> --no-git-tag-version`, then commit.
5. **Package.** `npm run package` writes `midnight-indigo-<version>.vsix`. `vsce` is a pinned devDependency, so the same tree packages the same way.
6. **Install it.** `code --install-extension midnight-indigo-<version>.vsix --force` over the previous version, reload, and confirm the eight themes and the icon theme are listed and the selected ones still apply.
7. **Publish.** `npx vsce publish --packagePath midnight-indigo-<version>.vsix`, then tag the commit `v<version>`, push the tag, and create the GitHub release with the changelog section and the `.vsix` attached.
