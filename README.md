# Discrete-Mathematics-Laboratories
Solutions and discussions for Discrete Mathematics Laboratories for Masters.

This repository currently contains two labs:

1. Lab 1: Max-Cut optimization using a multi-start local search heuristic
2. Lab 2: Asymmetric cryptography (RSA) implementation and classical factorization attacks

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
