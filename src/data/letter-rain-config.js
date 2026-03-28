export const LETTER_SETS = {
  korean: [
    { code: 'KeyR', display: 'ㄱ', label: 'ㄱ 기역' },
    { code: 'KeyS', display: 'ㄴ', label: 'ㄴ 니은' },
    { code: 'KeyE', display: 'ㄷ', label: 'ㄷ 디귿' },
    { code: 'KeyF', display: 'ㄹ', label: 'ㄹ 리을' },
    { code: 'KeyA', display: 'ㅁ', label: 'ㅁ 미음' },
    { code: 'KeyQ', display: 'ㅂ', label: 'ㅂ 비읍' },
    { code: 'KeyT', display: 'ㅅ', label: 'ㅅ 시옷' },
    { code: 'KeyD', display: 'ㅇ', label: 'ㅇ 이응' },
    { code: 'KeyW', display: 'ㅈ', label: 'ㅈ 지읒' },
    { code: 'KeyC', display: 'ㅊ', label: 'ㅊ 치읓' },
    { code: 'KeyZ', display: 'ㅋ', label: 'ㅋ 키읔' },
    { code: 'KeyX', display: 'ㅌ', label: 'ㅌ 티읕' },
    { code: 'KeyV', display: 'ㅍ', label: 'ㅍ 피읖' },
    { code: 'KeyG', display: 'ㅎ', label: 'ㅎ 히읗' },
  ],
  english: [
    { code: 'KeyA', display: 'A', label: '🍎 Apple' },
    { code: 'KeyB', display: 'B', label: '🐻 Bear' },
    { code: 'KeyC', display: 'C', label: '🐱 Cat' },
    { code: 'KeyD', display: 'D', label: '🐶 Dog' },
    { code: 'KeyE', display: 'E', label: '🥚 Egg' },
    { code: 'KeyF', display: 'F', label: '🐟 Fish' },
    { code: 'KeyG', display: 'G', label: '🍇 Grape' },
    { code: 'KeyH', display: 'H', label: '🏠 House' },
    { code: 'KeyI', display: 'I', label: '🍦 Ice cream' },
    { code: 'KeyJ', display: 'J', label: '🧃 Juice' },
    { code: 'KeyK', display: 'K', label: '🔑 Key' },
    { code: 'KeyL', display: 'L', label: '🍋 Lemon' },
    { code: 'KeyM', display: 'M', label: '🌙 Moon' },
    { code: 'KeyN', display: 'N', label: '📎 Nut' },
    { code: 'KeyO', display: 'O', label: '🍊 Orange' },
    { code: 'KeyP', display: 'P', label: '🍕 Pizza' },
    { code: 'KeyQ', display: 'Q', label: '👑 Queen' },
    { code: 'KeyR', display: 'R', label: '🌈 Rainbow' },
    { code: 'KeyS', display: 'S', label: '⭐ Star' },
    { code: 'KeyT', display: 'T', label: '🌳 Tree' },
    { code: 'KeyU', display: 'U', label: '☂️ Umbrella' },
    { code: 'KeyV', display: 'V', label: '🎻 Violin' },
    { code: 'KeyW', display: 'W', label: '🌊 Water' },
    { code: 'KeyX', display: 'X', label: '🎄 Xmas' },
    { code: 'KeyY', display: 'Y', label: '💛 Yellow' },
    { code: 'KeyZ', display: 'Z', label: '⚡ Zebra' },
  ],
};

export const DIFFICULTY = {
  initialSpeed: 0.8,
  speedIncrement: 0.1,
  speedUpEvery: 5,
  maxSpeed: 3.5,
  initialSpawnInterval: 2500,
  minSpawnInterval: 800,
  spawnDecrement: 100,
  maxSimultaneous: 2,
  maxSimultaneousMax: 4,
};

export const GAME = {
  lives: 5,
  bonusLifeEvery: 20,
};

export const COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A855F7',
  '#38BDF8', '#FB923C', '#F472B6', '#34D399',
];
