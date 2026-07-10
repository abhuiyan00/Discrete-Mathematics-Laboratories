/* app.js — UI + SVG rendering for the Pawlak Information System viewer.
 * Each "query" mirrors a block of queries.cypher and renders it as a graph
 * picture or a result table, alongside the exact Cypher that produces it. */
(function () {
  const P = window.Pawlak;
  const $ = (s, r = document) => r.querySelector(s);

  // ---- query catalogue (mirrors queries.cypher) ---------------------------
  const QUERIES = [
    {
      id: "Q0", label: "Graph schema", sub: "db.schema.visualization()",
      kind: "schema", picker: false,
      cypher: `CALL db.schema.visualization();`,
    },
    {
      id: "Q1", label: "Count objects |U|", sub: "how many countries",
      kind: "count-obj", picker: false,
      cypher: `MATCH (o:Object) RETURN count(o) AS object_count;`,
    },
    {
      id: "Q2", label: "Count attributes |A|", sub: "how many columns",
      kind: "count-attr", picker: false,
      cypher: `MATCH (a:Attribute) RETURN count(a) AS attribute_count;`,
    },
    {
      id: "Q3", label: "Values of one object", sub: "the object's row of S",
      kind: "values", picker: true,
      cypher: (id) =>
`MATCH (o:Object {id:'${id}'})-[r:HAS_VALUE]->(a:Attribute)
RETURN a.name AS attribute, r.value AS value
ORDER BY attribute;`,
    },
    {
      id: "Q3b", label: "Object as a star graph", sub: "value function, drawn",
      kind: "star", picker: true,
      cypher: (id) =>
`MATCH path = (o:Object {id:'${id}'})-[:HAS_VALUE]->(:Attribute)
RETURN path;`,
    },
    {
      id: "Q4", label: "Objects matching a condition", sub: "AAA and GDP growth > 2%",
      kind: "condition", picker: false,
      cypher:
`MATCH (o:Object)-[r1:HAS_VALUE]->(:Attribute {name:'Credit_Rating'})
MATCH (o)-[r2:HAS_VALUE]->(:Attribute {name:'GDP_Growth_Rate_Percent'})
WHERE r1.value = 'AAA' AND toFloat(r2.value) > 2.0
RETURN o.id AS country, r1.value AS credit_rating, r2.value AS gdp_growth
ORDER BY gdp_growth DESC;`,
    },
    {
      id: "Q5", label: "Group hierarchy", sub: "Country → Grade → Class",
      kind: "hierarchy", picker: false,
      cypher:
`MATCH path = (o:Object)-[:BELONGS_TO]->(:Group)-[:BELONGS_TO]->(:Group)
RETURN path;`,
    },
    {
      id: "Q6", label: "Retrieve via group", sub: "Investment-Grade countries",
      kind: "investment", picker: false,
      cypher:
`MATCH (o:Object)-[:BELONGS_TO]->(grade:Group)
      -[:BELONGS_TO]->(cls:Group {name:'Investment Grade'})
RETURN cls.name AS class, grade.name AS grade, collect(o.id) AS countries
ORDER BY grade;`,
    },
  ];

  let current = QUERIES[0];
  let selectedObject = "United States";

  // ---- tiny helpers -------------------------------------------------------
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const nice = (s) => s.replace(/_/g, " ");
  const P2 = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;

  function highlightCypher(src) {
    return esc(src)
      .replace(/(\/\/[^\n]*)/g, '<span class="cm">$1</span>')
      .replace(/\b(MATCH|RETURN|WHERE|AS|ORDER BY|DESC|AND|OR|CALL|WITH|MERGE)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(count|collect|toFloat)\b/g, '<span class="fn">$1</span>')
      .replace(/('[^']*')/g, '<span class="str">$1</span>');
  }

  function node(x, y, r, fill, label, sub) {
    let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#0d1017" stroke-width="1.5"/>`;
    if (label) s += `<text class="n-label" x="${x}" y="${y - r - 6}" text-anchor="middle">${esc(label)}</text>`;
    if (sub) s += `<text class="n-sub" x="${x}" y="${y + r + 12}" text-anchor="middle">${esc(sub)}</text>`;
    return s;
  }
  function edge(x1, y1, x2, y2, color = "#39424f", w = 1.4) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}"/>`;
  }
  function relLabel(x1, y1, x2, y2, txt) {
    return `<text class="rel-label" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 4}" text-anchor="middle">${esc(txt)}</text>`;
  }
  const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;

  // ---- renderers ----------------------------------------------------------
  function renderSchema() {
    const C = { object: "#34d3c0", attr: "#f0a53e", grade: "#a78bfa", cls: "#f472b6" };
    const O = [180, 250], A = [720, 130], G = [430, 430], K = [780, 430];
    let b = "";
    b += edge(O[0], O[1], A[0], A[1]) + relLabel(O[0], O[1], A[0], A[1], "HAS_VALUE {value}");
    b += edge(O[0], O[1], G[0], G[1]) + relLabel(O[0], O[1], G[0], G[1], "BELONGS_TO");
    b += edge(G[0], G[1], K[0], K[1]) + relLabel(G[0], G[1], K[0], K[1], "BELONGS_TO");
    b += node(O[0], O[1], 34, C.object, "Object", "country · id");
    b += node(A[0], A[1], 30, C.attr, "Attribute", "name");
    b += node(G[0], G[1], 26, C.grade, "Group", "grade");
    b += node(K[0], K[1], 26, C.cls, "Group", "class");
    return svg(920, 520, b);
  }

  function renderCount(kind) {
    const isObj = kind === "count-obj";
    const n = isObj ? P.counts.objects : P.counts.attributes;
    const lbl = isObj ? "objects  |U|" : "attributes  |A|";
    return `<div class="numcard ${isObj ? "obj" : "att"}"><div class="n">${n}</div><div class="lbl">${lbl}</div></div>`;
  }

  function renderValuesTable(id) {
    const rows = P.valuesOf(id);
    let t = `<table class="data"><thead><tr><th>attribute</th><th>value</th></tr></thead><tbody>`;
    rows.forEach((r) => (t += `<tr><td class="attr">${esc(r.attribute)}</td><td class="val">${esc(r.value)}</td></tr>`));
    t += `</tbody></table>`;
    return t;
  }

  function renderStar(id) {
    const attrs = P.ATTRIBUTES;
    const W = 1120, H = 820, cx = W / 2, cy = H / 2, R = 250;
    const o = P.objectById(id);
    let edges = "", nodes = "";
    attrs.forEach((a, i) => {
      const ang = (-90 + (i * 360) / attrs.length) * (Math.PI / 180);
      const x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
      edges += edge(cx, cy, x, y, "#2e3a45", 1.2);
      nodes += `<circle cx="${x}" cy="${y}" r="6" fill="#f0a53e" stroke="#0d1017" stroke-width="1.2"/>`;
      const right = Math.cos(ang) >= 0;
      const lx = cx + (R + 14) * Math.cos(ang), ly = cy + (R + 14) * Math.sin(ang);
      const anchor = right ? "start" : "end";
      nodes += `<text class="n-label" x="${lx}" y="${ly}" text-anchor="${anchor}" style="font-size:11px">${esc(nice(a))}</text>`;
      nodes += `<text class="e-label" x="${lx}" y="${ly + 12}" text-anchor="${anchor}">${esc(o.values[a])}</text>`;
    });
    let center = `<circle cx="${cx}" cy="${cy}" r="46" fill="#34d3c0" stroke="#0d1017" stroke-width="2"/>`;
    center += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" style="font-size:13px;font-weight:700;fill:#04231f">${esc(id)}</text>`;
    center += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" style="font-size:10px;fill:#04231f">:Object</text>`;
    return svg(W, H, edges + nodes + center);
  }

  function renderHierarchy() {
    const h = P.hierarchy();
    // ordered countries grouped by class then grade
    const order = [];
    P.classes.forEach((c) => {
      Object.keys(h[c]).sort().forEach((g) => h[c][g].forEach((id) => order.push({ id, grade: g, cls: c })));
    });
    const rowH = 19, top = 30, W = 1080;
    const H = top + order.length * rowH + 20;
    const xC = 150, xG = 560, xK = 900;
    const gradeY = {}, classY = {};
    // grade y = mean of its countries
    const byGrade = {};
    order.forEach((o, i) => { (byGrade[o.grade] = byGrade[o.grade] || []).push(top + i * rowH); });
    Object.keys(byGrade).forEach((g) => (gradeY[g] = byGrade[g].reduce((a, b) => a + b, 0) / byGrade[g].length));
    const byClass = {};
    order.forEach((o) => { (byClass[o.cls] = byClass[o.cls] || new Set()).add(o.grade); });
    P.classes.forEach((c) => {
      const ys = [...(byClass[c] || [])].map((g) => gradeY[g]);
      classY[c] = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : top;
    });
    let edges = "", cnodes = "", gnodes = "", knodes = "";
    order.forEach((o, i) => {
      const y = top + i * rowH;
      edges += edge(xC + 6, y, xG - 60, gradeY[o.grade], "#2b333d", 1);
      cnodes += `<circle cx="${xC}" cy="${y}" r="4" fill="#34d3c0"/>`;
      cnodes += `<text class="n-sub" x="${xC - 10}" y="${y + 3.5}" text-anchor="end" style="fill:#c9d4de">${esc(o.id)}</text>`;
    });
    Object.keys(gradeY).sort().forEach((g) => {
      const y = gradeY[g], cls = P.classOf(g);
      edges += edge(xG + 60, y, xK - 70, classY[cls], "#3a3350", 1.4);
      gnodes += node(xG, y, 15, "#a78bfa", "", "") ;
      gnodes += `<text x="${xG}" y="${y + 4}" text-anchor="middle" style="font-size:11px;font-weight:700;fill:#160f2e">${esc(g)}</text>`;
    });
    P.classes.forEach((c) => {
      const y = classY[c], col = c === "Investment Grade" ? "#4ade80" : "#fb7185";
      knodes += `<circle cx="${xK}" cy="${y}" r="22" fill="${col}" stroke="#0d1017" stroke-width="2"/>`;
      knodes += `<text x="${xK}" y="${y - 26}" text-anchor="middle" class="n-label">${esc(c)}</text>`;
    });
    // column captions
    const cap = `<text class="n-sub" x="${xC}" y="14" text-anchor="end">:Object (country)</text>` +
      `<text class="n-sub" x="${xG}" y="14" text-anchor="middle">:Group grade</text>` +
      `<text class="n-sub" x="${xK}" y="14" text-anchor="middle">:Group class</text>`;
    return svg(W, H, cap + edges + cnodes + gnodes + knodes);
  }

  function renderCondition() {
    const rows = P.condition();
    let t = `<p class="result-desc">${rows.length} objects match — <span class="pill aaa">Credit_Rating = AAA</span> and GDP growth &gt; 2.0%.</p>`;
    t += `<table class="data"><thead><tr><th>country</th><th>credit_rating</th><th>gdp_growth</th></tr></thead><tbody>`;
    rows.forEach((r) => (t += `<tr><td class="countrylist">${esc(r.country)}</td><td><span class="pill aaa">${esc(r.credit_rating)}</span></td><td class="val">${r.gdp_growth.toFixed(1)}</td></tr>`));
    t += `</tbody></table>`;
    return t;
  }

  function renderInvestment() {
    const groups = P.investmentGrouping();
    const total = groups.reduce((a, g) => a + g.countries.length, 0);
    let t = `<p class="result-desc">${total} countries reach <b style="color:var(--invest)">Investment Grade</b> across ${groups.length} rating grades.</p>`;
    t += `<table class="data"><thead><tr><th>class</th><th>grade</th><th>countries</th></tr></thead><tbody>`;
    groups.forEach((g) => {
      t += `<tr><td><span class="pill aaa">Investment Grade</span></td><td class="attr">${esc(g.grade)}</td><td class="countrylist">${esc(g.countries.join(", "))}</td></tr>`;
    });
    t += `</tbody></table>`;
    return t;
  }

  // ---- run + paint --------------------------------------------------------
  function run(q) {
    current = q;
    document.querySelectorAll(".qbtn").forEach((b) => b.classList.toggle("active", b.dataset.id === q.id));
    $("#picker").style.display = q.picker ? "block" : "none";

    const cy = typeof q.cypher === "function" ? q.cypher(selectedObject) : q.cypher;
    $("#cypher").innerHTML = highlightCypher(cy);
    $("#rid").textContent = q.id;
    $("#rlabel").textContent = q.label + (q.picker ? ` — ${selectedObject}` : "");

    let html = "";
    let staged = true;
    switch (q.kind) {
      case "schema": html = renderSchema(); break;
      case "count-obj": html = renderCount("count-obj"); break;
      case "count-attr": html = renderCount("count-attr"); break;
      case "values": html = renderValuesTable(selectedObject); staged = false; break;
      case "star": html = renderStar(selectedObject); break;
      case "condition": html = renderCondition(); staged = false; break;
      case "hierarchy": html = renderHierarchy(); break;
      case "investment": html = renderInvestment(); staged = false; break;
    }
    const stage = $("#stage");
    stage.className = staged ? "stage" : "";
    stage.innerHTML = html;

    try {
      history.replaceState(null, "", "#" + (q.picker ? q.id + "/" + encodeURIComponent(selectedObject) : q.id));
    } catch (_) {}
  }

  function initialFromHash() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!h) return QUERIES[0];
    const [qid, obj] = h.split("/");
    const q = QUERIES.find((x) => x.id.toLowerCase() === qid.toLowerCase());
    if (!q) return QUERIES[0];
    if (obj && P.objectById(obj)) selectedObject = obj;
    return q;
  }

  // ---- build chrome -------------------------------------------------------
  function build() {
    // stats
    const c = P.counts;
    $("#stats").innerHTML =
      `<div class="stat obj"><b>${c.objects}</b><span>Objects · U</span></div>` +
      `<div class="stat att"><b>${c.attributes}</b><span>Attributes · A</span></div>` +
      `<div class="stat val"><b>${c.values}</b><span>HAS_VALUE</span></div>` +
      `<div class="stat grp"><b>${c.groups}</b><span>Groups (${c.grades} grades + ${c.classes} classes)</span></div>`;

    // sidebar buttons
    const nav = $("#qnav");
    QUERIES.forEach((q) => {
      const btn = document.createElement("button");
      btn.className = "qbtn";
      btn.dataset.id = q.id;
      btn.innerHTML = `<span class="qid">${q.id}</span>${q.label}<small>${q.sub}</small>`;
      btn.addEventListener("click", () => run(q));
      nav.appendChild(btn);
    });

    // object picker
    const sel = $("#objsel");
    P.OBJECTS.map((o) => o.id).sort().forEach((id) => {
      const opt = document.createElement("option");
      opt.value = id; opt.textContent = id;
      if (id === selectedObject) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", (e) => { selectedObject = e.target.value; run(current); });

    run(initialFromHash());
  }

  document.addEventListener("DOMContentLoaded", build);
})();
