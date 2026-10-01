/*
 * The workbench corpus: every surface the roadmap names, and how to bring each
 * one up in a fresh window so that it shows something worth looking at.
 *
 * A surface is prepared once and then shot in every variant — switching the
 * theme repaints the window without closing anything — except the TRANSIENT
 * ones, a quick pick or a suggest widget, which a theme change may dismiss;
 * those are prepared again before every shot.
 *
 * Everything is driven through commands where a command exists (the helper's
 * bridge waits for it to finish) and through the keyboard only where it does
 * not. Positions in member.service.ts are found by searching its text, so an
 * edit to the fixture cannot leave a squiggle under the wrong word.
 */

import path from 'node:path';
import type { Session } from './vscode.ts';
import { SERVICE_TS, SPEC_TS, positionOf, rangeOf } from './workspace.ts';

export type SurfaceContext = { workspace: string; file: (relativePath: string) => string };

export type Surface = {
  name: string;
  title: string;
  transient?: boolean;
  prepare: (session: Session, context: SurfaceContext) => Promise<void>;
  /** What the surface leaves open that the next one's reset cannot reach, closed while its editor is still there. */
  cleanup?: (session: Session) => Promise<void>;
};

const sleep = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

const SERVICE: string = 'src/member.service.ts';
const SPEC: string = 'src/member.service.spec.ts';

/** Opens member.service.ts with the cursor at the start of `text`, scrolled so the line `above` lines over it is on top. */
const openService = async (session: Session, context: SurfaceContext, text: string = 'async promote', above: number = 3): Promise<void> => {
  const [line, character]: [number, number] = positionOf(SERVICE_TS, text);
  await session.helper('open', { file: context.file(SERVICE), selection: [line, character], reveal: Math.max(0, line - above) });
};

const DIAGNOSTICS = [
  { severity: 'error', at: rangeOf(SERVICE_TS, 'this.repository.save(updated)'), message: "Argument of type 'Member' is not assignable to parameter of type 'MemberRecord'.", code: 2345 },
  { severity: 'warning', at: rangeOf(SERVICE_TS, 'cached', 1), message: "'cached' could be narrowed once, outside the loop.", code: 'prefer-narrow' },
  { severity: 'information', at: rangeOf(SERVICE_TS, 'this.promote(id, to)', 1), message: 'These promotions could run in parallel.', code: 'perf' },
  { severity: 'hint', at: rangeOf(SERVICE_TS, 'PAGE_SIZE', 1), message: "'PAGE_SIZE' is only read once.", code: 6133, tags: ['unnecessary'] },
  { severity: 'hint', at: rangeOf(SERVICE_TS, 'makeAdmin'), message: "'makeAdmin' is deprecated.", code: 6385, tags: ['deprecated'] },
];

const TEST_CASES = [
  { id: 'promotes', label: 'promotes a member to admin', outcome: 'passed' },
  { id: 'owner', label: 'keeps an owner an owner', outcome: 'failed', message: 'Expected role "owner", received "member".' },
  { id: 'missing', label: 'throws for a missing member', outcome: 'passed' },
  { id: 'cache', label: 'serves a cached member', outcome: 'skipped' },
  { id: 'audit', label: 'writes an audit entry', outcome: 'errored', message: 'audit.entries is private.' },
].map((testCase) => ({ ...testCase, line: positionOf(SPEC_TS, testCase.label)[0] }));

/** Answers a confirmation dialog with its primary button, if one opens within a few seconds. */
const confirmDialog = async (session: Session): Promise<void> => {
  const primary = session.page.locator('.monaco-dialog-box .dialog-buttons .monaco-button').first();
  try {
    await primary.waitFor({ state: 'visible', timeout: 5000 });
    await primary.click();
  } catch {
    // Nothing asked.
  }
};

/*
 * The chat answers through the helper's participant and its model, which have to be named:
 * a fresh profile has no model chosen, and the panel says the model is unavailable rather
 * than pick one. The models register a moment after the window is up.
 */
const askChat = async (session: Session): Promise<void> => {
  await sleep(1500);
  await session.command('workbench.action.chat.open', {
    query: 'How does promote treat an owner?',
    modelSelector: { vendor: 'midnight-regression', id: 'regression' },
  });
  // Maximized, so the conversation is laid out at one width whatever the side bar was left at.
  await session.command('workbench.action.maximizeAuxiliaryBar');
  await sleep(3500);
};

