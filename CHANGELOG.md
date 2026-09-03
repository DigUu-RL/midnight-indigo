# Changelog

All notable changes to the Midnight Indigo extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.0]

A second icon variant, and a fix to the curly-brace glyph. Nothing was removed and no id, label or mapping changed, so an existing `settings.json` keeps working untouched.

### Added

- **Midnight Indigo Icons (Neon)** (`midnight-indigo-neon-icons`) — the same 222 icons, lit. The tile becomes the dark indigo ground already used for folder fills, the brand color moves off the tile and onto the ink, and a soft glow sits under the artwork. Same geometry, same glyphs, same measured centres, same mappings: switching between the two changes nothing but the look.
- [`tools/palette.ts`](tools/palette.ts) — every color the build paints with, plus the derivations between variants, extracted out of the drawing code. A variant is now a paint recipe (`VARIANTS` in [`tools/build-icons.ts`](tools/build-icons.ts)) rather than a copy of the generator, and the classic set is byte-for-byte reproducible, which makes `git diff` after a build the regression test.
- `node tools/build-icons.ts <variant>` builds a single variant; with no argument it builds all of them. `node tools/preview.ts neon` writes `icons/preview-neon.html`.

### Changed

- **The build scripts are TypeScript.** Nothing about the published extension changes: it has no entry point and ships no JavaScript, and `tools/` was already excluded from the package. Node runs the `.ts` files directly by stripping the types, so there is no compile step, no bundler and no `dist/` — `typescript` is a devDependency for `npm run typecheck` only, and `tsconfig.json` sets `erasableSyntaxOnly` to keep it that way. The 444 SVGs, both manifests and both measurement files came out byte-for-byte identical to the JavaScript build, which is what the migration was checked against.

  The types earn their place rather than decorating the code:

  - `glyph` on a spec is the union of the 89 real glyph names, so `glyph: 'brases'` is an editor error suggesting `'braces'` instead of a build that throws.
  - Every entry in the extension, filename and language-id tables must name an icon the spec defines — around 400 mappings checked statically. The existing runtime check stays, because it catches the other direction: an icon the spec defines but the build failed to write.
  - A misspelled field on a spec (`txet` for `text`) is rejected rather than silently ignored.

  The pictogram library became one object literal instead of 89 separate `glyphs.name = ...` assignments, which is what makes the name union possible. The conversion was scripted and then verified by calling every glyph in both versions across a matrix of arguments: 267 calls, no differences.

### Fixed

Every glyph was rasterised and checked for shapes that fall apart: pieces that should be joined but are not, pieces separated by a gap too small to read as deliberate, and ink thin enough to disappear at 16px. Seven glyphs needed work, affecting 16 icons in each variant.

- **The curly-brace glyph was skewed.** The closing brace had been written out by hand as a second path, and that path was the opening brace *rotated* 180° rather than mirrored — so the two braces carried each other's terminals, one running 0.6 units lower than the other. It is now derived by mirroring the opening brace, which makes the symmetry structural rather than something that has to be maintained. Affects the JSON, Handlebars, CSS-module and SCSS-module file icons and the `config/` folder icon.
- **The crown had a seam across it.** The body ended at y 8.4 and the base band started at 8.6, leaving a 0.2-unit line straight through the icon. (Nim.)
- **The brush's ferrule was detached**, floating 0.6 units below the head. (`styles/`.)
- **The key's bits were floating.** Both were rounded rects whose top-left corner was placed exactly on the shaft's lower edge — a single-point contact that the corner radius then rounded away, leaving them 0.86 units clear of the shaft. They also sat on the half of the shaft buried inside the bow, where there is no shaft to attach to. They are now struck perpendicular to the shaft from a point on its centre line, on its free half. (Certificates.)
- **The medal's ribbon did not touch the medal**, coming no closer than 0.53 units. (Licenses.)
- **The whale's tail touched nothing** and sat 0.1 units from the nearest container — close enough to read as a fused seam rather than a gap. It now rides on the hull. (Docker.)
- **The server rack's LEDs nearly touched the frame** they sit in, with 0.2 units of clearance that closes up at tree size. (`server/`.)

Everything still separated is separated on purpose and by a readable margin: the prompt inside the terminal window, the clock hands inside their rim, the Docker container grid, the Terraform tiles.

- **Neon artwork collided with the ring.** The ring stood inside the tile and took the margin the artwork was drawn to have: the Twig leaf merged with it outright, and MDX, ASM, TOML and the jigsaw pieces all touched it. The ring is now the tile's rim — its outer edge sits on the tile edge — and the artwork layer is scaled about the tile centre to clear it. Measured across all 140 file icons, the tightest clearance went from −0.92 units (an overlap) to 1.34 units. The transform is applied over already-placed content, so every measured centre still holds and no acronym needed re-measuring.

### Notes on the neon palette

A brand color chosen to be read *against* is not one that reads *on* a dark ground. Measured against the neon tile, 32 of the 140 file icons fell below 3:1 — Kotlin's `#241C3A` at 1.09:1, Lua's `#00007B` at 1.08:1, the HTML and CSS crests at 1.03:1 and 1.11:1 — and would have been invisible had the brand color simply been reused as ink. The palette derives the ink instead: the brand's hue is kept, and saturation and lightness are raised until it clears a 3.5:1 floor. Lightness is walked up rather than set to a target because luminance is hue-dependent, and a fixed target would leave the blues unreadable. Every icon in the set clears the floor.

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
