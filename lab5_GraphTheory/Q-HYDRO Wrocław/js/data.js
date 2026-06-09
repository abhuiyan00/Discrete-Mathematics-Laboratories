/* ============================================================================
   Q-HYDRO WROCŁAW — Network data
   Real Lower Silesia (Dolnośląskie) geography. Coordinates are genuine.
   The hub is Politechnika Wrocławska / Wrocławskie Centrum Sieciowo-
   Superkomputerowe (WCSS), home of the "Odra 5" quantum computer.
   ========================================================================== */

const QH = {};

/* --- Sensor sites -------------------------------------------------------- */
/* type:  AQG  = Absolute Quantum Gravimeter (anchor node)
          MEMS = relative MEMS gravimeter (high-frequency interpolation)
          HUB  = Wrocław data + quantum hub
   risk:  the dominant subsurface hazard the node monitors                   */

QH.nodes = [
  { id:'HUB',  name:'Politechnika Wrocławska', short:'WCSS · Odra 5 Hub', lat:51.1097, lng:17.0594, type:'HUB',  elev:120, risk:'Quantum & data hub', battery:100 },

  { id:'G-01', name:'Trzebnica',        lat:51.3100, lng:17.0647, type:'AQG',  elev:160, risk:'Groundwater / moraine', battery:96 },
  { id:'G-02', name:'Oleśnica',         lat:51.2100, lng:17.3800, type:'MEMS', elev:150, risk:'Odra basin storage',    battery:91 },
  { id:'G-03', name:'Oława',            lat:50.9461, lng:17.2922, type:'AQG',  elev:130, risk:'Odra flood corridor',   battery:88 },
  { id:'G-04', name:'Brzeg',            lat:50.8606, lng:17.4675, type:'MEMS', elev:140, risk:'Odra flood corridor',   battery:84 },
  { id:'G-05', name:'Strzelin',         lat:50.7800, lng:17.0660, type:'AQG',  elev:170, risk:'Granite quarry voids',  battery:93 },
  { id:'G-06', name:'Sobótka / Ślęża',  lat:50.8983, lng:16.7456, type:'AQG',  elev:430, risk:'Massif — relay node',  battery:79 },
  { id:'G-07', name:'Świdnica',         lat:50.8449, lng:16.4892, type:'AQG',  elev:240, risk:'Coal subsidence',       battery:90 },
  { id:'G-08', name:'Dzierżoniów',      lat:50.7275, lng:16.6519, type:'MEMS', elev:260, risk:'Sudety foothills',      battery:82 },
  { id:'G-09', name:'Ząbkowice Śl.',    lat:50.5903, lng:16.8128, type:'AQG',  elev:290, risk:'Karst / sinkholes',     battery:87 },
  { id:'G-10', name:'Kłodzko',          lat:50.4347, lng:16.6619, type:'AQG',  elev:300, risk:'Flash-flood valley',    battery:74 },
  { id:'G-11', name:'Nowa Ruda',        lat:50.5803, lng:16.5022, type:'AQG',  elev:410, risk:'Abandoned coal mine',   battery:71 },
  { id:'G-12', name:'Wałbrzych',        lat:50.7714, lng:16.2845, type:'AQG',  elev:450, risk:'Post-mining voids',     battery:80 },
  { id:'G-13', name:'Kamienna Góra',    lat:50.7836, lng:16.0306, type:'MEMS', elev:430, risk:'Sudety subsidence',     battery:77 },
  { id:'G-14', name:'Jelenia Góra',     lat:50.9044, lng:15.7197, type:'AQG',  elev:350, risk:'Basin groundwater',     battery:85 },
  { id:'G-15', name:'Karpacz / Karkon.',lat:50.7783, lng:15.7128, type:'AQG',  elev:880, risk:'Massif — leaf node',   battery:63 },
  { id:'G-16', name:'Bolków',           lat:50.9217, lng:16.1083, type:'MEMS', elev:330, risk:'Fault interpolation',   battery:83 },
  { id:'G-17', name:'Jawor',            lat:51.0511, lng:16.1939, type:'AQG',  elev:200, risk:'Fore-Sudetic block',    battery:89 },
  { id:'G-18', name:'Legnica',          lat:51.2070, lng:16.1619, type:'AQG',  elev:120, risk:'LGOM relay',           battery:86 },
  { id:'G-19', name:'Lubin (KGHM)',     lat:51.4009, lng:16.2010, type:'AQG',  elev:150, risk:'Active copper mining',  battery:78 },
  { id:'G-20', name:'Głogów',           lat:51.6640, lng:16.0846, type:'AQG',  elev:80,  risk:'Odra + smelter',        battery:81 },
  { id:'G-21', name:'Polkowice (KGHM)', lat:51.5050, lng:16.0717, type:'MEMS', elev:130, risk:'Shaft microgravity',    battery:72 },
  { id:'G-22', name:'Środa Śląska',     lat:51.1633, lng:16.5950, type:'AQG',  elev:110, risk:'Central backbone',     battery:94 },
  { id:'G-23', name:'Wołów',            lat:51.3389, lng:16.6433, type:'MEMS', elev:110, risk:'Odra basin storage',    battery:90 },
  { id:'G-24', name:'Milicz',           lat:51.5275, lng:17.2767, type:'AQG',  elev:120, risk:'Barycz wetlands',       battery:88 },
];

