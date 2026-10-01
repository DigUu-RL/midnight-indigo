/*
 * The visual regression run: everything `npm run check` cannot do, because it
 * needs a browser or VS Code itself.
 *
 *   npm run regression                          every stage
 *   npm run regression -- --only=previews,measure
 *   npm run regression -- --only=vscode --surfaces=chat,terminal --variants=indigo,pink
 *   npm run regression -- --accept              the last run's VS Code shots become the reviewed ones
 *
 * Four stages, each writing into .regression/current/ (gitignored):
 *
 *   previews   Renders every screenshot in docs/preview/ again, into a scratch
 *              folder, and compares the pixels with the committed ones. The
 *              check already knows the committed ones are of the current
 *              inputs; this is what knows the RENDERER still draws them the
 *              same — an updated Edge, a font that moved. A difference fails.
 *   baseline   Shoots the code samples in Midnight Indigo as v3.0.0 shipped it
 *              (tools/theme/indigo-baseline.json) and lays each beside today's
 *              Indigo with a diff, so the comparison to the baseline the
 *              roadmap asks for is a picture, not only the byte comparison the
 *              theme build makes of the colours.
 *   measure    Measures the icons' artwork and lettering again and compares the
 *              numbers with tools/icons/glyph-bounds.json and text-bounds.json,
 *              which the build places every icon by. A difference fails.
 *   vscode     The workbench corpus (tools/regression/surfaces.ts) and the code
 *              corpus (tools/regression/workspace.ts) in real VS Code, in all
 *              eight variants and the baseline — one screenshot per surface and
 *              variant, one contact sheet per surface. Each shot is compared
 *              with the same shot from the last REVIEWED run; a surface that
 *              changed, or that has never been reviewed, fails the run until
 *              someone has looked at its sheet and run `--accept`.
 *
 * .regression/current/report.html links every sheet and every diff.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openImageLab, type Comparison, type ImageLab, type SheetCell } from './images.ts';
import { CORPUS_SETTINGS, SURFACES, fileIn, resetWindow, type Surface, type SurfaceContext } from './surfaces.ts';
import { launchVsCode, type Session } from './vscode.ts';
import { CODE_CORPUS, buildWorkspace } from './workspace.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const ROOT: string = path.join(HERE, '..', '..');
const REGRESSION: string = path.join(ROOT, '.regression');
const CURRENT: string = path.join(REGRESSION, 'current');
const REVIEWED: string = path.join(REGRESSION, 'reviewed');
const PREVIEWS: string = path.join(ROOT, 'docs', 'preview');
const BASELINE_THEME: string = path.join(ROOT, 'tools', 'theme', 'indigo-baseline.json');

/** A shot counts as changed from the reviewed one when more than this share of its pixels moved: below it is the caret and antialiasing. */
const CHANGED_RATIO: number = 0.0005;

type Finding = { stage: string; severity: 'fail' | 'note'; text: string; link?: string };
const findings: Finding[] = [];
const fail = (stage: string, text: string, link?: string): void => void findings.push({ stage, severity: 'fail', text, link });
const note = (stage: string, text: string, link?: string): void => void findings.push({ stage, severity: 'note', text, link });

/* ---------------- arguments ---------------- */

const argument = (name: string): string[] | undefined =>
  process.argv
    .find((value: string): boolean => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3)
    .split(',')
    .filter(Boolean);

const STAGES = ['previews', 'baseline', 'measure', 'vscode'] as const;
type Stage = (typeof STAGES)[number];
const stages: Stage[] = (argument('only') as Stage[] | undefined) ?? [...STAGES];
const unknownStages: string[] = stages.filter((stage: string): boolean => !(STAGES as readonly string[]).includes(stage));
if (unknownStages.length) throw new Error(`unknown stage(s) ${unknownStages.join(', ')} — expected ${STAGES.join(', ')}`);

