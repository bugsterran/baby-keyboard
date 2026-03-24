import { themes } from '../data/themes.js';

export function renderHome(app, onStart) {
  let selectedTheme = themes[0];

  app.innerHTML = `
    <div class="home">
      <h1 class="home-title">🎹 아기 키보드 놀이터</h1>
      <p class="home-subtitle">테마를 골라주세요!</p>
      <div class="theme-grid">
        ${themes
          .map(
            (t, i) => `
          <button class="theme-card ${i === 0 ? 'selected' : ''}" data-index="${i}">
            <span class="theme-icon">${t.icon}</span>
            <span class="theme-name">${t.name}</span>
            <span class="theme-desc">${t.description}</span>
          </button>
        `,
          )
          .join('')}
      </div>
      <button class="start-btn">시작하기! 🚀</button>
      <p class="home-hint">종료: 오른쪽 위 ✕ 버튼</p>
    </div>
  `;

  // Theme selection
  app.querySelectorAll('.theme-card').forEach((card) => {
    card.addEventListener('click', () => {
      app.querySelector('.theme-card.selected')?.classList.remove('selected');
      card.classList.add('selected');
      selectedTheme = themes[parseInt(card.dataset.index)];
    });
  });

  // Start button
  app.querySelector('.start-btn').addEventListener('click', () => {
    onStart(selectedTheme);
  });
}