/** The lines of member.service.ts from `first` through `last` (texts that start them), as zero-based numbers. */
const linesBetween = (first: string, last: string): number[] => {
  const from: number = positionOf(SERVICE_TS, first)[0];
  const to: number = positionOf(SERVICE_TS, last)[0];
  return Array.from({ length: to - from + 1 }, (_, index: number): number => from + index);
};

export const SURFACES: Surface[] = [
  {
    name: 'explorer',
    title: 'Explorer',
    prepare: async (session, context) => {
      await openService(session, context);
      await session.command('workbench.view.explorer');
      await session.helper('revealInExplorer', { file: context.file('corpus/sample.kt') });
      await session.helper('revealInExplorer', { file: context.file(SERVICE) });
      await sleep(800);
    },
  },
  {
    name: 'search',
    title: 'Search',
    prepare: async (session, context) => {
      await openService(session, context);
      await session.command('workbench.action.findInFiles', { query: 'promote', triggerSearch: true, isRegex: false, matchWholeWord: false });
      await sleep(2000);
    },
  },
  {
    name: 'source-control',
    title: 'Source Control',
    prepare: async (session, context) => {
      await openService(session, context, 'await this.audit.record');
      await session.command('workbench.view.scm');
      await sleep(2500);
    },
  },
  {
    name: 'run-and-debug',
    title: 'Run & Debug',
    prepare: async (session, context) => {
      await session.command('workbench.view.debug');
      await session.helper('debug', { folder: context.workspace, program: context.file('debug/promote.js') });
      await sleep(1500);
      await session.command('workbench.debug.action.focusRepl');
      await sleep(500);
    },
  },
  {
    name: 'extensions',
    title: 'Extensions',
    prepare: async (session) => {
      // Extensions under development are not listed as installed; the built-in ones are, and the same in every run of one VS Code.
      await session.command('workbench.view.extensions');
      await session.command('workbench.extensions.search', '@builtin theme');
      await sleep(1500);
      await session.command('extension.open', 'vscode.theme-defaults');
      await sleep(2000);
    },
  },
  {
    name: 'problems',
    title: 'Problems',
    prepare: async (session, context) => {
      await session.helper('diagnostics', { file: context.file(SERVICE), items: DIAGNOSTICS });
      await openService(session, context, 'if (this.cache.has(id))', 12);
      await session.command('workbench.actions.view.problems');
      await sleep(800);
    },
  },
  {
    name: 'output',
    title: 'Output',
    prepare: async (session, context) => {
      await openService(session, context);
      await session.helper('output');
      await sleep(800);
    },
  },
  {
    name: 'terminal',
    title: 'Terminal',
    prepare: async (session, context) => {
      await openService(session, context);
      // Maximized first: the panel is shorter than the output, and the terminal's sticky scroll would pin the command over its first lines.
      await session.command('workbench.action.togglePanel');
      await session.command('workbench.action.toggleMaximizedPanel');
      await session.helper('terminal', { cwd: context.workspace, command: 'node debug/colors.js', name: 'corpus' });
      await sleep(4000);
    },
    // The panel keeps its maximized state for every surface after this one.
    cleanup: async (session) => void (await session.command('workbench.action.toggleMaximizedPanel')),
  },
  {
    name: 'command-palette',
    title: 'Command Palette',
    transient: true,
    prepare: async (session, context) => {
      await openService(session, context);
      await session.command('workbench.action.showCommands');
      await sleep(300);
      await session.page.keyboard.type('theme', { delay: 20 });
      await sleep(600);
    },
  },
  {
    name: 'quick-input',
    title: 'Quick Input',
    transient: true,
    prepare: async (session, context) => {
      await openService(session, context);
      await session.helper('quickPick');
      await sleep(600);
    },
  },
  {
    name: 'settings',
    title: 'Settings',
    prepare: async (session) => {
      await session.command('workbench.action.openSettings2', { query: 'editor cursor' });
      await sleep(1500);
    },
  },
  {
    name: 'outline',
    title: 'Outline',
    prepare: async (session, context) => {
      await openService(session, context);
      await session.command('workbench.view.explorer');
      await session.command('workbench.files.action.collapseExplorerFolders');
      await session.command('outline.focus');
      await sleep(1500);
    },
  },
  {
    name: 'breadcrumbs',
    title: 'Breadcrumbs',
    transient: true,
    prepare: async (session, context) => {
      await openService(session, context, 'this.cache.set(id, updated)', 6);
      await sleep(800);
      await session.command('breadcrumbs.focusAndSelect');
      await sleep(800);
    },
  },
  {
    name: 'intellisense',
    title: 'IntelliSense',
    transient: true,
    prepare: async (session, context) => {
      const [line, character]: [number, number] = positionOf(SERVICE_TS, 'cache.set(id, updated)');
      await session.helper('open', { file: context.file(SERVICE), selection: [line, character], reveal: Math.max(0, line - 8) });
      await sleep(1500);
      await session.command('editor.action.triggerSuggest');
      await sleep(1200);
      // The details are a toggle VS Code remembers, so they are opened only when the widget shows them closed.
      const detailsShown: boolean = await session.page.evaluate((): boolean =>
        Array.from(document.querySelectorAll<HTMLElement>('.suggest-details')).some((details: HTMLElement): boolean => details.offsetWidth > 0 && details.offsetHeight > 0)
      );
      if (!detailsShown) await session.command('toggleSuggestionDetails');
      await sleep(600);
    },
  },
  {
    name: 'diff-editor',
    title: 'Diff Editor',
    prepare: async (session, context) => {
      await session.helper('gitChange', { file: context.file(SERVICE) });
      await sleep(2500);
    },
  },
  {
    name: 'sticky-scroll',
    title: 'Sticky Scroll',
    prepare: async (session, context) => {
      // Five blocks deep at the top of the view: class, method, for, if, if — and the while under them.
      const [line]: [number, number] = positionOf(SERVICE_TS, 'break;');
      await session.helper('open', { file: context.file(SERVICE), selection: [line, 12], reveal: line + 1 });
      await sleep(1200);
    },
  },
  {
    name: 'inlay-hints',
    title: 'Inlay Hints',
    prepare: async (session, context) => {
      await openService(session, context, 'async promote', 1);
      await sleep(3000);
    },
  },
  {
    name: 'notifications',
    title: 'Notifications',
    prepare: async (session, context) => {
      await openService(session, context);
      await session.helper('notifications');
      await sleep(500);
      await session.command('notifications.showList');
      await sleep(800);
    },
  },
  {
    name: 'chat',
    title: 'Chat',
    prepare: async (session, context) => {
      await openService(session, context);
      await askChat(session);
    },
  },
  {
    name: 'agents',
    title: 'Agents',
    prepare: async (session) => {
      // The sessions list beside the conversation it holds. Earlier sessions are archived first:
      // they would be listed as "2 mins ago", which is a different picture every run.
      // Archiving asks for confirmation, and the command waits for the answer, so it is not awaited until the dialog is answered.
      const archiving: Promise<unknown> = session.command('workbench.action.chat.archiveAllAgentSessions').catch((): undefined => undefined);
      await confirmDialog(session);
      await archiving;
      await askChat(session);
      await session.command('workbench.action.chat.setAgentSessionsOrientationSideBySide');
      await session.command('workbench.action.chat.focusAgentSessionsViewer');
      await sleep(1500);
    },
  },
  {
    name: 'testing',
    title: 'Testing / Coverage',
    prepare: async (session, context) => {
      await session.helper('tests', {
        testFile: context.file(SPEC),
        sourceFile: context.file(SERVICE),
        cases: TEST_CASES,
        coverage: true,
        covered: linesBetween('async promote', 'return this.repository.save(updated);'),
        uncovered: linesBetween('async promoteAll', '    return promoted;'),
      });
      await session.command('workbench.view.testing.focus');
      await openService(session, context, 'async promote', 2);
      await sleep(1500);
      await session.command('testing.coverageToggleToolbar').catch((): void => undefined);
      await sleep(800);
    },
  },
  {
    name: 'notebook',
    title: 'Notebook',
    prepare: async (session, context) => {
      await session.helper('openNotebook', { file: context.file('analysis.ipynb') });
      await sleep(2500);
    },
  },
  {
    name: 'welcome',
    title: 'Welcome / Walkthrough',
    prepare: async (session) => {
      // The walkthrough rather than the start page, whose Recent list is read from the machine, not the profile.
      await session.command('workbench.action.openWalkthrough', 'Setup');
      await sleep(2500);
    },
  },
  {
    name: 'minimap',
    title: 'Minimap and Overview Ruler',
    prepare: async (session, context) => {
      await session.helper('diagnostics', { file: context.file(SERVICE), items: DIAGNOSTICS });
      await openService(session, context, 'async promoteAll', 4);
      await session.command('editor.actions.findWithArgs', { searchString: 'promote' });
      await sleep(1200);
    },
    // The find widget outlives the editor it was opened in, and would show in every surface after this one.
    cleanup: async (session) => void (await session.command('closeFindWidget')),
  },
  {
    name: 'comments',
    title: 'Comments (code review)',
    prepare: async (session, context) => {
      await session.helper('comments', { file: context.file(SERVICE) });
      await openService(session, context, 'export class MemberService', 2);
      await sleep(1500);
    },
  },
];

