/* ============================================================================
   Q-HYDRO WROCŁAW — Graph theory engine
   Pure functions over QH.nodes / QH.edges / QH.adj. Every result carries an
   ordered "trace" so the map console can animate the algorithm step by step.
   Optional `excluded` Set lets us remove failed nodes (resilience scenario).
   ========================================================================== */

const QG = {};

function neighbours(id, excluded) {
  return QH.adj[id].filter(e => !excluded || !excluded.has(e.to));
}

/* --- BFS — centralised sensor discovery from the hub --------------------- */
QG.bfs = function (start = 'HUB', excluded = new Set()) {
  const dist = {}, parent = {}, order = [], layers = [];
  const q = [start]; dist[start] = 0; parent[start] = null;
  const treeEdges = [];
  while (q.length) {
    const u = q.shift();
    order.push(u);
    (layers[dist[u]] = layers[dist[u]] || []).push(u);
    neighbours(u, excluded)
      .sort((x, y) => QH.byId[x.to].name.localeCompare(QH.byId[y.to].name))
      .forEach(({ to, ei }) => {
        if (dist[to] === undefined) {
          dist[to] = dist[u] + 1; parent[to] = u;
          treeEdges.push(ei); q.push(to);
        }
      });
  }
  return { dist, parent, order, layers, treeEdges,
           reached: order.length, maxHop: layers.length - 1 };
};

/* --- DFS — self-discovery / connectivity probe --------------------------- */
QG.dfs = function (start = 'HUB', excluded = new Set()) {
  const visited = new Set(), order = [], treeEdges = [];
  (function go(u) {
    visited.add(u); order.push(u);
    neighbours(u, excluded)
      .sort((x, y) => QH.byId[x.to].name.localeCompare(QH.byId[y.to].name))
      .forEach(({ to, ei }) => {
        if (!visited.has(to)) { treeEdges.push(ei); go(to); }
      });
  })(start);
  return { order, treeEdges, visited };
};

QG.connectedComponents = function (excluded = new Set()) {
  const seen = new Set(), comps = [];
  QH.nodes.forEach(n => {
    if (excluded.has(n.id) || seen.has(n.id)) return;
    const comp = [], stack = [n.id];
    while (stack.length) {
      const u = stack.pop();
      if (seen.has(u)) continue;
      seen.add(u); comp.push(u);
      neighbours(u, excluded).forEach(({ to }) => !seen.has(to) && stack.push(to));
    }
    comps.push(comp);
  });
  return comps;
};

/* --- Minimum Spanning Tree (Prim) — energy backbone ---------------------- */
QG.mst = function (excluded = new Set()) {
  const inTree = new Set(), treeEdges = [], order = [];
  const start = excluded.has('HUB') ? QH.nodes.find(n => !excluded.has(n.id)).id : 'HUB';
  inTree.add(start); order.push(start);
  const nNodes = QH.nodes.filter(n => !excluded.has(n.id)).length;
  let totalW = 0, totalKm = 0;
  while (inTree.size < nNodes) {
    let best = null;
    QH.edges.forEach((e, i) => {
      if (excluded.has(e.a) || excluded.has(e.b)) return;
      const inA = inTree.has(e.a), inB = inTree.has(e.b);
      if (inA !== inB && (!best || e.w < best.e.w)) best = { e, i };
    });
    if (!best) break;               // graph disconnected
    treeEdges.push(best.i); totalW += best.e.w; totalKm += best.e.km;
    const add = inTree.has(best.e.a) ? best.e.b : best.e.a;
    inTree.add(add); order.push(add);
  }
  return { treeEdges, order, totalW:+totalW.toFixed(3), totalKm:Math.round(totalKm),
           complete: inTree.size === nNodes };
};

/* --- Articulation points & bridges (Tarjan / Hopcroft-Tarjan) ------------ */
QG.articulation = function (excluded = new Set()) {
  const disc = {}, low = {}, parent = {}, ap = new Set(), bridges = [];
  let timer = 0;
  const nodes = QH.nodes.map(n => n.id).filter(id => !excluded.has(id));
  const dfsAP = (u) => {
    disc[u] = low[u] = ++timer;
    let children = 0;
    neighbours(u, excluded).forEach(({ to, ei }) => {
      if (disc[to] === undefined) {
        children++; parent[to] = u; dfsAP(to);
        low[u] = Math.min(low[u], low[to]);
        if (parent[u] === undefined && children > 1) ap.add(u);
        if (parent[u] !== undefined && low[to] >= disc[u]) ap.add(u);
        if (low[to] > disc[u]) bridges.push(ei);
      } else if (to !== parent[u]) {
        low[u] = Math.min(low[u], disc[to]);
      }
    });
  };
  nodes.forEach(id => { if (disc[id] === undefined) dfsAP(id); });
  return { ap: [...ap], bridges };
};

