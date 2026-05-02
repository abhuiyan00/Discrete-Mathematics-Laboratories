"""human_player.py – Human player; moves are driven by the GUI, not this class."""

from __future__ import annotations
from players.base_player import BasePlayer


class HumanPlayer(BasePlayer):
    def __init__(self, name: str = "Player") -> None:
        super().__init__(name)

    def is_human(self) -> bool:
        return True