const relative = (file: string): string => path.relative(CURRENT, file).replace(/\\/g, '/');
const runNode = (script: string, environment: Record<string, string>, ...args: string[]): void => {
  execFileSync(process.execPath, [path.join(ROOT, 'tools', script), ...args], {
    cwd: ROOT,
    env: { ...process.env, ...environment },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
};
const pngsIn = (directory: string): string[] => (fs.existsSync(directory) ? fs.readdirSync(directory).filter((file: string): boolean => file.endsWith('.png')).sort() : []);
const percent = (ratio: number): string => `${(ratio * 100).toFixed(ratio < 0.001 ? 3 : 2)}%`;

/* ---------------- --accept ---------------- */

if (process.argv.includes('--accept')) {
  const shots: string = path.join(CURRENT, 'vscode');
  if (!fs.existsSync(shots)) throw new Error('there is no VS Code run in .regression/current/ to accept — run `npm run regression` first');
  // Merged, not replaced: a run of a few surfaces accepts those, and leaves the reviewed shots of the others as they were.
  fs.mkdirSync(path.join(REVIEWED, 'vscode'), { recursive: true });
  fs.cpSync(shots, path.join(REVIEWED, 'vscode'), { recursive: true, force: true });
  console.log('the last run\'s VS Code shots are now the reviewed ones (.regression/reviewed/vscode/)');
  process.exit(0);
}

/* ---------------- previews ---------------- */

const renderPreviews = (): string => {
  const output: string = path.join(CURRENT, 'previews', 'rendered');
  fs.rmSync(path.join(CURRENT, 'previews'), { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  runNode(path.join('preview', 'build-theme-preview.ts'), { MIDNIGHT_INDIGO_PREVIEW_OUT: output });
  runNode(path.join('preview', 'build-icon-preview.ts'), { MIDNIGHT_INDIGO_PREVIEW_OUT: output });
  return output;
};

const comparePreviews = async (lab: ImageLab, rendered: string): Promise<void> => {
  const committed: string[] = pngsIn(PREVIEWS);
  for (const missing of committed.filter((file: string): boolean => !fs.existsSync(path.join(rendered, file)))) {
    fail('previews', `docs/preview/${missing} is committed but no longer rendered`);
  }
  for (const file of pngsIn(rendered)) {
    if (!committed.includes(file)) {
      fail('previews', `${file} is rendered but not committed — run npm run preview:theme`);
      continue;
    }
    const diff: string = path.join(CURRENT, 'previews', 'diff', file);
    const comparison: Comparison = await lab.compare(path.join(PREVIEWS, file), path.join(rendered, file), diff);
    if (!comparison.sameSize) fail('previews', `${file} renders at ${comparison.width}×${comparison.height}, not the committed size`, relative(diff));
    else if (comparison.changed) fail('previews', `${file} renders ${comparison.changed} pixels (${percent(comparison.ratio)}) unlike the committed one`, relative(diff));
  }
  console.log(`previews: ${pngsIn(rendered).length} rendered and compared with docs/preview/`);
};

/* ---------------- baseline ---------------- */

const compareBaseline = async (lab: ImageLab, renderedPreviews: string | undefined): Promise<void> => {
  const folder: string = path.join(CURRENT, 'baseline');
  const rendered: string = path.join(folder, 'rendered');
  fs.rmSync(folder, { recursive: true, force: true });
  fs.mkdirSync(rendered, { recursive: true });
  runNode(path.join('preview', 'build-theme-preview.ts'), { MIDNIGHT_INDIGO_PREVIEW_OUT: rendered, MIDNIGHT_INDIGO_PREVIEW_THEME: BASELINE_THEME });
  const current: string = renderedPreviews ?? PREVIEWS;
  const shots: string[] = pngsIn(rendered).filter((file: string): boolean => file !== 'palettes.png');
  for (const file of shots) {
    const diff: string = path.join(folder, 'diff', file);
    const comparison: Comparison = await lab.compare(path.join(rendered, file), path.join(current, file), diff);
    const sheet: string = path.join(folder, 'sheets', file);
    await lab.sheet(
      `${file.replace('.png', '')} — Midnight Indigo v3.0.0 against today's`,
      [
        { label: 'v3.0.0 baseline', file: path.join(rendered, file) },
        { label: 'today', file: path.join(current, file) },
        { label: 'what moved', file: diff, note: percent(comparison.ratio) },
      ],
      3,
      560,
      sheet
    );
    note('baseline', `${file.replace('.png', '')}: ${percent(comparison.ratio)} of the pixels differ from v3.0.0`, relative(sheet));
  }
  console.log(`baseline: ${shots.length} samples shot in v3.0.0 and set beside today's Indigo`);
};

/* ---------------- measure ---------------- */

const compareMeasurements = (): void => {
  const output: string = path.join(CURRENT, 'measure');
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  runNode(path.join('icons', 'measure.ts'), { MIDNIGHT_INDIGO_MEASURE_OUT: output });
  for (const file of ['glyph-bounds.json', 'text-bounds.json']) {
    const committed: Record<string, Record<string, number>> = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'icons', file), 'utf8'));
    const measured: Record<string, Record<string, number>> = JSON.parse(fs.readFileSync(path.join(output, file), 'utf8'));
    for (const key of Object.keys(measured).filter((name: string): boolean => !(name in committed))) fail('measure', `${file}: ${key} is measured but not committed`);
    for (const key of Object.keys(committed).filter((name: string): boolean => !(name in measured))) fail('measure', `${file}: ${key} is committed but no longer measured`);
    for (const key of Object.keys(measured).filter((name: string): boolean => name in committed)) {
      const moved: string[] = Object.keys({ ...measured[key], ...committed[key] })
        .filter((field: string): boolean => measured[key][field] !== committed[key][field])
        .map((field: string): string => `${field} ${committed[key][field]} → ${measured[key][field]}`);
      if (moved.length) fail('measure', `${file}: ${key} measures differently — ${moved.join(', ')}`);
    }
  }
  console.log('measure: artwork and lettering measured again and compared with tools/icons/');
};

/* ---------------- VS Code ---------------- */

type Variant = { name: string; label: string; editorBackground: string };

const variantsToShoot = (): Variant[] => {
  const manifest: { contributes: { themes: { label: string; path: string }[] } } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const all: Variant[] = [
    ...manifest.contributes.themes.map((theme): Variant => ({
      name: theme.label.replace(/^Midnight /, '').toLowerCase(),
      label: theme.label,
      editorBackground: JSON.parse(fs.readFileSync(path.join(ROOT, theme.path), 'utf8')).colors['editor.background'],
    })),
    {
      name: 'baseline',
      label: 'Midnight Indigo v3.0.0 (baseline)',
      editorBackground: JSON.parse(fs.readFileSync(BASELINE_THEME, 'utf8')).colors['editor.background'],
    },
  ];
  const wanted: string[] | undefined = argument('variants');
  return wanted ? all.filter((variant: Variant): boolean => wanted.includes(variant.name)) : all;
};

/** The helper extension as VS Code loads it: its source, the baseline as a theme, and a Kotlin grammar VS Code does not ship. */
const prepareHelper = async (folder: string): Promise<void> => {
  fs.rmSync(folder, { recursive: true, force: true });
  fs.cpSync(path.join(HERE, 'vscode-helper'), folder, { recursive: true });
  fs.copyFileSync(BASELINE_THEME, path.join(folder, 'baseline-theme.json'));
  const kotlin: { default: object[] } = await import('@shikijs/langs/kotlin');
  fs.writeFileSync(path.join(folder, 'kotlin.tmLanguage.json'), JSON.stringify(kotlin.default[0]), 'utf8');
};

type Shot = { group: 'workbench' | 'code'; subject: string; title: string; variant: string; file: string };

const shootVsCode = async (variants: Variant[]): Promise<Shot[]> => {
  const workspace: string = path.join(REGRESSION, 'workspace');
  const helperFolder: string = path.join(REGRESSION, 'helper');
  buildWorkspace(workspace);
  await prepareHelper(helperFolder);
  fs.rmSync(path.join(CURRENT, 'vscode'), { recursive: true, force: true });

  const wantedSurfaces: string[] | undefined = argument('surfaces');
  const wantedLanguages: string[] | undefined = argument('languages');
  const surfaces: Surface[] = SURFACES.filter((surface: Surface): boolean => !wantedSurfaces || wantedSurfaces.includes(surface.name));
  const languages = CODE_CORPUS.filter(({ language }): boolean => !wantedLanguages || wantedLanguages.includes(language));
  const shots: Shot[] = [];

  const session: Session = await launchVsCode({
    repository: ROOT,
    helper: helperFolder,
    workspace,
    profile: path.join(REGRESSION, 'profile'),
    extensions: path.join(REGRESSION, 'extensions'),
    settings: CORPUS_SETTINGS,
  });
  const context: SurfaceContext = { workspace, file: fileIn(workspace) };

  /*
   * The shots are of whatever VS Code is installed, and an update of it moves
   * them as surely as a change to the theme does. The version is written down
   * with the shots, and a run whose version differs from the reviewed one says
   * so first, so its changes are read with that in mind.
   */
  const { version } = (await session.helper('ping')) as { version: string };
  fs.mkdirSync(path.join(CURRENT, 'vscode'), { recursive: true });
  fs.writeFileSync(path.join(CURRENT, 'vscode', 'version.txt'), `${version}\n`, 'utf8');
  const reviewedVersionFile: string = path.join(REVIEWED, 'vscode', 'version.txt');
  const reviewedVersion: string | undefined = fs.existsSync(reviewedVersionFile) ? fs.readFileSync(reviewedVersionFile, 'utf8').trim() : undefined;
  if (reviewedVersion && reviewedVersion !== version) note('vscode', `shot in VS Code ${version}; the reviewed run was ${reviewedVersion}, so some changes below may be VS Code's own`);
  console.log(`vscode: VS Code ${version}`);

  // TypeScript and Git start with the window; the first surface shot before they are up has no semantic colours and a spinning badge.
  // A debug session once, too: the status bar shows its launch item from the first session on, and would otherwise depend on whether Run & Debug ran first.
  await session.helper('debug', { folder: workspace, program: context.file('debug/promote.js') });
  await resetWindow(session);
  await session.helper('open', { file: context.file('src/member.service.ts'), selection: [0, 0] });
  await new Promise((resolve) => setTimeout(resolve, 8000));
  const shotFile = (group: string, subject: string, variant: string): string => path.join(CURRENT, 'vscode', group, subject, `${variant}.png`);

  try {
    for (const surface of surfaces) {
      try {
        await resetWindow(session);
        await surface.prepare(session, context);
        for (const [index, variant] of variants.entries()) {
          await session.setTheme(variant.label, variant.editorBackground);
          if (surface.transient && index > 0) {
            await resetWindow(session);
            await surface.prepare(session, context);
          }
          const file: string = shotFile('workbench', surface.name, variant.name);
          await session.screenshot(file);
          shots.push({ group: 'workbench', subject: surface.name, title: surface.title, variant: variant.name, file });
        }
        await surface.cleanup?.(session);
        console.log(`vscode: ${surface.title}`);
      } catch (error) {
        fail('vscode', `${surface.title} could not be shot: ${String((error as Error).message ?? error).split('\n')[0]}`);
      }
    }
    // The code corpus is about the code: no hints between its words.
    if (languages.length) await session.helper('configure', { section: 'editor', key: 'inlayHints.enabled', value: 'off' });
    for (const { language, file: sample } of languages) {
      try {
        await resetWindow(session);
        await session.helper('open', { file: context.file(path.join('corpus', sample)), selection: [0, 0] });
        // TypeScript's semantic tokens arrive after the first paint.
        await new Promise((resolve) => setTimeout(resolve, /\.(ts|tsx|js)$/.test(sample) ? 3000 : 800));
        const subject: string = sample.replace(/^sample\./, '');
        for (const variant of variants) {
          await session.setTheme(variant.label, variant.editorBackground);
          const file: string = shotFile('code', subject, variant.name);
          await session.screenshot(file);
          shots.push({ group: 'code', subject, title: language, variant: variant.name, file });
        }
        console.log(`vscode: ${language}`);
      } catch (error) {
        fail('vscode', `${language} could not be shot: ${String((error as Error).message ?? error).split('\n')[0]}`);
      }
    }
  } finally {
    await session.close();
  }
  return shots;
};

const reviewVsCode = async (lab: ImageLab, shots: Shot[]): Promise<void> => {
  const subjects: Map<string, Shot[]> = new Map();
  for (const shot of shots) subjects.set(`${shot.group}/${shot.subject}`, [...(subjects.get(`${shot.group}/${shot.subject}`) ?? []), shot]);
  for (const [key, group] of subjects) {
    const cells: SheetCell[] = [];
    const changed: string[] = [];
    const unreviewed: string[] = [];
    for (const shot of group) {
      const reviewed: string = path.join(REVIEWED, 'vscode', shot.group, shot.subject, `${shot.variant}.png`);
      let noteText: string | undefined;
      if (!fs.existsSync(reviewed)) unreviewed.push(shot.variant);
      else {
        const diff: string = path.join(CURRENT, 'vscode-diff', shot.group, shot.subject, `${shot.variant}.png`);
        const comparison: Comparison = await lab.compare(reviewed, shot.file, diff);
        if (!comparison.sameSize || comparison.ratio > CHANGED_RATIO) {
          changed.push(`${shot.variant} ${comparison.sameSize ? percent(comparison.ratio) : 'resized'}`);
          noteText = `changed ${comparison.sameSize ? percent(comparison.ratio) : 'size'}`;
        }
      }
      cells.push({ label: shot.variant, file: shot.file, note: noteText });
    }
    const sheet: string = path.join(CURRENT, 'sheets', `${key.replace('/', '-')}.png`);
    await lab.sheet(`${group[0].title} — every variant`, cells, 3, 640, sheet);
    if (changed.length) fail('vscode', `${group[0].title} changed since the reviewed run: ${changed.join(', ')}`, relative(sheet));
    else if (unreviewed.length) fail('vscode', `${group[0].title} has never been reviewed in ${unreviewed.join(', ')}`, relative(sheet));
    else note('vscode', `${group[0].title} matches the reviewed run`, relative(sheet));
  }
};

/* ---------------- the report ---------------- */

const writeReport = (): void => {
  const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const rows: string = findings
    .map(
      (finding: Finding): string =>
        `<tr class="${finding.severity}"><td>${finding.stage}</td><td>${finding.severity}</td><td>${escapeHtml(finding.text)}</td>` +
        `<td>${finding.link ? `<a href="${finding.link}">${escapeHtml(finding.link)}</a>` : ''}</td></tr>`
    )
    .join('\n');
  fs.writeFileSync(
    path.join(CURRENT, 'report.html'),
    `<!doctype html><meta charset="utf-8"><title>Regression</title><style>
      body { font: 13px 'Segoe UI', system-ui, sans-serif; background: #111; color: #ddd; padding: 16px; }
      table { border-collapse: collapse; } td { padding: 3px 10px; border-bottom: 1px solid #222; vertical-align: top; }
      tr.fail td:nth-child(2) { color: #f66; font-weight: 600; } a { color: #9cf; }
    </style><h1>Visual regression</h1><table>${rows}</table>`,
    'utf8'
  );
};

/* ---------------- run ---------------- */

const main = async (): Promise<void> => {
  fs.mkdirSync(CURRENT, { recursive: true });
  const lab: ImageLab = await openImageLab();
  try {
    let renderedPreviews: string | undefined;
    if (stages.includes('previews')) {
      renderedPreviews = renderPreviews();
      await comparePreviews(lab, renderedPreviews);
    }
    if (stages.includes('baseline')) await compareBaseline(lab, renderedPreviews);
    if (stages.includes('measure')) compareMeasurements();
    if (stages.includes('vscode')) await reviewVsCode(lab, await shootVsCode(variantsToShoot()));
  } finally {
    await lab.close();
  }
  writeReport();

  const failures: Finding[] = findings.filter((finding: Finding): boolean => finding.severity === 'fail');
  for (const finding of failures) console.log(`  FAIL  ${finding.stage}  ${finding.text}${finding.link ? `  (${finding.link})` : ''}`);
  console.log(
    `\n${failures.length ? `${failures.length} problem(s)` : 'nothing changed'} — .regression/current/report.html` +
      (failures.some((finding: Finding): boolean => finding.stage === 'vscode')
        ? '\nLook at each sheet named above; when every change is meant, run `npm run regression -- --accept`.'
        : '')
  );
  process.exitCode = failures.length ? 1 : 0;
};

await main();
