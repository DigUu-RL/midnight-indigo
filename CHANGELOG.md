# Changelog

All notable changes to the Midnight Indigo extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [8.0.0]

The icon set: 90 more icons, every pictogram redrawn, and the brand marks the set had been lettering instead of using.

**If you use the themes, nothing changes.** All eight colour themes are byte-for-byte what 7.0.0 shipped. **If you use the icons, most of them look different** — every shape that is ours was redrawn, and a great many files that used to fall through to the plain-text page now have an icon of their own.

### Added

- **90 more file icons — 230, up from 140 — matched to 401 extensions and 202 exact filenames** (up from roughly 180 and 90).

  - **76 brand marks the set was missing**, imported from the projects' own artwork: Angular, Next.js, Nuxt, Tailwind, Bootstrap, PostCSS, Node, Deno, Bun, Electron, Tauri, Flutter, Django, Laravel, Spring, Gradle, Maven, NuGet, Poetry, Anaconda, esbuild, Turborepo, Nx, Lerna, Cypress, Vitest, Mocha, Storybook, Kubernetes, Helm, Ansible, Packer, Pulumi, Serverless, Netlify, Vercel, Cloudflare, MongoDB, PostgreSQL, Redis, SQLite, Prisma, Firebase, Supabase, GitHub Actions, CircleCI, Bitbucket, Renovate, Elm, OCaml, Fortran, Racket, PureScript, Gleam, Haxe, Nix, WebAssembly, LaTeX, AsciiDoc, OpenAPI, Swagger, Arduino, Blender, Figma, Godot, Qt, Unity, and Erlang and YAML, which were being set as `ERL` and `YAML`.
  - **20 new pictograms for the formats an icon set does not usually reach**: mail, calendars, contacts, geodata, vector artwork, 3D meshes, subtitles, e-books, disk images, shortcuts, crash dumps, datasets, maths notebooks, packet captures, saved games, torrents, RAW photographs, installers, scratch files, and assistant/prompt files. Every one of those used to resolve to the plain-text page.
  - **CI is four icons instead of one.** `.travis.yml`, `.circleci`, `bitbucket-pipelines.yml` and `.github` used to share a lettered `CI`.

- **`roundedPolygonPath` in [`tools/shapes.ts`](tools/shapes.ts)** — rounds every corner of a polygon, convex and reflex alike, clamping per corner so a tight corner rounds as far as it can instead of turning the path inside out. It is what makes "nothing of ours is pointed" a property of the code rather than a thing to remember.

- **Brand colours now travel with the geometry.** [`tools/import-marks.ts`](tools/import-marks.ts) reads each hex from simple-icons' own metadata and writes it into `mark-paths.ts`, so a single-colour mark declares no palette at all. Ninety hand-copied hexes was not a thing to add: a wrong digit is invisible in review, passes every check, and ships an icon in a colour the project does not use. The audit that came with it found two: Jupyter was `#F37726` against `#F37626` upstream, and Vite still had its pre-rebrand purple.

### Changed

- **Every pictogram was redrawn.** Not only the pointed ones.

  The obvious half was the points: the star's five needles, the play triangle's spike, the arrowheads on the route and flow charts, the apex of the letter A, the ghost's hem. Those sat next to imported logos that are nearly all curves, and at 16px a bare vertex aliases into a grey fringe — so they did not read as sharp, they read as dirty.

  The quieter half was that a third of the library was bars. Plain text was four capsules, the log icon three dots beside three more capsules, the checklist three ticks beside three more — the same drawing three times in a file tree. They are objects now: a page with a dog-ear, a panel of timestamped rows, a clipboard. Along the way the spanner stopped being two thin horns on a stick, the cog went from six teeth to eight (six reads as a flower), the terminal's cursor became a block an underscore could not be at 16px, the browser got a capsule address bar to tell it apart from the terminal, the picture got a second hill, the server rack a third unit, and `braces` — the one pictogram painted in a single tone — started spending the tint it was being handed.

- **A logo has to survive 16px, and seven did not.** Less, Stylus, EditorConfig, JSON, MySQL, Travis and Composer all have official marks; all seven were imported, drawn at the size the file explorer actually uses, and put back. Each is a logotype, a line-art mascot or a plain ring. They keep their lettering or take one of our pictograms in the brand's own colour, and the reason sits next to each entry in `tools/icon-spec.ts` so the gap does not get "fixed" a third time.

