import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { LETTER_SETS } from '../data/balloon-pop-config.js';
import { BALLOON, BALLOON_COLORS } from '../data/balloon-pop-config.js';

let engine = null;
let animId = null;

export function renderBalloonPop(app, mode, onExit) {
  const letters = LETTER_SETS[mode];

  app.innerHTML = `
    <div class="balloon-screen">
      <canvas class="rain-canvas"></canvas>
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">0개</div>
        <div class="rain-level">⏱️ ${BALLOON.gameDuration}초</div>
      </div>
      <button class="exit-btn">✕</button>
    </div>
  `;

  document.body.classList.add('playing');
  enterFullscreen();
  resumeAudio();

  const balloonCanvas = app.querySelector('.rain-canvas');
  const particleCanvas = app.querySelector('.play-canvas');
  const effectsContainer = app.querySelector('.play-effects');
  const exitBtn = app.querySelector('.exit-btn');
  const scoreEl = app.querySelector('.rain-score');
  const timerEl = app.querySelector('.rain-level');

  const bCtx = balloonCanvas.getContext('2d');
  engine = new ParticleEngine(particleCanvas);

  function resize() {
    balloonCanvas.width = window.innerWidth;
    balloonCanvas.height = window.innerHeight;
    if (engine) engine.resize();
  }
  resize();
  window.addEventListener('resize', resize);

  const state = {
    balloons: [],
    score: 0,
    combo: 0,
    speed: BALLOON.floatSpeed,
    spawnInterval: BALLOON.spawnInterval,
    maxSimultaneous: BALLOON.maxSimultaneous,
    lastSpawnTime: 0,
    startTime: performance.now(),
    timeLeft: BALLOON.gameDuration,
    gameOver: false,
    hits: 0,
  };

  const particleConfig = { colors: BALLOON_COLORS, shapes: ['circle', 'star', 'heart'] };

  function spawnBalloon(now) {
    if (state.balloons.length >= state.maxSimultaneous) return;
    const onScreen = new Set(state.balloons.map((b) => b.code));
    const available = letters.filter((l) => !onScreen.has(l.code));
    if (available.length === 0) return;

    const letter = available[Math.floor(Math.random() * available.length)];
    const padding = 80;
    const x = padding + Math.random() * (window.innerWidth - padding * 2);
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

    state.balloons.push({
      ...letter,
      x,
      y: window.innerHeight + 40,
      baseX: x,
      speed: state.speed,
      color,
      size: BALLOON.balloonSize,
      wobbleOffset: Math.random() * Math.PI * 2,
    });
    state.lastSpawnTime = now;
  }

  function popBalloon(idx) {
    const b = state.balloons[idx];
    state.balloons.splice(idx, 1);
    state.score++;
    state.hits++;
    state.combo++;

    spawnTextPop(effectsContainer, b.label || b.display, b.x, b.y);
    engine.spawn(b.x, b.y, { ...particleConfig, count: 30, speed: 8 });
    playThemeSound(mode === 'korean' ? 'korean' : 'english', (state.hits % 12) + 1);

    if (state.combo >= 3) {
      playFirework();
      spawnEmojiBurst(effectsContainer, ['🎈', '💥', '⭐'], b.x, b.y, 6);
    }

    // Difficulty
    if (state.hits > 0 && state.hits % BALLOON.speedUpEvery === 0) {
      state.speed = Math.min(BALLOON.maxSpeed, state.speed + BALLOON.speedIncrement);
      state.spawnInterval = Math.max(BALLOON.minSpawnInterval, state.spawnInterval - BALLOON.spawnDecrement);
      state.maxSimultaneous = Math.min(BALLOON.maxSimultaneousMax, state.maxSimultaneous + 1);
    }

    scoreEl.textContent = `${state.score}개`;
  }

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.gameOver) return;

    // Find highest balloon (closest to top = most urgent) matching this key
    let bestIdx = -1;
    let bestY = Infinity;
    for (let i = 0; i < state.balloons.length; i++) {
      if (state.balloons[i].code === e.code && state.balloons[i].y < bestY) {
        bestIdx = i;
        bestY = state.balloons[i].y;
      }
    }
    if (bestIdx >= 0) {
      popBalloon(bestIdx);
    } else {
      state.combo = 0;
    }
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // Touch: find closest balloon to tap position
  const playEl = app.querySelector('.balloon-screen');
  playEl.addEventListener('click', (e) => {
    if (e.target === exitBtn || state.gameOver) return;
    if (state.balloons.length === 0) return;

    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < state.balloons.length; i++) {
      const b = state.balloons[i];
      const dist = Math.hypot(e.clientX - b.x, e.clientY - b.y);
      if (dist < b.size * 1.2 && dist < bestDist) {
        bestIdx = i;
        bestDist = dist;
      }
    }
    if (bestIdx >= 0) popBalloon(bestIdx);
  });

  function gameOver() {
    state.gameOver = true;
    cancelAnimationFrame(animId);

    const key = `balloonPop_${mode}_highScore`;
    const prevHigh = parseInt(localStorage.getItem(key) || '0');
    const isNewHigh = state.score > prevHigh;
    if (isNewHigh) localStorage.setItem(key, state.score);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { ...particleConfig, count: 60, speed: 10 });

    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${isNewHigh ? '🎉 새 기록!' : '👏 잘했어요!'}</h2>
        <p class="rain-final-score">${state.score}개</p>
        <p class="rain-high-score">최고 기록: ${Math.max(state.score, prevHigh)}개</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.balloon-screen').appendChild(overlay);

    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => {
      cleanup();
      renderBalloonPop(app, mode, onExit);
    });
    overlay.querySelector('.rain-home-btn').addEventListener('click', () => {
      cleanup();
      onExit();
    });
  }

  let lastTime = 0;
  function gameLoop(timestamp) {
    if (state.gameOver) return;

    const delta = lastTime ? (timestamp - lastTime) / 16.67 : 1;
    lastTime = timestamp;

    // Timer
    const elapsed = (timestamp - state.startTime) / 1000;
    state.timeLeft = Math.max(0, BALLOON.gameDuration - elapsed);
    timerEl.textContent = `⏱️ ${Math.ceil(state.timeLeft)}초`;

    if (state.timeLeft <= 0) { gameOver(); return; }

    // Spawn
    if (timestamp - state.lastSpawnTime > state.spawnInterval) spawnBalloon(timestamp);

    // Draw
    const w = balloonCanvas.width;
    const h = balloonCanvas.height;
    bCtx.clearRect(0, 0, w, h);

    for (let i = state.balloons.length - 1; i >= 0; i--) {
      const b = state.balloons[i];
      b.y -= b.speed * delta;
      const wobble = Math.sin(timestamp / 500 + b.wobbleOffset) * 15;
      const drawX = b.baseX + wobble;
      b.x = drawX;

      // Balloon body
      bCtx.save();
      bCtx.fillStyle = b.color;
      bCtx.beginPath();
      bCtx.ellipse(drawX, b.y, b.size * 0.45, b.size * 0.55, 0, 0, Math.PI * 2);
      bCtx.fill();

      // Balloon knot
      bCtx.beginPath();
      bCtx.moveTo(drawX - 5, b.y + b.size * 0.55);
      bCtx.lineTo(drawX, b.y + b.size * 0.65);
      bCtx.lineTo(drawX + 5, b.y + b.size * 0.55);
      bCtx.fillStyle = b.color;
      bCtx.fill();

      // String
      bCtx.strokeStyle = '#999';
      bCtx.lineWidth = 1;
      bCtx.beginPath();
      bCtx.moveTo(drawX, b.y + b.size * 0.65);
      bCtx.lineTo(drawX + wobble * 0.3, b.y + b.size * 1.1);
      bCtx.stroke();

      // Letter
      bCtx.font = `bold ${b.size * 0.4}px Jua, sans-serif`;
      bCtx.fillStyle = '#FFFFFF';
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.fillText(b.display, drawX, b.y);
      bCtx.restore();

      // Missed (floated off top)
      if (b.y < -60) {
        state.balloons.splice(i, 1);
        state.combo = 0;
      }
    }

    animId = requestAnimationFrame(gameLoop);
  }

  function cleanup() {
    cancelAnimationFrame(animId);
    document.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('resize', resize);
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

  animId = requestAnimationFrame(gameLoop);
}
