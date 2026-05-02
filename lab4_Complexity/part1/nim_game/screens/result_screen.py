"""result_screen.py – Game-over screen with winner announcement and replay options."""

from __future__ import annotations
import tkinter as tk
from typing import TYPE_CHECKING

from screens.base_screen import BaseScreen
from utils import constants as C

if TYPE_CHECKING:
    from app import App


class ResultScreen(BaseScreen):
    def __init__(self, parent: tk.Widget, app: "App") -> None:
        super().__init__(parent, app)
        self._winner_var = tk.StringVar()
        self._score_var  = tk.StringVar()
        self._variant_var = tk.StringVar()
        self.build()

    # ── Build ─────────────────────────────────────────────────────
    def build(self) -> None:
        tk.Frame(self, bg=C.BG_DARK, height=60).pack()

        # Trophy / headline
        tk.Label(self, text="🏆", font=("Segoe UI", 56),
                 bg=C.BG_DARK).pack()
        tk.Label(self, text="Game Over!", font=C.F_TITLE,
                 bg=C.BG_DARK, fg=C.ACCENT).pack(pady=(4, 2))

        tk.Label(self, textvariable=self._winner_var,
                 font=("Segoe UI", 20, "bold"),
                 bg=C.BG_DARK, fg=C.SUCCESS).pack(pady=6)

        tk.Label(self, textvariable=self._variant_var,
                 font=C.F_SMALL, bg=C.BG_DARK, fg=C.TEXT_MUTED).pack()

        self.make_separator(self, pady=22)

        # Score board
        score_frame = tk.Frame(self, bg=C.BG_CARD)
        score_frame.pack(padx=100, fill="x")
        tk.Label(score_frame, text="Session Scores",
                 font=C.F_SUBHEAD, bg=C.BG_CARD, fg=C.TEXT_SEC,
                 pady=8).pack()
        self._score_labels_frame = tk.Frame(score_frame, bg=C.BG_CARD)
        self._score_labels_frame.pack(pady=(0, 12))

        self.make_separator(self, pady=22)

        # Actions
        btn_frame = tk.Frame(self, bg=C.BG_DARK)
        btn_frame.pack()

        self.make_btn(btn_frame, "▶  Play Again  (same setup)",
                      self._play_again, width=30).pack(pady=6)
        self.make_btn(btn_frame, "⚙  Change Setup",
                      lambda: self.app.show("setup"), width=30).pack(pady=6)
        self.make_btn(btn_frame, "🔀  Change Variant",
                      lambda: self.app.show("variant"), width=30,
                      bg=C.BG_CARD).pack(pady=6)
        self.make_btn(btn_frame, "🏠  Main Menu",
                      self._main_menu, width=30,
                      bg=C.BG_CARD).pack(pady=6)

    # ── Lifecycle ─────────────────────────────────────────────────
    def on_show(self) -> None:
        winner  = self.app.state.winner
        players = self.app.state.players
        variant = self.app.state.variant

        self._winner_var.set(f"{winner}  wins!")
        self._variant_var.set(f"Variant: {variant.NAME if variant else '—'}")

        # Rebuild score rows
        for w in self._score_labels_frame.winfo_children():
            w.destroy()
        for p in players:
            row = tk.Frame(self._score_labels_frame, bg=C.BG_CARD)
            row.pack(fill="x", padx=20, pady=2)
            color = C.SUCCESS if p.name == winner else C.TEXT_PRIMARY
            tk.Label(row, text=p.name, font=C.F_BODY,
                     bg=C.BG_CARD, fg=color, width=20, anchor="w").pack(side="left")
            tk.Label(row, text=f"{p.wins} win{'s' if p.wins != 1 else ''}",
                     font=C.F_SUBHEAD, bg=C.BG_CARD, fg=color).pack(side="right")

    # ── Actions ───────────────────────────────────────────────────
    def _play_again(self) -> None:
        self.app.state.reset_for_replay()
        self.app.show("gameplay")

    def _main_menu(self) -> None:
        # Clear player wins when returning to main menu
        for p in self.app.state.players:
            p.reset_wins()
        self.app.show("main_menu")
