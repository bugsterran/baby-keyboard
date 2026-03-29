import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework } from '../systems/sounds.js';
import { LANES, DIFFICULTY } from '../data/rhythm-config.js';

let engine = null;
let animId = null;

export function renderRhythm(app, onExit) {
  app.innerHTML = `
    <div class="rhythm-screen">
      <canvas class="rain-canvas"></canvas>
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="rain-hud">
        <div class="rain-score">0점</div>
        <div class="rain-level">콤보: 0</div>
      </div>
      <div class="rhythm-line"></div>
      <div class="rhythm-keys">
        ${LANES.map((l) => `<div class="rhythm-key" data-code="${l.code}" style="border-color:${l.color}">${l.display}</div>`).join('')}
      </div>
      <button class="exit-btn">✕</button>
    </div>
  `;

  document.body.classList.add('playing');
  enterFullscreen();
  resumeAudio();

  const noteCanvas = app.querySelector('.rain-canvas');
  const particleCanvas = app.querySelector('.play-canvas');
  const effectsContainer = app.querySelector('.play-effects');
  const exitBtn = app.querySelector('.exit-btn');
  const scoreEl = app.querySelector('.rain-score');
  const comboEl = app.querySelector('.rain-level');

  const nCtx = noteCanvas.getContext('2d');
  engine = new ParticleEngine(particleCanvas);

  function resize() {
    noteCanvas.width = window.innerWidth;
    noteCanvas.height = window.innerHeight;
    if (engine) engine.resize();
  }
  resize();
  window.addEventListener('resize', resize);

  const hitLineY = window.innerHeight * 0.85;

  const state = {
    notes: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    speed: DIFFICULTY.noteSpeed,
    lastSpawnTime: 0,
    gameOver: false,
    startTime: performance.now(),
  };

  const spawnInterval = (60 / DIFFICULTY.bpm) * 1000;

  function spawnNote(timestamp) {
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    state.notes.push({
      ...lane,
      y: -30,
      speed: state.speed,
      hit: false,
    });
    state.lastSpawnTime = timestamp;
  }

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.gameOver) return;

    const code = e.code;
    const lane = LANES.find((l) => l.code === code);
    if (!lane) return;

    // Flash key
    const keyEl = app.querySelector(`.rhythm-key[data-code="${code}"]`);
    if (keyEl) {
      keyEl.classList.add('rhythm-key-active');
      setTimeout(() => keyEl.classList.remove('rhythm-key-active'), 150);
    }

    // Find closest note in this lane near hit line
    let bestIdx = -1;
    let bestDist = 60; // tolerance in pixels
    for (let i = 0; i < state.notes.length; i++) {
      const n = state.notes[i];
      if (n.code === code && !n.hit) {
        const dist = Math.abs(n.y - hitLineY);
        if (dist < bestDist) {
          bestIdx = i;
          bestDist = dist;
        }
      }
    }

    if (bestIdx >= 0) {
      const n = state.notes[bestIdx];
      n.hit = true;
      state.combo++;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.hits++;

      const points = bestDist < 20 ? 30 : bestDist < 40 ? 20 : 10;
      const label = bestDist < 20 ? '✨ Perfect!' : bestDist < 40 ? '⭐ Great!' : '👍 Good!';
      state.score += points + state.combo;
      scoreEl.textContent = `${state.score}점`;
      comboEl.textContent = `콤보: ${state.combo}`;

      const nx = lane.x * window.innerWidth;
      spawnTextPop(effectsContainer, label, nx, hitLineY - 40);
      engine.spawn(nx, hitLineY, { colors: [lane.color, '#FFFFFF'], shapes: ['circle', 'star'], count: 15, speed: 5 });
      playThemeSound('music', (state.hits % 12) + 1);

      if (state.combo > 0 && state.combo % 10 === 0) playFirework();

      // Speed up
      if (state.hits % DIFFICULTY.speedUpEvery === 0) {
        state.speed = Math.min(DIFFICULTY.maxSpeed, state.speed + DIFFICULTY.speedIncrement);
      }
    } else {
      state.combo = 0;
      comboEl.textContent = `콤보: 0`;
    }
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // Touch support
  app.querySelectorAll('.rhythm-key').forEach((el) => {
    el.addEventListener('click', () => {
      handleKeyDown({ code: el.dataset.code, preventDefault() {}, stopPropagation() {} });
    });
  });

  let lastTime = 0;
  function gameLoop(timestamp) {
    if (state.gameOver) return;

    const delta = lastTime ? (timestamp - lastTime) / 16.67 : 1;
    lastTime = timestamp;

    // 60 second game
    const elapsed = (timestamp - state.startTime) / 1000;
    if (elapsed >= 60) { gameComplete(); return; }

    // Spawn
    if (timestamp - state.lastSpawnTime > spawnInterval) spawnNote(timestamp);

    // Draw
    const w = noteCanvas.width;
    const h = noteCanvas.height;
    nCtx.clearRect(0, 0, w, h);

    // Hit line
    nCtx.strokeStyle = 'rgba(255,255,255,0.3)';
    nCtx.lineWidth = 2;
    nCtx.beginPath();
    nCtx.moveTo(0, hitLineY);
    nCtx.lineTo(w, hitLineY);
    nCtx.stroke();

    // Lane guides
    LANES.forEach((lane) => {
      const x = lane.x * w;
      nCtx.strokeStyle = `${lane.color}22`;
      nCtx.lineWidth = 40;
      nCtx.beginPath();
      nCtx.moveTo(x, 0);
      nCtx.lineTo(x, h);
      nCtx.stroke();
    });

    // Notes
    for (let i = state.notes.length - 1; i >= 0; i--) {
      const n = state.notes[i];
      if (n.hit) { state.notes.splice(i, 1); continue; }

      n.y += n.speed * delta;
      const x = n.x * w;

      nCtx.save();
      nCtx.beginPath();
      nCtx.arc(x, n.y, 22, 0, Math.PI * 2);
      nCtx.fillStyle = n.color;
      nCtx.fill();
      nCtx.font = 'bold 16px Jua, sans-serif';
      nCtx.fillStyle = '#FFF';
      nCtx.textAlign = 'center';
      nCtx.textBaseline = 'middle';
      nCtx.fillText(n.display, x, n.y);
      nCtx.restore();

      // Missed
      if (n.y > h + 30) {
        state.notes.splice(i, 1);
        state.misses++;
        state.combo = 0;
        comboEl.textContent = `콤보: 0`;
      }
    }

    animId = requestAnimationFrame(gameLoop);
  }

  function gameComplete() {
    state.gameOver = true;
    cancelAnimationFrame(animId);

    const key = 'rhythm_best';
    const prevBest = parseInt(localStorage.getItem(key) || '0');
    const isNewBest = state.score > prevBest;
    if (isNewBest) localStorage.setItem(key, state.score);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    engine.spawn(cx, cy, { colors: LANES.map((l) => l.color), shapes: ['circle', 'star', 'heart'], count: 60, speed: 10 });
    playFirework();

    const overlay = document.createElement('div');
    overlay.className = 'rain-gameover';
    overlay.innerHTML = `
      <div class="rain-gameover-box">
        <h2>${isNewBest ? '🎉 새 기록!' : '👏 잘했어요!'}</h2>
        <p class="rain-final-score">${state.score}점</p>
        <p class="rain-high-score">최고: ${Math.max(state.score, prevBest)}점 · 최대콤보: ${state.maxCombo}</p>
        <p class="rain-stats">${state.hits}히트 · ${state.misses}미스</p>
        <div class="rain-gameover-btns">
          <button class="rain-retry-btn">다시 하기 🔄</button>
          <button class="rain-home-btn">홈으로 🏠</button>
        </div>
      </div>
    `;
    app.querySelector('.rhythm-screen').appendChild(overlay);
    overlay.querySelector('.rain-retry-btn').addEventListener('click', () => { cleanup(); renderRhythm(app, onExit); });
    overlay.querySelector('.rain-home-btn').addEventListener('click', () => { cleanup(); onExit(); });
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
  app.querySelector('.rhythm-screen').addEventListener('mousemove', () => {
    document.body.classList.remove('cursor-hidden');
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => document.body.classList.add('cursor-hidden'), 2000);
  });

  animId = requestAnimationFrame(gameLoop);
}
