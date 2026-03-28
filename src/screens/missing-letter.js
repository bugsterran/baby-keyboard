import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { WORDS_KOREAN, WORDS_ENGLISH, GAME } from '../data/missing-letter-config.js';

let engine = null;

export function renderMissingLetter(app, mode, onExit) {
  const words = mode === 'korean' ? [...WORDS_KOREAN] : [...WORDS_ENGLISH];
  // Shuffle
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  const rounds = words.slice(0, GAME.totalRounds);

  app.innerHTML = `
    <div class="missing-screen">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">1 / ${rounds.length}</div>
        <div class="rain-lives">${'❤️'.repeat(GAME.lives)}</div>
      </div>
      <div class="missing-word"></div>
      <div class="missing-hint"></div>
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
  const livesEl = app.querySelector('.rain-lives');
  const wordEl = app.querySelector('.missing-word');
  const hintEl = app.querySelector('.missing-hint');

  engine = new ParticleEngine(canvas);
  const particleConfig = { colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A855F7'], shapes: ['circle', 'star'] };

  const state = {
    roundIdx: 0,
    lives: GAME.lives,
    correct: 0,
    gameOver: false,
  };

  function showRound() {
    const r = rounds[state.roundIdx];
    wordEl.textContent = r.word;
    hintEl.textContent = `💡 ${r.answerDisplay} 를 눌러요!`;
    scoreEl.textContent = `${state.roundIdx + 1} / ${rounds.length}`;
  }

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.gameOver) return;

    const r = rounds[state.roundIdx];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.4;

    if (e.code === r.answer) {
      // Correct!
      state.correct++;
      wordEl.textContent = r.full;
      wordEl.style.color = '#4ECDC4';
      spawnTextPop(effectsContainer, `✅ ${r.full}`, cx, cy);
      engine.spawn(cx, cy, { ...particleConfig, count: 25, speed: 7 });
      playThemeSound(mode === 'korean' ? 'korean' : 'english', (state.roundIdx % 12) + 1);

      setTimeout(() => {
        wordEl.style.color = '';
        state.roundIdx++;
        if (state.roundIdx >= rounds.length) {
          gameComplete();
        } else {
          showRound();
        }
      }, 800);
    } else {
      // Wrong
      state.lives--;
      livesEl.textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(GAME.lives - state.lives);

      wordEl.classList.add('seq-shake');
      setTimeout(() => wordEl.classList.remove('seq-shake'), 300);

      const flashEl = document.createElement('div');
      flashEl.className = 'screen-flash';
      flashEl.style.background = 'rgba(255,0,0,0.2)';
      effectsContainer.appendChild(flashEl);
      flashEl.addEventListener('animationend', () => flashEl.remove());

      if (state.lives <= 0) {
        setTimeout(() => gameComplete(), 500);
      }
    }
  }

  function gameComplete() {
    state.gameOver = true;

    const key = `missingLetter_${mode}_best`;
    const prevBest = parseInt(localStorage.getItem(key) || '0');
    const isNewBest = state.correct > prevBest;
    if (isNewBest) localStorage.setItem(key, state.correct);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { ...particleConfig, count: 50, speed: 10 });
    if (state.correct >= rounds.length) {
      playFirework();
      spawnEmojiBurst(effectsContainer, ['🎉', '⭐', '🏆'], cx, cy, 8);
    }

    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${state.correct >= rounds.length ? '🎉 완벽!' : isNewBest ? '🎉 새 기록!' : '👏 잘했어요!'}</h2>
        <p class="rain-final-score">${state.correct} / ${rounds.length}</p>
        <p class="rain-high-score">최고 기록: ${Math.max(state.correct, prevBest)} / ${rounds.length}</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.missing-screen').appendChild(overlay);
    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => { cleanup(); renderMissingLetter(app, mode, onExit); });
    overlay.querySelector('.rain-home-btn').addEventListener('click', () => { cleanup(); onExit(); });
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // Touch: show hint is enough, no auto-answer
  const playEl = app.querySelector('.missing-screen');
  playEl.addEventListener('click', (e) => {
    if (e.target === exitBtn) return;
    // Touch = show bigger hint
    hintEl.style.fontSize = '24px';
    setTimeout(() => { hintEl.style.fontSize = ''; }, 1000);
  });

  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown, true);
    if (engine) { engine.destroy(); engine = null; }
    document.body.classList.remove('playing');
    exitFullscreen();
  }

  exitBtn.addEventListener('click', () => { cleanup(); onExit(); });

  showRound();
}