/* --- Dijkstra — shortest (lowest-latency) path tree to the hub ----------- */
QG.dijkstra = function (target = 'HUB', excluded = new Set(), weightKey = 'w') {
  const dist = {}, prev = {}, done = new Set();
  QH.nodes.forEach(n => { if (!excluded.has(n.id)) dist[n.id] = Infinity; });
  if (excluded.has(target)) return { dist, prev, treeEdges: [], order: [] };
  dist[target] = 0;
  const order = [], treeEdges = [];
  while (true) {
    let u = null, best = Infinity;
    for (const id in dist) if (!done.has(id) && dist[id] < best) { best = dist[id]; u = id; }
    if (u === null) break;
    done.add(u); order.push(u);
    if (prev[u]) treeEdges.push(prev[u].ei);
    neighbours(u, excluded).forEach(({ to, ei }) => {
      const e = QH.edges[ei];
      const nd = dist[u] + e[weightKey];
      if (nd < dist[to]) { dist[to] = nd; prev[to] = { from: u, ei }; }
    });
  }
  return { dist, prev, order, treeEdges };
};

/* path + metrics from a node back to the dijkstra target */
QG.pathTo = function (from, dijk) {
  const path = [from], edges = [];
  let cur = from, lat = 0;
  while (dijk.prev[cur]) { edges.push(dijk.prev[cur].ei); lat += QH.edges[dijk.prev[cur].ei].latency;
    cur = dijk.prev[cur].from; path.push(cur); }
  return { nodes: path, edges, reachable: cur === (dijk.target || 'HUB') || dijk.dist[from] < Infinity,
           latency:+lat.toFixed(1), hops: edges.length };
};

/* --- Resilience: fail a node, find the cheapest single fix --------------- */
/* If removing `failed` disconnects the network, search the catalogue of
   candidate redundancy links for the lowest-cost edge that restores a single
   connected component — i.e. eliminates that articulation point.            */
QG.failureImpact = function (failed) {
  const ex = failed instanceof Set ? failed : new Set([].concat(failed));
  const hubFailed = ex.has('HUB');
  const comps = QG.connectedComponents(ex);
  const hubComp = hubFailed ? [] : (comps.find(c => c.includes('HUB')) || []);
  const orphaned = QH.nodes
    .filter(n => !ex.has(n.id) && !hubComp.includes(n.id))
    .map(n => n.id);
  return { comps, orphaned, severed: orphaned.length,
           isCut: hubFailed ? orphaned.length > 0 : comps.length > 1, hubFailed };
};

/* candidate redundancy links: any non-existing pair within extended range,
   ranked by composite cost — quantum augmentation chooses the optimum set.   */
QG.candidateLinks = function (maxKm = 42) {
  const existing = new Set(QH.edges.map(e => [e.a, e.b].sort().join('|')));
  const cand = [];
  for (let i = 0; i < QH.nodes.length; i++)
    for (let j = i + 1; j < QH.nodes.length; j++) {
      const A = QH.nodes[i], B = QH.nodes[j];
      const key = [A.id, B.id].sort().join('|');
      if (existing.has(key)) continue;
      const km = QH.haversine(A, B);
      if (km <= maxKm) cand.push({ a: A.id, b: B.id, km: +km.toFixed(1) });
    }
  return cand;
};

/* cheapest single redundancy link that re-attaches an orphaned set */
QG.fastestFix = function (failed) {
  const impact = QG.failureImpact(failed);
  if (!impact.isCut) return { needed: false, impact };
  const excluded = new Set([failed]);
  const cands = QG.candidateLinks(48)
    .filter(c => c.a !== failed && c.b !== failed)
    .map(c => {
      // does adding c re-connect everyone (minus the failed node)?
      const tmpAdj = JSON.parse(JSON.stringify(QH.adj));
      const ei = QH.edges.length;
      tmpAdj[c.a].push({ to: c.b, ei }); tmpAdj[c.b].push({ to: c.a, ei });
      const seen = new Set([failed]); const stack = ['HUB']; let cnt = 0;
      while (stack.length) { const u = stack.pop(); if (seen.has(u)) continue; seen.add(u); cnt++;
        tmpAdj[u].forEach(({ to }) => !seen.has(to) && stack.push(to)); }
      const reconnects = cnt === QH.nodes.length - 1;
      const lat = 9 + c.km * 0.55;        // new LoRa relay link
      return { ...c, reconnects, latency:+lat.toFixed(1),
               cost: Math.round(2500 + c.km * 180) };  // hardware + trenching est.
    })
    .filter(c => c.reconnects)
    .sort((a, b) => a.cost - b.cost);
  return { needed: true, impact, options: cands.slice(0, 4), best: cands[0] || null };
};

