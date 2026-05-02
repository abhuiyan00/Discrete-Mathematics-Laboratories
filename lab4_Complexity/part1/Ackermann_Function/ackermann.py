"""
Ackermann Function — Interactive Explorer
==========================================
OOP implementation with memoization and matplotlib interactive visualization.

Definition:
    A(0, n) = n + 1
    A(m, 0) = A(m−1, 1)          when m > 0
    A(m, n) = A(m−1, A(m, n−1))  when m > 0 and n > 0

Requirements: matplotlib, numpy  (pip install matplotlib numpy)
Run:          python ackermann.py
"""

import math
import sys
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.colors import LogNorm
from matplotlib.widgets import Slider

sys.setrecursionlimit(500_000)   # needed for A(3,13) and A(4,1)


# ─────────────────────────────────────────────────────────────────────────────
class AckermannFunction:
    """
    Implements the Ackermann function with memoization.

    Key properties encoded here:
      • m=0 → linear  (n+1)
      • m=1 → linear  (n+2)
      • m=2 → linear  (2n+3)
      • m=3 → exponential  (2^(n+3) − 3)
      • m=4 → power-tower  (grows beyond any primitive recursive function)

    A(4,2) = 2^65536 − 3  ≈ 10^19,728 — larger than atoms in the universe.
    """

    # Curated facts shown in the info panel
    FACTS = {
        (0, 0): "A(0,0) = 1\nBase case: just the successor function.",
        (1, 0): "A(1,0) = 2\nm=1 row: A(1,n) = n+2  (adds 2).",
        (1, 1): "A(1,1) = 3\nm=1 always grows linearly.",
        (2, 0): "A(2,0) = 3\nm=2 row: A(2,n) = 2n+3  (doubles + 3).",
        (2, 2): "A(2,2) = 7\nStill perfectly manageable.",
        (3, 0): "A(3,0) = 5\nm=3 row: A(3,n) = 2^(n+3) − 3 — exponential!",
        (3, 3): "A(3,3) = 61\n2^(3+3) − 3 = 64 − 3 = 61.",
        (3, 6): "A(3,6) = 509\n2^9 − 3 = 509.  Still printable!",
        (4, 0): "A(4,0) = 13\nFirst step on the m=4 tower.",
        (4, 1): (
            "A(4,1) = 65,533\n"
            "= A(3,13) = 2^16 − 3.\n"
            "Already larger than most everyday numbers."
        ),
        (4, 2): (
            "A(4,2) = 2^65,536 − 3\n"
            "This number has 19,728 decimal digits.\n"
            "The observable universe has ~10^80 atoms.\n"
            "A(4,2) ≈ 10^19,728 — incomprehensibly larger!\n"
            "Python computed it in milliseconds via 2**65536−3."
        ),
    }

    def __init__(self) -> None:
        self._cache: dict[tuple[int, int], int] = {}

    # ── Core computation ─────────────────────────────────────────────────────

    def compute(self, m: int, n: int) -> int:
        """
        Compute A(m, n) with top-down memoization.
        Raises RecursionError for values that exceed Python's stack.
        """
        key = (m, n)
        if key in self._cache:
            return self._cache[key]
        if m == 0:
            result = n + 1
        elif n == 0:
            result = self.compute(m - 1, 1)
        else:
            result = self.compute(m - 1, self.compute(m, n - 1))
        self._cache[key] = result
        return result

    def compute_safe(self, m: int, n: int):
        """
        Return A(m,n) or None if computation is infeasible.

        A(4,2) is computed directly via 2**65536 − 3 (Python big-int, instant).
        A(4,n) for n≥3 and A(m,n) for m≥5 are returned as None.
        """
        if m == 4 and n == 2:
            return 2 ** 65536 - 3          # direct — no recursion needed
        if (m == 4 and n >= 3) or m >= 5:
            return None
        try:
            return self.compute(m, n)
        except (RecursionError, MemoryError):
            return None

    # ── Introspection helpers ────────────────────────────────────────────────

    def count_calls(self, m: int, n: int) -> int:
        """Count total recursive invocations (with local memoization)."""
        counter = [0]
        local: dict = {}

        def _ack(mm: int, nn: int) -> int:
            counter[0] += 1
            key = (mm, nn)
            if key in local:
                return local[key]
            if mm == 0:
                r = nn + 1
            elif nn == 0:
                r = _ack(mm - 1, 1)
            else:
                r = _ack(mm - 1, _ack(mm, nn - 1))
            local[key] = r
            return r

        try:
            _ack(m, n)
        except RecursionError:
            return -1
        return counter[0]

    def formula_str(self, m: int) -> str:
        """Closed-form expression for row m."""
        return {
            0: "A(0,n) = n + 1",
            1: "A(1,n) = n + 2",
            2: "A(2,n) = 2n + 3",
            3: "A(3,n) = 2^(n+3) − 3",
            4: "A(4,n) — iterated exponential tower",
        }.get(m, "A(m,n) — beyond primitive recursive")

    def display_value(self, m: int, n: int) -> str:
        """Return a human-readable string for A(m,n)."""
        val = self.compute_safe(m, n)
        if val is None:
            return "∞  (beyond compute)"
        if val > 10 ** 30:
            digits = int(math.log10(2) * 65536) + 1   # 19728 for A(4,2)
            return f"2^65,536 − 3\n({digits:,} decimal digits)"
        if val > 10 ** 15:
            digits = len(str(val))
            return f"~10^{digits - 1}  ({digits} digits)"
        return f"{val:,}"

    # ── Heatmap data ─────────────────────────────────────────────────────────

    def build_heatmap(self, m_max: int = 4, n_max: int = 8) -> np.ndarray:
        """Grid of A(m,n) values capped at 10^15 for colour mapping."""
        grid = np.full((m_max + 1, n_max + 1), np.nan)
        for m in range(m_max + 1):
            for n in range(n_max + 1):
                v = self.compute_safe(m, n)
                if v is not None:
                    grid[m, n] = float(min(v, 10 ** 15))
        return grid

    # ── Visualization ─────────────────────────────────────────────────────────

    def visualize(self) -> None:
        """Launch the interactive Ackermann Function Explorer."""

        # ── Figure & layout ──────────────────────────────────────────────
        fig = plt.figure(figsize=(17, 9))
        fig.patch.set_facecolor("#0d0d1a")

        gs = gridspec.GridSpec(
            2, 3, figure=fig,
            hspace=0.50, wspace=0.40,
            top=0.88, bottom=0.20, left=0.07, right=0.97,
        )
        ax_heat    = fig.add_subplot(gs[0, 0])
        ax_growth  = fig.add_subplot(gs[0, 1])
        ax_calls   = fig.add_subplot(gs[1, 0])
        ax_formula = fig.add_subplot(gs[1, 1])
        ax_info    = fig.add_subplot(gs[:, 2])

        DARK = "#0d1117"
        for ax in [ax_heat, ax_growth, ax_calls, ax_formula, ax_info]:
            ax.set_facecolor(DARK)
            for sp in ax.spines.values():
                sp.set_color("#21262d")

        ax_info.axis("off")
        ax_formula.axis("off")

        fig.suptitle(
            "Ackermann Function — Interactive Explorer",
            fontsize=15, fontweight="bold", color="#c9d1d9", y=0.95,
        )

        COLORS = ["#58a6ff", "#3fb950", "#ff7b72", "#d2a8ff", "#ffa657"]
        tick_kw = dict(colors="#8b949e")

        # ── Heatmap ──────────────────────────────────────────────────────
        grid = self.build_heatmap(4, 8)
        safe_grid = np.where(np.isnan(grid) | (grid <= 0), 1.0, grid)

        im = ax_heat.imshow(
            safe_grid, cmap="plasma", norm=LogNorm(),
            aspect="auto", origin="lower",
        )
        ax_heat.set_title("A(m,n) Heatmap (log colour scale)", color="#c9d1d9", fontsize=10)
        ax_heat.set_xlabel("n", color="#8b949e")
        ax_heat.set_ylabel("m", color="#8b949e")
        ax_heat.tick_params(**tick_kw)
        ax_heat.set_xticks(range(9))
        ax_heat.set_yticks(range(5))
        ax_heat.set_xticklabels([str(i) for i in range(9)], color="#8b949e", fontsize=8)
        ax_heat.set_yticklabels([str(i) for i in range(5)], color="#8b949e", fontsize=8)

        for m in range(5):
            for n in range(9):
                v = self.compute_safe(m, n)
                if v is not None:
                    if v > 10 ** 6:
                        lbl = f"10^{int(math.log10(float(min(v, 10**15))))}"
                    else:
                        lbl = str(v)
                else:
                    lbl = "∞"
                ax_heat.text(n, m, lbl, ha="center", va="center",
                             fontsize=5.5, color="white", fontweight="bold")

        cbar = plt.colorbar(im, ax=ax_heat, pad=0.02)
        cbar.ax.yaxis.label.set_color("#c9d1d9")
        cbar.ax.tick_params(colors="#8b949e", labelsize=7)

        # Highlight rectangle (updated by slider)
        init_m, init_n = 2, 2
        hl_rect = plt.Rectangle(
            (init_n - 0.5, init_m - 0.5), 1, 1,
            fill=False, edgecolor="#ffd700", lw=2.5, zorder=5,
        )
        ax_heat.add_patch(hl_rect)

        # ── Growth chart ─────────────────────────────────────────────────
        n_range = list(range(9))
        for m in range(5):
            xs, ys = [], []
            for n in n_range:
                v = self.compute_safe(m, n)
                if v is not None and v < 10 ** 12:
                    xs.append(n)
                    ys.append(float(v))
            if ys:
                ax_growth.plot(xs, ys, "o-", color=COLORS[m], lw=2, ms=5,
                               label=f"m={m}")

        ax_growth.set_yscale("log")
        ax_growth.set_title("Growth by m  (log scale, capped 10^12)",
                            color="#c9d1d9", fontsize=10)
        ax_growth.set_xlabel("n", color="#8b949e")
        ax_growth.set_ylabel("A(m,n)", color="#8b949e")
        ax_growth.tick_params(**tick_kw)
        ax_growth.legend(labelcolor="#c9d1d9", framealpha=0.15, fontsize=9)
        ax_growth.grid(True, alpha=0.10)

        # ── Recursive call count chart ────────────────────────────────────
        for m in range(4):
            xs, ys = [], []
            for n in range(8):
                c = self.count_calls(m, n)
                if 0 < c < 10 ** 9:
                    xs.append(n)
                    ys.append(c)
            if ys:
                ax_calls.plot(xs, ys, "o-", color=COLORS[m], lw=2, ms=5,
                              label=f"m={m}")

        ax_calls.set_yscale("log")
        ax_calls.set_title("Recursive Calls Required  (log scale)",
                           color="#c9d1d9", fontsize=10)
        ax_calls.set_xlabel("n", color="#8b949e")
        ax_calls.set_ylabel("# calls", color="#8b949e")
        ax_calls.tick_params(**tick_kw)
        ax_calls.legend(labelcolor="#c9d1d9", framealpha=0.15, fontsize=9)
        ax_calls.grid(True, alpha=0.10)

        # ── Formula / CS panel ───────────────────────────────────────────
        formula_text = (
            "  CLOSED-FORM EXPRESSIONS\n\n"
            "  m=0 : A(0,n)  = n + 1\n"
            "  m=1 : A(1,n)  = n + 2\n"
            "  m=2 : A(2,n)  = 2n + 3\n"
            "  m=3 : A(3,n)  = 2^(n+3) − 3\n"
            "  m=4 : A(4,n)  = iterated exp tower\n\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            "  WHY IT MATTERS IN CS\n\n"
            "  • NOT primitive recursive —\n"
            "    surpasses all loop programs\n"
            "  • Inverse α(n) appears in\n"
            "    Tarjan's Union-Find: α(n)≤4\n"
            "    for any practical universe!\n"
            "  • Computability theory proof\n"
            "    (Ackermann 1928)\n"
            "  • Measures complexity classes\n"
            "  • Benchmark for recursion\n"
            "    depth / memoization"
        )
        ax_formula.text(
            0.04, 0.97, formula_text,
            transform=ax_formula.transAxes,
            va="top", ha="left", fontsize=8.5,
            fontfamily="monospace", color="#c9d1d9",
            bbox=dict(boxstyle="round,pad=0.6", facecolor="#161b22",
                      alpha=0.92, edgecolor="#58a6ff", lw=1.2),
        )

        # ── Info panel (slider-driven) ────────────────────────────────────
        def refresh_info(m: int, n: int) -> None:
            ax_info.clear()
            ax_info.axis("off")

            val_str  = self.display_value(m, n)
            fact     = self.FACTS.get((m, n), "")
            calls    = self.count_calls(m, n) if not (m == 4 and n >= 2) else None
            calls_str = f"{calls:,}" if calls is not None and calls >= 0 else "too many"

            lines = [
                f"  A({m}, {n})",
                "",
                "  Value:",
                f"  {val_str}",
                "",
                "  Recursive calls:",
                f"  {calls_str}",
                "",
                "  Row formula:",
                f"  {self.formula_str(m)}",
            ]
            if fact:
                lines += ["", "━" * 28, "", "  FACT:", ""]
                for fl in fact.split("\n"):
                    lines.append(f"  {fl}")

            ax_info.text(
                0.04, 0.97, "\n".join(lines),
                transform=ax_info.transAxes,
                va="top", ha="left", fontsize=8.5,
                fontfamily="monospace", color="#c9d1d9",
                bbox=dict(boxstyle="round,pad=0.7", facecolor="#161b22",
                          alpha=0.92, edgecolor="#3fb950", lw=1.2),
            )

        refresh_info(init_m, init_n)

        # ── Sliders ───────────────────────────────────────────────────────
        sl_fc = "#161b22"
        ax_sm = plt.axes([0.10, 0.10, 0.56, 0.025])
        ax_sn = plt.axes([0.10, 0.055, 0.56, 0.025])
        ax_sm.set_facecolor(sl_fc)
        ax_sn.set_facecolor(sl_fc)

        s_m = Slider(ax_sm, "m", 0, 4, valinit=init_m, valstep=1,
                     color="#58a6ff", initcolor="#58a6ff")
        s_n = Slider(ax_sn, "n", 0, 8, valinit=init_n, valstep=1,
                     color="#3fb950", initcolor="#3fb950")
        for s in (s_m, s_n):
            s.label.set_color("#c9d1d9")
            s.valtext.set_color("#c9d1d9")

        def on_slider(_val) -> None:
            m = int(s_m.val)
            n = int(s_n.val)
            hl_rect.set_xy((n - 0.5, m - 0.5))
            refresh_info(m, n)
            fig.canvas.draw_idle()

        s_m.on_changed(on_slider)
        s_n.on_changed(on_slider)

        # ── Bottom caption ────────────────────────────────────────────────
        fig.text(
            0.5, 0.005,
            "A(4,2) = 2^65,536−3 has 19,728 digits — far larger than atoms in the universe (~10^80)  |  "
            "A(4,3) is a power-tower of 2s that is A(4,2) levels tall  |  "
            "Inverse Ackermann α(n) ≤ 4 for every n you will ever encounter in practice",
            ha="center", fontsize=7.5, color="#ff7b72", style="italic",
            bbox=dict(facecolor="#161b22", alpha=0.75, edgecolor="#ff7b72"),
        )

        plt.show()


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    AckermannFunction().visualize()