- **Names across the build tools are explicit.** `C`, `R`, `G`, `P`, `bar`, `cut`, `rrD`, `circD`, `rot`, `mir` and the rest are now `circle`, `roundedRectangle`, `polygon`, `roundedPolygon`, `capsule`, `pathWithHoles`, `roundedRectanglePath`, `circlePath`, `rotated`, `mirroredHorizontally`; `hex`/`oklch`/`arc`/`wrap` are `hexFromOklch`/`oklchFromHex`/`signedHueDelta`/`wrapDegrees`; `readable`/`tint`/`shade` are `readableOnGround`/`lighterTint`/`darkened`; a pictogram's two tones are `ink` and `tint` rather than `a` and `b`. The three per-family chroma multipliers are `groundChroma`, `chromeChroma` and `inkChroma`.

- **`.obj` is a 3D mesh rather than a compiled object file**, on the grounds that the mesh is the one someone is more likely to be looking at in an editor.

### Removed

- **The lettered `CI` icon**, replaced by the four services it used to stand for.

## [7.0.0]

The seven color variants are redesigned. Every color in all seven changed.

**If you use Midnight Indigo, nothing changes.** It is still byte-for-byte the theme 5.0.0 shipped, and the build still asserts it and refuses to write anything if that ever stops being true. **If you use one of the other seven, it will look different** — that is the release. No theme was renamed, added or removed, so `workbench.colorTheme` keeps working; the colors behind the name are new.

### Changed

- **A variant is no longer a rotation of indigo.** 6.0.0 generated the seven by moving every color by one angle — the family band by the full turn, the semantic roles by a capped fraction of it — with lightness and chroma held byte-identical across all eight. It was carefully built, and dumping the eight palettes side by side showed what it actually produced: every ground at `indigo + Δ`, every string at `indigo + drift`, and the `L` and `C` columns the same down all eight rows. A rotation of everything by the same angle is what `hue-rotate()` is, which is why the variants read as one theme behind colored glass no matter how the rotation was tuned. 6.0.0's release notes claimed each variant was "rebuilt rather than tinted"; measured, that was not true, and this release is the correction.

  [`tools/theme-palette.ts`](tools/theme-palette.ts) now holds eight designs instead of one plus a formula. Each family names the hue of every color that carries an identity of its own — the family, the accent, the keywords and their darker partner, and each of the six semantic roles — chosen for that hue rather than derived from indigo's.

- **Saturation is now part of the design, not a constant.** Three multipliers per family: one for the grounds, one for the foreground ramp and family syntax, one for the ink. Indigo's chroma does not mean the same thing at hue 27 as at 290 — red's ground at indigo's numbers is a visible maroon rather than a near-black with a hint in it, and its foreground ramp is salmon rather than a warm grey; orange is worse, since amber is where sRGB is widest. Both now run well under indigo. Cyan and green have the opposite problem — cyan is the pinch in sRGB, with barely half the chroma available at the accent's lightness that violet has — and take more.

  This is what lets two variants differ in saturation and in the intervals between their roles, rather than only in where the wheel was turned to.

- **The accent is chosen per family** — hue, chroma and lightness — instead of being the family hue at indigo's lightness. Green's was a traffic-light `#009D11`; it is now a deeper emerald, and every family's accent still clears 3:1 against the white text that sits on it.

- **The crowded families are re-laid rather than squeezed.** Because 6.0.0 turned the family fully and the semantics only partly, green, cyan and blue landed *inside* the arc their own semantic roles occupy: the green variant shipped with chrome at hue 150 and strings at 124, types at 176 and interfaces at 75 — a code area collapsed onto the chrome hue. Now:

  - **Orange** owns the amber band, so its numbers are warm red and its enum members rose, across the wheel's zero from the chrome.
  - **Green** owns green. The reason a string cannot be green here is not the background — the grounds are near-black at every hue and a string clears them by 20:1 — it is the variables, which are family by definition and sit at hue 152 and `L` 0.78 exactly where a green string would be. Strings are yellow-green at 125, and the interfaces give up lime for gold.
  - **Cyan** owns teal, so its types cross to the other side of its strings: jade at 168, strings at 135.
  - **Blue** sits on the functions, which move to azure-cyan at 215 — still unmistakably blue, 43 degrees clear of the chrome — with the types dropping back to teal to make the room.

  Purple, pink and red have room to keep every convention, and do: green strings, blue functions, warm numbers.

