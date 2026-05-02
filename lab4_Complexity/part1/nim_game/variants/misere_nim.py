"""misere_nim.py – Misère Nim: last to take LOSES."""

from __future__ import annotations
import random
from typing import List, Optional, Tuple

from variants.base_variant import BaseVariant


class MisereNim(BaseVariant):
    NAME        = "Misère Nim"
    SHORT_DESC  = "Take from any heap — last to take LOSES."
    FULL_RULES  = (
        "MISÈRE NIM\n"
        "─────────────────────────────────────────────────────\n\n"
        "Setup\n"
        "  Multiple heaps of stones are placed on the table.\n\n"
        "On your turn\n"
        "  • Choose exactly ONE heap.\n"
        "  • Remove at least 1 stone — up to the entire heap.\n\n"
        "Losing condition\n"
        "  The player forced to take the LAST stone LOSES.\n\n"
        "Strategy  (Misère Nim theorem)\n"
        "  Phase 1 — while at least one heap has more than 1 stone:\n"
        "    Play EXACTLY like Classic Nim (XOR / nim-sum strategy).\n"
        "    Exception: if your winning move would leave only 1-stone\n"
        "    heaps, adjust it to leave an ODD number of those heaps.\n\n"
        "  Phase 2 — when ALL heaps have at most 1 stone:\n"
        "    Aim to leave an ODD number of 1-stone heaps for your\n"
        "    opponent, so they are forced to take the last one.\n\n"
        "Tip: the game plays identically to Classic Nim for most of\n"
        "     its length — only the very end is inverted."
    )
    SUPPORTS_MULTI_HEAP = True

    # ── Win determination ─────────────────────────────────────────
    def determine_winner(self, last_mover: str, other_player: str) -> str:
        return other_player   # last to take LOSES → other player wins

    # ── Optimal move ──────────────────────────────────────────────
    def get_optimal_move(self) -> Optional[Tuple[int, int]]:
        if self._all_ones():
            return self._endgame_move()
        return self._midgame_move()

    def _all_ones(self) -> bool:
        return all(h <= 1 for h in self._heaps)

    # Phase 2: all heaps are 0 or 1 ─ leave opponent odd pile of 1s
    def _endgame_move(self) -> Optional[Tuple[int, int]]:
        ones_idx = [i for i, h in enumerate(self._heaps) if h == 1]
        if not ones_idx:
            return None
        # We must take exactly one 1-stone heap.
        # After taking: opponent sees (len(ones_idx) - 1) heaps of 1.
        # We want (len - 1) to be ODD so opponent is left in losing pos.
        # If current count is even  → (even - 1) = odd → great, take any.
        # If current count is odd   → (odd - 1)  = even → bad, but forced.
        return (ones_idx[0], 1)

    # Phase 1: standard Nim-sum, but watch for the transition to Phase 2
    def _midgame_move(self) -> Optional[Tuple[int, int]]:
        nim_sum = self._nim_sum()

        if nim_sum == 0:
            return self._fallback()

        for i, h in enumerate(self._heaps):
            target = h ^ nim_sum
            if target < h:
                amount = h - target
                # Simulate the resulting heaps
                new_heaps = list(self._heaps)
                new_heaps[i] = target

                # If this move transitions to Phase 2, verify parity
                if all(x <= 1 for x in new_heaps):
                    ones_after = sum(1 for x in new_heaps if x == 1)
                    if ones_after % 2 == 0:
                        # Bad parity: adjust — take entire heap instead
                        return (i, h)
                return (i, amount)

        return self._fallback()

    def _fallback(self) -> Optional[Tuple[int, int]]:
        candidates = [(i, h) for i, h in enumerate(self._heaps) if h > 0]
        if not candidates:
            return None
        i, h = random.choice(candidates)
        return (i, random.randint(1, h))
