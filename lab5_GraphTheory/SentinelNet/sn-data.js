/* SentinelNet — dataset
 * 54 nodes, 95 edges across the Iberian peninsula.
 * Coordinates are real WGS84 lat/lon; SVG x,y are precomputed using an
 * equirectangular projection over bbox lat 36..44, lon -10..4 → 1000x800.
 * Sat ground stations outside the bbox (Maspalomas, Santa Maria) are
 * flagged off-map and drawn in a secondary panel by the UI.
 */
(function () {
  "use strict";

  // ---------- projection ----------
  const LAT_MAX = 44, LAT_MIN = 36, LON_MIN = -10, LON_MAX = 4;
  const W = 1000, H = 800;
  function proj(lat, lon) {
    return {
      x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W,
      y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H,
    };
  }

  // ---------- haversine (km) ----------
  function hav(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  // ---------- nodes (54) ----------
  const RAW_NODES = [
    // Air quality (19)
    { id: "aq-mad-retiro",       label: "Madrid – Retiro",                     type: "aq",      lat: 40.4144, lon: -3.6826, operator: "Ayto. Madrid / Red de Vigilancia", note: "Real reference urban-background station; ESxxxxA family." },
    { id: "aq-mad-escuelas",     label: "Madrid – Escuelas Aguirre",           type: "aq",      lat: 40.4214, lon: -3.6824, operator: "Ayto. Madrid", note: "Real traffic-influenced urban station." },
    { id: "aq-mad-vallecas",     label: "Madrid – Vallecas",                   type: "aq",      lat: 40.3881, lon: -3.6516, operator: "Ayto. Madrid", note: "Suburban background." },
    { id: "aq-mad-casacampo",    label: "Madrid – Casa de Campo",              type: "aq",      lat: 40.4192, lon: -3.7475, operator: "Ayto. Madrid", note: "Urban-background baseline." },
    { id: "aq-bcn-eixample",     label: "Barcelona – Eixample",                type: "aq",      lat: 41.3851, lon:  2.1538, operator: "Generalitat de Catalunya XVPCA", note: "Real high-NO2 station." },
    { id: "aq-bcn-graciasants",  label: "Barcelona – Gràcia/Sant Gervasi",     type: "aq",      lat: 41.4015, lon:  2.1531, operator: "XVPCA", note: "Background urban." },
    { id: "aq-bcn-portvell",     label: "Barcelona – Port Vell",               type: "aq",      lat: 41.3766, lon:  2.1820, operator: "Port Authority (synthetic)", note: "Synthetic but realistic — maritime AQ." },
    { id: "aq-sev-bermejales",   label: "Sevilla – Bermejales",                type: "aq",      lat: 37.3486, lon: -5.9758, operator: "Junta de Andalucía", note: "Real southern reference." },
    { id: "aq-sev-torneo",       label: "Sevilla – Torneo",                    type: "aq",      lat: 37.3962, lon: -5.9981, operator: "Junta de Andalucía", note: "Urban traffic." },
    { id: "aq-val-pista",        label: "Valencia – Pista Silla",              type: "aq",      lat: 39.4499, lon: -0.3763, operator: "Generalitat Valenciana", note: "Real heavy-traffic ref station." },
    { id: "aq-val-politecnic",   label: "Valencia – Politècnic",               type: "aq",      lat: 39.4824, lon: -0.3460, operator: "Generalitat Valenciana", note: "Campus-edge background." },
    { id: "aq-bil-mzklbi",       label: "Bilbao – María Díaz de Haro",         type: "aq",      lat: 43.2589, lon: -2.9461, operator: "Gobierno Vasco", note: "Real urban station, San Mamés area." },
    { id: "aq-zar-renovales",    label: "Zaragoza – Renovales",                type: "aq",      lat: 41.6488, lon: -0.8891, operator: "Ayto. Zaragoza", note: "Real reference urban-background." },
    { id: "aq-lis-avliberdade",  label: "Lisboa – Av. da Liberdade",           type: "aq",      lat: 38.7196, lon: -9.1452, operator: "APA", note: "Most-cited Portuguese urban traffic site." },
    { id: "aq-lis-olivais",      label: "Lisboa – Olivais",                    type: "aq",      lat: 38.7682, lon: -9.1083, operator: "APA", note: "Urban background." },
    { id: "aq-por-vermoim",      label: "Porto – Vermoim (Maia)",              type: "aq",      lat: 41.2308, lon: -8.6219, operator: "APA / CCDR-N", note: "Industrial-suburban ref." },
    { id: "aq-coi-instgeo",      label: "Coimbra – Inst. Geofísico",           type: "aq",      lat: 40.2056, lon: -8.4196, operator: "APA / Univ. Coimbra", note: "Mixed urban, co-located with met." },
    { id: "aq-mal-carranque",    label: "Málaga – Carranque",                  type: "aq",      lat: 36.7211, lon: -4.4434, operator: "Junta de Andalucía", note: "Real southern reference." },
    { id: "aq-val-rio",          label: "Valladolid – Vega Sicilia",           type: "aq",      lat: 41.6523, lon: -4.7245, operator: "JCyL Red Calidad Aire", note: "Real Castile-León urban site." },

    // Fire (10)
    { id: "fire-gredos-norte",      label: "Gredos North watchtower",        type: "fire",    lat: 40.2667, lon: -5.1333, operator: "JCyL Medio Ambiente", note: "Synthetic coords; real watchtower network." },
    { id: "fire-gredos-sur",        label: "Gredos South watchtower",        type: "fire",    lat: 40.2050, lon: -5.0500, operator: "JCyL Medio Ambiente", note: "Same network, southern slope." },
    { id: "fire-pyr-jaca",          label: "Pirineos – Jaca sector",         type: "fire",    lat: 42.5697, lon: -0.5495, operator: "Gobierno de Aragón", note: "Real wildfire-prone sector." },
    { id: "fire-pyr-bergueda",      label: "Pirineos – Berguedà",            type: "fire",    lat: 42.1500, lon:  1.8500, operator: "Generalitat (Bombers)", note: "Catalan firewatch network." },
    { id: "fire-ale-evora",         label: "Alentejo – Évora cell",          type: "fire",    lat: 38.5667, lon: -7.9000, operator: "ICNF / ANEPC", note: "Alentejo high-risk EFFIS cell." },
    { id: "fire-ale-castelobranco", label: "Alentejo – Castelo Branco",      type: "fire",    lat: 39.8222, lon: -7.4917, operator: "ICNF", note: "2017 Pedrógão Grande region." },
    { id: "fire-alg-monchique",     label: "Algarve – Monchique",            type: "fire",    lat: 37.3167, lon: -8.5500, operator: "ICNF", note: "2018 Monchique fire (~27,000 ha)." },
    { id: "fire-gal-ourense",       label: "Galicia – Ourense",              type: "fire",    lat: 42.3406, lon: -7.8636, operator: "Xunta de Galicia (PLADIGA)", note: "Real fire-watch district." },
    { id: "fire-clm-toledo",        label: "Castilla-La Mancha – Toledo",    type: "fire",    lat: 39.5667, lon: -4.3333, operator: "JCCM (INFOCAM)", note: "Real watchtower zone." },
    { id: "fire-clm-cuenca",        label: "Castilla-La Mancha – Cuenca",    type: "fire",    lat: 40.3000, lon: -1.9000, operator: "JCCM", note: "High-altitude pine forest." },

    // Weather (10)
    { id: "wx-mad-barajas",  label: "Madrid-Barajas (LEMD)",        type: "weather", lat: 40.4936, lon: -3.5668, operator: "AEMET", note: "ICAO LEMD, WMO 08221." },
    { id: "wx-bcn-elprat",   label: "Barcelona-El Prat (LEBL)",     type: "weather", lat: 41.2974, lon:  2.0833, operator: "AEMET", note: "ICAO LEBL, WMO 08181." },
    { id: "wx-sev-sanpablo", label: "Sevilla-San Pablo (LEZL)",     type: "weather", lat: 37.4180, lon: -5.8931, operator: "AEMET", note: "ICAO LEZL, WMO 08391." },
    { id: "wx-val-manises",  label: "Valencia-Manises (LEVC)",      type: "weather", lat: 39.4893, lon: -0.4816, operator: "AEMET", note: "ICAO LEVC, WMO 08284." },
    { id: "wx-bil-sondica",  label: "Bilbao-Sondika (LEBB)",        type: "weather", lat: 43.3011, lon: -2.9106, operator: "AEMET", note: "ICAO LEBB, WMO 08025." },
    { id: "wx-zar-aerop",    label: "Zaragoza-Aeropuerto (LEZG)",   type: "weather", lat: 41.6661, lon: -1.0415, operator: "AEMET", note: "ICAO LEZG, WMO 08160." },
    { id: "wx-lis-portela",  label: "Lisboa-Portela (LPPT)",        type: "weather", lat: 38.7813, lon: -9.1359, operator: "IPMA", note: "ICAO LPPT, WMO 08535." },
    { id: "wx-por-pedras",   label: "Porto-Pedras Rubras (LPPR)",   type: "weather", lat: 41.2481, lon: -8.6814, operator: "IPMA", note: "ICAO LPPR, WMO 08545." },
    { id: "wx-far-aerop",    label: "Faro Aeroporto (LPFR)",        type: "weather", lat: 37.0144, lon: -7.9659, operator: "IPMA", note: "ICAO LPFR, WMO 08554." },
    { id: "wx-cor-aerop",    label: "Coruña Alvedro (LECO)",        type: "weather", lat: 43.3022, lon: -8.3772, operator: "AEMET", note: "ICAO LECO, WMO 08001." },

    // Hydro (7)
    { id: "hy-ebro-zar",      label: "Ebro – Zaragoza gauge",     type: "hydro",   lat: 41.6500, lon: -0.8800, operator: "CHE / SAIH Ebro", note: "Real automatic level gauge." },
    { id: "hy-ebro-tortosa",  label: "Ebro – Tortosa",            type: "hydro",   lat: 40.8126, lon:  0.5216, operator: "CHE / SAIH Ebro", note: "Real downstream gauge." },
    { id: "hy-tajo-toledo",   label: "Tajo – Toledo",             type: "hydro",   lat: 39.8590, lon: -4.0245, operator: "CHT / SAIH Tajo", note: "Real urban gauge." },
    { id: "hy-tajo-alcantara",label: "Tajo – Alcántara",          type: "hydro",   lat: 39.7239, lon: -6.8929, operator: "CHT", note: "Major reservoir gauge." },
    { id: "hy-guad-sevilla",  label: "Guadalquivir – Sevilla",    type: "hydro",   lat: 37.3826, lon: -6.0024, operator: "CHG / SAIH", note: "Tidal-influenced gauge." },
    { id: "hy-doro-regua",    label: "Douro – Peso da Régua",     type: "hydro",   lat: 41.1622, lon: -7.7889, operator: "APA / SNIRH", note: "Real Portuguese gauge." },
    { id: "hy-guad-merida",   label: "Guadiana – Mérida",         type: "hydro",   lat: 38.9165, lon: -6.3438, operator: "CHGn / SAIH", note: "Real urban gauge." },

    // Gateway (5)
    { id: "gw-mad-espanix",   label: "Madrid – ESPANIX (Equinix MD2)", type: "gateway", lat: 40.4380, lon: -3.5908, operator: "ESPANIX / Equinix", note: "Real major IX." },
    { id: "gw-bcn-catnix",    label: "Barcelona – CATNIX (CESCA)",     type: "gateway", lat: 41.3886, lon:  2.1119, operator: "CESCA / CATNIX", note: "Real IX." },
    { id: "gw-bil-euskaltel", label: "Bilbao – Euskaltel PoP",         type: "gateway", lat: 43.2640, lon: -2.9350, operator: "Euskaltel / MásMóvil", note: "Real regional PoP." },
    { id: "gw-sev-tlf",       label: "Sevilla – Telefónica PoP",       type: "gateway", lat: 37.3826, lon: -5.9963, operator: "Telefónica España", note: "Regional aggregation." },
    { id: "gw-lis-amsix",     label: "Lisboa – AMS-IX Lisbon",         type: "gateway", lat: 38.7400, lon: -9.1500, operator: "AMS-IX", note: "Real IX in Equinix LS1." },

    // Satellite (3)
    { id: "sat-cebreros",    label: "Cebreros DSA-2 (Ávila)",       type: "sat", lat: 40.4527, lon: -4.3676, operator: "ESA ESTRACK", note: "Real 35-m deep-space dish." },
    { id: "sat-maspalomas",  label: "Maspalomas (Canarias)",        type: "sat", lat: 27.7629, lon: -15.6338, operator: "INTA / ESA", note: "Off-map: real EO ground station, Canary Islands." },
    { id: "sat-santamaria",  label: "Santa Maria (Açores)",         type: "sat", lat: 36.9714, lon: -25.1361, operator: "ESA / Edisoft", note: "Off-map: real ESTRACK Açores station." },
  ];

  // Precompute SVG (x,y) for every node so the map renderer stays simple.
  // Off-map nodes still get a projection — UI checks lat/lon bounds to draw them in the side panel.
  const NODES = RAW_NODES.map((n) => {
    const p = proj(n.lat, n.lon);
    return { ...n, x: p.x, y: p.y };
  });

  // ---------- edges (95) ----------
  const EDGES = [
    // LoRaWAN — sensor ↔ gateway (≤12 km)
    { source: "aq-mad-retiro",       target: "gw-mad-espanix",   type: "lora",      weight:  8, latency_ms: 500, capacity_mbps: 0.1 },
    { source: "aq-mad-escuelas",     target: "gw-mad-espanix",   type: "lora",      weight:  9, latency_ms: 500, capacity_mbps: 0.1 },
    { source: "aq-mad-vallecas",     target: "gw-mad-espanix",   type: "lora",      weight:  7, latency_ms: 500, capacity_mbps: 0.1 },
    { source: "aq-mad-casacampo",    target: "gw-mad-espanix",   type: "lora",      weight: 12, latency_ms: 600, capacity_mbps: 0.1 },
    { source: "aq-bcn-eixample",     target: "gw-bcn-catnix",    type: "lora",      weight:  4, latency_ms: 400, capacity_mbps: 0.1 },
    { source: "aq-bcn-graciasants",  target: "gw-bcn-catnix",    type: "lora",      weight:  4, latency_ms: 400, capacity_mbps: 0.1 },
    { source: "aq-bcn-portvell",     target: "gw-bcn-catnix",    type: "lora",      weight:  6, latency_ms: 500, capacity_mbps: 0.1 },
    { source: "aq-bil-mzklbi",       target: "gw-bil-euskaltel", type: "lora",      weight:  2, latency_ms: 300, capacity_mbps: 0.1 },
    { source: "aq-sev-bermejales",   target: "gw-sev-tlf",       type: "lora",      weight:  5, latency_ms: 400, capacity_mbps: 0.1 },
    { source: "aq-sev-torneo",       target: "gw-sev-tlf",       type: "lora",      weight:  1, latency_ms: 300, capacity_mbps: 0.1 },
    { source: "aq-lis-avliberdade",  target: "gw-lis-amsix",     type: "lora",      weight:  2, latency_ms: 300, capacity_mbps: 0.1 },
    { source: "aq-lis-olivais",      target: "gw-lis-amsix",     type: "lora",      weight:  5, latency_ms: 400, capacity_mbps: 0.1 },
    { source: "wx-mad-barajas",      target: "gw-mad-espanix",   type: "lora",      weight:  6, latency_ms: 400, capacity_mbps: 0.1 },
    { source: "wx-bcn-elprat",       target: "gw-bcn-catnix",    type: "lora",      weight: 11, latency_ms: 600, capacity_mbps: 0.1 },
    { source: "wx-bil-sondica",      target: "gw-bil-euskaltel", type: "lora",      weight:  5, latency_ms: 400, capacity_mbps: 0.1 },
    { source: "wx-lis-portela",      target: "gw-lis-amsix",     type: "lora",      weight:  5, latency_ms: 400, capacity_mbps: 0.1 },
    { source: "hy-guad-sevilla",     target: "gw-sev-tlf",       type: "lora",      weight:  4, latency_ms: 400, capacity_mbps: 0.1 },
    { source: "hy-ebro-zar",         target: "gw-mad-espanix",   type: "lora",      weight: 12, latency_ms: 800, capacity_mbps: 0.05 },

    // Cellular — sensor ↔ gateway (≤30 km)
    { source: "aq-zar-renovales",    target: "gw-mad-espanix",   type: "cellular",  weight: 29, latency_ms: 250, capacity_mbps: 0.5 },
    { source: "aq-val-pista",        target: "gw-bcn-catnix",    type: "cellular",  weight: 28, latency_ms: 250, capacity_mbps: 0.5 },
    { source: "aq-val-politecnic",   target: "gw-bcn-catnix",    type: "cellular",  weight: 28, latency_ms: 250, capacity_mbps: 0.5 },
    { source: "aq-mal-carranque",    target: "gw-sev-tlf",       type: "cellular",  weight: 25, latency_ms: 250, capacity_mbps: 0.5 },
    { source: "aq-val-rio",          target: "gw-mad-espanix",   type: "cellular",  weight: 25, latency_ms: 250, capacity_mbps: 0.5 },
    { source: "aq-coi-instgeo",      target: "gw-lis-amsix",     type: "cellular",  weight: 20, latency_ms: 250, capacity_mbps: 0.5 },
    { source: "aq-por-vermoim",      target: "gw-lis-amsix",     type: "cellular",  weight: 30, latency_ms: 300, capacity_mbps: 0.5 },
    { source: "wx-zar-aerop",        target: "gw-mad-espanix",   type: "cellular",  weight: 30, latency_ms: 300, capacity_mbps: 0.5 },
    { source: "wx-val-manises",      target: "gw-bcn-catnix",    type: "cellular",  weight: 28, latency_ms: 250, capacity_mbps: 0.5 },
    { source: "wx-sev-sanpablo",     target: "gw-sev-tlf",       type: "cellular",  weight: 10, latency_ms: 200, capacity_mbps: 0.5 },
    { source: "wx-por-pedras",       target: "gw-lis-amsix",     type: "cellular",  weight: 28, latency_ms: 250, capacity_mbps: 0.5 },
    { source: "wx-far-aerop",        target: "gw-lis-amsix",     type: "cellular",  weight: 28, latency_ms: 300, capacity_mbps: 0.5 },
    { source: "wx-cor-aerop",        target: "gw-lis-amsix",     type: "cellular",  weight: 30, latency_ms: 300, capacity_mbps: 0.5 },
    { source: "hy-ebro-tortosa",     target: "gw-bcn-catnix",    type: "cellular",  weight: 30, latency_ms: 300, capacity_mbps: 0.5 },
    { source: "hy-tajo-toledo",      target: "gw-mad-espanix",   type: "cellular",  weight: 30, latency_ms: 300, capacity_mbps: 0.5 },
    { source: "hy-doro-regua",       target: "gw-lis-amsix",     type: "cellular",  weight: 30, latency_ms: 300, capacity_mbps: 0.5 },
    { source: "hy-guad-merida",      target: "gw-sev-tlf",       type: "cellular",  weight: 30, latency_ms: 300, capacity_mbps: 0.5 },

    // Fiber backbone
    { source: "gw-mad-espanix", target: "gw-bcn-catnix",     type: "fiber", weight: 505, latency_ms:  8, capacity_mbps: 100000 },
    { source: "gw-mad-espanix", target: "gw-sev-tlf",        type: "fiber", weight: 391, latency_ms:  6, capacity_mbps: 100000 },
    { source: "gw-mad-espanix", target: "gw-bil-euskaltel",  type: "fiber", weight: 322, latency_ms:  5, capacity_mbps: 100000 },
    { source: "gw-mad-espanix", target: "gw-lis-amsix",      type: "fiber", weight: 502, latency_ms:  8, capacity_mbps: 100000 },
    { source: "gw-bcn-catnix",  target: "gw-bil-euskaltel",  type: "fiber", weight: 396, latency_ms:  6, capacity_mbps: 100000 },
    { source: "gw-sev-tlf",     target: "gw-lis-amsix",      type: "fiber", weight: 318, latency_ms:  5, capacity_mbps: 100000 },

    // Satellite uplinks
    { source: "fire-gredos-norte",      target: "sat-cebreros",   type: "satellite", weight:   73, latency_ms: 700, capacity_mbps:  5 },
    { source: "fire-gredos-sur",        target: "sat-cebreros",   type: "satellite", weight:   76, latency_ms: 700, capacity_mbps:  5 },
    { source: "fire-pyr-jaca",          target: "sat-cebreros",   type: "satellite", weight:  280, latency_ms: 750, capacity_mbps:  5 },
    { source: "fire-pyr-bergueda",      target: "sat-cebreros",   type: "satellite", weight:  545, latency_ms: 800, capacity_mbps:  5 },
    { source: "fire-ale-evora",         target: "sat-santamaria", type: "satellite", weight: 1660, latency_ms: 850, capacity_mbps:  5 },
    { source: "fire-ale-castelobranco", target: "sat-santamaria", type: "satellite", weight: 1690, latency_ms: 850, capacity_mbps:  5 },
    { source: "fire-alg-monchique",     target: "sat-santamaria", type: "satellite", weight: 1610, latency_ms: 850, capacity_mbps:  5 },
    { source: "fire-gal-ourense",       target: "sat-cebreros",   type: "satellite", weight:  367, latency_ms: 750, capacity_mbps:  5 },
    { source: "fire-clm-toledo",        target: "sat-cebreros",   type: "satellite", weight:   84, latency_ms: 700, capacity_mbps:  5 },
    { source: "fire-clm-cuenca",        target: "sat-cebreros",   type: "satellite", weight:  270, latency_ms: 750, capacity_mbps:  5 },
    { source: "hy-tajo-alcantara",      target: "sat-cebreros",   type: "satellite", weight:  277, latency_ms: 750, capacity_mbps:  5 },
    { source: "gw-mad-espanix",         target: "sat-maspalomas", type: "satellite", weight: 1773, latency_ms: 900, capacity_mbps: 50 },
    { source: "gw-lis-amsix",           target: "sat-santamaria", type: "satellite", weight: 1493, latency_ms: 850, capacity_mbps: 50 },
    { source: "sat-cebreros",           target: "gw-mad-espanix", type: "satellite", weight:   76, latency_ms: 700, capacity_mbps: 50 },

    // Mesh redundancy (sensor ↔ nearby sensor, ≤5 km)
    { source: "aq-mad-retiro",        target: "aq-mad-escuelas",      type: "mesh", weight: 1, latency_ms: 200, capacity_mbps: 0.05 },
    { source: "aq-mad-retiro",        target: "aq-mad-vallecas",      type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "aq-mad-escuelas",      target: "aq-mad-casacampo",     type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "aq-bcn-eixample",      target: "aq-bcn-graciasants",   type: "mesh", weight: 2, latency_ms: 300, capacity_mbps: 0.05 },
    { source: "aq-bcn-eixample",      target: "aq-bcn-portvell",      type: "mesh", weight: 3, latency_ms: 300, capacity_mbps: 0.05 },
    { source: "aq-sev-bermejales",    target: "aq-sev-torneo",        type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "aq-val-pista",         target: "aq-val-politecnic",    type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "aq-lis-avliberdade",   target: "aq-lis-olivais",       type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "wx-mad-barajas",       target: "aq-mad-escuelas",      type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "wx-bcn-elprat",        target: "aq-bcn-portvell",      type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "wx-sev-sanpablo",      target: "aq-sev-bermejales",    type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "wx-lis-portela",       target: "aq-lis-olivais",       type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "wx-bil-sondica",       target: "aq-bil-mzklbi",        type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "fire-clm-toledo",      target: "hy-tajo-toledo",       type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "fire-gredos-norte",    target: "fire-gredos-sur",      type: "mesh", weight: 4, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "fire-ale-evora",       target: "fire-ale-castelobranco", type: "mesh", weight: 4, latency_ms: 400, capacity_mbps: 0.05 },
    { source: "hy-ebro-zar",          target: "wx-zar-aerop",         type: "mesh", weight: 2, latency_ms: 200, capacity_mbps: 0.05 },
    { source: "hy-doro-regua",        target: "aq-por-vermoim",       type: "mesh", weight: 5, latency_ms: 400, capacity_mbps: 0.05 },

    // Densification (22) — second-nearest mesh + cross-region cellular redundancy
    { source: "aq-mad-vallecas",     target: "aq-mad-casacampo",     type: "mesh",     weight: 8,  latency_ms: 500, capacity_mbps: 0.05 },
    { source: "aq-bcn-graciasants",  target: "aq-bcn-portvell",      type: "mesh",     weight: 3,  latency_ms: 300, capacity_mbps: 0.05 },
    { source: "wx-mad-barajas",      target: "aq-mad-retiro",        type: "mesh",     weight: 9,  latency_ms: 500, capacity_mbps: 0.05 },
    { source: "wx-bcn-elprat",       target: "aq-bcn-eixample",      type: "mesh",     weight: 11, latency_ms: 600, capacity_mbps: 0.05 },
    { source: "wx-sev-sanpablo",     target: "aq-sev-torneo",        type: "mesh",     weight: 9,  latency_ms: 500, capacity_mbps: 0.05 },
    { source: "wx-lis-portela",      target: "aq-lis-avliberdade",   type: "mesh",     weight: 7,  latency_ms: 500, capacity_mbps: 0.05 },
    { source: "wx-por-pedras",       target: "aq-por-vermoim",       type: "mesh",     weight: 4,  latency_ms: 400, capacity_mbps: 0.05 },
    { source: "hy-guad-sevilla",     target: "aq-sev-bermejales",    type: "mesh",     weight: 4,  latency_ms: 400, capacity_mbps: 0.05 },
    // (duplicate hy-tajo-toledo↔fire-clm-toledo removed — already present in mesh section above)
    { source: "fire-pyr-jaca",       target: "hy-ebro-tortosa",      type: "cellular", weight: 225, latency_ms: 430, capacity_mbps: 0.3 },
    // (duplicate aq-mad-vallecas↔aq-mad-casacampo removed — already present at weight 8)
    { source: "wx-mad-barajas",      target: "wx-bcn-elprat",        type: "cellular", weight: 489, latency_ms: 600, capacity_mbps: 0.3 },
    { source: "fire-gredos-norte",   target: "fire-clm-toledo",      type: "cellular", weight: 102, latency_ms: 350, capacity_mbps: 0.3 },
    { source: "fire-pyr-jaca",       target: "fire-pyr-bergueda",    type: "cellular", weight: 195, latency_ms: 400, capacity_mbps: 0.3 },
    { source: "fire-clm-cuenca",     target: "fire-clm-toledo",      type: "cellular", weight: 215, latency_ms: 420, capacity_mbps: 0.3 },
    // (duplicate fire-ale-evora↔fire-ale-castelobranco cellular removed — mesh edge already exists)
    { source: "fire-gal-ourense",    target: "hy-doro-regua",        type: "cellular", weight: 131, latency_ms: 360, capacity_mbps: 0.3 },
    { source: "fire-alg-monchique",  target: "fire-ale-evora",       type: "cellular", weight: 188, latency_ms: 400, capacity_mbps: 0.3 },
    { source: "fire-gal-ourense",    target: "aq-por-vermoim",       type: "cellular", weight: 138, latency_ms: 360, capacity_mbps: 0.3 },
    { source: "hy-tajo-alcantara",   target: "hy-tajo-toledo",       type: "cellular", weight: 273, latency_ms: 500, capacity_mbps: 0.3 },
    { source: "hy-ebro-tortosa",     target: "aq-val-politecnic",    type: "cellular", weight: 159, latency_ms: 380, capacity_mbps: 0.3 },
    { source: "hy-doro-regua",       target: "aq-coi-instgeo",       type: "cellular", weight: 137, latency_ms: 360, capacity_mbps: 0.3 },
    { source: "hy-guad-merida",      target: "hy-tajo-alcantara",    type: "cellular", weight: 92,  latency_ms: 350, capacity_mbps: 0.3 },
    { source: "gw-sev-tlf",          target: "gw-bcn-catnix",        type: "fiber",    weight: 826, latency_ms: 13,  capacity_mbps: 100000 },
    { source: "gw-bil-euskaltel",    target: "gw-lis-amsix",         type: "fiber",    weight: 803, latency_ms: 13,  capacity_mbps: 100000 },
  ];

  // ---------- color / label maps ----------
  window.SN_NODE_COLORS = {
    aq: "#5EB1D6", fire: "#E0664F", weather: "#A687C9",
    hydro: "#4FC3B4", gateway: "#E0AC4C", sat: "#D9728C"
  };
  window.SN_NODE_TYPE_LABELS = {
    aq: "Air-quality station", fire: "Forest-fire detection",
    weather: "Weather observation", hydro: "Hydrological gauge",
    gateway: "Backbone gateway / IX", sat: "Satellite ground station",
  };
  window.SN_EDGE_COLORS = {
    lora: "#7FB069", cellular: "#5EB1D6", fiber: "#E0AC4C",
    satellite: "#D9728C", mesh: "#A687C9"
  };
  window.SN_EDGE_TYPE_LABELS = {
    lora: "LoRaWAN", cellular: "NB-IoT / LTE-M",
    fiber: "Fiber backbone", satellite: "Satellite uplink", mesh: "Mesh redundancy"
  };

  // ---------- references ----------
  window.SN_REFERENCES = [
    // Air quality
    { key: "openaq",      title: "OpenAQ — open air-quality data platform",                                                   url: "https://openaq.org",                                                                                              org: "OpenAQ Inc.",                          year: "2026", note: "Source for station IDs and AQ measurements.", group: "Air quality" },
    { key: "eea-air",     title: "European Environment Agency — Air quality data",                                            url: "https://www.eea.europa.eu/themes/air",                                                                            org: "EEA",                                  year: "2026", note: "EU-wide AQ regulatory data.", group: "Air quality" },
    { key: "ee-areport",  title: "EEA AQ e-Reporting station registry",                                                       url: "https://www.eea.europa.eu/en/datahub/datahubitem-view/fbf3717c-cb7a-4ccd-be15-ce5d605d3744",                       org: "EEA",                                  year: "2026", note: "Source for ESxxxxA codes.", group: "Air quality" },
    { key: "miteco-air",  title: "MITECO — calidad del aire (Spain)",                                                         url: "https://www.miteco.gob.es/es/calidad-y-evaluacion-ambiental/temas/atmosfera-y-calidad-del-aire/calidad-del-aire/evaluacion-datos/datos/Default.aspx", org: "Gobierno de España (MITECO)",          year: "2026", note: "Spanish national AQ data registry.", group: "Air quality" },
    { key: "apa-qualar",  title: "QualAr — Portuguese AQ portal",                                                             url: "https://qualar.apambiente.pt",                                                                                    org: "APA",                                  year: "2026", note: "Portuguese AQ measurements.", group: "Air quality" },
    { key: "xvpca",       title: "XVPCA — Generalitat de Catalunya",                                                          url: "https://mediambient.gencat.cat/",                                                                                 org: "Generalitat de Catalunya",             year: "2026", note: "Catalan AQ network.", group: "Air quality" },
    { key: "andalucia",   title: "Junta de Andalucía — Red de Vigilancia",                                                    url: "https://www.juntadeandalucia.es/medioambiente/portal/landing-page/-/asset_publisher/0e8KUutwsTNh/content/red-de-vigilancia-y-control-de-la-calidad-del-ambiente-atmosfrico-de-andaluc-1", org: "Junta de Andalucía", year: "2026", note: "Andalusian AQ network.", group: "Air quality" },
    { key: "euskadi-air", title: "Euskadi — Red Calidad del Aire",                                                            url: "https://www.euskadi.eus/calidad-aire/",                                                                           org: "Gobierno Vasco",                       year: "2026", note: "Basque AQ network.", group: "Air quality" },
    { key: "jcyl-med",    title: "JCyL — Medio Ambiente",                                                                     url: "https://medioambiente.jcyl.es/",                                                                                  org: "Junta de Castilla y León",             year: "2026", note: "Castile-León AQ + fire-watch.", group: "Air quality" },
    // Fire
    { key: "effis",       title: "EFFIS — European Forest Fire Information System",                                           url: "https://effis.jrc.ec.europa.eu/",                                                                                 org: "JRC / EU Copernicus EMS",              year: "2026", note: "EU fire hotspot detection.", group: "Fire" },
    { key: "effis-data",  title: "EFFIS data & services",                                                                     url: "https://effis.jrc.ec.europa.eu/applications/data-and-services",                                                   org: "JRC",                                  year: "2026", note: "Annual burned-area statistics.", group: "Fire" },
    { key: "icnf",        title: "ICNF — Instituto da Conservação da Natureza e das Florestas",                               url: "https://www.icnf.pt",                                                                                             org: "ICNF (Portugal)",                      year: "2026", note: "Portuguese fire authority.", group: "Fire" },
    { key: "miteco-fire", title: "MITECO — incendios forestales",                                                             url: "https://www.miteco.gob.es/es/biodiversidad/temas/incendios-forestales.html",                                       org: "MITECO",                               year: "2026", note: "Spanish fire statistics.", group: "Fire" },
    { key: "pladiga",     title: "Xunta de Galicia — PLADIGA",                                                                url: "https://mediorural.xunta.gal/es/temas/forestal/incendios-forestales",                                              org: "Xunta de Galicia",                     year: "2026", note: "Galicia fire plan.", group: "Fire" },
    { key: "bombers",     title: "Bombers — Generalitat de Catalunya",                                                        url: "https://bombers.gencat.cat",                                                                                      org: "Generalitat de Catalunya",             year: "2026", note: "Catalan firefighters.", group: "Fire" },
    { key: "infocam",     title: "Castilla-La Mancha — Plan INFOCAM",                                                         url: "https://www.castillalamancha.es/gobierno/agriaguaydesarrollorural",                                                org: "JCCM",                                 year: "2026", note: "INFOCAM fire plan.", group: "Fire" },
    // Weather
    { key: "aemet",       title: "AEMET — Spanish State Meteorological Agency",                                               url: "https://www.aemet.es/en",                                                                                         org: "AEMET",                                year: "2026", note: "Synoptic stations with ICAO/WMO codes.", group: "Weather" },
    { key: "ipma",        title: "IPMA — Portuguese Sea and Atmosphere Institute",                                            url: "https://www.ipma.pt/en/",                                                                                         org: "IPMA",                                 year: "2026", note: "Portuguese weather observations.", group: "Weather" },
    // Hydro
    { key: "saih-ebro",   title: "SAIH Ebro — Confederación Hidrográfica del Ebro",                                           url: "https://www.saihebro.com",                                                                                        org: "CHE",                                  year: "2026", note: "Real-time hydro gauges, Ebro basin.", group: "Hydro" },
    { key: "saih-tajo",   title: "SAIH Tajo",                                                                                 url: "https://saihtajo.chtajo.es",                                                                                      org: "CHT",                                  year: "2026", note: "Real-time hydro gauges, Tajo basin.", group: "Hydro" },
    { key: "ch-guad",     title: "Confederación Hidrográfica del Guadalquivir",                                               url: "https://www.chguadalquivir.es",                                                                                   org: "CHG",                                  year: "2026", note: "Guadalquivir basin.", group: "Hydro" },
    { key: "ch-guadn",    title: "Confederación Hidrográfica del Guadiana",                                                   url: "https://www.chguadiana.es",                                                                                       org: "CHGn",                                 year: "2026", note: "Guadiana basin.", group: "Hydro" },
    { key: "snirh",       title: "SNIRH — Portuguese hydrological information",                                               url: "https://snirh.apambiente.pt",                                                                                     org: "APA",                                  year: "2026", note: "Portuguese hydro gauges.", group: "Hydro" },
    { key: "saih-min",    title: "MITECO — SAIH overview",                                                                    url: "https://www.miteco.gob.es/es/agua/temas/evaluacion-de-los-recursos-hidricos/saih/",                                org: "MITECO",                               year: "2026", note: "National SAIH framework.", group: "Hydro" },
    // Satellite / Copernicus
    { key: "copernicus",  title: "Copernicus programme",                                                                      url: "https://www.copernicus.eu/en",                                                                                    org: "EU / ESA",                             year: "2026", note: "EU earth observation programme.", group: "Satellite / Copernicus" },
    { key: "cop-budget",  title: "Copernicus — financing",                                                                    url: "https://www.copernicus.eu/en/about-copernicus/financing",                                                         org: "EU",                                   year: "2026", note: "2021-2027 budget €5.421B.", group: "Satellite / Copernicus" },
    { key: "cems",        title: "Copernicus Emergency Management Service",                                                   url: "https://emergency.copernicus.eu/",                                                                                org: "EU / JRC",                             year: "2026", note: "Emergency mapping service.", group: "Satellite / Copernicus" },
    { key: "estrack",     title: "ESA ESTRACK ground-station network",                                                        url: "https://www.esa.int/Enabling_Support/Operations/ESTRACK",                                                         org: "ESA",                                  year: "2026", note: "Ground-station tariff & overview.", group: "Satellite / Copernicus" },
    { key: "cebreros",    title: "ESA Cebreros DSA-2",                                                                        url: "https://www.esa.int/Enabling_Support/Operations/ESA_Ground_Stations/Cebreros_-_DSA_2",                             org: "ESA",                                  year: "2026", note: "35-m deep-space dish, Ávila.", group: "Satellite / Copernicus" },
    // Telecom / standards
    { key: "lora",        title: "LoRa Alliance — What is LoRaWAN",                                                           url: "https://lora-alliance.org/resource_hub/what-is-lorawan/",                                                         org: "LoRa Alliance",                        year: "2026", note: "LoRaWAN spec + range.", group: "Telecom & standards" },
    { key: "kerlink",     title: "Kerlink Wirnet iStation",                                                                   url: "https://www.kerlink.com/product/wirnet-istation/",                                                                org: "Kerlink",                              year: "2026", note: "Reference LoRaWAN gateway.", group: "Telecom & standards" },
    { key: "multitech",   title: "MultiTech Conduit AP",                                                                      url: "https://www.multitech.com/brands/multiconnect-conduit-ap",                                                        org: "MultiTech",                            year: "2026", note: "Indoor mid-tier gateway.", group: "Telecom & standards" },
    { key: "cisco",       title: "Cisco LoRaWAN IXM module",                                                                  url: "https://www.cisco.com/c/en/us/products/routers/wireless-gateway-iot-extension-module-lorawan/index.html",         org: "Cisco",                                year: "2026", note: "Carrier-grade outdoor gateway.", group: "Telecom & standards" },
    { key: "libelium",    title: "Libelium Plug & Sense",                                                                     url: "https://www.libelium.com/iot-products/plug-sense/",                                                               org: "Libelium",                             year: "2026", note: "Low-cost AQ sensor.", group: "Telecom & standards" },
    { key: "ftth",        title: "FTTH Council Europe — publications",                                                        url: "https://www.ftthcouncil.eu/knowledge-centre/all-publications-and-assets",                                         org: "FTTH Council EU",                      year: "2026", note: "Fiber deployment cost.", group: "Telecom & standards" },
    { key: "3gpp-nbiot",  title: "3GPP — NB-IoT",                                                                             url: "https://www.3gpp.org/technologies/nb-iot",                                                                        org: "3GPP",                                 year: "2026", note: "NB-IoT cell radius spec.", group: "Telecom & standards" },
    { key: "espanix",     title: "ESPANIX",                                                                                   url: "https://www.espanix.net",                                                                                         org: "ESPANIX",                              year: "2026", note: "Madrid Internet Exchange.", group: "Telecom & standards" },
    { key: "catnix",      title: "CATNIX",                                                                                    url: "https://www.catnix.net",                                                                                          org: "CESCA",                                year: "2026", note: "Barcelona IX.", group: "Telecom & standards" },
    { key: "amsix-lis",   title: "AMS-IX Lisbon",                                                                             url: "https://www.ams-ix.net/ams/locations/ams-ix-lisbon",                                                              org: "AMS-IX",                               year: "2026", note: "Lisbon IX.", group: "Telecom & standards" },
    // EU regulation
    { key: "aq-dir",      title: "Directive 2008/50/EC — Ambient Air Quality",                                                url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32008L0050",                                          org: "European Parliament",                  year: "2008", note: "Defines reference methods + data-quality objectives.", group: "EU regulation" },
    // Academic
    { key: "diestel",     title: "Diestel, R. — Graph Theory (5th ed.)",                                                      url: "https://link.springer.com/book/10.1007/978-3-662-53622-3",                                                        org: "Springer",                             year: "2017", note: "Reference textbook for definitions used.", group: "Academic" },
    { key: "clrs",        title: "Cormen, Leiserson, Rivest, Stein — Introduction to Algorithms (4th ed.)",                   url: "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/",                                              org: "MIT Press",                            year: "2022", note: "Algorithmic complexity references.", group: "Academic" },
    { key: "tarjan72",    title: "Tarjan, R. E. — Depth-first search and linear graph algorithms",                            url: "https://epubs.siam.org/doi/10.1137/0201010",                                                                       org: "SIAM J. Comput.",                      year: "1972", note: "Bridge / articulation-point algorithm.", group: "Academic" },
    { key: "christofides", title: "Christofides, N. — Worst-case analysis of a new heuristic for TSP",                        url: "https://www.dtic.mil/sti/citations/ADA025602",                                                                    org: "CMU report",                           year: "1976", note: "1.5-approximation for metric TSP.", group: "Academic" },
  ];

  window.SN_COSTS = [
    { key: "lora-gw",       label: "LoRaWAN gateway (Kerlink Wirnet iStation)",            value: 1200,           unit: "€/unit",       source: "kerlink",     dataYear: 2024 },
    { key: "lora-gw-mt",    label: "LoRaWAN gateway (MultiTech Conduit AP)",               value: 700,            unit: "€/unit",       source: "multitech",   dataYear: 2024 },
    { key: "lora-gw-cisco", label: "LoRaWAN gateway (Cisco IXM)",                          value: 4000,           unit: "€/unit",       source: "cisco",       dataYear: 2024 },
    { key: "aq-ref",        label: "Reference-grade AQ station (EN 14211 compliant)",     value: 185000,         unit: "€/station",    source: "eea-air",     dataYear: 2022 },
    { key: "aq-low",        label: "Low-cost AQ node (Libelium class)",                    value: 4750,           unit: "€/station",    source: "libelium",    dataYear: 2023 },
    { key: "aq-maint",      label: "Annual maintenance per reference AQ station",          value: 14000,          unit: "€/yr",         source: "eea-air",     dataYear: 2022 },
    { key: "fire-ha",       label: "Direct cost of forest fire (Spain, average)",          value: 19000,          unit: "€/ha",         source: "miteco-fire", dataYear: 2022 },
    { key: "iberia-area",   label: "Burned area Spain + Portugal (2022)",                  value: 420000,         unit: "ha",           source: "effis-data",  dataYear: 2022 },
    { key: "pedrogao",      label: "Pedrógão Grande (June 2017) total losses",             value: 500000000,      unit: "€",            source: "icnf",        dataYear: 2017 },
    { key: "ftth-rural",    label: "FTTH deployment cost — rural greenfield",              value: 20000,          unit: "€/km",         source: "ftth",        dataYear: 2023 },
    { key: "ftth-urban",    label: "FTTH deployment cost — urban",                         value: 8500,           unit: "€/km",         source: "ftth",        dataYear: 2023 },
    { key: "estrack",       label: "ESA ESTRACK commercial S/X-band contact",              value: 2000,           unit: "€/h",          source: "estrack",     dataYear: 2023 },
    { key: "cop-budget",    label: "EU Copernicus 2021-2027 budget",                       value: 5421000000,     unit: "€ (7-yr)",     source: "cop-budget",  dataYear: 2021 },
    { key: "cems-yr",       label: "Copernicus Emergency Management Service annual cost",  value: 30000000,       unit: "€/yr",         source: "cems",        dataYear: 2022 },
  ];

  // expose
  window.SN_NODES = NODES;
  window.SN_EDGES = EDGES;
  window.SN_PROJECTION = { LAT_MAX, LAT_MIN, LON_MIN, LON_MAX, W, H, proj };
  window.SN_HAVERSINE = hav;
  window.SN_REFERENCES_VERIFIED = "2026-05-24"; // last URL spot-check date
})();
