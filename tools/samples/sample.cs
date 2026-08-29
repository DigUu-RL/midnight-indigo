using System.Collections.Generic;
using System.Threading.Tasks;

namespace Workspace.Members;

public delegate void MemberPromoted(Member member, Role from);

public interface IMemberRepository
{
    Task<Member?> FindAsync(string id);
}

public sealed record Member(string Id, string Email, Role Role);

public enum Role { Owner, Editor, Viewer }

public class MemberService : IMemberService
{
    private readonly IMemberRepository _repo;
    private static readonly Dictionary<string, Member> Cache = new();

    public event MemberPromoted? Promoted;

    private static readonly Func<Member, bool> IsOwner = m => m.Role == Role.Owner;

    public MemberService(IMemberRepository repo) => _repo = repo;

    public async Task<Member> PromoteAsync(string id, Role to = Role.Editor)
    {
        // Owners cannot be demoted through this path — see ADR-014.
        var member = await _repo.FindAsync(id)
            ?? throw new KeyNotFoundException($"No member {id}");

        if (member.Role == Role.Owner && to != Role.Owner) return member;

        var updated = member with { Role = to };
        Cache[id] = updated;
        Promoted?.Invoke(updated, member.Role);
        return updated;
    }
}
