export type Role = 'owner' | 'editor' | 'viewer';

export const Roles = { owner: 'owner', editor: 'editor', viewer: 'viewer' } as const;

export interface Member {
  readonly id: string;
  role: Role;
}
