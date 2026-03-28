import './style.css';
import { renderLanding } from './screens/landing.js';
import { renderHome } from './screens/home.js';
import { renderPlay } from './screens/play.js';
import { renderLetterRain } from './screens/letter-rain.js';

const app = document.querySelector('#app');

function showLanding() {
  renderLanding(app, (ageGroup) => showHome(ageGroup));
}

function showHome(ageGroup) {
  renderHome(
    app,
    ageGroup,
    (theme) => showPlay(ageGroup, theme),
    (mode) => showLetterRain(ageGroup, mode),
    () => showLanding(),
  );
}

function showPlay(ageGroup, theme) {
  renderPlay(app, theme, () => showHome(ageGroup));
}

function showLetterRain(ageGroup, mode) {
  renderLetterRain(app, mode, () => showHome(ageGroup));
}

showLanding();
