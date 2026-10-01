/*
 * The regression helper: loaded by `npm run regression` beside the theme, into
 * a throwaway profile, and nowhere else (tools/** is not packaged).
 *
 * Two jobs. It is the BRIDGE the harness drives VS Code through — an HTTP
 * endpoint on 127.0.0.1 that runs any command, built-in or its own, and says
 * when it is done — because a command run from here has finished when its
 * promise settles, where a keystroke sent through the window has only been
 * delivered. And it is the DATA the corpus surfaces need to show anything at
 * all: diagnostics, a test run with coverage, comment threads, notifications,
 * a log, a quick pick, a debug session, a chat participant and a model for it
 * to run on — each written so that every run shows the same thing.
 *
 * Plain JavaScript, so the repository's type check (tools/**\/*.ts) does not
 * need the VS Code API's types.
 */

const vscode = require('vscode');
const http = require('node:http');

const PORT = Number(process.env.MIDNIGHT_REGRESSION_PORT || 0);

/** A command's result, if it survives JSON; commands return editors, URIs and other things that do not. */
const serializable = (value) => {
  try {
    return value === undefined ? null : JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

const fileUri = (filePath) => vscode.Uri.file(filePath);

const range = ([startLine, startCharacter, endLine, endCharacter]) =>
  new vscode.Range(startLine, startCharacter, endLine ?? startLine, endCharacter ?? startCharacter);

/* ---------------- the commands the harness calls ---------------- */

const diagnosticCollection = vscode.languages.createDiagnosticCollection('midnight-regression');
const disposables = [];
const disposeAll = () => {
  while (disposables.length) disposables.pop().dispose();
};

const commands = {
  ping: () => ({ version: vscode.version, theme: vscode.workspace.getConfiguration('workbench').get('colorTheme') }),

  /*
   * The theme is set through the configuration. The API says only which KIND of
   * theme is active, not which one, so the harness confirms it by reading the
   * colour the window actually paints.
   */
  setTheme: async (label) => {
    await vscode.workspace.getConfiguration('workbench').update('colorTheme', label, vscode.ConfigurationTarget.Global);
    return vscode.workspace.getConfiguration('workbench').get('colorTheme');
  },

  configure: async ({ section, key, value }) => {
    await vscode.workspace.getConfiguration(section).update(key, value, vscode.ConfigurationTarget.Global);
    return true;
  },

  reset: async () => {
    disposeAll();
    diagnosticCollection.clear();
    if (vscode.debug.activeDebugSession) await vscode.debug.stopDebugging();
    for (const terminal of vscode.window.terminals) terminal.dispose();
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await vscode.commands.executeCommand('notifications.clearAll');
    await vscode.commands.executeCommand('workbench.action.closePanel');
    await vscode.commands.executeCommand('workbench.action.closeAuxiliaryBar');
    await vscode.commands.executeCommand('workbench.view.explorer');
    // What a surface leaves behind that closing its editors does not take away.
    for (const leftover of ['closeFindWidget', 'testing.coverage.close', 'testing.clearTestResults', 'workbench.action.chat.setAgentSessionsOrientationStacked']) {
      await vscode.commands.executeCommand(leftover).then(undefined, () => undefined);
    }
    return true;
  },

  open: async ({ file, selection, reveal, viewColumn, preserveFocus }) => {
    const document = await vscode.workspace.openTextDocument(fileUri(file));
    const editor = await vscode.window.showTextDocument(document, {
      preview: false,
      viewColumn: viewColumn ?? vscode.ViewColumn.One,
      preserveFocus: preserveFocus ?? false,
      selection: selection ? range(selection) : undefined,
    });
    if (reveal !== undefined) editor.revealRange(range([reveal, 0]), vscode.TextEditorRevealType.AtTop);
    return document.languageId;
  },

  /* Each item: { severity: 'error' | 'warning' | 'information' | 'hint', at: [line, character, line, character], message, code, tags } */
  openNotebook: async ({ file }) => {
    const notebook = await vscode.workspace.openNotebookDocument(fileUri(file));
    await vscode.window.showNotebookDocument(notebook, { preview: false });
    return notebook.cellCount;
  },

  diagnostics: ({ file, items }) => {
    const severities = {
      error: vscode.DiagnosticSeverity.Error,
      warning: vscode.DiagnosticSeverity.Warning,
      information: vscode.DiagnosticSeverity.Information,
      hint: vscode.DiagnosticSeverity.Hint,
    };
    const tagsByName = { unnecessary: vscode.DiagnosticTag.Unnecessary, deprecated: vscode.DiagnosticTag.Deprecated };
    diagnosticCollection.set(
      fileUri(file),
      items.map(({ severity, at, message, code, tags }) => {
        const diagnostic = new vscode.Diagnostic(range(at), message, severities[severity]);
        diagnostic.source = 'regression';
        diagnostic.code = code;
        if (tags) diagnostic.tags = tags.map((tagName) => tagsByName[tagName]);
        return diagnostic;
      })
    );
    return true;
  },

  notifications: async () => {
    vscode.window.showInformationMessage('Midnight Indigo: the corpus finished rendering.', 'Open Report', 'Dismiss');
    vscode.window.showWarningMessage('3 surfaces changed since the last reviewed run.', 'Review');
    vscode.window.showErrorMessage('The baseline theme could not be read.', 'Retry');
    vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Rendering the corpus', cancellable: true },
      (progress) => {
        progress.report({ increment: 40, message: 'workbench 10 of 25' });
        return new Promise((resolve) => disposables.push({ dispose: resolve }));
      }
    );
    return true;
  },

  output: () => {
    // A log channel stamps each line with the time, which is a different picture every run; the same lines
    // in the log language, with one fixed time, are coloured by level the same way.
    const channel = vscode.window.createOutputChannel('Midnight Regression', 'log');
    disposables.push(channel);
    for (const [level, message] of [
      ['trace', 'resolving the corpus workspace'],
      ['debug', 'profile is isolated; extensions dir is empty'],
      ['info', 'theme loaded from the working tree'],
      ['info', '25 workbench surfaces, 19 languages, 9 variants'],
      ['warning', 'Agents window needs a sign-in; its modal is hidden for the shot'],
      ['error', 'baseline: 1 surface differs from the reviewed run'],
    ]) {
      channel.appendLine(`2026-01-01 09:00:00.000 [${level}] ${message}`);
    }
    channel.show(true);
    return true;
  },

  quickPick: () => {
    const quickPick = vscode.window.createQuickPick();
    disposables.push(quickPick);
    quickPick.title = 'Promote a member';
    quickPick.placeholder = 'Pick the role to promote to';
    quickPick.matchOnDescription = true;
    quickPick.items = [
      { label: 'Owners', kind: vscode.QuickPickItemKind.Separator },
      { label: '$(shield) Owner', description: 'full control', detail: 'Can delete the workspace and change billing.' },
      { label: 'Members', kind: vscode.QuickPickItemKind.Separator },
      { label: '$(person) Admin', description: 'manage members', detail: 'Can invite, promote and remove members.', picked: true },
      { label: '$(account) Member', description: 'default', detail: 'Can read and write.' },
      { label: '$(eye) Viewer', description: 'read only' },
    ];
    quickPick.activeItems = [quickPick.items[3]];
    quickPick.buttons = [vscode.QuickInputButtons.Back];
    quickPick.show();
    return true;
  },

  /*
   * A finished run over the cases the harness names — { id, label, line, outcome } — and,
   * with coverage, the source file's statements: `covered` and `uncovered` are line numbers.
   */
  tests: async ({ testFile, sourceFile, cases, coverage, covered, uncovered }) => {
    const testUri = fileUri(testFile);
    const controller = vscode.tests.createTestController('midnight-regression', 'Member service');
    disposables.push(controller);
    const suite = controller.createTestItem('suite', 'MemberService', testUri);
    suite.range = range([0, 0]);
    const items = cases.map(({ id, label, line }) => {
      const item = controller.createTestItem(id, label, testUri);
      item.range = range([line, 0]);
      suite.children.add(item);
      return item;
    });
    controller.items.add(suite);

    const coverageProfile = controller.createRunProfile('Coverage', vscode.TestRunProfileKind.Coverage, () => undefined, true);
    coverageProfile.loadDetailedCoverage = async () => [
      ...covered.map((line) => new vscode.StatementCoverage(3, new vscode.Position(line, 0))),
      ...uncovered.map((line) => new vscode.StatementCoverage(0, new vscode.Position(line, 0))),
    ];
    controller.createRunProfile('Run', vscode.TestRunProfileKind.Run, () => undefined, true);

    const run = controller.createTestRun(new vscode.TestRunRequest(undefined, undefined, coverage ? coverageProfile : undefined), 'Corpus run', false);
    run.started(suite);
    cases.forEach(({ outcome, message, line }, index) => {
      const item = items[index];
      run.started(item);
      if (outcome === 'passed') run.passed(item, 10 + index);
      else if (outcome === 'skipped') run.skipped(item);
      else {
        const testMessage = new vscode.TestMessage(message);
        testMessage.location = new vscode.Location(testUri, range([line, 4]));
        if (outcome === 'failed') run.failed(item, testMessage, 30 + index);
        else run.errored(item, testMessage, 4);
      }
    });
    run.appendOutput('MemberService\r\n  \x1b[32m✓\x1b[0m promotes a member to admin\r\n  \x1b[31m✗\x1b[0m keeps an owner an owner\r\n');
    if (coverage) {
      const statements = new vscode.TestCoverageCount(covered.length, covered.length + uncovered.length);
      run.addCoverage(new vscode.FileCoverage(fileUri(sourceFile), statements));
    }
    run.end();
    return true;
  },

  comments: ({ file }) => {
    const uri = fileUri(file);
    const controller = vscode.comments.createCommentController('midnight-regression', 'Code review');
    disposables.push(controller);
    controller.commentingRangeProvider = { provideCommentingRanges: (document) => [new vscode.Range(0, 0, document.lineCount - 1, 0)] };
    const comment = (author, body) => ({ author: { name: author }, body: new vscode.MarkdownString(body), mode: vscode.CommentMode.Preview });
    const open = controller.createCommentThread(uri, range([8, 0, 10, 0]), [
      comment('Ada', 'Should an **owner** be able to demote themselves here? The early `return` hides that.'),
      comment('Grace', 'Intentional — see ADR-014. A demotion goes through the ownership transfer.'),
    ]);
    open.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
    open.canReply = true;
    open.label = 'Discussion';
    const resolved = controller.createCommentThread(uri, range([3, 0]), [comment('Linus', 'Nit: `repository` could be `readonly`.')]);
    resolved.state = vscode.CommentThreadState.Resolved;
    resolved.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
    disposables.push(open, resolved);
    return true;
  },

  debug: async ({ folder, program }) => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.find((candidate) => candidate.uri.fsPath === folder) ?? vscode.workspace.workspaceFolders?.[0];
    const stopped = new Promise((resolve) => {
      const listener = vscode.debug.onDidChangeActiveStackItem((item) => {
        if (item) {
          listener.dispose();
          resolve(true);
        }
      });
    });
    await vscode.debug.startDebugging(workspaceFolder, {
      type: 'node',
      request: 'launch',
      name: 'Promote a member',
      program,
      skipFiles: ['<node_internals>/**'],
      console: 'internalConsole',
    });
    await Promise.race([stopped, new Promise((resolve) => setTimeout(resolve, 15000))]);
    return Boolean(vscode.debug.activeStackItem);
  },

  diff: async ({ left, right, title }) => {
    await vscode.commands.executeCommand('vscode.diff', fileUri(left), fileUri(right), title, { preview: false });
    return true;
  },

  gitChange: async ({ file }) => {
    await vscode.commands.executeCommand('git.openChange', fileUri(file));
    return true;
  },

  /* The command waits for the shell to draw its prompt, which would otherwise be drawn over the first lines it prints. */
  terminal: async ({ cwd, command, name }) => {
    const terminal = vscode.window.createTerminal({ name: name ?? 'corpus', cwd });
    terminal.show(false);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    if (command) terminal.sendText(command, true);
    return true;
  },

  revealInExplorer: async ({ file }) => {
    await vscode.commands.executeCommand('revealInExplorer', fileUri(file));
    return true;
  },
};

