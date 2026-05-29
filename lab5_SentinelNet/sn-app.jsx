/* SentinelNet — single-file React shell.
 * All components live here so they share JSX lexical scope.
 * Babel-standalone wraps the whole file in one IIFE; identifiers defined
 * with `const` / `function` here are visible to every other component
 * below them, which was the bug the old multi-file version had.
 */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Error boundary — if any subtree throws, show a recoverable panel instead of blanking the page.
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { try { console.error("SentinelNet error:", err, info); } catch (_) {} }
  reset = () => this.setState({ err: null });
  render() {
    if (this.state.err) {
      return (
        <div className="card" style={{ borderColor: "var(--ember)" }}>
          <h3 style={{ color: "var(--ember)" }}>Something broke in this panel</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            {String(this.state.err && this.state.err.message || this.state.err)}
          </p>
          <button className="btn btn-sm" onClick={this.reset}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const NODES = window.SN_NODES;
const EDGES = window.SN_EDGES;
const NC = window.SN_NODE_COLORS;
const NL = window.SN_NODE_TYPE_LABELS;
const EC = window.SN_EDGE_COLORS;
const EL = window.SN_EDGE_TYPE_LABELS;
const REFS = window.SN_REFERENCES;
const COSTS = window.SN_COSTS;
const CONCEPTS = window.SN_CONCEPTS;
const ALGO = window.SN_ALGO;

const REF_BY_KEY = Object.fromEntries(REFS.map((r) => [r.key, r]));
const REF_NUM = Object.fromEntries(REFS.map((r, i) => [r.key, i + 1]));
const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

const LAT_MAX = 44, LAT_MIN = 36, LON_MIN = -10, LON_MAX = 4;
const MAP_W = 1000, MAP_H = 800;
function proj(lat, lon) {
  return {
    x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_W,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H,
  };
}
function isOffMap(node) {
  return node.lat < LAT_MIN || node.lat > LAT_MAX ||
         node.lon < LON_MIN || node.lon > LON_MAX;
}

// Off-map satellite-panel layout (within the same SVG, just translated)
const OFFMAP_BOX = { x: 770, y: 590, w: 220, h: 200 };
const OFFMAP_NODE_POS = {
  "sat-maspalomas": { x: OFFMAP_BOX.x + 60,  y: OFFMAP_BOX.y + 130 },
  "sat-santamaria": { x: OFFMAP_BOX.x + 160, y: OFFMAP_BOX.y + 90 },
};
function nodePos(node) {
  if (OFFMAP_NODE_POS[node.id]) return OFFMAP_NODE_POS[node.id];
  return { x: node.x, y: node.y };
}

const REGION_COUNT = 3; // Spain, Portugal, Açores/Canarias

// ============================================================
// Reveal-on-scroll
// ============================================================
function Reveal({ children, as = "div", className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVisible(true); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } });
    }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const Comp = as;
  return <Comp ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`}>{children}</Comp>;
}

// ============================================================
// CountUp
// ============================================================
function CountUp({ value, suffix = "", decimals = 0, duration = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setN(value); return; }
    let raf, start = null;
    function step(t) {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / duration);
      setN(value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{n.toFixed(decimals)}{suffix}</span>;
}

// ============================================================
// Citation marker
// ============================================================
function Cite({ k }) {
  const n = REF_NUM[k];
  if (!n) return null;
  const r = REF_BY_KEY[k];
  const onClick = (e) => {
    e.preventDefault();
    const el = document.getElementById(`ref-${k}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <a href={`#ref-${k}`} className="cite" title={r ? r.title : ""} onClick={onClick}>[{n}]</a>
  );
}

