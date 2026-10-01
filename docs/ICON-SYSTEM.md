# Icon system

How **Midnight Icons** is drawn, what it covers, and how it is checked. [Versão em português](ICON-SYSTEM.pt-BR.md).

One icon theme serves all eight color themes: 413 SVGs — 305 file and language icons, and 53 folders with an open and a closed state — matched to 636 extensions, 372 exact file names and 118 language ids. The icons keep their own colors in every theme: a Python file is `#3776AB` and `#FFD43B` whether the editor around it is indigo or green, because the mark is the language's identity, not the theme's.

Everything in [`icons/`](../icons/) is generated. The sources are in [`tools/icons/`](../tools/icons/); [`DEVELOPMENT.md`](DEVELOPMENT.md) says how to build them.

## One rule: readable at 16px

Every decision below comes from the size VS Code actually draws a file icon at.

- **The logo is the icon.** There is no tile. A file icon is the language's or tool's own mark, flat, in its official colors, filling the box. The outlines are imported from the projects' own artwork; only the treatment is ours.
- **A logo earns its place at 16px, or it is not used.** Less, Stylus, EditorConfig, JSON, MySQL, Travis, Composer and Electron all have official marks; all were imported and all were put back, because at 16px a logotype, a line-art mascot or a plain ring says nothing. The reason is recorded at each entry in [`tools/icons/icon-spec.ts`](../tools/icons/icon-spec.ts).
- **A small shadow.** Every solid mark casts a soft offset shadow in its own hue with the light taken away — black is invisible on a near-black ground, and a shadow more saturated than the mark reads as a colored fringe. It falls half a pixel at 16px. Line art casts none: under a stroke thinner than a pixel a shadow is a second hairline out of register.
- **Holes are holes.** Anything cut out of a shape is transparent, so an icon reads on the explorer's hover and selection grounds. Marks whose letters are cut out of a block — TypeScript, npm, Swift — get the letters painted back in the logo's color.
- **Nothing of ours is pointed.** At 16px a bare vertex aliases into a grey fringe. The only hard corners in the set belong to logos, whose geometry is not ours to soften.
- **No badges.** A file-name pattern gets its own icon rather than a marker on a base one, in the language's color: `*.spec.ts` is a flask, `*.service.ts` a cog, `*.guard.ts` a shield, `*.dto.ts` a pair of arrows. You read the language and the role at once.
- **Lettering is a last resort, and still an object.** A format with no mark at all is set as bare letters — `PDF`, `ASM`, `INI` — over a rule in the same color, with a beam of light across it. Eighteen of the 305 file icons are lettered.

## Placed by weight

Icons are not centred or sized by hand. `npm run measure:glyphs` rasterises every mark, pictogram and string and records its **ink** — box, centre of mass, how much of it is solid — because a bounding box is not what the eye sees: the flask sits on its bulb, a triangle on its base, and SVG centres a string by its advance width rather than its letters.

Each piece is centred halfway between its box and its centre of mass, as a designer corrects a play button by hand. Squares are drawn a touch smaller than discs, long wordmarks a touch larger, so the set evens out in weight.

After the build, `npm run audit:icons` rasterises every built icon and records its optical centre, coverage, stroke, holes, corners, shadow and solidity at 16 and 32px; it also renders every file icon at 16px over the side bar and measures how different each pair looks. `npm run check` holds each icon to the limits in [`tools/icons/icon-optics.ts`](../tools/icons/icon-optics.ts) — optical centre within two thirds of a pixel, a shadow that never outweighs the ink, no two file icons closer than 8 ΔE in shape and color — unless the exception has been looked at and written down with a reason.

## Folders say what they are for

A file icon says what technology a file is; a folder says what it is for. A folder is a flat panel square to the viewer, with a silhouette sunk into it in a darker tone and a hard-edged beam of light crossing it at 40°. The open state drops the front wall and shows the body behind it.

Its color is its role in the project, in nine roles:

| Role | Color | Folders |
| --- | --- | --- |
| Interface | rose | `components`, `views`, `layouts`, `styles`, `themes`, `design` |
| Content | copper | `assets`, `images`, `media`, `audio`, `icons`, `fonts`, `public`, `docs`, `i18n` |
| Logic | blue | `functions`, `utils`, `helpers`, `hooks`, `core`, `shared`, `plugins`, `packages` |
| Data | gold | `models`, `store`, `context`, `database`, `schemas`, `types`, `constants` |
| Network | teal | `services`, `controllers`, `middleware`, `routes`, `api`, `server`, `jobs` |
| Quality | green | `tests`, `mocks`, `validators`, `benchmarks` |
| Security | coral | `security`, `guards`, `keys` |
| Tooling | slate | `config`, `scripts`, `build`, `docker`, `workflows`, `ai` |
| Dormant | grey | `logs`, `temp`, `archive` |

Each folder also matches its synonyms — `tests` matches `spec` and `e2e`, `ai` matches `.claude` and `prompts`, and so on, 241 names in all. The plain folder is a lavender indigo.

The folders are calmer than the logos on purpose: a folder is a solid panel and a logo is a mark with air around it, so at the same saturation the folders would outweigh the files inside them. The seven hues and the plain folder share one OKLCH chroma under the logos' lower quartile, and neighbours on the wheel alternate a step up and down in lightness. The build fails if a folder drops under 4.5:1 on the side bar, a silhouette under 3:1 on its folder, or two roles closer than 8 ΔE.

## Coverage

