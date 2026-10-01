package com.workspace.members

import java.util.concurrent.ConcurrentHashMap

enum class Role { MEMBER, ADMIN, OWNER }

data class Member(val id: String, val email: String, val role: Role = Role.MEMBER)

interface MemberRepository {
    suspend fun findById(id: String): Member?
    suspend fun save(member: Member): Member
}

class MemberService(private val repository: MemberRepository) {

    private val cache = ConcurrentHashMap<String, Member>()

    suspend fun promote(id: String, to: Role): Member {
        val member = cache[id] ?: repository.findById(id)
            ?: throw IllegalArgumentException("No member $id")

        // Owners cannot be demoted through this path — see ADR-014.
        if (member.role == Role.OWNER && to != Role.OWNER) return member

        val updated = member.copy(role = to)
        cache[id] = updated
        return repository.save(updated)
    }

    fun <T : Comparable<T>> highest(items: List<T>): T? = items.maxOrNull()

    companion object {
        const val PAGE_SIZE: Int = 50
    }
}
