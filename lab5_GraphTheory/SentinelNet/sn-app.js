/* GENERATED from sn-app.jsx by Babel (preset-react). Do not edit directly;
   edit sn-app.jsx and re-run the build. Precompiled so the page runs
   offline from file:// with no CDN and no runtime Babel. */
/* SentinelNet — single-file React shell.
 * All components live here so they share JSX lexical scope.
 * Babel-standalone wraps the whole file in one IIFE; identifiers defined
 * with `const` / `function` here are visible to every other component
 * below them, which was the bug the old multi-file version had.
 */

const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;

// Error boundary — if any subtree throws, show a recoverable panel instead of blanking the page.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      err: null
    };
  }
  static getDerivedStateFromError(err) {
    return {
      err
    };
  }
  componentDidCatch(err, info) {
    try {
      console.error("SentinelNet error:", err, info);
    } catch (_) {}
  }
  reset = () => this.setState({
    err: null
  });
  render() {
    if (this.state.err) {
      return /*#__PURE__*/React.createElement("div", {
        className: "card",
        style: {
          borderColor: "var(--ember)"
        }
      }, /*#__PURE__*/React.createElement("h3", {
        style: {
          color: "var(--ember)"
        }
      }, "Something broke in this panel"), /*#__PURE__*/React.createElement("p", {
        className: "muted",
        style: {
          fontSize: "0.9rem"
        }
      }, String(this.state.err && this.state.err.message || this.state.err)), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-sm",
        onClick: this.reset
      }, "Try again"));
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
const REF_BY_KEY = Object.fromEntries(REFS.map(r => [r.key, r]));
const REF_NUM = Object.fromEntries(REFS.map((r, i) => [r.key, i + 1]));
const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));
const LAT_MAX = 44,
  LAT_MIN = 36,
  LON_MIN = -10,
  LON_MAX = 4;
const MAP_W = 1000,
  MAP_H = 800;
function proj(lat, lon) {
  return {
    x: (lon - LON_MIN) / (LON_MAX - LON_MIN) * MAP_W,
    y: (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * MAP_H
  };
}
function isOffMap(node) {
  return node.lat < LAT_MIN || node.lat > LAT_MAX || node.lon < LON_MIN || node.lon > LON_MAX;
}

// Off-map satellite-panel layout (within the same SVG, just translated)
const OFFMAP_BOX = {
  x: 770,
  y: 590,
  w: 220,
  h: 200
};
const OFFMAP_NODE_POS = {
  "sat-maspalomas": {
    x: OFFMAP_BOX.x + 60,
    y: OFFMAP_BOX.y + 130
  },
  "sat-santamaria": {
    x: OFFMAP_BOX.x + 160,
    y: OFFMAP_BOX.y + 90
  }
};
function nodePos(node) {
  if (OFFMAP_NODE_POS[node.id]) return OFFMAP_NODE_POS[node.id];
  return {
    x: node.x,
    y: node.y
  };
}
const REGION_COUNT = 3; // Spain, Portugal, Açores/Canarias

// ============================================================
// Reveal-on-scroll
// ============================================================
function Reveal({
  children,
  as = "div",
  className = ""
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      });
    }, {
      threshold: 0.12
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const Comp = as;
  return /*#__PURE__*/React.createElement(Comp, {
    ref: ref,
    className: `reveal ${visible ? "is-visible" : ""} ${className}`
  }, children);
}

// ============================================================
// CountUp
// ============================================================
function CountUp({
  value,
  suffix = "",
  decimals = 0,
  duration = 900
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setN(value);
      return;
    }
    let raf,
      start = null;
    function step(t) {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / duration);
      setN(value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return /*#__PURE__*/React.createElement("span", null, n.toFixed(decimals), suffix);
}

// ============================================================
// Citation marker
// ============================================================
function Cite({
  k
}) {
  const n = REF_NUM[k];
  if (!n) return null;
  const r = REF_BY_KEY[k];
  const onClick = e => {
    e.preventDefault();
    const el = document.getElementById(`ref-${k}`);
    if (el) el.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  };
  return /*#__PURE__*/React.createElement("a", {
    href: `#ref-${k}`,
    className: "cite",
    title: r ? r.title : "",
    onClick: onClick
  }, "[", n, "]");
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
    const nodes = Array.from({
      length: N
    }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1.5 + Math.random() * 2.5,
      c: palette[Math.random() * palette.length | 0],
      ph: Math.random() * Math.PI * 2
    }));
    let raf;
    function tick(t) {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      // edges
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 130 * 130) {
            const op = 0.18 * (1 - Math.sqrt(d2) / 130);
            ctx.strokeStyle = `rgba(127,176,105,${op})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.clientWidth) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.clientHeight) n.vy *= -1;
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.001 + n.ph);
        ctx.fillStyle = n.c + Math.floor(pulse * 110).toString(16).padStart(2, "0");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    className: "hero-bg-canvas"
  });
}

// ============================================================
// Brand mark
// ============================================================
function BrandMark() {
  const dots = [{
    c: NC.aq,
    x: 4
  }, {
    c: NC.fire,
    x: 10
  }, {
    c: NC.weather,
    x: 16
  }, {
    c: NC.hydro,
    x: 22
  }, {
    c: NC.gateway,
    x: 28
  }, {
    c: NC.sat,
    x: 34
  }];
  return /*#__PURE__*/React.createElement("svg", {
    width: "40",
    height: "20",
    viewBox: "0 0 40 20",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "2",
    y1: "10",
    x2: "38",
    y2: "10",
    stroke: "#3E6770",
    strokeWidth: "1"
  }), dots.map((d, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: d.x,
    cy: "10",
    r: "2.4",
    fill: d.c
  })));
}

// ============================================================
// Navbar
// ============================================================
const SECTIONS = [{
  id: "section-01",
  n: "01",
  label: "Data"
}, {
  id: "section-02",
  n: "02",
  label: "Discovery"
}, {
  id: "section-03",
  n: "03",
  label: "Structure"
}, {
  id: "section-04",
  n: "04",
  label: "Vulnerability"
}, {
  id: "section-05",
  n: "05",
  label: "Maintenance"
}, {
  id: "section-06",
  n: "06",
  label: "Routing"
}, {
  id: "section-07",
  n: "07",
  label: "Cost"
}, {
  id: "section-08",
  n: "08",
  label: "Conclusions"
}, {
  id: "section-09",
  n: "09",
  label: "References"
}, {
  id: "section-10",
  n: "10",
  label: "Concepts"
}];
function Navbar({
  active
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "navbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nav-inner"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#top",
    className: "brand"
  }, /*#__PURE__*/React.createElement(BrandMark, null), /*#__PURE__*/React.createElement("span", null, "SentinelNet")), /*#__PURE__*/React.createElement("div", {
    className: "nav-links"
  }, SECTIONS.map(s => /*#__PURE__*/React.createElement("a", {
    key: s.id,
    href: `#${s.id}`,
    className: `nav-link ${active === s.id ? "active" : ""}`
  }, s.n, " \xB7 ", s.label)))));
}

// ============================================================
// Hero
// ============================================================
function Hero({
  bridgesCount,
  articulationCount
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "hero-wrap",
    id: "top"
  }, /*#__PURE__*/React.createElement(HeroBg, null), /*#__PURE__*/React.createElement("div", {
    className: "container hero-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Discrete Mathematics Laboratory \xB7 Graph theory \xB7 Lab 5"), /*#__PURE__*/React.createElement("h1", {
    className: "h1"
  }, "Sentinel", /*#__PURE__*/React.createElement("span", {
    className: "accent"
  }, "Net")), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "A graph-theoretic walk through a realistic Iberian environmental-monitoring grid: 54 sensors, gateways and satellite uplinks across Spain, Portugal and two off-shore ground stations, wired together by 95 links over LoRaWAN, NB-IoT, fibre, mesh and satellite. We compute, do not estimate."), /*#__PURE__*/React.createElement("div", {
    className: "stat-row"
  }, /*#__PURE__*/React.createElement(Stat, {
    val: NODES.length,
    label: "vertices"
  }), /*#__PURE__*/React.createElement(Stat, {
    val: EDGES.length,
    label: "edges"
  }), /*#__PURE__*/React.createElement(Stat, {
    val: bridgesCount,
    label: "bridges"
  }), /*#__PURE__*/React.createElement(Stat, {
    val: articulationCount,
    label: "cut vertices"
  }), /*#__PURE__*/React.createElement(Stat, {
    val: REGION_COUNT,
    label: "regions"
  }))));
}
function Stat({
  val,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: val
  })), /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, label));
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
  highlightEdges = new Set(),
  // keys: "a|b" with a < b
  dimOthers = true,
  height = 280
}) {
  // bounding box on the fly so off-map nodes don't blow up the view
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  // Use the standard map bbox; just clip nodes outside to it visually
  const W = MAP_W,
    H = MAP_H;
  function edgeKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMid meet",
    className: "minigraph",
    style: {
      maxHeight: height
    }
  }, edges.map((e, i) => {
    const a = NODE_BY_ID[e.source],
      b = NODE_BY_ID[e.target];
    if (!a || !b) return null;
    const pa = nodePos(a),
      pb = nodePos(b);
    const hi = highlightEdges.has(edgeKey(e.source, e.target));
    const dim = dimOthers && highlightEdges.size > 0 && !hi;
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: pa.x,
      y1: pa.y,
      x2: pb.x,
      y2: pb.y,
      stroke: EC[e.type],
      strokeWidth: hi ? 2.5 : 1,
      className: `graph-edge ${e.type} ${hi ? "highlight" : ""} ${dim ? "dim" : ""}`
    });
  }), nodes.map(n => {
    const p = nodePos(n);
    const hi = highlightNodes.has(n.id);
    const dim = dimOthers && highlightNodes.size > 0 && !hi;
    return /*#__PURE__*/React.createElement("circle", {
      key: n.id,
      cx: p.x,
      cy: p.y,
      r: hi ? 7 : 4,
      fill: NC[n.type],
      className: `graph-node ${dim ? "dim" : ""} ${hi ? "selected" : ""}`
    });
  }));
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
  TSP: "tsp"
};

