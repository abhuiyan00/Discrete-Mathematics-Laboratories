"""ai_player.py – AI player with three difficulty levels."""

from __future__ import annotations
import random
from typing import Optional, Tuple

from players.base_player import BasePlayer
from variants.base_variant import BaseVariant
from utils.constants import AI_OPTIMAL_PROB


class AIPlayer(BasePlayer):
    """
    AI opponent whose strength is controlled by the probability that it
    plays the game-theoretically optimal move on any given turn.

    Difficulty  |  Optimal-move probability  |  Expected player win-rate
    ------------|----------------------------|--------------------------
    Easy        |  ~15 %                     |  ~75 %
    Medium      |  ~58 %                     |  ~40 %
    Hard        |  ~99 %                     |  ~1  %
    """

    EASY   = "Easy"
    MEDIUM = "Medium"
    HARD   = "Hard"

    def __init__(self, difficulty: str = EASY) -> None:
        if difficulty not in AI_OPTIMAL_PROB:
            raise ValueError(f"Unknown difficulty: {difficulty!r}")
        super().__init__(f"AI ({difficulty})")
        self._difficulty: str = difficulty
        self._optimal_prob: float = AI_OPTIMAL_PROB[difficulty]

    # ── Properties ────────────────────────────────────────────────
    @property
    def difficulty(self) -> str:
        return self._difficulty

    def is_human(self) -> bool:
        return False

    # ── Move selection ────────────────────────────────────────────
    def get_move(self, variant: BaseVariant) -> Optional[Tuple[int, int]]:
        """
        Decide which move to make.

        With probability ``_optimal_prob`` the AI uses the variant's
        game-theoretically optimal strategy; otherwise it picks a
        uniformly random legal move.
        """
        valid = variant.get_valid_moves()
        if not valid:
            return None

        if random.random() < self._optimal_prob:
            move = variant.get_optimal_move()
            if move is not None and move in valid:
                return move

        return random.choice(valid)
