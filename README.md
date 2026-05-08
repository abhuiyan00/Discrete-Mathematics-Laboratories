# Discrete-Mathematics-Laboratories
Solutions and discussions for Discrete Mathematics Laboratories for Masters.

This repository currently contains four labs:

1. Lab 1: Max-Cut optimization using a multi-start local search heuristic
2. Lab 2: Asymmetric cryptography (RSA) implementation and classical factorization attacks
3. Lab 3: Set theory framework with logic, characteristic functions, and an optional set-based job recommender
4. Lab 4: Complexity, Growth and Interactive Explorations (Ackermann, Nim, Stirling)

## Lab 1: Max-Cut Problem

### Objective
Implement and analyze a local search heuristic for the Maximum Cut problem on weighted graphs.

### Problem Description
The Maximum Cut (Max-Cut) problem aims to partition graph vertices into two sets such that the total weight of edges between the sets is maximized. This is an NP-hard combinatorial optimization problem.

### Implementation Algorithm: Local Search with Multi-Start
1. **Initialization**: Random partition of vertices into two sets
2. **Gain Computation**: For each vertex, compute improvement from moving it to the opposite set
3. **Local Search Move**: Move the best-improving vertex while improvement is positive
4. **Multi-Start Strategy**: Repeat the local search 10 times with different random seeds
5. **Selection**: Return the best cut found across all restarts

### Input and Output Summary
- Input graph format uses `V` and `E` sections with weighted edges.
- The implementation parses nodes and weighted adjacency lists from `input.txt`.
- The solver reports cut weight, number of nodes, and total partition search space `2^n`.

### Conclusion
The multi-start local search heuristic offers an efficient and practical approach to the Max-Cut problem, trading exponential complexity for polynomial runtime while leveraging random restarts to explore diverse regions of the solution space. Although it does not guarantee the global optimum, empirical results show that it consistently produces high-quality cuts for graphs of moderate size. This method strikes a balance between computational feasibility and solution quality, making it suitable for real-world applications where exact methods are infeasible.

## Lab 2: Asymmetric Cryptography (RSA) and Cryptanalysis

### Objective
Build an end-to-end educational RSA workflow and experimentally evaluate classical integer-factorization attacks that can break weak RSA keys.

### Scope of Implementation
The notebook-based lab includes:
1. **Core number-theory primitives**: primality testing (Miller-Rabin), prime generation, extended Euclidean algorithm, and modular inverse
2. **RSA key generation**: creation of public/private key pairs from generated primes
3. **Encryption/Decryption pipeline**: text encryption and plaintext recovery using modular exponentiation
4. **Attack simulations**: recovery of factors and private key through multiple attack methods

### Implemented Attack Methods
1. **Trial Division**: Exhaustive factor search up to `sqrt(n)`
2. **Fermat Factorization**: Uses `n = a^2 - b^2`, effective when `p` and `q` are close
3. **Pollard's rho**: Probabilistic factorization using pseudo-random walks and cycle detection
4. **Simplified Quadratic Sieve**: Educational smooth-number based variant

### Experimental Components
The lab includes interactive experiments and plots for:
- Attack runtime versus key size
- Attack success rate across repeated trials
- Sensitivity of attack performance to prime gap `|p - q|`
- Theoretical complexity growth comparison across methods
- Extrapolated feasibility discussion for large key sizes (for example, 1024/2048-bit RSA)

### Conclusion
Lab 2 demonstrates a central cryptographic principle: RSA security depends on the hardness of factoring large semiprimes. For small educational key sizes, attacks can often recover factors quickly; however, as key size increases, computational cost grows dramatically, making properly generated modern RSA keys infeasible to break with classical methods. The notebook combines theory, implementation, and empirical benchmarking to show both how RSA works and why key-size selection is critical in practice.

## Lab 3: Set Theory Framework and Set-Based Recommendation

### Objective
Design a modular Python framework to model core set-theory concepts and demonstrate how set operations can be applied to practical recommendation tasks.