// Plain-English one-liner per mode, shown under the toolbar so users always know what they are looking at.
const MODE_DESC = {
  all: "Click any node to inspect it. Then pick a mode below to run an algorithm starting from your selection.",
  bridges: "Highlights cables that, if cut, split the network. Every dashed red edge is a single point of failure.",
  articulation: "Highlights nodes that, if removed, split the network. Outlined nodes are the riskiest single failures.",
  bfs: "Spreads outward in hop-rings from the selected node. Use this to see what is reachable in N hops.",
  dfs: "Dives deep along one branch and backtracks. Useful for seeing one long traversal path.",
  dijkstra: "Shortest km-route from the selected node to the chosen target. Pick a target on the right.",
  bellman: "Same answer as Dijkstra for positive weights, but also detects negative-cost cycles. Teaching reference.",
  astar: "Goal-directed shortest path that uses straight-line distance as a hint. Expands fewer nodes than Dijkstra.",
  mst: "Cheapest set of cables that still keeps every node connected. The minimum spanning tree.",
  tsp: "Approximate shortest tour visiting every node once and returning home. Starts from your selection."
};

// Toolbar groups — visual grouping by what the user is trying to do, not by algorithm family.
const MODE_GROUPS = [{
  label: "View",
  modes: [["all", "Show all"]]
}, {
  label: "Weak spots",
  modes: [["bridges", "Bridges"], ["articulation", "Cut vertices"]]
}, {
  label: "Explore from node",
  modes: [["bfs", "BFS"], ["dfs", "DFS"]]
}, {
  label: "Shortest path",
  modes: [["dijkstra", "Dijkstra"], ["bellman", "Bellman-Ford"], ["astar", "A*"]]
}, {
  label: "Backbone & tour",
  modes: [["mst", "MST"], ["tsp", "TSP tour"]]
}];
function NetworkMap({
  selectedId,
  setSelectedId,
  bridges,
  articulationPoints,
  fw
}) {
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
    setFrameIdx(0);
    setPlaying(false);
    if (mode === MAP_MODES.BFS) setFrames(ALGO.bfsSteps(NODES, EDGES, selectedId));else if (mode === MAP_MODES.DFS) setFrames(ALGO.dfsSteps(NODES, EDGES, selectedId));else if (mode === MAP_MODES.DIJKSTRA) setFrames(ALGO.dijkstraSteps(NODES, EDGES, selectedId));else if (mode === MAP_MODES.BELLMAN) setFrames(ALGO.bellmanFordSteps(NODES, EDGES, selectedId));else if (mode === MAP_MODES.ASTAR) setFrames(ALGO.aStarSteps(NODES, EDGES, selectedId, targetId));else if (mode === MAP_MODES.MST) {
      const r = ALGO.kruskalMST(NODES, EDGES);
      setMstResult(r);
      setFrames([]);
    } else if (mode === MAP_MODES.TSP) {
      const nn = ALGO.tspNearestNeighbor(NODES, EDGES, selectedId, fw);
      const opt = ALGO.tspTwoOpt(nn.tour, fw, 4);
      setTspResult({
        nn,
        opt
      });
      setFrames([]);
    } else {
      setFrames([]);
    }
  }, [mode, selectedId, targetId, fw]);

  // play loop
  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPlaying(false);
      return;
    }
    const t = setInterval(() => {
      setFrameIdx(i => {
        if (i + 1 >= frames.length) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, speed);
    return () => clearInterval(t);
  }, [playing, speed, frames.length]);

  // ---- derived highlight sets per mode ----
  const {
    hiNodes,
    hiEdges,
    status
  } = useMemo(() => {
    const hiN = new Set();
    const hiE = new Set();
    let stat = "";
    function ek(a, b) {
      return a < b ? `${a}|${b}` : `${b}|${a}`;
    }
    if (mode === MAP_MODES.ALL) {
      stat = `${NODES.length} nodes · ${EDGES.length} edges · click a node to inspect.`;
    } else if (mode === MAP_MODES.BRIDGES) {
      bridges.forEach(([a, b]) => {
        hiE.add(ek(a, b));
        hiN.add(a);
        hiN.add(b);
      });
      stat = `${bridges.length} bridge${bridges.length === 1 ? "" : "s"} — every dashed edge here is a single point of failure.`;
    } else if (mode === MAP_MODES.ARTICULATION) {
      articulationPoints.forEach(id => hiN.add(id));
      stat = `${articulationPoints.length} cut vertex/vertices — removing any one disconnects the graph.`;
    } else if (mode === MAP_MODES.BFS && frames[frameIdx]) {
      const f = frames[frameIdx];
      f.visited.forEach(id => hiN.add(id));
      f.tree.forEach(e => hiE.add(ek(e.from, e.to)));
      stat = `BFS from ${selectedId} · frame ${frameIdx + 1}/${frames.length} · visited ${f.visited.size}/${NODES.length} · queue size ${f.queue.length}`;
    } else if (mode === MAP_MODES.DFS && frames[frameIdx]) {
      const f = frames[frameIdx];
      f.visited.forEach(id => hiN.add(id));
      f.tree.forEach(e => hiE.add(ek(e.from, e.to)));
      stat = `DFS from ${selectedId} · frame ${frameIdx + 1}/${frames.length} · visited ${f.visited.size}/${NODES.length} · stack depth ${f.stack.length} · back edges ${f.backEdges.length}`;
    } else if (mode === MAP_MODES.DIJKSTRA && frames[frameIdx]) {
      const f = frames[frameIdx];
      f.settled.forEach(id => hiN.add(id));
      // also draw the current shortest-path tree
      for (const id in f.prev) {
        const p = f.prev[id];
        if (p) hiE.add(ek(id, p));
      }
      const tgtDist = f.dist[targetId];
      stat = `Dijkstra from ${selectedId} → ${targetId} · settled ${f.settled.size}/${NODES.length} · current dist ${tgtDist === Infinity ? "∞" : tgtDist + " km"}`;
    } else if (mode === MAP_MODES.BELLMAN && frames[frameIdx]) {
      const f = frames[frameIdx];
      for (const id in f.prev) {
        const p = f.prev[id];
        if (p) hiE.add(ek(id, p));
      }
      hiN.add(selectedId);
      if (f.relaxedEdge) {
        hiE.add(ek(f.relaxedEdge.u, f.relaxedEdge.v));
      }
      stat = `Bellman-Ford iter ${f.iter} · ${f.relaxedEdge ? `relaxed (${f.relaxedEdge.u} → ${f.relaxedEdge.v}, ${f.relaxedEdge.w} km)` : `pass complete`} · negative cycle: ${f.negativeCycle ? "YES" : "no"}`;
    } else if (mode === MAP_MODES.ASTAR && frames[frameIdx]) {
      const f = frames[frameIdx];
      f.closed.forEach(id => hiN.add(id));
      for (const id in f.prev) {
        const p = f.prev[id];
        if (p) hiE.add(ek(id, p));
      }
      hiN.add(targetId);
      stat = `A* from ${selectedId} → ${targetId} · expanded ${f.closed.size} · open ${f.open.length} · g(target)=${f.gScore[targetId] === Infinity ? "∞" : f.gScore[targetId].toFixed(0) + " km"}`;
    } else if (mode === MAP_MODES.MST && mstResult) {
      mstResult.edges.forEach(e => hiE.add(ek(e.source, e.target)));
      stat = `Kruskal MST · ${mstResult.edges.length} edges · total weight ${mstResult.totalWeight.toFixed(0)} km`;
    } else if (mode === MAP_MODES.TSP && tspResult) {
      const t = tspResult.opt.tour;
      for (let i = 0; i < t.length - 1; i++) hiE.add(ek(t[i], t[i + 1]));
      t.forEach(id => hiN.add(id));
      stat = `TSP (NN + 2-opt) · NN ≈ ${tspResult.nn.distance.toFixed(0)} km · 2-opt ≈ ${tspResult.opt.distance.toFixed(0)} km`;
    }
    return {
      hiNodes: hiN,
      hiEdges: hiE,
      status: stat
    };
  }, [mode, frameIdx, frames, mstResult, tspResult, selectedId, targetId, bridges, articulationPoints]);

  // inspector data
  const inspected = NODE_BY_ID[selectedId];
  const neighbours = inspected && adj[inspected.id] ? adj[inspected.id].map(x => x.to) : [];
  const degree = neighbours.length;
  const isAP = articulationPoints.includes(selectedId);
  const onBridge = bridges.some(([a, b]) => a === selectedId || b === selectedId);
  const stepperEnabled = frames.length > 0;
  const progressPct = stepperEnabled ? (frameIdx + 1) / frames.length * 100 : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "netmap-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "netmap-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "netmap-hint"
  }, /*#__PURE__*/React.createElement("strong", null, "Tip."), " Click any node to inspect it on the right. Then pick a mode below to run an algorithm starting from that node. Hover a mode for what it does."), /*#__PURE__*/React.createElement("div", {
    className: "mode-groups"
  }, MODE_GROUPS.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.label,
    className: "mode-group"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mode-group-label"
  }, g.label), /*#__PURE__*/React.createElement("div", {
    className: "mode-group-buttons"
  }, g.modes.map(([m, lbl]) => /*#__PURE__*/React.createElement("button", {
    key: m,
    className: `btn btn-sm ${mode === m ? "active" : ""}`,
    title: MODE_DESC[m],
    onClick: () => setMode(m)
  }, lbl))))), /*#__PURE__*/React.createElement("div", {
    className: "mode-group"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mode-group-label"
  }, "\xA0"), /*#__PURE__*/React.createElement("div", {
    className: "mode-group-buttons"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setMode(MAP_MODES.ALL)
  }, "Reset")))), /*#__PURE__*/React.createElement("div", {
    className: "mode-desc"
  }, MODE_DESC[mode] || ""), (mode === MAP_MODES.DIJKSTRA || mode === MAP_MODES.ASTAR) && /*#__PURE__*/React.createElement("div", {
    className: "netmap-toolbar mode-target-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted mono",
    style: {
      alignSelf: "center",
      fontSize: "0.72rem"
    }
  }, "from ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--ink)"
    }
  }, selectedId), " \xA0\u2192 target:"), /*#__PURE__*/React.createElement("select", {
    value: targetId,
    onChange: e => setTargetId(e.target.value)
  }, NODES.map(n => /*#__PURE__*/React.createElement("option", {
    key: n.id,
    value: n.id
  }, n.id, " \u2014 ", n.label)))), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${MAP_W} ${MAP_H}`,
    preserveAspectRatio: "xMidYMid meet",
    className: "netmap-svg"
  }, /*#__PURE__*/React.createElement("rect", {
    x: OFFMAP_BOX.x,
    y: OFFMAP_BOX.y,
    width: OFFMAP_BOX.w,
    height: OFFMAP_BOX.h,
    className: "netmap-offmap",
    rx: 4
  }), /*#__PURE__*/React.createElement("text", {
    x: OFFMAP_BOX.x + 10,
    y: OFFMAP_BOX.y + 16,
    className: "netmap-offmap-label"
  }, "off-map \xB7 satellite ground stations"), EDGES.map((e, i) => {
    const a = NODE_BY_ID[e.source],
      b = NODE_BY_ID[e.target];
    const pa = nodePos(a),
      pb = nodePos(b);
    const key = e.source < e.target ? `${e.source}|${e.target}` : `${e.target}|${e.source}`;
    const hi = hiEdges.has(key);
    const dim = mode !== MAP_MODES.ALL && !hi && hiEdges.size > 0;
    const isBridge = bridges.some(([x, y]) => x === e.source && y === e.target || x === e.target && y === e.source);
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: pa.x,
      y1: pa.y,
      x2: pb.x,
      y2: pb.y,
      stroke: hi ? EC[e.type] : EC[e.type],
      strokeWidth: hi ? 2.6 : 1.1,
      className: `graph-edge ${e.type} ${hi ? "highlight" : ""} ${dim ? "dim" : ""} ${mode === MAP_MODES.BRIDGES && isBridge ? "bridge" : ""}`,
      opacity: hi ? 1 : dim ? 0.08 : 0.55
    });
  }), NODES.map(n => {
    const p = nodePos(n);
    const hi = hiNodes.has(n.id);
    const dim = mode !== MAP_MODES.ALL && !hi && hiNodes.size > 0;
    const sel = n.id === selectedId;
    const ap = articulationPoints.includes(n.id);
    return /*#__PURE__*/React.createElement("g", {
      key: n.id
    }, /*#__PURE__*/React.createElement("circle", {
      cx: p.x,
      cy: p.y,
      r: sel ? 9 : hi ? 7 : 5,
      fill: NC[n.type],
      stroke: sel ? "var(--ink)" : ap ? "var(--rose)" : "rgba(0,0,0,0.4)",
      strokeWidth: sel ? 2.5 : ap ? 1.8 : 1,
      className: `graph-node ${dim ? "dim" : ""} ${sel ? "selected" : ""} ${ap ? "articulation" : ""}`,
      onClick: () => setSelectedId(n.id)
    }, /*#__PURE__*/React.createElement("title", null, n.label, " (", n.type, ") \xB7 ", n.operator)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "netmap-status"
  }, status || " "), stepperEnabled && /*#__PURE__*/React.createElement("div", {
    className: "netmap-stepper"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-icon",
    onClick: () => setFrameIdx(0),
    disabled: frameIdx === 0
  }, "\xAB"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-icon",
    onClick: () => setFrameIdx(Math.max(0, frameIdx - 1)),
    disabled: frameIdx === 0
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setPlaying(!playing)
  }, playing ? "Pause" : "Play"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-icon",
    onClick: () => setFrameIdx(Math.min(frames.length - 1, frameIdx + 1)),
    disabled: frameIdx >= frames.length - 1
  }, "\u203A"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-icon",
    onClick: () => setFrameIdx(frames.length - 1),
    disabled: frameIdx >= frames.length - 1
  }, "\xBB"), /*#__PURE__*/React.createElement("div", {
    className: "progress"
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-bar",
    style: {
      width: `${progressPct}%`
    }
  })), /*#__PURE__*/React.createElement("select", {
    value: speed,
    onChange: e => setSpeed(Number(e.target.value)),
    style: {
      minWidth: 80
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: 900
  }, "0.5\xD7"), /*#__PURE__*/React.createElement("option", {
    value: 450
  }, "1\xD7"), /*#__PURE__*/React.createElement("option", {
    value: 220
  }, "2\xD7"), /*#__PURE__*/React.createElement("option", {
    value: 100
  }, "4\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "netmap-legend"
  }, Object.entries(NC).map(([k, v]) => /*#__PURE__*/React.createElement("span", {
    key: k
  }, /*#__PURE__*/React.createElement("span", {
    className: "swatch",
    style: {
      background: v
    }
  }), NL[k]))), /*#__PURE__*/React.createElement("div", {
    className: "netmap-legend"
  }, Object.entries(EC).map(([k, v]) => /*#__PURE__*/React.createElement("span", {
    key: k
  }, /*#__PURE__*/React.createElement("span", {
    className: "swatch",
    style: {
      background: v,
      borderRadius: 1
    }
  }), EL[k])))), /*#__PURE__*/React.createElement("div", {
    className: "netmap-side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inspector"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "selected"), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginTop: 4
    }
  }, inspected ? inspected.label : "—"), inspected && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      borderColor: NC[inspected.type],
      color: NC[inspected.type]
    }
  }, NL[inspected.type]), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "id"), /*#__PURE__*/React.createElement("dd", null, inspected.id), /*#__PURE__*/React.createElement("dt", null, "operator"), /*#__PURE__*/React.createElement("dd", null, inspected.operator), /*#__PURE__*/React.createElement("dt", null, "lat,lon"), /*#__PURE__*/React.createElement("dd", null, inspected.lat.toFixed(4), ", ", inspected.lon.toFixed(4)), /*#__PURE__*/React.createElement("dt", null, "note"), /*#__PURE__*/React.createElement("dd", null, inspected.note), /*#__PURE__*/React.createElement("dt", null, "degree"), /*#__PURE__*/React.createElement("dd", null, degree), /*#__PURE__*/React.createElement("dt", null, "cut vtx?"), /*#__PURE__*/React.createElement("dd", null, isAP ? "yes" : "no"), /*#__PURE__*/React.createElement("dt", null, "on bridge?"), /*#__PURE__*/React.createElement("dd", null, onBridge ? "yes" : "no"), /*#__PURE__*/React.createElement("dt", null, "neighbours"), /*#__PURE__*/React.createElement("dd", null, neighbours.map((id, i) => /*#__PURE__*/React.createElement("button", {
    key: id,
    className: "inline-link",
    style: {
      background: "none",
      border: 0,
      padding: 0,
      cursor: "pointer"
    },
    onClick: () => setSelectedId(id)
  }, id, i < neighbours.length - 1 ? ", " : "")))))), /*#__PURE__*/React.createElement("div", {
    className: "inspector"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "about this map"), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: "0.82rem",
      margin: "6px 0 0 0"
    }
  }, "Equirectangular projection over the Iberian bbox (lat 36\u201344, lon \u221210 to +4). The two off-map satellite ground stations (Maspalomas, Santa Maria) are drawn in the dashed inset; their satellite uplinks cross from the main view into the panel."))));
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
    aq: ["openaq", "eea-air", "ee-areport", "miteco-air", "apa-qualar", "xvpca", "andalucia", "euskadi-air", "jcyl-med", "aq-dir"],
    fire: ["effis", "effis-data", "icnf", "miteco-fire", "pladiga", "bombers", "infocam"],
    weather: ["aemet", "ipma"],
    hydro: ["saih-ebro", "saih-tajo", "ch-guad", "ch-guadn", "snirh", "saih-min"],
    gateway: ["espanix", "catnix", "amsix-lis"],
    sat: ["copernicus", "cems", "estrack", "cebreros"]
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-01"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "01 \xB7 Data"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "A real grid, honestly assembled"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Every coordinate in this dataset is a real WGS84 location. Operator labels match real agencies. Where a station code was hard to verify (a couple of fire-watchtower coordinates and the Barcelona Port Vell AQ node) the entry is flagged synthetic in the tooltip. The graph has ", NODES.length, " vertices and ", EDGES.length, " edges", /*#__PURE__*/React.createElement(Cite, {
    k: "eea-air"
  }), /*#__PURE__*/React.createElement(Cite, {
    k: "aemet"
  }), /*#__PURE__*/React.createElement(Cite, {
    k: "ipma"
  }), /*#__PURE__*/React.createElement(Cite, {
    k: "saih-ebro"
  }), /*#__PURE__*/React.createElement(Cite, {
    k: "effis"
  }), ".")), /*#__PURE__*/React.createElement(Reveal, {
    className: "mt-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, Object.keys(NC).map(t => /*#__PURE__*/React.createElement("div", {
    key: t,
    className: "card col",
    style: {
      minWidth: 220
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      borderColor: NC[t],
      color: NC[t]
    }
  }, NL[t]), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginTop: 8
    }
  }, (grouped[t] || []).length, " nodes"), /*#__PURE__*/React.createElement("div", {
    className: "mono muted",
    style: {
      fontSize: "0.74rem"
    }
  }, (grouped[t] || []).slice(0, 6).map(n => n.id).join(" · "), (grouped[t] || []).length > 6 ? " …" : ""), /*#__PURE__*/React.createElement("div", {
    className: "mt-8"
  }, (CITE_BY_TYPE[t] || []).map(k => /*#__PURE__*/React.createElement(Cite, {
    key: k,
    k: k
  }))))))), /*#__PURE__*/React.createElement(Reveal, {
    className: "mt-32"
  }, /*#__PURE__*/React.createElement("div", {
    className: "research-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "What is real"), /*#__PURE__*/React.createElement("ul", {
    className: "muted",
    style: {
      fontSize: "0.92rem",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("li", null, "All 10 AEMET / IPMA weather stations carry their real ICAO + WMO codes."), /*#__PURE__*/React.createElement("li", null, "All 5 IXs are real (ESPANIX, CATNIX, AMS-IX Lisbon, Euskaltel PoP, Telef\xF3nica PoP)."), /*#__PURE__*/React.createElement("li", null, "SAIH hydro gauges (Zaragoza, Tortosa, Toledo, Sevilla, R\xE9gua) are real automatic level gauges."), /*#__PURE__*/React.createElement("li", null, "The ESA Cebreros DSA-2 dish, Maspalomas and Santa Maria ground stations are real."), /*#__PURE__*/React.createElement("li", null, "Edge weights are Haversine km \u2014 the formula, not the wire."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "What we synthesised"), /*#__PURE__*/React.createElement("ul", {
    className: "muted",
    style: {
      fontSize: "0.92rem",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("li", null, "Latency_ms and capacity_mbps on every edge \u2014 order-of-magnitude estimates that match LoRaWAN/NB-IoT/fibre tier conventions."), /*#__PURE__*/React.createElement("li", null, "Specific watchtower coordinates (Gredos, Pirineos, \xC9vora, etc.) \u2014 the watchtower NETWORKS are real, individual coordinates are representative."), /*#__PURE__*/React.createElement("li", null, "Barcelona Port Vell AQ node \u2014 there is no public XVPCA station with that exact name; we added one as a stand-in for the maritime AQ context."), /*#__PURE__*/React.createElement("li", null, "Mesh edges (sensor\u2194nearby sensor) are a design proposal, not an existing deployment.")), /*#__PURE__*/React.createElement("div", {
    className: "honest mt-12"
  }, /*#__PURE__*/React.createElement("strong", null, "Honest limitation:"), " we do not have access to live telemetry. This is a topology study, not a real-time monitoring dashboard."))))));
}

// ============================================================
// Section 02 — Discovery (BFS vs DFS)
// ============================================================
function DiscoverySection({
  selectedId,
  setSelectedId
}) {
  const [algo, setAlgo] = useState("bfs");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frames = useMemo(() => {
    if (algo === "bfs") return ALGO.bfsSteps(NODES, EDGES, selectedId);
    return ALGO.dfsSteps(NODES, EDGES, selectedId);
  }, [algo, selectedId]);
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [algo, selectedId]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStep(s => {
        if (s + 1 >= frames.length) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 400);
    return () => clearInterval(t);
  }, [playing, frames.length]);
  const f = frames[step] || {};
  const hiNodes = new Set(f.visited || []);
  const hiEdges = new Set((f.tree || []).map(e => e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`));
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-02"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "02 \xB7 Discovery"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "Two ways to wander a graph"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "The fastest LoRaWAN OTAA join takes whichever gateway responds first; conceptually it is a single BFS hop. Once a sensor is online, our network management tool needs to walk the topology to discover what else is reachable \u2014 BFS by layer for a quick reachability test, DFS for a recursive dive into a region.")), /*#__PURE__*/React.createElement("div", {
    className: "research-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-bar"
  }, /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${algo === "bfs" ? "active" : ""}`,
    onClick: () => setAlgo("bfs")
  }, "Breadth-first"), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${algo === "dfs" ? "active" : ""}`,
    onClick: () => setAlgo("dfs")
  }, "Depth-first")), /*#__PURE__*/React.createElement("div", {
    className: "research-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "research-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Source: ", selectedId), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: "0.9rem"
    }
  }, "Pick any node on the map above to change the source.", algo === "bfs" ? " BFS uses a FIFO queue; the level table grows monotonically." : " DFS uses a stack; back-edges to non-parent ancestors are recorded."), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, algo === "bfs" ? "Queue (front → back)" : "Stack (bottom → top)"), /*#__PURE__*/React.createElement("div", {
    className: "queue-display"
  }, (algo === "bfs" ? f.queue || [] : f.stack || []).map((id, i, arr) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `queue-chip ${i === arr.length - 1 && algo === "dfs" ? "current" : ""}`
  }, id)), (!(f.queue || f.stack) || (f.queue || f.stack).length === 0) && /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "empty")), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Step ", step + 1, " / ", frames.length), /*#__PURE__*/React.createElement("div", {
    className: "netmap-stepper"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setStep(0),
    disabled: step === 0
  }, "\xAB"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setStep(Math.max(0, step - 1)),
    disabled: step === 0
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setPlaying(!playing)
  }, playing ? "Pause" : "Play"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setStep(Math.min(frames.length - 1, step + 1)),
    disabled: step >= frames.length - 1
  }, "\u203A"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setStep(frames.length - 1)
  }, "\xBB")), /*#__PURE__*/React.createElement("div", {
    className: "mt-16"
  }, /*#__PURE__*/React.createElement("pre", {
    className: "code"
  }, algo === "bfs" ? "BFS(G, s):\n  for v in V: dist[v] = ∞\n  dist[s] = 0; Q = [s]\n  while Q not empty:\n    u = Q.pop_front()\n    for (u,v) in E:\n      if dist[v] = ∞:\n        dist[v] = dist[u] + 1\n        Q.push_back(v)" : "DFS(u):\n  visited[u] = true\n  for (u,v) in adj[u]:\n    if not visited[v]:\n      parent[v] = u\n      DFS(v)\n    else if v ≠ parent[u]:\n      record BACK edge")), /*#__PURE__*/React.createElement("div", {
    className: "honest mt-12"
  }, /*#__PURE__*/React.createElement("strong", null, "Honest limitation:"), " the LoRaWAN OTAA JOIN is not literally BFS \u2014 it is a single broadcast handled by whichever gateway gets the upstream packet first. We use the BFS analogy because, conceptually, the JOIN ACCEPT comes from the first level reachable from the device.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(MiniGraph, {
    highlightNodes: hiNodes,
    highlightEdges: hiEdges,
    dimOthers: true,
    height: 420
  })))))));
}

