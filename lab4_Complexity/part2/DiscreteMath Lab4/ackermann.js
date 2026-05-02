/* ============================================================
   ACKERMANN — full module with heatmap, charts, expansion trace
   ============================================================ */
(function () {
  // Direct cached compute
  const cache = new Map();
  function ack(m, n) {
    if (m === 0) return n + 1;
    const k = m + ',' + n;
    if (cache.has(k)) return cache.get(k);
    let v;
    if (n === 0) v = ack(m - 1, 1);
    else v = ack(m - 1, ack(m, n - 1));
    cache.set(k, v);
    return v;
  }
  // Closed-form fast paths for safe display of larger values
  function ackFast(m, n) {
    if (m === 0) return n + 1;
    if (m === 1) return n + 2;
    if (m === 2) return 2 * n + 3;
    if (m === 3) return Math.pow(2, n + 3) - 3;
    if (m === 4 && n === 0) return 13;
    if (m === 4 && n === 1) return 65533;
    return null;
  }
  function ackDisplay(m, n) {
    const f = ackFast(m, n);
    if (f !== null && Number.isFinite(f) && f < 1e15) return f.toLocaleString();
    if (m === 4 && n === 1) return '65,533';
    if (m === 4 && n === 2) return '2^65,536 − 3  (~10^19,728)';
    if (m === 4 && n >= 3) return 'unimaginable';
    if (m >= 5) return 'unimaginable';
    if (m === 3) return `2^${n + 3} − 3 = ${(Math.pow(2, n + 3) - 3).toLocaleString()}`;
    return ack(m, n).toLocaleString();
  }

  // Recursive call counter (no memo)
  function countCalls(m, n, budget = 200000) {
    let c = 0; let exceeded = false;
    function go(m, n) {
      c++;
      if (c > budget) { exceeded = true; return 0; }
      if (exceeded) return 0;
      if (m === 0) return n + 1;
      if (n === 0) return go(m - 1, 1);
      return go(m - 1, go(m, n - 1));
    }
    try { go(m, n); } catch (e) { exceeded = true; }
    return { count: c, exceeded };
  }

  /* ----- Step-by-step expansion trace ----- */
  function buildTrace(m0, n0, maxSteps) {
    const root = ['A', m0, n0];
    const steps = [format(root)];
    let safety = 0;
    while (safety++ < maxSteps) {
      const r = reduce(root);
      if (!r) break;
      steps.push(format(root));
      if (root[0] === 'LIT') break;
    }
    let final = null;
    if (root[0] === 'LIT') final = root[1];
    else final = ack(m0, n0);
    return { steps, final, capped: safety >= maxSteps && root[0] !== 'LIT' };
  }
  function reduce(node) {
    if (node[0] !== 'A') return false;
    if (Array.isArray(node[2]) && node[2][0] === 'A') {
      if (reduce(node[2])) return true;
    }
    if (Array.isArray(node[1]) && node[1][0] === 'A') {
      if (reduce(node[1])) return true;
    }
    if (Array.isArray(node[1]) && node[1][0] === 'LIT') node[1] = node[1][1];
    if (Array.isArray(node[2]) && node[2][0] === 'LIT') node[2] = node[2][1];
    if (typeof node[1] !== 'number' || typeof node[2] !== 'number') return false;
    const m = node[1], n = node[2];
    if (m === 0) { node[0] = 'LIT'; node[1] = n + 1; node.length = 2; return true; }
    if (n === 0) { node[0] = 'A'; node[1] = m - 1; node[2] = 1; return true; }
    node[0] = 'A'; node[1] = m - 1; node[2] = ['A', m, n - 1];
    return true;
  }
  function format(node) {
    if (typeof node === 'number') return String(node);
    if (!Array.isArray(node)) return String(node);
    if (node[0] === 'LIT') return String(node[1]);
    return `A(${format(node[1])}, ${format(node[2])})`;
  }

  /* ----- Heatmap (m=0..4, n=0..7) ----- */
  function buildHeatmap(selM, selN) {
    const cont = document.getElementById('ack-heatmap');
    const M = 5, N = 8;
    cont.style.setProperty('--cols', N);
    let html = '<div class="hcell head">m\\n</div>';
    for (let n = 0; n < N; n++) html += `<div class="hcell head">${n}</div>`;
    for (let m = 0; m < M; m++) {
      html += `<div class="hcell row-head">${m}</div>`;
      for (let n = 0; n < N; n++) {
        const f = ackFast(m, n);
        let label, huge = false;
        if (f !== null && Number.isFinite(f) && f < 1e9) label = f.toLocaleString();
        else if (m === 4 && n === 1) { label = '65,533'; }
        else if (m === 4 && n === 2) { label = '2^65536−3'; huge = true; }
        else if (m === 4 && n >= 3) { label = '∞·∞'; huge = true; }
        else if (f !== null && Number.isFinite(f)) { label = f.toExponential(1); }
        else { label = '—'; }
        // color by log10
        let bg = 'rgba(48,213,200,0.06)';
        let logVal = (typeof f === 'number' && f > 0 && Number.isFinite(f)) ? Math.log10(f) : (m === 4 && n >= 1 ? 6 + n * 5 : 0);
        const t = Math.min(1, logVal / 12);
        bg = `rgba(48,213,200,${0.05 + t * 0.45})`;
        if (m === 4 && n >= 2) bg = `rgba(255,106,138,${0.15 + Math.min(1, n / 5) * 0.5})`;
        const sel = (m === selM && n === selN) ? 'sel' : '';
        html += `<div class="hcell ${sel} ${huge ? 'huge' : ''}" style="background:${bg};">${label}</div>`;
      }
    }
    cont.innerHTML = html;
  }

  /* ----- Growth chart (log of A(m,n) per row) ----- */
  function drawGrowth() {
    const svg = document.getElementById('ack-growth');
    const W = 560, H = 230, pad = { l: 50, r: 14, t: 14, b: 30 };
    const colors = ['#30d5c8', '#9d7bff', '#f5a623', '#ff6a8a', '#5dd5a4'];
    const Nmax = 7;
    const series = [];
    for (let m = 0; m <= 3; m++) {
      const pts = [];
      for (let n = 0; n <= Nmax; n++) {
        const v = ackFast(m, n);
        if (v !== null && Number.isFinite(v) && v > 0) pts.push({ n, log: Math.log10(v) });
      }
      series.push({ m, pts });
    }
    // m=4 (only n=0,1 finite)
    series.push({ m: 4, pts: [{ n: 0, log: Math.log10(13) }, { n: 1, log: Math.log10(65533) }, { n: 2, log: 19728 }] });
    const allLogs = series.flatMap(s => s.pts.map(p => p.log));
    const yMax = Math.min(Math.max(...allLogs), 200);
    const yMin = 0;
    const sx = x => pad.l + (x / Nmax) * (W - pad.l - pad.r);
    const sy = y => pad.t + (1 - Math.min(y, yMax) / yMax) * (H - pad.t - pad.b);

    let grid = '';
    [0, 5, 10, 50, 100, 200].forEach(v => {
      if (v > yMax) return;
      const y = sy(v);
      grid += `<line class="gridline" x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}"/>`;
      grid += `<text class="axis" x="${pad.l - 6}" y="${y + 3}" text-anchor="end">10^${v}</text>`;
    });
    let xticks = '';
    for (let v = 0; v <= Nmax; v++) xticks += `<text class="axis" x="${sx(v)}" y="${H - pad.b + 14}" text-anchor="middle">${v}</text>`;
    let lines = '';
    series.forEach((s, i) => {
      let path = '';
      s.pts.forEach((p, j) => path += (j === 0 ? 'M' : 'L') + sx(p.n) + ',' + sy(p.log));
      lines += `<path d="${path}" fill="none" stroke="${colors[i]}" stroke-width="2" />`;
      // dots
      s.pts.forEach(p => lines += `<circle cx="${sx(p.n)}" cy="${sy(p.log)}" r="3" fill="${colors[i]}"/>`);
    });
    let legend = '';
    series.forEach((s, i) => {
      const x = pad.l + i * 70 + 4;
      legend += `<line x1="${x}" x2="${x + 14}" y1="${pad.t + 8}" y2="${pad.t + 8}" stroke="${colors[i]}" stroke-width="2"/>`;
      legend += `<text class="legend" x="${x + 18}" y="${pad.t + 11}">m=${s.m}</text>`;
    });

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <g class="axis">
        ${grid}
        <line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/>
        <line x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${H - pad.b}"/>
        ${xticks}
      </g>
      <text class="label-x" x="${(W) / 2}" y="${H - 4}" text-anchor="middle">n</text>
      <text class="label-y" x="14" y="${pad.t + 8}">log₁₀ A(m,n)</text>
      ${lines}
      ${legend}
    `;
  }

  /* ----- Calls chart ----- */
  function drawCalls() {
    const svg = document.getElementById('ack-calls');
    const W = 560, H = 200, pad = { l: 56, r: 14, t: 14, b: 30 };
    const points = [];
    // m=2: linear-ish; m=3: exponential
    for (let m = 0; m <= 3; m++) {
      for (let n = 0; n <= (m === 3 ? 4 : 6); n++) {
        const r = countCalls(m, n, 200000);
        if (!r.exceeded) points.push({ m, n, c: r.count });
      }
    }
    const xMax = 6, yMax = Math.log10(Math.max(...points.map(p => p.c)) * 1.5);
    const sx = x => pad.l + (x / xMax) * (W - pad.l - pad.r);
    const sy = y => pad.t + (1 - Math.log10(y) / yMax) * (H - pad.t - pad.b);
    const colors = ['#30d5c8', '#9d7bff', '#f5a623', '#ff6a8a'];
    let grid = '';
    [1, 10, 100, 1000, 10000, 100000].forEach(v => {
      if (Math.log10(v) > yMax) return;
      const y = sy(v);
      grid += `<line class="gridline" x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}"/>`;
      grid += `<text class="axis" x="${pad.l - 6}" y="${y + 3}" text-anchor="end">${v.toLocaleString()}</text>`;
    });
    let xticks = '';
    for (let v = 0; v <= 6; v++) xticks += `<text class="axis" x="${sx(v)}" y="${H - pad.b + 14}" text-anchor="middle">${v}</text>`;
    let series = '';
    [0, 1, 2, 3].forEach(m => {
      const pts = points.filter(p => p.m === m);
      let path = '';
      pts.forEach((p, i) => path += (i === 0 ? 'M' : 'L') + sx(p.n) + ',' + sy(p.c));
      series += `<path d="${path}" fill="none" stroke="${colors[m]}" stroke-width="2" />`;
      pts.forEach(p => series += `<circle cx="${sx(p.n)}" cy="${sy(p.c)}" r="3" fill="${colors[m]}"/>`);
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <g class="axis">
        ${grid}
        <line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/>
        <line x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${H - pad.b}"/>
        ${xticks}
      </g>
      <text class="label-x" x="${W / 2}" y="${H - 4}" text-anchor="middle">n</text>
      <text class="label-y" x="14" y="${pad.t + 8}">recursive calls</text>
      ${series}
    `;
  }

  /* ----- Inverse Ackermann row ----- */
  function refreshInverse() {
    const cont = document.getElementById('ack-inverse');
    const rows = [
      ['1', '0'], ['2', '1'], ['4', '2'], ['16', '3'],
      ['65,536', '4'], ['2^65,536 ≈ A(4,2)', '5'], ['A(5,5)', '6']
    ];
    cont.innerHTML = '<thead><tr><th>n</th><th>α(n)</th></tr></thead><tbody>' +
      rows.map(r => `<tr><td>${r[0]}</td><td style="color:var(--teal); font-weight:600;">${r[1]}</td></tr>`).join('') +
      '</tbody>';
  }

  /* ----- State + UI wiring ----- */
  let m = 2, n = 3;
  let trace = []; let traceIdx = 0; let traceFinal = null; let timer = null;
  const $ = id => document.getElementById(id);

  function refreshInputs() {
    $('ack-m').textContent = m;
    $('ack-n').textContent = n;
    buildHeatmap(m, n);
    // Closed form & fact
    const closed = ['n + 1', 'n + 2', '2n + 3', '2^(n+3) − 3', 'tetration ²^(n+3)', 'pentation'][m] || '—';
    $('ack-closed').textContent = closed;
    $('ack-display').textContent = ackDisplay(m, n);
    const r = (m <= 3 && !(m === 3 && n > 6)) ? countCalls(m, n) : null;
    $('ack-callcount').textContent = r ? (r.exceeded ? '> 200,000' : r.count.toLocaleString()) : '—';
    $('ack-row').textContent = ['Successor', 'Addition', 'Multiplication', 'Exponentiation', 'Tetration', 'Pentation'][m] || '—';
  }

  function visualize() {
    if (timer) { clearInterval(timer); timer = null; }
    $('ack-tree').innerHTML = '';
    $('ack-step-info').textContent = 'Computing trace…';
    $('ack-result-wrap').style.display = 'none';

    if (m === 3 && n > 4) {
      $('ack-tree').innerHTML = '<div class="tree-line" style="color:#f5a623;">A(3, ≥5) generates tens of thousands of expansion steps. Reduce n or use the Heatmap to see the value.</div>';
      $('ack-result-wrap').style.display = '';
      $('ack-result').textContent = ackDisplay(m, n);
      return;
    }
    if (m >= 4) {
      $('ack-tree').innerHTML = '<div class="tree-line" style="color:#ff6a8a;">A(4, n) cannot be expanded by recursion in any reasonable time. See the closed form panel.</div>';
      $('ack-result-wrap').style.display = '';
      $('ack-result').textContent = ackDisplay(m, n);
      return;
    }
    const t = buildTrace(m, n, 1500);
    trace = t.steps; traceIdx = 0; traceFinal = t.final;
    $('ack-step-info').textContent = `${trace.length} expansion step(s). Auto-playing — press Step or Pause to control.`;
    appendLine(trace[0], 'current'); traceIdx = 1;
    timer = setInterval(() => {
      if (traceIdx >= trace.length) {
        clearInterval(timer); timer = null;
        const lines = $('ack-tree').querySelectorAll('.tree-line');
        if (lines.length) {
          lines.forEach(l => l.classList.remove('current'));
          lines[lines.length - 1].classList.add('computed');
        }
        $('ack-result').textContent = traceFinal.toLocaleString();
        $('ack-result-wrap').style.display = '';
        $('ack-step-info').textContent = `${trace.length} steps complete · final = ${traceFinal.toLocaleString()}`;
        return;
      }
      $('ack-tree').querySelectorAll('.tree-line.current').forEach(l => l.classList.remove('current'));
      appendLine(trace[traceIdx], 'current');
      $('ack-tree').scrollTop = $('ack-tree').scrollHeight;
      traceIdx++;
    }, 180);
  }
  function appendLine(text, cls = '') {
    const div = document.createElement('div');
    div.className = `tree-line ${cls}`;
    const depth = Math.min((text.match(/A\(/g) || []).length, 12);
    div.style.paddingLeft = (depth * 5) + 'px';
    div.textContent = text;
    $('ack-tree').appendChild(div);
  }

  document.querySelectorAll('[data-ack-m]').forEach(b => b.addEventListener('click', () => {
    m = Math.max(0, Math.min(4, m + Number(b.dataset.ackM))); refreshInputs();
  }));
  document.querySelectorAll('[data-ack-n]').forEach(b => b.addEventListener('click', () => {
    n = Math.max(0, Math.min(7, n + Number(b.dataset.ackN))); refreshInputs();
  }));
  $('ack-visualize').addEventListener('click', visualize);
  $('ack-pause').addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; $('ack-step-info').textContent = `Paused at step ${traceIdx}/${trace.length}`; }
  });
  $('ack-step').addEventListener('click', () => {
    if (!trace.length) {
      if (m >= 4 || (m === 3 && n > 4)) { visualize(); return; }
      const t = buildTrace(m, n, 1500); trace = t.steps; traceFinal = t.final; traceIdx = 0;
      $('ack-tree').innerHTML = '';
    }
    if (timer) { clearInterval(timer); timer = null; }
    if (traceIdx >= trace.length) return;
    $('ack-tree').querySelectorAll('.tree-line.current').forEach(l => l.classList.remove('current'));
    appendLine(trace[traceIdx], traceIdx === trace.length - 1 ? 'computed' : 'current');
    $('ack-tree').scrollTop = $('ack-tree').scrollHeight;
    traceIdx++;
    $('ack-step-info').textContent = `Step ${traceIdx} / ${trace.length}`;
    if (traceIdx === trace.length) {
      $('ack-result').textContent = traceFinal.toLocaleString();
      $('ack-result-wrap').style.display = '';
    }
  });
  $('ack-reset').addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; }
    trace = []; traceIdx = 0; traceFinal = null;
    $('ack-tree').innerHTML = '<div class="tree-line" style="color: var(--text-muted);">Press <code style="color:var(--teal)">Visualize</code> to expand the recursion tree.</div>';
    $('ack-step-info').textContent = '';
    $('ack-result-wrap').style.display = 'none';
  });

  refreshInputs();
  drawGrowth();
  drawCalls();
  refreshInverse();
})();
