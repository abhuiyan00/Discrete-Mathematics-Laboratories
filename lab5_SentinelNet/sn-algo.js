/* SentinelNet — pure graph algorithms.
 * No React, no DOM. All functions take (nodes, edges, ...).
 * Exposed as window.SN_ALGO.
 */
(function () {
  "use strict";

  // ----------------------------------------------------------------
  // Adjacency list (undirected)
  // ----------------------------------------------------------------
  function buildAdj(nodes, edges) {
    const adj = Object.create(null);
    for (const n of nodes) adj[n.id] = [];
    for (const e of edges) {
      adj[e.source].push({ to: e.target, weight: e.weight, type: e.type });
      adj[e.target].push({ to: e.source, weight: e.weight, type: e.type });
    }
    return adj;
  }

  // ----------------------------------------------------------------
  // Haversine (km)
  // ----------------------------------------------------------------
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  // ----------------------------------------------------------------
  // Minimal binary min-heap (priority queue) keyed by a numeric score.
  // ----------------------------------------------------------------
  function MinHeap() {
    this.h = [];
  }
  MinHeap.prototype.push = function (item, key) {
    this.h.push({ item, key });
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p].key <= this.h[i].key) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  };
  MinHeap.prototype.pop = function () {
    if (!this.h.length) return null;
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length) {
      this.h[0] = last;
      let i = 0;
      const n = this.h.length;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let best = i;
        if (l < n && this.h[l].key < this.h[best].key) best = l;
        if (r < n && this.h[r].key < this.h[best].key) best = r;
        if (best === i) break;
        [this.h[best], this.h[i]] = [this.h[i], this.h[best]];
        i = best;
      }
    }
    return top;
  };
  MinHeap.prototype.size = function () { return this.h.length; };

  // ----------------------------------------------------------------
  // BFS with step frames
  // ----------------------------------------------------------------
  function bfsSteps(nodes, edges, sourceId) {
    const adj = buildAdj(nodes, edges);
    if (!adj[sourceId]) return [];
    const visited = new Set([sourceId]);
    const queue = [sourceId];
    const layer = { [sourceId]: 0 };
    const tree = []; // [{from, to}]
    const frames = [{
      visited: new Set(visited), queue: queue.slice(),
      current: null, layer: { ...layer }, tree: tree.slice(),
    }];
    while (queue.length) {
      const u = queue.shift();
      frames.push({
        visited: new Set(visited), queue: queue.slice(),
        current: u, layer: { ...layer }, tree: tree.slice(),
      });
      for (const { to: v } of (adj[u] || [])) {
        if (!visited.has(v)) {
          visited.add(v);
          layer[v] = layer[u] + 1;
          tree.push({ from: u, to: v });
          queue.push(v);
        }
      }
      frames.push({
        visited: new Set(visited), queue: queue.slice(),
        current: u, layer: { ...layer }, tree: tree.slice(),
      });
    }
    return frames;
  }

  // ----------------------------------------------------------------
  // DFS with step frames
  // ----------------------------------------------------------------
  function dfsSteps(nodes, edges, sourceId) {
    const adj = buildAdj(nodes, edges);
    if (!adj[sourceId]) return [];
    const visited = new Set();
    const stack = [{ id: sourceId, parent: null, i: 0 }];
    const tree = [];
    const backEdges = [];
    const frames = [];

    function snap(current) {
      frames.push({
        visited: new Set(visited),
        stack: stack.map(s => s.id),
        current,
        tree: tree.slice(),
        backEdges: backEdges.slice(),
      });
    }

    while (stack.length) {
      const top = stack[stack.length - 1];
      if (!visited.has(top.id)) {
        visited.add(top.id);
        if (top.parent) tree.push({ from: top.parent, to: top.id });
        snap(top.id);
      }
      const neigh = adj[top.id] || [];
      let pushed = false;
      while (top.i < neigh.length) {
        const v = neigh[top.i++].to;
        if (!visited.has(v)) {
          stack.push({ id: v, parent: top.id, i: 0 });
          pushed = true;
          break;
        } else if (v !== top.parent) {
          // back edge — record uniquely (sorted pair)
          const key = top.id < v ? `${top.id}|${v}` : `${v}|${top.id}`;
          if (!backEdges.find(b => (b.a < b.b ? `${b.a}|${b.b}` : `${b.b}|${b.a}`) === key)) {
            backEdges.push({ a: top.id, b: v });
          }
        }
      }
      if (!pushed) {
        snap(top.id);
        stack.pop();
      }
    }
    return frames;
  }

  // ----------------------------------------------------------------
  // Connected components
  // ----------------------------------------------------------------
  function connectedComponents(nodes, edges) {
    const adj = buildAdj(nodes, edges);
    const seen = new Set();
    const comps = [];
    for (const n of nodes) {
      if (seen.has(n.id)) continue;
      const stack = [n.id];
      const comp = [];
      while (stack.length) {
        const u = stack.pop();
        if (seen.has(u)) continue;
        seen.add(u);
        comp.push(u);
        for (const { to: v } of adj[u]) if (!seen.has(v)) stack.push(v);
      }
      comps.push(comp);
    }
    return comps;
  }

  // ----------------------------------------------------------------
  // Dijkstra with step frames
  // ----------------------------------------------------------------
  function dijkstraSteps(nodes, edges, sourceId) {
    const adj = buildAdj(nodes, edges);
    if (!adj[sourceId]) return [];
    const dist = {}, prev = {}, settled = new Set();
    for (const n of nodes) { dist[n.id] = Infinity; prev[n.id] = null; }
    dist[sourceId] = 0;
    const pq = new MinHeap();
    pq.push(sourceId, 0);
    const frames = [{
      settled: new Set(), dist: { ...dist }, prev: { ...prev },
      frontier: [{ id: sourceId, key: 0 }], current: null,
    }];
    while (pq.size()) {
      const { item: u, key } = pq.pop();
      if (settled.has(u)) continue;
      if (key !== dist[u]) continue;
      settled.add(u);
      frames.push({
        settled: new Set(settled), dist: { ...dist }, prev: { ...prev },
        frontier: pq.h.map(x => ({ id: x.item, key: x.key })),
        current: u,
      });
      for (const { to: v, weight: w } of (adj[u] || [])) {
        if (settled.has(v)) continue;
        const alt = dist[u] + w;
        if (alt < dist[v]) {
          dist[v] = alt; prev[v] = u;
          pq.push(v, alt);
        }
      }
      frames.push({
        settled: new Set(settled), dist: { ...dist }, prev: { ...prev },
        frontier: pq.h.map(x => ({ id: x.item, key: x.key })),
        current: u,
      });
    }
    return frames;
  }

  // ----------------------------------------------------------------
  // Bellman-Ford with step frames (also: negative-cycle check)
  // ----------------------------------------------------------------
  function bellmanFordSteps(nodes, edges, sourceId) {
    const dist = {}, prev = {};
    for (const n of nodes) { dist[n.id] = Infinity; prev[n.id] = null; }
    if (!(sourceId in dist)) return [{ iter: 0, dist, prev, relaxedEdge: null, negativeCycle: false }];
    dist[sourceId] = 0;
    const directed = [];
    for (const e of edges) {
      directed.push({ u: e.source, v: e.target, w: e.weight });
      directed.push({ u: e.target, v: e.source, w: e.weight });
    }
    const frames = [{ iter: 0, dist: { ...dist }, prev: { ...prev }, relaxedEdge: null, negativeCycle: false }];
    const V = nodes.length;
    let changed = false;
    for (let i = 1; i < V; i++) {
      changed = false;
      for (const { u, v, w } of directed) {
        if (dist[u] === Infinity) continue;
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          prev[v] = u;
          changed = true;
          frames.push({ iter: i, dist: { ...dist }, prev: { ...prev }, relaxedEdge: { u, v, w }, negativeCycle: false });
        }
      }
      if (!changed) break;
    }
    // negative-cycle check
    let neg = false;
    for (const { u, v, w } of directed) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) { neg = true; break; }
    }
    frames.push({ iter: V, dist: { ...dist }, prev: { ...prev }, relaxedEdge: null, negativeCycle: neg });
    return frames;
  }

  // ----------------------------------------------------------------
  // Floyd-Warshall (all-pairs)
  // ----------------------------------------------------------------
  function floydWarshall(nodes, edges) {
    const n = nodes.length;
    const idx = Object.create(null);
    nodes.forEach((node, i) => { idx[node.id] = i; });
    const dist = Array.from({ length: n }, () => new Array(n).fill(Infinity));
    const next = Array.from({ length: n }, () => new Array(n).fill(null));
    for (let i = 0; i < n; i++) { dist[i][i] = 0; next[i][i] = nodes[i].id; }
    for (const e of edges) {
      const i = idx[e.source], j = idx[e.target];
      if (e.weight < dist[i][j]) {
        dist[i][j] = e.weight; next[i][j] = e.target;
        dist[j][i] = e.weight; next[j][i] = e.source;
      }
    }
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        if (dist[i][k] === Infinity) continue;
        for (let j = 0; j < n; j++) {
          const cand = dist[i][k] + dist[k][j];
          if (cand < dist[i][j]) { dist[i][j] = cand; next[i][j] = next[i][k]; }
        }
      }
    }
    return { dist, next, idx, order: nodes.map(n => n.id) };
  }

  function fwPath(fw, srcId, tgtId) {
    const { next, idx } = fw;
    let i = idx[srcId], j = idx[tgtId];
    if (next[i][j] === null) return null;
    const path = [srcId];
    let cur = srcId;
    while (cur !== tgtId) {
      cur = next[idx[cur]][j];
      if (cur == null) return null;
      path.push(cur);
      if (path.length > 1000) return null;
    }
    return path;
  }

  // ----------------------------------------------------------------
  // A* with Haversine heuristic
  // ----------------------------------------------------------------
  function aStarSteps(nodes, edges, sourceId, targetId) {
    const adj = buildAdj(nodes, edges);
    const NODE_BY_ID = Object.fromEntries(nodes.map(n => [n.id, n]));
    const tgt = NODE_BY_ID[targetId];
    if (!adj[sourceId] || !tgt) return [];
    const h = (id) => {
      const n = NODE_BY_ID[id];
      return haversine(n.lat, n.lon, tgt.lat, tgt.lon);
    };
    const gScore = {}, fScore = {}, prev = {};
    for (const n of nodes) { gScore[n.id] = Infinity; fScore[n.id] = Infinity; prev[n.id] = null; }
    gScore[sourceId] = 0;
    fScore[sourceId] = h(sourceId);
    const open = new MinHeap();
    open.push(sourceId, fScore[sourceId]);
    const closed = new Set();
    const inOpen = new Set([sourceId]);
    const frames = [{ open: [sourceId], closed: new Set(), current: null, gScore: { ...gScore }, fScore: { ...fScore }, prev: { ...prev } }];
    while (open.size()) {
      const { item: u, key } = open.pop();
      if (closed.has(u)) continue;
      if (key !== fScore[u]) continue;
      inOpen.delete(u);
      closed.add(u);
      frames.push({
        open: open.h.map(x => x.item).filter(x => !closed.has(x)),
        closed: new Set(closed),
        current: u,
        gScore: { ...gScore }, fScore: { ...fScore }, prev: { ...prev },
      });
      if (u === targetId) break;
      for (const { to: v, weight: w } of (adj[u] || [])) {
        if (closed.has(v)) continue;
        const tentative = gScore[u] + w;
        if (tentative < gScore[v]) {
          gScore[v] = tentative;
          fScore[v] = tentative + h(v);
          prev[v] = u;
          open.push(v, fScore[v]);
          inOpen.add(v);
        }
      }
    }
    return frames;
  }

  // ----------------------------------------------------------------
  // Prim MST
  // ----------------------------------------------------------------
  function primMST(nodes, edges) {
    if (!nodes.length) return { edges: [], totalWeight: 0 };
    const adj = buildAdj(nodes, edges);
    const inMST = new Set([nodes[0].id]);
    const result = [];
    let total = 0;
    const pq = new MinHeap();
    for (const { to, weight, type } of adj[nodes[0].id]) {
      pq.push({ from: nodes[0].id, to, weight, type }, weight);
    }
    while (pq.size() && inMST.size < nodes.length) {
      const { item: e } = pq.pop();
      if (inMST.has(e.to)) continue;
      inMST.add(e.to);
      result.push(e);
      total += e.weight;
      for (const { to, weight, type } of adj[e.to]) {
        if (!inMST.has(to)) pq.push({ from: e.to, to, weight, type }, weight);
      }
    }
    return { edges: result, totalWeight: total };
  }

  // ----------------------------------------------------------------
  // Kruskal MST (with step trace)
  // ----------------------------------------------------------------
  function kruskalMST(nodes, edges) {
    const parent = {};
    for (const n of nodes) parent[n.id] = n.id;
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    function union(a, b) { const ra = find(a), rb = find(b); if (ra === rb) return false; parent[ra] = rb; return true; }

    const sorted = edges.slice().sort((a, b) => a.weight - b.weight);
    const result = [];
    let total = 0;
    const steps = [];
    for (const e of sorted) {
      if (union(e.source, e.target)) {
        result.push(e);
        total += e.weight;
        steps.push({ edge: e, accepted: true });
      } else {
        steps.push({ edge: e, accepted: false });
      }
    }
    return { edges: result, totalWeight: total, steps };
  }

  // ----------------------------------------------------------------
  // Bridges (Tarjan)
  // ----------------------------------------------------------------
  function findBridges(nodes, edges) {
    const adj = buildAdj(nodes, edges);
    const disc = {}, low = {};
    let timer = 0;
    const bridges = [];
    const visited = new Set();
    function dfs(u, parent) {
      visited.add(u);
      disc[u] = low[u] = ++timer;
      for (const { to: v } of adj[u]) {
        if (!visited.has(v)) {
          dfs(v, u);
          low[u] = Math.min(low[u], low[v]);
          if (low[v] > disc[u]) bridges.push([u, v]);
        } else if (v !== parent) {
          low[u] = Math.min(low[u], disc[v]);
        }
      }
    }
    for (const n of nodes) if (!visited.has(n.id)) dfs(n.id, null);
    return bridges;
  }

  // ----------------------------------------------------------------
  // Articulation points (Tarjan)
  // ----------------------------------------------------------------
  function findArticulationPoints(nodes, edges) {
    const adj = buildAdj(nodes, edges);
    const disc = {}, low = {};
    let timer = 0;
    const ap = new Set();
    const visited = new Set();
    function dfs(u, parent) {
      visited.add(u);
      disc[u] = low[u] = ++timer;
      let children = 0;
      for (const { to: v } of adj[u]) {
        if (!visited.has(v)) {
          children++;
          dfs(v, u);
          low[u] = Math.min(low[u], low[v]);
          if (parent !== null && low[v] >= disc[u]) ap.add(u);
        } else if (v !== parent) {
          low[u] = Math.min(low[u], disc[v]);
        }
      }
      if (parent === null && children > 1) ap.add(u);
    }
    for (const n of nodes) if (!visited.has(n.id)) dfs(n.id, null);
    return Array.from(ap);
  }

  // ----------------------------------------------------------------
  // Components after removing a vertex (or set of vertices)
  // ----------------------------------------------------------------
  function componentsWithout(nodes, edges, removed) {
    const rm = new Set(Array.isArray(removed) ? removed : [removed]);
    const subN = nodes.filter(n => !rm.has(n.id));
    const subE = edges.filter(e => !rm.has(e.source) && !rm.has(e.target));
    return connectedComponents(subN, subE);
  }

  // ----------------------------------------------------------------
  // Edge connectivity (approximate)
  // For this dataset: if any bridge exists, κ'(G) = 1; otherwise treat as 2
  // (a conservative placeholder — a full Stoer-Wagner cut is out of scope).
  // ----------------------------------------------------------------
  function edgeConnectivity(nodes, edges) {
    return findBridges(nodes, edges).length > 0 ? 1 : 2;
  }

  // ----------------------------------------------------------------
  // Bipartiteness via 2-colouring BFS
  // ----------------------------------------------------------------
  function isBipartite(nodes, edges) {
    const adj = buildAdj(nodes, edges);
    const color = {};
    for (const n of nodes) {
      if (color[n.id] !== undefined) continue;
      color[n.id] = 0;
      const q = [n.id];
      while (q.length) {
        const u = q.shift();
        for (const { to: v } of adj[u]) {
          if (color[v] === undefined) {
            color[v] = 1 - color[u];
            q.push(v);
          } else if (color[v] === color[u]) {
            return { ok: false, conflict: { a: u, b: v } };
          }
        }
      }
    }
    return { ok: true, classes: color };
  }

  // ----------------------------------------------------------------
  // Degree distribution
  // ----------------------------------------------------------------
  function degreeDistribution(nodes, edges) {
    const deg = {};
    for (const n of nodes) deg[n.id] = 0;
    for (const e of edges) { deg[e.source]++; deg[e.target]++; }
    const values = Object.values(deg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const oddCount = values.filter(v => v % 2 === 1).length;
    return { id: deg, summary: { min, max, mean, oddCount } };
  }

  // ----------------------------------------------------------------
  // Clustering coefficient (local + global average)
  // ----------------------------------------------------------------
  function clusteringCoefficient(nodes, edges) {
    const adj = buildAdj(nodes, edges);
    const neighSet = Object.create(null);
    for (const id in adj) neighSet[id] = new Set(adj[id].map(x => x.to));
    const out = {};
    let sum = 0, counted = 0;
    for (const n of nodes) {
      const nbrs = Array.from(neighSet[n.id]);
      const k = nbrs.length;
      if (k < 2) { out[n.id] = 0; continue; }
      let links = 0;
      for (let i = 0; i < nbrs.length; i++) {
        for (let j = i + 1; j < nbrs.length; j++) {
          if (neighSet[nbrs[i]].has(nbrs[j])) links++;
        }
      }
      const c = (2 * links) / (k * (k - 1));
      out[n.id] = c;
      sum += c; counted++;
    }
    return { id: out, average: counted ? sum / counted : 0 };
  }

  // ----------------------------------------------------------------
  // Diameter / radius / eccentricity from Floyd-Warshall
  // ----------------------------------------------------------------
  function diameterRadius(nodes, edges, fw) {
    fw = fw || floydWarshall(nodes, edges);
    const { dist, order } = fw;
    const n = order.length;
    const ecc = {};
    let diameter = 0;
    let radius = Infinity;
    for (let i = 0; i < n; i++) {
      let e = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (dist[i][j] > e && dist[i][j] !== Infinity) e = dist[i][j];
      }
      ecc[order[i]] = e;
      if (e > diameter) diameter = e;
      if (e < radius && e > 0) radius = e;
    }
    return { diameter, radius, eccentricity: ecc };
  }

  // ----------------------------------------------------------------
  // Euler status + Chinese-Postman remediation pairs (greedy matching)
  // ----------------------------------------------------------------
  function eulerStatus(nodes, edges, fw) {
    const deg = {};
    for (const n of nodes) deg[n.id] = 0;
    for (const e of edges) { deg[e.source]++; deg[e.target]++; }
    const odd = nodes.filter(n => deg[n.id] % 2 === 1).map(n => n.id);
    const comps = connectedComponents(nodes, edges);
    const connected = comps.length === 1;
    const isEulerian = connected && odd.length === 0;
    const hasEulerPath = connected && odd.length === 2;

    // Greedy minimum-weight pairing of odd-degree vertices, using all-pairs distances
    fw = fw || floydWarshall(nodes, edges);
    const { dist, idx } = fw;
    const remaining = odd.slice();
    const pairs = [];
    while (remaining.length >= 2) {
      const a = remaining.shift();
      let bestJ = 0, bestD = Infinity;
      for (let j = 0; j < remaining.length; j++) {
        const d = dist[idx[a]][idx[remaining[j]]];
        if (d < bestD) { bestD = d; bestJ = j; }
      }
      const b = remaining.splice(bestJ, 1)[0];
      pairs.push([a, b, bestD]);
    }
    const remediationCost = pairs.reduce((s, p) => s + (isFinite(p[2]) ? p[2] : 0), 0);
    return { isEulerian, hasEulerPath, connected, oddVertices: odd, remediation: pairs, remediationCost };
  }

  // ----------------------------------------------------------------
  // Hierholzer Eulerian circuit (returns null if not Eulerian)
  // ----------------------------------------------------------------
  function hierholzerEuler(nodes, edges) {
    const status = eulerStatus(nodes, edges);
    if (!status.isEulerian) return null;
    // Build adjacency with edge indices so we can mark used
    const adj = {};
    for (const n of nodes) adj[n.id] = [];
    edges.forEach((e, i) => {
      adj[e.source].push({ to: e.target, idx: i });
      adj[e.target].push({ to: e.source, idx: i });
    });
    const used = new Array(edges.length).fill(false);
    const stack = [nodes[0].id];
    const circuit = [];
    const result = [];
    while (stack.length) {
      const u = stack[stack.length - 1];
      let foundEdge = -1;
      while (adj[u].length) {
        const { to: v, idx: ei } = adj[u].pop();
        if (used[ei]) continue;
        used[ei] = true;
        stack.push(v);
        foundEdge = ei;
        result.push(ei);
        break;
      }
      if (foundEdge === -1) {
        circuit.push(stack.pop());
      }
    }
    return result;
  }

  // ----------------------------------------------------------------
  // TSP — nearest-neighbour using all-pairs distance matrix
  // ----------------------------------------------------------------
  function tspNearestNeighbor(nodes, edges, startId, fw) {
    fw = fw || floydWarshall(nodes, edges);
    const { dist, idx, order } = fw;
    let start = startId || (nodes[0] && nodes[0].id);
    if (!(start in idx)) start = nodes[0] && nodes[0].id;
    if (!start) return { tour: [], distance: 0 };
    const visited = new Set([start]);
    const tour = [start];
    let cur = start;
    let total = 0;
    while (visited.size < order.length) {
      let bestNext = null;
      let bestD = Infinity;
      for (const id of order) {
        if (visited.has(id)) continue;
        const d = dist[idx[cur]][idx[id]];
        if (d < bestD) { bestD = d; bestNext = id; }
      }
      if (bestNext === null) break;
      tour.push(bestNext);
      visited.add(bestNext);
      total += bestD;
      cur = bestNext;
    }
    // close tour
    total += dist[idx[cur]][idx[start]];
    tour.push(start);
    return { tour, distance: total };
  }

  // ----------------------------------------------------------------
  // 2-opt improvement using the all-pairs distance matrix
  // tour is an array of ids whose first and last entries are equal (closed)
  // ----------------------------------------------------------------
  function tspTwoOpt(tour, fw, maxPasses) {
    if (!tour || tour.length < 5) return { tour: tour.slice(), distance: tourDistance(tour, fw) };
    const { dist, idx } = fw;
    const t = tour.slice();
    const n = t.length - 1; // last == first
    let improved = true;
    let passes = 0;
    const PASS_CAP = maxPasses || 4;
    while (improved && passes < PASS_CAP) {
      improved = false;
      passes++;
      for (let i = 1; i < n - 2; i++) {
        for (let k = i + 1; k < n; k++) {
          const a = t[i - 1], b = t[i], c = t[k], d = t[(k + 1) % n];
          if (a === c || b === d) continue;
          const before = dist[idx[a]][idx[b]] + dist[idx[c]][idx[d]];
          const after  = dist[idx[a]][idx[c]] + dist[idx[b]][idx[d]];
          if (after + 1e-9 < before) {
            // reverse t[i..k]
            let lo = i, hi = k;
            while (lo < hi) { [t[lo], t[hi]] = [t[hi], t[lo]]; lo++; hi--; }
            t[n] = t[0];
            improved = true;
          }
        }
      }
    }
    return { tour: t, distance: tourDistance(t, fw) };
  }

  function tourDistance(tour, fw) {
    if (!tour || tour.length < 2) return 0;
    const { dist, idx } = fw;
    let total = 0;
    for (let i = 0; i < tour.length - 1; i++) {
      total += dist[idx[tour[i]]][idx[tour[i + 1]]];
    }
    return total;
  }

  // ----------------------------------------------------------------
  // Christofides (simplified): MST → odd-deg matching (greedy) → Euler → shortcut
  // ----------------------------------------------------------------
  function tspChristofides(nodes, edges, fw) {
    fw = fw || floydWarshall(nodes, edges);
    const mst = primMST(nodes, edges);
    const deg = {};
    for (const n of nodes) deg[n.id] = 0;
    for (const e of mst.edges) { deg[e.from]++; deg[e.to]++; }
    const odd = nodes.filter(n => deg[n.id] % 2 === 1).map(n => n.id);

    // Greedy minimum-weight matching on odd vertices using fw distances
    const { dist, idx } = fw;
    const remaining = odd.slice();
    const matching = [];
    while (remaining.length >= 2) {
      const a = remaining.shift();
      let bestJ = 0, bestD = Infinity;
      for (let j = 0; j < remaining.length; j++) {
        const d = dist[idx[a]][idx[remaining[j]]];
        if (d < bestD) { bestD = d; bestJ = j; }
      }
      const b = remaining.splice(bestJ, 1)[0];
      matching.push({ a, b, w: bestD });
    }

    // Combine MST + matching as multigraph adjacency
    const adj = {};
    for (const n of nodes) adj[n.id] = [];
    for (const e of mst.edges) { adj[e.from].push(e.to); adj[e.to].push(e.from); }
    for (const m of matching) { adj[m.a].push(m.b); adj[m.b].push(m.a); }

    // Hierholzer on this multigraph
    const stack = [nodes[0].id];
    const circuit = [];
    while (stack.length) {
      const u = stack[stack.length - 1];
      if (adj[u].length) {
        const v = adj[u].pop();
        // remove one reverse occurrence
        const ri = adj[v].indexOf(u);
        if (ri >= 0) adj[v].splice(ri, 1);
        stack.push(v);
      } else {
        circuit.push(stack.pop());
      }
    }
    // Shortcut: skip already-visited
    const seen = new Set();
    const tour = [];
    for (const id of circuit) {
      if (!seen.has(id)) { seen.add(id); tour.push(id); }
    }
    if (tour.length && tour[0] !== tour[tour.length - 1]) tour.push(tour[0]);
    return { tour, distance: tourDistance(tour, fw) };
  }

  // ----------------------------------------------------------------
  // pathDistance — sums real edge weights when a direct edge exists,
  // otherwise falls back to graph distance via Floyd-Warshall (so the
  // returned value is always finite as long as the path's endpoints lie
  // in the same connected component). This is "graph distance, not
  // edge-only" — useful when reporting a heuristic TSP tour.
  // ----------------------------------------------------------------
  function pathDistance(path, edges, fw) {
    if (!path || path.length < 2) return 0;
    const direct = {};
    for (const e of edges) {
      direct[e.source + "|" + e.target] = e.weight;
      direct[e.target + "|" + e.source] = e.weight;
    }
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const w = direct[a + "|" + b];
      if (w !== undefined) {
        total += w;
      } else if (fw) {
        const d = fw.dist[fw.idx[a]][fw.idx[b]];
        if (!isFinite(d)) return Infinity;
        total += d;
      } else {
        return Infinity;
      }
    }
    return total;
  }

  // ----------------------------------------------------------------
  // reconstruct path from a prev map
  // ----------------------------------------------------------------
  function reconstruct(prev, target) {
    const out = [];
    let cur = target;
    const guard = new Set();
    while (cur != null) {
      if (guard.has(cur)) return null;
      guard.add(cur);
      out.push(cur);
      cur = prev[cur];
    }
    return out.reverse();
  }

  // ----------------------------------------------------------------
  // expose
  // ----------------------------------------------------------------
  window.SN_ALGO = {
    buildAdj, haversine,
    bfsSteps, dfsSteps, connectedComponents,
    dijkstraSteps, bellmanFordSteps, floydWarshall, fwPath, aStarSteps,
    primMST, kruskalMST,
    findBridges, findArticulationPoints, componentsWithout, edgeConnectivity,
    isBipartite, degreeDistribution, clusteringCoefficient, diameterRadius,
    eulerStatus, hierholzerEuler,
    tspNearestNeighbor, tspTwoOpt, tspChristofides, tourDistance,
    pathDistance, reconstruct,
  };
})();
