/* ============================================================
   NIM — full module with 4 variants + 3 difficulties
   ============================================================ */
(function () {
  // Variants
  const VARIANTS = {
    classic: {
      name: 'Classic Nim',
      desc: 'Take from any heap — last to take WINS.',
      multiHeap: true, hasMaxTake: false,
      defaultPiles: [3, 4, 5],
      lastWins: true,
      // Optimal: nim-sum
      optimal(piles, _maxTake) {
        const xor = piles.reduce((a, b) => a ^ b, 0);
        if (xor === 0) return null;
        for (let i = 0; i < piles.length; i++) {
          const t = piles[i] ^ xor;
          if (t < piles[i]) return [i, piles[i] - t];
        }
        return null;
      },
      validMoves(piles, _maxTake) {
        const out = [];
        piles.forEach((h, i) => { for (let a = 1; a <= h; a++) out.push([i, a]); });
        return out;
      }
    },
    misere: {
      name: 'Misère Nim',
      desc: 'Take from any heap — last to take LOSES.',
      multiHeap: true, hasMaxTake: false,
      defaultPiles: [3, 4, 5],
      lastWins: false,
      optimal(piles) {
        if (piles.every(h => h <= 1)) {
          // endgame: take from any heap with 1
          for (let i = 0; i < piles.length; i++) if (piles[i] === 1) return [i, 1];
          return null;
        }
        const xor = piles.reduce((a, b) => a ^ b, 0);
        if (xor === 0) {
          // losing — random fallback handled later
          return null;
        }
        for (let i = 0; i < piles.length; i++) {
          const t = piles[i] ^ xor;
          if (t < piles[i]) {
            const amount = piles[i] - t;
            const next = piles.slice(); next[i] = t;
            // Endgame parity correction: if move leaves all heaps ≤ 1, ensure odd 1s
            if (next.every(x => x <= 1)) {
              const ones = next.filter(x => x === 1).length;
              if (ones % 2 === 0) {
                // take entire heap to flip parity
                return [i, piles[i]];
              }
            }
            return [i, amount];
          }
        }
        return null;
      },
      validMoves(piles) {
        const out = [];
        piles.forEach((h, i) => { for (let a = 1; a <= h; a++) out.push([i, a]); });
        return out;
      }
    },
    single: {
      name: 'Single-Pile Nim',
      desc: 'One heap — take 1 to K per turn. Last to take WINS.',
      multiHeap: false, hasMaxTake: true,
      defaultPiles: [21], defaultMax: 3,
      lastWins: true,
      optimal(piles, K) {
        const p = piles[0]; if (p === 0) return null;
        const M = K + 1;
        const r = p % M;
        if (r === 0) return [0, 1];
        return [0, Math.min(r, K)];
      },
      validMoves(piles, K) {
        const p = piles[0];
        const out = []; for (let a = 1; a <= Math.min(K, p); a++) out.push([0, a]);
        return out;
      }
    },
    bounded: {
      name: 'Bounded Nim',
      desc: 'Multi-heap, take at most K per turn. Last to take WINS.',
      multiHeap: true, hasMaxTake: true,
      defaultPiles: [3, 4, 5], defaultMax: 3,
      lastWins: true,
      optimal(piles, K) {
        const M = K + 1;
        let g = 0; piles.forEach(h => g ^= (h % M));
        if (g === 0) return null;
        for (let i = 0; i < piles.length; i++) {
          const gi = piles[i] % M;
          const t = gi ^ g;
          if (t < gi) {
            const amount = gi - t;
            if (amount >= 1 && amount <= Math.min(K, piles[i])) return [i, amount];
          }
        }
        return null;
      },
      validMoves(piles, K) {
        const out = [];
        piles.forEach((h, i) => { for (let a = 1; a <= Math.min(K, h); a++) out.push([i, a]); });
        return out;
      }
    },
  };

  const DIFFICULTY = { Easy: 0.08, Medium: 0.55, Hard: 0.99 };

  const state = {
    variantKey: 'classic',
    difficulty: 'Hard',
    initial: [3, 4, 5],
    maxTake: 3,
    piles: [3, 4, 5],
    selected: -1,
    take: 1,
    turn: 'you',
    ended: false,
    score: { you: 0, ai: 0 },
    log: [],
  };

  const $ = id => document.getElementById(id);

  function variant() { return VARIANTS[state.variantKey]; }

  function buildVariantCards() {
    const cont = $('nim-variants');
    cont.innerHTML = '';
    Object.entries(VARIANTS).forEach(([key, v]) => {
      const div = document.createElement('div');
      div.className = 'variant-card' + (key === state.variantKey ? ' active' : '');
      div.innerHTML = `<div class="vname">${v.name}</div><div class="vdesc">${v.desc}</div>`;
      div.addEventListener('click', () => {
        state.variantKey = key;
        const v2 = VARIANTS[key];
        state.initial = v2.defaultPiles.slice();
        state.maxTake = v2.defaultMax || 3;
        resetGame();
        buildVariantCards();
        buildConfig();
      });
      cont.appendChild(div);
    });
  }

  function buildDifficulty() {
    const cont = $('nim-difficulty');
    cont.innerHTML = '';
    Object.keys(DIFFICULTY).forEach(d => {
      const b = document.createElement('button');
      b.textContent = d;
      if (d === state.difficulty) b.classList.add('active');
      b.addEventListener('click', () => {
        state.difficulty = d;
        buildDifficulty();
      });
      cont.appendChild(b);
    });
  }

  function buildConfig() {
    const v = variant();
    const cont = $('nim-config');
    let html = '';
    if (v.multiHeap) {
      // up to 5 piles configurable
      const numHeaps = state.initial.length;
      html += `<div class="row" style="gap:8px;">`;
      for (let i = 0; i < numHeaps; i++) {
        html += `
          <div class="input-group">
            <label>P${i + 1}</label>
            <div class="stepper">
              <button data-cfg-pile="${i},-1">−</button>
              <div class="val">${state.initial[i]}</div>
              <button data-cfg-pile="${i},1">+</button>
            </div>
          </div>`;
      }
      html += `</div>
        <div class="row" style="margin-top:10px;">
          <button class="btn ghost sm" id="cfg-add-heap" ${numHeaps >= 5 ? 'disabled' : ''}>+ Heap</button>
          <button class="btn ghost sm" id="cfg-rm-heap" ${numHeaps <= 2 ? 'disabled' : ''}>− Heap</button>
        </div>`;
    } else {
      html += `<div class="input-group">
        <label>Stones</label>
        <div class="stepper">
          <button data-cfg-pile="0,-1">−</button>
          <div class="val">${state.initial[0]}</div>
          <button data-cfg-pile="0,1">+</button>
        </div>
      </div>`;
    }
    if (v.hasMaxTake) {
      html += `<div class="input-group" style="margin-top:10px;">
        <label>K (max take)</label>
        <div class="stepper">
          <button data-cfg-max="-1">−</button>
          <div class="val">${state.maxTake}</div>
          <button data-cfg-max="1">+</button>
        </div>
      </div>`;
    }
    html += `<div class="row" style="margin-top:12px;">
      <button class="btn" id="cfg-apply">Apply &amp; Restart</button>
      <button class="btn ghost" id="cfg-preset-37">Preset 3-5-7</button>
      <button class="btn ghost" id="cfg-preset-13579" ${!v.multiHeap ? 'disabled' : ''}>Preset 1-3-5-7-9</button>
    </div>`;
    cont.innerHTML = html;

    cont.querySelectorAll('[data-cfg-pile]').forEach(b => b.addEventListener('click', () => {
      const [i, d] = b.dataset.cfgPile.split(',').map(Number);
      const max = v.multiHeap ? 9 : 50;
      state.initial[i] = Math.max(1, Math.min(max, state.initial[i] + d));
      buildConfig();
    }));
    cont.querySelectorAll('[data-cfg-max]').forEach(b => b.addEventListener('click', () => {
      state.maxTake = Math.max(1, Math.min(9, state.maxTake + Number(b.dataset.cfgMax)));
      buildConfig();
    }));
    const addH = $('cfg-add-heap'); if (addH) addH.addEventListener('click', () => {
      if (state.initial.length < 5) { state.initial.push(3); buildConfig(); }
    });
    const rmH = $('cfg-rm-heap'); if (rmH) rmH.addEventListener('click', () => {
      if (state.initial.length > 2) { state.initial.pop(); buildConfig(); }
    });
    $('cfg-apply').addEventListener('click', resetGame);
    $('cfg-preset-37').addEventListener('click', () => {
      state.initial = v.multiHeap ? [3, 5, 7] : [21];
      buildConfig();
      resetGame();
    });
    const p2 = $('cfg-preset-13579'); if (p2) p2.addEventListener('click', () => {
      if (v.multiHeap) { state.initial = [1, 3, 5, 7, 9]; buildConfig(); resetGame(); }
    });
  }

  function nimSum(piles) { return piles.reduce((a, b) => a ^ b, 0); }

  function render() {
    const v = variant();
    // Board
    const board = $('nim-board');
    board.innerHTML = '';
    state.piles.forEach((count, idx) => {
      const pile = document.createElement('div');
      pile.className = 'pile';
      if (idx === state.selected) pile.classList.add('selected');
      if (count === 0) pile.classList.add('disabled');
      pile.innerHTML = `
        <div class="pile-stones">${'<div class="stone"></div>'.repeat(count)}</div>
        <div class="pile-label">P${idx + 1}</div>
        <div class="pile-count">${count}</div>
      `;
      pile.addEventListener('click', () => {
        if (state.ended || state.turn !== 'you' || count === 0) return;
        state.selected = idx;
        const max = v.hasMaxTake ? Math.min(state.maxTake, count) : count;
        if (state.take > max) state.take = max;
        if (state.take < 1) state.take = 1;
        $('nim-take').textContent = state.take;
        render();
      });
      board.appendChild(pile);
    });

    // Turn indicator
    const ind = $('nim-turn');
    let xor = nimSum(state.piles);
    let xorLabel = `nim-sum = <b>${xor}</b>`;
    if (v.hasMaxTake) {
      const M = state.maxTake + 1;
      const g = state.piles.reduce((a, b) => a ^ (b % M), 0);
      xorLabel = `Grundy ⊕ = <b>${g}</b>`;
    }
    if (state.ended) {
      ind.className = 'turn-indicator';
      ind.innerHTML = `<span>GAME OVER · ${state.winner === 'you' ? 'YOU WON' : 'AI WON'}</span><span class="nim-sum">${xorLabel}</span>`;
    } else if (state.turn === 'you') {
      ind.className = 'turn-indicator you';
      const lbl = state.selected < 0
        ? 'YOUR TURN — SELECT A PILE'
        : `YOUR TURN — TAKING ${state.take} FROM P${state.selected + 1}`;
      ind.innerHTML = `<span>${lbl}</span><span class="nim-sum">${xorLabel}</span>`;
    } else {
      ind.className = 'turn-indicator ai';
      ind.innerHTML = `<span>AI THINKING…</span><span class="nim-sum">${xorLabel}</span>`;
    }

    // Score
    $('nim-score').textContent = `${state.score.you} · ${state.score.ai}`;

    // Log
    const log = $('nim-log');
    log.innerHTML = state.log.map(e => `<div class="entry ${e.who}">${e.who === 'you' ? '▶ You' : '◀ AI'}  took ${e.amount} from P${e.heap + 1}  →  [${e.after.join(', ')}]</div>`).join('') ||
      '<div class="entry" style="color:var(--text-muted);">— move log —</div>';
    log.scrollTop = log.scrollHeight;
  }

  function applyMove(heap, amount, who) {
    const board = $('nim-board');
    const pile = board.children[heap];
    if (pile) {
      const stones = pile.querySelectorAll('.stone');
      for (let i = 0; i < amount && i < stones.length; i++) {
        stones[i].classList.add('removing'); // top of column-reverse = first
      }
    }
    setTimeout(() => {
      state.piles[heap] -= amount;
      state.log.push({ who, heap, amount, after: state.piles.slice() });
      state.selected = -1;
      state.take = 1;
      $('nim-take').textContent = '1';
      // Game end?
      if (state.piles.every(p => p === 0)) {
        const v = variant();
        const lastTookWho = who;
        // last to take wins or loses depending on variant
        const youWon = v.lastWins ? lastTookWho === 'you' : lastTookWho === 'ai';
        state.ended = true;
        state.winner = youWon ? 'you' : 'ai';
        state.score[youWon ? 'you' : 'ai']++;
        render();
        showEnd(youWon);
        return;
      }
      state.turn = (who === 'you') ? 'ai' : 'you';
      render();
      if (state.turn === 'ai') setTimeout(aiMove, 800);
    }, 320);
  }

  function aiMove() {
    if (state.ended) return;
    const v = variant();
    const valid = v.validMoves(state.piles, state.maxTake);
    if (!valid.length) return;
    const optimal = v.optimal(state.piles, state.maxTake);
    let move;
    if (Math.random() < DIFFICULTY[state.difficulty] && optimal && valid.some(m => m[0] === optimal[0] && m[1] === optimal[1])) {
      move = optimal;
    } else {
      move = valid[Math.floor(Math.random() * valid.length)];
    }
    applyMove(move[0], move[1], 'ai');
  }

  function showEnd(playerWon) {
    $('nim-end').innerHTML = `
      <div class="game-end ${playerWon ? '' : 'lose'}">
        <h3>${playerWon ? 'You win!' : 'AI wins!'}</h3>
        <p>${playerWon ? 'Optimal play through Sprague–Grundy space.' : 'The position was against you. Try again.'}</p>
        <button class="btn" id="nim-end-restart">New Game</button>
      </div>`;
    $('nim-end-restart').addEventListener('click', resetGame);
  }

  function resetGame() {
    state.piles = state.initial.slice();
    state.selected = -1;
    state.take = 1;
    state.turn = 'you';
    state.ended = false;
    state.winner = null;
    state.log = [];
    $('nim-end').innerHTML = '';
    $('nim-take').textContent = '1';
    render();
  }

  document.querySelectorAll('[data-nim-take]').forEach(b => b.addEventListener('click', () => {
    if (state.ended || state.turn !== 'you' || state.selected < 0) return;
    const v = variant();
    const max = v.hasMaxTake ? Math.min(state.maxTake, state.piles[state.selected]) : state.piles[state.selected];
    state.take = Math.max(1, Math.min(max, state.take + Number(b.dataset.nimTake)));
    $('nim-take').textContent = state.take;
    render();
  }));
  $('nim-confirm').addEventListener('click', () => {
    if (state.ended || state.turn !== 'you' || state.selected < 0) return;
    applyMove(state.selected, state.take, 'you');
  });
  $('nim-restart').addEventListener('click', resetGame);
  $('nim-hint').addEventListener('click', () => {
    if (state.ended || state.turn !== 'you') return;
    const v = variant();
    const opt = v.optimal(state.piles, state.maxTake);
    const hint = $('nim-hint-text');
    if (opt) hint.innerHTML = `Optimal: take <b style="color:var(--teal)">${opt[1]}</b> from <b style="color:var(--teal)">P${opt[0] + 1}</b>`;
    else hint.innerHTML = `<span style="color:var(--amber)">No winning move — losing position.</span>`;
    setTimeout(() => hint.innerHTML = '', 4000);
  });

  buildVariantCards();
  buildDifficulty();
  buildConfig();
  render();
})();
