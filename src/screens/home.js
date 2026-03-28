import { themes } from '../data/themes.js';

// Age group configs
const AGE_CONFIG = {
  baby: {
    title: '👶 아기 놀이터',
    subtitle: '테마를 골라주세요!',
    showThemes: true,
    showGame: false,
  },
  toddler: {
    title: '🧒 어린이 놀이터',
    subtitle: '놀이터도, 게임도 있어요!',
    showThemes: true,
    showGame: true,
  },
  kid: {
    title: '👦 글자 비 게임',
    subtitle: '떨어지는 글자를 잡아요!',
    showThemes: false,
    showGame: true,
  },
};

export function renderHome(app, ageGroup, onStart, onStartGame, onBack) {
  let selectedTheme = themes[0];
  const config = AGE_CONFIG[ageGroup];

  const themesHtml = config.showThemes
    ? `
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
    `
    : '';

  const gameHtml = config.showGame
    ? `
      <div class="game-section ${config.showThemes ? '' : 'game-section-only'}">
        ${config.showThemes ? '<h2 class="game-title">🎮 글자 비 게임</h2>' : ''}
        <p class="game-subtitle">하늘에서 떨어지는 글자를 잡아요!</p>
        <div class="game-grid">
          <button class="game-card" data-mode="korean">
            <span class="game-card-icon">ㄱ</span>
            <span class="game-card-name">한글</span>
            <span class="game-card-desc">ㄱ~ㅎ 자음 연습</span>
          </button>
          <button class="game-card" data-mode="english">
            <span class="game-card-icon">🔤</span>
            <span class="game-card-name">영어</span>
            <span class="game-card-desc">A~Z 알파벳 연습</span>
          </button>
        </div>
      </div>
    `
    : '';

  app.innerHTML = `
    <div class="home">
      <button class="back-btn">← 돌아가기</button>
      <h1 class="home-title">${config.title}</h1>
      <p class="home-subtitle">${config.subtitle}</p>
      ${themesHtml}
      ${gameHtml}
      <p class="home-hint">종료: 오른쪽 위 ✕ 버튼</p>
    </div>
  `;

  // Back button
  app.querySelector('.back-btn').addEventListener('click', onBack);

  // Theme selection
  if (config.showThemes) {
    app.querySelectorAll('.theme-card').forEach((card) => {
      card.addEventListener('click', () => {
        app.querySelector('.theme-card.selected')?.classList.remove('selected');
        card.classList.add('selected');
        selectedTheme = themes[parseInt(card.dataset.index)];
      });
      card.addEventListener('dblclick', () => {
        selectedTheme = themes[parseInt(card.dataset.index)];
        onStart(selectedTheme);
      });
    });

    app.querySelector('.start-btn').addEventListener('click', () => {
      onStart(selectedTheme);
    });
  }

  // Game mode buttons
  if (config.showGame) {
    app.querySelectorAll('.game-card').forEach((card) => {
      card.addEventListener('click', () => {
        onStartGame(card.dataset.mode);
      });
    });
  }
}
