import { ParticleEngine } from '../systems/particles.js';
import { spawnTextPop } from '../systems/effects.js';
import { enterFullscreen, exitFullscreen } from '../systems/fullscreen.js';
import { resumeAudio } from '../systems/sounds.js';
import { KEY_TO_NOTE, DIGIT_NOTES, PIANO_COLORS } from '../data/piano-config.js';

let engine = null;
let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playNote(freq) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
}

export function renderPiano(app, onExit) {
  app.innerHTML = `
    <div class="piano-screen">
      <canvas class="play-canvas"></canvas>
      <div class="play-effects"></div>
      <div class="piano-display"></div>
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

  function triggerNote(code, x, y) {
    const note = KEY_TO_NOTE[code];
    if (!note) return;

    playNote(note.freq);
    spawnTextPop(effectsContainer, `🎵 ${note.name}`, x, y);
    engine.spawn(x, y, {
      colors: [note.color, '#FFFFFF'],
      shapes: ['circle', 'star'],
      count: 20,
      speed: 6,
    });
  }

  function triggerDigitNote(digit, x, y) {
    const note = DIGIT_NOTES[digit];
    if (!note) return;

    playNote(note.freq);
    spawnTextPop(effectsContainer, `🎶 ${note.name}`, x, y);
    engine.spawn(x, y, {
      colors: PIANO_COLORS,
      shapes: ['circle', 'star', 'heart'],
      count: 30,
      speed: 8,
    });
  }

  function handleKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();

    const x = Math.random() * (window.innerWidth * 0.6) + window.innerWidth * 0.2;
    const y = Math.random() * (window.innerHeight * 0.5) + window.innerHeight * 0.1;

    if (KEY_TO_NOTE[e.code]) {
      triggerNote(e.code, x, y);
    } else if (e.code.startsWith('Digit')) {
      const d = parseInt(e.code.replace('Digit', ''));
      triggerDigitNote(d, x, y);
    } else if (e.key === ' ' || e.key === 'Enter') {
      // Big chord
      playNote(261.63);
      playNote(329.63);
      playNote(392.00);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      spawnTextPop(effectsContainer, '🎹 짜잔!', cx, cy);
      engine.spawn(cx, cy, { colors: PIANO_COLORS, shapes: ['circle', 'star', 'heart'], count: 60, speed: 12 });
    } else {
      // Any other key = random note
      const keys = Object.keys(KEY_TO_NOTE);
      const rk = keys[Math.floor(Math.random() * keys.length)];
      triggerNote(rk, x, y);
    }
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // Touch/click
  const playEl = app.querySelector('.piano-screen');
  playEl.addEventListener('click', (e) => {
    if (e.target === exitBtn) return;
    const keys = Object.keys(KEY_TO_NOTE);
    const rk = keys[Math.floor(Math.random() * keys.length)];
    triggerNote(rk, e.clientX, e.clientY);
  });

  // Cursor hide
  let cursorTimer = null;
  playEl.addEventListener('mousemove', () => {
    document.body.classList.remove('cursor-hidden');
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => document.body.classList.add('cursor-hidden'), 2000);
  });

  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown, true);
    if (engine) { engine.destroy(); engine = null; }
    document.body.classList.remove('playing');
    exitFullscreen();
  }

  exitBtn.addEventListener('click', () => { cleanup(); onExit(); });
}
