"""bounded_nim.py – Multi-heap Nim with a per-turn take limit (Sprague–Grundy)."""

from __future__ import annotations
import random
from typing import List, Optional, Tuple

from variants.base_variant import BaseVariant


class BoundedNim(BaseVariant):
    NAME        = "Bounded Nim"
    SHORT_DESC  = "Multi-heap, take at most K per heap per turn — last to take WINS."
    FULL_RULES  = (
        "BOUNDED NIM  (multi-heap with a take limit)\n"
        "─────────────────────────────────────────────────────\n\n"
        "Setup\n"
        "  Multiple heaps of stones and a take limit K are set\n"
        "  before the game.\n\n"
        "On your turn\n"
        "  • Choose exactly ONE heap.\n"
        "  • Remove between 1 and K stones from that heap.\n\n"
        "Winning condition\n"
        "  The player who takes the LAST stone WINS.\n\n"
        "Mathematical strategy  (Sprague–Grundy generalisation)\n"
        "  Each heap h has a Grundy value  g(h) = h mod (K + 1).\n"
        "  XOR all Grundy values → Grundy nim-sum G.\n\n"
        "  • If G = 0  →  losing position for the player to move.\n"
        "  • If G ≠ 0  →  find a heap where:\n"
        "        g(h) XOR G  <  g(h)\n"
        "    and reduce that heap by  g(h) − (g(h) XOR G)  stones.\n\n"
        "Tip: this generalises single-pile strategy to multiple heaps.\n"
        "     When K = heap_size the game reduces to Classic Nim."
    )
    SUPPORTS_MULTI_HEAP = True

    def __init__(self, heaps: List[int], max_take: int = 3) -> None:
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
        if heap_idx < 0 or heap_idx >= len(self._heaps):
            return False
        limit = min(self._max_take, self._heaps[heap_idx])
        if amount < 1 or amount > limit:
            return False
        return True

    def get_valid_moves(self) -> List[Tuple[int, int]]:
        return [
            (i, a)
            for i, h in enumerate(self._heaps)
            for a in range(1, min(self._max_take, h) + 1)
        ]

    def max_take_from(self, heap_idx: int) -> int:
        return min(self._max_take, self._heaps[heap_idx])

    def reset(self) -> None:
        super().reset()
        self._max_take = self._initial_max_take

    # ── Win determination ─────────────────────────────────────────
    def determine_winner(self, last_mover: str, other_player: str) -> str:
        return last_mover

    # ── Optimal move  (Grundy / Sprague–Grundy XOR) ───────────────
    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        m = self._max_take + 1
        grundy_sum = 0
        for h in self._heaps:
            grundy_sum ^= (h % m)

        if grundy_sum == 0:
            return self._fallback()

        for i, h in enumerate(self._heaps):
            g      = h % m
            target = g ^ grundy_sum
            if target < g:
                amount = g - target          # stones to remove
                if 1 <= amount <= min(self._max_take, h):
                    return (i, amount)

        return self._fallback()

    def _fallback(self) -> Optional[Tuple[int, int]]:
        candidates = [(i, h) for i, h in enumerate(self._heaps) if h > 0]
        if not candidates:
            return None
        i, h = random.choice(candidates)
        return (i, random.randint(1, min(self._max_take, h)))
