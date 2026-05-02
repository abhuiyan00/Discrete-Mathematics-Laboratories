"""variant_select_screen.py – Pick a Nim variant and read its rules."""

from __future__ import annotations
import tkinter as tk
from typing import Optional, TYPE_CHECKING

from screens.base_screen import BaseScreen
from variants import ALL_VARIANTS
from utils import constants as C

if TYPE_CHECKING:
    from app import App


class VariantSelectScreen(BaseScreen):
    def __init__(self, parent: tk.Widget, app: "App") -> None:
        super().__init__(parent, app)
        self._selected: Optional[type] = None
        self._btn_map: dict = {}
        self.build()

    # ── Build ─────────────────────────────────────────────────────
    def build(self) -> None:
        # ── Top bar
        bar = tk.Frame(self, bg=C.BG_MID)
        bar.pack(fill="x")

        tk.Button(bar, text="← Back", command=lambda: self.app.show("main_menu"),
                  bg=C.BG_MID, fg=C.TEXT_SEC, font=C.F_BODY,
                  bd=0, cursor="hand2", pady=8).pack(side="left", padx=14)
        tk.Label(bar, text="Choose a Variant", font=C.F_HEADING,
                 bg=C.BG_MID, fg=C.TEXT_PRIMARY).pack(side="left", padx=6, pady=8)

        # ── Two-column body
        body = tk.Frame(self, bg=C.BG_DARK)
        body.pack(fill="both", expand=True, padx=C.PAD, pady=12)
        body.columnconfigure(0, weight=1, minsize=200)
        body.columnconfigure(1, weight=3)
        body.rowconfigure(0, weight=1)

        # Left panel – variant list
        left = tk.Frame(body, bg=C.BG_MID)
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        tk.Label(left, text="Variants", font=C.F_SUBHEAD,
                 bg=C.BG_MID, fg=C.TEXT_SEC).pack(pady=(14, 6))

        for vc in ALL_VARIANTS:
            btn = tk.Button(
                left, text=vc.NAME,
                font=C.F_BODY, bg=C.BG_MID, fg=C.TEXT_PRIMARY,
                activebackground=C.BG_CARD, bd=0, cursor="hand2",
                width=22, pady=10,
                command=lambda v=vc: self._select(v),
            )
            btn.pack(fill="x", padx=8, pady=3)
            btn.bind("<Enter>", lambda _e, b=btn: b.config(bg=C.BG_CARD) if b["bg"] != C.ACCENT else None)
            btn.bind("<Leave>", lambda _e, b=btn, v=vc: b.config(bg=C.BG_MID if v is not self._selected else C.ACCENT))
            self._btn_map[vc] = btn

        # Right panel – rules text
        right = tk.Frame(body, bg=C.BG_CARD)
        right.grid(row=0, column=1, sticky="nsew")

        self._rules_text = tk.Text(
            right, font=C.F_MONO, bg=C.BG_CARD, fg=C.TEXT_PRIMARY,
            relief="flat", bd=0, wrap="word",
            padx=22, pady=18, state="disabled",
            cursor="arrow",
        )
        scroll = tk.Scrollbar(right, command=self._rules_text.yview,
                              bg=C.BG_CARD, troughcolor=C.BG_DARK)
        self._rules_text.configure(yscrollcommand=scroll.set)
        scroll.pack(side="right", fill="y")
        self._rules_text.pack(fill="both", expand=True)

        self._set_rules("← Select a variant on the left to read its rules and strategy.")

        # ── Bottom bar
        bottom = tk.Frame(self, bg=C.BG_DARK)
        bottom.pack(fill="x", side="bottom", padx=C.PAD, pady=10)

        self._next_btn = self.make_btn(
            bottom, "Next: Set Up Game  →", self._go_setup, width=26,
            bg=C.TEXT_MUTED,
        )
        self._next_btn.config(state="disabled")
        self._next_btn.pack(side="right")

    # ── Helpers ───────────────────────────────────────────────────
    def _select(self, variant_class: type) -> None:
        self._selected = variant_class
        self._set_rules(variant_class.FULL_RULES)
        for vc, btn in self._btn_map.items():
            btn.config(bg=C.ACCENT if vc is variant_class else C.BG_MID,
                       fg=C.TEXT_PRIMARY)
        self._next_btn.config(state="normal", bg=C.ACCENT)
        self._next_btn.bind("<Enter>", lambda _e: self._next_btn.config(bg=C.ACCENT_HOVER))
        self._next_btn.bind("<Leave>", lambda _e: self._next_btn.config(bg=C.ACCENT))

    def _set_rules(self, text: str) -> None:
        self._rules_text.config(state="normal")
        self._rules_text.delete("1.0", "end")
        self._rules_text.insert("1.0", text)
        self._rules_text.config(state="disabled")

    def _go_setup(self) -> None:
        if self._selected:
            self.app.state.variant_class = self._selected
            self.app.show("setup")

    # ── Lifecycle ─────────────────────────────────────────────────
    def on_show(self) -> None:
        self._selected = None
        self._set_rules("← Select a variant on the left to read its rules and strategy.")
        self._next_btn.config(state="disabled", bg=C.TEXT_MUTED)
        for btn in self._btn_map.values():
            btn.config(bg=C.BG_MID)