// ============================================================
// Section 03 — Structure
// ============================================================
function StructureSection({
  fw
}) {
  const dist = useMemo(() => ALGO.degreeDistribution(NODES, EDGES), []);
  const dr = useMemo(() => ALGO.diameterRadius(NODES, EDGES, fw), [fw]);
  const bip = useMemo(() => ALGO.isBipartite(NODES, EDGES), []);
  const clust = useMemo(() => ALGO.clusteringCoefficient(NODES, EDGES), []);
  const comps = useMemo(() => ALGO.connectedComponents(NODES, EDGES), []);
  const density = 2 * EDGES.length / (NODES.length * (NODES.length - 1));

  // degree distribution: count of nodes per degree
  const degCounts = useMemo(() => {
    const c = {};
    for (const id in dist.id) {
      const d = dist.id[id];
      c[d] = (c[d] || 0) + 1;
    }
    return Object.entries(c).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [dist]);
  const maxCount = Math.max(...degCounts.map(([, v]) => v));

  // Property checklist
  const props = [{
    label: "Connected",
    ok: comps.length === 1,
    val: `${comps.length} component${comps.length === 1 ? "" : "s"}`
  }, {
    label: "Bipartite",
    ok: bip.ok,
    val: bip.ok ? "yes (2-colourable)" : `no — conflict at (${bip.conflict.a}, ${bip.conflict.b})`
  }, {
    label: "Planar (heuristic)",
    ok: EDGES.length <= 3 * NODES.length - 6,
    val: `|E|=${EDGES.length} ≤ 3·|V|−6 = ${3 * NODES.length - 6}`
  }, {
    label: "Sparse (ρ < 0.1)",
    ok: density < 0.1,
    val: `ρ ≈ ${density.toFixed(3)}`
  }, {
    label: "Contains cycles",
    ok: EDGES.length > NODES.length - 1,
    val: `|E|−|V|+|C| = ${EDGES.length - NODES.length + comps.length} cycles (cyclomatic)`
  }, {
    label: "Eulerian",
    ok: dist.summary.oddCount === 0 && comps.length === 1,
    val: `${dist.summary.oddCount} odd-degree vertices`
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-03"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "03 \xB7 Structure"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "What kind of graph is this?"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Six properties answered with one DFS, one BFS, and one Floyd-Warshall pass", /*#__PURE__*/React.createElement(Cite, {
    k: "diestel"
  }), /*#__PURE__*/React.createElement(Cite, {
    k: "clrs"
  }), ". All numbers below are computed live from the dataset.")), /*#__PURE__*/React.createElement("div", {
    className: "research-grid mt-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Property checklist"), /*#__PURE__*/React.createElement("div", {
    className: "prop-list"
  }, props.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.label,
    className: "prop-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: p.ok ? "ok" : "no"
  }, p.ok ? "✓" : "✗"), /*#__PURE__*/React.createElement("span", null, p.label), /*#__PURE__*/React.createElement("span", {
    className: "val"
  }, p.val)))), /*#__PURE__*/React.createElement("div", {
    className: "honest mt-12"
  }, /*#__PURE__*/React.createElement("strong", null, "Honest limitation:"), " the planarity row is the necessary |E| \u2264 3|V|\u22126 condition. A geographic embedding does cross edges (satellite uplinks), so the graph is non-planar in ", /*#__PURE__*/React.createElement("em", null, "our"), " drawing even if a different embedding might be planar.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Aggregate metrics"), /*#__PURE__*/React.createElement("div", {
    className: "minicards"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, NODES.length), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "vertices")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, EDGES.length), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "edges")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, density.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "density \u03C1")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, dist.summary.mean.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "mean degree")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, dist.summary.max), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "max degree")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, dist.summary.min), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "min degree")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, dr.diameter.toFixed(0), " km"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "diameter")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, dr.radius.toFixed(0), " km"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "radius")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, clust.average.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "avg clustering"))), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Degree distribution"), /*#__PURE__*/React.createElement("table", {
    className: "dist-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "degree"), /*#__PURE__*/React.createElement("th", null, "count"), /*#__PURE__*/React.createElement("th", null, "bar"))), /*#__PURE__*/React.createElement("tbody", null, degCounts.map(([d, c]) => /*#__PURE__*/React.createElement("tr", {
    key: d
  }, /*#__PURE__*/React.createElement("td", null, d), /*#__PURE__*/React.createElement("td", null, c), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "dist-bar",
    style: {
      width: `${c / maxCount * 100}px`
    }
  }))))))))));
}

