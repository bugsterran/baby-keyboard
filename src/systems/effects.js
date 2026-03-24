export function spawnTextPop(container, text, x, y) {
  const el = document.createElement('div');
  el.className = 'text-pop';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

export function spawnEmojiBurst(container, emojis, x, y, count = 8) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'emoji-burst';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const angle = (Math.PI * 2 * i) / count;
    const dist = 80 + Math.random() * 120;
    el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
    el.style.setProperty('--ty', `${Math.sin(angle) * dist - 60}px`);
    el.style.animationDelay = `${Math.random() * 0.1}s`;

    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

export function flashScreen(container) {
  const el = document.createElement('div');
  el.className = 'screen-flash';

  const hue = Math.floor(Math.random() * 360);
  el.style.background = `hsla(${hue}, 80%, 60%, 0.4)`;

  container.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
