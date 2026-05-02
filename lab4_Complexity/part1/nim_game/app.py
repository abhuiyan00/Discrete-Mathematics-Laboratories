"""app.py – Root window and screen manager."""

from __future__ import annotations
import tkinter as tk
from state import GameState
from utils import constants as C


class App(tk.Tk):
    """
    The single Tk root window.  All screens live in a stacked grid;
    ``show(name)`` raises the appropriate frame to the top.
    """

    def __init__(self) -> None:
        super().__init__()
        self.title("Nim  —  The Strategy Game")
        self.geometry("980x720")
        self.minsize(820, 620)
        self.configure(bg=C.BG_DARK)
        self._set_icon()

        # Shared mutable state
        self.state = GameState()

        # Screen container (all screens live here, stacked)
        self._container = tk.Frame(self, bg=C.BG_DARK)
        self._container.pack(fill="both", expand=True)
        self._container.grid_rowconfigure(0, weight=1)
        self._container.grid_columnconfigure(0, weight=1)

        self._screens: dict[str, tk.Frame] = {}
        self._init_screens()
        self.show("main_menu")

    # ── Screen registry ───────────────────────────────────────────
    def _init_screens(self) -> None:
        # Import here to avoid circular references at module load time
        from screens.main_menu_screen     import MainMenuScreen
        from screens.variant_select_screen import VariantSelectScreen
        from screens.game_setup_screen    import GameSetupScreen
        from screens.gameplay_screen      import GameplayScreen
        from screens.result_screen        import ResultScreen

        pairs = [
            ("main_menu", MainMenuScreen),
            ("variant",   VariantSelectScreen),
            ("setup",     GameSetupScreen),
            ("gameplay",  GameplayScreen),
            ("result",    ResultScreen),
        ]
        for name, ScreenClass in pairs:
            screen = ScreenClass(self._container, self)
            screen.grid(row=0, column=0, sticky="nsew")
            self._screens[name] = screen

    def show(self, name: str) -> None:
        """Raise a screen by name and call its on_show() hook."""
        screen = self._screens[name]
        screen.on_show()
        screen.tkraise()

    # ── Optional window icon ──────────────────────────────────────
    def _set_icon(self) -> None:
        try:
            self.iconbitmap(default="")   # clears default feather icon on some OSes
        except Exception:
            pass
