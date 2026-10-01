# Changelog

All notable changes to the Midnight Indigo extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [10.0.0]

The theme covers the whole of VS Code now, not only the editor, and every color in it has one job: each theme sets 877 of VS Code's colors where 9.0 set 129, and a color that means something — an error, a warning, a change, the AI — means it on every surface it appears on. Keywords are each theme's own color, the icons are placed by their weight, and folders are colored by what they are for.

**What will look different.** This is a major version because colors you already see have changed, on purpose:

- **Twenty-one of the 129 colors 9.0.1 set have changed in Midnight Indigo** (25 to 43 in the other seven, which also follow their keywords and, in Orange, Green and Cyan, a slightly darker accent). The row under the pointer and an unfocused list's selection, so they can be seen and told apart; line numbers, inactive activity-bar icons and the comment grey, lifted for legibility; the terminal's red, yellow, magenta, their bright forms and bright black, so they mean what they are called; and a removed line, a deleted file and an untracked file, in Git's colors.
- **748 colors that used to fall back to VS Code's defaults are now the theme's**, so menus, notifications, the status bar's items, debugging, testing, find and the editor's highlights, inlay hints, symbol icons, sticky scroll, the peek view, the minimap, the terminal's selection and marks, diffs and merges, the Source Control graph, comment threads, chat, inline chat, suggested edits, the Agents window, buttons, the Settings editor, notebooks and the welcome page will all look different. Brackets cycle through six colors instead of four.
- **Code changes color.** In Purple, Pink, Red, Orange, Green, Cyan and Blue, keywords are now the theme's own color, and properties and operators moved to make room. In all eight, type names, markup tags, YAML keys, CSS properties and values, SQL columns and a dozen other scopes that fell back to plain text now have a color of their own; type parameters are lifted to AA and comments a shade lighter.
- **Every icon moved a little, and every folder changed.** Icons are centred and sized by their weight rather than their box, and cast a smaller, calmer shadow, or none if they are line art. Folders are colored by their role in nine groups, calmer than the logos, and most have a new silhouette.

### Added

#### The workbench

- **Menus, the command center, notifications, breadcrumbs, the quick pick, tabs in every state and in the modern layout, the activity bar's badges, side-bar and panel headers, the status bar's prominent, remote, warning, error and offline items, buttons, checkboxes, radios and toggles, the Settings editor, notebooks, the welcome page, the toolbar and the progress bar.** Among what they replace are a dozen fixed greys and blues of VS Code's that matched none of the eight themes.
- **Cursors, the dimmed final line number, the empty-editor placeholder, descriptions, disabled and error text, widget borders and shadows, links, quotes and code in hovers and rendered Markdown, and the chart palette.**
- **GitHub's Markdown alerts** in rendered Markdown, in the signals they share a meaning with: note is info, tip success, warning the warning, caution the error.
- **One grammar for interaction states.** Hover is the weakest step above rest and never the accent; selection is always stronger than hover; focus is the only state drawn as a ring, solid, at 3:1 on every surface; a toggle that is on is filled and no longer wears the focus color.

#### Diagnostics, debugging and testing

- **Error and warning are colors of their own** — a saturated red below the syntax band and a saturated yellow at its top, placed in every theme clear of every code ink and the accent. They used to be borrowed syntax inks, so a squiggle could be the color of the word it underlined; in Indigo the error was the keyword pink. Success, info and hint are each theme's own green, blue and teal.
- **Squiggles, the overview ruler and the minimap; the Problems view; notifications; the debug toolbar, the paused and the selected stack frame, inline values, the Variables view, the debug console and the exception widget; breakpoints in every state; test results in every state; the failure peek; coverage in the gutter and inline.** Every surface that says "error" is the same error, from the squiggle to the failed test. The three squiggles also differ in lightness, and uncovered code is a heavier band than covered code.

#### Editor intelligence

- **What the editor draws over the code is one quieter layer.** Inlay hints, CodeLens and ghost text are the comment grey, never as strong as body text and never under 3:1. Find, the word under the cursor, a revealed range, linked editing, snippet tab stops, folded lines, sticky scroll, indent and bracket-pair guides, the peek view, the suggest widget, the hover, the light bulb and the minimap's marks are all drawn by the theme, and every highlight behind code keeps every code ink legible over it.
- **Symbol icons are the syntax colors.** A class is the class color in the suggest list, the outline, the breadcrumbs and the symbol picker; an interface is the interface color.
- **The light bulb is the hint teal,** and its auto-fix form the info blue: a code action is a suggestion, not a warning.

#### Terminal

- **The selection, find, the cursor, split and tab rules, the marks beside a command that passed or failed, the guide along its output, sticky scroll, and the Ports view.** The cursor is the editor's caret.

#### Diff, merge and Git

- **The color is the kind of change; Git's letter is the rest.** Green is an addition, blue a change, red a removal and amber a conflict — in the explorer, the gutter, the diff, the merge editor and the Source Control graph. Untracked and staged files take the color of what they are, told apart by U, A and M.
- **The whole line a diff touched, and the text that changed in it; the hatching where one side has no lines, moved code, the multi-file diff; inline merge conflicts and the merge editor; Git blame; the Source Control graph's lanes and refs; and comment threads** — open in the info blue, resolved in grey, a draft in amber until it is sent.

#### Chat and agents