/* --- Geodesy ------------------------------------------------------------- */
QH.haversine = function (a, b) {            // → kilometres
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const la1 = a.lat * toR, la2 = b.lat * toR;
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

QH.byId = {};
QH.nodes.forEach(n => QH.byId[n.id] = n);

/* --- Edge construction ---------------------------------------------------- */
/* LoRaWAN mesh links form automatically where line-of-sight distance is below
   the radio threshold. A small curated set of 5G/fibre backhaul links bridge
   the long gaps between regional clusters (declared, not auto-generated).     */

const LORA_RANGE_KM = 31;

/* curated long-haul backhaul links (5G / leased fibre) */
const BACKHAUL = [
  ['G-22','G-18'],   // Środa Śląska → Legnica  (central → LGOM)
  ['G-22','G-17'],   // Środa Śląska → Jawor
  ['G-06','G-07'],   // Ślęża → Świdnica  (ridge relay into Sudety)
  ['G-19','G-20'],   // Lubin → Głogów  (copper district spur)
];

function edgeWeight(km, type) {
  /* latency rises with distance + hop processing; backhaul is faster/longer.
     energy cost rises with distance (TX power); reliability falls with range
     and is worse on mountainous LoRa hops.                                   */
  const latency = type === '5g'
        ? 4 + km * 0.18              // 5G/fibre: low latency
        : 9 + km * 0.55;             // LoRa: store-and-forward
  const energy  = type === '5g' ? 0.25 : (0.4 + km / 31 * 0.6);   // 0..1
  const reliab  = type === '5g' ? 0.985 : Math.max(0.9, 0.995 - km / 31 * 0.08);
  // composite cost used for routing/optimisation (lower = better)
  const cost = 0.6 * (latency / 30) + 0.3 * energy + 0.1 * (1 - reliab);
  return {
    km: +km.toFixed(1),
    latency: +latency.toFixed(1),     // ms
    energy: +energy.toFixed(2),
    reliab: +reliab.toFixed(3),
    w: +cost.toFixed(3),
  };
}

QH.buildEdges = function () {
  const edges = [];
  const seen = new Set();
  const add = (a, b, type) => {
    const k = [a, b].sort().join('|');
    if (seen.has(k)) return;
    seen.add(k);
    const km = QH.haversine(QH.byId[a], QH.byId[b]);
    edges.push({ a, b, type, ...edgeWeight(km, type) });
  };
  // auto LoRa mesh
  for (let i = 0; i < QH.nodes.length; i++)
    for (let j = i + 1; j < QH.nodes.length; j++) {
      const A = QH.nodes[i], B = QH.nodes[j];
      if (QH.haversine(A, B) <= LORA_RANGE_KM) add(A.id, B.id, 'lora');
    }
  // curated backhaul
  BACKHAUL.forEach(([a, b]) => add(a, b, '5g'));
  return edges;
};

QH.edges = QH.buildEdges();

/* adjacency list (undirected) */
QH.adj = {};
QH.nodes.forEach(n => QH.adj[n.id] = []);
QH.edges.forEach((e, i) => {
  QH.adj[e.a].push({ to: e.b, ei: i });
  QH.adj[e.b].push({ to: e.a, ei: i });
});

/* --- Network statistics --------------------------------------------------- */
QH.stats = (function () {
  const V = QH.nodes.length, E = QH.edges.length;
  const maxE = V * (V - 1) / 2;
  const density = E / maxE;
  const degrees = QH.nodes.map(n => QH.adj[n.id].length);
  const avgDeg = degrees.reduce((a, b) => a + b, 0) / V;
  const totalKm = QH.edges.reduce((s, e) => s + e.km, 0);
  return {
    V, E, maxE,
    density: +density.toFixed(3),
    avgDeg: +avgDeg.toFixed(2),
    minDeg: Math.min(...degrees),
    maxDeg: Math.max(...degrees),
    totalKm: Math.round(totalKm),
    aqg: QH.nodes.filter(n => n.type === 'AQG').length,
    mems: QH.nodes.filter(n => n.type === 'MEMS').length,
  };
})();

/* --- Financials (EUR) — grounded in proposal + market research ----------- */
QH.budget = [
  { item:'Absolute Quantum Gravimeter (Exail AQG-B)', unit:150000, qty:18, note:'Volume price; €400k list' },
  { item:'MEMS relative gravimeter',                  unit:5000,   qty:7,  note:'1 Hz interpolation' },
  { item:'LoRaWAN gateway (Kerlink / Multitech)',     unit:2500,   qty:6,  note:'Private backhaul' },
  { item:'Sensor enclosure (IP67, solar + battery)',  unit:1200,   qty:25, note:'Field hardening' },
  { item:'5G router + SIM (annual, per site)',        unit:300,    qty:25, note:'Backhaul, yr 1' },
  { item:'Odra 5 quantum access (WCSS, academic)',    unit:0,      qty:1,  note:'Subsidised · 500 CPUh' },
  { item:'Installation, survey & mounting',           unit:5000,   qty:25, note:'Drilling, piers' },
  { item:'Graph dashboard, API & data platform',      unit:100000, qty:1,  note:'Software build' },
  { item:'Project management & contingency (15%)',    unit:451875, qty:1,  note:'15% of direct costs' },
];
QH.budgetTotal = QH.budget.reduce((s, r) => s + r.unit * r.qty, 0);

QH.market = {     // global transportable quantum gravimeter market (USD m)
  series: [
    { y:2024, v:73.1 }, { y:2025, v:79.8 }, { y:2026, v:87.2 },
    { y:2027, v:95.2 }, { y:2028, v:104.0 }, { y:2029, v:113.5 },
    { y:2030, v:124.0 }, { y:2031, v:135.4 },
  ],
  cagr: 9.2,
};

QH.revenue = [   // 5-year DaaS ramp (EUR, contracted)
  { y:'Y1', api:75000,  alerts:0,       label:'Pilot — LGOM' },
  { y:'Y2', api:175000, alerts:200000,  label:'KGHM + Wody Polskie' },
  { y:'Y3', api:300000, alerts:500000,  label:'Regional scale-up' },
  { y:'Y4', api:425000, alerts:900000,  label:'Insurance tier (PZU)' },
  { y:'Y5', api:550000, alerts:1400000, label:'EU export' },
];

/* TSP maintenance comparison (road km, technician calibration loop) */
QH.tsp = { classicalKm:900, classicalCost:4500, quantumKm:718, quantumCost:3600, perYear:4 };

window.QH = QH;