- **Conventions are kept by choice now, not by a formula.** The old `PULL`, `MAX_DRIFT` and `share()` decided how far a role was *allowed* to follow the rotation, which is a different question from where the role should be. A string is green where the family leaves room for green, and something deliberate where it does not.

- **The separation rule is a floor the build checks, not a ceiling it arranges around.** No two roles that must be told apart may sit closer than 22 degrees; the build names the pair and the family and writes nothing if one is ever edited into its neighbour. Indigo is exempt, because it predates the floor and sits under it on purpose — its enum members and numbers are 19.5 degrees apart, told apart by lightness instead.

- **Every legibility check from 6.0.0 still holds** — all eight variants clear WCAG AAA at 7:1 for every code token, chrome text clears its indigo value with slack, white clears 3:1 on every accent — and the grounds are still ultra-dark: the `lift` correction remains gated so it never touches a near-black.

- **`docs/preview/palettes.png` and the language screenshots are regenerated** from the new theme files.

### Removed

- **`arrange()` and the machinery around it.** The weighted isotonic regression that packed the crowded variants' hues into whatever arc was left, along with `PULL`, `MAX_DRIFT`, `driftFor()`, `share()`, `poleSign()`, the `hold` weights and the `GUARD` ceilings. None of it has anything to arrange now: no variant is asked to fit its semantics into the arc its family sits in. The build no longer reports a "crowded" shortfall because no family has one; it prints each family's closest pair instead.

## [6.0.0]

Seven new color themes, one icon theme removed, and a bug fix that had been making two file icons unreadable.

**If you use the theme, nothing changes.** `Midnight Indigo` is still called `Midnight Indigo`, and it is byte-for-byte the theme 5.0.0 shipped — the build asserts that and refuses to write anything if it ever stops being true. **If you use the neon icon set, it is gone** and VS Code will fall back to its default icons; switch to `Midnight Icons` in *Preferences: File Icon Theme*.

### Added

- **Seven more colors: Purple, Pink, Red, Orange, Green, Cyan and Blue.** Not seven new themes — the same theme at seven more hues. Same lightnesses, same contrast, same TextMate and semantic rules, same icon set.

  They are generated rather than written, because a color here is not a value: it is a decision applied in up to nine places, and keeping nine copies of it in step by hand across eight files is not something anyone does correctly for long. [`tools/build-color-themes.ts`](tools/build-color-themes.ts) holds the structure once, against role names, and [`tools/theme-palette.ts`](tools/theme-palette.ts) decides what color each role is in each family.

  The design rests on something the theme turned out to already be. Measured in OKLCH, 30 of its 39 colors sit inside a **19-degree band around hue 290** — the grounds, the borders, the selection, the accent, the whole foreground ramp, and four of the syntax roles. Those were never thirty decisions; they are one hue at thirty lightnesses, and they rotate together. The pink the keywords are set in sits at a fixed offset from that hue, a relationship rather than a coordinate, and rotates with it.

  **Each variant is rebuilt rather than tinted**, which took two attempts. The first held lightness and chroma fixed and rotated only the family hue, and the result looked like the original seen through colored glass. Measuring said why: the semantic layer — strings, calls, types, numbers, which is most of what is on a screen — sat 0.009 to 0.035 away from indigo in OKLab. It had not moved.

  Three things now make a variant its own palette. Every token takes a share of the rotation, with a floor, because freezing the roles with the strongest conventions behind them meant freezing strings and function calls. The drift *saturates* rather than clamping, because a hard cap handed red (97° from indigo) and orange (130°) an identical semantic layer, and did the same to green and cyan. And a role rotated into the yellow-green trough is given the altitude that hue needs — the theme already knew that rule, its warm roles all sitting high and its cool ones low; it is applied as a difference from where the role started, so anything that stays put is untouched.

  That last one is gated by lightness, which matters more than it sounds: mud is something that happens to colors bright enough to be seen as colors, and correcting for it in the near-blacks only makes them paler. Ungated it took the orange variant's editor background from `L` 0.083 to 0.143 and its side bar to 0.176 — an ultra-dark theme that was only ultra-dark in six of its eight colors. All eight grounds now sit within 0.008 of indigo's.

  Chroma stays absolute, and that is deliberate. Storing it as a fraction of what each hue can hold looks obviously right — sRGB carries far more chroma at magenta than at green — and is wrong twice over: OKLCH chroma is already the perceptually comparable quantity, so normalizing against the gamut undoes the reason for using OKLCH at all; and indigo's own operators, keywords, calls and enum members already sit at 100% of their hue's chroma, so "reuse the fraction" meant "sit on the gamut edge everywhere". It produced `#FF53F7` keywords in the red variant before it was backed out.

