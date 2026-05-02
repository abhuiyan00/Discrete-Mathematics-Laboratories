"""single_pile_nim.py – One heap, limited take per turn, last to take WINS."""

from __future__ import annotations
from typing import List, Optional, Tuple

from variants.base_variant import BaseVariant


class SinglePileNim(BaseVariant):
    NAME        = "Single-Pile Nim"
    SHORT_DESC  = "One heap, take 1–K per turn — last to take WINS."
    FULL_RULES  = (
        "SINGLE-PILE NIM  (also known as the '21 game')\n"
        "─────────────────────────────────────────────────────\n\n"
        "Setup\n"
        "  A single heap of N stones and a maximum take limit K\n"
        "  are agreed upon before the game begins.\n\n"
        "On your turn\n"
        "  Remove between 1 and K stones from the heap.\n\n"
        "Winning condition\n"
        "  The player who takes the LAST stone WINS.\n\n"
        "Mathematical strategy\n"
        "  The key number is  M = K + 1  (one more than the limit).\n"
        "  Positions that are multiples of M are LOSING positions for\n"
        "  the player about to move.\n\n"
        "  On your turn:\n"
        "    • Calculate  remainder = pile_size mod M.\n"
        "    • If remainder = 0  →  you are losing; take 1 and hope.\n"
        "    • Otherwise         →  take (remainder) stones to reduce\n"
        "      the pile to the nearest multiple of M.\n\n"
        "Example  (K = 3, M = 4):\n"
        "  Pile = 13  →  13 mod 4 = 1  →  take 1  →  leave 12 (multiple of 4).\n"
        "  Pile = 15  →  15 mod 4 = 3  →  take 3  →  leave 12.\n"
        "  Pile = 12  →  losing — any move your opponent can counter."
    )
    SUPPORTS_MULTI_HEAP = False

    def __init__(self, heaps: List[int], max_take: int = 3) -> None:
        if len(heaps) != 1:
            raise ValueError("SinglePileNim requires exactly one heap.")
        if max_take < 1:
            raise ValueError("max_take must be at least 1.")
        super().__init__(heaps)
        self._max_take: int = max_take
        self._initial_max_take: int = max_take

    # ── Properties ────────────────────────────────────────────────
    @property
    def max_take(self) -> int:
        return self._max_take

    # ── Overrides ─────────────────────────────────────────────────
    def is_valid_move(self, heap_idx: int, amount: int) -> bool:
        if heap_idx != 0:
            return False
        if amount < 1 or amount > min(self._max_take, self._heaps[0]):
            return False
        return True

    def get_valid_moves(self) -> List[Tuple[int, int]]:
        pile = self._heaps[0]
        limit = min(self._max_take, pile)
        return [(0, a) for a in range(1, limit + 1)]

    def max_take_from(self, heap_idx: int) -> int:
        return min(self._max_take, self._heaps[0])

    def reset(self) -> None:
        super().reset()
        self._max_take = self._initial_max_take

    # ── Win determination ─────────────────────────────────────────
    def determine_winner(self, last_mover: str, other_player: str) -> str:
        return last_mover

    # ── Optimal move ──────────────────────────────────────────────
    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        pile = self._heaps[0]
        if pile == 0:
            return None
        m = self._max_take + 1          # the key modulus
        remainder = pile % m
        # If remainder == 0 or 1, we are in a losing position
        # (leave 1 so next move by opponent can win — or no good move)
        if remainder == 0:
            return (0, 1)              # forced bad move
        # Winning: take 'remainder' to leave a multiple of m
        # But 'remainder' might exceed max_take — clamp
        take = min(remainder, self._max_take)
        return (0, take)
