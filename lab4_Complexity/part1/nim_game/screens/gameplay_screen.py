"""gameplay_screen.py – Interactive game board with heap visualisation."""

from __future__ import annotations
import tkinter as tk
from typing import Optional, List, TYPE_CHECKING

from screens.base_screen import BaseScreen
from utils import constants as C

if TYPE_CHECKING:
    from app import App

# ── Visual constants ──────────────────────────────────────────────
_SR       = 14    # stone radius (px)
_GAP      = 4     # gap between stones
_ROW_MAX  = 5     # max stones per row in a heap column
_MAX_DISP = 25    # max stones shown per heap ("+n more" label added above)
_COL_H    = 320   # canvas height


class GameplayScreen(BaseScreen):
    def __init__(self, parent: tk.Widget, app: "App") -> None:
        super().__init__(parent, app)
        self._sel_heap: Optional[int] = None
        self._amount   = tk.IntVar(value=1)
        self._info_var = tk.StringVar(value="")
        self._turn_var = tk.StringVar(value="")
        self.build()

    # ── Build (once) ──────────────────────────────────────────────
    def build(self) -> None:
        # ── Turn banner
        banner = tk.Frame(self, bg=C.BG_MID)
        banner.pack(fill="x")
        tk.Label(banner, textvariable=self._turn_var,
                 font=C.F_HEADING, bg=C.BG_MID, fg=C.TEXT_PRIMARY,
                 pady=10).pack()

        # ── Heap canvas
        self._canvas = tk.Canvas(self, bg=C.BG_DARK,
                                  highlightthickness=0, height=_COL_H)
        self._canvas.pack(fill="x", padx=C.PAD, pady=(12, 4))

        # ── Control strip
        ctrl = tk.Frame(self, bg=C.BG_MID)
        ctrl.pack(fill="x", padx=C.PAD, pady=4)

        tk.Label(ctrl, textvariable=self._info_var,
                 font=C.F_BODY, bg=C.BG_MID, fg=C.TEXT_SEC,
                 pady=6).pack()

        take_row = tk.Frame(ctrl, bg=C.BG_MID)
        take_row.pack(pady=6)

        tk.Label(take_row, text="Take:", font=C.F_BODY,
                 bg=C.BG_MID, fg=C.TEXT_PRIMARY).pack(side="left", padx=8)

        self._dec = tk.Button(take_row, text=" − ", font=C.F_SUBHEAD,
                               bg=C.BG_DARK, fg=C.TEXT_PRIMARY, bd=0,
                               cursor="hand2", command=self._dec_amount)
        self._dec.pack(side="left")

        tk.Label(take_row, textvariable=self._amount,
                 font=C.F_NUM, bg=C.BG_MID, fg=C.ACCENT, width=4).pack(side="left")

        self._inc = tk.Button(take_row, text=" + ", font=C.F_SUBHEAD,
                               bg=C.BG_DARK, fg=C.TEXT_PRIMARY, bd=0,
                               cursor="hand2", command=self._inc_amount)
        self._inc.pack(side="left")

        self._take_btn = self.make_btn(
            take_row, "Take Stones", self._human_take, width=16,
        )
        self._take_btn.pack(side="left", padx=20)

        # ── Game log
        log_wrap = tk.Frame(self, bg=C.BG_DARK)
        log_wrap.pack(fill="both", expand=True,
                      padx=C.PAD, pady=(6, 10))

        tk.Label(log_wrap, text="Game Log", font=C.F_SMALL,
                 bg=C.BG_DARK, fg=C.TEXT_MUTED).pack(anchor="w")

        self._log = tk.Text(log_wrap, height=7, font=C.F_SMALL,
                             bg=C.BG_MID, fg=C.TEXT_SEC,
                             state="disabled", bd=0,
                             relief="flat", wrap="word", padx=8, pady=4)
        log_scroll = tk.Scrollbar(log_wrap, command=self._log.yview,
                                   bg=C.BG_MID)
        self._log.configure(yscrollcommand=log_scroll.set)
        log_scroll.pack(side="right", fill="y")
        self._log.pack(fill="both", expand=True)

    # ── Lifecycle ─────────────────────────────────────────────────
    def on_show(self) -> None:
        self._sel_heap = None
        self._amount.set(1)
        self._clear_log()
        self._refresh()

    # ── Core refresh ──────────────────────────────────────────────
    def _refresh(self) -> None:
        player = self.app.state.current_player()
        self._turn_var.set(f"  {player.name}'s Turn")
        self._draw_heaps()
        self._update_controls()

        if not player.is_human():
            self._turn_var.set(f"  {player.name} is thinking…")
            self.after(900, self._ai_turn)

    # ── Heap drawing ──────────────────────────────────────────────
    def _draw_heaps(self) -> None:
        self._canvas.delete("all")
        heaps = self.app.state.variant.heaps
        n = len(heaps)
        if n == 0:
            return

        # Wait until the canvas has been rendered so winfo_width() is valid
        self._canvas.update_idletasks()
        w = max(self._canvas.winfo_width(), 600)
        col_w = (w - 2 * C.PAD) // n
        d = _SR * 2

        for hi, count in enumerate(heaps):
            color  = C.HEAP_COLORS[hi % len(C.HEAP_COLORS)]
            cx     = C.PAD + hi * col_w + col_w // 2
            is_sel = (self._sel_heap == hi)

            # Column background
            bg_fill = C.BG_CARD if is_sel else C.BG_MID
            outline = color if is_sel else "#2a2a3a"
            bw      = 3 if is_sel else 1
            tag     = f"h{hi}"

            self._canvas.create_rectangle(
                cx - col_w // 2 + 6, 4,
                cx + col_w // 2 - 6, _COL_H - 4,
                fill=bg_fill, outline=outline, width=bw, tags=tag,
            )

            # Heap label (bottom)
            self._canvas.create_text(
                cx, _COL_H - 20,
                text=f"Heap {hi + 1}  ({count})",
                font=C.F_SMALL, fill=C.TEXT_SEC, tags=tag,
            )

            # Overflow indicator
            display = min(count, _MAX_DISP)
            if count > _MAX_DISP:
                self._canvas.create_text(
                    cx, 22, text=f"+{count - _MAX_DISP} more",
                    font=C.F_SMALL, fill=color, tags=tag,
                )
                start_y = 42
            else:
                start_y = _COL_H - 50

            # Draw stones bottom-up
            rows = (display + _ROW_MAX - 1) // _ROW_MAX
            for si in range(display):
                row_idx = si // _ROW_MAX
                col_idx = si % _ROW_MAX
                scols   = min(_ROW_MAX, display - row_idx * _ROW_MAX)
                sx = cx - (scols * (d + _GAP)) // 2 + col_idx * (d + _GAP) + _SR
                sy = _COL_H - 48 - row_idx * (d + _GAP)
                self._canvas.create_oval(
                    sx - _SR, sy - _SR, sx + _SR, sy + _SR,
                    fill=color if count > 0 else "#222244",
                    outline="", tags=tag,
                )

            # Greyed-out placeholder when heap is empty
            if count == 0:
                self._canvas.create_text(
                    cx, _COL_H // 2,
                    text="empty", font=C.F_SMALL,
                    fill=C.TEXT_MUTED, tags=tag,
                )

            # Click binding per heap tag
            self._canvas.tag_bind(tag, "<Button-1>",
                                   lambda _e, h=hi: self._select_heap(h))
            self._canvas.tag_bind(tag, "<Enter>",
                                   lambda _e, h=hi: self._hover_heap(h, True))
            self._canvas.tag_bind(tag, "<Leave>",
                                   lambda _e, h=hi: self._hover_heap(h, False))

    def _select_heap(self, hi: int) -> None:
        if not self.app.state.current_player().is_human():
            return
        if self.app.state.variant.heaps[hi] == 0:
            return
        self._sel_heap = hi
        self._amount.set(1)
        self._draw_heaps()
        self._update_controls()

    def _hover_heap(self, hi: int, entering: bool) -> None:
        if hi == self._sel_heap:
            return
        # Subtle highlight on hover (redraw would be expensive; just change rect fill)
        # We skip complex per-item hover to keep the code simple.

    # ── Controls ──────────────────────────────────────────────────
    def _update_controls(self) -> None:
        player = self.app.state.current_player()
        variant = self.app.state.variant

        if not player.is_human() or self._sel_heap is None:
            self._info_var.set(
                "Click a heap to select it." if player.is_human()
                else "Waiting for AI…"
            )
            self._take_btn.config(state="disabled")
            return

        hi       = self._sel_heap
        count    = variant.heaps[hi]
        max_take = variant.max_take_from(hi)
        amt      = max(1, min(self._amount.get(), max_take))
        self._amount.set(amt)
        self._info_var.set(
            f"Heap {hi + 1} selected  •  {count} stone{'s' if count != 1 else ''} "
            f"•  Take 1–{max_take}"
        )
        self._take_btn.config(state="normal")

    def _inc_amount(self) -> None:
        if self._sel_heap is None:
            return
        mx = self.app.state.variant.max_take_from(self._sel_heap)
        self._amount.set(min(self._amount.get() + 1, mx))

    def _dec_amount(self) -> None:
        self._amount.set(max(1, self._amount.get() - 1))

    # ── Move execution ────────────────────────────────────────────
    def _human_take(self) -> None:
        if self._sel_heap is None:
            return
        hi  = self._sel_heap
        amt = self._amount.get()
        if not self.app.state.variant.is_valid_move(hi, amt):
            self._log_add("⚠ Invalid move — try again.")
            return
        self._apply_move(hi, amt)

    def _ai_turn(self) -> None:
        player  = self.app.state.current_player()
        variant = self.app.state.variant
        move    = player.get_move(variant)
        if move:
            self._apply_move(*move)

    def _apply_move(self, hi: int, amt: int) -> None:
        player  = self.app.state.current_player()
        variant = self.app.state.variant
        variant.make_move(hi, amt)

        self._log_add(
            f"{player.name} took  {amt}  stone{'s' if amt != 1 else ''}  "
            f"from  Heap {hi + 1}."
        )

        self._sel_heap = None
        self._amount.set(1)

        if variant.is_game_over():
            other  = self.app.state.other_player()
            winner = variant.determine_winner(player.name, other.name)
            self.app.state.winner = winner
            # Credit the win
            for p in self.app.state.players:
                if p.name == winner:
                    p.add_win()
                    break
            self.after(300, lambda: self.app.show("result"))
        else:
            self.app.state.advance_turn()
            self._refresh()

    # ── Log ───────────────────────────────────────────────────────
    def _log_add(self, msg: str) -> None:
        self._log.config(state="normal")
        self._log.insert("end", msg + "\n")
        self._log.see("end")
        self._log.config(state="disabled")

    def _clear_log(self) -> None:
        self._log.config(state="normal")
        self._log.delete("1.0", "end")
        self._log.config(state="disabled")
