"""state.py – Shared mutable game state passed between all screens via App."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from variants.base_variant import BaseVariant
    from players.base_player import BasePlayer


@dataclass
class GameState:
    # ── Pre-game choices ──────────────────────────────────────────
    vs_ai:          bool                    = False
    difficulty:     str                     = "Easy"      # "Easy" | "Medium" | "Hard"
    variant_class:  Optional[type]          = None        # the class (not instance)

    # ── Game instance ─────────────────────────────────────────────
    variant:        Optional["BaseVariant"] = None
    players:        List["BasePlayer"]      = field(default_factory=list)
    current_idx:    int                     = 0           # index into players

    # ── Result ────────────────────────────────────────────────────
    winner:         str                     = ""          # winner's display name

    def current_player(self) -> Optional["BasePlayer"]:
        if not self.players:
            return None
        return self.players[self.current_idx]

    def other_player(self) -> Optional["BasePlayer"]:
        if len(self.players) < 2:
            return None
        return self.players[1 - self.current_idx]

    def advance_turn(self) -> None:
        self.current_idx = 1 - self.current_idx

    def reset_for_replay(self) -> None:
        """Reset the variant and turn counter, keeping players and scores."""
        if self.variant is not None:
            self.variant.reset()
        self.current_idx = 0
        self.winner = ""