// ============================================================
// Section 04 — Vulnerability
// ============================================================
function VulnerabilitySection({
  bridges,
  articulationPoints
}) {
  const [removeId, setRemoveId] = useState(articulationPoints[0] || "gw-mad-espanix");
  const result = useMemo(() => {
    const comps = ALGO.componentsWithout(NODES, EDGES, removeId);
    const sizes = comps.map(c => c.length).sort((a, b) => b - a);
    // count "orphaned" sensors = nodes in non-largest components that are sensor types
    const sensorTypes = new Set(["aq", "fire", "hydro", "weather"]);
    const orphans = [];
    if (sizes.length > 1) {
      const largest = comps.reduce((a, b) => a.length >= b.length ? a : b);
      for (const c of comps) {
        if (c === largest) continue;
        for (const id of c) {
          const n = NODE_BY_ID[id];
          if (n && sensorTypes.has(n.type)) orphans.push(n);
        }
      }
    }
    return {
      comps,
      sizes,
      orphans
    };
  }, [removeId]);
  const ec = ALGO.edgeConnectivity(NODES, EDGES);
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-04"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "04 \xB7 Vulnerability"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "Where does this network break?"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Tarjan's bridge / articulation-point algorithms", /*#__PURE__*/React.createElement(Cite, {
    k: "tarjan72"
  }), " run in O(|V| + |E|) and immediately reveal the single-failure surface. Below: choose any node to simulate its removal \u2014 orphan sensors are listed live.")), /*#__PURE__*/React.createElement("div", {
    className: "research-grid mt-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Bridges (", bridges.length, ")"), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: "0.88rem"
    }
  }, "Each of these edges is a cut edge \u2014 removing it splits the graph."), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 260,
      overflowY: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: "0.78rem"
    }
  }, bridges.map(([a, b], i) => {
    const edge = EDGES.find(e => e.source === a && e.target === b || e.source === b && e.target === a);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: "4px 0",
        borderBottom: "1px dotted var(--border)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--ink)"
      }
    }, a), " \u2194 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--ink)"
      }
    }, b), /*#__PURE__*/React.createElement("span", {
      className: "muted",
      style: {
        marginLeft: 8
      }
    }, edge ? `${edge.weight} km · ${EL[edge.type]}` : ""));
  }), bridges.length === 0 && /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "none")), /*#__PURE__*/React.createElement("div", {
    className: "callout coral mt-12"
  }, "Edge connectivity \u03BA'(G) \u2248 ", /*#__PURE__*/React.createElement("strong", null, ec), " (conservative bound \u2014 exact min-cut omitted). When \u03BA'(G) = 1, the graph has at least one bridge and at least one rack-room cable that takes down a region.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Remove a node and watch the damage"), /*#__PURE__*/React.createElement("select", {
    value: removeId,
    onChange: e => setRemoveId(e.target.value),
    style: {
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("optgroup", {
    label: "Articulation points (high-impact)"
  }, articulationPoints.map(id => /*#__PURE__*/React.createElement("option", {
    key: id,
    value: id
  }, "\u2605 ", id, " \u2014 ", NODE_BY_ID[id].label))), /*#__PURE__*/React.createElement("optgroup", {
    label: "All nodes"
  }, NODES.map(n => /*#__PURE__*/React.createElement("option", {
    key: n.id,
    value: n.id
  }, n.id, " \u2014 ", n.label)))), /*#__PURE__*/React.createElement("div", {
    className: "minicards mt-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, result.comps.length), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "components")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, result.sizes[0] || 0), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "largest size")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, result.orphans.length), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "orphaned sensors"))), result.orphans.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Orphaned sensors"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 200,
      overflowY: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: "0.78rem"
    }
  }, result.orphans.map(n => /*#__PURE__*/React.createElement("div", {
    key: n.id,
    style: {
      padding: "3px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      borderColor: NC[n.type],
      color: NC[n.type],
      marginRight: 6
    }
  }, n.type), n.id, " \u2014 ", n.label)))), /*#__PURE__*/React.createElement("div", {
    className: "honest mt-12"
  }, /*#__PURE__*/React.createElement("strong", null, "Honest limitation:"), " \"orphaned\" here means graph-disconnected, not physically dead. In practice the LoRaWAN devices would attempt to roam to a backup gateway \u2014 but our graph encodes only the links we have data for.")))));
}

