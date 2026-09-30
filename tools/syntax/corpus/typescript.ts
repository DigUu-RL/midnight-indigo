import type { Member } from './members';
import { type Role, Roles } from './members';

export namespace Audit {
  export const LIMIT = 50;
}

type Handler<TEvent extends { name: string }> = (event: TEvent) => void;

function Logged(label: string) {
  return (target: object, key: string): void => {};
}

export class Registry<T extends Member> {
  static readonly shared = new Registry<Member>();
  static create(): Registry<Member> {
    return new Registry();
  }

  readonly entries: Map<string, T> = new Map();
  private handler?: Handler<{ name: string }>;

  @Logged('lookup')
  find(id: string): T | undefined {
    const found = this.entries.get(id)?.role ?? Roles.viewer;
    return found === undefined ? undefined : this.entries.get(`${id}:${found}`);
  }
}
