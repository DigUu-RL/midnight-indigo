<?php

declare(strict_types=1);

namespace Workspace\Members;

enum Role: string
{
    case Owner = 'owner';
    case Editor = 'editor';
    case Viewer = 'viewer';
}

final class MemberService
{
    /** @var array<string, Member> */
    private array $cache = [];

    public function __construct(
        private readonly MemberRepository $repository,
    ) {}

    public function promote(string $id, Role $to = Role::Editor): Member
    {
        $member = $this->cache[$id] ?? $this->repository->find($id);

        if ($member === null) {
            throw new MemberNotFound("No member {$id}");
        }

        // Owners cannot be demoted through this path — see ADR-014.
        if ($member->role === Role::Owner && $to !== Role::Owner) {
            return $member;
        }

        return $this->cache[$id] = $this->repository->save($member->withRole($to));
    }
}
