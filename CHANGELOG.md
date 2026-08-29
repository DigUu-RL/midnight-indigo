# Changelog

All notable changes to the Midnight Indigo extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0]

The icon set was thrown away and redrawn from scratch as a single variant. If you were using the outlined theme, switch your `workbench.iconTheme` to `midnight-indigo-icons`.

### Removed

- **Midnight Indigo Icons — Outlined** (`midnight-indigo-icons-outlined`). There is now one icon theme, not two.
- **Every badge.** The small circle stamped over folder and file icons was unreadable at tree size and only made the icon underneath harder to parse.

### Added

- A generator under [`tools/`](tools/) that produces `icons/svg/` and the theme manifest from a single spec, so every icon shares one grid, one optical size and one centre. It fails the build if a mapping points at a missing icon.
- A generated preview gallery: `npm run preview:theme` renders a mock editor window plus 17 language samples into `docs/preview/`, and writes [`docs/PREVIEW.md`](docs/PREVIEW.md) to index them. The README and the Marketplace listing now lead with a screenshot. Highlighting runs through Shiki fed this repo's own theme JSON, the TextMate grammars VS Code ships and the extension's two grammar injections, so a screenshot cannot show a color the theme does not produce.
- `npm run measure:glyphs`, which rasterises every glyph and acronym and records where its ink actually falls. The build centres and size-caps from those measurements, so no icon is positioned by eye. Measuring the ink rather than the bounding box is what fixes glyphs with holes in them (the puzzle piece, the gem — their sockets and facets count toward the box but are not ink) and acronyms (`text-anchor="middle"` centres the advance width, not the ink, and `php` has a descender where `MD` does not).
- Dedicated icons for every filename pattern, replacing the badge-over-base-icon approach: `*.spec.ts` is a flask, `*.module.ts` a set of blocks, `*.service.ts` a cog, `*.controller.ts` sliders, `*.guard.ts` a shield, `*.pipe.ts` a funnel, `*.directive.ts` a wand, `*.model.ts` a cylinder, `*.dto.ts` exchange arrows, `*.entity.ts` a table, `*.d.ts` a tag, `*.stories.ts` a book, `*.min.js` compress arrows.

### Changed

- **File icons are now a solid tile** — a 26×26 rounded rect in the language's brand color carrying its official mark, rather than a bare glyph floating on the background. On a near-black editor background this is what makes them readable at 16px.
- **Language logos replace lettering** wherever one exists: the Java cup, the Python hooks, the Docker whale, the Ruby gem, the Git branch, the React atom, the GitLab tanuki, the Kotlin fold, the Julia dots, the Vue chevron, the Prettier bars, the ESLint hexagon, the Webpack cube, the Nim crown. Languages without a logo use the acronym they are actually known by, set large and heavy on the tile.
- **JavaScript is the official `#F7DF1E`**, not the muted `#F6C177` it had been.
- **Folders are outlined**, in lavender on a deep indigo fill, so a folder never reads as a file.
- **Folder category pictograms moved into the badge's old position but are no longer badges** — the pictogram is drawn large and ringed with a hairline in the editor background (`#020108`), which lifts it off the folder instead of hiding it inside a disc.
- Text-only icons were reworked: acronyms are capped at four characters, sized to the tile, and always dark-on-vivid or white-on-dark, with the contrast direction picked from the tile's luminance rather than by hand.
- The jigsaw piece (`*.component.ts(x)`, `components/`) was redrawn as a square plus a knob minus a socket instead of one long rounded outline, which had bulged into a blob; and the React atom's orbits were made fatter and taller than the real logo, because a faithfully thin ring closes up into a solid shape at 16px and the openings are what make it read as React.
- The HTML and CSS icons are the real HTML5 and CSS3 badges — the official shield geometry in two tones, on a dark tile — instead of a flat single-colour crest with a number on it.
- Crystal and Solidity use their acronyms. Neither mark survives 16px — the Crystal shard and the Solidity rhombus stack both collapse into noise — and the acronym is what the other no-logo languages already do.
- Mapping coverage grew: `.env.*`, `go.mod`, `Cargo.toml`, `composer.json`, `pyproject.toml`, `eslint.config.js`, `vitest.config.ts`, `*.repository.ts`, `*.resolver.ts`, `@types`, `packages`, `screens` and others now resolve. `readme.md` maps to the Markdown icon instead of the Word one.

## [3.2.0]

A brighter pass over the icon set. No ids, labels or mappings changed, so nothing needs touching in `settings.json`.

### Changed

- The icon palette moved from pastel to vivid. Colors are now saturated enough to read against the theme's near-black background instead of washing out into it — TypeScript goes from `#A8C8F0` to `#5CB3FF`, and every other icon shifted the same way.
- File glyphs are drawn at `scale(1.75)` instead of `scale(1.32)`, filling much more of the 32×32 box so short labels stay legible at tree size.
- The outlined variant thickened its stroke from `0.9` to `1.15` to keep pace with the larger glyphs.
- Folder badges were reworked: the badge circle grew (`r` 6.6 → 8.6), it now carries the folder's short name in dark ink on the folder's own color rather than a small monochrome pictogram on a light disc, and the folder body picked up the same vivid fill.

### Removed

- The singular `validator` folder-name mapping. Folders named `validators` are unaffected.

## [3.1.0]

Icon set redesign, plus a second icon variant.

### Added

- **Midnight Indigo Icons — Outlined**, a second file icon theme (`midnight-indigo-icons-outlined`). Same 222 icons and the same mapping as the contained variant, drawn with a colored stroke and no fill.

### Changed

- All 222 icons were redrawn. Icons no longer sit inside a colored rounded square — the glyph itself carries the color and the background is transparent, so the icons read as part of the file tree instead of as tiles.
- The existing icon theme keeps its id (`midnight-indigo-icons`) and is now labelled **Midnight Indigo Icons — Contained**. Nothing to change in `settings.json`; the icons simply pick up the new look.
- Folders named `validators` now use the validators icon instead of the guards icon.

### Removed

- The `bin_` folder mapping, a typo that could never match a real folder name. Folders named `bin` are unaffected.

## [3.0.0]

First release of the unified extension, and the first release published to the Visual Studio Marketplace.

### Added

- **Midnight Indigo Icons** is now part of this extension. It was previously distributed as a separate package (`midnight-indigo-icons`, v1.0.0) that had to be installed by hand. It contributes 222 SVG icons — 140 file/language icons and 40 contextual folder icons with open and closed variants.
- Marketplace metadata: publisher, license, repository, gallery banner and keywords.

### Changed

- The color theme and the icon theme are now a single installable extension. Both remain opt-in: the color theme is selected under *Preferences: Color Theme*, the icons under *Preferences: File Icon Theme*.
- All descriptions, the README and the changelog are now written in English.

### Migration

If you installed either theme manually by copying it into `~/.vscode/extensions`, remove the old `midnight-indigo` and `midnight-indigo-icons` folders before installing from the Marketplace, otherwise duplicate entries appear in the theme picker.

## [2.6.0] and earlier

Released as the standalone `midnight-indigo` color theme, distributed manually. No changelog was kept for those versions.
