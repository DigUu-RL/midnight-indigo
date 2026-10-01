/*
 * Real VS Code, driven for screenshots.
 *
 * The installed Code.exe is started with a throwaway profile, an empty
 * extensions folder (or the user's own extensions take over the side bar), the
 * theme loaded from this working tree with --extensionDevelopmentPath, and the
 * regression helper beside it. Two channels drive it:
 *
 *   the helper's HTTP bridge, which runs a command in the extension host and
 *   answers when it has finished — for everything a command can do;
 *
 *   the Chrome DevTools Protocol, through playwright-core, for what only the
 *   window can do: keystrokes, the DOM, and the screenshot itself.
 *
 * What each of these works around was found the hard way, in earlier reviews:
 *
 *   - A process started from inside VS Code inherits ELECTRON_RUN_AS_NODE and
 *     VSCODE_*; with them Code.exe runs as plain Node and exits. They are
 *     stripped.
 *   - `workbench.colorTheme` in a fresh profile's settings.json is ignored on
 *     the first start. The theme is set through the configuration API once the
 *     window is up, and confirmed by reading the editor background back out of
 *     the DOM.
 *   - A fresh profile opens a welcome overlay that swallows clicks; it is
 *     dismissed and hidden.
 *   - `page.screenshot({ clip })` drops :hover in Electron, and the window size
 *     can differ between launches — shots are of the whole window, and their
 *     size is recorded with them.
 *   - Closing the CDP connection does not quit VS Code. Every process whose
 *     command line names this run's profile is killed at the end.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright-core';

export type Session = {
  page: Page;
  /** Runs a command in the extension host and resolves with its (JSON-safe) result once it has finished. */
  command: (command: string, ...args: unknown[]) => Promise<unknown>;
  /** Runs one of the helper's own commands. */
  helper: (name: string, argument?: unknown) => Promise<unknown>;
  /** Sets the colour theme and waits until the window paints it. */
  setTheme: (label: string, editorBackground: string) => Promise<void>;
  screenshot: (file: string) => Promise<void>;
  close: () => Promise<void>;
};

export type LaunchOptions = {
  repository: string;
  helper: string;
  workspace: string;
  profile: string;
  extensions: string;
  settings: Record<string, unknown>;
};

const DEBUGGING_PORT: number = 9333;
const BRIDGE_PORT: number = 9334;
const VIEWPORT: { width: number; height: number } = { width: 1366, height: 768 };

const findCode = (): string => {
  const candidates: string[] = [
    process.env.MIDNIGHT_INDIGO_VSCODE ?? '',
    path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
    path.join(process.env.ProgramFiles ?? '', 'Microsoft VS Code', 'Code.exe'),
    '/usr/share/code/code',
    '/Applications/Visual Studio Code.app/Contents/MacOS/Electron',
  ].filter(Boolean);
  const found: string | undefined = candidates.find((candidate: string): boolean => fs.existsSync(candidate));
  if (!found) throw new Error('VS Code is not installed where this looks for it — set MIDNIGHT_INDIGO_VSCODE to its executable');
  return found;
};

const sleep = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

const retry = async <T>(attempt: () => Promise<T>, timeout: number, what: string): Promise<T> => {
  const started: number = Date.now();
  let lastError: unknown;
  while (Date.now() - started < timeout) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      await sleep(250);
    }
  }
  throw new Error(`${what} did not come up in ${timeout / 1000} s: ${String(lastError)}`);
};

/** Kills every process whose command line names `marker` — the run's own profile folder, and nothing else. */
export const killProcessesNaming = (marker: string): void => {
  if (process.platform !== 'win32') {
    try {
      execFileSync('pkill', ['-f', marker], { stdio: 'ignore' });
    } catch {
      // Nothing was running.
    }
    return;
  }
  const escaped: string = marker.replace(/'/g, "''");
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      // Not this PowerShell itself, whose own command line names the marker too.
      `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -and $_.CommandLine.Contains('${escaped}') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`,
    ],
    { stdio: 'ignore' }
  );
};

