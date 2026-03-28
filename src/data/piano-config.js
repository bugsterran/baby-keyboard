// C major pentatonic scale across 2 octaves mapped to A-Z keys
const NOTE_NAMES = ['도', '레', '미', '솔', '라', '높은도', '높은레', '높은미', '높은솔', '높은라'];
const NOTE_EMOJIS = ['🎵', '🎶', '🎵', '🎶', '🎵', '🎶', '🎵', '🎶', '🎵', '🎶'];

export const KEY_TO_NOTE = {
  KeyA: { freq: 261.63, name: '도', color: '#FF6B6B' },
  KeyB: { freq: 293.66, name: '레', color: '#FF9800' },
  KeyC: { freq: 329.63, name: '미', color: '#FFC107' },
  KeyD: { freq: 392.00, name: '솔', color: '#4CAF50' },
  KeyE: { freq: 440.00, name: '라', color: '#2196F3' },
  KeyF: { freq: 523.25, name: '높은도', color: '#9C27B0' },
  KeyG: { freq: 587.33, name: '높은레', color: '#E91E63' },
  KeyH: { freq: 659.25, name: '높은미', color: '#FF5722' },
  KeyI: { freq: 783.99, name: '높은솔', color: '#00BCD4' },
  KeyJ: { freq: 880.00, name: '높은라', color: '#8BC34A' },
  KeyK: { freq: 261.63, name: '도', color: '#FF6B6B' },
  KeyL: { freq: 293.66, name: '레', color: '#FF9800' },
  KeyM: { freq: 329.63, name: '미', color: '#FFC107' },
  KeyN: { freq: 392.00, name: '솔', color: '#4CAF50' },
  KeyO: { freq: 440.00, name: '라', color: '#2196F3' },
  KeyP: { freq: 523.25, name: '높은도', color: '#9C27B0' },
  KeyQ: { freq: 587.33, name: '높은레', color: '#E91E63' },
  KeyR: { freq: 659.25, name: '높은미', color: '#FF5722' },
  KeyS: { freq: 783.99, name: '높은솔', color: '#00BCD4' },
  KeyT: { freq: 880.00, name: '높은라', color: '#8BC34A' },
  KeyU: { freq: 261.63, name: '도', color: '#FF6B6B' },
  KeyV: { freq: 293.66, name: '레', color: '#FF9800' },
  KeyW: { freq: 329.63, name: '미', color: '#FFC107' },
  KeyX: { freq: 392.00, name: '솔', color: '#4CAF50' },
  KeyY: { freq: 440.00, name: '라', color: '#2196F3' },
  KeyZ: { freq: 523.25, name: '높은도', color: '#9C27B0' },
};

// Number keys = fun sound effects (higher octave)
export const DIGIT_NOTES = [
  { freq: 523.25, name: '도!' },
  { freq: 587.33, name: '레!' },
  { freq: 659.25, name: '미!' },
  { freq: 698.46, name: '파!' },
  { freq: 783.99, name: '솔!' },
  { freq: 880.00, name: '라!' },
  { freq: 987.77, name: '시!' },
  { freq: 1046.50, name: '높은도!' },
  { freq: 1174.66, name: '높은레!' },
  { freq: 1318.51, name: '높은미!' },
];

export const PIANO_COLORS = ['#FF6B6B', '#FF9800', '#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63'];