| | |
| --- | --- |
| **Languages** | JS/TS/JSX/TSX, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C/C++/C#/F#/VB.NET, PHP, SQL, Perl, Lua, Dart, Elixir, Erlang, Haskell, Clojure, Scala, Groovy, R, Julia, Nim, Crystal, Zig, Objective-C, Solidity, Assembly, Elm, OCaml, Fortran, Racket, PureScript, Gleam, Haxe, Nix, WebAssembly, COBOL, Pascal, Ada, Tcl, ABAP, the Lisps, Prolog, AppleScript, AutoHotkey, awk |
| **Markup, styles and data** | HTML, CSS, SCSS/Sass, Less, Stylus, JSON, YAML, TOML, INI, XML, ENV, Markdown/MDX, AsciiDoc, reStructuredText, LaTeX, CSV, JSON Lines, OpenAPI, Swagger |
| **Frameworks and runtimes** | Vue, Svelte, Astro, Angular, Next.js, Nuxt, Tailwind, Bootstrap, PostCSS, Node, Deno, Bun, Electron, Tauri, Flutter, Django, Laravel, Spring, .NET project files and Razor |
| **Build, test and CI** | webpack, Vite, Rollup, esbuild, Turborepo, Nx, Lerna, Gradle, Maven, NuGet, MSBuild, Poetry, uv, Conda, Jest, Vitest, pytest, Cypress, Playwright, Mocha, Storybook, GitHub Actions, Dependabot, pre-commit, Codecov, Ruff, CircleCI, Travis, Bitbucket, GitLab CI, Azure, Jenkins, Renovate, the LLVM tools |
| **Infrastructure and data stores** | Docker, Compose, Kubernetes, Helm, Terraform, HCL, Ansible, Packer, Pulumi, Serverless, Netlify, Vercel, Cloudflare, MongoDB, PostgreSQL, MySQL, Redis, SQLite, Prisma, Firebase |
| **Hardware, graphics and science** | Verilog, VHDL, waveform dumps, PCB layouts, device trees, shaders, CUDA, MATLAB, statistics packages, ML weights, CAD, G-code, GPU textures |
| **AI assistants** | instructions, prompts, agents, skills (`SKILL.md`), MCP configuration |
| **The rest of the file system** | images, RAW photos, vector art, fonts, audio, video, subtitles, archives, installers, disk images, e-books, certificates and keys, PDF and Office documents, 3D, mail, calendars, geodata, packet captures, datasets, test snapshots, templates, translation catalogues, crash dumps and backups |
| **Repository files** | `CODEOWNERS`, `SECURITY.md`, issue and PR templates, commit and release config, Husky hooks, dev containers, `hosts`, crontabs, systemd units, sitemaps, feeds, source maps, workspaces, secrets, notices |
| **Name patterns** | `*.spec`, `*.test`, `*.d.ts`, `*.module`, `*.component`, `*.service`, `*.stories`, `*.config`, `*.min.js`, `*.guard`, `*.pipe`, `*.directive`, `*.controller`, `*.model`, `*.dto`, `*.entity` |

Files are also matched by the folder they sit in, as VS Code allows: every workflow under `.github/workflows` is GitHub Actions, the forms in `ISSUE_TEMPLATE` are issue templates, a Markdown file in an `agents` folder is an agent.

Coverage is measured, not guessed. `npm run audit:coverage` resolves the file names of 47 public repositories — web tooling, clusters, CI, observability, data, science, ML, assistant tooling, graphics, hardware and .NET — the way VS Code does, and ranks what falls back to the plain page by how many repositories it appears in. 9.2% of those 812,272 files fall back. What is left at the top is ambiguous on purpose: `.in`, `.inc`, `.def`, `.dat` and `VERSION` mean something different in every ecosystem.

## Where the artwork comes from

Neither the logos nor the pictograms are drawn here. Both are imported by a script that pins its sources and writes a checked-in file, so building the icons never touches the network. [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md) carries every license.

| Source | License | Used for |
| --- | --- | --- |
| [Simple Icons](https://simpleicons.org) 16.29.0 | CC0-1.0 | The default source for marks: flat, single-path |
| [devicon](https://github.com/devicons/devicon) v2.17.0 | MIT | Marks that are genuinely multi-color — Python, Java, Dart, Vue, HTML5, C#, Azure |
| [Phosphor](https://phosphoricons.com), via [Iconify](https://iconify.design) | MIT | The pictograms, at the `duotone` weight for files and `fill` for folders |
| Material Symbols, Fluent, MingCute, Material Design Icons, via Iconify | Apache-2.0 / MIT | Pictograms where Phosphor's drawing does not survive 16px, each with its reason at its entry |

Where a project has redrawn its logo, the set carries the current one: CSS is the rebeccapurple mark adopted in 2024, and GitLab the tanuki as simplified in 2022. A handful of marks that do not survive 16px, or have no redistributable source — PowerShell, the Office trio, Groovy, Jenkins, Jest, Vim, Lua — are redrawn solid in [`tools/icons/marks.ts`](../tools/icons/marks.ts) from the official artwork.

The pictograms are duotone: the icon's color plus a surface tone of it, a little under halfway to the ground. The surface is drawn only where the drawing holds it — glass and liquid, page and print, screen and prompt. A free panel behind a drawing, whose edge the lines run across, is measured and left out.

Which drawing means which file is the part that stays ours, and every choice is written next to the icon it resolves to — `dto` is a pair of arrows because a DTO exists to cross a boundary, `husky` is a dog, `devcontainer` is a shipping container.

The logos are trademarks of their respective owners, used to identify the file types they belong to.
