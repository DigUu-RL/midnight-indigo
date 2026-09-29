import asyncio
from dataclasses import dataclass


@dataclass(frozen=True)
class Point:
    x: int
    y: int = 0

    def __add__(self, other: "Point") -> "Point":
        return Point(self.x + other.x, self.y + other.y)


def countdown(start: int):
    while start > 0:
        yield start
        start -= 1


async def fetch(url: str, retries: int = 3) -> bytes | None:
    await asyncio.sleep(len(url) * 0.1)
    return None if retries < 1 else b"ok"
