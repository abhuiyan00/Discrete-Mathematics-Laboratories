# Q-HYDRO WROCŁAW

**An interactive, graph-theory laboratory disguised as a public-sector funding proposal.**

A single-page web app that models a fictional (but geographically real) network of **25 quantum/MEMS gravimeter nodes** across Lower Silesia, Poland, and runs **seven classical graph algorithms live in the browser** over that network — discovery, backbone, weak-point analysis, routing, failure recovery, maintenance routing and planarity. Every headline figure on the page is **computed from the data, not hard-coded**.

Built as a Politechnika Wrocławska lab project (graph theory). The "quantum" framing is real: Poland's first superconducting quantum computer, **IQM "Odra 5"**, was installed at the Wrocław Centre for Networking and Supercomputing (WCSS) in May 2025.

---

## What it does

The network is a **weighted, undirected graph** `G = (V, E)`:

- **`V` = 25 nodes** — 1 Wrocław hub (WCSS / Odra 5) + 24 field sensors (17 AQG + 7 MEMS) at genuine Lower Silesian coordinates.
- **`E` = 43 edges** — LoRaWAN mesh links auto-generated wherever two nodes are within `LORA_RANGE_KM` (31 km), plus 4 curated 5G/fibre back-haul links.
- Each edge carries **km, latency (ms), energy, reliability** and a **composite cost `w`** used for routing and optimisation.

### The seven lenses (live algorithms)

| # | Lens | Algorithm | What it shows | Complexity |
|---|------|-----------|---------------|-----------|
| 1 | Discovery | **BFS** from hub | Hop-distance layers, discovery tree | `O(V+E)` |
| 2 | Backbone | **Prim MST** | Minimum-cost spanning tree (`n−1` edges, no cycles) | `O(V·E)` (didactic) |
| 3 | Weak points | **Tarjan** | Articulation points + bridges (single points of failure) | `O(V+E)` |
| 4 | Routing | **Dijkstra** to hub | Lowest-cost shortest-path tree; **click a node to re-route** | `O(V²)` (linear-scan) |
| 5 | Failure & Fix | Connectivity + greedy min-cost augmentation | **Click nodes to fail them** (stack many, incl. the hub); recommends the cheapest *set* of restoring links, flags structural cases | `O(V²)` greedy |
| 6 | Maintenance | **TSP** (nearest-neighbour + 2-opt) | Technician calibration loop; classical vs quantum-optimised | `O(n²)` |
| 7 | Layout | Planarity (Euler bound `E ≤ 3V−6`) | Trenching/crossing sanity check | `O(1)` |

> Note: Prim and Dijkstra use simple `O(V·E)` / `O(V²)` implementations for readability. At `|V| = 25` this is instant; swap in a binary heap for scale.

### Interactivity
- **Click any sensor** in the *Routing* lens to compute its path to the hub; in *Failure & Fix* to take it offline. **Stack multiple failures** (and even the hub) to compound the outage — the engine recomputes the cheapest multi-link repair, or flags a case that needs structural augmentation.
- **Click any inventory-table row** to fly to and pulse that node on the map.
- **Hover any node** to reveal its label in any lens.

---

## Run it

It's a static site — no build step.

**Simplest:** open `Q-HYDRO Wrocław.html` in a modern browser (needs internet — Leaflet, map tiles and fonts load from CDNs).

**Recommended (avoids any `file://` quirks):** serve the folder and open `http://localhost:8000`:

```bash
# from the project root
python -m http.server 8000
# or:  npx serve .
```

No dependencies are vendored; there is nothing to `npm install`.

---

## Project structure

```
.
├── Q-HYDRO Wrocław.html   # page shell, sections, inline figure-binding
├── css/
│   └── styles.css         # monochrome design system
└── js/
    ├── data.js            # nodes, edge construction, stats, finance  (the single source of truth)
    ├── graph-algorithms.js# pure graph functions (QG.*) — BFS, DFS, MST, Tarjan, Dijkstra, TSP, planarity
    ├── map.js             # Leaflet map console + the 7 animated lenses (QHMap.*)
    └── app.js             # nav, tables, SVG charts, scroll-spy, boot
```

**Design rule:** `data.js` is the only place numbers live. The HTML ships static fallbacks, but `app.js` overwrites every figure (`|E|`, density, mean degree, total km, articulation count, budget total, the ask) from the computed `QH.stats` / `QH.budgetTotal` on load. Change the data → the whole page re-derives.

---

## Accuracy & verification (June 2026)

Real-world claims were fact-checked against live sources:

-  **Odra 5** — IQM 5-qubit superconducting machine, WCSS / Wrocław University of Science and Technology, installed 22 May 2025; brings access to 20- and 50+-qubit IQM systems in Aalto, Finland. *(meetiqm.com, pwr.edu.pl)*
-  **Exail AQG** — rubidium absolute quantum gravimeter, **1 µGal** sensitivity/stability/repeatability, drift-free vs spring/MEMS. *(exail.com)*
-  **KGHM** (LGOM copper district), **Wody Polskie** (Odra basin authority), **Storm Boris** (Sept 2024 Odra floods), **PZU** (insurer) — all real and correctly used.
-  **Market** — internally consistent at **CAGR 9.2 %** (`$73.1M → $135.4M`, 2024–2031); sits within the range of published transportable-quantum-gravimeter estimates. *(QYResearch / Valuates)*

All graph metrics are recomputed in-browser, so they cannot drift from the data.

---

## Credits

Map © OpenStreetMap contributors, © CARTO · Leaflet 1.9.4 · IBM Plex (Google Fonts).
Politechnika Wrocławska — graph-theory lab. Figures are planning estimates for review.
