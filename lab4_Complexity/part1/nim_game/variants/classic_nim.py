"""classic_nim.py – Standard multi-pile Nim: last to take WINS."""

from __future__ import annotations
import random
from typing import List, Optional, Tuple

from variants.base_variant import BaseVariant


class ClassicNim(BaseVariant):
    NAME        = "Classic Nim"
    SHORT_DESC  = "Take from any heap — last to take WINS."
    FULL_RULES  = (
        "CLASSIC NIM\n"
        "─────────────────────────────────────────────────────\n\n"
        "Setup\n"
        "  Multiple heaps of stones are placed on the table.\n\n"
        "On your turn\n"
        "  • Choose exactly ONE heap.\n"
        "  • Remove at least 1 stone — up to the entire heap.\n\n"
        "Winning condition\n"
        "  The player who takes the LAST stone WINS.\n\n"
        "Mathematical strategy  (Sprague–Grundy / Nim-sum)\n"
        "  1. Compute the XOR of all heap sizes  →  called the nim-sum.\n"
        "  2. If nim-sum ≠ 0 you are in a WINNING position:\n"
        "       find a heap H where (H XOR nim-sum) < H,\n"
        "       then reduce that heap to (H XOR nim-sum).\n"
        "  3. If nim-sum = 0 you are in a LOSING position:\n"
        "       every move hands your opponent a winning position.\n\n"
        "Tip: practise spotting the nim-sum in your head — it's the\n"
        "     secret weapon every Nim master relies on."
    )
    SUPPORTS_MULTI_HEAP = True

    # ── Win determination ─────────────────────────────────────────
    def determine_winner(self, last_mover: str, other_player: str) -> str:
        return last_mover   # last to take wins

    # ── Optimal move (full XOR strategy) ─────────────────────────
    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        nim_sum = self._nim_sum()

        if nim_sum != 0:
            # Winning position: find the heap to reduce
            for i, h in enumerate(self._heaps):
                target = h ^ nim_sum
                if target < h:
                    return (i, h - target)

        # Losing position (or fallback): take 1 from any non-empty heap
        return self._fallback()

    def _fallback(self) -> Optional[Tuple[int, int]]:
        candidates = [(i, h) for i, h in enumerate(self._heaps) if h > 0]
        if not candidates:
            return None
        i, h = random.choice(candidates)
        return (i, random.randint(1, h))
