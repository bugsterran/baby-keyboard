import { initKeyCapture, destroyKeyCapture } from '../systems/keys.js';
import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst, flashScreen } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';

let engine = null;

function randomX() {
  return Math.random() * (window.innerWidth * 0.7) + window.innerWidth * 0.15;
}

function randomY() {
  return Math.random() * (window.innerHeight * 0.5) + window.innerHeight * 0.15;
}

export function renderPlay(app, theme, onExit) {
  app.innerHTML = `
    <div class="play" style="background: ${theme.background}">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <button class="exit-btn">✕</button>
    </div>
  `;

  enterFullscreen();

  const canvas = app.querySelector('.play-canvas');
  const effectsContainer = app.querySelector('.play-effects');
  const exitBtn = app.querySelector('.exit-btn');

  engine = new ParticleEngine(canvas);

  const particleConfig = {
    colors: theme.particleColors,
    shapes: theme.particleShapes,
  };

  function onKey(e) {
    const key = e.key;
    const x = randomX();
    const y = randomY();

    if (/^[a-zA-Z]$/.test(key)) {
      const index = key.toUpperCase().charCodeAt(0) - 65;
      const entry = theme.letters[index % theme.letters.length];
      spawnTextPop(effectsContainer, entry, x, y);
      engine.spawn(x, y, { ...particleConfig, count: 25 });
    } else if (/^[0-9]$/.test(key)) {
      const entry = theme.digits[parseInt(key)];
      spawnTextPop(effectsContainer, entry, x, y);
      engine.spawn(x, y, { ...particleConfig, count: 25 });
    } else if (key === ' ') {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      engine.spawn(cx, cy, { ...particleConfig, count: 80, speed: 12 });
      spawnEmojiBurst(effectsContainer, ['🎆', '🎇', '✨', '💫', '⭐'], cx, cy, 12);
    } else if (key === 'Enter') {
      flashScreen(effectsContainer);
      for (let i = 0; i < 5; i++) {
        const rx = Math.random() * window.innerWidth;
        engine.spawn(rx, 0, { ...particleConfig, count: 20, speed: 6 });
      }
    } else {
      const allItems = [...theme.letters, ...theme.digits];
      const entry = allItems[Math.floor(Math.random() * allItems.length)];
      spawnTextPop(effectsContainer, entry, x, y);
      engine.spawn(x, y, { ...particleConfig, count: 15 });
    }
  }

  function handleExit() {
    destroyKeyCapture();
    if (engine) {
      engine.destroy();
      engine = null;
    }
    exitFullscreen();
    onExit();
  }

  exitBtn.addEventListener('click', handleExit);

  // Mouse/touch click → random effect at click position (except exit button)
  const playEl = app.querySelector('.play');
  playEl.addEventListener('click', (e) => {
    if (e.target === exitBtn) return;
    const x = e.clientX;
    const y = e.clientY;
    const allItems = [...theme.letters, ...theme.digits];
    const entry = allItems[Math.floor(Math.random() * allItems.length)];
    spawnTextPop(effectsContainer, entry, x, y);
    engine.spawn(x, y, { ...particleConfig, count: 25 });
  });

  // Ensure keyboard focus is on the page
  document.body.focus();
  playEl.setAttribute('tabindex', '-1');
  playEl.focus();

  initKeyCapture(onKey, null, null);

  window.addEventListener('resize', () => {
    if (engine) engine.resize();
  });
}
