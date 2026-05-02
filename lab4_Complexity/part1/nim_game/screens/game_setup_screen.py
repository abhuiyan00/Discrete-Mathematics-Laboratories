"""game_setup_screen.py – Configure players, heap sizes, and max-take limit."""

from __future__ import annotations
import tkinter as tk
from tkinter import messagebox
from typing import List, TYPE_CHECKING

from screens.base_screen import BaseScreen
from variants.single_pile_nim import SinglePileNim
from variants.bounded_nim import BoundedNim
from players.human_player import HumanPlayer
from players.ai_player import AIPlayer
from utils import constants as C
from utils.constants import MULTI_PRESETS, SINGLE_PRESETS

if TYPE_CHECKING:
    from app import App

_BOUNDED_VARIANTS = (SinglePileNim, BoundedNim)


class GameSetupScreen(BaseScreen):
    def __init__(self, parent: tk.Widget, app: "App") -> None:
        super().__init__(parent, app)
        self._heap_entries: List[tk.Entry] = []
        self._num_heaps   = tk.IntVar(value=3)
        self._max_take    = tk.IntVar(value=3)
        self._p1_name     = tk.StringVar(value="Player 1")
        self._p2_name     = tk.StringVar(value="Player 2")
        self._title_var   = tk.StringVar(value="Game Setup")
        self._is_single   = False
        self._needs_limit = False
        self.build()

    # ── Build (once) ──────────────────────────────────────────────
    def build(self) -> None:
        # ── Top bar
        bar = tk.Frame(self, bg=C.BG_MID)
        bar.pack(fill="x")
        tk.Button(bar, text="← Back", command=lambda: self.app.show("variant"),
                  bg=C.BG_MID, fg=C.TEXT_SEC, font=C.F_BODY,
                  bd=0, cursor="hand2", pady=8).pack(side="left", padx=14)
        tk.Label(bar, textvariable=self._title_var, font=C.F_HEADING,
                 bg=C.BG_MID, fg=C.TEXT_PRIMARY).pack(side="left", padx=6, pady=8)

        # ── Scrollable content
        outer = tk.Frame(self, bg=C.BG_DARK)
        outer.pack(fill="both", expand=True)

        canvas = tk.Canvas(outer, bg=C.BG_DARK, highlightthickness=0)
        vscroll = tk.Scrollbar(outer, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=vscroll.set)
        vscroll.pack(side="right", fill="y")
        canvas.pack(fill="both", expand=True)

        self._inner = tk.Frame(canvas, bg=C.BG_DARK)
        win_id = canvas.create_window((0, 0), window=self._inner, anchor="nw")

        def _sync_width(e):
            canvas.itemconfig(win_id, width=e.width)
        def _sync_scroll(_e):
            canvas.configure(scrollregion=canvas.bbox("all"))

        canvas.bind("<Configure>", _sync_width)
        self._inner.bind("<Configure>", _sync_scroll)

        # Mousewheel scrolling
        def _wheel(e):
            canvas.yview_scroll(-1 * (e.delta // 120), "units")
        canvas.bind_all("<MouseWheel>", _wheel)

        # ── Sections (built dynamically in on_show)
        self._names_frame    = tk.LabelFrame(self._inner, text=" Player Names ",
                                              font=C.F_BODY, bg=C.BG_DARK,
                                              fg=C.TEXT_SEC)
        self._presets_frame  = tk.LabelFrame(self._inner, text=" Quick Presets ",
                                              font=C.F_BODY, bg=C.BG_DARK,
                                              fg=C.TEXT_SEC)
        self._manual_frame   = tk.LabelFrame(self._inner, text=" Manual Configuration ",
                                              font=C.F_BODY, bg=C.BG_DARK,
                                              fg=C.TEXT_SEC)
        self._limit_frame    = tk.LabelFrame(self._inner, text=" Move Limit (K) ",
                                              font=C.F_BODY, bg=C.BG_DARK,
                                              fg=C.TEXT_SEC)

        # ── Start button (always visible at bottom of outer frame)
        bottom = tk.Frame(self, bg=C.BG_DARK)
        bottom.pack(fill="x", side="bottom", padx=C.PAD, pady=10)
        self.make_btn(bottom, "▶   Start Game", self._start, width=20).pack(side="right")

    # ── Lifecycle ─────────────────────────────────────────────────
    def on_show(self) -> None:
        vc = self.app.state.variant_class
        vs_ai = self.app.state.vs_ai

        self._title_var.set(f"Setup — {vc.NAME}")
        self._is_single   = not getattr(vc, "SUPPORTS_MULTI_HEAP", True)
        self._needs_limit = issubclass(vc, _BOUNDED_VARIANTS)

        # Reset default player names
        self._p1_name.set("Player 1")
        self._p2_name.set("Player 2" if not vs_ai else f"AI ({self.app.state.difficulty})")

        self._rebuild_names(vs_ai)
        self._rebuild_presets()
        self._rebuild_manual()
        self._rebuild_limit()

    def _rebuild_names(self, vs_ai: bool) -> None:
        for w in self._names_frame.winfo_children():
            w.destroy()
        self._names_frame.pack(fill="x", padx=C.PAD, pady=8)

        rows = [("Your Name:" if vs_ai else "Player 1 Name:", self._p1_name)]
        if not vs_ai:
            rows.append(("Player 2 Name:", self._p2_name))

        for label_text, var in rows:
            row = tk.Frame(self._names_frame, bg=C.BG_DARK)
            row.pack(fill="x", padx=10, pady=5)
            tk.Label(row, text=label_text, font=C.F_BODY,
                     bg=C.BG_DARK, fg=C.TEXT_PRIMARY, width=18, anchor="w").pack(side="left")
            tk.Entry(row, textvariable=var, font=C.F_BODY,
                     bg=C.BG_MID, fg=C.TEXT_PRIMARY,
                     insertbackground=C.TEXT_PRIMARY, bd=1,
                     relief="flat", width=22).pack(side="left", padx=6)

    def _rebuild_presets(self) -> None:
        for w in self._presets_frame.winfo_children():
            w.destroy()
        self._presets_frame.pack(fill="x", padx=C.PAD, pady=8)

        presets = SINGLE_PRESETS if self._is_single else MULTI_PRESETS
        for p in presets:
            btn = tk.Button(
                self._presets_frame, text=p["label"],
                font=C.F_BODY, bg=C.BG_MID, fg=C.TEXT_PRIMARY,
                activebackground=C.BG_CARD, bd=0, cursor="hand2",
                anchor="w", padx=12, pady=7,
                command=lambda d=p: self._apply_preset(d),
            )
            btn.pack(fill="x", padx=10, pady=2)
            tk.Label(self._presets_frame, text="    " + p["desc"],
                     font=C.F_SMALL, bg=C.BG_DARK, fg=C.TEXT_MUTED).pack(anchor="w")

    def _rebuild_manual(self) -> None:
        for w in self._manual_frame.winfo_children():
            w.destroy()
        self._manual_frame.pack(fill="x", padx=C.PAD, pady=8)
        self._heap_entries.clear()

        if self._is_single:
            row = tk.Frame(self._manual_frame, bg=C.BG_DARK)
            row.pack(padx=10, pady=10)
            tk.Label(row, text="Number of stones in the pile:",
                     font=C.F_BODY, bg=C.BG_DARK, fg=C.TEXT_PRIMARY).pack(side="left")
            e = tk.Entry(row, font=C.F_BODY, bg=C.BG_MID, fg=C.TEXT_PRIMARY,
                         insertbackground=C.TEXT_PRIMARY, bd=1, relief="flat", width=8)
            e.insert(0, "21")
            e.pack(side="left", padx=8)
            self._heap_entries.append(e)
        else:
            ctrl = tk.Frame(self._manual_frame, bg=C.BG_DARK)
            ctrl.pack(fill="x", padx=10, pady=8)
            tk.Label(ctrl, text="Number of heaps (2–8):",
                     font=C.F_BODY, bg=C.BG_DARK, fg=C.TEXT_PRIMARY).pack(side="left")
            tk.Spinbox(
                ctrl, from_=2, to=8, textvariable=self._num_heaps,
                font=C.F_BODY, bg=C.BG_MID, fg=C.TEXT_PRIMARY,
                buttonbackground=C.BG_CARD, width=5,
                command=self._rebuild_heap_inputs,
            ).pack(side="left", padx=10)

            self._inputs_row = tk.Frame(self._manual_frame, bg=C.BG_DARK)
            self._inputs_row.pack(fill="x", padx=10, pady=8)
            self._rebuild_heap_inputs()

    def _rebuild_heap_inputs(self) -> None:
        for w in self._inputs_row.winfo_children():
            w.destroy()
        self._heap_entries.clear()

        n = self._num_heaps.get()
        defaults = [3, 5, 7, 4, 6, 2, 8, 1]
        for i in range(n):
            col = tk.Frame(self._inputs_row, bg=C.BG_DARK)
            col.pack(side="left", padx=8)
            tk.Label(col, text=f"Heap {i+1}", font=C.F_SMALL,
                     bg=C.BG_DARK, fg=C.TEXT_SEC).pack()
            e = tk.Entry(col, font=C.F_BODY, bg=C.BG_MID, fg=C.TEXT_PRIMARY,
                         insertbackground=C.TEXT_PRIMARY, bd=1, relief="flat", width=5)
            e.insert(0, str(defaults[i % len(defaults)]))
            e.pack()
            self._heap_entries.append(e)

    def _rebuild_limit(self) -> None:
        if self._needs_limit:
            for w in self._limit_frame.winfo_children():
                w.destroy()
            self._limit_frame.pack(fill="x", padx=C.PAD, pady=8)

            row = tk.Frame(self._limit_frame, bg=C.BG_DARK)
            row.pack(padx=10, pady=10)
            tk.Label(row, text="Max stones per turn  (K = 1–20):",
                     font=C.F_BODY, bg=C.BG_DARK, fg=C.TEXT_PRIMARY).pack(side="left")
            tk.Spinbox(
                row, from_=1, to=20, textvariable=self._max_take,
                font=C.F_BODY, bg=C.BG_MID, fg=C.TEXT_PRIMARY,
                buttonbackground=C.BG_CARD, width=5,
            ).pack(side="left", padx=10)
        else:
            self._limit_frame.pack_forget()

    # ── Preset application ────────────────────────────────────────
    def _apply_preset(self, data: dict) -> None:
        heaps = data["heaps"]
        if self._is_single:
            if self._heap_entries:
                self._heap_entries[0].delete(0, "end")
                self._heap_entries[0].insert(0, str(heaps[0]))
            if "max_take" in data:
                self._max_take.set(data["max_take"])
        else:
            self._num_heaps.set(len(heaps))
            self._rebuild_heap_inputs()
            for entry, size in zip(self._heap_entries, heaps):
                entry.delete(0, "end")
                entry.insert(0, str(size))

    # ── Start ─────────────────────────────────────────────────────
    def _start(self) -> None:
        # ── Validate heaps
        try:
            heaps = [int(e.get()) for e in self._heap_entries]
            if any(h <= 0 for h in heaps):
                raise ValueError
        except ValueError:
            messagebox.showerror("Invalid Input",
                                 "All heap sizes must be positive integers.",
                                 parent=self.app)
            return

        vc = self.app.state.variant_class
        max_take = self._max_take.get()

        # ── Build variant
        try:
            if issubclass(vc, _BOUNDED_VARIANTS):
                variant = vc(heaps, max_take=max_take)
            else:
                variant = vc(heaps)
        except Exception as exc:
            messagebox.showerror("Configuration Error", str(exc), parent=self.app)
            return

        # ── Build players
        p1_name = self._p1_name.get().strip() or "Player 1"
        p1 = HumanPlayer(p1_name)

        if self.app.state.vs_ai:
            p2 = AIPlayer(self.app.state.difficulty)
        else:
            p2_name = self._p2_name.get().strip() or "Player 2"
            p2 = HumanPlayer(p2_name)

        # ── Preserve scores across rematches (reset only on new game from menu)
        existing = self.app.state.players
        if existing and len(existing) == 2 and \
                existing[0].name == p1.name and existing[1].name == p2.name:
            p1._wins = existing[0].wins
            p2._wins = existing[1].wins

        # ── Update shared state
        self.app.state.variant   = variant
        self.app.state.players   = [p1, p2]
        self.app.state.current_idx = 0
        self.app.state.winner    = ""

        self.app.show("gameplay")
