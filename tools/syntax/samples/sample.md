# Members API

> Roles are hierarchical: an **Owner** implies every permission an *Editor* has.

## Promoting a member

Call `PATCH /workspaces/:id/members/:memberId` with the target role.

```ts
await client.members.promote(memberId, Role.Editor);
```

| Role     | Invite | Edit | Delete workspace |
| -------- | :----: | :--: | :--------------: |
| `owner`  |   ✓    |  ✓   |        ✓         |
| `editor` |   ✓    |  ✓   |        —         |
| `viewer` |   —    |  —   |        —         |

1. Resolve the member from cache, then from the repository.
2. Refuse the change when the member is an owner. [^adr]
3. Persist and emit `member.promoted`.

- [ ] Backfill historical audit rows
- [x] Emit the event on the outbox
- See the [architecture notes](./docs/adr/014-roles.md) for the reasoning.

[^adr]: Owners are only demoted through the transfer-ownership flow.