- **[`tools/color.ts`](tools/color.ts) — the color math, now in OKLCH.** The palettes rotate hue, and HSL cannot do that: its `L` is the midpoint of the largest and smallest channel, which says nothing about how bright a color looks, so hue 60 and hue 240 at identical `S` and `L` are a headlight and a bruise. Rotating in HSL would have blown out the yellow variants and muddied the blue ones from the same numbers. OKLCH's `L` is perceived lightness, so only the hue moves. Contrast across the eight variants varies by at most 3%.

  Out-of-gamut results reduce chroma until they fit rather than letting the channels clip, because clipping shifts hue — and only for the hues that happen to be out of gamut, which is exactly how a generated palette ends up subtly inconsistent in the places it was generated to be consistent.

- **[`tools/indigo-baseline.json`](tools/indigo-baseline.json) — the theme as it shipped, as a test.** The build regenerates indigo and compares it against this file, key for key, and writes nothing if a single color has moved. It is what lets the palette math be changed at all: the theme thousands of editors already have open is now covered by an assertion rather than by care.

- **A palette sheet in the docs.** `docs/preview/palettes.png` shows the same code in all eight, rendered from the real theme files.

### Fixed

- **The `.env` and JavaScript icons were unreadable, and it was one bug.** Both marks are a solid block with the lettering cut out of it, so both are painted over a near-black *plate* that makes the cut-out letters legible. `readable()` in [`tools/palette.ts`](tools/palette.ts) exists to lift brand colors that are too dark to paint on a `#040208` ground — and it could not tell that plate apart from a dark logo, so it lifted it too, from `#0F0B1E` to a mid purple `#7762C6`. The lettering went from **13:1 against its plate to 3.3:1** on `.env`, and 14.3:1 to 3.6:1 on JavaScript.

  Plate colors now live in `tools/palette.ts` alongside the derivations, marked structural, and no variant may repaint them. `.env` is back to 13.0:1 and JavaScript to 14.3:1. No other icon changed.

### Changed

- **The icon theme is now labelled Midnight Icons**, since one set serves all eight. Its id is unchanged, so `workbench.iconTheme` keeps working. The extension itself is still **Midnight Indigo** — the Marketplace requires display names to be unique across the whole catalogue and "Midnight" is already taken — and the color theme labels are unchanged too, since a color theme with no `id` is remembered by its label and renaming `Midnight Indigo` would have silently reset the theme of every editor that has it selected.

- **The icons still carry the languages' own colors, in every theme.** A Python file is `#3776AB` and `#FFD43B` whether the editor around it is indigo or green. A theme-tinted set was considered and dropped: with the color gone, 28 of the 140 file icons become the same drawing — a `.spec.ts` and a `.spec.js` are one flask, four `*.config.*` files are one wrench — because this set deliberately says *what a file does* with the pictogram and *which language it is* with the color.

- **`package.json` is now checked against the build.** A theme VS Code is not told about is a file on disk and nothing else, and the failure is silent in both directions. The theme build now refuses to run unless `contributes.themes` names exactly the eight files it writes, the same guarantee the icon build has always had for its mappings.

### Removed

- **The neon icon set.** It read as a novelty next to a set built on the projects' own marks, and it was the one part of the extension with no case for preferring it. `icons/svg-neon/`, its manifest and `neonInk()` are gone; 222 fewer files in the package.

  The machinery for variants stays — a variant is still a paint recipe and nothing else, and adding one back touches nothing but `VARIANTS` in [`tools/build-icons.ts`](tools/build-icons.ts).

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