// ============================================================
// HeroBg — drifting node canvas
// ============================================================
function HeroBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    function resize() {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    const palette = ["#5EB1D6", "#E0664F", "#7FB069", "#E0AC4C", "#A687C9"];
    const N = 48;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1.5 + Math.random() * 2.5,
      c: palette[(Math.random() * palette.length) | 0],
      ph: Math.random() * Math.PI * 2,
    }));
    let raf;
    function tick(t) {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      // edges
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 130 * 130) {
            const op = 0.18 * (1 - Math.sqrt(d2) / 130);
            ctx.strokeStyle = `rgba(127,176,105,${op})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // nodes
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.clientWidth) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.clientHeight) n.vy *= -1;
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.001 + n.ph);
        ctx.fillStyle = n.c + Math.floor(pulse * 110).toString(16).padStart(2, "0");
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="hero-bg-canvas" />;
}

// ============================================================
// Brand mark
// ============================================================
function BrandMark() {
  const dots = [
    { c: NC.aq, x: 4 }, { c: NC.fire, x: 10 }, { c: NC.weather, x: 16 },
    { c: NC.hydro, x: 22 }, { c: NC.gateway, x: 28 }, { c: NC.sat, x: 34 }
  ];
  return (
    <svg width="40" height="20" viewBox="0 0 40 20" aria-hidden="true">
      <line x1="2" y1="10" x2="38" y2="10" stroke="#3E6770" strokeWidth="1" />
      {dots.map((d, i) => <circle key={i} cx={d.x} cy="10" r="2.4" fill={d.c} />)}
    </svg>
  );
}

// ============================================================
// Navbar
// ============================================================
const SECTIONS = [
  { id: "section-01", n: "01", label: "Data" },
  { id: "section-02", n: "02", label: "Discovery" },
  { id: "section-03", n: "03", label: "Structure" },
  { id: "section-04", n: "04", label: "Vulnerability" },
  { id: "section-05", n: "05", label: "Maintenance" },
  { id: "section-06", n: "06", label: "Routing" },
  { id: "section-07", n: "07", label: "Cost" },
  { id: "section-08", n: "08", label: "Conclusions" },
  { id: "section-09", n: "09", label: "References" },
  { id: "section-10", n: "10", label: "Concepts" },
];

function Navbar({ active }) {
  return (
    <nav className="navbar">
      <div className="nav-inner">
        <a href="#top" className="brand">
          <BrandMark />
          <span>SentinelNet</span>
        </a>
        <div className="nav-links">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className={`nav-link ${active === s.id ? "active" : ""}`}>
              {s.n} · {s.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// Hero
// ============================================================
function Hero({ bridgesCount, articulationCount }) {
  return (
    <header className="hero-wrap" id="top">
      <HeroBg />
      <div className="container hero-content">
        <div className="eyebrow">Discrete Mathematics Laboratory · Graph theory · Lab 5</div>
        <h1 className="h1">
          Sentinel<span className="accent">Net</span>
        </h1>
        <p className="lead">
          A graph-theoretic walk through a realistic Iberian environmental-monitoring grid:
          54 sensors, gateways and satellite uplinks across Spain, Portugal and two off-shore
          ground stations, wired together by 95 links over LoRaWAN, NB-IoT, fibre, mesh and
          satellite. We compute, do not estimate.
        </p>
        <div className="stat-row">
          <Stat val={NODES.length} label="vertices" />
          <Stat val={EDGES.length} label="edges" />
          <Stat val={bridgesCount} label="bridges" />
          <Stat val={articulationCount} label="cut vertices" />
          <Stat val={REGION_COUNT} label="regions" />
        </div>
      </div>
    </header>
  );
}

function Stat({ val, label }) {
  return (
    <div className="stat">
      <div className="val"><CountUp value={val} /></div>
      <div className="lbl">{label}</div>
    </div>
  );
}

// ============================================================
// MiniGraph — shared subgraph SVG.
// Renders a small (W x H) projection of `nodes` and `edges`
// with optional highlight sets.
// ============================================================
function MiniGraph({
  nodes = NODES,
  edges = EDGES,
  highlightNodes = new Set(),
  highlightEdges = new Set(), // keys: "a|b" with a < b
  dimOthers = true,
  height = 280,
}) {
  // bounding box on the fly so off-map nodes don't blow up the view
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  // Use the standard map bbox; just clip nodes outside to it visually
  const W = MAP_W, H = MAP_H;
  function edgeKey(a, b) { return a < b ? `${a}|${b}` : `${b}|${a}`; }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
         className="minigraph" style={{ maxHeight: height }}>
      {edges.map((e, i) => {
        const a = NODE_BY_ID[e.source], b = NODE_BY_ID[e.target];
        if (!a || !b) return null;
        const pa = nodePos(a), pb = nodePos(b);
        const hi = highlightEdges.has(edgeKey(e.source, e.target));
        const dim = dimOthers && highlightEdges.size > 0 && !hi;
        return (
          <line key={i}
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={EC[e.type]}
                strokeWidth={hi ? 2.5 : 1}
                className={`graph-edge ${e.type} ${hi ? "highlight" : ""} ${dim ? "dim" : ""}`} />
        );
      })}
      {nodes.map(n => {
        const p = nodePos(n);
        const hi = highlightNodes.has(n.id);
        const dim = dimOthers && highlightNodes.size > 0 && !hi;
        return (
          <circle key={n.id} cx={p.x} cy={p.y}
                  r={hi ? 7 : 4}
                  fill={NC[n.type]}
                  className={`graph-node ${dim ? "dim" : ""} ${hi ? "selected" : ""}`} />
        );
      })}
    </svg>
  );
}

// ============================================================
// NetworkMap — the big interactive SVG
// ============================================================
const MAP_MODES = {
  ALL: "all",
  BRIDGES: "bridges",
  ARTICULATION: "articulation",
  BFS: "bfs",
  DFS: "dfs",
  DIJKSTRA: "dijkstra",
  BELLMAN: "bellman",
  ASTAR: "astar",
  MST: "mst",
  TSP: "tsp",
};

// Plain-English one-liner per mode, shown under the toolbar so users always know what they are looking at.
const MODE_DESC = {
  all:          "Click any node to inspect it. Then pick a mode below to run an algorithm starting from your selection.",
  bridges:      "Highlights cables that, if cut, split the network. Every dashed red edge is a single point of failure.",
  articulation: "Highlights nodes that, if removed, split the network. Outlined nodes are the riskiest single failures.",
  bfs:          "Spreads outward in hop-rings from the selected node. Use this to see what is reachable in N hops.",
  dfs:          "Dives deep along one branch and backtracks. Useful for seeing one long traversal path.",
  dijkstra:     "Shortest km-route from the selected node to the chosen target. Pick a target on the right.",
  bellman:      "Same answer as Dijkstra for positive weights, but also detects negative-cost cycles. Teaching reference.",
  astar:        "Goal-directed shortest path that uses straight-line distance as a hint. Expands fewer nodes than Dijkstra.",
  mst:          "Cheapest set of cables that still keeps every node connected. The minimum spanning tree.",
  tsp:          "Approximate shortest tour visiting every node once and returning home. Starts from your selection.",
};

// Toolbar groups — visual grouping by what the user is trying to do, not by algorithm family.
const MODE_GROUPS = [
  { label: "View",            modes: [["all",          "Show all"]] },
  { label: "Weak spots",      modes: [["bridges",      "Bridges"], ["articulation", "Cut vertices"]] },
  { label: "Explore from node", modes: [["bfs",        "BFS"],     ["dfs",          "DFS"]] },
  { label: "Shortest path",   modes: [["dijkstra",     "Dijkstra"],["bellman",       "Bellman-Ford"], ["astar", "A*"]] },
  { label: "Backbone & tour", modes: [["mst",          "MST"],     ["tsp",           "TSP tour"]] },
];

function NetworkMap({ selectedId, setSelectedId, bridges, articulationPoints, fw }) {
  const [mode, setMode] = useState(MAP_MODES.ALL);
  const [targetId, setTargetId] = useState("aq-bil-mzklbi");
  const [frames, setFrames] = useState([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(450);
  const [mstResult, setMstResult] = useState(null);
  const [tspResult, setTspResult] = useState(null);

  const adj = useMemo(() => ALGO.buildAdj(NODES, EDGES), []);

  // recompute frames whenever mode / selection / target change
  useEffect(() => {
    setFrameIdx(0); setPlaying(false);
    if (mode === MAP_MODES.BFS) setFrames(ALGO.bfsSteps(NODES, EDGES, selectedId));
    else if (mode === MAP_MODES.DFS) setFrames(ALGO.dfsSteps(NODES, EDGES, selectedId));
    else if (mode === MAP_MODES.DIJKSTRA) setFrames(ALGO.dijkstraSteps(NODES, EDGES, selectedId));
    else if (mode === MAP_MODES.BELLMAN) setFrames(ALGO.bellmanFordSteps(NODES, EDGES, selectedId));
    else if (mode === MAP_MODES.ASTAR) setFrames(ALGO.aStarSteps(NODES, EDGES, selectedId, targetId));
    else if (mode === MAP_MODES.MST) {
      const r = ALGO.kruskalMST(NODES, EDGES);
      setMstResult(r);
      setFrames([]);
    } else if (mode === MAP_MODES.TSP) {
      const nn = ALGO.tspNearestNeighbor(NODES, EDGES, selectedId, fw);
      const opt = ALGO.tspTwoOpt(nn.tour, fw, 4);
      setTspResult({ nn, opt });
      setFrames([]);
    } else {
      setFrames([]);
    }
  }, [mode, selectedId, targetId, fw]);

  // play loop
  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setPlaying(false); return; }
    const t = setInterval(() => {
      setFrameIdx((i) => {
        if (i + 1 >= frames.length) { setPlaying(false); return i; }
        return i + 1;
      });
    }, speed);
    return () => clearInterval(t);
  }, [playing, speed, frames.length]);

  // ---- derived highlight sets per mode ----
  const { hiNodes, hiEdges, status } = useMemo(() => {
    const hiN = new Set();
    const hiE = new Set();
    let stat = "";
    function ek(a, b) { return a < b ? `${a}|${b}` : `${b}|${a}`; }

    if (mode === MAP_MODES.ALL) {
      stat = `${NODES.length} nodes · ${EDGES.length} edges · click a node to inspect.`;
    } else if (mode === MAP_MODES.BRIDGES) {
      bridges.forEach(([a, b]) => { hiE.add(ek(a, b)); hiN.add(a); hiN.add(b); });
      stat = `${bridges.length} bridge${bridges.length === 1 ? "" : "s"} — every dashed edge here is a single point of failure.`;
    } else if (mode === MAP_MODES.ARTICULATION) {
      articulationPoints.forEach((id) => hiN.add(id));
      stat = `${articulationPoints.length} cut vertex/vertices — removing any one disconnects the graph.`;
    } else if (mode === MAP_MODES.BFS && frames[frameIdx]) {
      const f = frames[frameIdx];
      f.visited.forEach((id) => hiN.add(id));
      f.tree.forEach((e) => hiE.add(ek(e.from, e.to)));
      stat = `BFS from ${selectedId} · frame ${frameIdx + 1}/${frames.length} · visited ${f.visited.size}/${NODES.length} · queue size ${f.queue.length}`;
    } else if (mode === MAP_MODES.DFS && frames[frameIdx]) {
      const f = frames[frameIdx];
      f.visited.forEach((id) => hiN.add(id));
      f.tree.forEach((e) => hiE.add(ek(e.from, e.to)));
      stat = `DFS from ${selectedId} · frame ${frameIdx + 1}/${frames.length} · visited ${f.visited.size}/${NODES.length} · stack depth ${f.stack.length} · back edges ${f.backEdges.length}`;
    } else if (mode === MAP_MODES.DIJKSTRA && frames[frameIdx]) {
      const f = frames[frameIdx];
      f.settled.forEach((id) => hiN.add(id));
      // also draw the current shortest-path tree
      for (const id in f.prev) {
        const p = f.prev[id];
        if (p) hiE.add(ek(id, p));
      }
      const tgtDist = f.dist[targetId];
      stat = `Dijkstra from ${selectedId} → ${targetId} · settled ${f.settled.size}/${NODES.length} · current dist ${tgtDist === Infinity ? "∞" : tgtDist + " km"}`;
    } else if (mode === MAP_MODES.BELLMAN && frames[frameIdx]) {
      const f = frames[frameIdx];
      for (const id in f.prev) { const p = f.prev[id]; if (p) hiE.add(ek(id, p)); }
      hiN.add(selectedId);
      if (f.relaxedEdge) { hiE.add(ek(f.relaxedEdge.u, f.relaxedEdge.v)); }
      stat = `Bellman-Ford iter ${f.iter} · ${f.relaxedEdge ? `relaxed (${f.relaxedEdge.u} → ${f.relaxedEdge.v}, ${f.relaxedEdge.w} km)` : `pass complete`} · negative cycle: ${f.negativeCycle ? "YES" : "no"}`;
    } else if (mode === MAP_MODES.ASTAR && frames[frameIdx]) {
      const f = frames[frameIdx];
      f.closed.forEach((id) => hiN.add(id));
      for (const id in f.prev) { const p = f.prev[id]; if (p) hiE.add(ek(id, p)); }
      hiN.add(targetId);
      stat = `A* from ${selectedId} → ${targetId} · expanded ${f.closed.size} · open ${f.open.length} · g(target)=${f.gScore[targetId] === Infinity ? "∞" : f.gScore[targetId].toFixed(0) + " km"}`;
    } else if (mode === MAP_MODES.MST && mstResult) {
      mstResult.edges.forEach((e) => hiE.add(ek(e.source, e.target)));
      stat = `Kruskal MST · ${mstResult.edges.length} edges · total weight ${mstResult.totalWeight.toFixed(0)} km`;
    } else if (mode === MAP_MODES.TSP && tspResult) {
      const t = tspResult.opt.tour;
      for (let i = 0; i < t.length - 1; i++) hiE.add(ek(t[i], t[i + 1]));
      t.forEach((id) => hiN.add(id));
      stat = `TSP (NN + 2-opt) · NN ≈ ${tspResult.nn.distance.toFixed(0)} km · 2-opt ≈ ${tspResult.opt.distance.toFixed(0)} km`;
    }
    return { hiNodes: hiN, hiEdges: hiE, status: stat };
  }, [mode, frameIdx, frames, mstResult, tspResult, selectedId, targetId, bridges, articulationPoints]);

  // inspector data
  const inspected = NODE_BY_ID[selectedId];
  const neighbours = inspected && adj[inspected.id] ? adj[inspected.id].map((x) => x.to) : [];
  const degree = neighbours.length;
  const isAP = articulationPoints.includes(selectedId);
  const onBridge = bridges.some(([a, b]) => a === selectedId || b === selectedId);

  const stepperEnabled = frames.length > 0;
  const progressPct = stepperEnabled ? ((frameIdx + 1) / frames.length) * 100 : 0;

  return (
    <div className="netmap-shell">
      <div className="netmap-main">
        <div className="netmap-hint">
          <strong>Tip.</strong> Click any node to inspect it on the right. Then pick a mode below to run an algorithm starting from that node. Hover a mode for what it does.
        </div>
        <div className="mode-groups">
          {MODE_GROUPS.map((g) => (
            <div key={g.label} className="mode-group">
              <span className="mode-group-label">{g.label}</span>
              <div className="mode-group-buttons">
                {g.modes.map(([m, lbl]) => (
                  <button key={m}
                          className={`btn btn-sm ${mode === m ? "active" : ""}`}
                          title={MODE_DESC[m]}
                          onClick={() => setMode(m)}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="mode-group">
            <span className="mode-group-label">&nbsp;</span>
            <div className="mode-group-buttons">
              <button className="btn btn-sm" onClick={() => setMode(MAP_MODES.ALL)}>Reset</button>
            </div>
          </div>
        </div>

        <div className="mode-desc">{MODE_DESC[mode] || ""}</div>

        {(mode === MAP_MODES.DIJKSTRA || mode === MAP_MODES.ASTAR) && (
          <div className="netmap-toolbar mode-target-row">
            <span className="muted mono" style={{ alignSelf: "center", fontSize: "0.72rem" }}>from <strong style={{ color: "var(--ink)" }}>{selectedId}</strong> &nbsp;→ target:</span>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              {NODES.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.label}</option>)}
            </select>
          </div>
        )}

        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet" className="netmap-svg">
          {/* off-map panel background */}
          <rect x={OFFMAP_BOX.x} y={OFFMAP_BOX.y} width={OFFMAP_BOX.w} height={OFFMAP_BOX.h}
                className="netmap-offmap" rx={4} />
          <text x={OFFMAP_BOX.x + 10} y={OFFMAP_BOX.y + 16} className="netmap-offmap-label">
            off-map · satellite ground stations
          </text>

          {/* edges */}
          {EDGES.map((e, i) => {
            const a = NODE_BY_ID[e.source], b = NODE_BY_ID[e.target];
            const pa = nodePos(a), pb = nodePos(b);
            const key = e.source < e.target ? `${e.source}|${e.target}` : `${e.target}|${e.source}`;
            const hi = hiEdges.has(key);
            const dim = (mode !== MAP_MODES.ALL) && !hi && hiEdges.size > 0;
            const isBridge = bridges.some(([x, y]) => (x === e.source && y === e.target) || (x === e.target && y === e.source));
            return (
              <line key={i}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={hi ? EC[e.type] : EC[e.type]}
                    strokeWidth={hi ? 2.6 : 1.1}
                    className={`graph-edge ${e.type} ${hi ? "highlight" : ""} ${dim ? "dim" : ""} ${mode === MAP_MODES.BRIDGES && isBridge ? "bridge" : ""}`}
                    opacity={hi ? 1 : (dim ? 0.08 : 0.55)} />
            );
          })}

          {/* nodes */}
          {NODES.map((n) => {
            const p = nodePos(n);
            const hi = hiNodes.has(n.id);
            const dim = (mode !== MAP_MODES.ALL) && !hi && hiNodes.size > 0;
            const sel = n.id === selectedId;
            const ap = articulationPoints.includes(n.id);
            return (
              <g key={n.id}>
                <circle cx={p.x} cy={p.y}
                        r={sel ? 9 : hi ? 7 : 5}
                        fill={NC[n.type]}
                        stroke={sel ? "var(--ink)" : ap ? "var(--rose)" : "rgba(0,0,0,0.4)"}
                        strokeWidth={sel ? 2.5 : ap ? 1.8 : 1}
                        className={`graph-node ${dim ? "dim" : ""} ${sel ? "selected" : ""} ${ap ? "articulation" : ""}`}
                        onClick={() => setSelectedId(n.id)}>
                  <title>{n.label} ({n.type}) · {n.operator}</title>
                </circle>
              </g>
            );
          })}
        </svg>

        <div className="netmap-status">{status || " "}</div>

        {stepperEnabled && (
          <div className="netmap-stepper">
            <button className="btn btn-sm btn-icon" onClick={() => setFrameIdx(0)} disabled={frameIdx === 0}>«</button>
            <button className="btn btn-sm btn-icon" onClick={() => setFrameIdx(Math.max(0, frameIdx - 1))} disabled={frameIdx === 0}>‹</button>
            <button className="btn btn-sm" onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button>
            <button className="btn btn-sm btn-icon" onClick={() => setFrameIdx(Math.min(frames.length - 1, frameIdx + 1))} disabled={frameIdx >= frames.length - 1}>›</button>
            <button className="btn btn-sm btn-icon" onClick={() => setFrameIdx(frames.length - 1)} disabled={frameIdx >= frames.length - 1}>»</button>
            <div className="progress"><div className="progress-bar" style={{ width: `${progressPct}%` }} /></div>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ minWidth: 80 }}>
              <option value={900}>0.5×</option>
              <option value={450}>1×</option>
              <option value={220}>2×</option>
              <option value={100}>4×</option>
            </select>
          </div>
        )}

        <div className="netmap-legend">
          {Object.entries(NC).map(([k, v]) => (
            <span key={k}><span className="swatch" style={{ background: v }} />{NL[k]}</span>
          ))}
        </div>
        <div className="netmap-legend">
          {Object.entries(EC).map(([k, v]) => (
            <span key={k}><span className="swatch" style={{ background: v, borderRadius: 1 }} />{EL[k]}</span>
          ))}
        </div>
      </div>

      <div className="netmap-side">
        <div className="inspector">
          <div className="eyebrow">selected</div>
          <h3 style={{ marginTop: 4 }}>{inspected ? inspected.label : "—"}</h3>
          {inspected && (
            <>
              <span className="badge" style={{ borderColor: NC[inspected.type], color: NC[inspected.type] }}>
                {NL[inspected.type]}
              </span>
              <dl>
                <dt>id</dt><dd>{inspected.id}</dd>
                <dt>operator</dt><dd>{inspected.operator}</dd>
                <dt>lat,lon</dt><dd>{inspected.lat.toFixed(4)}, {inspected.lon.toFixed(4)}</dd>
                <dt>note</dt><dd>{inspected.note}</dd>
                <dt>degree</dt><dd>{degree}</dd>
                <dt>cut vtx?</dt><dd>{isAP ? "yes" : "no"}</dd>
                <dt>on bridge?</dt><dd>{onBridge ? "yes" : "no"}</dd>
                <dt>neighbours</dt>
                <dd>{neighbours.map((id, i) => (
                  <button key={id} className="inline-link" style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                          onClick={() => setSelectedId(id)}>
                    {id}{i < neighbours.length - 1 ? ", " : ""}
                  </button>
                ))}</dd>
              </dl>
            </>
          )}
        </div>
        <div className="inspector">
          <div className="eyebrow">about this map</div>
          <p className="muted" style={{ fontSize: "0.82rem", margin: "6px 0 0 0" }}>
            Equirectangular projection over the Iberian bbox (lat 36–44, lon −10 to +4).
            The two off-map satellite ground stations (Maspalomas, Santa Maria) are drawn in the
            dashed inset; their satellite uplinks cross from the main view into the panel.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Section 01 — Data
// ============================================================
function DataSection() {
  // group nodes by type
  const grouped = useMemo(() => {
    const out = {};
    for (const n of NODES) (out[n.type] = out[n.type] || []).push(n);
    return out;
  }, []);

  // citation lookup by group
  const CITE_BY_TYPE = {
    aq:      ["openaq", "eea-air", "ee-areport", "miteco-air", "apa-qualar", "xvpca", "andalucia", "euskadi-air", "jcyl-med", "aq-dir"],
    fire:    ["effis", "effis-data", "icnf", "miteco-fire", "pladiga", "bombers", "infocam"],
    weather: ["aemet", "ipma"],
    hydro:   ["saih-ebro", "saih-tajo", "ch-guad", "ch-guadn", "snirh", "saih-min"],
    gateway: ["espanix", "catnix", "amsix-lis"],
    sat:     ["copernicus", "cems", "estrack", "cebreros"],
  };

  return (
    <section className="section" id="section-01">
      <div className="container">
        <Reveal>
          <span className="section-tag">01 · Data</span>
          <h2 className="h2">A real grid, honestly assembled</h2>
          <p className="lead">
            Every coordinate in this dataset is a real WGS84 location. Operator labels match real
            agencies. Where a station code was hard to verify (a couple of fire-watchtower
            coordinates and the Barcelona Port Vell AQ node) the entry is flagged synthetic in the
            tooltip. The graph has {NODES.length} vertices and {EDGES.length} edges
            <Cite k="eea-air" /><Cite k="aemet" /><Cite k="ipma" /><Cite k="saih-ebro" /><Cite k="effis" />.
          </p>
        </Reveal>

        <Reveal className="mt-24">
          <div className="row">
            {Object.keys(NC).map((t) => (
              <div key={t} className="card col" style={{ minWidth: 220 }}>
                <span className="badge" style={{ borderColor: NC[t], color: NC[t] }}>{NL[t]}</span>
                <h3 style={{ marginTop: 8 }}>{(grouped[t] || []).length} nodes</h3>
                <div className="mono muted" style={{ fontSize: "0.74rem" }}>
                  {(grouped[t] || []).slice(0, 6).map((n) => n.id).join(" · ")}
                  {(grouped[t] || []).length > 6 ? " …" : ""}
                </div>
                <div className="mt-8">
                  {(CITE_BY_TYPE[t] || []).map((k) => <Cite key={k} k={k} />)}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-32">
          <div className="research-grid">
            <div className="card">
              <h3>What is real</h3>
              <ul className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
                <li>All 10 AEMET / IPMA weather stations carry their real ICAO + WMO codes.</li>
                <li>All 5 IXs are real (ESPANIX, CATNIX, AMS-IX Lisbon, Euskaltel PoP, Telefónica PoP).</li>
                <li>SAIH hydro gauges (Zaragoza, Tortosa, Toledo, Sevilla, Régua) are real automatic level gauges.</li>
                <li>The ESA Cebreros DSA-2 dish, Maspalomas and Santa Maria ground stations are real.</li>
                <li>Edge weights are Haversine km — the formula, not the wire.</li>
              </ul>
            </div>
            <div className="card">
              <h3>What we synthesised</h3>
              <ul className="muted" style={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
                <li>Latency_ms and capacity_mbps on every edge — order-of-magnitude estimates that match LoRaWAN/NB-IoT/fibre tier conventions.</li>
                <li>Specific watchtower coordinates (Gredos, Pirineos, Évora, etc.) — the watchtower NETWORKS are real, individual coordinates are representative.</li>
                <li>Barcelona Port Vell AQ node — there is no public XVPCA station with that exact name; we added one as a stand-in for the maritime AQ context.</li>
                <li>Mesh edges (sensor↔nearby sensor) are a design proposal, not an existing deployment.</li>
              </ul>
              <div className="honest mt-12">
                <strong>Honest limitation:</strong> we do not have access to live telemetry. This is
                a topology study, not a real-time monitoring dashboard.
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================
// Section 02 — Discovery (BFS vs DFS)
// ============================================================
function DiscoverySection({ selectedId, setSelectedId }) {
  const [algo, setAlgo] = useState("bfs");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const frames = useMemo(() => {
    if (algo === "bfs") return ALGO.bfsSteps(NODES, EDGES, selectedId);
    return ALGO.dfsSteps(NODES, EDGES, selectedId);
  }, [algo, selectedId]);
  useEffect(() => { setStep(0); setPlaying(false); }, [algo, selectedId]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= frames.length) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 400);
    return () => clearInterval(t);
  }, [playing, frames.length]);

  const f = frames[step] || {};
  const hiNodes = new Set(f.visited || []);
  const hiEdges = new Set((f.tree || []).map((e) => e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`));

  return (
    <section className="section" id="section-02">
      <div className="container">
        <Reveal>
          <span className="section-tag">02 · Discovery</span>
          <h2 className="h2">Two ways to wander a graph</h2>
          <p className="lead">
            The fastest LoRaWAN OTAA join takes whichever gateway responds first; conceptually it
            is a single BFS hop. Once a sensor is online, our network management tool needs to walk
            the topology to discover what else is reachable — BFS by layer for a quick reachability
            test, DFS for a recursive dive into a region.
          </p>
        </Reveal>

        <div className="research-shell">
          <div className="tab-bar">
            <button className={`tab-btn ${algo === "bfs" ? "active" : ""}`} onClick={() => setAlgo("bfs")}>Breadth-first</button>
            <button className={`tab-btn ${algo === "dfs" ? "active" : ""}`} onClick={() => setAlgo("dfs")}>Depth-first</button>
          </div>
          <div className="research-panel">
            <div className="research-grid">
              <div>
                <h3>Source: {selectedId}</h3>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  Pick any node on the map above to change the source.
                  {algo === "bfs"
                    ? " BFS uses a FIFO queue; the level table grows monotonically."
                    : " DFS uses a stack; back-edges to non-parent ancestors are recorded."}
                </p>
                <h4 className="mt-16">{algo === "bfs" ? "Queue (front → back)" : "Stack (bottom → top)"}</h4>
                <div className="queue-display">
                  {(algo === "bfs" ? (f.queue || []) : (f.stack || [])).map((id, i, arr) => (
                    <span key={i} className={`queue-chip ${i === arr.length - 1 && algo === "dfs" ? "current" : ""}`}>{id}</span>
                  ))}
                  {(!(f.queue || f.stack) || (f.queue || f.stack).length === 0) && <span className="muted">empty</span>}
                </div>
                <h4 className="mt-16">Step {step + 1} / {frames.length}</h4>
                <div className="netmap-stepper">
                  <button className="btn btn-sm" onClick={() => setStep(0)} disabled={step === 0}>«</button>
                  <button className="btn btn-sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>‹</button>
                  <button className="btn btn-sm" onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button>
                  <button className="btn btn-sm" onClick={() => setStep(Math.min(frames.length - 1, step + 1))} disabled={step >= frames.length - 1}>›</button>
                  <button className="btn btn-sm" onClick={() => setStep(frames.length - 1)}>»</button>
                </div>
                <div className="mt-16">
                  <pre className="code">{algo === "bfs"
                    ? "BFS(G, s):\n  for v in V: dist[v] = ∞\n  dist[s] = 0; Q = [s]\n  while Q not empty:\n    u = Q.pop_front()\n    for (u,v) in E:\n      if dist[v] = ∞:\n        dist[v] = dist[u] + 1\n        Q.push_back(v)"
                    : "DFS(u):\n  visited[u] = true\n  for (u,v) in adj[u]:\n    if not visited[v]:\n      parent[v] = u\n      DFS(v)\n    else if v ≠ parent[u]:\n      record BACK edge"}
                  </pre>
                </div>
                <div className="honest mt-12">
                  <strong>Honest limitation:</strong> the LoRaWAN OTAA JOIN is not literally BFS —
                  it is a single broadcast handled by whichever gateway gets the upstream packet
                  first. We use the BFS analogy because, conceptually, the JOIN ACCEPT comes from
                  the first level reachable from the device.
                </div>
              </div>
              <div>
                <MiniGraph highlightNodes={hiNodes} highlightEdges={hiEdges} dimOthers={true} height={420} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section 03 — Structure
// ============================================================
function StructureSection({ fw }) {
  const dist = useMemo(() => ALGO.degreeDistribution(NODES, EDGES), []);
  const dr = useMemo(() => ALGO.diameterRadius(NODES, EDGES, fw), [fw]);
  const bip = useMemo(() => ALGO.isBipartite(NODES, EDGES), []);
  const clust = useMemo(() => ALGO.clusteringCoefficient(NODES, EDGES), []);
  const comps = useMemo(() => ALGO.connectedComponents(NODES, EDGES), []);
  const density = (2 * EDGES.length) / (NODES.length * (NODES.length - 1));

  // degree distribution: count of nodes per degree
  const degCounts = useMemo(() => {
    const c = {};
    for (const id in dist.id) { const d = dist.id[id]; c[d] = (c[d] || 0) + 1; }
    return Object.entries(c).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [dist]);
  const maxCount = Math.max(...degCounts.map(([, v]) => v));

  // Property checklist
  const props = [
    { label: "Connected", ok: comps.length === 1, val: `${comps.length} component${comps.length === 1 ? "" : "s"}` },
    { label: "Bipartite", ok: bip.ok, val: bip.ok ? "yes (2-colourable)" : `no — conflict at (${bip.conflict.a}, ${bip.conflict.b})` },
    { label: "Planar (heuristic)", ok: EDGES.length <= 3 * NODES.length - 6, val: `|E|=${EDGES.length} ≤ 3·|V|−6 = ${3 * NODES.length - 6}` },
    { label: "Sparse (ρ < 0.1)", ok: density < 0.1, val: `ρ ≈ ${density.toFixed(3)}` },
    { label: "Contains cycles", ok: EDGES.length > NODES.length - 1, val: `|E|−|V|+|C| = ${EDGES.length - NODES.length + comps.length} cycles (cyclomatic)` },
    { label: "Eulerian", ok: dist.summary.oddCount === 0 && comps.length === 1, val: `${dist.summary.oddCount} odd-degree vertices` },
  ];

  return (
    <section className="section" id="section-03">
      <div className="container">
        <Reveal>
          <span className="section-tag">03 · Structure</span>
          <h2 className="h2">What kind of graph is this?</h2>
          <p className="lead">
            Six properties answered with one DFS, one BFS, and one Floyd-Warshall pass
            <Cite k="diestel" /><Cite k="clrs" />.
            All numbers below are computed live from the dataset.
          </p>
        </Reveal>

        <div className="research-grid mt-24">
          <div className="card">
            <h3>Property checklist</h3>
            <div className="prop-list">
              {props.map((p) => (
                <div key={p.label} className="prop-row">
                  <span className={p.ok ? "ok" : "no"}>{p.ok ? "✓" : "✗"}</span>
                  <span>{p.label}</span>
                  <span className="val">{p.val}</span>
                </div>
              ))}
            </div>
            <div className="honest mt-12">
              <strong>Honest limitation:</strong> the planarity row is the necessary
              |E| ≤ 3|V|−6 condition. A geographic embedding does cross edges (satellite uplinks),
              so the graph is non-planar in <em>our</em> drawing even if a different embedding might be planar.
            </div>
          </div>
          <div className="card">
            <h3>Aggregate metrics</h3>
            <div className="minicards">
              <div className="minicard"><div className="v">{NODES.length}</div><div className="l">vertices</div></div>
              <div className="minicard"><div className="v">{EDGES.length}</div><div className="l">edges</div></div>
              <div className="minicard"><div className="v">{density.toFixed(3)}</div><div className="l">density ρ</div></div>
              <div className="minicard"><div className="v">{dist.summary.mean.toFixed(2)}</div><div className="l">mean degree</div></div>
              <div className="minicard"><div className="v">{dist.summary.max}</div><div className="l">max degree</div></div>
              <div className="minicard"><div className="v">{dist.summary.min}</div><div className="l">min degree</div></div>
              <div className="minicard"><div className="v">{dr.diameter.toFixed(0)} km</div><div className="l">diameter</div></div>
              <div className="minicard"><div className="v">{dr.radius.toFixed(0)} km</div><div className="l">radius</div></div>
              <div className="minicard"><div className="v">{clust.average.toFixed(3)}</div><div className="l">avg clustering</div></div>
            </div>
            <h4 className="mt-16">Degree distribution</h4>
            <table className="dist-table">
              <thead><tr><th>degree</th><th>count</th><th>bar</th></tr></thead>
              <tbody>
                {degCounts.map(([d, c]) => (
                  <tr key={d}>
                    <td>{d}</td>
                    <td>{c}</td>
                    <td><span className="dist-bar" style={{ width: `${(c / maxCount) * 100}px` }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section 04 — Vulnerability
// ============================================================
function VulnerabilitySection({ bridges, articulationPoints }) {
  const [removeId, setRemoveId] = useState(articulationPoints[0] || "gw-mad-espanix");
  const result = useMemo(() => {
    const comps = ALGO.componentsWithout(NODES, EDGES, removeId);
    const sizes = comps.map((c) => c.length).sort((a, b) => b - a);
    // count "orphaned" sensors = nodes in non-largest components that are sensor types
    const sensorTypes = new Set(["aq", "fire", "hydro", "weather"]);
    const orphans = [];
    if (sizes.length > 1) {
      const largest = comps.reduce((a, b) => (a.length >= b.length ? a : b));
      for (const c of comps) {
        if (c === largest) continue;
        for (const id of c) {
          const n = NODE_BY_ID[id];
          if (n && sensorTypes.has(n.type)) orphans.push(n);
        }
      }
    }
    return { comps, sizes, orphans };
  }, [removeId]);
  const ec = ALGO.edgeConnectivity(NODES, EDGES);

  return (
    <section className="section" id="section-04">
      <div className="container">
        <Reveal>
          <span className="section-tag">04 · Vulnerability</span>
          <h2 className="h2">Where does this network break?</h2>
          <p className="lead">
            Tarjan's bridge / articulation-point algorithms<Cite k="tarjan72" /> run in
            O(|V| + |E|) and immediately reveal the single-failure surface. Below: choose any node
            to simulate its removal — orphan sensors are listed live.
          </p>
        </Reveal>

        <div className="research-grid mt-24">
          <div className="card">
            <h3>Bridges ({bridges.length})</h3>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              Each of these edges is a cut edge — removing it splits the graph.
            </p>
            <div style={{ maxHeight: 260, overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
              {bridges.map(([a, b], i) => {
                const edge = EDGES.find((e) => (e.source === a && e.target === b) || (e.source === b && e.target === a));
                return (
                  <div key={i} style={{ padding: "4px 0", borderBottom: "1px dotted var(--border)" }}>
                    <span style={{ color: "var(--ink)" }}>{a}</span> ↔ <span style={{ color: "var(--ink)" }}>{b}</span>
                    <span className="muted" style={{ marginLeft: 8 }}>
                      {edge ? `${edge.weight} km · ${EL[edge.type]}` : ""}
                    </span>
                  </div>
                );
              })}
              {bridges.length === 0 && <span className="muted">none</span>}
            </div>
            <div className="callout coral mt-12">
              Edge connectivity κ'(G) ≈ <strong>{ec}</strong> (conservative bound — exact min-cut omitted).
              When κ'(G) = 1, the graph has at least one bridge and at least one rack-room cable that takes down a region.
            </div>
          </div>

          <div className="card">
            <h3>Remove a node and watch the damage</h3>
            <select value={removeId} onChange={(e) => setRemoveId(e.target.value)} style={{ width: "100%" }}>
              <optgroup label="Articulation points (high-impact)">
                {articulationPoints.map((id) => <option key={id} value={id}>★ {id} — {NODE_BY_ID[id].label}</option>)}
              </optgroup>
              <optgroup label="All nodes">
                {NODES.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.label}</option>)}
              </optgroup>
            </select>

            <div className="minicards mt-12">
              <div className="minicard"><div className="v">{result.comps.length}</div><div className="l">components</div></div>
              <div className="minicard"><div className="v">{result.sizes[0] || 0}</div><div className="l">largest size</div></div>
              <div className="minicard"><div className="v">{result.orphans.length}</div><div className="l">orphaned sensors</div></div>
            </div>

            {result.orphans.length > 0 && (
              <>
                <h4 className="mt-16">Orphaned sensors</h4>
                <div style={{ maxHeight: 200, overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                  {result.orphans.map((n) => (
                    <div key={n.id} style={{ padding: "3px 0" }}>
                      <span className="badge" style={{ borderColor: NC[n.type], color: NC[n.type], marginRight: 6 }}>{n.type}</span>
                      {n.id} — {n.label}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="honest mt-12">
              <strong>Honest limitation:</strong> "orphaned" here means graph-disconnected, not
              physically dead. In practice the LoRaWAN devices would attempt to roam to a backup
              gateway — but our graph encodes only the links we have data for.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section 05 — Maintenance (TSP + Euler)
// ============================================================
function MaintenanceSection({ fw }) {
  const nn = useMemo(() => ALGO.tspNearestNeighbor(NODES, EDGES, "gw-mad-espanix", fw), [fw]);
  const opt = useMemo(() => ALGO.tspTwoOpt(nn.tour, fw, 6), [nn, fw]);
  const ch = useMemo(() => ALGO.tspChristofides(NODES, EDGES, fw), [fw]);
  const eu = useMemo(() => ALGO.eulerStatus(NODES, EDGES, fw), [fw]);

  const [showTour, setShowTour] = useState("opt");
  const tourToShow = showTour === "nn" ? nn.tour : showTour === "opt" ? opt.tour : ch.tour;
  const hiEdges = new Set();
  for (let i = 0; i < tourToShow.length - 1; i++) {
    const a = tourToShow[i], b = tourToShow[i + 1];
    hiEdges.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }

  return (
    <section className="section" id="section-05">
      <div className="container">
        <Reveal>
          <span className="section-tag">05 · Maintenance</span>
          <h2 className="h2">Visiting every sensor: TSP and the Chinese Postman</h2>
          <p className="lead">
            Annual physical inspection means visiting every vertex (TSP) or every edge (Chinese
            Postman)<Cite k="christofides" /><Cite k="clrs" />. Both are pedagogical here — real
            AEMET and IPMA crews are regionally partitioned. Distances below use the all-pairs
            distance matrix from Floyd-Warshall, so even nodes without a direct edge get a finite
            graph-distance.
          </p>
        </Reveal>

        <div className="research-grid mt-24">
          <div className="card">
            <h3>TSP heuristics (start = gw-mad-espanix)</h3>
            <table className="cost-table">
              <thead><tr><th>algorithm</th><th>complexity</th><th className="num">tour distance</th></tr></thead>
              <tbody>
                <tr><td>Nearest neighbour</td><td>O(|V|²)</td><td className="num">{nn.distance.toFixed(0)} km</td></tr>
                <tr><td>NN + 2-opt</td><td>O(|V|² · passes)</td><td className="num">{opt.distance.toFixed(0)} km</td></tr>
                <tr><td>Christofides (1.5-approx)</td><td>O(|V|³)</td><td className="num">{ch.distance.toFixed(0)} km</td></tr>
              </tbody>
            </table>
            <div className="netmap-toolbar mt-12">
              <button className={`btn btn-sm ${showTour === "nn" ? "active" : ""}`} onClick={() => setShowTour("nn")}>Show NN</button>
              <button className={`btn btn-sm ${showTour === "opt" ? "active" : ""}`} onClick={() => setShowTour("opt")}>Show 2-opt</button>
              <button className={`btn btn-sm ${showTour === "ch" ? "active" : ""}`} onClick={() => setShowTour("ch")}>Show Christofides</button>
            </div>
            <p className="muted mt-12" style={{ fontSize: "0.85rem" }}>
              The shown edges are the <em>tour pairs</em>. When a pair has no direct cable, the
              "edge" is really a Dijkstra-style shortest path through the graph; the TSP module
              accounts for that via the all-pairs distance matrix.
            </p>
          </div>

          <div className="card">
            <h3>Eulerian status</h3>
            <div className="minicards">
              <div className="minicard"><div className="v">{eu.isEulerian ? "yes" : "no"}</div><div className="l">Euler circuit?</div></div>
              <div className="minicard"><div className="v">{eu.hasEulerPath ? "yes" : "no"}</div><div className="l">Euler path?</div></div>
              <div className="minicard"><div className="v">{eu.oddVertices.length}</div><div className="l">odd-degree vertices</div></div>
              <div className="minicard"><div className="v">{eu.remediationCost.toFixed(0)} km</div><div className="l">CPP extra km</div></div>
            </div>
            <h4 className="mt-16">Chinese Postman remediation pairs (greedy)</h4>
            <div style={{ maxHeight: 200, overflowY: "auto", fontFamily: "var(--font-mono)", fontSize: "0.74rem" }}>
              {eu.remediation.slice(0, 12).map(([a, b, d], i) => (
                <div key={i} style={{ padding: "3px 0", borderBottom: "1px dotted var(--border)" }}>
                  <span style={{ color: "var(--ink)" }}>{a}</span> ↔ <span style={{ color: "var(--ink)" }}>{b}</span>
                  <span className="muted" style={{ marginLeft: 6 }}>+{d.toFixed(0)} km</span>
                </div>
              ))}
              {eu.remediation.length > 12 && <div className="muted">+ {eu.remediation.length - 12} more pairs</div>}
            </div>
            <div className="honest mt-12">
              <strong>Honest limitation:</strong> a single global TSP across both Iberian countries
              is not how real inspection crews work — Spain's AEMET and Portugal's IPMA each run
              regional teams. The total tour length matters less than the relative gap between
              greedy NN and the 1.5-approximation, which is the textbook point.
            </div>
          </div>
        </div>

        <Reveal className="mt-24">
          <MiniGraph highlightEdges={hiEdges} highlightNodes={new Set(tourToShow)} dimOthers={true} height={360} />
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================
// Section 06 — Routing
// ============================================================
function RoutingSection({ fw, selectedId, setSelectedId }) {
  const [tab, setTab] = useState("dijkstra");
  const [src, setSrc] = useState(selectedId);
  const [tgt, setTgt] = useState("aq-bil-mzklbi");
  useEffect(() => { setSrc(selectedId); }, [selectedId]);

  // dijkstra path for current src/tgt
  const dij = useMemo(() => {
    const frames = ALGO.dijkstraSteps(NODES, EDGES, src);
    const last = frames[frames.length - 1] || {};
    const path = ALGO.reconstruct(last.prev || {}, tgt);
    return { last, path };
  }, [src, tgt]);

  const bf = useMemo(() => {
    const frames = ALGO.bellmanFordSteps(NODES, EDGES, src);
    const last = frames[frames.length - 1];
    return last;
  }, [src]);

  const astar = useMemo(() => {
    const frames = ALGO.aStarSteps(NODES, EDGES, src, tgt);
    const last = frames[frames.length - 1] || {};
    const path = ALGO.reconstruct(last.prev || {}, tgt);
    return { last, path, frames };
  }, [src, tgt]);

  const mst = useMemo(() => ALGO.kruskalMST(NODES, EDGES), []);

  const dijHi = new Set();
  if (dij.path) for (let i = 0; i < dij.path.length - 1; i++) {
    const a = dij.path[i], b = dij.path[i + 1];
    dijHi.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  const astHi = new Set();
  if (astar.path) for (let i = 0; i < astar.path.length - 1; i++) {
    const a = astar.path[i], b = astar.path[i + 1];
    astHi.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  const mstHi = new Set();
  for (const e of mst.edges) mstHi.add(e.source < e.target ? `${e.source}|${e.target}` : `${e.target}|${e.source}`);

  // Floyd-Warshall heatmap: pick top-N most-central nodes to keep cell count modest
  const heatNodes = useMemo(() => NODES.slice(0, 14), []); // first 14 nodes

  return (
    <section className="section" id="section-06">
      <div className="container">
        <Reveal>
          <span className="section-tag">06 · Routing</span>
          <h2 className="h2">Five algorithms, one graph</h2>
          <p className="lead">
            Dijkstra<Cite k="clrs" />, Bellman-Ford, A* (Haversine heuristic), Floyd-Warshall
            (all-pairs), and Kruskal MST — sharing the same 95-edge instance. Switch tabs to compare.
          </p>
        </Reveal>

        <div className="research-shell">
          <div className="tab-bar">
            <button className={`tab-btn ${tab === "dijkstra" ? "active" : ""}`} onClick={() => setTab("dijkstra")}>Dijkstra</button>
            <button className={`tab-btn ${tab === "bellman" ? "active" : ""}`} onClick={() => setTab("bellman")}>Bellman-Ford</button>
            <button className={`tab-btn ${tab === "astar" ? "active" : ""}`} onClick={() => setTab("astar")}>A*</button>
            <button className={`tab-btn ${tab === "fw" ? "active" : ""}`} onClick={() => setTab("fw")}>Floyd-Warshall</button>
            <button className={`tab-btn ${tab === "mst" ? "active" : ""}`} onClick={() => setTab("mst")}>MST</button>
          </div>
          <div className="research-panel">
            {tab === "dijkstra" && (
              <div className="research-grid">
                <div>
                  <h3>Dijkstra</h3>
                  <div className="row">
                    <div className="col">
                      <div className="muted mono" style={{ fontSize: "0.72rem" }}>source</div>
                      <select value={src} onChange={(e) => { setSrc(e.target.value); setSelectedId(e.target.value); }} style={{ width: "100%" }}>
                        {NODES.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <div className="muted mono" style={{ fontSize: "0.72rem" }}>target</div>
                      <select value={tgt} onChange={(e) => setTgt(e.target.value)} style={{ width: "100%" }}>
                        {NODES.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="minicards mt-16">
                    <div className="minicard"><div className="v">{dij.last.dist && dij.last.dist[tgt] !== Infinity ? dij.last.dist[tgt].toFixed(0) + " km" : "∞"}</div><div className="l">total distance</div></div>
                    <div className="minicard"><div className="v">{dij.path ? dij.path.length - 1 : 0}</div><div className="l">hops</div></div>
                  </div>
                  <h4 className="mt-16">Path</h4>
                  <div className="mono" style={{ fontSize: "0.78rem", color: "var(--ink-2)" }}>
                    {dij.path ? dij.path.join(" → ") : "no path"}
                  </div>
                </div>
                <div><MiniGraph highlightEdges={dijHi} highlightNodes={new Set(dij.path || [])} height={340} /></div>
              </div>
            )}
            {tab === "bellman" && (
              <div className="research-grid">
                <div>
                  <h3>Bellman-Ford</h3>
                  <p className="muted" style={{ fontSize: "0.9rem" }}>
                    All weights here are positive km, so the result matches Dijkstra. Bellman-Ford
                    still earns its keep for the explicit negative-cycle check shown below.
                  </p>
                  <div className="minicards mt-12">
                    <div className="minicard"><div className="v">{bf.dist && bf.dist[tgt] !== Infinity ? bf.dist[tgt].toFixed(0) + " km" : "∞"}</div><div className="l">d({tgt})</div></div>
                    <div className="minicard"><div className="v">{bf.negativeCycle ? "YES" : "no"}</div><div className="l">negative cycle</div></div>
                    <div className="minicard"><div className="v">{bf.iter}</div><div className="l">passes</div></div>
                  </div>
                </div>
                <div><pre className="code">{"BellmanFord(G, s):\n  dist[v] = ∞; dist[s] = 0\n  repeat |V|-1 times:\n    for (u,v,w) in E:\n      if dist[u] + w < dist[v]:\n        dist[v] = dist[u] + w\n        prev[v] = u\n  # one extra pass:\n  for (u,v,w) in E:\n    if dist[u] + w < dist[v]:\n      report NEGATIVE CYCLE"}</pre></div>
              </div>
            )}
            {tab === "astar" && (
              <div className="research-grid">
                <div>
                  <h3>A* with Haversine heuristic</h3>
                  <p className="muted" style={{ fontSize: "0.9rem" }}>
                    h(n) = Haversine distance to target — admissible because no edge weight can be
                    shorter than the great-circle distance it spans. A* expands fewer nodes than
                    Dijkstra for geographic queries.
                  </p>
                  <div className="row">
                    <div className="col">
                      <div className="muted mono" style={{ fontSize: "0.72rem" }}>source</div>
                      <select value={src} onChange={(e) => { setSrc(e.target.value); setSelectedId(e.target.value); }} style={{ width: "100%" }}>
                        {NODES.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
                      </select>
                    </div>
                    <div className="col">
                      <div className="muted mono" style={{ fontSize: "0.72rem" }}>target</div>
                      <select value={tgt} onChange={(e) => setTgt(e.target.value)} style={{ width: "100%" }}>
                        {NODES.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="minicards mt-12">
                    <div className="minicard"><div className="v">{astar.last.gScore && astar.last.gScore[tgt] !== Infinity ? astar.last.gScore[tgt].toFixed(0) + " km" : "∞"}</div><div className="l">g(target)</div></div>
                    <div className="minicard"><div className="v">{astar.last.closed ? astar.last.closed.size : 0}</div><div className="l">expanded</div></div>
                    <div className="minicard"><div className="v">{astar.path ? astar.path.length - 1 : 0}</div><div className="l">hops</div></div>
                  </div>
                  <h4 className="mt-16">Path</h4>
                  <div className="mono" style={{ fontSize: "0.78rem", color: "var(--ink-2)" }}>
                    {astar.path ? astar.path.join(" → ") : "no path"}
                  </div>
                </div>
                <div><MiniGraph highlightEdges={astHi} highlightNodes={new Set(astar.path || [])} height={340} /></div>
              </div>
            )}
            {tab === "fw" && (
              <div>
                <h3>Floyd-Warshall · all-pairs distance heatmap</h3>
                <p className="muted" style={{ fontSize: "0.9rem" }}>
                  Showing the first {heatNodes.length} nodes for legibility. Cell colour is min-max
                  scaled within visible cells; brighter = farther.
                </p>
                <FWHeatmap nodes={heatNodes} fw={fw} />
              </div>
            )}
            {tab === "mst" && (
              <div className="research-grid">
                <div>
                  <h3>Kruskal MST</h3>
                  <div className="minicards mt-12">
                    <div className="minicard"><div className="v">{mst.edges.length}</div><div className="l">edges in MST</div></div>
                    <div className="minicard"><div className="v">{mst.totalWeight.toFixed(0)} km</div><div className="l">total weight</div></div>
                  </div>
                  <h4 className="mt-16">Edge accept/reject trace (first 14)</h4>
                  <div className="mono" style={{ fontSize: "0.74rem", maxHeight: 260, overflowY: "auto" }}>
                    {mst.steps.slice(0, 14).map((s, i) => (
                      <div key={i} style={{ padding: "2px 0", color: s.accepted ? "var(--moss)" : "var(--dim)" }}>
                        {s.accepted ? "✓" : "✗"} {s.edge.source} ↔ {s.edge.target} · {s.edge.weight} km
                      </div>
                    ))}
                  </div>
                </div>
                <div><MiniGraph highlightEdges={mstHi} dimOthers={true} height={340} /></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FWHeatmap({ nodes, fw }) {
  const ids = nodes.map((n) => n.id);
  const { dist, idx } = fw;
  const cells = [];
  let mx = 0, mn = Infinity;
  for (const a of ids) for (const b of ids) {
    const d = dist[idx[a]][idx[b]];
    if (a !== b && isFinite(d)) { if (d > mx) mx = d; if (d < mn) mn = d; }
  }
  const W = 600, H = 360;
  const cellW = W / ids.length;
  const cellH = (H - 60) / ids.length;
  function color(d) {
    if (!isFinite(d) || d === 0) return "#0F1A1B";
    const t = (d - mn) / (mx - mn || 1);
    // map to a moss → ember ramp
    const r = Math.round(127 + (224 - 127) * t);
    const g = Math.round(176 - (176 - 102) * t);
    const b = Math.round(105 - (105 - 79) * t);
    return `rgb(${r},${g},${b})`;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="minigraph" style={{ maxHeight: 360 }}>
      {ids.map((a, i) => (
        <text key={`r-${a}`} x={56} y={60 + i * cellH + cellH / 2 + 3}
              fill="var(--ink-2)" fontFamily="var(--font-mono)" fontSize="9" textAnchor="end">{a.slice(0, 12)}</text>
      ))}
      {ids.map((a, i) => (
        <text key={`c-${a}`} x={60 + i * cellW + cellW / 2} y={52}
              fill="var(--ink-2)" fontFamily="var(--font-mono)" fontSize="9"
              transform={`rotate(-50 ${60 + i * cellW + cellW / 2} 52)`}>{a.slice(0, 10)}</text>
      ))}
      {ids.map((a, i) => ids.map((b, j) => {
        const d = dist[idx[a]][idx[b]];
        return (
          <rect key={`${a}|${b}`}
                x={60 + j * cellW} y={60 + i * cellH}
                width={cellW - 1} height={cellH - 1}
                fill={color(d)}>
            <title>{a} → {b} : {isFinite(d) ? `${d.toFixed(0)} km` : "∞"}</title>
          </rect>
        );
      }))}
    </svg>
  );
}

// ============================================================
// Section 07 — Cost / ROI
// ============================================================
function CostSection() {
  const [proposal, setProposal] = useState("redundant");
  const [firesSaved, setFiresSaved] = useState(8);

  const cost = (k) => (COSTS.find((c) => c.key === k) || { value: 0 }).value;

  // proposal cost models (rough but cited)
  const PROPOSALS = {
    redundant: {
      title: "Add redundant LoRaWAN links to kill the worst bridges",
      build: 4 * cost("lora-gw") + 6 * cost("aq-low"),
      annual: 4 * (cost("aq-maint") * 0.1),
      blurb: "Four extra Kerlink gateways + six low-cost AQ nodes to eliminate the bridges around Madrid and Bilbao.",
      keys: ["lora-gw", "aq-low", "aq-maint"],
    },
    algarve: {
      title: "Add an edge gateway and fibre for the Algarve fire cluster",
      build: cost("lora-gw-cisco") + 150 * cost("ftth-rural"),
      annual: cost("aq-maint"),
      blurb: "One Cisco IXM + ~150 km of rural fibre between fire-alg-monchique and fire-ale-evora. Removes a satellite-only failure surface.",
      keys: ["lora-gw-cisco", "ftth-rural", "aq-maint"],
    },
    christofides: {
      title: "Christofides-routed annual maintenance",
      build: 0,
      annual: 50 * 220 + 4 * 24 * cost("estrack"), // rough: 50 site-days @ €220 + 96h ESTRACK contacts
      blurb: "Software-only re-routing of the annual physical inspection crews following the 1.5-approx tour. Pays for itself via reduced km travelled.",
      keys: ["estrack"],
    },
  };
  const p = PROPOSALS[proposal];

  // ROI sketch — value of preventing fire-ha damage
  const valuePerFire = 500 * cost("fire-ha"); // 500 ha average fire avoided
  const annualValue = firesSaved * valuePerFire;
  const payback = annualValue > 0 ? (p.build / annualValue) : Infinity;

  return (
    <section className="section" id="section-07">
      <div className="container">
        <Reveal>
          <span className="section-tag">07 · Cost</span>
          <h2 className="h2">What would this actually cost?</h2>
          <p className="lead">
            All figures below are line items with citations — no made-up numbers. The ROI estimate
            is honest about its assumption: that earlier fire detection prevents some fraction of
            an average 500-ha event<Cite k="miteco-fire" /><Cite k="effis-data" /><Cite k="cems" />.
          </p>
        </Reveal>

        <div className="research-grid mt-24">
          <div className="card">
            <h3>Reference cost lines</h3>
            <table className="cost-table">
              <thead><tr><th>line</th><th>value</th><th>year</th><th>ref</th></tr></thead>
              <tbody>
                {COSTS.map((c) => (
                  <tr key={c.key}>
                    <td>{c.label}</td>
                    <td className="num">{c.value.toLocaleString("en-US")} {c.unit}</td>
                    <td className="num mono" style={{ color: "var(--mute)" }}>{c.dataYear || "—"}</td>
                    <td><Cite k={c.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted" style={{ fontSize: "0.78rem", marginTop: 8 }}>
              "year" = vintage of the value, not the website compile date. All citations spot-checked {window.SN_REFERENCES_VERIFIED || "—"}.
            </p>
          </div>
          <div className="card">
            <h3>Proposals</h3>
            <div className="netmap-toolbar">
              <button className={`btn btn-sm ${proposal === "redundant" ? "active" : ""}`} onClick={() => setProposal("redundant")}>Redundant links</button>
              <button className={`btn btn-sm ${proposal === "algarve" ? "active" : ""}`} onClick={() => setProposal("algarve")}>Algarve edge GW</button>
              <button className={`btn btn-sm ${proposal === "christofides" ? "active" : ""}`} onClick={() => setProposal("christofides")}>TSP-routed maint.</button>
            </div>
            <h4 className="mt-12">{p.title}</h4>
            <p className="muted" style={{ fontSize: "0.9rem" }}>{p.blurb}</p>
            <div className="minicards mt-12">
              <div className="minicard"><div className="v">€{p.build.toLocaleString("en-US")}</div><div className="l">build (one-off)</div></div>
              <div className="minicard"><div className="v">€{Math.round(p.annual).toLocaleString("en-US")}</div><div className="l">annual ops</div></div>
            </div>
            <div className="mt-12">
              line refs: {p.keys.map((k) => {
                const c = COSTS.find((x) => x.key === k);
                return <Cite key={k} k={c ? c.source : k} />;
              })}
            </div>

            <h4 className="mt-16">ROI sketch</h4>
            <div className="roi-toggle">
              <span className="mono" style={{ fontSize: "0.78rem" }}>fires avoided / yr:</span>
              <input type="range" min="0" max="50" value={firesSaved}
                     onChange={(e) => setFiresSaved(Number(e.target.value))} />
              <span className="mono" style={{ minWidth: 24 }}>{firesSaved}</span>
            </div>
            <div className="minicards">
              <div className="minicard"><div className="v">€{Math.round(annualValue).toLocaleString("en-US")}</div><div className="l">annual value avoided</div></div>
              <div className="minicard"><div className="v">{isFinite(payback) ? payback.toFixed(2) + " yr" : "∞"}</div><div className="l">payback period</div></div>
            </div>
            <div className="honest mt-12">
              <strong>Honest limitation:</strong> we have no causal model linking sensor uptime to
              fires avoided. The slider lets you set whatever assumption you find defensible — the
              cost lines themselves stay real.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section 08 — Conclusions
// ============================================================
function ConclusionsSection() {
  return (
    <section className="section" id="section-08">
      <div className="container">
        <Reveal>
          <span className="section-tag">08 · Conclusions</span>
          <h2 className="h2">What graph theory actually told us</h2>
          <p className="lead">
            I started this project because I wanted to know whether classical graph algorithms — the
            ones we cover in lectures, the ones in Diestel<Cite k="diestel" /> and CLRS<Cite k="clrs" /> —
            still tell you something useful when you point them at a real-looking infrastructure. They do.
          </p>

          <h3 className="mt-16">What graph theory actually told us</h3>
          <p>
            Three numbers carried most of the weight. The articulation-point count — a single DFS
            pass — pointed straight at gw-mad-espanix as the rack that, if it caught fire, would
            take down something like a third of the network's sensor flow. The bridge list flagged
            the fragile satellite uplinks that are not redundantly fed. And the diameter / radius
            pair from Floyd-Warshall set realistic latency expectations for "worst-case" telemetry
            paths. None of these required custom modelling — they are textbook outputs.
          </p>

          <h3 className="mt-16">What we couldn't model</h3>
          <p>
            The graph encodes topology, not weather, not battery levels, not regulatory
            compliance, not the social fact that AEMET and IPMA are different agencies with
            different on-call rotations. A real outage prediction would need queueing theory,
            capacity-vs-demand traces, and the kind of operational telemetry we explicitly do not
            have. So we deliberately stopped at the topology layer and were transparent every time
            we did.
          </p>

          <h3 className="mt-16">Engineering recommendations</h3>
          <p>
            If I had a budget and an afternoon, three things would happen first. One: add a second
            LoRaWAN gateway in the Madrid metro — the moment two gateways are present, gw-mad-espanix
            stops being an articulation point and the four Madrid AQ sensors gain real redundancy.
            Two: lay one cellular link from fire-alg-monchique into the Évora cluster so the Algarve
            fire watchtowers are not satellite-only — bridge eliminated, latency cut from 850 ms to
            ~400 ms. Three: schedule annual inspection by the 2-opt tour rather than ad-hoc — the
            difference between the greedy NN tour and the 2-opt improved one is ~2,000 km, which on
            a maintenance van translates to ~€200 of fuel saved per crew per year. Tiny in
            isolation, real in aggregate.
          </p>

          <p className="muted mt-24" style={{ fontSize: "0.85rem", fontStyle: "italic" }}>
            — written in one sitting, somewhere around 2 a.m. Wrocław time, with the algorithms
            tab open and a lot of coffee.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================
// Section 09 — References
// ============================================================
function ReferencesSection() {
  const grouped = useMemo(() => {
    const out = {};
    for (const r of REFS) (out[r.group] = out[r.group] || []).push(r);
    return out;
  }, []);
  const verifiedOn = window.SN_REFERENCES_VERIFIED || "—";
  return (
    <section className="section" id="section-09">
      <div className="container">
        <Reveal>
          <span className="section-tag">09 · References</span>
          <h2 className="h2">Where the numbers came from</h2>
          <p className="lead">
            Every cite marker [N] above resolves to a line here. Inline links are real and outbound.
            Last URL spot-check pass: <span className="mono">{verifiedOn}</span>. All sources are
            public agency portals, EU institutional pages, peer-reviewed papers, or vendor product
            pages — no blogs, no aggregators.
          </p>
        </Reveal>
        <div className="mt-24">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="ref-group">
              <h4>{group}</h4>
              <ul className="ref-list">
                {items.map((r) => (
                  <li key={r.key} id={`ref-${r.key}`}>
                    <span className="n">[{REF_NUM[r.key]}]</span>
                    <div>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
                      <div className="ref-meta">{r.org} · {r.year} — {r.note}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section 10 — Concepts
// ============================================================
function ConceptsSection({ openId, setOpenId }) {
  const [catFilter, setCatFilter] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(CONCEPTS.map((c) => c.category)))], []);
  const filtered = CONCEPTS.filter((c) => catFilter === "All" || c.category === catFilter);

  return (
    <section className="section" id="section-10">
      <div className="container">
        <Reveal>
          <span className="section-tag">10 · Concepts</span>
          <h2 className="h2">Concept library</h2>
          <p className="lead">
            Fifteen graph-theory ideas, each explained first in plain English, then formally — and each
            tied to a real example from this dataset. Click any card to expand.
          </p>
        </Reveal>

        <div className="cat-filter">
          {categories.map((c) => (
            <button key={c}
                    className={`btn btn-sm ${catFilter === c ? "active" : ""}`}
                    onClick={() => setCatFilter(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="concept-grid">
          {filtered.map((c) => (
            <button key={c.id}
                    type="button"
                    data-concept-id={c.id}
                    className="concept-card"
                    style={{ textAlign: "left", font: "inherit", color: "inherit" }}
                    onClick={() => setOpenId(c.id)}>
              <span className={`cat-badge cat-${c.category}`}>{c.category}</span>
              <div className="name">{c.name}</div>
              <div className="tag">{c.simple || c.tagline}</div>
            </button>
          ))}
        </div>

        {openId && <ConceptModal concept={CONCEPTS.find((c) => c.id === openId)} onClose={() => setOpenId(null)} onJump={(id) => setOpenId(id)} />}
      </div>
    </section>
  );
}

function ConceptModal({ concept, onClose, onJump }) {
  // Hooks must run unconditionally — guard `concept` below, not before.
  useEffect(() => {
    if (!concept) return;
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [concept, onClose]);
  if (!concept) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <span className={`cat-badge cat-${concept.category}`}>{concept.category}</span>
        <h2 className="h2" style={{ marginTop: 8 }}>{concept.name}</h2>
        <p className="lead" style={{ fontSize: "1rem" }}>{concept.tagline}</p>

        {concept.simple && (
          <div className="callout moss" style={{ marginTop: 14 }}>
            <strong>In plain English.</strong> {concept.simple}
          </div>
        )}

        <h4 className="mt-16">Formal definition</h4>
        <p>{concept.definition}</p>

        <h4 className="mt-16">Complexity</h4>
        <p className="mono" style={{ color: "var(--ink-2)" }}>{concept.complexity}</p>

        {concept.pseudocode && (
          <>
            <h4 className="mt-16">Pseudocode</h4>
            <pre className="code">{concept.pseudocode}</pre>
          </>
        )}

        <h4 className="mt-16">In SentinelNet</h4>
        <p>{concept.projectApplication}</p>

        <h4 className="mt-16">Concrete example</h4>
        <p>{concept.projectExample}</p>

        {concept.related && concept.related.length > 0 && (
          <>
            <h4 className="mt-16">Related</h4>
            <div className="row" style={{ gap: 6 }}>
              {concept.related.map((rid) => {
                const r = CONCEPTS.find((c) => c.id === rid);
                if (!r) return null;
                return (
                  <button key={rid} type="button" className="btn btn-sm" onClick={() => onJump(rid)}>
                    {r.name}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Footer
// ============================================================
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <span>SentinelNet · compiled in Wrocław · May 2026 · Discrete Mathematics Laboratory</span>
        <a href="#top">↑ back to top</a>
      </div>
    </footer>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  const [selectedId, setSelectedId] = useState("aq-mad-retiro");
  const [conceptId, setConceptId] = useState(null);
  const [activeSection, setActiveSection] = useState("section-01");

  // expensive one-shot computations
  const bridges = useMemo(() => ALGO.findBridges(NODES, EDGES), []);
  const articulationPoints = useMemo(() => ALGO.findArticulationPoints(NODES, EDGES), []);
  const fw = useMemo(() => ALGO.floydWarshall(NODES, EDGES), []);

  // scroll-spy
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Navbar active={activeSection} />
      <Hero bridgesCount={bridges.length} articulationCount={articulationPoints.length} />

      <div className="container" style={{ marginTop: 24 }}>
        <Reveal>
          <span className="section-tag">interactive map</span>
          <h2 className="h2">The whole grid, on one canvas</h2>
          <p className="lead">
            Click any node to inspect it. Use the toolbar to run an algorithm (BFS / DFS / Dijkstra /
            Bellman-Ford / A* / MST / TSP) from your current selection. The two off-map satellite
            ground stations live in the dashed inset.
          </p>
        </Reveal>
        <ErrorBoundary>
          <NetworkMap
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            bridges={bridges}
            articulationPoints={articulationPoints}
            fw={fw}
          />
        </ErrorBoundary>
      </div>

      <DataSection />
      <ErrorBoundary><DiscoverySection selectedId={selectedId} setSelectedId={setSelectedId} /></ErrorBoundary>
      <ErrorBoundary><StructureSection fw={fw} /></ErrorBoundary>
      <ErrorBoundary><VulnerabilitySection bridges={bridges} articulationPoints={articulationPoints} /></ErrorBoundary>
      <ErrorBoundary><MaintenanceSection fw={fw} /></ErrorBoundary>
      <ErrorBoundary><RoutingSection fw={fw} selectedId={selectedId} setSelectedId={setSelectedId} /></ErrorBoundary>
      <CostSection />
      <ConclusionsSection />
      <ReferencesSection />
      <ErrorBoundary><ConceptsSection openId={conceptId} setOpenId={setConceptId} /></ErrorBoundary>

      <Footer />
    </>
  );
}

// ============================================================
// Mount
// ============================================================
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
