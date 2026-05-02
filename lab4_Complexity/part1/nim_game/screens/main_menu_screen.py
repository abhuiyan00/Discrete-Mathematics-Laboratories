"""main_menu_screen.py – Title screen with Play vs Human / Play vs AI."""

from __future__ import annotations
import tkinter as tk
from typing import TYPE_CHECKING

from screens.base_screen import BaseScreen
from utils import constants as C

if TYPE_CHECKING:
    from app import App


class MainMenuScreen(BaseScreen):
    def __init__(self, parent: tk.Widget, app: "App") -> None:
        super().__init__(parent, app)
        self.build()

    # ── Build ─────────────────────────────────────────────────────
    def build(self) -> None:
        # ── Top spacer
        tk.Frame(self, bg=C.BG_DARK, height=60).pack()

        # ── Logo / title
        tk.Label(self, text="NIM", font=C.F_GIANT,
                 bg=C.BG_DARK, fg=C.ACCENT).pack()
        tk.Label(self, text="The Ancient Strategy Game",
                 font=C.F_SUBHEAD, bg=C.BG_DARK, fg=C.TEXT_SEC).pack()

        self.make_separator(self, pady=24)

        # ── Navigation buttons
        btn_frame = tk.Frame(self, bg=C.BG_DARK)
        btn_frame.pack()

        self.make_btn(btn_frame, "▶   Play vs Human",
                      lambda: self._start(vs_ai=False),
                      width=28).pack(pady=7)
        self.make_btn(btn_frame, "🤖   Play vs AI",
                      lambda: self._start(vs_ai=True),
                      width=28).pack(pady=7)
        self.make_btn(btn_frame, "✕   Quit",
                      self.app.destroy,
                      width=28, bg=C.BG_CARD).pack(pady=7)

        # ── Footer
        tk.Label(
            self,
            text="Based on Sprague–Grundy theory  •  4 variants  •  3 AI levels",
            font=C.F_SMALL, bg=C.BG_DARK, fg=C.TEXT_MUTED,
        ).pack(side="bottom", pady=14)

    # ── Actions ───────────────────────────────────────────────────
    def _start(self, vs_ai: bool) -> None:
        self.app.state.vs_ai = vs_ai
        if vs_ai:
            self._difficulty_dialog()
        else:
            self.app.state.difficulty = None
            self.app.show("variant")

    def _difficulty_dialog(self) -> None:
        dlg = tk.Toplevel(self.app)
        dlg.title("Choose AI Difficulty")
        dlg.geometry("420x340")
        dlg.configure(bg=C.BG_DARK)
        dlg.grab_set()
        dlg.resizable(False, False)

        # Centre over parent
        dlg.update_idletasks()
        x = self.app.winfo_x() + (self.app.winfo_width()  - 420) // 2
        y = self.app.winfo_y() + (self.app.winfo_height() - 340) // 2
        dlg.geometry(f"+{x}+{y}")

        tk.Label(dlg, text="Select AI Difficulty", font=C.F_HEADING,
                 bg=C.BG_DARK, fg=C.TEXT_PRIMARY).pack(pady=(28, 8))
        tk.Label(dlg, text="How challenging do you want the AI to be?",
                 font=C.F_SMALL, bg=C.BG_DARK, fg=C.TEXT_MUTED).pack(pady=(0, 14))

        for level, (icon, desc, color) in C.AI_DESCRIPTIONS.items():
            row = tk.Frame(dlg, bg=C.BG_CARD, cursor="hand2")
            row.pack(fill="x", padx=30, pady=5)

            tk.Label(row, text=f"  {icon}  {level}", font=C.F_BTN,
                     bg=C.BG_CARD, fg=color, width=14, anchor="w").pack(side="left", pady=10)
            tk.Label(row, text=desc + "  ", font=C.F_SMALL,
                     bg=C.BG_CARD, fg=C.TEXT_SEC).pack(side="right")

            def _pick(lvl=level):
                self.app.state.difficulty = lvl
                dlg.destroy()
                self.app.show("variant")

            row.bind("<Button-1>", lambda _e, fn=_pick: fn())
            for child in row.winfo_children():
                child.bind("<Button-1>", lambda _e, fn=_pick: fn())
            row.bind("<Enter>", lambda _e, r=row: r.config(bg=C.BG_MID))
            row.bind("<Leave>", lambda _e, r=row: r.config(bg=C.BG_CARD))
