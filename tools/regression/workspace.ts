/*
 * The workspace the VS Code corpus is shot in, built from nothing on every run
 * so that every run shows the same thing:
 *
 *   src/          a small TypeScript service — the editor surfaces (IntelliSense,
 *                 inlay hints, sticky scroll, outline, breadcrumbs, the minimap)
 *                 are all shot on member.service.ts, which TypeScript's own
 *                 language service reads, so its semantic tokens are real
 *   corpus/       one file per language of the code corpus, copied from
 *                 tools/syntax/samples/
 *   debug/        a program that stops on a `debugger` statement
 *   analysis.ipynb  a notebook with a markdown cell, code cells and outputs
 *
 * and a Git repository with one of each state the Source Control view draws:
 * a modified file, a staged one, an untracked one and a deleted one.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES: string = path.join(HERE, '..', 'syntax', 'samples');

/** The code corpus: the language the roadmap names, and the sample that stands for it. */
export const CODE_CORPUS: { language: string; file: string }[] = [
  { language: 'TypeScript', file: 'sample.ts' },
  { language: 'TSX', file: 'sample.tsx' },
  { language: 'JavaScript', file: 'sample.js' },
  { language: 'C#', file: 'sample.cs' },
  { language: 'Python', file: 'sample.py' },
  { language: 'Rust', file: 'sample.rs' },
  { language: 'Go', file: 'sample.go' },
  { language: 'Java', file: 'sample.java' },
  { language: 'Kotlin', file: 'sample.kt' },
  { language: 'PHP', file: 'sample.php' },
  { language: 'PowerShell', file: 'sample.ps1' },
  { language: 'JSON', file: 'sample.json' },
  { language: 'YAML', file: 'sample.yaml' },
  { language: 'Markdown', file: 'sample.md' },
  { language: 'HTML', file: 'sample.html' },
  { language: 'CSS', file: 'sample.css' },
  { language: 'SCSS', file: 'sample.scss' },
  { language: 'SQL', file: 'sample.sql' },
  { language: 'Shell', file: 'sample.sh' },
];

const ROLES_TS: string = `export enum Role {
  Viewer = 'viewer',
  Member = 'member',
  Admin = 'admin',
  Owner = 'owner',
}

export interface Member {
  readonly id: string;
  readonly email: string;
  role: Role;
}
`;

const AUDIT_LOG_TS: string = `import type { Role } from './roles';

export class AuditLog {
  private readonly entries: string[] = [];

  async record(memberId: string, from: Role, to: Role): Promise<void> {
    this.entries.push(\`\${new Date().toISOString()} \${memberId} \${from} -> \${to}\`);
  }
}
`;

/*
 * The file every editor surface is shot on. promoteAll nests four blocks deep
 * so the sticky scroll has a stack to show; the calls take several arguments
 * so the inlay hints have names to draw.
 */
export const SERVICE_TS: string = `import { Role, type Member } from './roles';
import { AuditLog } from './audit-log';

export interface MemberRepository {
  findById(id: string): Promise<Member | undefined>;
  save(member: Member): Promise<Member>;
}

/** Promotes and demotes members, and keeps an audit of both. */
export class MemberService {
  private readonly cache = new Map<string, Member>();
  private static readonly PAGE_SIZE = 50;

  constructor(
    private readonly repository: MemberRepository,
    private readonly audit: AuditLog,
  ) {}

  async promote(id: string, to: Role): Promise<Member> {
    const member = this.cache.get(id) ?? (await this.repository.findById(id));
    if (!member) {
      throw new Error(\`No member \${id}\`);
    }

    // Owners cannot be demoted through this path — see ADR-014.
    if (member.role === Role.Owner && to !== Role.Owner) {
      return member;
    }

    const updated: Member = { ...member, role: to };
    this.cache.set(id, updated);
    await this.audit.record(id, member.role, to);
    return this.repository.save(updated);
  }

  async promoteAll(ids: readonly string[], to: Role): Promise<Member[]> {
    const promoted: Member[] = [];
    for (const id of ids) {
      if (this.cache.has(id)) {
        const cached = this.cache.get(id);
        if (cached && cached.role !== to) {
          while (promoted.length < MemberService.PAGE_SIZE) {
            promoted.push(await this.promote(id, to));
            break;
          }
        }
      } else {
        promoted.push(await this.promote(id, to));
      }
    }
    return promoted;
  }

  /** @deprecated Use {@link promote} with Role.Admin. */
  async makeAdmin(id: string): Promise<Member> {
    return this.promote(id, Role.Admin);
  }

  forget(id: string): boolean {
    return this.cache.delete(id);
  }
}
`;

