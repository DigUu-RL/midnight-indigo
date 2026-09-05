# Changelog

All notable changes to the Midnight Indigo extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0]

Both icon sets redrawn from scratch. Every one of the 222 icons in each variant changed. Nothing was removed and no icon id, theme id, label or mapping changed, so an existing `settings.json` keeps working untouched — but the set looks nothing like 4.x, which is why this is a major version.

### Added

- **The README shows the icons.** It never did: the listing described the set in prose and showed one editor mock. [`tools/build-icon-preview.ts`](tools/build-icon-preview.ts) (`npm run preview:gallery`) renders three galleries into `docs/preview/` — every file and language icon, every folder icon closed and open, and the two variants on the same icons — from the real SVGs, on the theme's own sidebar colour. They have to be images linked absolutely: the Marketplace renders the README and nothing else, `docs/**` is excluded from the package, and a relative image path renders on GitHub but breaks on the listing.

### Changed

- **The tile is gone; the logo is the icon.** V1 sat every mark on a 26×26 rounded tile in the language's brand color. That gave the set a uniform optical weight, and cost it everything else: each logo was shrunk to fit inside the tile, and an official two-tone mark had to be flattened onto a brand-colored ground it was never meant to sit on — which is why the React atom, the HTML5 crest and the Python hooks all read as approximately-something. A mark now fills the whole 32-unit canvas and is painted in its own colors.

- **The marks are the projects' own artwork, in their current version.** A language mark is not ours to invent: "Python" is two specific interlocking snakes in `#3776AB` and `#FFD43B`, and "Go" is a specific wordmark with three speed lines behind it. [`tools/import-marks.ts`](tools/import-marks.ts) imports the outlines from [Simple Icons](https://simpleicons.org) 16.29.0 (CC0-1.0) and, where the mark is genuinely multi-color, from [devicon](https://github.com/devicons/devicon) v2.17.0 (MIT), pinning both so a re-run reproduces the same file. It writes a checked-in module, so building the icons never touches the network. Only the treatment — size, palette, shadow, glow — is ours.

  Where a project has redrawn its logo, the set carries the current one: **CSS** is the rebeccapurple mark adopted in November 2024, not the blue CSS3 shield (which was never a mark for the language itself), and **GitLab** is the tanuki as simplified in 2022, not the seven-triangle original.

  Languages that had been making do with an acronym now carry their real logo: **Dart**, **Go**, **C**, **C++**, **C#**, **Scala**, **Clojure**, **Haskell**, **Erlang**, **Perl**, **R**, **Crystal**, **Zig**, **Solidity**, **Groovy**, **PowerShell**, **Svelte**, **Astro**, **Vagrant**, **Babel**, **Vite**, **Zsh**, **Markdown**, **MDX**, **TOML**, **.ENV**, **npm**, **stylelint**, **EJS**'s neighbours and more. The marks that were already logos but not quite the real thing — **Python**, **Java**, **Ruby**, **Lua**, **Excel**, **Word**, **PowerPoint**, **Vue**, **Kotlin**, **Swift**, **Julia**, **CMake**, **Jenkins**, **Jest**, **Vim** — were replaced with the official geometry or redrawn from it.

- **Flat, with a shadow.** Each mark casts a soft offset shadow in a darkened tint of its own color. A black shadow on a `#040208` ground is not a shadow, it is nothing, so the shadow is derived per icon by `shade()` in [`tools/palette.ts`](tools/palette.ts).

- **Holes are holes.** V1 punched them with a knock-out colour — the tile fill — which only worked because every glyph sat on a tile of known colour. With no tile, a hole is cut with `fill-rule="evenodd"` and is genuinely transparent, so an icon survives the file explorer's hover and selection backgrounds. `cut()` in the new [`tools/shapes.ts`](tools/shapes.ts) is where that rule lives, along with the caveat that evenodd is a parity rule and two overlapping holes cancel.

- **Over-filled logos read again.** Several marks are a solid block with the lettering cut out of it. Painted as one colour with the cut-outs left open, they came out as blobs. TypeScript, npm, Swift, JavaScript and `.env` now get a plate behind the mark in the colour the logo has its letters in — white for TypeScript's `TS` and Swift's bird, near-black for JavaScript's `JS`.

