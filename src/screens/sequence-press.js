import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { SEQUENCES, PICTURES, COLORS } from '../data/sequence-config.js';

let engine = null;

export function renderSequencePress(app, mode, onExit) {
  const sequence = SEQUENCES[mode];
  const totalSteps = sequence.length;

  // Pick a random picture section (enough rows for our sequence)
  const rowsNeeded = Math.ceil(totalSteps / 7);
  const startRow = Math.floor(Math.random() * Math.max(1, PICTURES.length - rowsNeeded));
  const pictureRows = PICTURES.slice(startRow, startRow + rowsNeeded);

  app.innerHTML = `
    <div class="sequence-screen">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">0 / ${totalSteps}</div>
        <div class="rain-level">⏱️ 0.0초</div>
      </div>
      <div class="seq-progress">
        ${sequence.map((s, i) => `<span class="seq-dot" data-idx="${i}">${s.display}</span>`).join('')}
      </div>
      <div class="seq-current"></div>
      <div class="seq-picture">
        ${pictureRows.map((row) => `<div class="seq-pic-row">${row.map((cell) => `<span class="seq-pic-cell">${cell}</span>`).join('')}</div>`).join('')}
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
  const currentEl = app.querySelector('.seq-current');
  const dots = app.querySelectorAll('.seq-dot');
  const picCells = app.querySelectorAll('.seq-pic-cell');

  engine = new ParticleEngine(canvas);

  // Hide all picture cells initially
  picCells.forEach((cell) => { cell.style.opacity = '0'; });

  const state = {
    currentIdx: 0,
    startTime: null,
    endTime: null,
    gameOver: false,
  };

  function updateDisplay() {
    const s = sequence[state.currentIdx];
    currentEl.textContent = s.display;
    currentEl.style.transform = 'scale(1)';
    scoreEl.textContent = `${state.currentIdx} / ${totalSteps}`;

    // Highlight current dot
    dots.forEach((d, i) => {
      d.classList.toggle('seq-dot-done', i < state.currentIdx);
      d.classList.toggle('seq-dot-current', i === state.currentIdx);
    });
  }

  function revealCell(idx) {
    if (idx < picCells.length) {
      picCells[idx].style.opacity = '1';
      picCells[idx].style.transition = 'opacity 0.3s';
    }
  }

  function updateTimer() {
    if (state.startTime && !state.gameOver) {
      const elapsed = (performance.now() - state.startTime) / 1000;
      timerEl.textContent = `⏱️ ${elapsed.toFixed(1)}초`;
    }
  }

  const timerInterval = setInterval(updateTimer, 100);

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.gameOver) return;

    if (!state.startTime) state.startTime = performance.now();

    const expected = sequence[state.currentIdx];

    if (e.code === expected.code) {
      // Correct!
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.4;

      spawnTextPop(effectsContainer, `✅ ${expected.display}`, cx, cy);
      engine.spawn(cx, cy, { colors: COLORS, shapes: ['circle', 'star'], count: 20, speed: 6 });
      playThemeSound(mode === 'korean' ? 'korean' : 'english', (state.currentIdx % 12) + 1);

      revealCell(state.currentIdx);
      state.currentIdx++;

      if (state.currentIdx >= totalSteps) {
        gameComplete();
      } else {
        updateDisplay();
      }
    } else {
      // Wrong - shake + hint
      currentEl.classList.add('seq-shake');
      setTimeout(() => currentEl.classList.remove('seq-shake'), 300);
    }
  }

  function gameComplete() {
    state.gameOver = true;
    state.endTime = performance.now();
    clearInterval(timerInterval);

    const elapsed = ((state.endTime - state.startTime) / 1000).toFixed(1);

    // Reveal remaining cells
    picCells.forEach((cell) => { cell.style.opacity = '1'; });

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { colors: COLORS, shapes: ['circle', 'star', 'heart'], count: 80, speed: 12 });
    playFirework();
    spawnEmojiBurst(effectsContainer, ['🎉', '⭐', '✨', '🏆'], cx, cy, 10);

    // High score
    const key = `sequence_${mode}_bestTime`;
    const prevBest = parseFloat(localStorage.getItem(key) || '9999');
    const isNewBest = parseFloat(elapsed) < prevBest;
    if (isNewBest) localStorage.setItem(key, elapsed);

    setTimeout(() => {
      const overlay = document.createElement('div');
      overlay.className = 'rain-gameover';
      overlay.innerHTML = `
        <div class="rain-gameover-box">
          <h2>${isNewBest ? '🎉 새 기록!' : '👏 완성!'}</h2>
          <p class="rain-final-score">${elapsed}초</p>
          <p class="rain-high-score">최고 기록: ${Math.min(parseFloat(elapsed), prevBest).toFixed(1)}초</p>
          <div class="rain-gameover-btns">
            <button class="rain-retry-btn">다시 하기 🔄</button>
            <button class="rain-home-btn">홈으로 🏠</button>
          </div>
        </div>
      `;
      app.querySelector('.sequence-screen').appendChild(overlay);

      overlay.querySelector('.rain-retry-btn').addEventListener('click', () => {
        cleanup();
        renderSequencePress(app, mode, onExit);
      });
      overlay.querySelector('.rain-home-btn').addEventListener('click', () => {
        cleanup();
        onExit();
      });
    }, 1500);
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // Touch support: show hint for current key
  const playEl = app.querySelector('.sequence-screen');
  playEl.addEventListener('click', (e) => {
    if (e.target === exitBtn || state.gameOver) return;
    // Touch = auto-press correct key (helper for younger kids)
    handleKeyDown({ code: sequence[state.currentIdx].code, preventDefault() {}, stopPropagation() {} });
  });

  function cleanup() {
    clearInterval(timerInterval);
    document.removeEventListener('keydown', handleKeyDown, true);
    if (engine) { engine.destroy(); engine = null; }
    document.body.classList.remove('playing');
    exitFullscreen();
  }

  exitBtn.addEventListener('click', () => { cleanup(); onExit(); });

  let cursorTimer = null;
  playEl.addEventListener('mousemove', () => {
    document.body.classList.remove('cursor-hidden');
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => document.body.classList.add('cursor-hidden'), 2000);
  });

  updateDisplay();
}
