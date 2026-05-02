/* Full markdown content for all three modules — embedded verbatim from the .md files */
window.MD_CONTENT = {
stirling: `# Stirling's Approximation — Complete Reference

> **"The most useful approximation in all of combinatorics."**

---

## What Is Stirling's Approximation?

The **factorial function** \`n!\` grows explosively:

| n  | n!                          |
|----|-----------------------------|
| 5  | 120                         |
| 10 | 3,628,800                   |
| 20 | 2,432,902,008,176,640,000   |
| 100| ~9.3 × 10^157               |
| 1000| ~4.0 × 10^2567             |

Computing \`n!\` exactly for large \`n\` is expensive and the raw number is too large to fit in any standard data type. **Stirling's approximation** gives a closed-form estimate that converges rapidly to the true value as \`n\` grows.

**James Stirling** (1692–1770) published this result in his 1730 book *Methodus Differentialis*. The approximation had also been discovered by Abraham de Moivre earlier, but Stirling refined and popularized it.

---

## The Formula

### Basic Form

\`\`\`
n!  ≈  √(2πn) · (n/e)^n
\`\`\`

where \`e ≈ 2.71828...\` is Euler's number and \`π ≈ 3.14159...\`.

### Logarithmic Form (numerically stable)

\`\`\`
ln(n!)  ≈  n·ln(n) − n + ½·ln(2πn)
\`\`\`

This is far more useful computationally — it avoids overflow and works for arbitrarily large \`n\`.

### Relative Error Bound

\`\`\`
|ln(n!) − Stirling(n)| / |ln(n!)|  <  1 / (12n)
\`\`\`

| n    | Relative Error |
|------|---------------|
| 1    | ~8.33%        |
| 5    | ~1.66%        |
| 10   | ~0.83%        |
| 100  | ~0.083%       |
| 1000 | ~0.0083%      |
| ∞    | → 0           |

The approximation becomes **better the larger \`n\` is** — ideal for asymptotic analysis.

### Full Stirling Series (higher-order terms)

\`\`\`
ln(n!) = n·ln(n) − n + ½·ln(2πn) + 1/(12n) − 1/(360n³) + 1/(1260n⁵) − ...
\`\`\`

The extra terms \`1/(12n)\`, \`1/(360n³)\`, ... are Bernoulli-number corrections.

---

## Where Does It Come From?

Stirling's approximation is derived using the **Euler–Maclaurin formula**, which bridges discrete sums and continuous integrals.

\`\`\`
ln(n!) = ln(1) + ln(2) + ... + ln(n) = Σ_{k=1}^{n} ln(k)
\`\`\`

Approximate the sum by an integral:

\`\`\`
Σ_{k=1}^{n} ln(k)  ≈  ∫₁ⁿ ln(x) dx  =  n·ln(n) − n + 1
\`\`\`

Add correction terms using the Euler–Maclaurin formula. The ½·ln(2πn) comes from the Gaussian integral around the peak of the integrand via Laplace's method. The result is exactly the Stirling formula.

---

## How Accurate Is It?

For \`n = 100\`:

\`\`\`
100! (exact) = 9.332621544394415 × 10^157
Stirling:     9.324847625230687 × 10^157
Error:         ~0.083%
\`\`\`

For \`n = 1000\`, the error drops below **0.0083%**.

The ratio \`n! / Stirling(n)\` converges to **1 from above**, meaning Stirling always slightly underestimates \`n!\`.

---

## Importance in Computer Science

### 1. Algorithm Complexity Analysis

Comparison-based sorting requires at least \`Ω(n log n)\` comparisons:

\`\`\`
Number of permutations = n!
log₂(n!) ≈ n·log₂(n) − n·log₂(e)  ≈  n·log₂(n)
\`\`\`

This is why merge sort, heap sort, and quicksort are optimal — they match this lower bound.

### 2. Information Theory

Shannon entropy \`H = −Σ p_i · log(p_i)\`. Computing the entropy of a uniform distribution involves \`log(n!)\`. Stirling makes these calculations tractable.

### 3. Combinatorics

The central binomial coefficient \`C(2n, n) = (2n)! / (n!)² ≈ 4^n / √(πn)\`. Appears in DP, probabilistic algorithms, coding theory.

### 4. Machine Learning

Multinomial log-likelihood involves \`log(n!)\`. Used in EM, variational inference, LDA.

### 5. Statistical Physics

Boltzmann entropy \`S = k_B · ln(Ω)\` uses \`ln(N!)\` where \`N ~ 10^23\`. Stirling is the **only** way to compute this.

---

## Interesting Facts

- James Stirling published the approximation in 1730; de Moivre had a weaker version in 1721.
- The factor \`√(2π)\` is the same \`2π\` from Fourier analysis — both arise from Gaussian integrals.
- For \`n = 10\`, Stirling is already accurate to **8 significant figures**.
- Used inside most standard math libraries (libc, Python's \`math.lgamma\`).
- **Ramanujan's approximation** is even more accurate:
  \`\`\`
  n! ≈ √π · (n/e)^n · (8n³ + 4n² + n + 1/30)^(1/6)
  \`\`\`
- The infinite product form: \`e = lim_{n→∞} n! · e^n / (n^n · √n)\` is essentially a restatement of Stirling.

---

## Stirling Numbers of the Second Kind

\`S(n,k)\` counts the number of ways to partition an \`n\`-element set into \`k\` non-empty unlabeled blocks.

\`\`\`
S(n,k) = k · S(n−1,k) + S(n−1,k−1)
S(n,0) = [n=0],  S(n,n) = 1,  S(n,1) = 1
\`\`\`

The Bell number \`B(n) = Σ_k S(n,k)\` counts all partitions of an \`n\`-set.

---

*References: Stirling, J. (1730). Methodus Differentialis. · Flajolet & Sedgewick, Analytic Combinatorics (2009). · Knuth, D. The Art of Computer Programming, Vol. 1.*`,

ackermann: `# Ackermann Function — Complete Reference

> **"A function so fast-growing it escapes all loops — yet every value is finite."**

---

## What Is the Ackermann Function?

The **Ackermann function** \`A(m, n)\` was invented by **Wilhelm Ackermann** in 1928 as a counterexample to a conjecture by David Hilbert — that every "effectively computable" function is also **primitive recursive** (computable by a finite number of loops).

Ackermann's function is:
 **Total** — it terminates for all non-negative integers \`m\` and \`n\`.
 **Computable** — a finite algorithm can calculate any \`A(m, n)\`.
 **NOT primitive recursive** — no finite nesting of \`for\` loops can compute it.

This was a bombshell. It proved that the intuitive idea of "computation by loops" is strictly weaker than "computation by recursion."

---

## The Definition

\`\`\`
A(0, n) = n + 1                          if m = 0
A(m, 0) = A(m−1, 1)                      if m > 0,  n = 0
A(m, n) = A(m−1,  A(m, n−1))             if m > 0,  n > 0
\`\`\`

Three rules. Utterly simple to state. Catastrophically hard to evaluate for large \`m\`.

---

## Computing Values by Hand

### A(0, n) — Successor

\`\`\`
A(0, n) = n + 1
A(0, 0) = 1,  A(0, 5) = 6
\`\`\`

### A(1, n) — Addition

\`\`\`
A(1, n) = A(1, n−1) + 1 = n + 2
A(1, 4) = 6
\`\`\`

### A(2, n) — Multiplication

\`\`\`
A(2, n) = 2n + 3
A(2, 4) = 11
\`\`\`

### A(3, n) — Exponentiation

\`\`\`
A(3, n) = 2^(n+3) − 3
A(3, 0) = 5,  A(3, 1) = 13,  A(3, 13) = 65,533
\`\`\`

### A(4, n) — Tetration

\`\`\`
A(4, 0) = 13
A(4, 1) = 65,533
A(4, 2) = 2^65,536 − 3   (19,728 decimal digits)
A(4, 3) = power tower of 2s, A(4,2) levels tall
\`\`\`

\`A(4, 2)\` is so vast that even \`atoms_in_universe^(atoms_in_universe^...)\` repeated billions of times still doesn't reach it.

---

## Table of Values

| m \\ n | 0    | 1      | 2             | 3              | 4              |
|-------|------|--------|---------------|----------------|----------------|
| 0     | 1    | 2      | 3             | 4              | 5              |
| 1     | 2    | 3      | 4             | 5              | 6              |
| 2     | 3    | 5      | 7             | 9              | 11             |
| 3     | 5    | 13     | 29            | 61             | 125            |
| 4     | 13   | 65,533 | 2^65536 − 3   | unimaginable   | unimaginable   |

---

## Closed-Form Expressions

| m | Closed Form          | Growth Class       |
|---|----------------------|--------------------|
| 0 | \`n + 1\`              | Linear             |
| 1 | \`n + 2\`              | Linear             |
| 2 | \`2n + 3\`             | Linear             |
| 3 | \`2^(n+3) − 3\`        | Exponential        |
| 4 | tetration            | Super-exponential  |
| 5 | pentation            | Beyond imagination |

Each row grows asymptotically faster than any function in the row above.

---

## Why It Shattered Mathematics in 1928

Hilbert and Bernays conjectured every total computable function is primitive recursive. Ackermann proved them wrong.

He constructed \`A(m, n)\` and proved:

1. \`A(m, n)\` is **total** — terminates for all inputs.
2. \`A(m, n)\` is **computable** — explicit recursion.
3. \`A(m, n)\` **grows faster than any primitive recursive function** — for every PR \`f\`, ∃ \`m\` with \`A(m, n) > f(n)\` eventually.

\`\`\`
Primitive Recursive  ⊂  General Recursive  ⊆  Computable
\`\`\`

---

## Importance in Computer Science

### 1. Computability Theory

Canonical example of a total computable function that is not primitive recursive. Used in proof theory (Gentzen), hierarchies, termination proofs.

### 2. The Inverse Ackermann α(n)

\`\`\`
α(n) = min { m : A(m, m) ≥ n }
\`\`\`

Grows unimaginably slowly:

| n                | α(n) |
|------------------|------|
| 1                | 0    |
| 2                | 1    |
| 4                | 2    |
| 16               | 3    |
| 65,536           | 4    |
| 2^65,536         | 5    |
| A(5,5)           | 6    |

For every \`n\` you'll ever encounter, \`α(n) ≤ 4\`.

**Tarjan's Union-Find** has amortized \`O(α(n))\` per operation — essentially \`O(1)\` in practice but provably super-linear.

### 3. Compiler Optimisation

Appears in: register allocation, type inference (higher-rank polymorphism), loop optimization termination proofs.

### 4. Benchmark for Recursion

Standard test for recursion depth, memoization, tail-call elimination, termination checkers.

### 5. Program Verification

Termination of \`A(m, n)\` requires ordinal-valued measure — used in Coq, Agda, Lean, AProVE.

---

## Mind-Bending Facts

### Fact 1: A(4,2) vs the Universe

\`\`\`
Atoms in universe: ~10^80
A(4,2) ≈ 10^19,728
Ratio ≈ 10^19,648
\`\`\`

If every atom spawned its own universe, repeated 200 times, total atoms still < A(4,2).

### Fact 2: Python Computes A(4,2) Instantly

\`\`\`python
x = 2**65536 - 3   # < 1ms
print(len(str(x))) # 19728
\`\`\`

The recursion bottleneck — not big-int arithmetic — is what blocks recursive A(4,2).

### Fact 3: A(4,3) Cannot Be Written Down

\`A(4,3)\` is a power tower of 2s, A(4,2) levels tall. More levels than any human notation can express — including Knuth up-arrows or Conway chains.

### Fact 4: Every A(m,n) Is Finite

Despite this growth, every \`A(m,n)\` for finite \`m,n\` is a specific finite integer. You just can't write it down.

### Fact 5: Recursive Call Count Is Also Ackermann-Like

Without memoization:
- A(3, 3): 2,432 calls
- A(3, 6): 172,233 calls
- A(4, 1): Ackermann-level

### Fact 6: Inverse Ackermann Appears in More Places

- Chazelle's MST: \`O(m · α(m, n))\`
- Optimal offline dynamic connectivity
- Geometric data structure operations

---

## References

- Ackermann, W. (1928). Mathematische Annalen, 99, 118–133.
- Tarjan, R. E. (1975). JACM, 22(2), 215–225.
- Knuth, D. E. (1976). Science, 194, 1235–1242.
- Sipser, M. (2012). Introduction to the Theory of Computation.
- Chazelle, B. (2000). JACM, 47(6), 1028–1047.`,

nim: `# Nim Game — Complete Reference

> A two-player mathematical strategy game with deep Sprague–Grundy structure.

---

## 1. Project Overview

Nim is a two-player game where players alternate removing stones from heaps. Despite simple rules, every position has a deterministic optimal move via **Sprague–Grundy theory**.

This implementation provides:
- **4 variants** — Classic, Misère, Single-Pile, Bounded
- **3 AI levels** — Easy (8% optimal), Medium (55%), Hard (99%)
- **Configurable heaps** — multi-heap variants support up to 5 piles
- **Score tracking** across rematches

---

## 2. The Variants

### Classic Nim
- Multiple heaps. Take any positive number from one heap per turn.
- **Last to take WINS.**
- Strategy: nim-sum (XOR of heaps).

### Misère Nim
- Same rules as Classic, but **last to take LOSES.**
- Strategy: play Classic until heaps ≤ 1, then adjust parity.

### Single-Pile Nim
- One heap. Take 1 to K stones per turn.
- **Last to take WINS.**
- Strategy: leave a multiple of K+1.

### Bounded Nim
- Multi-heap with a per-turn take limit K.
- **Last to take WINS.**
- Strategy: Grundy nim-sum on \`heap mod (K+1)\`.

---

## 6. Game Logic & Math

### 6.1 Classic Nim (Sprague–Grundy / XOR)

**Theorem:** A position is a losing P-position iff the XOR of all heap sizes is 0.

\`\`\`
nim_sum = h1 XOR h2 XOR ... XOR hn
if nim_sum != 0:
  for each heap H:
    target = H XOR nim_sum
    if target < H:
      take (H - target) from this heap
\`\`\`

After this move, nim-sum becomes 0; opponent restores it to non-zero.

### 6.2 Misère Nim

Optimal differs from Classic only in the endgame (all heaps ≤ 1).

- **Mid-game:** play as Classic Nim, but if winning move produces all 1-heaps, ensure parity of 1s is **odd** for opponent (otherwise take entire heap).
- **Endgame:** take from any 1-heap. Parity decides the loser.

### 6.3 Single-Pile Nim

Key number: \`M = max_take + 1\`.

- **P-positions:** multiples of M.
- **Winning move:** take \`pile mod M\` stones.

\`\`\`
remainder = pile % (max_take + 1)
if remainder == 0: take 1   # forced bad move
else: take min(remainder, max_take)
\`\`\`

### 6.4 Bounded Nim

Generalises Single-Pile to multi-heap via Sprague–Grundy.

- Grundy of a heap: \`g(h) = h mod (K+1)\`
- Grundy nim-sum: \`G = g(h1) XOR g(h2) XOR ... XOR g(hn)\`
- **Winning move:** find heap \`i\` with \`g(hi) XOR G < g(hi)\`; remove \`g(hi) − (g(hi) XOR G)\`.

When \`K ≥ max(heaps)\`, Bounded reduces to Classic.

---

## 7. AI System

The AI is a **probabilistic mixer**:

\`\`\`python
if random.random() < optimal_prob:
    return variant.get_optimal_move()
return random.choice(valid_moves)
\`\`\`

| Level  | Optimal Prob | Player Win Rate |
|--------|--------------|-----------------|
| Easy   | 0.08 (8%)    | ~75%            |
| Medium | 0.55 (55%)   | ~40%            |
| Hard   | 0.99 (99%)   | ~1–2%           |

This produces naturally variable play — even Hard occasionally errs, preventing it from feeling robotic.

---

## 11. Mathematical Background

### Sprague–Grundy Theorem

Every impartial game under the normal play convention is equivalent to a Nim heap of some size — its **Grundy value**. The game is a win for the moving player iff the XOR of all component Grundy values is non-zero.

This single theorem solves an entire class of combinatorial games — anyone who ever played, ever, was unknowingly XORing.

### Grundy Numbers

For a position \`P\`:
\`\`\`
G(P) = mex { G(Q) : Q is reachable from P }
\`\`\`

\`mex\` is the **minimum excludant** — smallest non-negative integer not in the set.

For a Nim heap of size \`n\`: \`G(n) = n\`.
For Bounded Nim with limit K: \`G(n) = n mod (K+1)\`.

### Why XOR?

XOR is the operation under which Grundy numbers compose for **disjunctive sums** of games. If you can move in any one component, the combined Grundy value is the XOR of components.

### Bouton's Original 1901 Result

Charles Bouton solved Classic Nim before Sprague–Grundy theory existed — proving the XOR characterisation directly. This was the first complete mathematical solution of a non-trivial game.

---

## 12. Strategy Tips

1. **Compute the nim-sum mentally**: practise XOR-ing 3-bit numbers until it's automatic.
2. **Always reduce to nim-sum 0**: if you can. Otherwise you've already lost — make any move and hope.
3. **Misère endgame**: count the 1-heaps. Leave an **odd** number for your opponent.
4. **Bounded Nim**: think modulo \`K+1\`. Heap of 11 with K=3 acts like a heap of 3 (since 11 mod 4 = 3).
5. **Single-Pile**: aim for multiples of \`K+1\`. With K=3 and pile=21: 21 mod 4 = 1, take 1.

---

*References: Bouton, C. L. (1901). "Nim, a game with a complete mathematical theory." Annals of Mathematics, 3, 35–39. · Sprague, R. P. (1935). "Über mathematische Kampfspiele." · Grundy, P. M. (1939). "Mathematics and games." · Berlekamp, Conway, Guy. Winning Ways for your Mathematical Plays.*`
};