- **Colours are lifted, not replaced.** With the tile gone, a brand colour is ink on near-black rather than a background to read against, and many are far too dark for that — Lua's `#000080` lands at 1.1:1, and every logo whose official form is black lands at 1.0:1. `readable()` raises lightness while keeping hue and saturation, so the language still looks like itself; a logo that is officially black goes to the white version those logos ship for dark backgrounds rather than to a muddy charcoal.

- **Folders are solid.** A filled folder in the category's accent colour, with the pictogram sunk into the body in a darker tone of that same accent — replacing the stroked lavender outline with a corner pictogram haloed in the editor background. The open state keeps the whole folder as its back and swings a front panel out and down over it, which is what reads as "open" at 16px.

- **Text is only text.** A format whose logo is a wordmark, or has no logo at all, is now bare lettering with nothing behind it. Each string is set from its measured ink at the largest size that fits the box, so `INI` and `CI` no longer look half-drawn next to `YAML` and `ASM`.

- **The neon variant follows the same geometry.** Same marks, same pictograms, same measured centres, same mappings; the shadow becomes a glow, every colour goes through `neonInk()`, and folders invert their weight — the body dims to a dark tint of the accent and the rim becomes the lit line. A variant is still a paint recipe and nothing else.

- **The pictograms are duotone, and none of them is a V1 shape recoloured.** Each one is handed its icon's colour plus a lighter tint of the same hue, and the split carries the drawing: the tint is the *surface* — the glass of the flask, the page of the book, the screen of the terminal, the face of the clock — and full strength is what sits on it: the liquid, the print, the prompt, the hands. V1 had to say everything with one silhouette, so its pictograms ended up as clusters of thin slots that close up at 16px; two tones carry the structure instead and the outline can stay simple and heavy.

  Every one of the 56 pictograms was rebuilt on that basis rather than restyled. The book opens, the cube and the parcel are isometric with a lit top face, the sheet is a header row over four cells, the cog lost two teeth and gained a hub, the wrench became an open-jaw spanner, the hammer grew a claw, the medal has a ribbon, and the padlock, key, brush and eye are new drawings.

- **The curly braces were wrong.** `{}` had been written out as a filled outline by hand, and both arms bowed the same way — the pair read as an hourglass, and the two halves did not line up. They are now the centre line of a stroke, one arm mirrored, symmetric about the middle by construction. `stroked()` in [`tools/shapes.ts`](tools/shapes.ts) exists for exactly this: V1 banned strokes because the folder halo trick needed fill-only glyphs, and V2 has no halo, so the handful of glyphs that genuinely ARE a stroke — a brace, a chevron, a tick — can be drawn as one. Affects the JSON, CSS-module and SCSS-module file icons and the `config/` folder.

- **The library is split** into [`tools/shapes.ts`](tools/shapes.ts) (primitives), [`tools/glyphs.ts`](tools/glyphs.ts) (the pictograms that are ours) and [`tools/marks.ts`](tools/marks.ts) (the brand marks).

- **Measurement covers the marks too.** `npm run measure:glyphs` now rasterises the imported logos alongside the pictograms and records the ink size of every string, not just its offset. That is what lets marks drawn to wildly different proportions — the Go wordmark is twice as wide as it is tall — be fitted to one size, and what lets an over-long string be scaled down instead of running out of the canvas.

### Notes

- Some upstream marks do not survive being drawn at 16px: Groovy's is an outlined wordmark on a star, Jenkins's and Jest's are line-art portraits, Vim's sets "Vim" inside its diamond, Lua's sets "Lua" inside its sphere, and JSON's closes its braces into a ring that reads as a ring. Those are redrawn solid and simplified from the same official artwork, and JSON uses the braces its mark is built from. Marks with no redistributable source — PowerShell, Excel, Word, PowerPoint — are drawn by hand in the shape language of the official icons.
- Erlang's logo is a wordmark whose letters close up at icon size, so it is set as `ERL` instead.

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