/*
 * Back to the same window before every surface: the helper closes what the API can
 * reach, and the secondary side bar — which the chat opens and the close command
 * does not shut in 1.140 — is toggled shut if the window still shows it.
 */
export const resetWindow = async (session: Session): Promise<void> => {
  await session.command('workbench.action.restoreAuxiliaryBar').catch((): undefined => undefined);
  await session.helper('reset');
  const auxiliaryBarOpen: boolean = await session.page.evaluate((): boolean => {
    const part: HTMLElement | null = document.querySelector('.part.auxiliarybar');
    return Boolean(part && part.offsetWidth > 0 && getComputedStyle(part).display !== 'none');
  });
  if (auxiliaryBarOpen) await session.command('workbench.action.toggleAuxiliaryBar');
  /*
   * The side bar remembers what the last surface opened in it — a folder
   * expanded, the Outline pane open — and would show it in the next one, so a
   * shot would depend on which surfaces ran before it. Every surface starts
   * from the folders collapsed and the Explorer's other panes closed.
   */
  await session.command('workbench.files.action.collapseExplorerFolders');
  await session.page.evaluate((): void => {
    for (const header of Array.from(document.querySelectorAll<HTMLElement>('.sidebar .pane-header[aria-expanded="true"]'))) {
      const title: string = header.querySelector('.title')?.textContent?.trim().toLowerCase() ?? '';
      if (title === 'outline' || title === 'timeline') header.click();
    }
  });
  await sleep(300);
};