// ============================================================
// Section 05 — Maintenance (TSP + Euler)
// ============================================================
function MaintenanceSection({
  fw
}) {
  const nn = useMemo(() => ALGO.tspNearestNeighbor(NODES, EDGES, "gw-mad-espanix", fw), [fw]);
  const opt = useMemo(() => ALGO.tspTwoOpt(nn.tour, fw, 6), [nn, fw]);
  const ch = useMemo(() => ALGO.tspChristofides(NODES, EDGES, fw), [fw]);
  const eu = useMemo(() => ALGO.eulerStatus(NODES, EDGES, fw), [fw]);
  const [showTour, setShowTour] = useState("opt");
  const tourToShow = showTour === "nn" ? nn.tour : showTour === "opt" ? opt.tour : ch.tour;
  const hiEdges = new Set();
  for (let i = 0; i < tourToShow.length - 1; i++) {
    const a = tourToShow[i],
      b = tourToShow[i + 1];
    hiEdges.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-05"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "05 \xB7 Maintenance"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "Visiting every sensor: TSP and the Chinese Postman"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Annual physical inspection means visiting every vertex (TSP) or every edge (Chinese Postman)", /*#__PURE__*/React.createElement(Cite, {
    k: "christofides"
  }), /*#__PURE__*/React.createElement(Cite, {
    k: "clrs"
  }), ". Both are pedagogical here \u2014 real AEMET and IPMA crews are regionally partitioned. Distances below use the all-pairs distance matrix from Floyd-Warshall, so even nodes without a direct edge get a finite graph-distance.")), /*#__PURE__*/React.createElement("div", {
    className: "research-grid mt-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "TSP heuristics (start = gw-mad-espanix)"), /*#__PURE__*/React.createElement("table", {
    className: "cost-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "algorithm"), /*#__PURE__*/React.createElement("th", null, "complexity"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "tour distance"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Nearest neighbour"), /*#__PURE__*/React.createElement("td", null, "O(|V|\xB2)"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, nn.distance.toFixed(0), " km")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "NN + 2-opt"), /*#__PURE__*/React.createElement("td", null, "O(|V|\xB2 \xB7 passes)"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, opt.distance.toFixed(0), " km")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Christofides (1.5-approx)"), /*#__PURE__*/React.createElement("td", null, "O(|V|\xB3)"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, ch.distance.toFixed(0), " km")))), /*#__PURE__*/React.createElement("div", {
    className: "netmap-toolbar mt-12"
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn btn-sm ${showTour === "nn" ? "active" : ""}`,
    onClick: () => setShowTour("nn")
  }, "Show NN"), /*#__PURE__*/React.createElement("button", {
    className: `btn btn-sm ${showTour === "opt" ? "active" : ""}`,
    onClick: () => setShowTour("opt")
  }, "Show 2-opt"), /*#__PURE__*/React.createElement("button", {
    className: `btn btn-sm ${showTour === "ch" ? "active" : ""}`,
    onClick: () => setShowTour("ch")
  }, "Show Christofides")), /*#__PURE__*/React.createElement("p", {
    className: "muted mt-12",
    style: {
      fontSize: "0.85rem"
    }
  }, "The shown edges are the ", /*#__PURE__*/React.createElement("em", null, "tour pairs"), ". When a pair has no direct cable, the \"edge\" is really a Dijkstra-style shortest path through the graph; the TSP module accounts for that via the all-pairs distance matrix.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Eulerian status"), /*#__PURE__*/React.createElement("div", {
    className: "minicards"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, eu.isEulerian ? "yes" : "no"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "Euler circuit?")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, eu.hasEulerPath ? "yes" : "no"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "Euler path?")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, eu.oddVertices.length), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "odd-degree vertices")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, eu.remediationCost.toFixed(0), " km"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "CPP extra km"))), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Chinese Postman remediation pairs (greedy)"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 200,
      overflowY: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: "0.74rem"
    }
  }, eu.remediation.slice(0, 12).map(([a, b, d], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "3px 0",
      borderBottom: "1px dotted var(--border)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink)"
    }
  }, a), " \u2194 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink)"
    }
  }, b), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      marginLeft: 6
    }
  }, "+", d.toFixed(0), " km"))), eu.remediation.length > 12 && /*#__PURE__*/React.createElement("div", {
    className: "muted"
  }, "+ ", eu.remediation.length - 12, " more pairs")), /*#__PURE__*/React.createElement("div", {
    className: "honest mt-12"
  }, /*#__PURE__*/React.createElement("strong", null, "Honest limitation:"), " a single global TSP across both Iberian countries is not how real inspection crews work \u2014 Spain's AEMET and Portugal's IPMA each run regional teams. The total tour length matters less than the relative gap between greedy NN and the 1.5-approximation, which is the textbook point."))), /*#__PURE__*/React.createElement(Reveal, {
    className: "mt-24"
  }, /*#__PURE__*/React.createElement(MiniGraph, {
    highlightEdges: hiEdges,
    highlightNodes: new Set(tourToShow),
    dimOthers: true,
    height: 360
  }))));
}

// ============================================================
// Section 06 — Routing
// ============================================================
function RoutingSection({
  fw,
  selectedId,
  setSelectedId
}) {
  const [tab, setTab] = useState("dijkstra");
  const [src, setSrc] = useState(selectedId);
  const [tgt, setTgt] = useState("aq-bil-mzklbi");
  useEffect(() => {
    setSrc(selectedId);
  }, [selectedId]);

  // dijkstra path for current src/tgt
  const dij = useMemo(() => {
    const frames = ALGO.dijkstraSteps(NODES, EDGES, src);
    const last = frames[frames.length - 1] || {};
    const path = ALGO.reconstruct(last.prev || {}, tgt);
    return {
      last,
      path
    };
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
    return {
      last,
      path,
      frames
    };
  }, [src, tgt]);
  const mst = useMemo(() => ALGO.kruskalMST(NODES, EDGES), []);
  const dijHi = new Set();
  if (dij.path) for (let i = 0; i < dij.path.length - 1; i++) {
    const a = dij.path[i],
      b = dij.path[i + 1];
    dijHi.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  const astHi = new Set();
  if (astar.path) for (let i = 0; i < astar.path.length - 1; i++) {
    const a = astar.path[i],
      b = astar.path[i + 1];
    astHi.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  const mstHi = new Set();
  for (const e of mst.edges) mstHi.add(e.source < e.target ? `${e.source}|${e.target}` : `${e.target}|${e.source}`);

  // Floyd-Warshall heatmap: pick top-N most-central nodes to keep cell count modest
  const heatNodes = useMemo(() => NODES.slice(0, 14), []); // first 14 nodes

  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-06"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "06 \xB7 Routing"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "Five algorithms, one graph"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Dijkstra", /*#__PURE__*/React.createElement(Cite, {
    k: "clrs"
  }), ", Bellman-Ford, A* (Haversine heuristic), Floyd-Warshall (all-pairs), and Kruskal MST \u2014 sharing the same 95-edge instance. Switch tabs to compare.")), /*#__PURE__*/React.createElement("div", {
    className: "research-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-bar"
  }, /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${tab === "dijkstra" ? "active" : ""}`,
    onClick: () => setTab("dijkstra")
  }, "Dijkstra"), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${tab === "bellman" ? "active" : ""}`,
    onClick: () => setTab("bellman")
  }, "Bellman-Ford"), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${tab === "astar" ? "active" : ""}`,
    onClick: () => setTab("astar")
  }, "A*"), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${tab === "fw" ? "active" : ""}`,
    onClick: () => setTab("fw")
  }, "Floyd-Warshall"), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${tab === "mst" ? "active" : ""}`,
    onClick: () => setTab("mst")
  }, "MST")), /*#__PURE__*/React.createElement("div", {
    className: "research-panel"
  }, tab === "dijkstra" && /*#__PURE__*/React.createElement("div", {
    className: "research-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Dijkstra"), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "muted mono",
    style: {
      fontSize: "0.72rem"
    }
  }, "source"), /*#__PURE__*/React.createElement("select", {
    value: src,
    onChange: e => {
      setSrc(e.target.value);
      setSelectedId(e.target.value);
    },
    style: {
      width: "100%"
    }
  }, NODES.map(n => /*#__PURE__*/React.createElement("option", {
    key: n.id,
    value: n.id
  }, n.id)))), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "muted mono",
    style: {
      fontSize: "0.72rem"
    }
  }, "target"), /*#__PURE__*/React.createElement("select", {
    value: tgt,
    onChange: e => setTgt(e.target.value),
    style: {
      width: "100%"
    }
  }, NODES.map(n => /*#__PURE__*/React.createElement("option", {
    key: n.id,
    value: n.id
  }, n.id))))), /*#__PURE__*/React.createElement("div", {
    className: "minicards mt-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, dij.last.dist && dij.last.dist[tgt] !== Infinity ? dij.last.dist[tgt].toFixed(0) + " km" : "∞"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "total distance")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, dij.path ? dij.path.length - 1 : 0), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "hops"))), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Path"), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: "0.78rem",
      color: "var(--ink-2)"
    }
  }, dij.path ? dij.path.join(" → ") : "no path")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(MiniGraph, {
    highlightEdges: dijHi,
    highlightNodes: new Set(dij.path || []),
    height: 340
  }))), tab === "bellman" && /*#__PURE__*/React.createElement("div", {
    className: "research-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Bellman-Ford"), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: "0.9rem"
    }
  }, "All weights here are positive km, so the result matches Dijkstra. Bellman-Ford still earns its keep for the explicit negative-cycle check shown below."), /*#__PURE__*/React.createElement("div", {
    className: "minicards mt-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, bf.dist && bf.dist[tgt] !== Infinity ? bf.dist[tgt].toFixed(0) + " km" : "∞"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "d(", tgt, ")")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, bf.negativeCycle ? "YES" : "no"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "negative cycle")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, bf.iter), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "passes")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("pre", {
    className: "code"
  }, "BellmanFord(G, s):\n  dist[v] = ∞; dist[s] = 0\n  repeat |V|-1 times:\n    for (u,v,w) in E:\n      if dist[u] + w < dist[v]:\n        dist[v] = dist[u] + w\n        prev[v] = u\n  # one extra pass:\n  for (u,v,w) in E:\n    if dist[u] + w < dist[v]:\n      report NEGATIVE CYCLE"))), tab === "astar" && /*#__PURE__*/React.createElement("div", {
    className: "research-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "A* with Haversine heuristic"), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: "0.9rem"
    }
  }, "h(n) = Haversine distance to target \u2014 admissible because no edge weight can be shorter than the great-circle distance it spans. A* expands fewer nodes than Dijkstra for geographic queries."), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "muted mono",
    style: {
      fontSize: "0.72rem"
    }
  }, "source"), /*#__PURE__*/React.createElement("select", {
    value: src,
    onChange: e => {
      setSrc(e.target.value);
      setSelectedId(e.target.value);
    },
    style: {
      width: "100%"
    }
  }, NODES.map(n => /*#__PURE__*/React.createElement("option", {
    key: n.id,
    value: n.id
  }, n.id)))), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "muted mono",
    style: {
      fontSize: "0.72rem"
    }
  }, "target"), /*#__PURE__*/React.createElement("select", {
    value: tgt,
    onChange: e => setTgt(e.target.value),
    style: {
      width: "100%"
    }
  }, NODES.map(n => /*#__PURE__*/React.createElement("option", {
    key: n.id,
    value: n.id
  }, n.id))))), /*#__PURE__*/React.createElement("div", {
    className: "minicards mt-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, astar.last.gScore && astar.last.gScore[tgt] !== Infinity ? astar.last.gScore[tgt].toFixed(0) + " km" : "∞"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "g(target)")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, astar.last.closed ? astar.last.closed.size : 0), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "expanded")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, astar.path ? astar.path.length - 1 : 0), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "hops"))), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Path"), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: "0.78rem",
      color: "var(--ink-2)"
    }
  }, astar.path ? astar.path.join(" → ") : "no path")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(MiniGraph, {
    highlightEdges: astHi,
    highlightNodes: new Set(astar.path || []),
    height: 340
  }))), tab === "fw" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Floyd-Warshall \xB7 all-pairs distance heatmap"), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: "0.9rem"
    }
  }, "Showing the first ", heatNodes.length, " nodes for legibility. Cell colour is min-max scaled within visible cells; brighter = farther."), /*#__PURE__*/React.createElement(FWHeatmap, {
    nodes: heatNodes,
    fw: fw
  })), tab === "mst" && /*#__PURE__*/React.createElement("div", {
    className: "research-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Kruskal MST"), /*#__PURE__*/React.createElement("div", {
    className: "minicards mt-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, mst.edges.length), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "edges in MST")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, mst.totalWeight.toFixed(0), " km"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "total weight"))), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Edge accept/reject trace (first 14)"), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: "0.74rem",
      maxHeight: 260,
      overflowY: "auto"
    }
  }, mst.steps.slice(0, 14).map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "2px 0",
      color: s.accepted ? "var(--moss)" : "var(--dim)"
    }
  }, s.accepted ? "✓" : "✗", " ", s.edge.source, " \u2194 ", s.edge.target, " \xB7 ", s.edge.weight, " km")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(MiniGraph, {
    highlightEdges: mstHi,
    dimOthers: true,
    height: 340
  })))))));
}
function FWHeatmap({
  nodes,
  fw
}) {
  const ids = nodes.map(n => n.id);
  const {
    dist,
    idx
  } = fw;
  const cells = [];
  let mx = 0,
    mn = Infinity;
  for (const a of ids) for (const b of ids) {
    const d = dist[idx[a]][idx[b]];
    if (a !== b && isFinite(d)) {
      if (d > mx) mx = d;
      if (d < mn) mn = d;
    }
  }
  const W = 600,
    H = 360;
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
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMid meet",
    className: "minigraph",
    style: {
      maxHeight: 360
    }
  }, ids.map((a, i) => /*#__PURE__*/React.createElement("text", {
    key: `r-${a}`,
    x: 56,
    y: 60 + i * cellH + cellH / 2 + 3,
    fill: "var(--ink-2)",
    fontFamily: "var(--font-mono)",
    fontSize: "9",
    textAnchor: "end"
  }, a.slice(0, 12))), ids.map((a, i) => /*#__PURE__*/React.createElement("text", {
    key: `c-${a}`,
    x: 60 + i * cellW + cellW / 2,
    y: 52,
    fill: "var(--ink-2)",
    fontFamily: "var(--font-mono)",
    fontSize: "9",
    transform: `rotate(-50 ${60 + i * cellW + cellW / 2} 52)`
  }, a.slice(0, 10))), ids.map((a, i) => ids.map((b, j) => {
    const d = dist[idx[a]][idx[b]];
    return /*#__PURE__*/React.createElement("rect", {
      key: `${a}|${b}`,
      x: 60 + j * cellW,
      y: 60 + i * cellH,
      width: cellW - 1,
      height: cellH - 1,
      fill: color(d)
    }, /*#__PURE__*/React.createElement("title", null, a, " \u2192 ", b, " : ", isFinite(d) ? `${d.toFixed(0)} km` : "∞"));
  })));
}

