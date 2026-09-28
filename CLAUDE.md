# Midnight Indigo — project rules

Rules for anyone (human or agent) working in this repository. The maintainer talks in Portuguese; reply in Portuguese, but follow the language rules below for what goes into files.

## Language

- **Agent-facing files are always in English**: skills, agent definitions, subagent prompts, commands, hooks, and this file.
- **Documentation has an English version (the default) and a pt-BR version (the alternative)**, kept in step in the same change. Write the English one first.

## Code style (TypeScript)

- **Arrow functions wherever possible**: `const f = (x: T): R => …`. Use a conventional `function` only where an arrow cannot work (hoisting is needed, `this` binding, generators).
- **Descriptive camelCase names for everything declared** — variables, constants, parameters, functions, classes, types, destructured bindings, loop variables and callback parameters. Never a single letter or an abbreviation of initials (`p`, `t`, `st`, `fg`-style shorthands for a whole object): `palette`, `tokens`, `state`. Type parameters and module-level constants follow the conventions of the language (`T`, `SCREAMING_CASE`) but still say what they hold.
- **Explicit types where the declaration does not already state them**: function return types, and variables when they are created (`const rows: Row[] = …`). Do not repeat a type that is already explicit (an annotated or `satisfies` object, `as const`, a typed parameter).

## Workflow

- **The roadmap** is the gitignored `.roadmap/` folder (`ROADMAP.md`, `PROGRESS.md`, `features/NN-*.md`), written in Portuguese. Updates to it are local and never part of a commit.
- **`npm run check`** must pass before anything is reported as done or committed.
- **Visual review is the agent's job, not the maintainer's.** A milestone's Definition of Done includes a review in real VS Code across all eight variants. After implementing, capture screenshots of the affected surfaces in the real VS Code (isolated profile, theme loaded from this working tree via `--extensionDevelopmentPath`), look at them, fix what is wrong, and only then report — with the screenshots as evidence and only the decisions that need the maintainer's taste. Do not hand the maintainer a checklist to verify by hand.
