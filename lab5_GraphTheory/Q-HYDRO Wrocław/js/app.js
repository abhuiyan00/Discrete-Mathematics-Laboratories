/* ============================================================================
   Q-HYDRO WROCŁAW — app controller: nav, lab rail, budget, charts
   ========================================================================== */
(function () {
  const eur = n => '€' + Math.round(n).toLocaleString('en-US');
  const $ = s => document.querySelector(s);

  /* ---- lab rail -------------------------------------------------------- */
  const LENS_META = [
    ['discovery','Discovery','BFS — sensors come online'],
    ['backbone','Backbone','MST — minimal energy tree'],
    ['weak','Weak points','Cut vertices & bridges'],
    ['routing','Routing','Dijkstra to the hub'],
    ['failure','Failure & Fix','Outage → fastest repair'],
    ['maintenance','Maintenance','TSP calibration loop'],
    ['planarity','Layout','Planarity & Kuratowski'],
  ];
  function buildRail() {
    const rail = $('#lens-rail');
    LENS_META.forEach(([id, t, d], i) => {
      const b = document.createElement('button');
      b.className = 'lens-btn'; b.dataset.lens = id;
      b.innerHTML = `<span class="lb-n">${String(i+1).padStart(2,'0')}</span>
        <span><span class="lb-t">${t}</span><span class="lb-d">${d}</span></span>`;
      b.onclick = () => QHMap.setLens(id);
      rail.appendChild(b);
    });
  }

  /* ---- network inventory table ----------------------------------------- */
  function buildInventory() {
    const tb = $('#inv-body');
    QH.nodes.filter(n => n.id !== 'HUB').forEach(n => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="mono">${n.id}</td><td>${n.name}</td>
        <td>${n.type}</td><td class="note-cell">${n.risk}</td>
        <td class="num">${QH.adj[n.id].length}</td>
        <td class="num">${n.elev} m</td>`;
      tr.title = 'Locate ' + n.name + ' on the live map';
      tr.onclick = () => window.QHMap && QHMap.focusNode(n.id);
      tb.appendChild(tr);
    });
  }

  /* ---- budget table ---------------------------------------------------- */
  function buildBudget() {
    const tb = $('#budget-body');
    QH.budget.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.item}</td>
        <td class="num">${r.unit ? eur(r.unit) : '—'}</td>
        <td class="num">${r.qty}</td>
        <td class="num">${eur(r.unit * r.qty)}</td>
        <td class="note-cell">${r.note}</td>`;
      tb.appendChild(tr);
    });
    $('#budget-total').textContent = eur(QH.budgetTotal);
    $('#ask-figure').textContent = eur(QH.budgetTotal);
  }

  /* ---- SVG charts ------------------------------------------------------- */
  function marketChart() {
    const d = QH.market.series, W = 560, H = 230, P = { l:42, r:14, t:14, b:30 };
    const xs = i => P.l + i * (W - P.l - P.r) / (d.length - 1);
    const maxV = 160;
    const ys = v => H - P.b - v / maxV * (H - P.t - P.b);
    const line = d.map((p, i) => `${xs(i).toFixed(1)},${ys(p.v).toFixed(1)}`).join(' ');
    const area = `${P.l},${ys(0)} ${line} ${xs(d.length-1)},${ys(0)}`;
    let g = '';
    [0,40,80,120,160].forEach(v => { g += `<line class="axis" x1="${P.l}" y1="${ys(v)}" x2="${W-P.r}" y2="${ys(v)}"/>
      <text x="${P.l-6}" y="${ys(v)+3}" text-anchor="end">$${v}m</text>`; });
    d.forEach((p, i) => { g += `<text x="${xs(i)}" y="${H-10}" text-anchor="middle">${p.y}</text>`; });
    const dots = d.map((p, i) => `<circle cx="${xs(i)}" cy="${ys(p.v)}" r="3" fill="#0b0b0c"/>`).join('');
    $('#market-chart').innerHTML = `
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Market growth">
        <defs><pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#d4d4d8" stroke-width="3"/></pattern></defs>
        ${g}
        <polygon points="${area}" fill="url(#hatch)" opacity=".8"/>
        <polyline points="${line}" fill="none" stroke="#0b0b0c" stroke-width="2"/>
        ${dots}
        <line class="baseln" x1="${P.l}" y1="${ys(0)}" x2="${W-P.r}" y2="${ys(0)}"/>
      </svg>`;
  }

  function revenueChart() {
    const d = QH.revenue, W = 560, H = 240, P = { l:50, r:14, t:14, b:46 };
    const maxV = 2000000;
    const ys = v => H - P.b - v / maxV * (H - P.t - P.b);
    const bw = (W - P.l - P.r) / d.length, bar = bw * 0.5;
    let g = '';
    [0,500000,1000000,1500000,2000000].forEach(v => {
      g += `<line class="axis" x1="${P.l}" y1="${ys(v)}" x2="${W-P.r}" y2="${ys(v)}"/>
            <text x="${P.l-6}" y="${ys(v)+3}" text-anchor="end">€${(v/1e6).toFixed(1)}m</text>`; });
    d.forEach((r, i) => {
      const x = P.l + i * bw + (bw - bar) / 2;
      const hApi = (H - P.b) - ys(r.api), hAl = (H - P.b) - ys(r.api + r.alerts) - (hApi);
      g += `<rect x="${x}" y="${ys(r.api)}" width="${bar}" height="${hApi}" fill="#0b0b0c"/>`;
      g += `<rect x="${x}" y="${ys(r.api + r.alerts)}" width="${bar}" height="${(ys(r.api)-ys(r.api+r.alerts))}" fill="url(#hatch2)"/>`;
      g += `<text x="${x+bar/2}" y="${H-26}" text-anchor="middle" font-weight="600" fill="#0b0b0c">${r.y}</text>`;
      g += `<text x="${x+bar/2}" y="${H-12}" text-anchor="middle" font-size="8">${eur(r.api+r.alerts)}</text>`;
    });
    $('#revenue-chart').innerHTML = `
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue ramp">
        <defs><pattern id="hatch2" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#0b0b0c" stroke-width="2"/></pattern></defs>
        ${g}
        <line class="baseln" x1="${P.l}" y1="${ys(0)}" x2="${W-P.r}" y2="${ys(0)}"/>
      </svg>`;
  }

  /* ---- scroll-spy ------------------------------------------------------- */
  function scrollSpy() {
    const links = [...document.querySelectorAll('.nav a[href^="#"]')];
    const map = {}; links.forEach(a => map[a.getAttribute('href').slice(1)] = a);
    const obs = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = map[e.target.id]; if (a) a.classList.add('active');
      }});
    }, { rootMargin:'-45% 0px -50% 0px' });
    document.querySelectorAll('section[id]').forEach(s => obs.observe(s));
  }

  /* ---- boot ------------------------------------------------------------- */
  function boot() {
    buildRail(); buildInventory(); buildBudget();
    marketChart(); revenueChart(); scrollSpy();
    QHMap.init();
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