- **The AI is the theme's own accent, and only where it speaks or acts** — its avatar, the command a request addresses it by, the border that runs while it works, a session in progress, its suggestion in the gutter. What you wrote is a neutral bubble; the answer sits on the panel; chat is never a saturated block of color.
- **What an agent changed is the kind of change it is,** in Git's colors, in chat, inline chat and suggested edits.
- **Chat, inline chat, suggested edits, the interactive window and the Agents window** — its sessions, cards, input, badges and diff.

#### Syntax

- **Every scope that names something reaches a rule, in every theme.** 36 more TextMate rules and 25 more semantic rules: type references, namespaces, property declarations, object keys, constructors (`new Map()` is the class, not a function call), YAML keys (they were the string color), HTML, XML and JSX tags, CSS properties, values, colors and units, CSS variables, SQL tables and columns, shell flags, named constants, Rust traits, lifetimes and modules, macros, Java and Kotlin annotations, Python's calls and f-string braces, format placeholders and HTML entities.
- **The semantic tokens Roslyn, Pylance, rust-analyzer, gopls and the Java server send** beyond VS Code's own, each drawn as its TextMate scope is, so a word is the same color with semantic highlighting on and off.
- **Deprecated names are struck through** when a language server marks them or a grammar scopes them as deprecated, without changing their color or weight.

#### Icons

- **Nineteen new icons:** Dependabot, pytest, LLVM, pre-commit, Codecov, Ruff, uv, HashiCorp HCL and MCP; an agent and a prompt beside the assistant's rules and skills (`SKILL.md`); MSBuild project files, Razor, Python's configuration files, reStructuredText, test snapshots, templates and examples, translation catalogues and device trees.
- **Files matched by the folder they sit in,** as VS Code allows: every workflow under `.github/workflows` is GitHub Actions, the forms in `ISSUE_TEMPLATE` are issue templates, a Markdown file in an `agents` folder is an agent.
- **Two hundred more names and extensions reach an icon the set already drew:** Compose's `compose.yaml`, `.env.*`, `.sln`, CMake, Meson and `justfile`, Rust's and Go's toolchain files, `setup.py`, JSON Lines, XSLT, GPU textures, KiCad libraries, firmware images, Apple property lists, public keys, `OWNERS`, `CITATION.cff` and the linters' own configuration files; and thirteen languages VS Code ships, by language id.
- **Seven icons that were built and never shown** now have files that reach them: GitHub Actions' `action.yml`, esbuild, Packer, SQLite, MongoDB, Spring and Bootstrap.

#### Documentation

- **[The design system](docs/DESIGN-SYSTEM.md), [the color system](docs/COLOR-SYSTEM.md), [the icon system](docs/ICON-SYSTEM.md) and [development](docs/DEVELOPMENT.md),** each in English and Portuguese, and a Portuguese README.
- **[`SYNTAX.md`](docs/SYNTAX.md)** — what every scope and semantic token is drawn as; **[`TOKENS.md`](docs/TOKENS.md)** — every token, in every theme; **[`ACCESSIBILITY.md`](docs/ACCESSIBILITY.md)** — every contrast pair and cue, measured; **[`INVENTORY.md`](docs/INVENTORY.md)** — what the extension contains and what it leaves to VS Code, with the reason for each color left; **[`REGRESSION.md`](docs/REGRESSION.md)** — how a visible change is kept from landing unseen. All of them are generated from the source, or checked against it.
- **Screenshots of VS Code itself** in the README — a diff, Source Control, debugging, chat, and the explorer in all eight themes — taken by the regression run and copied only once reviewed. Kotlin and CSS join the language gallery.

#### Checks

- **`npm run check` runs every offline check in one command.** The theme build now refuses a color that is not a token, a token with no documented role, a surface or text ramp out of order, two interaction states that look alike, a signal drawn in a code ink, and any pair under its contrast target. The syntax check tokenizes a corpus of real code in nineteen languages, in all eight themes, with semantic highlighting off and on. The accessibility audit measures 72 pairs in every theme and simulates color-vision deficiency on every signal that differs by hue. The icon audit holds every icon to its optical centre and its shadow, and no two file icons may look alike at 16px. The package may hold only what is meant to ship.
- **A visual regression suite.** Four snapshots — the themes' structure, every color in every theme, icon associations and icon geometry — fail the check when they change unrecorded; `npm run regression` renders the previews and measures the icons again, sets today's Indigo beside v3.0.0, and shoots 25 workbench surfaces and 19 languages in real VS Code in every theme against the last reviewed run.
- **`npm run audit:coverage`** resolves the file names of 47 public repositories the way VS Code does and ranks what falls back to the plain page. 15.7% of their 812,272 files fell back; 9.2% do now.

### Changed

