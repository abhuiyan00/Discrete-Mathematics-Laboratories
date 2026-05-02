"""base_screen.py – Abstract base for all tkinter screens."""

from __future__ import annotations
import tkinter as tk
from abc import abstractmethod
from typing import TYPE_CHECKING

from utils import constants as C

if TYPE_CHECKING:
    from app import App


class BaseScreen(tk.Frame):
    """
    Each screen is a tk.Frame that fills the root window.
    Screens are stacked in a grid; ``tkraise()`` brings one to the front.
    """

    def __init__(self, parent: tk.Widget, app: "App") -> None:
        super().__init__(parent, bg=C.BG_DARK)
        self.app = app

    # ── Lifecycle ─────────────────────────────────────────────────
    @abstractmethod
    def build(self) -> None:
        """Create all widgets. Called once at construction."""

    def on_show(self) -> None:
        """
        Called every time this screen is raised to the top.
        Override to refresh dynamic content (player names, scores, etc.).
        """

    # ── Shared widget factories ───────────────────────────────────
    def make_btn(
        self,
        parent:  tk.Widget,
        text:    str,
        command,
        width:   int  = 22,
        bg:      str  = C.ACCENT,
        fg:      str  = C.TEXT_PRIMARY,
        pady:    int  = 8,
    ) -> tk.Button:
        btn = tk.Button(
            parent, text=text, command=command,
            bg=bg, fg=fg,
            activebackground=C.ACCENT_HOVER, activeforeground=C.TEXT_PRIMARY,
            font=C.F_BTN, width=width, height=1,
            pady=pady, bd=0, cursor="hand2", relief="flat",
        )
        btn.bind("<Enter>", lambda _e: btn.config(bg=C.ACCENT_HOVER if bg == C.ACCENT else bg))
        btn.bind("<Leave>", lambda _e: btn.config(bg=bg))
        return btn

    def make_label(
        self, parent, text="", textvariable=None,
        font=None, fg=None, bg=None, **kw
    ) -> tk.Label:
        return tk.Label(
            parent,
            text=text,
            textvariable=textvariable,
            font=font or C.F_BODY,
            fg=fg   or C.TEXT_PRIMARY,
            bg=bg   or C.BG_DARK,
            **kw,
        )

    def make_separator(self, parent, color=C.ACCENT, height=2, pady=12) -> tk.Frame:
        frm = tk.Frame(parent, bg=color, height=height)
        frm.pack(fill="x", padx=40, pady=pady)
        return frm
