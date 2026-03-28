export function renderLanding(app, onSelect) {
  app.innerHTML = `
    <div class="landing">
      <div class="ad-banner ad-banner-top">
        <a href="https://link.coupang.com/a/eauItW" target="_blank" referrerpolicy="unsafe-url"><img src="https://ads-partners.coupang.com/banners/975008?subId=&traceId=V0-301-5f4982b43e2b4522-I975008&w=320&h=100" alt="쿠팡 파트너스"></a>
      </div>
      <h1 class="landing-title">🎹 영유아 키보드 놀이터</h1>
      <p class="landing-subtitle">우리 아이 나이를 골라주세요!</p>
      <div class="age-grid">
        <button class="age-card" data-age="baby">
          <span class="age-icon">👶</span>
          <span class="age-name">0~3세</span>
          <span class="age-desc">아무 키나 눌러봐요!</span>
          <span class="age-tag">놀이터 + 피아노 + 색깔</span>
        </button>
        <button class="age-card" data-age="toddler">
          <span class="age-icon">🧒</span>
          <span class="age-name">4~5세</span>
          <span class="age-desc">피아노 + 풍선 + 따라하기</span>
          <span class="age-tag">놀이터 + 게임 5종</span>
        </button>
        <button class="age-card" data-age="kid">
          <span class="age-icon">👦</span>
          <span class="age-name">6~7세</span>
          <span class="age-desc">글자비 + 따라하기 + 빠진글자</span>
          <span class="age-tag">학습 게임 4종</span>
        </button>
      </div>
      <div class="ad-banner ad-banner-bottom">
        <a href="https://link.coupang.com/a/eauFnA" target="_blank" referrerpolicy="unsafe-url"><img src="https://ads-partners.coupang.com/banners/975005?subId=&traceId=V0-301-5f4982b43e2b4522-I975005&w=728&h=90" alt="쿠팡 파트너스"></a>
      </div>
      <p class="ad-disclaimer">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
    </div>
  `;

  app.querySelectorAll('.age-card').forEach((card) => {
    card.addEventListener('click', () => {
      onSelect(card.dataset.age);
    });
  });
}
