package com.workspace.members;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public final class MemberService implements MemberOperations {

    private static final Map<String, Member> CACHE = new ConcurrentHashMap<>();

    private final MemberRepository repository;

    public MemberService(MemberRepository repository) {
        this.repository = repository;
    }

    @Override
    public Member promote(String id, Role to) {
        Member member = Optional.ofNullable(CACHE.get(id))
                .or(() -> repository.findById(id))
                .orElseThrow(() -> new IllegalArgumentException("No member " + id));

        // Owners cannot be demoted through this path — see ADR-014.
        if (member.role() == Role.OWNER && to != Role.OWNER) {
            return member;
        }

        var updated = new Member(member.id(), member.email(), to);
        CACHE.put(id, updated);
        return repository.save(updated);
    }
}