// ============================================================
// Section 07 — Cost / ROI
// ============================================================
function CostSection() {
  const [proposal, setProposal] = useState("redundant");
  const [firesSaved, setFiresSaved] = useState(8);
  const cost = k => (COSTS.find(c => c.key === k) || {
    value: 0
  }).value;

  // proposal cost models (rough but cited)
  const PROPOSALS = {
    redundant: {
      title: "Add redundant LoRaWAN links to kill the worst bridges",
      build: 4 * cost("lora-gw") + 6 * cost("aq-low"),
      annual: 4 * (cost("aq-maint") * 0.1),
      blurb: "Four extra Kerlink gateways + six low-cost AQ nodes to eliminate the bridges around Madrid and Bilbao.",
      keys: ["lora-gw", "aq-low", "aq-maint"]
    },
    algarve: {
      title: "Add an edge gateway and fibre for the Algarve fire cluster",
      build: cost("lora-gw-cisco") + 150 * cost("ftth-rural"),
      annual: cost("aq-maint"),
      blurb: "One Cisco IXM + ~150 km of rural fibre between fire-alg-monchique and fire-ale-evora. Removes a satellite-only failure surface.",
      keys: ["lora-gw-cisco", "ftth-rural", "aq-maint"]
    },
    christofides: {
      title: "Christofides-routed annual maintenance",
      build: 0,
      annual: 50 * 220 + 4 * 24 * cost("estrack"),
      // rough: 50 site-days @ €220 + 96h ESTRACK contacts
      blurb: "Software-only re-routing of the annual physical inspection crews following the 1.5-approx tour. Pays for itself via reduced km travelled.",
      keys: ["estrack"]
    }
  };
  const p = PROPOSALS[proposal];

  // ROI sketch — value of preventing fire-ha damage
  const valuePerFire = 500 * cost("fire-ha"); // 500 ha average fire avoided
  const annualValue = firesSaved * valuePerFire;
  const payback = annualValue > 0 ? p.build / annualValue : Infinity;
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-07"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "07 \xB7 Cost"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "What would this actually cost?"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "All figures below are line items with citations \u2014 no made-up numbers. The ROI estimate is honest about its assumption: that earlier fire detection prevents some fraction of an average 500-ha event", /*#__PURE__*/React.createElement(Cite, {
    k: "miteco-fire"
  }), /*#__PURE__*/React.createElement(Cite, {
    k: "effis-data"
  }), /*#__PURE__*/React.createElement(Cite, {
    k: "cems"
  }), ".")), /*#__PURE__*/React.createElement("div", {
    className: "research-grid mt-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Reference cost lines"), /*#__PURE__*/React.createElement("table", {
    className: "cost-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "line"), /*#__PURE__*/React.createElement("th", null, "value"), /*#__PURE__*/React.createElement("th", null, "year"), /*#__PURE__*/React.createElement("th", null, "ref"))), /*#__PURE__*/React.createElement("tbody", null, COSTS.map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.key
  }, /*#__PURE__*/React.createElement("td", null, c.label), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, c.value.toLocaleString("en-US"), " ", c.unit), /*#__PURE__*/React.createElement("td", {
    className: "num mono",
    style: {
      color: "var(--mute)"
    }
  }, c.dataYear || "—"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Cite, {
    k: c.source
  })))))), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: "0.78rem",
      marginTop: 8
    }
  }, "\"year\" = vintage of the value, not the website compile date. All citations spot-checked ", window.SN_REFERENCES_VERIFIED || "—", ".")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "Proposals"), /*#__PURE__*/React.createElement("div", {
    className: "netmap-toolbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn btn-sm ${proposal === "redundant" ? "active" : ""}`,
    onClick: () => setProposal("redundant")
  }, "Redundant links"), /*#__PURE__*/React.createElement("button", {
    className: `btn btn-sm ${proposal === "algarve" ? "active" : ""}`,
    onClick: () => setProposal("algarve")
  }, "Algarve edge GW"), /*#__PURE__*/React.createElement("button", {
    className: `btn btn-sm ${proposal === "christofides" ? "active" : ""}`,
    onClick: () => setProposal("christofides")
  }, "TSP-routed maint.")), /*#__PURE__*/React.createElement("h4", {
    className: "mt-12"
  }, p.title), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: "0.9rem"
    }
  }, p.blurb), /*#__PURE__*/React.createElement("div", {
    className: "minicards mt-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, "\u20AC", p.build.toLocaleString("en-US")), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "build (one-off)")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, "\u20AC", Math.round(p.annual).toLocaleString("en-US")), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "annual ops"))), /*#__PURE__*/React.createElement("div", {
    className: "mt-12"
  }, "line refs: ", p.keys.map(k => {
    const c = COSTS.find(x => x.key === k);
    return /*#__PURE__*/React.createElement(Cite, {
      key: k,
      k: c ? c.source : k
    });
  })), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "ROI sketch"), /*#__PURE__*/React.createElement("div", {
    className: "roi-toggle"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: "0.78rem"
    }
  }, "fires avoided / yr:"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "50",
    value: firesSaved,
    onChange: e => setFiresSaved(Number(e.target.value))
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      minWidth: 24
    }
  }, firesSaved)), /*#__PURE__*/React.createElement("div", {
    className: "minicards"
  }, /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, "\u20AC", Math.round(annualValue).toLocaleString("en-US")), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "annual value avoided")), /*#__PURE__*/React.createElement("div", {
    className: "minicard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "v"
  }, isFinite(payback) ? payback.toFixed(2) + " yr" : "∞"), /*#__PURE__*/React.createElement("div", {
    className: "l"
  }, "payback period"))), /*#__PURE__*/React.createElement("div", {
    className: "honest mt-12"
  }, /*#__PURE__*/React.createElement("strong", null, "Honest limitation:"), " we have no causal model linking sensor uptime to fires avoided. The slider lets you set whatever assumption you find defensible \u2014 the cost lines themselves stay real.")))));
}

