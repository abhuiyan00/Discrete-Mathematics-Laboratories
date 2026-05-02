/* ============================================================
   TWEAKS — three expressive controls that reshape the lab's feel
   ============================================================ */
(function () {
  // Defaults persisted between sessions via the host.
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "cryo",
    "motion": "standard",
    "density": "standard"
  }/*EDITMODE-END*/;

  // ---------- Theme palettes ----------
  // Each theme rewrites the core CSS custom properties so panels, charts,
  // glows, electrons, the nucleus, overlays, everything follows along.
  const THEMES = {
    cryo: {
      label: 'Cryo',
      desc: 'Deep teal · violet plasma · midnight glass',
      vars: {
        '--bg':            '#050507',
        '--bg-2':          '#0a0a10',
        '--glass':         'rgba(20, 22, 30, 0.55)',
        '--glass-strong':  'rgba(18, 20, 28, 0.78)',
        '--stroke':        'rgba(255, 255, 255, 0.08)',
        '--stroke-strong': 'rgba(255, 255, 255, 0.16)',
        '--teal':          '#30d5c8',
        '--teal-2':        '#2cb8ad',
        '--teal-soft':     'rgba(48, 213, 200, 0.5)',
        '--teal-glow':     'rgba(48, 213, 200, 0.35)',
        '--violet':        '#9d7bff',
        '--amber':         '#f5a623',
        '--rose':          '#ff6a8a',
        '--text':          '#f4f5f7',
        '--text-dim':      'rgba(244, 245, 247, 0.65)',
        '--text-muted':    'rgba(244, 245, 247, 0.4)',
      },
      bgGlow: 'radial-gradient(900px 600px at 18% 12%, rgba(48,213,200,0.07), transparent 60%), radial-gradient(800px 600px at 82% 88%, rgba(157,123,255,0.06), transparent 60%)',
      gridDot: 'rgba(255,255,255,0.06)',
    },
    solar: {
      label: 'Solar',
      desc: 'Warm amber · ember rose · burnt-twilight',
      vars: {
        '--bg':            '#0e0805',
        '--bg-2':          '#160c08',
        '--glass':         'rgba(34, 22, 14, 0.55)',
        '--glass-strong':  'rgba(28, 18, 12, 0.80)',
        '--stroke':        'rgba(255, 220, 180, 0.10)',
        '--stroke-strong': 'rgba(255, 220, 180, 0.20)',
        '--teal':          '#f5a623',   /* amber as the primary accent */
        '--teal-2':        '#d68a10',
        '--teal-soft':     'rgba(245, 166, 35, 0.55)',
        '--teal-glow':     'rgba(245, 166, 35, 0.40)',
        '--violet':        '#ff6a8a',   /* rose as secondary */
        '--amber':         '#ffd76a',   /* highlight */
        '--rose':          '#ff8da3',
        '--text':          '#fff5e8',
        '--text-dim':      'rgba(255, 245, 232, 0.66)',
        '--text-muted':    'rgba(255, 245, 232, 0.42)',
      },
      bgGlow: 'radial-gradient(1100px 700px at 20% 10%, rgba(245,166,35,0.13), transparent 60%), radial-gradient(900px 700px at 85% 90%, rgba(255,106,138,0.10), transparent 60%)',
      gridDot: 'rgba(255,210,160,0.07)',
    },
    mono: {
      label: 'Paper',
      desc: 'Editorial monochrome · ink on paper-white',
      vars: {
        '--bg':            '#f4f1ea',
        '--bg-2':          '#ebe6db',
        '--glass':         'rgba(255, 253, 248, 0.78)',
        '--glass-strong':  'rgba(252, 250, 244, 0.92)',
        '--stroke':        'rgba(20, 18, 14, 0.12)',
        '--stroke-strong': 'rgba(20, 18, 14, 0.24)',
        '--teal':          '#1a1612',   /* ink */
        '--teal-2':        '#2a241e',
        '--teal-soft':     'rgba(26, 22, 18, 0.55)',
        '--teal-glow':     'rgba(26, 22, 18, 0.18)',
        '--violet':        '#7a4d2b',   /* sepia */
        '--amber':         '#a35a1f',
        '--rose':          '#9c2a3a',
        '--text':          '#1a1612',
        '--text-dim':      'rgba(26, 22, 18, 0.72)',
        '--text-muted':    'rgba(26, 22, 18, 0.48)',
      },
      bgGlow: 'radial-gradient(1000px 700px at 18% 10%, rgba(26,22,18,0.04), transparent 60%), radial-gradient(900px 700px at 85% 90%, rgba(122,77,43,0.04), transparent 60%)',
      gridDot: 'rgba(20,18,14,0.10)',
    },
  };

  // ---------- Motion presets ----------
  // Multiplies orbital periods. Lower = faster.
  const MOTION = {
    calm:     { label: 'Calm',     mult: 2.0,  pulseMult: 1.6 },
    standard: { label: 'Standard', mult: 1.0,  pulseMult: 1.0 },
    frantic:  { label: 'Frantic',  mult: 0.35, pulseMult: 0.45 },
  };

  // ---------- Density presets ----------
  // Scales padding and base font size — actual layout reflows.
  const DENSITY = {
    editorial: { label: 'Editorial', scale: 1.18, base: 16, gap: 1.25 },
    standard:  { label: 'Standard',  scale: 1.0,  base: 14.5, gap: 1.0 },
    compact:   { label: 'Compact',   scale: 0.85, base: 13, gap: 0.78 },
  };

  // ---------- Apply functions ----------
  function applyTheme(name) {
    const t = THEMES[name] || THEMES.cryo;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    // bg layers — re-style
    const grid = document.querySelector('.bg-grid');
    const glow = document.querySelector('.bg-glow');
    if (grid) grid.style.backgroundImage = `radial-gradient(${t.gridDot} 1px, transparent 1px)`;
    if (glow) glow.style.background = t.bgGlow;
    // Light-theme tweaks: invert a few things that read poorly on cream
    document.body.classList.toggle('theme-light', name === 'mono');
    document.body.dataset.theme = name;
  }

  function applyMotion(name) {
    const m = MOTION[name] || MOTION.standard;
    const root = document.documentElement;
    root.style.setProperty('--motion-mult', m.mult);
    root.style.setProperty('--pulse-mult', m.pulseMult);
    document.body.dataset.motion = name;
  }

  function applyDensity(name) {
    const d = DENSITY[name] || DENSITY.standard;
    const root = document.documentElement;
    root.style.setProperty('--density-scale', d.scale);
    root.style.setProperty('--density-gap', d.gap);
    root.style.fontSize = d.base + 'px';
    document.body.dataset.density = name;
  }

  function applyAll(state) {
    applyTheme(state.theme);
    applyMotion(state.motion);
    applyDensity(state.density);
  }

  // ---------- State + persistence ----------
  const state = Object.assign({}, TWEAK_DEFAULTS);
  applyAll(state);

  function setKey(key, val) {
    state[key] = val;
    applyAll(state);
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
    } catch (_) {}
    renderPanel();
  }

  // ---------- Panel UI ----------
  const panel = document.createElement('div');
  panel.id = 'tweaks-panel';
  panel.innerHTML = `
    <div class="tw-head">
      <div class="tw-title">
        <span class="tw-dot"></span>
        <span>Tweaks</span>
      </div>
      <button class="tw-close" aria-label="Close">✕</button>
    </div>
    <div class="tw-body" id="tw-body"></div>
    <div class="tw-foot">drag header · esc to close</div>
  `;
  document.body.appendChild(panel);

  function renderPanel() {
    const body = panel.querySelector('#tw-body');
    body.innerHTML = `
      <div class="tw-section">
        <div class="tw-label">Theme</div>
        <div class="tw-sub">Reshapes the entire palette</div>
        <div class="tw-radio">
          ${Object.entries(THEMES).map(([k, v]) => `
            <button class="tw-opt ${state.theme === k ? 'on' : ''}" data-tw-key="theme" data-tw-val="${k}">
              <span class="tw-swatch tw-swatch-${k}"></span>
              <span class="tw-opt-label">${v.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="tw-hint">${THEMES[state.theme].desc}</div>
      </div>

      <div class="tw-section">
        <div class="tw-label">Orbital Motion</div>
        <div class="tw-sub">Energy of the atom</div>
        <div class="tw-radio tw-radio-text">
          ${Object.entries(MOTION).map(([k, v]) => `
            <button class="tw-opt ${state.motion === k ? 'on' : ''}" data-tw-key="motion" data-tw-val="${k}">
              <span class="tw-opt-label">${v.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="tw-hint">Calm → contemplative · Frantic → manic</div>
      </div>

      <div class="tw-section">
        <div class="tw-label">Density</div>
        <div class="tw-sub">Air vs. dashboard</div>
        <div class="tw-radio tw-radio-text">
          ${Object.entries(DENSITY).map(([k, v]) => `
            <button class="tw-opt ${state.density === k ? 'on' : ''}" data-tw-key="density" data-tw-val="${k}">
              <span class="tw-opt-label">${v.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="tw-hint">Editorial breathes; Compact packs the lab</div>
      </div>
    `;
    body.querySelectorAll('[data-tw-key]').forEach(b => {
      b.addEventListener('click', () => setKey(b.dataset.twKey, b.dataset.twVal));
    });
  }
  renderPanel();

  // Show / hide protocol
  let visible = false;
  function show() { visible = true; panel.classList.add('open'); }
  function hide() {
    visible = false;
    panel.classList.remove('open');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (_) {}
  }
  // Listen FIRST, then announce.
  window.addEventListener('message', e => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') show();
    else if (d.type === '__deactivate_edit_mode') hide();
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (_) {}

  panel.querySelector('.tw-close').addEventListener('click', hide);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && visible) hide();
  });

  // Drag the panel by its header
  (function makeDraggable() {
    const head = panel.querySelector('.tw-head');
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    head.addEventListener('mousedown', e => {
      if (e.target.closest('.tw-close')) return;
      dragging = true;
      const r = panel.getBoundingClientRect();
      ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
      panel.style.left = ox + 'px'; panel.style.top = oy + 'px';
      document.body.style.userSelect = 'none';
    });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      panel.style.left = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, ox + e.clientX - sx)) + 'px';
      panel.style.top  = Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 8, oy + e.clientY - sy)) + 'px';
    });
    window.addEventListener('mouseup', () => { dragging = false; document.body.style.userSelect = ''; });
  })();
})();
