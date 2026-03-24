import { initKeyCapture, destroyKeyCapture } from '../systems/keys.js';
import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop, spawnEmojiBurst, flashScreen } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio, playThemeSound, playFirework, playSwoosh } from '../systems/sounds.js';

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

  document.body.classList.add('playing');
  enterFullscreen();
  resumeAudio();

  const canvas = app.querySelector('.play-canvas');
  const effectsContainer = app.querySelector('.play-effects');
  const exitBtn = app.querySelector('.exit-btn');

  engine = new ParticleEngine(canvas);

  const particleConfig = {
    colors: theme.particleColors,
    shapes: theme.particleShapes,
  };

  function triggerEffect(x, y, key) {
    if (key && /^[a-zA-Z]$/.test(key)) {
      const index = key.toUpperCase().charCodeAt(0) - 65;
      const entry = theme.letters[index % theme.letters.length];
      spawnTextPop(effectsContainer, entry, x, y);
      engine.spawn(x, y, { ...particleConfig, count: 25 });
      playThemeSound(theme.id, (index % 12) + 1);
    } else if (key && /^[0-9]$/.test(key)) {
      const entry = theme.digits[parseInt(key)];
      spawnTextPop(effectsContainer, entry, x, y);
      engine.spawn(x, y, { ...particleConfig, count: 25 });
      playThemeSound(theme.id, parseInt(key) + 1);
    } else if (key === ' ') {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      engine.spawn(cx, cy, { ...particleConfig, count: 80, speed: 12 });
      spawnEmojiBurst(effectsContainer, ['🎆', '🎇', '✨', '💫', '⭐'], cx, cy, 12);
      playFirework();
    } else if (key === 'Enter') {
      flashScreen(effectsContainer);
      for (let i = 0; i < 5; i++) {
        const rx = Math.random() * window.innerWidth;
        engine.spawn(rx, 0, { ...particleConfig, count: 20, speed: 6 });
      }
      playSwoosh();
    } else {
      // Other keys or mouse click
      const allItems = [...theme.letters, ...theme.digits];
      const entry = allItems[Math.floor(Math.random() * allItems.length)];
      spawnTextPop(effectsContainer, entry, x, y);
      engine.spawn(x, y, { ...particleConfig, count: key ? 15 : 25 });
      playThemeSound(theme.id, Math.floor(Math.random() * 10) + 1);
    }
  }

  function onKey(e) {
    triggerEffect(randomX(), randomY(), e.key);
  }

  function handleExit() {
    destroyKeyCapture();
    if (engine) {
      engine.destroy();
      engine = null;
    }
    document.body.classList.remove('playing');
    exitFullscreen();
    onExit();
  }

  exitBtn.addEventListener('click', handleExit);

  // Mouse/touch click
  const playEl = app.querySelector('.play');
  playEl.addEventListener('click', (e) => {
    if (e.target === exitBtn) return;
    triggerEffect(e.clientX, e.clientY, null);
  });

  // Hide cursor after 2s of no mouse movement
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

  // Ensure keyboard focus
  document.body.focus();
  playEl.setAttribute('tabindex', '-1');
  playEl.focus();

  initKeyCapture(onKey, null, null);

  window.addEventListener('resize', () => {
    if (engine) engine.resize();
  });
}