- **Keywords are the theme's own color, in seven of the eight.** Orange's keywords are orange, Green's green, Cyan's cyan, Blue's a periwinkle, Purple's violet, Pink's hot pink, and Red's a light coral kept apart from the error red. Indigo keeps its pink. Properties take the magenta or violet the keywords used to be, and operators become a quiet tint of the theme, told from the variables by lightness.
- **The terminal's colors mean what they are called.** Red is the error and yellow the warning, so a failed build prints in the color the editor marks an error in (`#FF6AC1` → `#F84A54` and `#D6E64B` → `#ECC400` in Indigo). Magenta is the keyword color where red used to be it; bright black is the comment grey, readable at 3:1 where it was 2.3:1.
- **A removal is red and an untracked file green.** A removed line, removed text in a diff and a deleted file were the keyword color; they are the error red. An untracked file was the interface lime, beside the amber that now means a conflict; it is the added green.
- **The row under the pointer can be seen** in the suggest widget, the quick pick and the code-action menu, where it was the widget's own ground; **an unfocused list's selection no longer looks like a hover**; a tab selected beside the active one takes the selection ground; a prominent status-bar item is the accent with white text; pressing a toolbar button is stronger than hovering it.
- **Legibility.** Type parameters are lifted to AA (they were 3.5:1); line numbers and inactive activity-bar icons to 3:1 (they were 2.3:1); the comment grey a shade, so a comment under a selection keeps 3:1; and the accent in Orange, Green and Cyan a shade darker, so a button's white label reads at AA.
- **Icons are centred and sized by their weight, not their box,** as a designer corrects a play button by hand: the flask no longer sits on its bulb nor a triangle on its base. Squares are drawn a touch smaller than discs, and long wordmarks given the length the canvas has.
- **The icons' shadow is smaller, calmer and darker, and line art casts none.** It was most of a pixel under every icon at 16px, in a color more saturated than the mark; on line art it was a second hairline that turned the Laravel cube and the PostCSS ring into smears.
- **A folder's color is what it is for.** Each of the 53 folders had a color of its own, as saturated as the logos and spread round the whole wheel. They now fall into nine roles — interface, content, logic, data, network, quality, security, tooling and dormant — at one calm chroma, so a folder never outweighs the files inside it. Seven folder-name synonyms moved to the folder whose role they share: `directives` to components, `pipes` to middleware, `decorators` to functions, `events`, `listeners` and `notifications` to jobs, `client` to views.
- **Folder pictograms are silhouettes, and twenty are new drawings.** At six pixels tall a duotone was a blot. `scripts` is a prompt, `routes` a signpost, `media` a play button, `fonts` a `T`, `docs` a closed book, `constants` a `π`, `jobs` an hourglass, `store` a vault, `middleware` a funnel, `public` a browser window, `i18n` a globe, `security` a keyed padlock, among others.
- **A pictogram's surface is darker than its lines,** a little under halfway to the ground, where it was the brightest thing in the icon; a surface the drawing does not hold is left out. The pictogram library is no longer held to one family: Phosphor is the base, and another Iconify collection supplies a drawing where it reads better at 16px.
- **Pairs that only a color told apart are told apart:** MySQL, Composer, AutoHotkey, the math document, Scheme, Jinja, `hosts` and Prolog. Electron is an atom pictogram in its own teal. **`.snap` is a test snapshot,** not a Snapcraft package.

### Fixed

- **Python's `self.x` was drawn as a decorator;** Java's class names, imports and ternary were bold italic, as keywords; Go's built-in calls were bold, as declarations; an overloaded C# operator came out bold and blue; CSS units were bold italic.
- **Two shipped rules painted everything inside a field declaration or an interface body,** not just the name.
- **An inventory table printed `[object Object]`** for the three amended TextMate rules.

### Removed

- **The JSX-component grammar injection.** It matched from `export`, `default` or `function` to a capitalised name without scoping those words, so `export default function App()` lost its keywords, and where it won against TypeScript's grammar, the function's body was no longer parsed as one. With semantic highlighting on, the component color it was for never showed. Component tags (`<Avatar />`) keep the class color.
- **The Supabase file icon.** No file is Supabase's own, so nothing could reach it.
- **Four icons that were one icon twice** — the TypeScript and JavaScript config wrenches, the JavaScript module squares and the Sass mark were each built and shipped twice.

## [9.0.1]

The listing was showing 8.0's icons next to 9.0's description.

**Nothing in the extension changed** — the themes, the icons and the manifest are what 9.0.0 published. This release is the pictures of them.

### Fixed

- **The screenshots, the icon measurements and the icon audit render again with Edge 154,** which runs the command-line headless mode and writes nothing. They now drive the browser over the DevTools protocol. The measurements and the audit come out byte for byte as before; the screenshots moved by half a pixel in the rasterisation and were regenerated, with every colour unchanged.
- **Log lines are coloured by their level** in the Output view and in `.log` files: errors in the error red, warnings in the warning yellow, infos in the info blue and debug lines in the hint teal, as the squiggles and the Problems view draw them. The levels fell through to plain text, so an error line read like any other; they are held to AA, as the diagnostics are.
- **`background` in a CSS or SCSS `transition` is no longer struck through.** The CSS grammar scopes it as the deprecated system colour of that name, which the deprecated rule struck through and greyed; it is now drawn as the value it reads as.
- **The screenshots the README and the Marketplace listing use were stale.** 9.0.0 regenerated the two icon galleries and nothing else: `hero.png` draws its file tree with the real icon SVGs, so it still showed the tabbed folders and the hand-drawn pictograms, and the JSON and SQL language cards carry a file icon in their tab strip that had changed underneath them. All three are regenerated from the current SVGs.

- **Nothing was pointing at the new images.** The README and [`docs/PREVIEW.md`](docs/PREVIEW.md) pin every screenshot to a commit rather than to a branch, so a listing can never be served a screenshot the published extension does not match — and that pin was still 8.0's commit, which is why 9.0.0 shipped a page describing one icon set and showing another. All 27 URLs move to the commit that carries the regenerated PNGs, and `IMAGE_REF` in [`tools/preview/build-theme-preview.ts`](tools/preview/build-theme-preview.ts) moves with them so the next `npm run preview:theme` does not write the old ref back into the gallery.