### Scope of Implementation
Lab 3 is divided into two parts:
1. **Mandatory tasks**: a foundational framework for sets, multisets, logic formulas, characteristic functions, and inclusion-exclusion
2. **Optional task**: a job recommendation engine that uses set-similarity metrics between user skill profiles

### Mandatory Module Coverage
The mandatory module includes:
1. **Core abstractions**: `Set`, `MultiSet`, and `EmptySet`
2. **Set operations**: union, intersection, relative and absolute complement, Cartesian product, power set, and cardinality helpers
3. **Logic utilities**: propositional formula parsing and truth-table generation
4. **Characteristic functions**: membership functions for sets and multisets
5. **Validation and demos**: test suite, main walkthrough, and additional worked examples

### Optional Module Coverage
The optional module includes:
1. User and job data models with sample datasets
2. Similarity metrics: Jaccard, Sorensen-Dice, and Cosine
3. Skill-match analysis (matching and missing skills)
4. Recommendation scoring and ranked outputs
5. End-to-end demonstration script across multiple users and metrics

### Conclusion
Lab 3 links mathematical foundations to software design by turning abstract set theory into reusable program components and applied workflows. The mandatory section builds confidence with formal operations and logic reasoning, while the optional recommender demonstrates how set similarity directly supports decision-making in real scenarios. Together, they highlight both theoretical rigor and practical relevance in discrete mathematics.

## Lab 4: Complexity, Growth and Interactive Explorations

### Objective
Investigate functions and algorithms that illustrate extreme growth rates and algorithmic complexity. Lab 4 contains both interactive Python explorations and a static web-based presentation to make asymptotic phenomena tangible.

### Structure
Lab 4 is organised into two parts:

- **Part 1 (Python projects)** — interactive, notebook-style and script-based explorations implemented in Python. Current subprojects:
	- `Ackermann_Function` — an in-depth, interactive explorer of the Ackermann function: definition, closed forms for small rows, visualisation, recursion-call counts, and a memoised OOP implementation with special-casing for `A(4,2)`.
	- `nim_game` — a full GUI Nim implementation (tkinter) with four rule variants, three AI difficulty levels, and a layered screen architecture for gameplay and setup.
	- `Stirlings_Approximation` — numerical and visual study of Stirling's formula for `n!`, including log-space computation, error analysis, and interactive plots.

- **Part 2 (Web demo)** — a browser-based bundle (`DiscreteMath Lab4`) that mirrors the Part 1 content with interactive web pages and JavaScript visualisations. Files include `index.html`, interactive scripts (`ackermann.js`, `nim.js`, `stirling.js`), and small helper modules for rendering and tweaks.

### How to Run

Python (Part 1):

```powershell
# from the repo root
cd "d:\Git area (testing)\Discrete-Mathematics-Laboratories\lab4_Complexity\part1\Ackermann_Function"
pip install -r requirements.txt  # if present; otherwise install numpy and matplotlib
python ackermann.py

# Nim GUI
cd ..\nim_game
python main.py

# Stirling interactive
cd ..\Stirlings_Approximation
python stirling.py
```

Web demo (Part 2):

```powershell
# open the web demo in your browser
cd "d:\Git area (testing)\Discrete-Mathematics-Laboratories\lab4_Complexity\part2\DiscreteMath Lab4"
start index.html
```

### Notes
- Part 1 focuses on numerical accuracy, recursion behaviour, and Python-driven visualisations (matplotlib + interactive widgets).
- Part 2 provides a lightweight client-side presentation suitable for sharing or embedding in course pages.

### Conclusion
Lab 4 ties asymptotic analysis and algorithmic growth to concrete tools and interactive experiments. The Ackermann explorer shows how a deceptively simple recursion can escape primitive recursion; Nim connects game theory to algorithmic strategy and UI design; Stirling's approximation demonstrates why asymptotic estimates are indispensable in combinatorics and complexity analysis.
