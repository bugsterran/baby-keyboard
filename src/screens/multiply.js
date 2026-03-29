import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { GAME, generateProblems } from '../data/multiply-config.js';

let engine = null;

export function renderMultiply(app, onExit) {
  const problems = generateProblems(GAME.totalRounds);

  app.innerHTML = `
    <div class="multiply-screen">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">1 / ${problems.length}</div>
        <div class="rain-level">⏱️ ${GAME.timeLimit}초</div>
      </div>
      <div class="multiply-problem"></div>
      <div class="multiply-input"></div>
      <div class="multiply-hint">숫자를 입력하고 엔터!</div>
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
  const problemEl = app.querySelector('.multiply-problem');
  const inputEl = app.querySelector('.multiply-input');

  engine = new ParticleEngine(canvas);
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A855F7'];

  const state = {
    idx: 0,
    inputBuffer: '',
    correct: 0,
    startTime: performance.now(),
    gameOver: false,
  };

  function showProblem() {
    const p = problems[state.idx];
    problemEl.textContent = `${p.a} × ${p.b} = ?`;
    inputEl.textContent = '_';
    state.inputBuffer = '';
    scoreEl.textContent = `${state.idx + 1} / ${problems.length}`;
  }

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.gameOver) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.4;

    if (/^[0-9]$/.test(e.key)) {
      state.inputBuffer += e.key;
      inputEl.textContent = state.inputBuffer;
    } else if (e.key === 'Backspace') {
      state.inputBuffer = state.inputBuffer.slice(0, -1);
      inputEl.textContent = state.inputBuffer || '_';
    } else if (e.key === 'Enter' && state.inputBuffer) {
      const answer = parseInt(state.inputBuffer);
      const p = problems[state.idx];

      if (answer === p.answer) {
        state.correct++;
        spawnTextPop(effectsContainer, `⭕ ${p.a}×${p.b}=${p.answer}`, cx, cy);
        engine.spawn(cx, cy, { colors, shapes: ['circle', 'star'], count: 25, speed: 7 });
        playThemeSound('numbers', (state.idx % 12) + 1);

        state.idx++;
        if (state.idx >= problems.length) {
          gameComplete();
        } else {
          showProblem();
        }
      } else {
        // Wrong
        state.inputBuffer = '';
        inputEl.textContent = '_';
        problemEl.classList.add('seq-shake');
        setTimeout(() => problemEl.classList.remove('seq-shake'), 300);
        const flashEl = document.createElement('div');
        flashEl.className = 'screen-flash';
        flashEl.style.background = 'rgba(255,0,0,0.2)';
        effectsContainer.appendChild(flashEl);
        flashEl.addEventListener('animationend', () => flashEl.remove());
      }
    }
  }

  const timerInterval = setInterval(() => {
    if (state.gameOver) return;
    const elapsed = (performance.now() - state.startTime) / 1000;
    const left = Math.max(0, GAME.timeLimit - elapsed);
    timerEl.textContent = `⏱️ ${Math.ceil(left)}초`;
    if (left <= 0) gameComplete();
  }, 100);

  function gameComplete() {
    state.gameOver = true;
    clearInterval(timerInterval);
    const elapsed = ((performance.now() - state.startTime) / 1000).toFixed(1);

    const key = 'multiply_best';
    const prevBest = parseInt(localStorage.getItem(key) || '0');
    const isNewBest = state.correct > prevBest;
    if (isNewBest) localStorage.setItem(key, state.correct);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { colors, shapes: ['circle', 'star', 'heart'], count: 60, speed: 10 });
    if (state.correct >= problems.length) playFirework();

    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${state.correct >= problems.length ? '🎉 완벽!' : isNewBest ? '🎉 새 기록!' : '👏 잘했어요!'}</h2>
        <p class="rain-final-score">${state.correct} / ${problems.length}</p>
        <p class="rain-high-score">최고: ${Math.max(state.correct, prevBest)}개 · ${elapsed}초</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.multiply-screen').appendChild(overlay);
    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => { cleanup(); renderMultiply(app, onExit); });
    overlay.querySelector('.rain-home-btn').addEventListener('click', () => { cleanup(); onExit(); });
  }

  document.addEventListener('keydown', handleKeyDown, true);

  function cleanup() {
    clearInterval(timerInterval);
    document.removeEventListener('keydown', handleKeyDown, true);
    if (engine) { engine.destroy(); engine = null; }
    document.body.classList.remove('playing');
    exitFullscreen();
  }

  exitBtn.addEventListener('click', () => { cleanup(); onExit(); });
  showProblem();
}