/* --- Multi-node augmentation: greedy minimum-cost link set --------------- */
/* Generalises fastestFix to ANY set of failed nodes. Reconnects every
   surviving sensor into one component with the cheapest set of new links
   (within maxKm), chosen greedily over a union-find of the survivors — the
   classical baseline for the minimum-cost augmentation Odra 5 solves as a
   QUBO. `complete:false` means no in-range link set fully restores it.      */
QG.augmentFix = function (failed, maxKm = 48) {
  const ex = failed instanceof Set ? failed : new Set([].concat(failed));
  if (ex.has('HUB')) return { hubFailed: true, links: [], complete: false, totalKm: 0, totalCost: 0, comps: 0 };
  const survivors = QH.nodes.map(n => n.id).filter(id => !ex.has(id));
  const parent = {}; survivors.forEach(s => parent[s] = s);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) { parent[ra] = rb; return true; } return false; };
  QH.edges.forEach(e => { if (!ex.has(e.a) && !ex.has(e.b)) union(e.a, e.b); });   // seed with surviving links
  const compCount = () => new Set(survivors.map(find)).size;
  // candidate non-existing links among survivors, within range, cheapest first
  const existing = new Set(QH.edges.map(e => [e.a, e.b].sort().join('|')));
  const cand = [];
  for (let i = 0; i < QH.nodes.length; i++)
    for (let j = i + 1; j < QH.nodes.length; j++) {
      const A = QH.nodes[i].id, B = QH.nodes[j].id;
      if (ex.has(A) || ex.has(B) || existing.has([A, B].sort().join('|'))) continue;
      const km = +QH.haversine(QH.byId[A], QH.byId[B]).toFixed(1);   // round first so shown km reproduces cost
      if (km <= maxKm) cand.push({ a: A, b: B, km,
        latency: +(9 + km * 0.55).toFixed(1), cost: Math.round(2500 + km * 180) });
    }
  cand.sort((a, b) => a.cost - b.cost);
  const links = []; let totalCost = 0, totalKm = 0, guard = 0;
  while (compCount() > 1 && guard++ < 60) {
    const pick = cand.find(c => find(c.a) !== find(c.b));   // cheapest link bridging two components
    if (!pick) break;
    union(pick.a, pick.b); links.push(pick); totalCost += pick.cost; totalKm += pick.km;
  }
  return { hubFailed: false, links, complete: compCount() === 1,
           totalKm: +totalKm.toFixed(1), totalCost, comps: compCount() };
};

/* --- TSP — technician calibration loop (nearest-neighbour + 2-opt) ------- */
QG.tspRoute = function (mode = 'classical') {
  const sites = QH.nodes.filter(n => n.type === 'AQG').map(n => n.id);  // AQG units only
  const D = (a, b) => QH.haversine(QH.byId[a], QH.byId[b]) * 1.35;       // road factor
  // nearest neighbour from hub
  let route = ['HUB']; const left = new Set(sites);
  while (left.size) {
    const last = route[route.length - 1];
    let best = null, bd = Infinity;
    left.forEach(s => { const d = D(last, s); if (d < bd) { bd = d; best = s; } });
    route.push(best); left.delete(best);
  }
  route.push('HUB');
  const len = (r) => { let s = 0; for (let i = 0; i < r.length - 1; i++) s += D(r[i], r[i + 1]); return s; };
  if (mode === 'quantum') {       // 2-opt refinement ≈ QAOA-quality tour
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 1; i < route.length - 2; i++)
        for (let k = i + 1; k < route.length - 1; k++) {
          const a = route[i - 1], b = route[i], c = route[k], d = route[k + 1];
          if (D(a, b) + D(c, d) > D(a, c) + D(b, d) + 1e-9) {
            route = route.slice(0, i).concat(route.slice(i, k + 1).reverse(), route.slice(k + 1));
            improved = true;
          }
        }
    }
  }
  return { route, km: Math.round(len(route)) };
};

/* --- Planarity (Boyer–Myrvold is heavy; use Euler bound + K5/K3,3 hint) --- */
QG.planarityNote = function () {
  const V = QH.nodes.length, E = QH.edges.length;
  const bound = 3 * V - 6;                 // planar simple graph: E ≤ 3V−6
  return { V, E, bound, withinBound: E <= bound };
};

window.QG = QG;
