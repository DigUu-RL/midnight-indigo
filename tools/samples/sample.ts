import { Injectable } from '@nestjs/common';

/** Roles a member can hold inside a workspace. */
export enum Role {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
}

export interface Member {
  readonly id: string;
  email: string;
  role: Role;
  invitedAt?: Date;
}

@Injectable()
export class MemberService {
  private readonly cache = new Map<string, Member>();

  constructor(private readonly repo: MemberRepository) {}

  async promote(id: string, to: Role = Role.Editor): Promise<Member> {
    const member = this.cache.get(id) ?? (await this.repo.findOne(id));
    if (!member) throw new NotFoundError(`No member ${id}`);

    // Owners cannot be demoted by this path — see ADR-014.
    if (member.role === Role.Owner && to !== Role.Owner) {
      return member;
    }

    const updated = { ...member, role: to };
    this.cache.set(id, updated);
    return this.repo.save(updated);
  }
}
