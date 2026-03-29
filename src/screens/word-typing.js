import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { WORDS_KOREAN, WORDS_ENGLISH, GAME } from '../data/word-typing-config.js';

let engine = null;

export function renderWordTyping(app, mode, onExit) {
  const allWords = mode === 'korean' ? [...WORDS_KOREAN] : [...WORDS_ENGLISH];
  // Shuffle
  for (let i = allWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
  }

  app.innerHTML = `
    <div class="wordtyping-screen">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">0개</div>
        <div class="rain-level">⏱️ ${GAME.timeLimit}초</div>
      </div>
      <div class="wt-word"></div>
      <div class="wt-input"></div>
      <div class="wt-hint">${mode === 'korean' ? '한글로 타이핑!' : '영어로 타이핑!'}</div>
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
  const wordEl = app.querySelector('.wt-word');
  const inputEl = app.querySelector('.wt-input');

  engine = new ParticleEngine(canvas);
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A855F7'];

  const state = {
    wordIdx: 0,
    inputBuffer: '',
    completed: 0,
    startTime: performance.now(),
    gameOver: false,
  };

  function showWord() {
    if (state.wordIdx >= allWords.length) state.wordIdx = 0;
    wordEl.textContent = allWords[state.wordIdx];
    inputEl.textContent = '_';
    state.inputBuffer = '';
  }

  function handleKeyDown(e) {
    if (state.gameOver) return;

    // Allow normal typing for Korean IME
    if (mode === 'korean') {
      // Don't preventDefault for Korean input
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        return;
      }
      return; // Let compositionend handle Korean
    }

    e.preventDefault();
    e.stopPropagation();

    if (/^[a-zA-Z]$/.test(e.key)) {
      state.inputBuffer += e.key.toUpperCase();
      inputEl.textContent = state.inputBuffer;
      checkWord();
    } else if (e.key === 'Backspace') {
      state.inputBuffer = state.inputBuffer.slice(0, -1);
      inputEl.textContent = state.inputBuffer || '_';
    }
  }

  function checkWord() {
    const target = allWords[state.wordIdx];
    if (state.inputBuffer === target) {
      // Correct!
      state.completed++;
      scoreEl.textContent = `${state.completed}개`;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.35;
      spawnTextPop(effectsContainer, `✅ ${target}`, cx, cy);
      engine.spawn(cx, cy, { colors, shapes: ['circle', 'star'], count: 25, speed: 7 });
      playThemeSound(mode === 'korean' ? 'korean' : 'english', (state.completed % 12) + 1);

      if (state.completed % 5 === 0) playFirework();

      state.wordIdx++;
      showWord();
    }
  }

  // For English mode
  if (mode === 'english') {
    document.addEventListener('keydown', handleKeyDown, true);
  } else {
    // Korean mode: use input element for IME support
    const hiddenInput = document.createElement('input');
    hiddenInput.className = 'wt-hidden-input';
    hiddenInput.setAttribute('autocomplete', 'off');
    hiddenInput.setAttribute('autocapitalize', 'off');
    app.querySelector('.wordtyping-screen').appendChild(hiddenInput);
    hiddenInput.focus();

    hiddenInput.addEventListener('input', () => {
      state.inputBuffer = hiddenInput.value;
      inputEl.textContent = state.inputBuffer || '_';

      const target = allWords[state.wordIdx];
      if (state.inputBuffer === target) {
        state.completed++;
        scoreEl.textContent = `${state.completed}개`;

        const cx = window.innerWidth / 2;
        const cy = window.innerHeight * 0.35;
        spawnTextPop(effectsContainer, `✅ ${target}`, cx, cy);
        engine.spawn(cx, cy, { colors, shapes: ['circle', 'star'], count: 25, speed: 7 });
        playThemeSound('korean', (state.completed % 12) + 1);
        if (state.completed % 5 === 0) playFirework();

        state.wordIdx++;
        hiddenInput.value = '';
        showWord();
      }
    });

    // Block system keys
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'F5') e.preventDefault();
    }, true);

    // Refocus on click
    app.querySelector('.wordtyping-screen').addEventListener('click', () => hiddenInput.focus());
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

    const key = `wordTyping_${mode}_best`;
    const prevBest = parseInt(localStorage.getItem(key) || '0');
    const isNewBest = state.completed > prevBest;
    if (isNewBest) localStorage.setItem(key, state.completed);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { colors, shapes: ['circle', 'star', 'heart'], count: 60, speed: 10 });
    if (state.completed >= 10) playFirework();

    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${isNewBest ? '🎉 새 기록!' : '👏 잘했어요!'}</h2>
        <p class="rain-final-score">${state.completed}개</p>
        <p class="rain-high-score">최고: ${Math.max(state.completed, prevBest)}개</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.wordtyping-screen').appendChild(overlay);
    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => { cleanup(); renderWordTyping(app, mode, onExit); });
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
  showWord();
}
