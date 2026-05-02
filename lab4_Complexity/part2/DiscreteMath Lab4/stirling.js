/* ============================================================
   STIRLING — full lab module
   ============================================================ */
(function () {
  // S(n,k) recursion + cache
  const cache = new Map();
  function S(n, k) {
    if (k === 0) return n === 0 ? 1 : 0;
    if (k > n) return 0;
    if (k === n) return 1;
    if (k === 1) return 1;
    const key = n + ',' + k;
    if (cache.has(key)) return cache.get(key);
    const v = k * S(n - 1, k) + S(n - 1, k - 1);
    cache.set(key, v);
    return v;
  }

  // exact log factorial via cumulative log sum (avoids BigInt for small n; for big n we use log gamma series)
  function logFact(n) {
    if (n < 2) return 0;
    let s = 0;
    for (let i = 2; i <= n; i++) s += Math.log(i);
    return s;
  }
  // Stirling log: n ln n - n + 0.5 ln(2πn)
  function stirlingLog(n) {
    if (n === 0) return 0;
    return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n);
  }
  // Ramanujan log approximation
  function ramanujanLog(n) {
    if (n === 0) return 0;
    return n * Math.log(n) - n + Math.log(Math.PI) / 2 +
           Math.log(8 * n * n * n + 4 * n * n + n + 1 / 30) / 6;
  }
  // Stirling series with 1/(12n) correction
  function stirlingSeriesLog(n) {
    if (n === 0) return 0;
    return stirlingLog(n) + 1 / (12 * n) - 1 / (360 * n * n * n);
  }

  function fmtBig(logV) {
    if (logV < 30) return Math.exp(logV).toLocaleString(undefined, { maximumFractionDigits: 2 });
    const log10 = logV / Math.LN10;
    const exp = Math.floor(log10);
    const mant = Math.pow(10, log10 - exp);
    return `${mant.toFixed(4)} × 10^${exp}`;
  }

  let stirN = 5, stirK = 2, factN = 10;
  const $ = id => document.getElementById(id);

  function refreshTriangle() {
    $('stir-n').textContent = stirN;
    $('stir-k').textContent = stirK;
    $('stir-result').textContent = S(stirN, stirK).toLocaleString();

    const N = Math.max(stirN, 8);
    let html = '<thead><tr><th>n \\ k</th>';
    for (let k = 0; k <= N; k++) html += `<th>${k}</th>`;
    html += '</tr></thead><tbody>';
    for (let n = 0; n <= N; n++) {
      html += `<tr><th>${n}</th>`;
      for (let k = 0; k <= N; k++) {
        const v = S(n, k);
        const cls = (n === stirN && k === stirK) ? 'highlight' : (v === 0 ? 'zero' : '');
        html += `<td class="${cls}">${v.toLocaleString()}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    $('stir-table').innerHTML = html;

    // Bell number row
    let bell = 0;
    for (let k = 0; k <= stirN; k++) bell += S(stirN, k);
    $('stir-bell').textContent = bell.toLocaleString();
    $('stir-rowsum-n').textContent = stirN;

    // Partition viz
    const parts = $('stir-partitions');
    parts.innerHTML = '';
    if (stirN <= 5) {
      const ps = enumeratePartitions(stirN, stirK);
      ps.forEach(p => {
        const div = document.createElement('div');
        div.className = 'partition';
        p.forEach(block => {
          const b = document.createElement('div');
          b.className = 'part-block';
          block.forEach(() => {
            const d = document.createElement('div'); d.className = 'dot-el'; b.appendChild(d);
          });
          div.appendChild(b);
        });
        parts.appendChild(div);
      });
    } else {
      parts.innerHTML = '<div style="font-size:11.5px; color:var(--text-muted); padding: 6px;">Partition view limited to n ≤ 5 for visual clarity.</div>';
    }
  }

  function enumeratePartitions(n, k) {
    const result = [], blocks = [];
    function rec(i) {
      if (i === n) {
        if (blocks.length === k) result.push(blocks.map(b => b.slice()));
        return;
      }
      for (let b = 0; b < blocks.length; b++) {
        blocks[b].push(i); rec(i + 1); blocks[b].pop();
      }
      if (blocks.length < k) {
        blocks.push([i]); rec(i + 1); blocks.pop();
      }
    }
    rec(0);
    return result;
  }

  function refreshFactorial() {
    $('fact-n').textContent = factN;
    const exact = logFact(factN);
    const stir  = stirlingLog(factN);
    const ram   = ramanujanLog(factN);
    const ser   = stirlingSeriesLog(factN);

    $('fact-exact').textContent = fmtBig(exact);
    $('fact-stirling').textContent = fmtBig(stir);
    $('fact-ram').textContent = fmtBig(ram);
    $('fact-series').textContent = fmtBig(ser);

    const errStir = exact === 0 ? 0 : Math.abs(exact - stir) / Math.abs(exact) * 100;
    const errRam  = exact === 0 ? 0 : Math.abs(exact - ram) / Math.abs(exact) * 100;
    const errSer  = exact === 0 ? 0 : Math.abs(exact - ser) / Math.abs(exact) * 100;
    $('fact-err-stirling').textContent = errStir.toFixed(4) + '%';
    $('fact-err-ram').textContent = errRam.toFixed(6) + '%';
    $('fact-err-series').textContent = errSer.toFixed(6) + '%';

    // Ratio
    const ratio = Math.exp(exact - stir);
    $('fact-ratio').textContent = ratio.toFixed(8);
    drawErrorChart();
  }

  /* ----- SVG charts (matplotlib-style) ----- */
  function drawErrorChart() {
    const svg = $('chart-error');
    const W = 560, H = 220, pad = { l: 50, r: 14, t: 14, b: 30 };
    const data = [];
    for (let n = 1; n <= 60; n++) {
      const e = logFact(n);
      const s = stirlingLog(n);
      const err = Math.abs(e - s) / Math.abs(Math.max(e, 1e-9)) * 100;
      data.push({ n, err: err || 0.0001 });
    }
    const xs = data.map(d => d.n);
    const ys = data.map(d => Math.max(d.err, 1e-4));
    const xMin = 1, xMax = 60;
    const yMax = Math.log10(Math.max(...ys) * 1.2);
    const yMin = Math.log10(Math.min(...ys) * 0.8);
    const sx = x => pad.l + (x - xMin) / (xMax - xMin) * (W - pad.l - pad.r);
    const sy = y => pad.t + (1 - (Math.log10(y) - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);

    let path = '';
    data.forEach((d, i) => path += (i === 0 ? 'M' : 'L') + sx(d.n) + ',' + sy(d.err));

    // gridlines
    let grid = '';
    for (let p = Math.ceil(yMin); p <= Math.floor(yMax); p++) {
      const y = sy(Math.pow(10, p));
      grid += `<line class="gridline" x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}"/>`;
      grid += `<text class="axis" x="${pad.l - 6}" y="${y + 3}" text-anchor="end">10^${p}%</text>`;
    }
    let xticks = '';
    for (let v = 10; v <= 60; v += 10) {
      xticks += `<text class="axis" x="${sx(v)}" y="${H - pad.b + 14}" text-anchor="middle">${v}</text>`;
    }

    // highlight current factN
    const hx = factN <= 60 ? sx(Math.max(1, Math.min(60, factN))) : -1000;

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <g class="axis">
        ${grid}
        <line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/>
        <line x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${H - pad.b}"/>
        ${xticks}
      </g>
      <text class="label-x" x="${(W) / 2}" y="${H - 4}" text-anchor="middle">n</text>
      <text class="label-y" x="14" y="${pad.t + 8}" >% error (log)</text>
      <line x1="${hx}" x2="${hx}" y1="${pad.t}" y2="${H - pad.b}" stroke="${'rgba(245,166,35,0.5)'}" stroke-dasharray="3 3"/>
      <path d="${path}" fill="none" stroke="var(--teal)" stroke-width="2" />
      <circle cx="${hx}" cy="${sy(Math.abs(logFact(factN) - stirlingLog(factN)) / Math.abs(Math.max(logFact(factN),1e-9)) * 100 || 1e-4)}" r="4" fill="var(--amber)"/>
    `;
  }

  function drawGrowthChart() {
    const svg = $('chart-growth');
    const W = 560, H = 220, pad = { l: 60, r: 14, t: 14, b: 30 };
    const data = [];
    for (let n = 1; n <= 30; n++) data.push({ n, ln: logFact(n), st: stirlingLog(n) });
    const xMin = 1, xMax = 30;
    const yMax = Math.max(...data.map(d => d.ln)) * 1.05;
    const yMin = 0;
    const sx = x => pad.l + (x - xMin) / (xMax - xMin) * (W - pad.l - pad.r);
    const sy = y => pad.t + (1 - (y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);

    let p1 = '', p2 = '';
    data.forEach((d, i) => {
      p1 += (i === 0 ? 'M' : 'L') + sx(d.n) + ',' + sy(d.ln);
      p2 += (i === 0 ? 'M' : 'L') + sx(d.n) + ',' + sy(d.st);
    });
    let grid = '';
    for (let v = 0; v <= yMax; v += 20) {
      const y = sy(v);
      grid += `<line class="gridline" x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}"/>`;
      grid += `<text class="axis" x="${pad.l - 6}" y="${y + 3}" text-anchor="end">${v}</text>`;
    }
    let xticks = '';
    for (let v = 5; v <= 30; v += 5) {
      xticks += `<text class="axis" x="${sx(v)}" y="${H - pad.b + 14}" text-anchor="middle">${v}</text>`;
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <g class="axis">
        ${grid}
        <line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/>
        <line x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${H - pad.b}"/>
        ${xticks}
      </g>
      <text class="label-x" x="${(W) / 2}" y="${H - 4}" text-anchor="middle">n</text>
      <text class="label-y" x="14" y="${pad.t + 8}">ln(n!)</text>
      <path d="${p1}" fill="none" stroke="var(--teal)" stroke-width="2" />
      <path d="${p2}" fill="none" stroke="var(--violet)" stroke-width="2" stroke-dasharray="4 3" />
      <g class="legend">
        <rect x="${W - 160}" y="${pad.t + 4}" width="${146}" height="38" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)" rx="6"/>
        <line x1="${W - 150}" x2="${W - 130}" y1="${pad.t + 16}" y2="${pad.t + 16}" stroke="var(--teal)" stroke-width="2"/>
        <text x="${W - 124}" y="${pad.t + 19}">exact ln(n!)</text>
        <line x1="${W - 150}" x2="${W - 130}" y1="${pad.t + 32}" y2="${pad.t + 32}" stroke="var(--violet)" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="${W - 124}" y="${pad.t + 35}">Stirling</text>
      </g>
    `;
  }

  // Wire up controls
  document.querySelectorAll('[data-stir-n]').forEach(b => b.addEventListener('click', () => {
    stirN = Math.max(1, Math.min(10, stirN + Number(b.dataset.stirN)));
    if (stirK > stirN) stirK = stirN;
    refreshTriangle();
  }));
  document.querySelectorAll('[data-stir-k]').forEach(b => b.addEventListener('click', () => {
    stirK = Math.max(1, Math.min(stirN, stirK + Number(b.dataset.stirK)));
    refreshTriangle();
  }));
  document.querySelectorAll('[data-fact-n]').forEach(b => b.addEventListener('click', () => {
    const d = Number(b.dataset.factN);
    const step = Math.abs(d) === 1 ? 1 : 5;
    factN = Math.max(1, Math.min(170, factN + Math.sign(d) * step));
    refreshFactorial();
  }));

  refreshTriangle();
  refreshFactorial();
  drawGrowthChart();
})();
