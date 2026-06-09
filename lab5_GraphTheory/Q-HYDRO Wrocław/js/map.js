/* ============================================================================
   Q-HYDRO WROCŁAW — map console
   Grayscale Leaflet map of Lower Silesia centred on Politechnika Wrocławska.
   Renders the sensor graph and animates each graph-theory lens over it.
   ========================================================================== */

const QHMap = (function () {
  let map, nodeMarkers = {}, edgeLayers = [], proposed = [], timer = null;
  let lens = 'discovery';
  const R = {};   // readout element refs

  /* ---- styling primitives ---------------------------------------------- */
  const BASE_LORA = { color:'#9a9a9d', weight:1.4, opacity:.9, dashArray:null };
  const BASE_5G   = { color:'#0b0b0c', weight:1.3, opacity:.55, dashArray:'2 5' };

  function styleEdge(i, s) { if (edgeLayers[i]) edgeLayers[i].setStyle(s); }
  function baseEdge(i) {
    const e = QH.edges[i];
    styleEdge(i, e.type === '5g' ? { ...BASE_5G } : { ...BASE_LORA });
  }
  function el(id) { const m = nodeMarkers[id]; return m && m.getElement() ? m.getElement().querySelector('.nd') : null; }
  function setNodeClass(id, cls) { const e = el(id); if (e) e.className = 'nd ' + cls; }
  function baseClass(id) { return QH.byId[id].type === 'HUB' ? 'hub' : QH.byId[id].type === 'MEMS' ? 'mems' : 'aqg'; }
  function resetNodes(extra) { QH.nodes.forEach(n => setNodeClass(n.id, baseClass(n.id) + (extra ? ' ' + extra : ''))); }
  function resetEdges() { QH.edges.forEach((_, i) => baseEdge(i)); proposed.forEach(p => map.removeLayer(p)); proposed = []; }
  let extraTimers = [];
  function clearTimer() {
    if (timer) { clearInterval(timer); timer = null; }
    extraTimers.forEach(t => clearInterval(t)); extraTimers = [];
  }

  function fullReset() { clearTimer(); resetEdges(); resetNodes(); document.querySelector('.gv-map').classList.remove('show-labels'); }

  /* sequence animator */
  function animate(items, ms, step, done) {
    clearTimer(); let i = 0;
    const tick = () => {
      if (i >= items.length) { clearTimer(); done && done(); return; }
      step(items[i], i); i++;
    };
    tick(); timer = setInterval(tick, ms);
  }

  /* ---- readout --------------------------------------------------------- */
  function setReadout({ title, badge, ex, metrics = [], controls = [], hint = '' }) {
    R.title.textContent = title;
    R.badge.textContent = badge || '';
    R.badge.style.display = badge ? '' : 'none';
    R.ex.innerHTML = ex || '';
    R.metrics.innerHTML = metrics.map(m =>
      `<div class="metric"><div class="mv">${m.v}</div><div class="ml">${m.l}</div></div>`).join('');
    R.controls.innerHTML = '';
    controls.forEach(c => {
      const b = document.createElement('button');
      b.className = 'btn' + (c.solid ? ' solid' : '');
      b.textContent = c.label; b.disabled = !!c.disabled;
      b.onclick = c.fn; R.controls.appendChild(b);
    });
    if (hint) { const h = document.createElement('span'); h.className = 'hint'; h.textContent = hint; R.controls.appendChild(h); }
  }

  /* ===================================================================== */
  /*  LENSES                                                               */
  /* ===================================================================== */
  const grayRamp = ['#0b0b0c','#3a3a3d','#5f5f63','#8d8d92','#bdbdc2','#d4d4d8','#e2e2e5'];

  function lensDiscovery() {
    fullReset();
    document.querySelector('.gv-map').classList.add('show-labels');
    const b = QG.bfs('HUB');
    const fmt = () => setReadout({
      title:'Sensor discovery — Breadth-First Search',
      badge:'BFS',
      ex:'When a gravimeter powers on it sends a <b>hello</b> to the Wrocław hub. The hub runs BFS, assigning each node its hop-distance and a parent in the discovery tree. Watch the network fill outward in concentric layers from Politechnika Wrocławska.',
      metrics:[
        { v:b.reached, l:'Nodes reached' },
        { v:b.maxHop, l:'Max hops to hub' },
        { v:b.layers.map(l=>l.length).join('·'), l:'Layer sizes' },
      ],
      controls:[{ label:'▶ Replay discovery', solid:true, fn:run }],
    });
    function run() {
      clearTimer(); resetEdges(); resetNodes('dim');
      // reveal node by node in BFS order, color by hop layer
      animate(b.order, 240, (id, idx) => {
        const hop = b.dist[id];
        const e = el(id); if (!e) return;
        e.className = 'nd ' + baseClass(id) + ' on';
        const dot = e.querySelector('.dot');
        if (dot && QH.byId[id].type !== 'HUB') dot.style.background = grayRamp[Math.min(hop, grayRamp.length-1)];
        setTimeout(() => { const ee = el(id); if (ee) ee.classList.remove('on'); }, 360);
      }, () => {
        // draw whole BFS tree
        b.treeEdges.forEach(ei => styleEdge(ei, { color:'#0b0b0c', weight:2.2, opacity:1, dashArray:null }));
      });
      // tree edges appear progressively too
      let k = 0;
      const ti = setInterval(() => {
        if (k >= b.treeEdges.length) { clearInterval(ti); return; }
        styleEdge(b.treeEdges[k], { color:'#0b0b0c', weight:2.2, opacity:1, dashArray:null }); k++;
      }, 240);
      extraTimers.push(ti);
    }
    fmt();          // set this lens's own readout (else the previous lens's buttons leak through)
    run();
  }

  function lensBackbone() {
    fullReset();
    const m = QG.mst();
    // dim everything, then grow MST
    QH.edges.forEach((_, i) => styleEdge(i, { color:'#d4d4d8', weight:1, opacity:.6, dashArray:null }));
    resetNodes('dim');
    setReadout({
      title:'Energy backbone — Minimum Spanning Tree',
      badge:'MST · PRIM',
      ex:'The cheapest set of links that still connects every sensor with no redundancy: <b>n−1 edges, zero cycles</b>. This is the low-power backbone used for firmware broadcast and critical alerts — it prevents broadcast storms and minimises radio energy.',
      metrics:[
        { v:m.treeEdges.length, l:'Backbone links' },
        { v:m.totalKm+' km', l:'Total span' },
        { v:m.totalW.toFixed(2), l:'Composite cost' },
      ],
      controls:[{ label:'▶ Grow backbone', solid:true, fn:run }],
    });
    function run() {
      clearTimer();
      QH.edges.forEach((_, i) => styleEdge(i, { color:'#e2e2e5', weight:1, opacity:.5, dashArray:null }));
      resetNodes('dim');
      animate(m.order, 300, (id) => { setNodeClass(id, baseClass(id)); }, null);
      let k = 0;
      const ti = setInterval(() => {
        if (k >= m.treeEdges.length) { clearInterval(ti); return; }
        styleEdge(m.treeEdges[k], { color:'#0b0b0c', weight:2.4, opacity:1, dashArray:null }); k++;
      }, 300);
      extraTimers.push(ti);
    }
    run();
  }

  function lensWeak() {
    fullReset();
    const a = QG.articulation();
    a.bridges.forEach(ei => styleEdge(ei, { color:'#0b0b0c', weight:3, opacity:1, dashArray:'5 5' }));
    resetNodes();
    a.ap.forEach(id => setNodeClass(id, baseClass(id) + ' ap'));
    const ranked = a.ap.map(id => ({ id, sev: QG.failureImpact(id).severed }))
                       .sort((x,y)=>y.sev-x.sev);
    setReadout({
      title:'Weak points — articulation nodes & bridges',
      badge:'TARJAN',
      ex:'A DFS-based scan finds every <b>cut vertex</b> (pulsing) and <b>bridge</b> (dashed) — single points whose loss splits the network. '+
         'Worst case: losing <b>'+QH.byId[ranked[0].id].name+'</b> isolates '+ranked[0].sev+' downstream sensors. These are the nodes we harden with redundant links.',
      metrics:[
        { v:a.ap.length, l:'Articulation pts' },
        { v:a.bridges.length, l:'Bridges' },
        { v:'≈'+QH.stats.density, l:'Graph density' },
      ],
      controls:[{ label:'Inspect failure & fix →', fn:()=>QHMap.setLens('failure') }],
      hint:'Switch to “Failure & Fix” to break a node and watch the network recover.',
    });
  }

  function drawPathEdges(edges, style) { edges.forEach(ei => styleEdge(ei, style)); }

  function lensRouting() {
    fullReset();
    document.querySelector('.gv-map').classList.add('show-labels');
    const dijk = QG.dijkstra('HUB'); dijk.target = 'HUB';
    // farthest node by latency as default source
    let far = null, fb = -1;
    QH.nodes.forEach(n => { if (n.id!=='HUB' && dijk.dist[n.id] < Infinity && dijk.dist[n.id] > fb) { fb = dijk.dist[n.id]; far = n.id; } });
    QHMap._routeSrc = far;
    function show(src) {
      clearTimer(); resetEdges(); resetNodes('dim');
      // faint shortest-path tree
      dijk.treeEdges.forEach(ei => styleEdge(ei, { color:'#c7c7ca', weight:1.2, opacity:.7, dashArray:null }));
      const p = QG.pathTo(src, dijk);
      setNodeClass('HUB','hub'); 
      // animate path from src to hub
      const seq = p.edges.slice();
      let k = 0;
      setNodeClass(src, baseClass(src)+' on');
      animate(seq, 260, (ei) => {
        styleEdge(ei, { color:'#0b0b0c', weight:3, opacity:1, dashArray:null });
        const e = QH.edges[ei]; setNodeClass(e.a, baseClass(e.a)); setNodeClass(e.b, baseClass(e.b));
      }, () => { setNodeClass(src, baseClass(src)+' on'); });
      setReadout({
        title:'Real-time routing — Dijkstra to the hub',
        badge:'DIJKSTRA',
        ex:'Every 60 s each sensor recomputes its <b>lowest-latency path</b> to Politechnika Wrocławska over live edge weights. '+
           'Shown: optimal route from <b>'+QH.byId[src].name+'</b>. Click any node on the map to route from there.',
        metrics:[
          { v:p.hops, l:'Hops to hub' },
          { v:p.latency+' ms', l:'Path latency' },
          { v:dijk.treeEdges.length, l:'SPT links' },
        ],
        controls:[{ label:'▶ Replay route', solid:true, fn:()=>show(src) }],
        hint:'Tip: click a sensor to re-route.',
      });
    }
    QHMap._routeShow = show;
    show(far);
  }

  function lensFailure() {
    fullReset();
    document.querySelector('.gv-map').classList.add('show-labels');
    const failedSet = new Set();            // cumulative outage — toggle nodes in/out
    QHMap._failed = failedSet;
    const nm = id => QH.byId[id].name;
    const names = () => [...failedSet].map(nm).join(', ');

    function worstAP() {
      // articulation points of the SURVIVING graph (already-failed nodes removed)
      const a = QG.articulation(failedSet);
      const cands = a.ap.filter(id => !failedSet.has(id) && id !== 'HUB');
      if (!cands.length) return null;
      // rank by MARGINAL damage: how many *more* sensors this cut orphans now.
      // (Recomputing on the full graph would re-pick the same node forever.)
      const base = QG.failureImpact(failedSet).severed;
      return cands
        .map(id => { const s = new Set(failedSet); s.add(id);
                     return { id, m: QG.failureImpact(s).severed - base }; })
        .sort((x, y) => y.m - x.m)[0].id;
    }
    function compound() { const w = worstAP(); if (w) { failedSet.add(w); render(); } }
    function restoreAll() { failedSet.clear(); render(); }
    function drawLinks(links, style) {
      links.forEach(l => {
        const A = QH.byId[l.a], B = QH.byId[l.b];
        proposed.push(L.polyline([[A.lat, A.lng], [B.lat, B.lng]], style).addTo(map));
      });
    }

    function intro() {
      setReadout({
        title:'Resilience — simulate outages, compute the fastest fix',
        badge:'SCENARIO',
        ex:'<b>Click any sensor to take it offline.</b> Click more to stack a compound outage; click a downed sensor to restore it. '+
           'The engine recomputes connectivity live and, when the network splits, recommends the cheapest set of redundancy links that restores it — the minimum-cost augmentation we hand to Odra 5 (QUBO) at scale.',
        metrics:[ { v:'0', l:'Nodes down' }, { v:'—', l:'Severed' }, { v:'—', l:'Fix cost' } ],
        controls:[{ label:'Fail worst cut vertex', fn:compound }],
        hint:'Tip: stack 2–3 failures to expose hidden two-vertex cuts.',
      });
    }

    function render() {
      clearTimer(); resetEdges(); resetNodes();
      if (failedSet.size === 0) { intro(); return; }
      const imp = QG.failureImpact(failedSet);
      failedSet.forEach(id => {
        setNodeClass(id, baseClass(id) + ' failed');
        QH.adj[id].forEach(({ ei }) => styleEdge(ei, { color:'#e2e2e5', weight:1, opacity:.5, dashArray:'1 4' }));
      });
      if (imp.hubFailed) { renderHub(imp); return; }
      const dijk = QG.dijkstra('HUB', failedSet);
      dijk.treeEdges.forEach(ei => styleEdge(ei, { color:'#0b0b0c', weight:2, opacity:1, dashArray:null }));
      imp.orphaned.forEach(o => setNodeClass(o, baseClass(o) + ' orphan'));
      if (!imp.isCut) { renderResilient(imp); return; }
      renderCut(imp);
    }

    function renderResilient(imp) {
      const n = failedSet.size;
      setReadout({
        title:'Outage at '+names()+' — network self-heals',
        badge:'RESILIENT',
        ex:'<b>'+n+'</b> node'+(n>1?'s':'')+' down, yet no sensor is orphaned. Traffic re-routes over redundant LoRa/5G links; '+
           'Dijkstra rebuilds the shortest-path tree to the hub in under 5 s. <b>No field action required.</b>',
        metrics:[ { v:n, l:'Nodes down' }, { v:'0', l:'Severed' }, { v:'€0', l:'Fix cost' } ],
        controls:[
          { label:'+ Compound failure', solid:true, fn:compound },
          { label:'↻ Restore all', fn:restoreAll },
        ],
        hint:'Stack more failures to find a combination that splits the network.',
      });
    }

    function renderCut(imp) {
      const fix = QG.augmentFix(failedSet);
      const orphanNames = imp.orphaned.map(nm).join(', ');
      const linkList = fix.links.map(l => nm(l.a)+' ↔ '+nm(l.b)+' ('+l.km+' km)').join('; ');
      const multi = failedSet.size > 1;
      if (fix.complete && fix.links.length) {
        drawLinks(fix.links, { color:'#0b0b0c', weight:2.6, opacity:1, dashArray:'7 6', className:'proposed-link' });
        setReadout({
          title:'Outage'+(multi?' (compound)':'')+' — '+names(),
          badge: multi ? 'MULTI-CUT' : 'CUT VERTEX',
          ex:'Removing <b>'+names()+'</b> orphans <b>'+imp.severed+'</b> sensor'+(imp.severed>1?'s':'')+' ('+orphanNames+'). '+
             'Cheapest restoring augmentation: <b>'+fix.links.length+' link'+(fix.links.length>1?'s':'')+'</b> — '+linkList+
             ' (+'+fix.totalKm+' km). At scale this minimum-cost augmentation is the QUBO solved on Odra 5.',
          metrics:[
            { v:imp.severed, l:'Severed' },
            { v:fix.links.length, l:'Fix links' },
            { v:'€'+fix.totalCost.toLocaleString('en-US'), l:'Fix cost' },
          ],
          controls:[
            { label:'✓ Deploy fix', solid:true, fn:()=>deploy(fix) },
            { label:'↻ Restore all', fn:restoreAll },
          ],
          hint:'Dashed = recommended redundancy link'+(fix.links.length>1?'s':'')+'.',
        });
      } else {
        if (fix.links.length) drawLinks(fix.links, { color:'#8d8d92', weight:2, opacity:.9, dashArray:'2 6' });
        setReadout({
          title:'Outage'+(multi?' (compound)':'')+' — '+names(),
          badge:'STRUCTURAL',
          ex:'Removing <b>'+names()+'</b> orphans <b>'+imp.severed+'</b> sensor'+(imp.severed>1?'s':'')+' ('+orphanNames+'). '+
             'No set of in-range relay links fully restores connectivity'+(fix.links.length?' (best partial shown)':'')+
             ' — this needs a new backbone node or long-haul back-haul, the hard combinatorial case Odra 5 is built for.',
          metrics:[
            { v:imp.severed, l:'Severed' },
            { v:fix.links.length+' / '+(imp.comps.length-1), l:'Links part/need' },
            { v:fix.links.length ? '€'+fix.totalCost.toLocaleString('en-US') : '—', l:'Partial cost' },
          ],
          controls:[{ label:'↻ Restore all', fn:restoreAll }],
          hint:'Some clusters lie beyond relay range of the survivors.',
        });
      }
    }

    function renderHub(imp) {
      imp.orphaned.forEach(o => setNodeClass(o, baseClass(o) + ' orphan'));
      setReadout({
        title:'Hub outage — Politechnika Wrocławska (WCSS · Odra 5)',
        badge:'CATASTROPHIC',
        ex:'The hub is the data sink and the Odra 5 host. Its loss severs <b>all '+imp.severed+' field sensors at once</b> — '+
           'no relay link can substitute for it. This is the one case graph augmentation cannot fix; it is mitigated with N+1 power, '+
           'dual independent back-haul and a hot-standby hub.',
        metrics:[ { v:imp.severed, l:'Severed' }, { v:'TOTAL', l:'Outage' }, { v:'—', l:'Link fix' } ],
        controls:[
          { label:'↻ Restore hub', solid:true, fn:()=>{ failedSet.delete('HUB'); render(); } },
          { label:'↻ Restore all', fn:restoreAll },
        ],
        hint:'Failing the hub is the worst case — the design hardens it directly.',
      });
    }

    function deploy(fix) {
      proposed.forEach(p => p.setStyle({ dashArray:null, weight:2.6, color:'#0b0b0c', opacity:1 }));
      QG.failureImpact(failedSet).orphaned.forEach(o => setNodeClass(o, baseClass(o)));
      setReadout({
        title:'Fix deployed — '+fix.links.length+' redundancy link'+(fix.links.length>1?'s':''),
        badge:'2-CONNECTED',
        ex:'Added '+fix.links.map(l => nm(l.a)+' ↔ '+nm(l.b)).join(', ')+'. The orphaned cluster'+(fix.links.length>1?'s are':' is')+
           ' reconnected and the surviving network now tolerates the loss of <b>'+names()+'</b> with zero downtime. '+
           'At scale this augmentation is solved as a QUBO on Odra 5.',
        metrics:[
          { v:'0', l:'Severed' },
          { v:fix.links.length, l:'Links added' },
          { v:'€'+fix.totalCost.toLocaleString('en-US'), l:'Capex' },
        ],
        controls:[{ label:'↻ Reset scenario', fn:restoreAll }],
      });
    }

    QHMap._failNode = function (id) {
      if (failedSet.has(id)) failedSet.delete(id); else failedSet.add(id);   // toggle — hub included
      render();
    };
    intro();
  }

  function lensMaintenance() {
    fullReset();
    let mode = 'classical';
    function show(m) {
      mode = m; clearTimer(); resetEdges(); resetNodes('dim');
      QH.edges.forEach((_, i) => styleEdge(i, { color:'#ededef', weight:1, opacity:.5, dashArray:null }));
      const r = QG.tspRoute(m);
      // draw route as polyline through node coords
      proposed.forEach(p => map.removeLayer(p)); proposed = [];
      const pts = r.route.map(id => [QH.byId[id].lat, QH.byId[id].lng]);
      r.route.forEach(id => setNodeClass(id, baseClass(id)));
      // animate the technician loop
      let k = 0;
      animate(pts.slice(1), 200, (pt, idx) => {
        const seg = L.polyline([pts[idx], pt], { color:'#0b0b0c', weight: m==='quantum'?2.6:2, opacity:1,
          dashArray: m==='quantum'? null : '4 4' }).addTo(map);
        proposed.push(seg);
        setNodeClass(r.route[idx+1], baseClass(r.route[idx+1])+' on');
        setTimeout(()=>{ const e=el(r.route[idx+1]); if(e)e.classList.remove('on'); }, 320);
      });
      const cls = QG.tspRoute('classical'), qnt = QG.tspRoute('quantum');
      const saveKm = cls.km - qnt.km;
      const savePct = Math.round(saveKm / cls.km * 100);
      const perVisit = m==='quantum' ? QH.tsp.quantumCost : QH.tsp.classicalCost;
      const annual = (QH.tsp.classicalCost - QH.tsp.quantumCost) * QH.tsp.perYear;
      setReadout({
        title:'Maintenance loop — Travelling Salesman calibration route',
        badge: m==='quantum' ? 'QAOA · 2-OPT' : 'NEAREST-NEIGHBOUR',
        ex:'Every AQG needs a rubidium-laser re-calibration each quarter. '+
           (m==='quantum'
             ? 'The <b>quantum-optimised</b> tour (QAOA-class 2-opt on Odra 5) shortens the loop to '+qnt.km+' km — <b>'+savePct+'% less</b> driving than the greedy baseline.'
             : 'The naïve <b>nearest-neighbour</b> heuristic produces a '+cls.km+' km loop with avoidable back-tracking.'),
        metrics:[
          { v:r.km+' km', l:'Route length' },
          { v:'€'+perVisit.toLocaleString('en-US'), l:'Cost / visit' },
          { v:'€'+annual.toLocaleString('en-US'), l:'Annual saving' },
        ],
        controls:[
          { label:'Nearest-neighbour', solid: m==='classical', fn:()=>show('classical') },
          { label:'Quantum-optimised', solid: m==='quantum', fn:()=>show('quantum') },
        ],
      });
    }
    show('classical');
  }

  function lensPlanarity() {
    fullReset();
    const p = QG.planarityNote();
    // highlight the densest cluster (Sudety/copper) edges
    resetNodes(); resetEdges();
    setReadout({
      title:'Layout integrity — planarity & Kuratowski',
      badge:'KURATOWSKI',
      ex:'For buried fibre, edge <b>crossings</b> mean expensive trenching. A simple planar graph obeys <b>E ≤ 3V − 6</b>. '+
         'Our network ('+p.E+' edges, '+p.V+' nodes) sits well under the bound of '+p.bound+' — and where physical clusters would force a K₅ or K₃,₃ crossing, '+
         'we separate links vertically (overhead vs underground), planarising the layout and cutting installation cost ~18%.',
      metrics:[
        { v:p.E, l:'Edges (E)' },
        { v:p.bound, l:'Planar bound 3V−6' },
        { v:p.withinBound?'PASS':'CHECK', l:'Euler test' },
      ],
      controls:[],
    });
  }

  const LENSES = {
    discovery: lensDiscovery, backbone: lensBackbone, weak: lensWeak,
    routing: lensRouting, failure: lensFailure, maintenance: lensMaintenance,
    planarity: lensPlanarity,
  };

  /* ---- node click dispatch --------------------------------------------- */
  function onNodeClick(id) {
    if (lens === 'failure' && QHMap._failNode) QHMap._failNode(id);
    else if (lens === 'routing' && QHMap._routeShow && id !== 'HUB') QHMap._routeShow(id);
  }

  /* ---- init ------------------------------------------------------------ */
  function init() {
    R.title = document.getElementById('lab-title');
    R.badge = document.getElementById('lab-badge');
    R.ex = document.getElementById('lab-explain');
    R.metrics = document.getElementById('lab-metrics');
    R.controls = document.getElementById('lab-controls');

    map = L.map('map', { zoomControl:true, attributionControl:true, scrollWheelZoom:false })
            .setView([50.95, 16.55], 9);
    const mapEl = document.getElementById('map');
    mapEl.classList.add('gv-map');
    // scroll to zoom — armed only while the pointer is over the map, so the rest
    // of the page keeps scrolling normally and the map never traps the wheel
    mapEl.addEventListener('mouseenter', () => map.scrollWheelZoom.enable());
    mapEl.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
    map.attributionControl.setPosition('bottomleft');   // clear the bottom-right corner for the legend
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap · © CARTO', subdomains:'abcd', maxZoom:19,
    }).addTo(map);

    // edges first (lower pane)
    QH.edges.forEach((e, i) => {
      const A = QH.byId[e.a], B = QH.byId[e.b];
      const line = L.polyline([[A.lat,A.lng],[B.lat,B.lng]], { interactive:false }).addTo(map);
      edgeLayers[i] = line; baseEdge(i);
    });
    // nodes
    QH.nodes.forEach(n => {
      const cls = baseClass(n.id);
      const icon = L.divIcon({ className:'', iconSize:[18,18], iconAnchor:[9,9],
        html:`<div class="nd ${cls}"><span class="dot"></span><span class="lbl">${n.id==='HUB'?'WCSS · Odra 5':n.id+' '+n.name}</span></div>` });
      const m = L.marker([n.lat,n.lng], { icon, riseOnHover:true, title:n.name }).addTo(map);
      m.on('click', () => onNodeClick(n.id));
      m.on('mouseover', () => { const e = el(n.id); if (e) e.classList.add('show1'); });
      nodeMarkers[n.id] = m;
    });

    setLens('discovery');
    setTimeout(() => map.invalidateSize(), 250);
  }

  function setLens(name) {
    lens = name;
    document.querySelectorAll('.lens-btn').forEach(b => b.classList.toggle('active', b.dataset.lens === name));
    LENSES[name]();
    setTimeout(() => map.invalidateSize(), 60);
  }

  /* ---- locate a node from the inventory table -------------------------- */
  function focusNode(id) {
    const n = QH.byId[id]; if (!n || !map) return;
    const mapEl = document.getElementById('map');
    if (mapEl) mapEl.scrollIntoView({ behavior:'smooth', block:'center' });
    map.panTo([n.lat, n.lng]);
    const e = el(id);
    if (e) { e.classList.add('show1', 'on'); setTimeout(() => { const ee = el(id); if (ee) ee.classList.remove('on'); }, 1600); }
  }

  return { init, setLens, focusNode, get lens(){ return lens; } };
})();

window.QHMap = QHMap;
