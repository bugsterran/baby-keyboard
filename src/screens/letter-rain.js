import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst, flashScreen } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { LETTER_SETS, DIFFICULTY, GAME, COLORS } from '../data/letter-rain-config.js';

let engine = null;
let animId = null;

export function renderLetterRain(app, mode, onExit) {
  const letters = LETTER_SETS[mode];
  const isKorean = mode === 'korean';

  app.innerHTML = `
    <div class="letter-rain">
      <canvas class="rain-bg-canvas"></canvas>
      <canvas class="rain-canvas"></canvas>
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">0점</div>
        <div class="rain-lives">${'❤️'.repeat(GAME.lives)}</div>
        <div class="rain-level">Lv.1</div>
      </div>
      <button class="exit-btn">✕</button>
    </div>
  `;

  document.body.classList.add('playing');
  enterFullscreen();
  resumeAudio();

  const rainCanvas = app.querySelector('.rain-canvas');
  const particleCanvas = app.querySelector('.play-canvas');
  const effectsContainer = app.querySelector('.play-effects');
  const exitBtn = app.querySelector('.exit-btn');
  const scoreEl = app.querySelector('.rain-score');
  const livesEl = app.querySelector('.rain-lives');
  const levelEl = app.querySelector('.rain-level');

  const rainCtx = rainCanvas.getContext('2d');
  engine = new ParticleEngine(particleCanvas);

  function resize() {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
    if (engine) engine.resize();
  }
  resize();
  window.addEventListener('resize', resize);

  // Game state
  const state = {
    fallingLetters: [],
    score: 0,
    lives: GAME.lives,
    level: 1,
    hits: 0,
    speed: DIFFICULTY.initialSpeed,
    spawnInterval: DIFFICULTY.initialSpawnInterval,
    maxSimultaneous: DIFFICULTY.maxSimultaneous,
    lastSpawnTime: 0,
    gameOver: false,
    combo: 0,
  };

  const particleConfig = {
    colors: COLORS,
    shapes: ['circle', 'star', 'heart'],
  };

  // Spawn a new falling letter
  function spawnLetter(now) {
    if (state.fallingLetters.length >= state.maxSimultaneous) return;

    // Avoid duplicate letters on screen
    const onScreen = new Set(state.fallingLetters.map((l) => l.code));
    const available = letters.filter((l) => !onScreen.has(l.code));
    if (available.length === 0) return;

    const letter = available[Math.floor(Math.random() * available.length)];
    const padding = 80;
    const x = padding + Math.random() * (window.innerWidth - padding * 2);

    state.fallingLetters.push({
      ...letter,
      x,
      y: -40,
      speed: state.speed,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 56,
    });

    state.lastSpawnTime = now;
  }

  // Check difficulty progression
  function checkLevelUp() {
    if (state.hits > 0 && state.hits % DIFFICULTY.speedUpEvery === 0) {
      state.level = Math.floor(state.hits / DIFFICULTY.speedUpEvery) + 1;
      state.speed = Math.min(
        DIFFICULTY.maxSpeed,
        DIFFICULTY.initialSpeed + state.level * DIFFICULTY.speedIncrement,
      );
      state.spawnInterval = Math.max(
        DIFFICULTY.minSpawnInterval,
        DIFFICULTY.initialSpawnInterval - state.level * DIFFICULTY.spawnDecrement,
      );
      state.maxSimultaneous = Math.min(
        DIFFICULTY.maxSimultaneousMax,
        DIFFICULTY.maxSimultaneous + (state.level % 3 === 0 ? 1 : 0),
      );

      levelEl.textContent = `Lv.${state.level}`;

      // Level up celebration
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      spawnTextPop(effectsContainer, `⭐ Level ${state.level}!`, cx, cy);
      engine.spawn(cx, cy, { ...particleConfig, count: 40, speed: 10 });
    }

    // Bonus life
    if (state.hits > 0 && state.hits % GAME.bonusLifeEvery === 0 && state.lives < GAME.lives) {
      state.lives++;
      updateHUD();
      spawnTextPop(effectsContainer, '❤️ +1', window.innerWidth / 2, window.innerHeight / 2);
    }
  }

  function updateHUD() {
    scoreEl.textContent = `${state.score}점`;
    livesEl.textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(GAME.lives - state.lives);
  }

  // Key handler
  function onKey(e) {
    if (state.gameOver) return;

    const code = e.code;

    // Find the lowest (most urgent) matching letter
    let bestIdx = -1;
    let bestY = -1;
    for (let i = 0; i < state.fallingLetters.length; i++) {
      const fl = state.fallingLetters[i];
      if (fl.code === code && fl.y > bestY) {
        bestIdx = i;
        bestY = fl.y;
      }
    }

    if (bestIdx >= 0) {
      const fl = state.fallingLetters[bestIdx];
      state.fallingLetters.splice(bestIdx, 1);

      state.score += 10 + state.combo * 2;
      state.hits++;
      state.combo++;

      // Effects
      spawnTextPop(effectsContainer, fl.label, fl.x, fl.y);
      engine.spawn(fl.x, fl.y, { ...particleConfig, count: 30, speed: 8 });
      playThemeSound(isKorean ? 'korean' : 'english', (state.hits % 12) + 1);

      if (state.combo >= 3) {
        playFirework();
        spawnEmojiBurst(effectsContainer, ['🔥', '⭐', '✨'], fl.x, fl.y, 6);
      }

      checkLevelUp();
      updateHUD();
    }
  }

  // Miss a letter
  function missLetter(fl) {
    state.lives--;
    state.combo = 0;
    updateHUD();

    // Red flash
    const flashEl = document.createElement('div');
    flashEl.className = 'screen-flash';
    flashEl.style.background = 'rgba(255, 0, 0, 0.3)';
    effectsContainer.appendChild(flashEl);
    flashEl.addEventListener('animationend', () => flashEl.remove());

    if (state.lives <= 0) {
      gameOver();
    }
  }

  function gameOver() {
    state.gameOver = true;
    cancelAnimationFrame(animId);

    // Save high score
    const key = `letterRain_${mode}_highScore`;
    const prevHigh = parseInt(localStorage.getItem(key) || '0');
    const isNewHigh = state.score > prevHigh;
    if (isNewHigh) localStorage.setItem(key, state.score);

    // Celebration particles
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { ...particleConfig, count: 60, speed: 10 });

    // Game over overlay
    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${isNewHigh ? '🎉 새 기록!' : '👏 잘했어요!'}</h2>
        <p class="rain-final-score">${state.score}점</p>
        <p class="rain-high-score">최고 기록: ${Math.max(state.score, prevHigh)}점</p>
        <p class="rain-stats">레벨 ${state.level} · ${state.hits}개 맞춤</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.letter-rain').appendChild(overlay);

    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => {
      cleanup();
      renderLetterRain(app, mode, onExit);
    });
    overlay.querySelector('.rain-home-btn').addEventListener('click', () => {
      cleanup();
      onExit();
    });
  }

  // Game loop
  let lastTime = 0;
  function gameLoop(timestamp) {
    if (state.gameOver) return;

    const delta = lastTime ? (timestamp - lastTime) / 16.67 : 1;
    lastTime = timestamp;

    // Spawn
    if (timestamp - state.lastSpawnTime > state.spawnInterval) {
      spawnLetter(timestamp);
    }

    // Update
    const w = rainCanvas.width;
    const h = rainCanvas.height;
    rainCtx.clearRect(0, 0, w, h);

    for (let i = state.fallingLetters.length - 1; i >= 0; i--) {
      const fl = state.fallingLetters[i];
      fl.y += fl.speed * delta;

      // Draw background circle
      rainCtx.save();
      rainCtx.beginPath();
      rainCtx.arc(fl.x, fl.y, fl.size * 0.7, 0, Math.PI * 2);
      rainCtx.fillStyle = 'rgba(255,255,255,0.25)';
      rainCtx.fill();

      // Draw letter
      rainCtx.font = `bold ${fl.size}px Jua, sans-serif`;
      rainCtx.fillStyle = fl.color;
      rainCtx.textAlign = 'center';
      rainCtx.textBaseline = 'middle';
      rainCtx.fillText(fl.display, fl.x, fl.y);
      rainCtx.restore();

      // Missed
      if (fl.y > h + 20) {
        state.fallingLetters.splice(i, 1);
        missLetter(fl);
      }
    }

    animId = requestAnimationFrame(gameLoop);
  }

  // Key capture - use raw keydown to get event.code
  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    onKey(e);
  }
  document.addEventListener('keydown', handleKeyDown, true);

  // Click/touch = random letter hit (help for younger kids)
  const playEl = app.querySelector('.letter-rain');
  playEl.addEventListener('click', (e) => {
    if (e.target === exitBtn) return;
    if (state.gameOver) return;
    if (state.fallingLetters.length === 0) return;

    // Hit the lowest letter
    let lowestIdx = 0;
    for (let i = 1; i < state.fallingLetters.length; i++) {
      if (state.fallingLetters[i].y > state.fallingLetters[lowestIdx].y) {
        lowestIdx = i;
      }
    }
    const fl = state.fallingLetters[lowestIdx];
    onKey({ code: fl.code });
  });

  function cleanup() {
    cancelAnimationFrame(animId);
    document.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('resize', resize);
    if (engine) {
      engine.destroy();
      engine = null;
    }
    document.body.classList.remove('playing');
    exitFullscreen();
  }

  exitBtn.addEventListener('click', () => {
    cleanup();
    onExit();
  });

  // Cursor hide
  let cursorTimer = null;
  function showCursor() {
    document.body.classList.remove('cursor-hidden');
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => {
      document.body.classList.add('cursor-hidden');
    }, 2000);
  }
  playEl.addEventListener('mousemove', showCursor);
  showCursor();

  // Start
  animId = requestAnimationFrame(gameLoop);
}