- **`npm run check:images` returned 127 when it passed.** It called `process.exit(0)` with `fetch`'s keep-alive sockets still closing, which on Windows is an assertion failure inside libuv rather than an exit — so the one check that would have caught the stale pin looked like a crash whenever it succeeded. It sets `process.exitCode` now.

## [9.0.0]

The pictograms are somebody else's drawings now, the folders are facades with light on them, and the set finally reaches the rest of the file system.

**If you use the themes, nothing changes.** All eight colour themes are byte-for-byte what 8.0.0 shipped. **If you use the icons, every folder and every icon that is not a brand logo looks different** — the whole pictogram library was replaced, the folder geometry was redrawn, and 61 more file icons were added.

### Added

- **The pictograms come from [Iconify](https://iconify.design).** [`tools/icons/import-pictograms.ts`](tools/icons/import-pictograms.ts) fetches them, resolves their duotone into this set's two colour slots and writes a checked-in [`tools/icons/pictogram-paths.ts`](tools/icons/pictogram-paths.ts) — the same arrangement the brand marks have had since 8.0, and building the icons still never touches the network. The library is one family, [Phosphor](https://phosphoricons.com) (MIT), at its `duotone` weight; two icons come from Fluent (MIT) and MingCute (Apache-2.0) where Phosphor's drawing does not survive 16px, and the brackets take Phosphor's `bold` weight for the same reason. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

- **61 more file icons — 291, up from 230 — matched to 526 extensions and 243 exact filenames** (up from 401 and 202).

  - **The languages a set usually stops before**: COBOL, Pascal/Delphi, Ada, Tcl, ABAP, Lisp, Scheme, Prolog, AppleScript, AutoHotkey, awk and sed.
  - **Hardware, graphics and science**: Verilog, VHDL, waveform dumps, PCB layouts, shaders (GLSL/HLSL/WGSL/Metal), CUDA, MATLAB, statistics packages, machine-learning weights, CAD drawings and G-code.
  - **The small files a repository keeps in its root**, almost none of which have an extension and all of which used to resolve to the plain-text page: `CODEOWNERS`, `SECURITY.md`, issue and pull-request templates, commit and release config, Husky hooks, dev containers, `hosts`, crontabs, systemd units, sitemaps, feeds, source maps, keymaps, colour themes, workspaces, credentials, notices and backups.
  - **Creative project files as distinct from their exports**: DAW sessions, editing timelines, BI documents, layered design documents.
  - **Eleven brand marks whose file IS the tool**: Xcode, Postman, Bazel, CocoaPods, Homebrew, Grafana, Prometheus, Sentry, SonarQube, Vault and Unreal Engine.
  - **13 more folder icons — 53, up from 40**: `logs`, `temp/cache`, `archive/legacy`, `packages/apps`, `schemas/proto`, `themes/palettes`, `keys/certs`, `benchmarks/perf`, `jobs/queues/cron`, `design/mockups`, `audio`, `media/video` and `ai/.claude/prompts`.

- **A build warning for pictograms nothing draws**, matching the one that already existed for imported marks. An imported library grows by adding a line, so the only thing that keeps it from filling up with shapes the set decided against is being told.

### Changed

- **Every pictogram was replaced.** 8.0 redrew the hand-made library and defended it at length; the rules it followed were right and the drawings were still the weakest half of the set — a hand-drawn flask, clipboard and terminal are three sketches by one person, sitting beside a hundred and fifty logos drawn by the people whose job that was. What stays is the treatment, which was always the part worth keeping: the box, the measured centring, the duotone split, the shadow, and the decision about which drawing means which file.

- **Folders are facades with a beam of light across them.** The tabbed wallet-in-perspective is gone. A folder is now one flat panel square to the viewer, with its pictogram sunk into it and a hard-edged beam crossing at 40° — clipped to the panel, drawn over the pictogram as well as the body, because light falls on everything in front of it. The open state drops the front wall away and shows the body behind it in a darker tone, instead of faking a second sheet of card. It is the one place in the set that spends opacity, and it can: it is blending with the folder's own accent rather than with the near-black ground.

- **Lettered icons have a rule under them, with the same light at 45°.** `PDF`, `ASM`, `INI`, `BAT` and the rest were the only icons in the set with no object in them, and three characters alone in a box read as a label for an icon that had failed to load. Each string is now fitted to the height the rule leaves it rather than nudged, so a tall single letter shrinks instead of running out of the canvas.

- **`.exe`, `.dll` and friends** take the binary pictogram rather than a lettered `10`.
- **`.vhd` is VHDL source rather than a virtual hard disk**, on the grounds that in an editor it is the source; the disk image keeps `.vhdx`, `.vmdk` and the rest.
- **`.psd` and the other layered design documents** get a design pictogram instead of falling through to plain text; Adobe's marks are not in simple-icons, so no logo is claimed.
- **`schemas`, `themes`, `packages` and `jobs` are their own folder icons** rather than aliases of `database`, `styles`, `core` and `validators`.

### Removed

- **The hand-drawing primitives that existed only for the old pictograms** — `roundedPolygonPath`, `roundedPolygon`, `starPath`, `star`, `capsulePath`, `capsule`, `strokedPath`, `ellipse`, `ring`, `roundedFrame` and `mirroredHorizontally`. [`tools/icons/shapes.ts`](tools/icons/shapes.ts) has one consumer left: the dozen logos with no redistributable source, which are still drawn by hand.

## [8.0.0]

The icon set: 90 more icons, every pictogram redrawn, and the brand marks the set had been lettering instead of using.

**If you use the themes, nothing changes.** All eight colour themes are byte-for-byte what 7.0.0 shipped. **If you use the icons, most of them look different** — every shape that is ours was redrawn, and a great many files that used to fall through to the plain-text page now have an icon of their own.

### Added

- **90 more file icons — 230, up from 140 — matched to 401 extensions and 202 exact filenames** (up from roughly 180 and 90).

  - **76 brand marks the set was missing**, imported from the projects' own artwork: Angular, Next.js, Nuxt, Tailwind, Bootstrap, PostCSS, Node, Deno, Bun, Electron, Tauri, Flutter, Django, Laravel, Spring, Gradle, Maven, NuGet, Poetry, Anaconda, esbuild, Turborepo, Nx, Lerna, Cypress, Vitest, Mocha, Storybook, Kubernetes, Helm, Ansible, Packer, Pulumi, Serverless, Netlify, Vercel, Cloudflare, MongoDB, PostgreSQL, Redis, SQLite, Prisma, Firebase, Supabase, GitHub Actions, CircleCI, Bitbucket, Renovate, Elm, OCaml, Fortran, Racket, PureScript, Gleam, Haxe, Nix, WebAssembly, LaTeX, AsciiDoc, OpenAPI, Swagger, Arduino, Blender, Figma, Godot, Qt, Unity, and Erlang and YAML, which were being set as `ERL` and `YAML`.
  - **20 new pictograms for the formats an icon set does not usually reach**: mail, calendars, contacts, geodata, vector artwork, 3D meshes, subtitles, e-books, disk images, shortcuts, crash dumps, datasets, maths notebooks, packet captures, saved games, torrents, RAW photographs, installers, scratch files, and assistant/prompt files. Every one of those used to resolve to the plain-text page.
  - **CI is four icons instead of one.** `.travis.yml`, `.circleci`, `bitbucket-pipelines.yml` and `.github` used to share a lettered `CI`.

- **`roundedPolygonPath` in [`tools/icons/shapes.ts`](tools/icons/shapes.ts)** — rounds every corner of a polygon, convex and reflex alike, clamping per corner so a tight corner rounds as far as it can instead of turning the path inside out. It is what makes "nothing of ours is pointed" a property of the code rather than a thing to remember.

- **Brand colours now travel with the geometry.** [`tools/icons/import-marks.ts`](tools/icons/import-marks.ts) reads each hex from simple-icons' own metadata and writes it into `mark-paths.ts`, so a single-colour mark declares no palette at all. Ninety hand-copied hexes was not a thing to add: a wrong digit is invisible in review, passes every check, and ships an icon in a colour the project does not use. The audit that came with it found two: Jupyter was `#F37726` against `#F37626` upstream, and Vite still had its pre-rebrand purple.

### Changed

- **Every pictogram was redrawn.** Not only the pointed ones.

  The obvious half was the points: the star's five needles, the play triangle's spike, the arrowheads on the route and flow charts, the apex of the letter A, the ghost's hem. Those sat next to imported logos that are nearly all curves, and at 16px a bare vertex aliases into a grey fringe — so they did not read as sharp, they read as dirty.

  The quieter half was that a third of the library was bars. Plain text was four capsules, the log icon three dots beside three more capsules, the checklist three ticks beside three more — the same drawing three times in a file tree. They are objects now: a page with a dog-ear, a panel of timestamped rows, a clipboard. Along the way the spanner stopped being two thin horns on a stick, the cog went from six teeth to eight (six reads as a flower), the terminal's cursor became a block an underscore could not be at 16px, the browser got a capsule address bar to tell it apart from the terminal, the picture got a second hill, the server rack a third unit, and `braces` — the one pictogram painted in a single tone — started spending the tint it was being handed.

- **A logo has to survive 16px, and seven did not.** Less, Stylus, EditorConfig, JSON, MySQL, Travis and Composer all have official marks; all seven were imported, drawn at the size the file explorer actually uses, and put back. Each is a logotype, a line-art mascot or a plain ring. They keep their lettering or take one of our pictograms in the brand's own colour, and the reason sits next to each entry in `tools/icons/icon-spec.ts` so the gap does not get "fixed" a third time.

- **Names across the build tools are explicit.** `C`, `R`, `G`, `P`, `bar`, `cut`, `rrD`, `circD`, `rot`, `mir` and the rest are now `circle`, `roundedRectangle`, `polygon`, `roundedPolygon`, `capsule`, `pathWithHoles`, `roundedRectanglePath`, `circlePath`, `rotated`, `mirroredHorizontally`; `hex`/`oklch`/`arc`/`wrap` are `hexFromOklch`/`oklchFromHex`/`signedHueDelta`/`wrapDegrees`; `readable`/`tint`/`shade` are `readableOnGround`/`lighterTint`/`darkened`; a pictogram's two tones are `ink` and `tint` rather than `a` and `b`. The three per-family chroma multipliers are `groundChroma`, `chromeChroma` and `inkChroma`.

- **`.obj` is a 3D mesh rather than a compiled object file**, on the grounds that the mesh is the one someone is more likely to be looking at in an editor.

### Removed

- **The lettered `CI` icon**, replaced by the four services it used to stand for.

## [7.0.0]

The seven color variants are redesigned. Every color in all seven changed.

**If you use Midnight Indigo, nothing changes.** It is still byte-for-byte the theme 5.0.0 shipped, and the build still asserts it and refuses to write anything if that ever stops being true. **If you use one of the other seven, it will look different** — that is the release. No theme was renamed, added or removed, so `workbench.colorTheme` keeps working; the colors behind the name are new.

### Changed

- **A variant is no longer a rotation of indigo.** 6.0.0 generated the seven by moving every color by one angle — the family band by the full turn, the semantic roles by a capped fraction of it — with lightness and chroma held byte-identical across all eight. It was carefully built, and dumping the eight palettes side by side showed what it actually produced: every ground at `indigo + Δ`, every string at `indigo + drift`, and the `L` and `C` columns the same down all eight rows. A rotation of everything by the same angle is what `hue-rotate()` is, which is why the variants read as one theme behind colored glass no matter how the rotation was tuned. 6.0.0's release notes claimed each variant was "rebuilt rather than tinted"; measured, that was not true, and this release is the correction.

  [`tools/theme/theme-palette.ts`](tools/theme/theme-palette.ts) now holds eight designs instead of one plus a formula. Each family names the hue of every color that carries an identity of its own — the family, the accent, the keywords and their darker partner, and each of the six semantic roles — chosen for that hue rather than derived from indigo's.

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

  They are generated rather than written, because a color here is not a value: it is a decision applied in up to nine places, and keeping nine copies of it in step by hand across eight files is not something anyone does correctly for long. [`tools/theme/build-color-themes.ts`](tools/theme/build-color-themes.ts) holds the structure once, against role names, and [`tools/theme/theme-palette.ts`](tools/theme/theme-palette.ts) decides what color each role is in each family.

  The design rests on something the theme turned out to already be. Measured in OKLCH, 30 of its 39 colors sit inside a **19-degree band around hue 290** — the grounds, the borders, the selection, the accent, the whole foreground ramp, and four of the syntax roles. Those were never thirty decisions; they are one hue at thirty lightnesses, and they rotate together. The pink the keywords are set in sits at a fixed offset from that hue, a relationship rather than a coordinate, and rotates with it.

  **Each variant is rebuilt rather than tinted**, which took two attempts. The first held lightness and chroma fixed and rotated only the family hue, and the result looked like the original seen through colored glass. Measuring said why: the semantic layer — strings, calls, types, numbers, which is most of what is on a screen — sat 0.009 to 0.035 away from indigo in OKLab. It had not moved.

  Three things now make a variant its own palette. Every token takes a share of the rotation, with a floor, because freezing the roles with the strongest conventions behind them meant freezing strings and function calls. The drift *saturates* rather than clamping, because a hard cap handed red (97° from indigo) and orange (130°) an identical semantic layer, and did the same to green and cyan. And a role rotated into the yellow-green trough is given the altitude that hue needs — the theme already knew that rule, its warm roles all sitting high and its cool ones low; it is applied as a difference from where the role started, so anything that stays put is untouched.

  That last one is gated by lightness, which matters more than it sounds: mud is something that happens to colors bright enough to be seen as colors, and correcting for it in the near-blacks only makes them paler. Ungated it took the orange variant's editor background from `L` 0.083 to 0.143 and its side bar to 0.176 — an ultra-dark theme that was only ultra-dark in six of its eight colors. All eight grounds now sit within 0.008 of indigo's.

  Chroma stays absolute, and that is deliberate. Storing it as a fraction of what each hue can hold looks obviously right — sRGB carries far more chroma at magenta than at green — and is wrong twice over: OKLCH chroma is already the perceptually comparable quantity, so normalizing against the gamut undoes the reason for using OKLCH at all; and indigo's own operators, keywords, calls and enum members already sit at 100% of their hue's chroma, so "reuse the fraction" meant "sit on the gamut edge everywhere". It produced `#FF53F7` keywords in the red variant before it was backed out.

- **[`tools/shared/color.ts`](tools/shared/color.ts) — the color math, now in OKLCH.** The palettes rotate hue, and HSL cannot do that: its `L` is the midpoint of the largest and smallest channel, which says nothing about how bright a color looks, so hue 60 and hue 240 at identical `S` and `L` are a headlight and a bruise. Rotating in HSL would have blown out the yellow variants and muddied the blue ones from the same numbers. OKLCH's `L` is perceived lightness, so only the hue moves. Contrast across the eight variants varies by at most 3%.

  Out-of-gamut results reduce chroma until they fit rather than letting the channels clip, because clipping shifts hue — and only for the hues that happen to be out of gamut, which is exactly how a generated palette ends up subtly inconsistent in the places it was generated to be consistent.

- **[`tools/theme/indigo-baseline.json`](tools/theme/indigo-baseline.json) — the theme as it shipped, as a test.** The build regenerates indigo and compares it against this file, key for key, and writes nothing if a single color has moved. It is what lets the palette math be changed at all: the theme thousands of editors already have open is now covered by an assertion rather than by care.

- **A palette sheet in the docs.** `docs/preview/palettes.png` shows the same code in all eight, rendered from the real theme files.

### Fixed

- **The `.env` and JavaScript icons were unreadable, and it was one bug.** Both marks are a solid block with the lettering cut out of it, so both are painted over a near-black *plate* that makes the cut-out letters legible. `readable()` in [`tools/icons/palette.ts`](tools/icons/palette.ts) exists to lift brand colors that are too dark to paint on a `#040208` ground — and it could not tell that plate apart from a dark logo, so it lifted it too, from `#0F0B1E` to a mid purple `#7762C6`. The lettering went from **13:1 against its plate to 3.3:1** on `.env`, and 14.3:1 to 3.6:1 on JavaScript.

  Plate colors now live in `tools/icons/palette.ts` alongside the derivations, marked structural, and no variant may repaint them. `.env` is back to 13.0:1 and JavaScript to 14.3:1. No other icon changed.

### Changed

- **The icon theme is now labelled Midnight Icons**, since one set serves all eight. Its id is unchanged, so `workbench.iconTheme` keeps working. The extension itself is still **Midnight Indigo** — the Marketplace requires display names to be unique across the whole catalogue and "Midnight" is already taken — and the color theme labels are unchanged too, since a color theme with no `id` is remembered by its label and renaming `Midnight Indigo` would have silently reset the theme of every editor that has it selected.

- **The icons still carry the languages' own colors, in every theme.** A Python file is `#3776AB` and `#FFD43B` whether the editor around it is indigo or green. A theme-tinted set was considered and dropped: with the color gone, 28 of the 140 file icons become the same drawing — a `.spec.ts` and a `.spec.js` are one flask, four `*.config.*` files are one wrench — because this set deliberately says *what a file does* with the pictogram and *which language it is* with the color.

- **`package.json` is now checked against the build.** A theme VS Code is not told about is a file on disk and nothing else, and the failure is silent in both directions. The theme build now refuses to run unless `contributes.themes` names exactly the eight files it writes, the same guarantee the icon build has always had for its mappings.

### Removed

- **The neon icon set.** It read as a novelty next to a set built on the projects' own marks, and it was the one part of the extension with no case for preferring it. `icons/svg-neon/`, its manifest and `neonInk()` are gone; 222 fewer files in the package.

  The machinery for variants stays — a variant is still a paint recipe and nothing else, and adding one back touches nothing but `VARIANTS` in [`tools/icons/build-icons.ts`](tools/icons/build-icons.ts).

## [5.0.0]

Both icon sets redrawn from scratch. Every one of the 222 icons in each variant changed. Nothing was removed and no icon id, theme id, label or mapping changed, so an existing `settings.json` keeps working untouched — but the set looks nothing like 4.x, which is why this is a major version.

### Added

- **The README shows the icons.** It never did: the listing described the set in prose and showed one editor mock. [`tools/preview/build-icon-preview.ts`](tools/preview/build-icon-preview.ts) (`npm run preview:gallery`) renders three galleries into `docs/preview/` — every file and language icon, every folder icon closed and open, and the two variants on the same icons — from the real SVGs, on the theme's own sidebar colour. They have to be images linked absolutely: the Marketplace renders the README and nothing else, `docs/**` is excluded from the package, and a relative image path renders on GitHub but breaks on the listing.

### Changed

- **The tile is gone; the logo is the icon.** V1 sat every mark on a 26×26 rounded tile in the language's brand color. That gave the set a uniform optical weight, and cost it everything else: each logo was shrunk to fit inside the tile, and an official two-tone mark had to be flattened onto a brand-colored ground it was never meant to sit on — which is why the React atom, the HTML5 crest and the Python hooks all read as approximately-something. A mark now fills the whole 32-unit canvas and is painted in its own colors.

- **The marks are the projects' own artwork, in their current version.** A language mark is not ours to invent: "Python" is two specific interlocking snakes in `#3776AB` and `#FFD43B`, and "Go" is a specific wordmark with three speed lines behind it. [`tools/icons/import-marks.ts`](tools/icons/import-marks.ts) imports the outlines from [Simple Icons](https://simpleicons.org) 16.29.0 (CC0-1.0) and, where the mark is genuinely multi-color, from [devicon](https://github.com/devicons/devicon) v2.17.0 (MIT), pinning both so a re-run reproduces the same file. It writes a checked-in module, so building the icons never touches the network. Only the treatment — size, palette, shadow, glow — is ours.

  Where a project has redrawn its logo, the set carries the current one: **CSS** is the rebeccapurple mark adopted in November 2024, not the blue CSS3 shield (which was never a mark for the language itself), and **GitLab** is the tanuki as simplified in 2022, not the seven-triangle original.

  Languages that had been making do with an acronym now carry their real logo: **Dart**, **Go**, **C**, **C++**, **C#**, **Scala**, **Clojure**, **Haskell**, **Erlang**, **Perl**, **R**, **Crystal**, **Zig**, **Solidity**, **Groovy**, **PowerShell**, **Svelte**, **Astro**, **Vagrant**, **Babel**, **Vite**, **Zsh**, **Markdown**, **MDX**, **TOML**, **.ENV**, **npm**, **stylelint**, **EJS**'s neighbours and more. The marks that were already logos but not quite the real thing — **Python**, **Java**, **Ruby**, **Lua**, **Excel**, **Word**, **PowerPoint**, **Vue**, **Kotlin**, **Swift**, **Julia**, **CMake**, **Jenkins**, **Jest**, **Vim** — were replaced with the official geometry or redrawn from it.

- **Flat, with a shadow.** Each mark casts a soft offset shadow in a darkened tint of its own color. A black shadow on a `#040208` ground is not a shadow, it is nothing, so the shadow is derived per icon by `shade()` in [`tools/icons/palette.ts`](tools/icons/palette.ts).

- **Holes are holes.** V1 punched them with a knock-out colour — the tile fill — which only worked because every glyph sat on a tile of known colour. With no tile, a hole is cut with `fill-rule="evenodd"` and is genuinely transparent, so an icon survives the file explorer's hover and selection backgrounds. `cut()` in the new [`tools/icons/shapes.ts`](tools/icons/shapes.ts) is where that rule lives, along with the caveat that evenodd is a parity rule and two overlapping holes cancel.

- **Over-filled logos read again.** Several marks are a solid block with the lettering cut out of it. Painted as one colour with the cut-outs left open, they came out as blobs. TypeScript, npm, Swift, JavaScript and `.env` now get a plate behind the mark in the colour the logo has its letters in — white for TypeScript's `TS` and Swift's bird, near-black for JavaScript's `JS`.

- **Colours are lifted, not replaced.** With the tile gone, a brand colour is ink on near-black rather than a background to read against, and many are far too dark for that — Lua's `#000080` lands at 1.1:1, and every logo whose official form is black lands at 1.0:1. `readable()` raises lightness while keeping hue and saturation, so the language still looks like itself; a logo that is officially black goes to the white version those logos ship for dark backgrounds rather than to a muddy charcoal.

- **Folders are solid.** A filled folder in the category's accent colour, with the pictogram sunk into the body in a darker tone of that same accent — replacing the stroked lavender outline with a corner pictogram haloed in the editor background. The open state keeps the whole folder as its back and swings a front panel out and down over it, which is what reads as "open" at 16px.

- **Text is only text.** A format whose logo is a wordmark, or has no logo at all, is now bare lettering with nothing behind it. Each string is set from its measured ink at the largest size that fits the box, so `INI` and `CI` no longer look half-drawn next to `YAML` and `ASM`.

- **The neon variant follows the same geometry.** Same marks, same pictograms, same measured centres, same mappings; the shadow becomes a glow, every colour goes through `neonInk()`, and folders invert their weight — the body dims to a dark tint of the accent and the rim becomes the lit line. A variant is still a paint recipe and nothing else.

- **The pictograms are duotone, and none of them is a V1 shape recoloured.** Each one is handed its icon's colour plus a lighter tint of the same hue, and the split carries the drawing: the tint is the *surface* — the glass of the flask, the page of the book, the screen of the terminal, the face of the clock — and full strength is what sits on it: the liquid, the print, the prompt, the hands. V1 had to say everything with one silhouette, so its pictograms ended up as clusters of thin slots that close up at 16px; two tones carry the structure instead and the outline can stay simple and heavy.

  Every one of the 56 pictograms was rebuilt on that basis rather than restyled. The book opens, the cube and the parcel are isometric with a lit top face, the sheet is a header row over four cells, the cog lost two teeth and gained a hub, the wrench became an open-jaw spanner, the hammer grew a claw, the medal has a ribbon, and the padlock, key, brush and eye are new drawings.

- **The curly braces were wrong.** `{}` had been written out as a filled outline by hand, and both arms bowed the same way — the pair read as an hourglass, and the two halves did not line up. They are now the centre line of a stroke, one arm mirrored, symmetric about the middle by construction. `stroked()` in [`tools/icons/shapes.ts`](tools/icons/shapes.ts) exists for exactly this: V1 banned strokes because the folder halo trick needed fill-only glyphs, and V2 has no halo, so the handful of glyphs that genuinely ARE a stroke — a brace, a chevron, a tick — can be drawn as one. Affects the JSON, CSS-module and SCSS-module file icons and the `config/` folder.

- **The library is split** into [`tools/icons/shapes.ts`](tools/icons/shapes.ts) (primitives), [`tools/icons/glyphs.ts`](tools/icons/glyphs.ts) (the pictograms that are ours) and [`tools/icons/marks.ts`](tools/icons/marks.ts) (the brand marks).

- **Measurement covers the marks too.** `npm run measure:glyphs` now rasterises the imported logos alongside the pictograms and records the ink size of every string, not just its offset. That is what lets marks drawn to wildly different proportions — the Go wordmark is twice as wide as it is tall — be fitted to one size, and what lets an over-long string be scaled down instead of running out of the canvas.

### Notes

- Some upstream marks do not survive being drawn at 16px: Groovy's is an outlined wordmark on a star, Jenkins's and Jest's are line-art portraits, Vim's sets "Vim" inside its diamond, Lua's sets "Lua" inside its sphere, and JSON's closes its braces into a ring that reads as a ring. Those are redrawn solid and simplified from the same official artwork, and JSON uses the braces its mark is built from. Marks with no redistributable source — PowerShell, Excel, Word, PowerPoint — are drawn by hand in the shape language of the official icons.
- Erlang's logo is a wordmark whose letters close up at icon size, so it is set as `ERL` instead.

## [4.1.0]

A second icon variant, and a fix to the curly-brace glyph. Nothing was removed and no id, label or mapping changed, so an existing `settings.json` keeps working untouched.

### Added

- **Midnight Indigo Icons (Neon)** (`midnight-indigo-neon-icons`) — the same 222 icons, lit. The tile becomes the dark indigo ground already used for folder fills, the brand color moves off the tile and onto the ink, and a soft glow sits under the artwork. Same geometry, same glyphs, same measured centres, same mappings: switching between the two changes nothing but the look.
- [`tools/icons/palette.ts`](tools/icons/palette.ts) — every color the build paints with, plus the derivations between variants, extracted out of the drawing code. A variant is now a paint recipe (`VARIANTS` in [`tools/icons/build-icons.ts`](tools/icons/build-icons.ts)) rather than a copy of the generator, and the classic set is byte-for-byte reproducible, which makes `git diff` after a build the regression test.
- `node tools/icons/build-icons.ts <variant>` builds a single variant; with no argument it builds all of them. `node tools/preview/preview.ts neon` writes `icons/preview-neon.html`.

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
