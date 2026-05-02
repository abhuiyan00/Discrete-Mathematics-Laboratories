"""base_player.py – Abstract base class for human and AI players."""

from __future__ import annotations
from abc import ABC, abstractmethod


class BasePlayer(ABC):
    def __init__(self, name: str) -> None:
        self._name: str = name
        self._wins: int = 0

    # ── Properties ────────────────────────────────────────────────
    @property
    def name(self) -> str:
        return self._name

    @property
    def wins(self) -> int:
        return self._wins

    # ── Session stats ─────────────────────────────────────────────
    def add_win(self) -> None:
        self._wins += 1

    def reset_wins(self) -> None:
        self._wins = 0

    # ── Type check ────────────────────────────────────────────────
    @abstractmethod
    def is_human(self) -> bool:
        """Return True for HumanPlayer, False for AIPlayer."""

    def __str__(self) -> str:
        return self._name

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name={self._name!r}, wins={self._wins})"