/** The settings every corpus window starts with: the same window, every run, nothing that animates or pops up. */
export const CORPUS_SETTINGS: Record<string, unknown> = {
  'workbench.colorTheme': 'Midnight Indigo',
  'workbench.iconTheme': 'midnight-indigo-icons',
  'workbench.startupEditor': 'none',
  'workbench.tips.enabled': false,
  'workbench.enableExperiments': false,
  'workbench.secondarySideBar.defaultVisibility': 'hidden',
  'workbench.editor.empty.hint': 'hidden',
  'workbench.hover.delay': 60000,
  'window.dialogStyle': 'custom',
  'window.restoreWindows': 'none',
  'window.zoomLevel': 0,
  'editor.cursorBlinking': 'solid',
  'editor.hover.delay': 60000,
  'editor.inlayHints.enabled': 'on',
  'editor.stickyScroll.enabled': true,
  'editor.minimap.enabled': true,
  // Always shown: a slider that fades after a scroll is in some shots and not others.
  'editor.scrollbar.vertical': 'visible',
  'editor.scrollbar.horizontal': 'visible',
  'typescript.inlayHints.parameterNames.enabled': 'all',
  'typescript.inlayHints.variableTypes.enabled': true,
  'typescript.inlayHints.functionLikeReturnTypes.enabled': true,
  'typescript.inlayHints.propertyDeclarationTypes.enabled': true,
  // The corpus samples import packages the workspace does not have; the diagnostics surfaces use the helper's own.
  'typescript.validate.enable': false,
  'javascript.validate.enable': false,
  'git.openRepositoryInParentFolders': 'always',
  'git.autofetch': false,
  // Blame says "30 seconds ago", which is a different picture every run.
  'git.blame.statusBarItem.enabled': false,
  'git.blame.editorDecoration.enabled': false,
  'extensions.ignoreRecommendations': true,
  'extensions.autoCheckUpdates': false,
  'update.mode': 'none',
  'telemetry.telemetryLevel': 'off',
  'security.workspace.trust.enabled': false,
  'terminal.integrated.enablePersistentSessions': false,
  'inlineChat.askInChat': false,
  'explorer.autoReveal': false,
  'editor.find.seedSearchStringFromSelection': 'never',
};

/** The path of a file in the corpus workspace. */
export const fileIn = (workspace: string): ((relativePath: string) => string) => (relativePath: string): string => path.join(workspace, relativePath);
