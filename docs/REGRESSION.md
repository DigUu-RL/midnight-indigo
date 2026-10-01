# Visual regression

*[Português](REGRESSION.pt-BR.md)*

A change that alters what the theme draws cannot be merged without someone seeing it. Two commands hold that line: `npm run check`, offline and fast, on every change; and `npm run regression`, in a browser and in real VS Code, before a release and after any change to what is drawn.

## `npm run check`

Runs without a network, a browser or VS Code, and never writes to the tree. Besides the type check, the theme and icon builds and their own checks (baseline, contrast floors, accessibility, syntax corpus, icon optics), it holds:

| Check | What it refuses |
| --- | --- |
| build is deterministic | a second build that writes different bytes |
| generated files are committed | a `themes/` or `icons/` file that is not what the build writes from the sources — a source change committed without its output. The tree is put back as it was and the check fails; `npm run build` is what writes |
| outputs are declared | a theme or icon theme on disk that `package.json` does not contribute (it would ship and load nowhere), or a contribution with no file |
| snapshots | any change to the snapshots below that has not been written down with `npm run snapshot` |
| rendered outputs are current | a screenshot in `docs/preview/`, or an icon measurement in `tools/icons/`, rendered from inputs that have changed since |
| inventory is up to date | `docs/INVENTORY.md`, `TOKENS.md`, `SYNTAX.md` — including the hash of every screenshot |

### Snapshots

`tools/regression/snapshots/` says what the extension draws one fact to a line, so a change reads as a few lines of diff instead of eight rewritten JSON files:

- `structure.txt` — what every theme shares: its TextMate rules and their scopes in order, its semantic selectors, how many workbench colours it sets; the icon theme's definitions and how many names each table maps. The check also fails if the eight variants stop sharing one structure.
- `colours.tsv` — every workbench colour, TextMate rule and semantic rule, one row each, the eight variants side by side.
- `icon-associations.txt` — a fixed set of real paths and folder names, and the icon VS Code's resolution gives each one.
- `icon-geometry.txt` — where each built icon's ink sits: its box, its centre of mass, its area.

When the check fails it prints the changed rows themselves — `~ editor.background  pink #050002 → #000000` — so the failure is the review. If every change is meant, `npm run snapshot` rewrites them, and they are committed with the change.

### Rendered outputs

The screenshots and the icon measurements need a browser, so they are committed, and the check cannot render them again. `tools/regression/rendered-from.json` records the hash of everything each one was rendered from — the themes, the samples, the icon SVGs and the script for the previews; the drawings, the marks and the lettering runs for the measurements. Each producer writes its record when it runs; the check recomputes the hashes and names the command to run for any that moved.

## `npm run regression`

Needs Edge or Chrome and an installed VS Code, and writes only into `.regression/` (ignored by Git). Four stages, each selectable with `--only=`:

| Stage | What it does | Fails when |
| --- | --- | --- |
| `previews` | renders every screenshot in `docs/preview/` again and compares the pixels with the committed ones | any pixel differs — the renderer drew it otherwise |
| `baseline` | shoots each code sample in Midnight Indigo as v3.0.0 shipped it and lays it beside today's, with a diff of what moved | never; it is a picture for the review |
| `measure` | measures the icons' artwork and lettering again and compares with `tools/icons/glyph-bounds.json` and `text-bounds.json` | any number differs — a font or the renderer moved under the icons |
| `vscode` | shoots the workbench corpus and the code corpus in real VS Code, in the eight variants and the baseline, and compares every shot with the last reviewed run | a shot changed, or was never reviewed |

`.regression/current/report.html` links every contact sheet and every diff.

### The VS Code corpus

The window is the installed VS Code in a throwaway profile, with an empty extensions folder, the theme loaded from the working tree and a helper extension (`tools/regression/vscode-helper/`) that runs commands for the harness and supplies the data the surfaces need: diagnostics, a test run with coverage, comment threads, notifications, a log, a quick pick, a debug session, a chat participant and a model for it.

**Workbench** — Explorer, Search, Source Control, Run & Debug, Extensions, Problems, Output, Terminal, Command Palette, Quick Input, Settings, Outline, Breadcrumbs, IntelliSense, Diff Editor, Sticky Scroll, Inlay Hints, Notifications, Chat, Agents, Testing / Coverage, Notebook, Welcome / Walkthrough, Minimap and Overview Ruler, Comments.

**Code** — TypeScript, TSX, JavaScript, C#, Python, Rust, Go, Java, Kotlin, PHP, PowerShell, JSON, YAML, Markdown, HTML, CSS, SCSS, SQL, Shell, from `tools/syntax/samples/`.

Every surface is built from a workspace the run creates from nothing (`tools/regression/workspace.ts`), and everything that would make two runs differ is turned off or pinned: the page is laid out at 1366×768 whatever size the window opens at, every surface starts from the same side bar (folders collapsed, other panes closed, no secondary side bar), scroll bars are always shown rather than fading, the caret does not blink, Git blame is hidden, chat sessions are archived before one is shot and the chat is maximized, and the start page's list of recent folders is never in frame. Two runs in different orders give the same pixels.

### Reviewing

1. `npm run regression` — or a part of it: `--only=vscode --surfaces=chat,terminal --variants=indigo,pink --languages=TypeScript`.
2. For each surface it names, open its sheet in `.regression/current/sheets/` (all nine variants side by side) and its diffs in `.regression/current/vscode-diff/` (changed pixels in magenta).
3. When every change is meant: `npm run regression -- --accept`. The shots become the reviewed ones the next run compares with.

The reviewed shots are of one VS Code version, recorded beside them; a run in another version says so first, since some of its changes will be VS Code's own.

Each surface also records what its shots were taken of — the hash of the themes, the icons, the grammar injection, what `package.json` contributes and the corpus — in an `inputs.txt` beside them. The README's workbench screenshots are reviewed shots copied by `npm run preview:workbench`, which refuses a surface whose record is not the tree's, so a screenshot of an older theme cannot reach the listing.
