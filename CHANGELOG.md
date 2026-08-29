# Changelog

All notable changes to the Midnight Indigo extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
