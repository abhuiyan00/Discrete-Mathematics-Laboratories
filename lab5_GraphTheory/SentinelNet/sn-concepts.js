/* SentinelNet — 15 concept entries.
 * Every concept references the real 54-node dataset (Madrid/Barcelona/etc.
 * IDs from sn-data.js) so it doesn't read like a textbook copy-paste.
 */
window.SN_CONCEPTS = [
  // -------------------------------------------------------- 1
  {
    id: "graph",
    name: "Graph G = (V, E)",
    category: "Fundamentals",
    tagline: "Vertices and the relationships between them.",
    simple:
      "Picture a map where every sensor is a dot and every cable is a line between dots. That is a graph. SentinelNet has 54 dots and 95 lines.",
    definition:
      "A graph G consists of a vertex set V and an edge set E ⊆ {{u,v} : u,v ∈ V}. In this project the graph is undirected, simple (no self-loops, parallel edges collapsed to one) and edge-weighted by km — but each edge also carries a link-type label (lora, cellular, fiber, satellite, mesh) and a latency, so it is really a multi-attribute graph that we project down to a weighted simple graph when running algorithms.",
    complexity: "Storage: O(|V| + |E|) with adjacency lists; O(|V|²) with a matrix.",
    projectApplication:
      "Each sensor or gateway is a vertex; each communication channel is an edge. We use one graph object across the whole site so every algorithm operates on the same |V| = 54, |E| = 95 instance.",
    projectExample:
      "Madrid–Retiro (aq-mad-retiro) is a vertex of degree 3: it has a LoRa link to gw-mad-espanix, a mesh link to aq-mad-escuelas, and a mesh link to aq-mad-vallecas. None of the three is a self-loop.",
    related: ["degree", "density"],
    highlight: { type: "nodes", ids: ["aq-mad-retiro", "gw-mad-espanix", "aq-mad-escuelas", "aq-mad-vallecas"] },
  },

  // -------------------------------------------------------- 2
  {
    id: "degree",
    name: "Vertex degree",
    category: "Fundamentals",
    tagline: "How many neighbours a node has.",
    simple:
      "How many cables connect to a sensor. A gateway with 13 cables has degree 13. High-degree nodes are hubs — lose one and many things break at once.",
    definition:
      "deg(v) is the number of edges incident to v. The handshake lemma states Σ deg(v) = 2|E|. The degree sequence (sorted list of degrees) characterises a graph up to isomorphism only weakly, but it is the first thing to inspect for network design.",
    complexity: "O(|V| + |E|) to compute the full degree sequence.",
    projectApplication:
      "High-degree nodes are aggregation hubs and natural failure points. The four city gateways and the deep-space dish at Cebreros dominate the degree distribution; the sensor leaves are mostly degree 1–3.",
    projectExample:
      "deg(gw-mad-espanix) = 13: four Madrid AQ sensors over LoRa, one weather station (Barajas LEMD), two cellular sensors (Zaragoza, Valladolid), one hydro (Ebro-Zaragoza LoRa), one cellular hydro (Tajo-Toledo), and four backbone fiber links (BCN, SEV, BIL, LIS) plus a satellite uplink to Maspalomas and the Cebreros bidirectional link. That gateway is the textbook example of a high-degree hub.",
    related: ["graph", "density", "articulation"],
    highlight: { type: "node", id: "gw-mad-espanix" },
  },

  // -------------------------------------------------------- 3
  {
    id: "density",
    name: "Graph density ρ",
    category: "Fundamentals",
    tagline: "How full is the graph compared to its maximum?",
    simple:
      "How packed the network is, from 0 (almost empty) to 1 (everything connects to everything). SentinelNet is 0.066 — sparse, like a real telecom backbone.",
    definition:
      "For a simple undirected graph, ρ = 2|E| / (|V|·(|V|−1)). ρ → 0 means tree-like / sparse; ρ → 1 means complete. Sparse graphs allow linear-ish algorithms; dense graphs justify O(|V|²) algorithms like Floyd-Warshall.",
    complexity: "O(1) once |V| and |E| are known.",
    projectApplication:
      "Knowing the graph is sparse tells us Dijkstra with a binary heap (O((V+E) log V)) is the right shortest-path tool; the full all-pairs Floyd-Warshall pass is also fine because |V| = 54 → 157,464 inner-loop iterations.",
    projectExample:
      "Here ρ = 2·95 / (54·53) ≈ 0.066. That is firmly sparse — comparable to real telecom backbones, which usually sit between 0.02 and 0.08.",
    related: ["graph", "degree"],
    highlight: { type: "stat", text: "ρ ≈ 0.066" },
  },

  // -------------------------------------------------------- 4
  {
    id: "bfs",
    name: "Breadth-First Search",
    category: "Traversal",
    tagline: "Explore by hop count from a source.",
    simple:
      "Start at one sensor and explore everything 1 hop away, then 2 hops, then 3, like ripples on water. Tells you the fewest hops between any two nodes.",
    definition:
      "BFS visits all vertices in non-decreasing distance from a source s, using a FIFO queue. It produces a BFS tree whose root is s and whose level-i nodes are exactly the vertices at unweighted distance i. On unweighted graphs BFS computes shortest paths.",
    complexity: "O(|V| + |E|) time, O(|V|) space.",
    pseudocode:
      "BFS(G, s):\n  for each v: dist[v] ← ∞\n  dist[s] ← 0; Q ← [s]\n  while Q not empty:\n    u ← Q.dequeue()\n    for each (u,v) ∈ E:\n      if dist[v] = ∞:\n        dist[v] ← dist[u] + 1\n        parent[v] ← u\n        Q.enqueue(v)",
    projectApplication:
      "We run BFS from any selected node to count hop-distance to every other reachable node — the basis of the reachability stat shown when you click a node on the map.",
    projectExample:
      "BFS from aq-bcn-portvell reaches gw-bcn-catnix in 1 hop, gw-mad-espanix in 2 hops (via the BCN↔MAD fiber), and aq-mad-retiro in 3 hops. Off-map sat-maspalomas is 4 hops away through the satellite uplink from gw-mad-espanix.",
    related: ["dfs", "dijkstra", "bipartite"],
    highlight: { type: "source", id: "aq-bcn-portvell" },
  },

  // -------------------------------------------------------- 5
  {
    id: "dfs",
    name: "Depth-First Search",
    category: "Traversal",
    tagline: "Explore one branch fully before backtracking.",
    simple:
      "Pick a direction and go as deep as possible, then back up and try another. Like exploring a maze by always turning left until you hit a dead end.",
    definition:
      "DFS visits one neighbour, recurses, and backtracks only when the current vertex has no unvisited neighbour. It uses a stack (explicit or implicit via recursion). The DFS forest classifies edges as tree edges or back edges (no cross or forward edges in undirected DFS), which is the foundation of Tarjan's bridge and articulation algorithms.",
    complexity: "O(|V| + |E|) time, O(|V|) stack space.",
    pseudocode:
      "DFS(u):\n  visited[u] ← true\n  for each (u,v) ∈ E:\n    if not visited[v]:\n      parent[v] ← u\n      DFS(v)\n    else if v ≠ parent[u]:\n      mark (u,v) as BACK edge",
    projectApplication:
      "We run DFS to discover connected components and as the engine underneath the bridge / articulation-point detector.",
    projectExample:
      "Starting DFS at gw-lis-amsix, one valid traversal dives Lisbon→aq-lis-avliberdade→aq-lis-olivais→wx-lis-portela (back-edge to aq-lis-olivais), then unwinds and tries the fiber to gw-mad-espanix, finally pulling in the Cebreros satellite branch from the Madrid hub.",
    related: ["bfs", "bridge", "articulation"],
    highlight: { type: "source", id: "gw-lis-amsix" },
  },

  // -------------------------------------------------------- 6
  {
    id: "bipartite",
    name: "Bipartite graph",
    category: "Structure",
    tagline: "Two colour classes, no edge inside a class.",
    simple:
      "Can you split nodes into two teams so every cable connects opposite teams (never same-team)? SentinelNet cannot — sensor-to-sensor mesh edges put teammates together.",
    definition:
      "G is bipartite iff its vertex set can be split into V₁ ⊎ V₂ such that every edge has one endpoint in each class. Equivalently, G has no odd-length cycle. A 2-colouring BFS proves or refutes it.",
    complexity: "O(|V| + |E|) via a single BFS that 2-colours.",
    projectApplication:
      "A pure 'sensors only connect to gateways' topology would be bipartite, but the moment we add sensor-to-sensor mesh edges (e.g. aq-mad-retiro ↔ aq-mad-escuelas) the graph is no longer bipartite — and we can see the odd cycle aq-mad-retiro → aq-mad-escuelas → gw-mad-espanix → aq-mad-retiro of length 3.",
    projectExample:
      "isBipartite returns ok = false with the conflict edge (aq-mad-retiro, aq-mad-escuelas) — both want to be in the 'sensor' colour class but a mesh edge connects them directly.",
    related: ["bfs", "planarity"],
    highlight: { type: "edge", ids: ["aq-mad-retiro", "aq-mad-escuelas"] },
  },

  // -------------------------------------------------------- 7
  {
    id: "planarity",
    name: "Planarity / Kuratowski",
    category: "Structure",
    tagline: "Can the graph be drawn without crossings?",
    simple:
      "Could you draw the network on paper with no lines crossing each other? Maybe in theory; our actual map crosses lines because satellite uplinks fly over fiber.",
    definition:
      "Kuratowski (1930): G is planar iff it contains no subdivision of K₅ or K₃,₃. Equivalent: G is planar iff it contains no minor isomorphic to K₅ or K₃,₃ (Wagner). For a simple connected planar graph, |E| ≤ 3|V| − 6.",
    complexity: "Linear-time planarity tests exist (Hopcroft-Tarjan 1974) but we do not implement them; we use the |E| ≤ 3|V|−6 necessary condition as a heuristic.",
    projectApplication:
      "Our graph has 95 edges and 54 nodes; 3·54 − 6 = 156, so the upper-bound test passes — the graph could be planar. In practice the satellite uplinks crossing over the Iberian fiber backbone do generate crossings in the geographic embedding, which is why the map uses dashed satellite lines and an off-map panel.",
    projectExample:
      "If a planar embedding were required for the visual map, we would need to either reroute every gw-mad-espanix → sat-maspalomas line outside the bbox or accept crossings. We accepted crossings.",
    related: ["bipartite", "graph"],
    highlight: { type: "stat", text: "|E| = 95  ≤  3|V| − 6 = 156" },
  },

  // -------------------------------------------------------- 8
  {
    id: "bridge",
    name: "Bridge (cut edge)",
    category: "Robustness",
    tagline: "An edge whose removal disconnects the graph.",
    simple:
      "A cable that, if cut, splits the network into two disconnected halves. The Maspalomas satellite uplink is one — cut it, lose the Canary station.",
    definition:
      "An edge e = (u,v) is a bridge iff removing it increases the number of connected components. Tarjan (1972) gives an O(|V|+|E|) algorithm using DFS, where (u,v) is a bridge iff low[v] > disc[u] for the tree edge u → v.",
    complexity: "O(|V| + |E|) via one DFS pass.",
    pseudocode:
      "TarjanBridges(G):\n  for each unvisited u:\n    DFS(u, parent = null)\n  DFS(u, p):\n    disc[u] = low[u] = ++timer\n    for v in adj[u]:\n      if v not visited:\n        DFS(v, u)\n        low[u] = min(low[u], low[v])\n        if low[v] > disc[u]: bridge (u,v)\n      else if v ≠ p:\n        low[u] = min(low[u], disc[v])",
    projectApplication:
      "Every bridge in our graph is a single point of failure. A storm that cuts a bridge fiber wipes out everything downstream.",
    projectExample:
      "The fiber link (gw-bil-euskaltel, gw-lis-amsix) is NOT a bridge because both endpoints have other fiber neighbours. But (sat-maspalomas, gw-mad-espanix) IS a bridge — Maspalomas only connects through that one satellite uplink, so cutting it isolates the Canary station entirely.",
    related: ["articulation", "dfs"],
    highlight: { type: "edge", ids: ["sat-maspalomas", "gw-mad-espanix"] },
  },

  // -------------------------------------------------------- 9
  {
    id: "articulation",
    name: "Articulation point (cut vertex)",
    category: "Robustness",
    tagline: "A node whose removal disconnects the graph.",
    simple:
      "A node that, if removed, splits the network. Power-cycle Madrid's gateway rack and roughly a third of SentinelNet goes dark — that is why it is a cut vertex.",
    definition:
      "A vertex v is an articulation point iff removing v (and all its incident edges) increases the component count. Tarjan's algorithm: v is articulation iff (v is the DFS root with ≥2 tree children) OR (v is non-root and some tree child u has low[u] ≥ disc[v]).",
    complexity: "O(|V| + |E|) via one DFS pass.",
    projectApplication:
      "Articulation points are the worst single-node failures. We compute them once at startup and highlight them on the map; the Vulnerability section shows exactly which sensors get orphaned when you remove one.",
    projectExample:
      "gw-mad-espanix is an articulation point: removing it orphans all four Madrid AQ sensors, the Barajas weather station, the Zaragoza pair, Valladolid, and (because the Cebreros satellite hub also relies on it) several Castilla / Pirineos fire watchtowers. That single rack in Equinix MD2 carries an outsized share of the topology.",
    related: ["bridge", "dfs"],
    highlight: { type: "node", id: "gw-mad-espanix" },
  },

  // -------------------------------------------------------- 10
  {
    id: "mst",
    name: "Minimum spanning tree",
    category: "Routing",
    tagline: "Cheapest set of edges that keeps every vertex reachable.",
    simple:
      "Cheapest set of cables that still keeps everything connected. Trim every redundant link, keep only the bare minimum — useful for planning fresh fiber from scratch.",
    definition:
      "An MST is an acyclic subgraph touching every vertex with minimum total edge weight. For connected graphs |E_MST| = |V| − 1. Two classic algorithms: Prim (O(E log V) with a binary heap) and Kruskal (O(E log V) using a union-find).",
    complexity: "O(|E| log |V|) for both Prim and Kruskal.",
    pseudocode:
      "Kruskal(G):\n  sort edges by weight\n  for each edge (u,v) in order:\n    if find(u) ≠ find(v):\n      union(u,v); add (u,v) to MST",
    projectApplication:
      "If we were laying fresh fiber from scratch, the MST tells us the cheapest backbone that still connects all five city PoPs.",
    projectExample:
      "MST of the gateway-only subgraph picks gw-mad-espanix↔gw-sev-tlf (391 km), gw-sev-tlf↔gw-lis-amsix (318 km), gw-mad-espanix↔gw-bil-euskaltel (322 km), gw-mad-espanix↔gw-bcn-catnix (505 km). Total 1,536 km. The longer BIL↔LIS and SEV↔BCN edges are correctly excluded.",
    related: ["dijkstra", "hamiltonian"],
    highlight: { type: "subset", text: "MST of the 5 gateways" },
  },

  // -------------------------------------------------------- 11
  {
    id: "dijkstra",
    name: "Dijkstra's algorithm",
    category: "Routing",
    tagline: "Shortest paths from one source — non-negative weights.",
    simple:
      "Find the shortest km-route from one sensor to another. Like Google Maps for fiber. Fast and correct — but only if every cable has a non-negative cost.",
    definition:
      "Dijkstra greedily settles the closest unsettled vertex, then relaxes its outgoing edges. With a binary heap it runs in O((V+E) log V); with a Fibonacci heap, O(E + V log V). It REQUIRES non-negative edge weights.",
    complexity: "O((V+E) log V) with a binary min-heap.",
    pseudocode:
      "Dijkstra(G, s):\n  dist[s] = 0, others = ∞; PQ.push(s, 0)\n  while PQ not empty:\n    u = PQ.pop_min()\n    if u settled: continue\n    settle u\n    for (u,v,w) in adj[u]:\n      if dist[u] + w < dist[v]:\n        dist[v] = dist[u] + w\n        parent[v] = u\n        PQ.push(v, dist[v])",
    projectApplication:
      "Every 'fastest km-route from X to Y' shown in the Routing section is a Dijkstra path. All our weights are positive distances, so this is the right choice.",
    projectExample:
      "Dijkstra from aq-mal-carranque (Málaga AQ) to aq-bil-mzklbi (Bilbao AQ): aq-mal-carranque → gw-sev-tlf (25 km cellular) → gw-mad-espanix (391 km fiber) → gw-bil-euskaltel (322 km fiber) → aq-bil-mzklbi (2 km LoRa) = 740 km, 263 ms.",
    related: ["bellmanford", "floydwarshall", "mst"],
    highlight: { type: "path", source: "aq-mal-carranque", target: "aq-bil-mzklbi" },
  },

  // -------------------------------------------------------- 12
  {
    id: "bellmanford",
    name: "Bellman-Ford",
    category: "Routing",
    tagline: "Single-source shortest paths — handles negatives.",
    simple:
      "Slower than Dijkstra but works even with negative-cost cables, and tells you if a 'free-energy loop' exists. We do not need it for distance, but it is the safety net.",
    definition:
      "Bellman-Ford relaxes EVERY edge |V|−1 times. After that, distances are correct unless a negative-weight cycle is reachable from s; one more relaxation round detects negative cycles. Slower than Dijkstra but works with negative weights.",
    complexity: "O(|V|·|E|).",
    pseudocode:
      "BellmanFord(G, s):\n  dist[v] = ∞; dist[s] = 0\n  repeat |V|-1 times:\n    for (u,v,w) in E:\n      if dist[u] + w < dist[v]:\n        dist[v] = dist[u] + w\n        parent[v] = u\n  // one more pass to detect negative cycles\n  for (u,v,w) in E:\n    if dist[u] + w < dist[v]: report negative cycle",
    projectApplication:
      "Our weights are all positive, so we don't strictly need Bellman-Ford for correctness. We include it as a teaching reference and because in any real Iberian system, queueing-time fluctuations might let us model congested links with negative time-savings — at which point Bellman-Ford is required.",
    projectExample:
      "Run from gw-sev-tlf and you get the same distances as Dijkstra, plus a 'negative cycle: none' flag in the final frame. Equality with Dijkstra is itself a sanity check on the implementation.",
    related: ["dijkstra", "floydwarshall"],
    highlight: { type: "source", id: "gw-sev-tlf" },
  },

  // -------------------------------------------------------- 13
  {
    id: "floydwarshall",
    name: "Floyd-Warshall (all-pairs)",
    category: "Routing",
    tagline: "Shortest path between every pair of vertices.",
    simple:
      "Compute the shortest distance between every pair of sensors all at once. After one pass, asking 'how far from X to Y?' is instant for any X and Y.",
    definition:
      "Triple loop over vertices: for each intermediate k, for each pair (i,j), if dist[i][k] + dist[k][j] < dist[i][j], update. Produces a full V×V distance matrix and (with a next[][] table) full path reconstruction.",
    complexity: "O(|V|³) time, O(|V|²) space.",
    projectApplication:
      "We call Floyd-Warshall once on mount to get the distance matrix. It powers diameter, radius, eccentricity, and the TSP heuristic's pairwise distances (so even when two nodes don't share a direct edge, the TSP code still gets a finite graph-distance).",
    projectExample:
      "Graph diameter ≈ 1830 km (fire-pyr-bergueda ↔ sat-maspalomas via several hops). Radius from the most central node (gw-mad-espanix) is on the order of 900 km. Both numbers are computed exactly, not estimated.",
    related: ["dijkstra", "bellmanford", "hamiltonian"],
    highlight: { type: "stat", text: "diameter / radius" },
  },

  // -------------------------------------------------------- 14
  {
    id: "euler",
    name: "Euler circuit & Chinese Postman",
    category: "Routing",
    tagline: "Traverse every edge exactly once.",
    simple:
      "Walk every cable exactly once and end where you started. Only possible if every node has an even number of cables — SentinelNet does not, so a maintenance crew must double-walk some.",
    definition:
      "An Eulerian circuit exists iff G is connected and every vertex has even degree. An Euler path (open) exists iff exactly two vertices have odd degree. Hierholzer's algorithm constructs the circuit in O(|E|). The Chinese Postman Problem asks: given a graph that ISN'T Eulerian, what is the minimum-extra-weight edge set we must add (duplicate) so it becomes Eulerian? Solved by minimum-weight perfect matching on the odd-degree vertices.",
    complexity: "Euler check: O(|V|+|E|). Hierholzer: O(|E|). CPP: matching on odd vertices is O(k³) by Edmonds, or greedy approximate.",
    projectApplication:
      "If a maintenance technician has to physically inspect every edge — every cable run — they want an Eulerian tour. Our graph has lots of odd-degree leaves, so a strict Euler circuit doesn't exist; CPP tells us which edges to traverse twice.",
    projectExample:
      "eulerStatus reports 38 odd-degree vertices (mostly leaves like aq-coi-instgeo and the fire watchtowers with only one satellite uplink). Pairing them by minimum-weight matching adds roughly 12,000 km of repeats — proof that 'inspect every link' is not a single-day job.",
    related: ["hamiltonian", "mst"],
    highlight: { type: "stat", text: "38 odd-degree vertices" },
  },

  // -------------------------------------------------------- 15
  {
    id: "hamiltonian",
    name: "Hamiltonian cycle & TSP",
    category: "Routing",
    tagline: "Visit every VERTEX once (the hard one).",
    simple:
      "Visit every sensor exactly once and return home — the shortest such tour. Famously hard (NP-hard); we use heuristics that get within 1.5× of the true optimum.",
    definition:
      "A Hamiltonian cycle visits every vertex exactly once and returns to start. Deciding existence is NP-complete. The metric TSP — shortest such cycle when the distance is a metric — is NP-hard, but Christofides (1976) gives a 1.5-approximation: build MST, find minimum-weight matching on odd-degree vertices of the MST, combine into an Eulerian multigraph, shortcut repeated vertices.",
    complexity: "Decision: NP-complete. Nearest-neighbour heuristic: O(|V|²). 2-opt: O(|V|²) per pass. Christofides: dominated by O(|V|³) matching step.",
    projectApplication:
      "A 'visit every sensor once' tour is the right abstraction for an annual physical-inspection crew. We compare three heuristics on the all-pairs distance matrix from Floyd-Warshall (so the tour distance is finite even when two sensors have no direct edge).",
    projectExample:
      "Across the 54 nodes: nearest-neighbour from gw-mad-espanix returns a tour of roughly 11,500 km. 2-opt swaps trim that to about 9,400 km. Christofides lands near 8,900 km — within a factor 1.5 of the true optimum. None of these is the actual operational schedule (crews work regionally), but the comparison is the textbook lesson.",
    related: ["mst", "euler", "floydwarshall"],
    highlight: { type: "tour", source: "gw-mad-espanix" },
  },
];