/* What the committed version of member.service.ts said, so the working tree has a modification to show. */
const SERVICE_TS_COMMITTED: string = SERVICE_TS.replace('    await this.audit.record(id, member.role, to);\n', '').replace(
  "  /** @deprecated Use {@link promote} with Role.Admin. */\n  async makeAdmin(id: string): Promise<Member> {\n    return this.promote(id, Role.Admin);\n  }\n\n",
  "  async makeAdmin(id: string): Promise<Member> {\n    const member = await this.repository.findById(id);\n    return this.promote(id, member ? Role.Admin : Role.Member);\n  }\n\n"
);

export const SPEC_TS: string = `import { MemberService } from './member.service';

describe('MemberService', () => {
  it('promotes a member to admin', async () => {
    expect(await service.promote('ada', Role.Admin)).toMatchObject({ role: 'admin' });
  });

  it('keeps an owner an owner', async () => {
    expect(await service.promote('grace', Role.Member)).toMatchObject({ role: 'owner' });
  });

  it('throws for a missing member', async () => {
    await expect(service.promote('nobody', Role.Admin)).rejects.toThrow();
  });

  it('serves a cached member', async () => {
    expect(service.forget('ada')).toBe(true);
  });

  it('writes an audit entry', async () => {
    expect(audit.entries).toHaveLength(1);
  });
});
`;

const DEBUG_JS: string = `const members = [
  { id: 'ada', role: 'admin', joined: new Date(2021, 4, 2) },
  { id: 'grace', role: 'owner', joined: new Date(2019, 0, 14) },
];

function promote(member, to) {
  const before = member.role;
  const allowed = !(before === 'owner' && to !== 'owner');
  debugger;
  return allowed ? { ...member, role: to } : member;
}

for (const member of members) {
  console.log(promote(member, 'member'));
}
`;

/* What a build prints, then the sixteen ANSI colours by name, normal and bright. */
const TERMINAL_JS: string = String.raw`const escape = (code, text) => '\x1b[' + code + 'm' + text + '\x1b[0m';
console.log(escape('1', 'corpus') + ' build ' + escape('2', '(dimmed: 14 files cached)'));
console.log(escape('32', '✓') + ' src/roles.ts ' + escape('90', '12 ms'));
console.log(escape('33', '⚠') + ' src/member.service.ts: ' + escape('33', "'cached' is declared but never read"));
console.log(escape('31', '✗') + ' src/audit-log.ts: ' + escape('31;1', 'error TS2322') + ' Type string is not assignable to Role');
console.log(escape('36', 'info') + ' see ' + escape('4;34', 'https://example.invalid/adr/014'));
console.log('');
const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
console.log(names.map((name, index) => escape(String(30 + index), name.padEnd(8))).join(''));
console.log(names.map((name, index) => escape(String(90 + index), name.padEnd(8))).join(''));
console.log(names.map((name, index) => escape(String(40 + index), ' '.repeat(8))).join(''));
console.log(names.map((name, index) => escape(String(100 + index), ' '.repeat(8))).join(''));
console.log(escape('1', 'bold') + ' ' + escape('3', 'italic') + ' ' + escape('4', 'underline') + ' ' + escape('9', 'struck') + ' ' + escape('7', 'inverse'));
`;

