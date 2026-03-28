import './style.css';
import { renderLanding } from './screens/landing.js';
import { renderHome } from './screens/home.js';
import { renderPlay } from './screens/play.js';
import { renderLetterRain } from './screens/letter-rain.js';
import { renderPiano } from './screens/piano.js';
import { renderBalloonPop } from './screens/balloon-pop.js';
import { renderSequencePress } from './screens/sequence-press.js';

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
  }
}

showLanding();