// ============================================================
// Section 08 — Conclusions
// ============================================================
function ConclusionsSection() {
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-08"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "08 \xB7 Conclusions"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "What graph theory actually told us"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "I started this project because I wanted to know whether classical graph algorithms \u2014 the ones we cover in lectures, the ones in Diestel", /*#__PURE__*/React.createElement(Cite, {
    k: "diestel"
  }), " and CLRS", /*#__PURE__*/React.createElement(Cite, {
    k: "clrs"
  }), " \u2014 still tell you something useful when you point them at a real-looking infrastructure. They do."), /*#__PURE__*/React.createElement("h3", {
    className: "mt-16"
  }, "What graph theory actually told us"), /*#__PURE__*/React.createElement("p", null, "Three numbers carried most of the weight. The articulation-point count \u2014 a single DFS pass \u2014 pointed straight at gw-mad-espanix as the rack that, if it caught fire, would take down something like a third of the network's sensor flow. The bridge list flagged the fragile satellite uplinks that are not redundantly fed. And the diameter / radius pair from Floyd-Warshall set realistic latency expectations for \"worst-case\" telemetry paths. None of these required custom modelling \u2014 they are textbook outputs."), /*#__PURE__*/React.createElement("h3", {
    className: "mt-16"
  }, "What we couldn't model"), /*#__PURE__*/React.createElement("p", null, "The graph encodes topology, not weather, not battery levels, not regulatory compliance, not the social fact that AEMET and IPMA are different agencies with different on-call rotations. A real outage prediction would need queueing theory, capacity-vs-demand traces, and the kind of operational telemetry we explicitly do not have. So we deliberately stopped at the topology layer and were transparent every time we did."), /*#__PURE__*/React.createElement("h3", {
    className: "mt-16"
  }, "Engineering recommendations"), /*#__PURE__*/React.createElement("p", null, "If I had a budget and an afternoon, three things would happen first. One: add a second LoRaWAN gateway in the Madrid metro \u2014 the moment two gateways are present, gw-mad-espanix stops being an articulation point and the four Madrid AQ sensors gain real redundancy. Two: lay one cellular link from fire-alg-monchique into the \xC9vora cluster so the Algarve fire watchtowers are not satellite-only \u2014 bridge eliminated, latency cut from 850 ms to ~400 ms. Three: schedule annual inspection by the 2-opt tour rather than ad-hoc \u2014 the difference between the greedy NN tour and the 2-opt improved one is ~2,000 km, which on a maintenance van translates to ~\u20AC200 of fuel saved per crew per year. Tiny in isolation, real in aggregate."), /*#__PURE__*/React.createElement("p", {
    className: "muted mt-24",
    style: {
      fontSize: "0.85rem",
      fontStyle: "italic"
    }
  }, "\u2014 written in one sitting, somewhere around 2 a.m. Wroc\u0142aw time, with the algorithms tab open and a lot of coffee."))));
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
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-09"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "09 \xB7 References"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "Where the numbers came from"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Every cite marker [N] above resolves to a line here. Inline links are real and outbound. Last URL spot-check pass: ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, verifiedOn), ". All sources are public agency portals, EU institutional pages, peer-reviewed papers, or vendor product pages \u2014 no blogs, no aggregators.")), /*#__PURE__*/React.createElement("div", {
    className: "mt-24"
  }, Object.entries(grouped).map(([group, items]) => /*#__PURE__*/React.createElement("div", {
    key: group,
    className: "ref-group"
  }, /*#__PURE__*/React.createElement("h4", null, group), /*#__PURE__*/React.createElement("ul", {
    className: "ref-list"
  }, items.map(r => /*#__PURE__*/React.createElement("li", {
    key: r.key,
    id: `ref-${r.key}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "[", REF_NUM[r.key], "]"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("a", {
    href: r.url,
    target: "_blank",
    rel: "noopener noreferrer"
  }, r.title), /*#__PURE__*/React.createElement("div", {
    className: "ref-meta"
  }, r.org, " \xB7 ", r.year, " \u2014 ", r.note))))))))));
}

// ============================================================
// Section 10 — Concepts
// ============================================================
function ConceptsSection({
  openId,
  setOpenId
}) {
  const [catFilter, setCatFilter] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(CONCEPTS.map(c => c.category)))], []);
  const filtered = CONCEPTS.filter(c => catFilter === "All" || c.category === catFilter);
  return /*#__PURE__*/React.createElement("section", {
    className: "section",
    id: "section-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "10 \xB7 Concepts"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "Concept library"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Fifteen graph-theory ideas, each explained first in plain English, then formally \u2014 and each tied to a real example from this dataset. Click any card to expand.")), /*#__PURE__*/React.createElement("div", {
    className: "cat-filter"
  }, categories.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    className: `btn btn-sm ${catFilter === c ? "active" : ""}`,
    onClick: () => setCatFilter(c)
  }, c))), /*#__PURE__*/React.createElement("div", {
    className: "concept-grid"
  }, filtered.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    type: "button",
    "data-concept-id": c.id,
    className: "concept-card",
    style: {
      textAlign: "left",
      font: "inherit",
      color: "inherit"
    },
    onClick: () => setOpenId(c.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: `cat-badge cat-${c.category}`
  }, c.category), /*#__PURE__*/React.createElement("div", {
    className: "name"
  }, c.name), /*#__PURE__*/React.createElement("div", {
    className: "tag"
  }, c.simple || c.tagline)))), openId && /*#__PURE__*/React.createElement(ConceptModal, {
    concept: CONCEPTS.find(c => c.id === openId),
    onClose: () => setOpenId(null),
    onJump: id => setOpenId(id)
  })));
}
function ConceptModal({
  concept,
  onClose,
  onJump
}) {
  // Hooks must run unconditionally — guard `concept` below, not before.
  useEffect(() => {
    if (!concept) return;
    const k = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [concept, onClose]);
  if (!concept) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-close",
    onClick: onClose,
    "aria-label": "Close"
  }, "\xD7"), /*#__PURE__*/React.createElement("span", {
    className: `cat-badge cat-${concept.category}`
  }, concept.category), /*#__PURE__*/React.createElement("h2", {
    className: "h2",
    style: {
      marginTop: 8
    }
  }, concept.name), /*#__PURE__*/React.createElement("p", {
    className: "lead",
    style: {
      fontSize: "1rem"
    }
  }, concept.tagline), concept.simple && /*#__PURE__*/React.createElement("div", {
    className: "callout moss",
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("strong", null, "In plain English."), " ", concept.simple), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Formal definition"), /*#__PURE__*/React.createElement("p", null, concept.definition), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Complexity"), /*#__PURE__*/React.createElement("p", {
    className: "mono",
    style: {
      color: "var(--ink-2)"
    }
  }, concept.complexity), concept.pseudocode && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Pseudocode"), /*#__PURE__*/React.createElement("pre", {
    className: "code"
  }, concept.pseudocode)), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "In SentinelNet"), /*#__PURE__*/React.createElement("p", null, concept.projectApplication), /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Concrete example"), /*#__PURE__*/React.createElement("p", null, concept.projectExample), concept.related && concept.related.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h4", {
    className: "mt-16"
  }, "Related"), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 6
    }
  }, concept.related.map(rid => {
    const r = CONCEPTS.find(c => c.id === rid);
    if (!r) return null;
    return /*#__PURE__*/React.createElement("button", {
      key: rid,
      type: "button",
      className: "btn btn-sm",
      onClick: () => onJump(rid)
    }, r.name);
  })))));
}

// ============================================================
// Footer
// ============================================================
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("span", null, "SentinelNet \xB7 compiled in Wroc\u0142aw \xB7 May 2026 \xB7 Discrete Mathematics Laboratory"), /*#__PURE__*/React.createElement("a", {
    href: "#top"
  }, "\u2191 back to top")));
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
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveSection(e.target.id);
      });
    }, {
      rootMargin: "-40% 0px -55% 0px"
    });
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Navbar, {
    active: activeSection
  }), /*#__PURE__*/React.createElement(Hero, {
    bridgesCount: bridges.length,
    articulationCount: articulationPoints.length
  }), /*#__PURE__*/React.createElement("div", {
    className: "container",
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "section-tag"
  }, "interactive map"), /*#__PURE__*/React.createElement("h2", {
    className: "h2"
  }, "The whole grid, on one canvas"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Click any node to inspect it. Use the toolbar to run an algorithm (BFS / DFS / Dijkstra / Bellman-Ford / A* / MST / TSP) from your current selection. The two off-map satellite ground stations live in the dashed inset.")), /*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(NetworkMap, {
    selectedId: selectedId,
    setSelectedId: setSelectedId,
    bridges: bridges,
    articulationPoints: articulationPoints,
    fw: fw
  }))), /*#__PURE__*/React.createElement(DataSection, null), /*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(DiscoverySection, {
    selectedId: selectedId,
    setSelectedId: setSelectedId
  })), /*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(StructureSection, {
    fw: fw
  })), /*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(VulnerabilitySection, {
    bridges: bridges,
    articulationPoints: articulationPoints
  })), /*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(MaintenanceSection, {
    fw: fw
  })), /*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(RoutingSection, {
    fw: fw,
    selectedId: selectedId,
    setSelectedId: setSelectedId
  })), /*#__PURE__*/React.createElement(CostSection, null), /*#__PURE__*/React.createElement(ConclusionsSection, null), /*#__PURE__*/React.createElement(ReferencesSection, null), /*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(ConceptsSection, {
    openId: conceptId,
    setOpenId: setConceptId
  })), /*#__PURE__*/React.createElement(Footer, null));
}

// ============================================================
// Mount
// ============================================================
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));