const NOTEBOOK: object = {
  cells: [
    {
      cell_type: 'markdown',
      metadata: {},
      source: ['# Promotions by role\n', '\n', 'How many members each role **gained** last quarter, and the `owner` count, which never moves.'],
    },
    {
      cell_type: 'code',
      execution_count: 1,
      metadata: {},
      outputs: [{ name: 'stdout', output_type: 'stream', text: ['viewer   12\n', 'member   31\n', 'admin     4\n', 'owner     1\n'] }],
      source: ['promotions = {"viewer": 12, "member": 31, "admin": 4, "owner": 1}\n', 'for role, count in promotions.items():\n', '    print(f"{role:<8}{count:>3}")'],
    },
    {
      cell_type: 'code',
      execution_count: 2,
      metadata: {},
      outputs: [{ data: { 'text/plain': ['48'] }, execution_count: 2, metadata: {}, output_type: 'execute_result' }],
      source: ['sum(promotions.values())'],
    },
  ],
  metadata: { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }, language_info: { name: 'python' } },
  nbformat: 4,
  nbformat_minor: 5,
};

const write = (root: string, relativePath: string, content: string): void => {
  const file: string = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};

const git = (root: string, ...args: string[]): void => {
  execFileSync('git', ['-c', 'user.name=Regression', '-c', 'user.email=regression@example.invalid', '-c', 'init.defaultBranch=main', '-c', 'core.autocrlf=false', ...args], {
    cwd: root,
    stdio: 'ignore',
  });
};

/** Builds the workspace at `root`, replacing whatever was there. */
export const buildWorkspace = (root: string): void => {
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });

  write(root, 'src/roles.ts', ROLES_TS);
  write(root, 'src/audit-log.ts', AUDIT_LOG_TS);
  write(root, 'src/member.service.ts', SERVICE_TS_COMMITTED);
  write(root, 'src/member.service.spec.ts', SPEC_TS);
  write(root, 'debug/promote.js', DEBUG_JS);
  write(root, 'debug/colors.js', TERMINAL_JS);
  write(root, 'analysis.ipynb', JSON.stringify(NOTEBOOK, null, 1) + '\n');
  write(root, 'tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', strict: true, moduleResolution: 'bundler' }, include: ['src'] }, null, 2) + '\n');
  write(root, 'package.json', JSON.stringify({ name: 'corpus-workspace', private: true, version: '1.0.0' }, null, 2) + '\n');
  write(root, 'README.md', '# Corpus workspace\n\nBuilt by `npm run regression`. Every run replaces it.\n');
  write(root, 'CHANGELOG.md', '# Changelog\n\n## 1.0.0\n\n- First release.\n');
  for (const { file } of CODE_CORPUS) write(root, path.join('corpus', file), fs.readFileSync(path.join(SAMPLES, file), 'utf8'));

  git(root, 'init', '--quiet');
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '-m', 'The corpus workspace');

  // One of each state: modified, staged, untracked, deleted.
  write(root, 'src/member.service.ts', SERVICE_TS);
  write(root, 'src/roles.ts', ROLES_TS.replace("  Owner = 'owner',\n", "  Owner = 'owner',\n  Guest = 'guest',\n"));
  git(root, 'add', 'src/roles.ts');
  write(root, 'src/invitations.ts', "export const INVITATION_TTL_DAYS = 14;\n");
  fs.rmSync(path.join(root, 'CHANGELOG.md'));
};

/** Where `text` starts in `content`, as a zero-based [line, character]; the nth occurrence, counting from 1. */
export const positionOf = (content: string, text: string, occurrence: number = 1): [number, number] => {
  let index: number = -1;
  for (let count = 0; count < occurrence; count++) {
    index = content.indexOf(text, index + 1);
    if (index < 0) throw new Error(`"${text}" (#${occurrence}) is not in the file`);
  }
  const before: string[] = content.slice(0, index).split('\n');
  return [before.length - 1, before[before.length - 1].length];
};

/** The range `text` covers in `content`, as [line, character, line, character]. */
export const rangeOf = (content: string, text: string, occurrence: number = 1): [number, number, number, number] => {
  const [line, character]: [number, number] = positionOf(content, text, occurrence);
  return [line, character, line, character + text.length];
};
