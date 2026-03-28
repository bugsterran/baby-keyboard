import { themes } from '../data/themes.js';

const GAME_REGISTRY = {
  piano: { icon: '🎹', name: '키보드 피아노', desc: '건반을 눌러봐요!', modes: null, mobile: true },
  'color-match': { icon: '🎨', name: '색깔 누르기', desc: '색깔을 맞춰요!', modes: null, mobile: true },
  'balloon-pop': { icon: '🎈', name: '풍선 터뜨리기', desc: '풍선을 터뜨려요!', modes: ['korean', 'english'], mobile: true },
  copycat: { icon: '🧠', name: '따라하기', desc: '순서를 기억해요!', modes: null, mobile: true },
  'letter-rain': { icon: '🌧️', name: '글자 비', desc: '글자를 잡아요!', modes: ['korean', 'english'], mobile: true },
  'sequence-press': { icon: '🔢', name: '순서대로 누르기', desc: 'ㄱㄴㄷ 순서대로!', modes: ['korean', 'english', 'numbers'], mobile: true },
  'missing-letter': { icon: '🔀', name: '빠진 글자', desc: '빈칸을 채워요!', modes: ['korean', 'english'], mobile: false },
};

const MODE_LABELS = {
  korean: { icon: 'ㄱ', name: '한글' },
  english: { icon: '🔤', name: '영어' },
  numbers: { icon: '🔢', name: '숫자' },
};

const AGE_CONFIG = {
  baby: {
    title: '👶 아기 놀이터',
    subtitle: '테마를 골라주세요!',
    showThemes: true,
    games: ['piano', 'color-match'],
  },
  toddler: {
    title: '🧒 어린이 놀이터',
    subtitle: '놀이터도, 게임도 있어요!',
    showThemes: true,
    games: ['piano', 'color-match', 'copycat', 'balloon-pop', 'letter-rain'],
  },
  kid: {
    title: '👦 학습 게임',
    subtitle: '재밌게 배워요!',
    showThemes: false,
    games: ['letter-rain', 'copycat', 'sequence-press', 'missing-letter'],
  },
};

const mobileBadge = '<span class="mobile-badge">📱 모바일 가능</span>';

function renderGameCards(games) {
  return games.map((gameId) => {
    const g = GAME_REGISTRY[gameId];
    const badge = g.mobile ? mobileBadge : '';
    if (!g.modes) {
      return `
        <button class="game-card game-card-direct" data-game="${gameId}">
          <span class="game-card-icon">${g.icon}</span>
          <span class="game-card-name">${g.name}</span>
          <span class="game-card-desc">${g.desc}</span>
          ${badge}
        </button>
      `;
    }
    return `
      <div class="game-card-group">
        <div class="game-card-header">
          <span class="game-card-icon">${g.icon}</span>
          <span class="game-card-name">${g.name}</span>
          <span class="game-card-desc">${g.desc}</span>
          ${badge}
        </div>
        <div class="game-mode-btns">
          ${g.modes.map((m) => {
            const ml = MODE_LABELS[m];
            return `<button class="game-mode-btn" data-game="${gameId}" data-mode="${m}">${ml.icon} ${ml.name}</button>`;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

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

  const gamesHtml = config.games.length
    ? `
      <div class="game-section ${config.showThemes ? '' : 'game-section-only'}">
        ${config.showThemes ? '<h2 class="game-title">🎮 게임</h2>' : ''}
        <div class="game-list">
          ${renderGameCards(config.games)}
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
      ${gamesHtml}
      <p class="home-hint">종료: 오른쪽 위 ✕ 버튼</p>
    </div>
  `;

  app.querySelector('.back-btn').addEventListener('click', onBack);

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

  // Direct game buttons (no mode selection)
  app.querySelectorAll('.game-card-direct').forEach((btn) => {
    btn.addEventListener('click', () => {
      onStartGame(btn.dataset.game, null);
    });
  });

  // Mode selection buttons
  app.querySelectorAll('.game-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      onStartGame(btn.dataset.game, btn.dataset.mode);
    });
  });
}
