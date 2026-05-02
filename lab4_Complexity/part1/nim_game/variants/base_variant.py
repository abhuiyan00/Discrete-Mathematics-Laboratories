"""base_variant.py – Abstract base class for all Nim variants."""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple


class BaseVariant(ABC):
    """
    Contract that every Nim variant must satisfy.

    Subclasses encode *all* variant-specific rules: move legality,
    optimal AI strategy, and win determination.
    """

    # ── Metadata (override in subclasses) ────────────────────────
    NAME: str = "Nim"
    SHORT_DESC: str = ""
    FULL_RULES: str = ""
    SUPPORTS_MULTI_HEAP: bool = True   # False for single-pile variants

    # ── Construction ─────────────────────────────────────────────
    def __init__(self, heaps: List[int]) -> None:
        if not heaps:
            raise ValueError("At least one heap is required.")
        if any(h < 0 for h in heaps):
            raise ValueError("Heap sizes must be non-negative integers.")
        self._heaps: List[int] = list(heaps)
        self._initial: List[int] = list(heaps)

    # ── Read-only properties ──────────────────────────────────────
    @property
    def heaps(self) -> List[int]:
        """Current heap sizes (copy)."""
        return list(self._heaps)

    @property
    def num_heaps(self) -> int:
        return len(self._heaps)

    @property
    def total_stones(self) -> int:
        return sum(self._heaps)

    # ── State queries ─────────────────────────────────────────────
    def is_game_over(self) -> bool:
        return self.total_stones == 0

    def is_valid_move(self, heap_idx: int, amount: int) -> bool:
        if heap_idx < 0 or heap_idx >= len(self._heaps):
            return False
        if amount < 1 or amount > self._heaps[heap_idx]:
            return False
        return True

    def get_valid_moves(self) -> List[Tuple[int, int]]:
        """Return all (heap_idx, amount) pairs that are currently legal."""
        return [
            (i, a)
            for i, h in enumerate(self._heaps)
            for a in range(1, h + 1)
        ]

    def max_take_from(self, heap_idx: int) -> int:
        """Maximum stones that may be taken from heap_idx this turn."""
        return self._heaps[heap_idx]

    # ── Mutation ──────────────────────────────────────────────────
    def make_move(self, heap_idx: int, amount: int) -> bool:
        """Apply a move. Returns False if invalid."""
        if not self.is_valid_move(heap_idx, amount):
            return False
        self._heaps[heap_idx] -= amount
        return True

    def reset(self) -> None:
        """Restore heaps to their initial state."""
        self._heaps = list(self._initial)

    # ── Abstract interface ────────────────────────────────────────
    @abstractmethod
    def determine_winner(self, last_mover: str, other_player: str) -> str:
        """
        Given who made the last move, return the winner's name.

        Args:
            last_mover:   name of the player who just took the last stone.
            other_player: name of the other player.
        """

    @abstractmethod
    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        """
        Return the game-theoretically optimal (heap_idx, amount) for
        the current position, or None if no move is available.
        """

    # ── Helpers shared across subclasses ─────────────────────────
    def _nim_sum(self) -> int:
        result = 0
        for h in self._heaps:
            result ^= h
        return result

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(heaps={self._heaps})"
