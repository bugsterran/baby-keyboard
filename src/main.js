import './style.css';
import { renderHome } from './screens/home.js';
import { renderPlay } from './screens/play.js';
import { renderLetterRain } from './screens/letter-rain.js';

const app = document.querySelector('#app');

function showHome() {
  renderHome(
    app,
    (theme) => showPlay(theme),
    (mode) => showLetterRain(mode),
  );
}

function showPlay(theme) {
  renderPlay(app, theme, () => showHome());
}

function showLetterRain(mode) {
  renderLetterRain(app, mode, () => showHome());
}

showHome();
