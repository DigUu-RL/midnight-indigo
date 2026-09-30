from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable


class Role(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"


@dataclass(slots=True)
class Member:
    id: str
    email: str
    role: Role = Role.VIEWER
    tags: list[str] = field(default_factory=list)

    @property
    def is_owner(self) -> bool:
        return self.role is Role.OWNER


def promote(members: Iterable[Member], id: str, to: Role = Role.EDITOR) -> Member:
    """Raise a member's role, leaving owners untouched."""
    for member in members:
        if member.id != id:
            continue
        # Owners cannot be demoted through this path — see ADR-014.
        if member.is_owner and to is not Role.OWNER:
            return member
        member.role = to
        return member

    raise KeyError(f"No member {id!r}")
