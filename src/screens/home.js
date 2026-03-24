import { themes } from '../data/themes.js';

export function renderHome(app, onStart) {
  let selectedTheme = themes[0];

  app.innerHTML = `
    <div class="home">
      <div class="ad-banner ad-banner-top">
        <a href="https://link.coupang.com/a/eauItW" target="_blank" referrerpolicy="unsafe-url"><img src="https://ads-partners.coupang.com/banners/975008?subId=&traceId=V0-301-5f4982b43e2b4522-I975008&w=320&h=100" alt="쿠팡 파트너스"></a>
      </div>
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
      <div class="ad-banner ad-banner-bottom">
        <a href="https://link.coupang.com/a/eauFnA" target="_blank" referrerpolicy="unsafe-url"><img src="https://ads-partners.coupang.com/banners/975005?subId=&traceId=V0-301-5f4982b43e2b4522-I975005&w=728&h=90" alt="쿠팡 파트너스"></a>
      </div>
      <p class="ad-disclaimer">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
    </div>
  `;

  // Theme selection (click to select, double-click to start)
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

  // Start button
  app.querySelector('.start-btn').addEventListener('click', () => {
    onStart(selectedTheme);
  });
}
