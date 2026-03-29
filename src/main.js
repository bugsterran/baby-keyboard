import './style.css';
import { renderLanding } from './screens/landing.js';
import { renderHome } from './screens/home.js';
import { renderPlay } from './screens/play.js';
import { renderLetterRain } from './screens/letter-rain.js';
import { renderPiano } from './screens/piano.js';
import { renderBalloonPop } from './screens/balloon-pop.js';
import { renderSequencePress } from './screens/sequence-press.js';
import { renderCopyCat } from './screens/copycat.js';
import { renderColorMatch } from './screens/color-match.js';
import { renderMissingLetter } from './screens/missing-letter.js';
import { renderMultiply } from './screens/multiply.js';
import { renderMemoryPairs } from './screens/memory-pairs.js';
import { renderRhythm } from './screens/rhythm.js';
import { renderWordTyping } from './screens/word-typing.js';

const app = document.querySelector('#app');

function showLanding() {
  renderLanding(app, (ageGroup) => showHome(ageGroup));
}

function showHome(ageGroup) {
  renderHome(
    app,
    ageGroup,
    (theme) => showPlay(ageGroup, theme),
    (gameId, mode) => showGame(ageGroup, gameId, mode),
    () => showLanding(),
  );
}

function showPlay(ageGroup, theme) {
  renderPlay(app, theme, () => showHome(ageGroup));
}

function showGame(ageGroup, gameId, mode) {
  const exit = () => showHome(ageGroup);
  switch (gameId) {
    case 'piano': renderPiano(app, exit); break;
    case 'balloon-pop': renderBalloonPop(app, mode, exit); break;
    case 'letter-rain': renderLetterRain(app, mode, exit); break;
    case 'sequence-press': renderSequencePress(app, mode, exit); break;
    case 'copycat': renderCopyCat(app, exit); break;
    case 'color-match': renderColorMatch(app, exit); break;
    case 'missing-letter': renderMissingLetter(app, mode, exit); break;
    case 'multiply': renderMultiply(app, exit); break;
    case 'memory-pairs': renderMemoryPairs(app, exit); break;
    case 'rhythm': renderRhythm(app, exit); break;
    case 'word-typing': renderWordTyping(app, mode, exit); break;
  }
}

showLanding();
