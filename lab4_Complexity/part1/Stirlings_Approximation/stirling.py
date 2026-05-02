"""
Stirling's Approximation — Interactive Explorer
================================================
OOP implementation with matplotlib interactive visualization.

Formula:  n! ≈ √(2πn) · (n/e)^n
Log form: ln(n!) ≈ n·ln(n) − n + ½·ln(2πn)

Requirements: matplotlib, numpy  (pip install matplotlib numpy)
Run:          python stirling.py
"""

import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.widgets import Slider


# ─────────────────────────────────────────────────────────────────────────────
class StirlingApproximation:
    """
    Encapsulates Stirling's approximation logic and interactive visualization.

    All heavy computations are done in log-space to stay numerically stable
    for large n (avoiding floating-point overflow of n! itself).
    """

    # ── Pure maths ──────────────────────────────────────────────────────────

    def exact_log_factorial(self, n: int) -> float:
        """ln(n!) via math.lgamma — exact for all non-negative integers."""
        return math.lgamma(n + 1)

    def stirling_log(self, n: int) -> float:
        """
        Stirling's approximation in log-space.

        ln(n!) ≈ n·ln(n) − n + ½·ln(2πn)

        This is the dominant term of Stirling's series.  The relative error
        shrinks as O(1/n), so for n ≥ 10 the formula is already < 0.84% off.
        """
        if n == 0:
            return 0.0
        return n * math.log(n) - n + 0.5 * math.log(2.0 * math.pi * n)

    def relative_error_percent(self, n: int) -> float:
        """Relative error |ln(n!) − Stirling| / |ln(n!)| × 100."""
        if n <= 1:
            return 0.0
        exact  = self.exact_log_factorial(n)
        approx = self.stirling_log(n)
        return abs(exact - approx) / abs(exact) * 100.0

    def ratio(self, n: int) -> float:
        """n! / Stirling(n) — converges to 1 from above as n → ∞."""
        if n == 0:
            return 1.0
        return math.exp(self.exact_log_factorial(n) - self.stirling_log(n))

    # ── Batch computation ────────────────────────────────────────────────────

    def compute_range(self, n_max: int) -> dict:
        """Return arrays for n=1..n_max: exact_log, stirling_log, error, ratio."""
        ns = np.arange(1, n_max + 1)
        exact_logs    = np.array([self.exact_log_factorial(n) for n in ns])
        stirling_logs = np.array([self.stirling_log(n)        for n in ns])
        errors        = np.array([self.relative_error_percent(n) for n in ns])
        ratios        = np.array([self.ratio(n)                 for n in ns])
        return dict(ns=ns, exact_logs=exact_logs, stirling_logs=stirling_logs,
                    errors=errors, ratios=ratios)

    # ── Display helpers ──────────────────────────────────────────────────────

    def format_factorial(self, n: int) -> str:
        """Human-readable n! — exact for n ≤ 20, scientific notation beyond."""
        if n <= 20:
            return f"{math.factorial(n):,}"
        log10_val = self.exact_log_factorial(n) / math.log(10)
        digits = int(log10_val) + 1
        return f"~10^{int(log10_val):.0f}  ({digits:,} digits)"

    def format_stirling(self, n: int) -> str:
        """Scientific notation for Stirling's estimate."""
        if n == 0:
            return "1.000000e+00"
        return f"{math.exp(self.stirling_log(n)):.6e}"

    # ── Visualization ────────────────────────────────────────────────────────

    def visualize(self) -> None:
        """Launch the interactive Stirling's Approximation Explorer."""

        # ── Figure & layout ──────────────────────────────────────────────
        fig = plt.figure(figsize=(16, 9))
        fig.patch.set_facecolor("#1a1a2e")

        gs = gridspec.GridSpec(
            2, 3, figure=fig,
            hspace=0.50, wspace=0.38,
            top=0.88, bottom=0.20, left=0.07, right=0.97,
        )
        ax_log   = fig.add_subplot(gs[0, 0:2])
        ax_err   = fig.add_subplot(gs[1, 0])
        ax_ratio = fig.add_subplot(gs[1, 1])
        ax_info  = fig.add_subplot(gs[:, 2])

        DARK = "#0f0f23"
        for ax in [ax_log, ax_err, ax_ratio, ax_info]:
            ax.set_facecolor(DARK)
            for sp in ax.spines.values():
                sp.set_color("#2a2a4a")

        ax_info.axis("off")

        fig.suptitle(
            "Stirling's Approximation — Interactive Explorer",
            fontsize=15, fontweight="bold", color="#e0e0ff", y=0.95,
        )

        # ── Initial data ─────────────────────────────────────────────────
        N_INIT = 60
        d = self.compute_range(N_INIT)

        tick_kw = dict(colors="#9090b0")

        # Plot 1 – ln(n!) vs Stirling
        (l_exact,)    = ax_log.plot(d["ns"], d["exact_logs"],    color="#00d4ff", lw=2,
                                    label="ln(n!)  exact")
        (l_stirling,) = ax_log.plot(d["ns"], d["stirling_logs"], color="#ff6b6b", lw=2,
                                    ls="--", label="Stirling's ln")
        ax_log.set_title("ln(n!) — Exact vs Stirling's Approximation",
                         color="#c8c8ff", fontsize=11)
        ax_log.set_xlabel("n", color="#9090b0")
        ax_log.set_ylabel("Value", color="#9090b0")
        ax_log.tick_params(**tick_kw)
        ax_log.legend(framealpha=0.2, labelcolor="#e0e0ff", fontsize=9)
        ax_log.grid(True, alpha=0.12)

        # Vertical highlight marker
        hl_log = ax_log.axvline(N_INIT, color="#ffd700", lw=1.4, ls=":", alpha=0.8)

        # Plot 2 – Relative error
        (l_err,) = ax_err.plot(d["ns"], d["errors"], color="#ffd93d", lw=2)
        ax_err.set_title("Relative Error (%)", color="#c8c8ff", fontsize=11)
        ax_err.set_xlabel("n", color="#9090b0")
        ax_err.set_ylabel("Error %", color="#9090b0")
        ax_err.tick_params(**tick_kw)
        ax_err.grid(True, alpha=0.12)
        hl_err = ax_err.axvline(N_INIT, color="#ffd700", lw=1.4, ls=":", alpha=0.8)

        # Plot 3 – Ratio
        (l_ratio,) = ax_ratio.plot(d["ns"], d["ratios"], color="#6bcb77", lw=2)
        ax_ratio.axhline(1.0, color="white", lw=1, ls="--", alpha=0.3)
        ax_ratio.set_title("Ratio  n! / Stirling(n)", color="#c8c8ff", fontsize=11)
        ax_ratio.set_xlabel("n", color="#9090b0")
        ax_ratio.set_ylabel("Ratio", color="#9090b0")
        ax_ratio.tick_params(**tick_kw)
        ax_ratio.grid(True, alpha=0.12)

        # ── Info panel ───────────────────────────────────────────────────
        def refresh_info(n_h: int) -> None:
            ax_info.clear()
            ax_info.axis("off")
            lines = [
                f"  n = {n_h}",
                "",
                "  n! (exact):",
                f"  {self.format_factorial(n_h)}",
                "",
                "  Stirling ≈:",
                f"  {self.format_stirling(n_h)}",
                "",
                f"  ln(n!) exact : {self.exact_log_factorial(n_h):.5f}",
                f"  Stirling ln  : {self.stirling_log(n_h):.5f}",
                "",
                f"  Rel. error   : {self.relative_error_percent(n_h):.6f}%",
                f"  Ratio n!/S(n): {self.ratio(n_h):.8f}",
                "",
                "━" * 30,
                "",
                "  THE FORMULA",
                "",
                "  n! ≈ √(2πn) · (n/e)ⁿ",
                "",
                "  ln(n!) ≈ n·ln(n) − n",
                "         + ½·ln(2πn)",
                "",
                "━" * 30,
                "",
                "  CS IMPORTANCE",
                "",
                "  • Algorithm complexity",
                "    (permutation / sort bounds)",
                "  • Information theory:",
                "    entropy H = Σ p·log(1/p)",
                "  • Combinatorics — binomial",
                "    coefficient bounds",
                "  • Compiler optimisation",
                "    (decision-tree lower bounds)",
                "  • Machine learning:",
                "    log-likelihood, softmax",
                "  • Coding theory:",
                "    channel capacity",
            ]
            ax_info.text(
                0.04, 0.97, "\n".join(lines),
                transform=ax_info.transAxes,
                va="top", ha="left", fontsize=8.5,
                fontfamily="monospace", color="#e0e0ff",
                bbox=dict(boxstyle="round,pad=0.7",
                          facecolor="#0d0d22", alpha=0.92,
                          edgecolor="#00d4ff", lw=1.2),
            )

        refresh_info(N_INIT)

        # ── Sliders ──────────────────────────────────────────────────────
        sl_fc = "#0d0d22"

        ax_s_nmax = plt.axes([0.10, 0.10, 0.58, 0.025])
        ax_s_nmax.set_facecolor(sl_fc)
        s_nmax = Slider(ax_s_nmax, "n max", 5, 300, valinit=N_INIT, valstep=1,
                        color="#00d4ff", initcolor="#00d4ff")
        s_nmax.label.set_color("#e0e0ff")
        s_nmax.valtext.set_color("#e0e0ff")

        ax_s_nh = plt.axes([0.10, 0.055, 0.58, 0.025])
        ax_s_nh.set_facecolor(sl_fc)
        s_nh = Slider(ax_s_nh, "highlight n", 1, N_INIT, valinit=N_INIT, valstep=1,
                      color="#ffd700", initcolor="#ffd700")
        s_nh.label.set_color("#e0e0ff")
        s_nh.valtext.set_color("#e0e0ff")

        # ── Callbacks ────────────────────────────────────────────────────
        def on_nmax(val):
            n_max = int(s_nmax.val)
            dd = self.compute_range(n_max)
            l_exact.set_data(dd["ns"], dd["exact_logs"])
            l_stirling.set_data(dd["ns"], dd["stirling_logs"])
            l_err.set_data(dd["ns"], dd["errors"])
            l_ratio.set_data(dd["ns"], dd["ratios"])
            for ax in [ax_log, ax_err, ax_ratio]:
                ax.relim()
                ax.autoscale_view()
            n_h = min(int(s_nh.val), n_max)
            s_nh.valmax = n_max
            hl_log.set_xdata([n_h, n_h])
            hl_err.set_xdata([n_h, n_h])
            refresh_info(n_h)
            fig.canvas.draw_idle()

        def on_nh(val):
            n_h = int(s_nh.val)
            hl_log.set_xdata([n_h, n_h])
            hl_err.set_xdata([n_h, n_h])
            refresh_info(n_h)
            fig.canvas.draw_idle()

        s_nmax.on_changed(on_nmax)
        s_nh.on_changed(on_nh)

        # ── Bottom caption ───────────────────────────────────────────────
        fig.text(
            0.5, 0.01,
            "FUN FACT: For n=100, Stirling is already accurate to 0.0083%  |  "
            "James Stirling published this in 'Methodus Differentialis' (1730)  |  "
            "ln(n!) grows as n·ln(n) — the key to proving comparison-sort Ω(n log n)",
            ha="center", fontsize=8, color="#a0a0c0", style="italic",
            bbox=dict(facecolor="#0d0d22", alpha=0.75, edgecolor="#2a2a5a"),
        )

        plt.show()


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    StirlingApproximation().visualize()
