import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { PAIR_SETS, GRID_KEYS, KEY_LABELS } from '../data/memory-pairs-config.js';

let engine = null;

export function renderMemoryPairs(app, onExit) {
  // Pick random pair set and create pairs
  const set = PAIR_SETS[Math.floor(Math.random() * PAIR_SETS.length)];
  const pairs = [...set, ...set]; // duplicate for matching
  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  app.innerHTML = `
    <div class="memory-screen">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">0 / ${set.length}</div>
        <div class="rain-level">시도: 0</div>
      </div>
      <div class="memory-grid">
        ${GRID_KEYS.map((code, i) => `
          <div class="memory-card" data-idx="${i}" data-code="${code}">
            <span class="memory-card-key">${KEY_LABELS[code]}</span>
            <span class="memory-card-emoji" style="display:none">${pairs[i]}</span>
          </div>
        `).join('')}
      </div>
      <button class="exit-btn">✕</button>
    </div>
  `;

  document.body.classList.add('playing');
  enterFullscreen();
  resumeAudio();

  const canvas = app.querySelector('.play-canvas');
  const effectsContainer = app.querySelector('.play-effects');
  const exitBtn = app.querySelector('.exit-btn');
  const scoreEl = app.querySelector('.rain-score');
  const triesEl = app.querySelector('.rain-level');
  const cards = app.querySelectorAll('.memory-card');

  engine = new ParticleEngine(canvas);
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A855F7', '#FF69B4', '#38BDF8'];

  const state = {
    flipped: [],
    matched: new Set(),
    tries: 0,
    pairsFound: 0,
    locked: false,
    gameOver: false,
  };

  function flipCard(idx) {
    if (state.locked || state.gameOver) return;
    if (state.matched.has(idx)) return;
    if (state.flipped.includes(idx)) return;

    const card = cards[idx];
    card.querySelector('.memory-card-key').style.display = 'none';
    card.querySelector('.memory-card-emoji').style.display = '';
    card.classList.add('memory-card-flipped');
    playThemeSound('colors', idx + 1);

    state.flipped.push(idx);

    if (state.flipped.length === 2) {
      state.tries++;
      triesEl.textContent = `시도: ${state.tries}`;

      const [a, b] = state.flipped;
      if (pairs[a] === pairs[b]) {
        // Match!
        state.matched.add(a);
        state.matched.add(b);
        state.pairsFound++;
        scoreEl.textContent = `${state.pairsFound} / ${set.length}`;

        const rect = cards[a].getBoundingClientRect();
        engine.spawn(rect.left + rect.width / 2, rect.top + rect.height / 2, { colors, shapes: ['circle', 'heart'], count: 20, speed: 6 });
        spawnTextPop(effectsContainer, `✅ ${pairs[a]}`, window.innerWidth / 2, window.innerHeight / 2);

        state.flipped = [];

        if (state.pairsFound >= set.length) {
          setTimeout(() => gameComplete(), 500);
        }
      } else {
        // No match - flip back
        state.locked = true;
        setTimeout(() => {
          cards[a].querySelector('.memory-card-key').style.display = '';
          cards[a].querySelector('.memory-card-emoji').style.display = 'none';
          cards[a].classList.remove('memory-card-flipped');
          cards[b].querySelector('.memory-card-key').style.display = '';
          cards[b].querySelector('.memory-card-emoji').style.display = 'none';
          cards[b].classList.remove('memory-card-flipped');
          state.flipped = [];
          state.locked = false;
        }, 800);
      }
    }
  }

  function gameComplete() {
    state.gameOver = true;
    const key = 'memoryPairs_bestTries';
    const prevBest = parseInt(localStorage.getItem(key) || '999');
    const isNewBest = state.tries < prevBest;
    if (isNewBest) localStorage.setItem(key, state.tries);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { colors, shapes: ['circle', 'star', 'heart'], count: 60, speed: 10 });
    playFirework();
    spawnEmojiBurst(effectsContainer, ['🎉', '⭐', '🏆'], cx, cy, 8);

    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${isNewBest ? '🎉 새 기록!' : '👏 완성!'}</h2>
        <p class="rain-final-score">${state.tries}번 만에 성공!</p>
        <p class="rain-high-score">최소 시도: ${Math.min(state.tries, prevBest)}번</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.memory-screen').appendChild(overlay);
    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => { cleanup(); renderMemoryPairs(app, onExit); });
    overlay.querySelector('.rain-home-btn').addEventListener('click', () => { cleanup(); onExit(); });
  }

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    const idx = GRID_KEYS.indexOf(e.code);
    if (idx >= 0) flipCard(idx);
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // Touch support
  cards.forEach((card, idx) => {
    card.addEventListener('click', () => flipCard(idx));
  });

  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown, true);
    if (engine) { engine.destroy(); engine = null; }
    document.body.classList.remove('playing');
    exitFullscreen();
  }

  exitBtn.addEventListener('click', () => { cleanup(); onExit(); });
}