/* ---------------- chat: a participant, and a model for it to run on ---------------- */

const ANSWER = [
  '### Promoting a member',
  '',
  '`promote` reads the cache first and falls back to the repository. An **owner** is never demoted through this path:',
  '',
  '```ts',
  "if (member.role === 'owner' && to !== 'owner') {",
  '  return member; // see ADR-014',
  '}',
  '```',
  '',
  '1. Look the member up.',
  '2. Refuse to demote an owner.',
  '3. Save, and write the audit entry.',
  '',
  '> The audit entry is written after the save, so a failed save leaves no trace.',
].join('\n');

const registerChat = (context) => {
  try {
    const participant = vscode.chat.createChatParticipant('midnight-indigo.regression', async (request, chatContext, stream) => {
      stream.progress('Reading member.service.ts');
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (folder) stream.reference(vscode.Uri.joinPath(folder.uri, 'src', 'member.service.ts'));
      stream.markdown(ANSWER);
      stream.button({ command: 'workbench.action.files.save', title: 'Apply' });
      return { metadata: {} };
    });
    participant.iconPath = new vscode.ThemeIcon('sparkle');
    context.subscriptions.push(participant);
  } catch (error) {
    console.error('[regression] chat participant:', error);
  }
  try {
    const model = {
      id: 'regression',
      name: 'Regression',
      family: 'regression',
      version: '1',
      maxInputTokens: 100000,
      maxOutputTokens: 4000,
      capabilities: {},
      isDefault: true,
      isUserSelectable: true,
    };
    context.subscriptions.push(
      vscode.lm.registerLanguageModelChatProvider('midnight-regression', {
        provideLanguageModelChatInformation: async () => [model],
        provideLanguageModelChatResponse: async (chosen, messages, options, progress) => {
          progress.report(new vscode.LanguageModelTextPart(ANSWER));
        },
        provideTokenCount: async () => 1,
      })
    );
  } catch (error) {
    console.error('[regression] language model provider:', error);
  }
};

/* ---------------- the bridge ---------------- */

const activate = (context) => {
  for (const [name, handler] of Object.entries(commands)) {
    context.subscriptions.push(vscode.commands.registerCommand(`midnightRegression.${name}`, handler));
  }
  registerChat(context);
  if (!PORT) return;

  const server = http.createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', async () => {
      const reply = (status, payload) => {
        response.writeHead(status, { 'content-type': 'application/json' });
        response.end(JSON.stringify(payload));
      };
      try {
        const { command, args = [] } = JSON.parse(body || '{}');
        const result = await vscode.commands.executeCommand(command, ...args);
        reply(200, { result: serializable(result) });
      } catch (error) {
        reply(500, { error: String(error && error.stack ? error.stack : error) });
      }
    });
  });
  server.listen(PORT, '127.0.0.1');
  context.subscriptions.push({ dispose: () => server.close() });
};

const deactivate = () => disposeAll();

module.exports = { activate, deactivate };
