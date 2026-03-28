import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, flashScreen } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound } from '../systems/sounds.js';
import { COLORS } from '../data/color-match-config.js';

let engine = null;

export function renderColorMatch(app, onExit) {
  app.innerHTML = `
    <div class="color-match-screen">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">0점</div>
        <div class="rain-level">⏱️ 30초</div>
      </div>
      <div class="color-display">
        <div class="color-circle"></div>
        <div class="color-name"></div>
      </div>
      <div class="color-keys">
        ${COLORS.map((c) => `<div class="color-key" data-code="${c.code}" style="background:${c.bg}"><span class="color-key-label">${c.name}<br>${c.display}</span></div>`).join('')}
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
  const timerEl = app.querySelector('.rain-level');
  const circleEl = app.querySelector('.color-circle');
  const nameEl = app.querySelector('.color-name');

  engine = new ParticleEngine(canvas);

  const state = {
    score: 0,
    currentColor: null,
    startTime: performance.now(),
    timeLeft: 30,
    gameOver: false,
    combo: 0,
  };

  function nextColor() {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    state.currentColor = c;
    circleEl.style.background = c.color;
    nameEl.textContent = c.name;
    nameEl.style.color = c.color;
  }

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.gameOver || !state.currentColor) return;

    if (e.code === state.currentColor.code) {
      // Correct
      state.combo++;
      state.score += 10 + state.combo * 2;
      scoreEl.textContent = `${state.score}점`;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.35;
      spawnTextPop(effectsContainer, `✅ ${state.currentColor.name}!`, cx, cy);
      engine.spawn(cx, cy, { colors: [state.currentColor.color, '#FFFFFF'], shapes: ['circle', 'heart'], count: 25, speed: 7 });
      playThemeSound('colors', COLORS.indexOf(state.currentColor) + 1);

      nextColor();
    } else {
      // Wrong
      state.combo = 0;
      const flashEl = document.createElement('div');
      flashEl.className = 'screen-flash';
      flashEl.style.background = 'rgba(255,0,0,0.2)';
      effectsContainer.appendChild(flashEl);
      flashEl.addEventListener('animationend', () => flashEl.remove());
    }
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // Touch support
  app.querySelectorAll('.color-key').forEach((el) => {
    el.addEventListener('click', () => {
      if (state.gameOver) return;
      handleKeyDown({ code: el.dataset.code, preventDefault() {}, stopPropagation() {} });
    });
  });

  // Timer
  const timerInterval = setInterval(() => {
    if (state.gameOver) return;
    const elapsed = (performance.now() - state.startTime) / 1000;
    state.timeLeft = Math.max(0, 30 - elapsed);
    timerEl.textContent = `⏱️ ${Math.ceil(state.timeLeft)}초`;

    if (state.timeLeft <= 0) gameOver();
  }, 100);

  function gameOver() {
    state.gameOver = true;
    clearInterval(timerInterval);

    const key = 'colorMatch_highScore';
    const prevHigh = parseInt(localStorage.getItem(key) || '0');
    const isNewHigh = state.score > prevHigh;
    if (isNewHigh) localStorage.setItem(key, state.score);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { colors: COLORS.map((c) => c.color), shapes: ['circle', 'star', 'heart'], count: 60, speed: 10 });

    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${isNewHigh ? '🎉 새 기록!' : '👏 잘했어요!'}</h2>
        <p class="rain-final-score">${state.score}점</p>
        <p class="rain-high-score">최고 기록: ${Math.max(state.score, prevHigh)}점</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.color-match-screen').appendChild(overlay);
    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => { cleanup(); renderColorMatch(app, onExit); });
    overlay.querySelector('.rain-home-btn').addEventListener('click', () => { cleanup(); onExit(); });
  }

  function cleanup() {
    clearInterval(timerInterval);
    document.removeEventListener('keydown', handleKeyDown, true);
    if (engine) { engine.destroy(); engine = null; }
    document.body.classList.remove('playing');
    exitFullscreen();
  }

  exitBtn.addEventListener('click', () => { cleanup(); onExit(); });

  nextColor();
}
