import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { KEYS, DIFFICULTY } from '../data/copycat-config.js';

let engine = null;

export function renderCopyCat(app, onExit) {
  app.innerHTML = `
    <div class="copycat-screen">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">라운드 1</div>
        <div class="rain-level">🧠 기억하세요!</div>
      </div>
      <div class="copycat-keys">
        ${KEYS.map((k) => `<div class="copycat-key" data-code="${k.code}" style="background:${k.color}">${k.display}</div>`).join('')}
      </div>
      <div class="copycat-msg">잘 보세요!</div>
      <button class="exit-btn">✕</button>
    </div>
  `;

  document.body.classList.add('playing');
  enterFullscreen();
  resumeAudio();

  const canvas = app.querySelector('.play-canvas');
  const effectsContainer = app.querySelector('.play-effects');
  const exitBtn = app.querySelector('.exit-btn');
  const msgEl = app.querySelector('.copycat-msg');
  const scoreEl = app.querySelector('.rain-score');
  const levelEl = app.querySelector('.rain-level');
  const keyEls = {};
  app.querySelectorAll('.copycat-key').forEach((el) => {
    keyEls[el.dataset.code] = el;
  });

  engine = new ParticleEngine(canvas);
  const particleConfig = { colors: KEYS.map((k) => k.color), shapes: ['circle', 'star'] };

  const state = {
    sequence: [],
    playerIdx: 0,
    round: 1,
    length: DIFFICULTY.startLength,
    phase: 'showing', // 'showing' | 'input' | 'gameover'
    score: 0,
    bestRound: parseInt(localStorage.getItem('copycat_bestRound') || '0'),
  };

  function flashKey(code, duration = 300) {
    const el = keyEls[code];
    if (!el) return;
    el.classList.add('copycat-key-active');
    const k = KEYS.find((k) => k.code === code);
    if (k) playThemeSound('colors', KEYS.indexOf(k) + 1);
    setTimeout(() => el.classList.remove('copycat-key-active'), duration);
  }

  async function showSequence() {
    state.phase = 'showing';
    msgEl.textContent = '잘 보세요! 👀';
    levelEl.textContent = '🧠 기억하세요!';

    await sleep(800);

    for (let i = 0; i < state.sequence.length; i++) {
      flashKey(state.sequence[i], DIFFICULTY.showDuration);
      await sleep(DIFFICULTY.showDuration + DIFFICULTY.pauseBetween);
    }

    state.phase = 'input';
    state.playerIdx = 0;
    msgEl.textContent = '따라 눌러요! 🎯';
    levelEl.textContent = `${state.sequence.length}개 기억!`;
  }

  function nextRound() {
    state.round++;
    state.length = Math.min(DIFFICULTY.maxLength, DIFFICULTY.startLength + state.round - 1);
    scoreEl.textContent = `라운드 ${state.round}`;

    // Add one more key to sequence
    const randomKey = KEYS[Math.floor(Math.random() * KEYS.length)];
    state.sequence.push(randomKey.code);

    showSequence();
  }

  function startGame() {
    state.sequence = [];
    for (let i = 0; i < state.length; i++) {
      state.sequence.push(KEYS[Math.floor(Math.random() * KEYS.length)].code);
    }
    showSequence();
  }

  function gameOver() {
    state.phase = 'gameover';
    const isNewBest = state.round > state.bestRound;
    if (isNewBest) localStorage.setItem('copycat_bestRound', state.round);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { ...particleConfig, count: 50, speed: 10 });

    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${isNewBest ? '🎉 새 기록!' : '👏 잘했어요!'}</h2>
        <p class="rain-final-score">라운드 ${state.round}</p>
        <p class="rain-high-score">최고 기록: 라운드 ${Math.max(state.round, state.bestRound)}</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.copycat-screen').appendChild(overlay);
    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => { cleanup(); renderCopyCat(app, onExit); });
    overlay.querySelector('.rain-home-btn').addEventListener('click', () => { cleanup(); onExit(); });
  }

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.phase !== 'input') return;

    const code = e.code;
    if (!KEYS.find((k) => k.code === code)) return;

    flashKey(code, 200);

    if (code === state.sequence[state.playerIdx]) {
      // Correct
      state.playerIdx++;
      const el = keyEls[code];
      const rect = el.getBoundingClientRect();
      engine.spawn(rect.left + rect.width / 2, rect.top, { ...particleConfig, count: 15, speed: 5 });

      if (state.playerIdx >= state.sequence.length) {
        // Round complete
        msgEl.textContent = '🎉 정답!';
        spawnTextPop(effectsContainer, '⭐ 정답!', window.innerWidth / 2, window.innerHeight / 3);
        if (state.round % 3 === 0) playFirework();
        setTimeout(() => nextRound(), 1200);
      }
    } else {
      // Wrong
      msgEl.textContent = '❌ 틀렸어요!';
      const flashEl = document.createElement('div');
      flashEl.className = 'screen-flash';
      flashEl.style.background = 'rgba(255,0,0,0.3)';
      effectsContainer.appendChild(flashEl);
      flashEl.addEventListener('animationend', () => flashEl.remove());
      setTimeout(() => gameOver(), 800);
    }
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // Touch support
  app.querySelectorAll('.copycat-key').forEach((el) => {
    el.addEventListener('click', () => {
      if (state.phase !== 'input') return;
      handleKeyDown({ code: el.dataset.code, preventDefault() {}, stopPropagation() {} });
    });
  });

  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown, true);
    if (engine) { engine.destroy(); engine = null; }
    document.body.classList.remove('playing');
    exitFullscreen();
  }

  exitBtn.addEventListener('click', () => { cleanup(); onExit(); });

  startGame();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
