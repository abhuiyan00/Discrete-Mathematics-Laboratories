# Discrete-Mathematics-Laboratories
Solutions and discussions for Discrete Mathematics Laboratories for Masters

[Lab 1: Max Cut Problem]

## Objective
Implement and analyze a local search heuristic for the Maximum Cut problem on weighted graphs.

## Problem Description
The Maximum Cut (Max-Cut) problem aims to partition graph vertices into two sets such that the total weight of edges between the sets is maximized. This is an NP-hard combinatorial optimization problem.

## Implementation Algorithm: Local Search with Multi-Start

1. **Initialization**: Random partition of vertices into two sets

2. **Local Search**: Iteratively move vertices to improve cut weight

3. **Multi-Start**: Run 10 times with different random seeds

4. **Selection**: Return best solution found

## Conclusion
The multi‑start local search heuristic offers an efficient and practical approach to the Max‑Cut problem, trading exponential complexity for polynomial runtime while leveraging random restarts to explore diverse regions of the solution space. Although it does not guarantee the global optimum, empirical results show that it consistently produces high‑quality cuts for graphs of moderate size. This method strikes a balance between computational feasibility and solution quality, making it suitable for real‑world applications where exact methods are infeasible.
