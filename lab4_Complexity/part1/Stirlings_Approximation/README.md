# Stirling's Approximation — Complete Reference

> **"The most useful approximation in all of combinatorics."**

---

## Table of Contents

1. [What Is Stirling's Approximation?](#what-is-stirlings-approximation)
2. [The Formula](#the-formula)
3. [Where Does It Come From?](#where-does-it-come-from)
4. [How Accurate Is It?](#how-accurate-is-it)
5. [Importance in Computer Science](#importance-in-computer-science)
6. [Interesting Facts](#interesting-facts)
7. [How to Run the Program](#how-to-run-the-program)
8. [Program Structure (OOP Design)](#program-structure-oop-design)
9. [Full Source Code](#full-source-code)

---

## What Is Stirling's Approximation?

The **factorial function** `n!` grows explosively:

| n  | n!                          |
|----|-----------------------------|
| 5  | 120                         |
| 10 | 3,628,800                   |
| 20 | 2,432,902,008,176,640,000   |
| 100| ~9.3 × 10^157               |
| 1000| ~4.0 × 10^2567             |

Computing `n!` exactly for large `n` is expensive and the raw number is too large to fit in any standard data type. **Stirling's approximation** gives a closed-form estimate that converges rapidly to the true value as `n` grows.

**James Stirling** (1692–1770) published this result in his 1730 book *Methodus Differentialis*. The approximation had also been discovered by Abraham de Moivre earlier, but Stirling refined and popularized it.

---

## The Formula

### Basic Form

```
n!  ≈  √(2πn) · (n/e)^n
```

where `e ≈ 2.71828...` is Euler's number and `π ≈ 3.14159...`.

### Logarithmic Form (numerically stable)

```
ln(n!)  ≈  n·ln(n) − n + ½·ln(2πn)
```

This is far more useful computationally — it avoids overflow and works for arbitrarily large `n`.

### Relative Error Bound

```
|ln(n!) − Stirling(n)| / |ln(n!)|  <  1 / (12n)
```

| n    | Relative Error |
|------|---------------|
| 1    | ~8.33%        |
| 5    | ~1.66%        |
| 10   | ~0.83%        |
| 100  | ~0.083%       |
| 1000 | ~0.0083%      |
| ∞    | → 0           |

The approximation becomes **better the larger `n` is** — ideal for asymptotic analysis.

### Full Stirling Series (higher-order terms)

```
ln(n!) = n·ln(n) − n + ½·ln(2πn) + 1/(12n) − 1/(360n³) + 1/(1260n⁵) − ...
```

The extra terms `1/(12n)`, `1/(360n³)`, ... are Bernoulli-number corrections. Most CS applications stop at the first term.

---

## Where Does It Come From?

Stirling's approximation is derived using the **Euler–Maclaurin formula**, which bridges discrete sums and continuous integrals.

Start from the definition:

```
ln(n!) = ln(1) + ln(2) + ... + ln(n) = Σ_{k=1}^{n} ln(k)
```

Approximate the sum by an integral:

```
Σ_{k=1}^{n} ln(k)  ≈  ∫₁ⁿ ln(x) dx  =  [x·ln(x) − x]₁ⁿ  =  n·ln(n) − n + 1
```

Add correction terms using the Euler–Maclaurin formula (½·ln(2πn) comes from the Gaussian integral around the peak of the integrand via Laplace's method). The result is exactly the Stirling formula.

---

## How Accurate Is It?

For `n = 100`:

```
100! (exact) = 9.332621544394415 × 10^157

Stirling:     9.324847625230687 × 10^157

Error:         ~0.083%
```

For `n = 1000`, the error drops below **0.0083%**.

The ratio `n! / Stirling(n)` converges to **1 from above**, meaning Stirling always slightly underestimates `n!`.

---

## Importance in Computer Science

### 1. Algorithm Complexity Analysis

The most critical application: **comparison-based sorting** requires at least `Ω(n log n)` comparisons. The proof uses Stirling:

```
Number of permutations = n!
Need at least log₂(n!) bits to distinguish them
log₂(n!) ≈ n·log₂(n) − n·log₂(e)  ≈  n·log₂(n)
```

This is why merge sort, heap sort, and quicksort are optimal — they achieve `O(n log n)` which matches the lower bound.

### 2. Information Theory and Entropy

Shannon entropy is:

```
H = −Σ p_i · log(p_i)
```

When computing the entropy of a uniform distribution over `n` items, `log(n!)` appears constantly. Stirling makes these calculations tractable.

### 3. Combinatorics and Binomial Coefficients

The central binomial coefficient:

```
C(2n, n) = (2n)! / (n!)²  ≈  4^n / √(πn)
```

derived using Stirling. This appears in:
- Dynamic programming (subset enumeration)
- Probabilistic algorithms
- Coding theory (Hamming bounds)

### 4. Machine Learning — Log-Likelihood

The log-likelihood of a multinomial distribution involves `log(n!)`. Stirling's formula is used in:
- Expectation-Maximization (EM) algorithm
- Variational inference
- Natural language processing (LDA topic models)

### 5. Statistical Physics (Boltzmann's Formula)

```
S = k_B · ln(Ω)
```

Boltzmann entropy uses `ln(N!)` where `N` is the number of particles (~10^23). Stirling is the **only** way to compute this.

### 6. Compiler Design — Decision Tree Lower Bounds

Any comparison-based sorting network needs depth `≥ log₂(n!) ≈ n·log₂(n)`. Stirling underpins this circuit complexity bound.

---

## Interesting Facts

- **James Stirling** published the approximation in 1730, but **Abraham de Moivre** discovered a weaker version in 1721.
- The factor `√(2π)` that appears in the formula is the **same** `2π` from Fourier analysis — both arise from Gaussian integrals.
- For `n = 10`, Stirling is already accurate to **8 significant figures**.
- The approximation is used inside most standard math libraries (GNU libc, Python's `math.lgamma`) to compute `log(Γ(n+1))` = `log(n!)` for large `n`.
- **Ramanujan's approximation** is even more accurate:
  ```
  n! ≈ √π · (n/e)^n · (8n³ + 4n² + n + 1/30)^(1/6)
  ```
- The infinite product form: `e = lim_{n→∞} n! · e^n / (n^n · √n)` is essentially a restatement of Stirling.

---

## How to Run the Program

### Requirements

```bash
pip install matplotlib numpy
```

### Run

```bash
python stirling.py
```

### Interactive Controls

| Slider      | What it does                                      |
|-------------|---------------------------------------------------|
| **n max**   | Sets the upper bound for n on all three plots     |
| **highlight n** | Selects a specific n to inspect in the info panel |

The info panel (right side) shows:
- Exact `n!` (or its scientific notation for large n)
- Stirling's estimate
- `ln(n!)` exact vs Stirling's log
- Relative error percentage
- Ratio `n! / Stirling(n)`

The yellow dashed vertical line on the first two plots tracks your highlighted `n`.

---

## Program Structure (OOP Design)

```
StirlingApproximation
│
├── exact_log_factorial(n)     → ln(n!) via math.lgamma  (exact)
├── stirling_log(n)            → Stirling's formula in log-space
├── relative_error_percent(n)  → % error between exact and Stirling
├── ratio(n)                   → n! / Stirling(n)  (→ 1 as n → ∞)
│
├── compute_range(n_max)       → dict of numpy arrays for 1..n_max
│
├── format_factorial(n)        → human-readable string for n!
├── format_stirling(n)         → scientific notation for Stirling value
│
└── visualize()                → launches matplotlib interactive figure
```

All math is done in **log-space** (`stirling_log`, `exact_log_factorial`) to avoid floating-point overflow for large `n`. The exponential is only taken when needed for display or ratio computation.

---

## Full Source Code

```python
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


class StirlingApproximation:
    """
    Encapsulates Stirling's approximation logic and interactive visualization.

    All heavy computations are done in log-space to stay numerically stable
    for large n (avoiding floating-point overflow of n! itself).
    """

    def exact_log_factorial(self, n: int) -> float:
        """ln(n!) via math.lgamma — exact for all non-negative integers."""
        return math.lgamma(n + 1)

    def stirling_log(self, n: int) -> float:
        """
        Stirling's approximation in log-space.
        ln(n!) ≈ n·ln(n) − n + ½·ln(2πn)
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

    def compute_range(self, n_max: int) -> dict:
        """Return arrays for n=1..n_max."""
        ns = np.arange(1, n_max + 1)
        exact_logs    = np.array([self.exact_log_factorial(n) for n in ns])
        stirling_logs = np.array([self.stirling_log(n)        for n in ns])
        errors        = np.array([self.relative_error_percent(n) for n in ns])
        ratios        = np.array([self.ratio(n)                 for n in ns])
        return dict(ns=ns, exact_logs=exact_logs, stirling_logs=stirling_logs,
                    errors=errors, ratios=ratios)

    def format_factorial(self, n: int) -> str:
        if n <= 20:
            return f"{math.factorial(n):,}"
        log10_val = self.exact_log_factorial(n) / math.log(10)
        digits = int(log10_val) + 1
        return f"~10^{int(log10_val):.0f}  ({digits:,} digits)"

    def format_stirling(self, n: int) -> str:
        if n == 0:
            return "1.000000e+00"
        return f"{math.exp(self.stirling_log(n)):.6e}"

    def visualize(self) -> None:
        """Launch the interactive Stirling's Approximation Explorer."""
        # [See stirling.py for the full visualization code]
        pass


if __name__ == "__main__":
    StirlingApproximation().visualize()
```

> **Note:** The `visualize()` method body above is abbreviated for readability. Run `stirling.py` for the full interactive experience.

---

*References: Stirling, J. (1730). Methodus Differentialis. · Flajolet & Sedgewick, Analytic Combinatorics (2009). · Knuth, D. The Art of Computer Programming, Vol. 1.*