export const launchVsCode = async (options: LaunchOptions): Promise<Session> => {
  killProcessesNaming(options.profile);
  fs.rmSync(options.profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  fs.mkdirSync(path.join(options.profile, 'User'), { recursive: true });
  fs.mkdirSync(options.extensions, { recursive: true });
  fs.writeFileSync(path.join(options.profile, 'User', 'settings.json'), JSON.stringify(options.settings, null, 2), 'utf8');

  const environment: NodeJS.ProcessEnv = Object.fromEntries(
    Object.entries(process.env).filter(([name]): boolean => name !== 'ELECTRON_RUN_AS_NODE' && !name.startsWith('VSCODE_'))
  );
  environment.MIDNIGHT_REGRESSION_PORT = String(BRIDGE_PORT);

  const child: ChildProcess = spawn(
    findCode(),
    [
      `--user-data-dir=${options.profile}`,
      `--extensions-dir=${options.extensions}`,
      `--extensionDevelopmentPath=${options.repository}`,
      `--extensionDevelopmentPath=${options.helper}`,
      `--enable-proposed-api=midnight-indigo.regression-helper`,
      `--remote-debugging-port=${DEBUGGING_PORT}`,
      '--disable-workspace-trust',
      '--skip-welcome',
      '--skip-release-notes',
      '--disable-telemetry',
      '--disable-updates',
      '--new-window',
      options.workspace,
    ],
    { env: environment, stdio: 'ignore', detached: false }
  );
  child.unref();

  const browser: Browser = await retry(() => chromium.connectOverCDP(`http://127.0.0.1:${DEBUGGING_PORT}`), 60000, 'VS Code');
  const page: Page = await retry(
    async (): Promise<Page> => {
      const found: Page | undefined = browser
        .contexts()
        .flatMap((context) => context.pages())
        .find((candidate: Page): boolean => candidate.url().includes('workbench.html'));
      if (!found) throw new Error('no workbench window yet');
      return found;
    },
    60000,
    'The workbench window'
  );
  await page.waitForSelector('.monaco-workbench', { timeout: 60000 });
  // The window opens a pixel or two taller or shorter from one launch to the next; the page is laid out at one size whatever it is.
  await page.setViewportSize(VIEWPORT);
  await sleep(500);

  const command = async (commandId: string, ...args: unknown[]): Promise<unknown> => {
    const response: Response = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/`, {
      method: 'POST',
      body: JSON.stringify({ command: commandId, args }),
    });
    const payload: { result?: unknown; error?: string } = (await response.json()) as { result?: unknown; error?: string };
    if (payload.error) throw new Error(`${commandId}: ${payload.error}`);
    return payload.result;
  };
  const helper = (name: string, argument?: unknown): Promise<unknown> =>
    argument === undefined ? command(`midnightRegression.${name}`) : command(`midnightRegression.${name}`, argument);

  await retry(() => helper('ping'), 90000, 'The regression helper');

  // The first-run overlay, and anything else modal a fresh profile shows.
  await page.addStyleTag({ content: '.onboarding-a-overlay { display: none !important; }' });
  await page.keyboard.press('Escape');

  const setTheme = async (label: string, editorBackground: string): Promise<void> => {
    await helper('setTheme', label);
    const want: string = editorBackground.slice(0, 7).toLowerCase();
    await retry(
      async (): Promise<void> => {
        const painted: string = await page.evaluate((): string =>
          getComputedStyle(document.querySelector('.monaco-workbench') as Element).getPropertyValue('--vscode-editor-background').trim().toLowerCase()
        );
        if (!painted.startsWith(want)) throw new Error(`the window paints ${painted}, not ${want}`);
      },
      10000,
      `The ${label} theme`
    );
    // Let the views repaint: the theme lands as a style sheet, then the canvases (minimap, terminal) redraw.
    await sleep(600);
  };

  const screenshot = async (file: string): Promise<void> => {
    // A window that lost the system's focus draws its title bar inactive — a picture of the wrong state. It is brought back, or the shot fails.
    for (let attempt = 0; await page.evaluate((): boolean => Boolean(document.querySelector('.part.titlebar.inactive'))); attempt++) {
      if (attempt === 5) throw new Error('the window lost the focus and could not get it back — something else was brought to the front');
      await page.bringToFront();
      await sleep(400);
    }
    // A modal dialog stops the window painting, and the shot would wait for it until it timed out.
    const dialog: string | null = await page.evaluate((): string | null => (document.querySelector('.monaco-dialog-box') as HTMLElement | null)?.innerText ?? null);
    if (dialog) {
      await page.keyboard.press('Escape');
      throw new Error(`a dialog is open: ${dialog.replace(/s+/g, ' ').slice(0, 160)}`);
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.mouse.move(1, 1);
    await page.screenshot({ path: file });
  };

  const close = async (): Promise<void> => {
    await browser.close().catch((): void => undefined);
    killProcessesNaming(options.profile);
  };

  return { page, command, helper, setTheme, screenshot, close };
};
