import './style.css';
import { renderHome } from './screens/home.js';
import { renderPlay } from './screens/play.js';

const app = document.querySelector('#app');

function showHome() {
  renderHome(app, (theme) => {
    showPlay(theme);
  });
}

function showPlay(theme) {
  renderPlay(app, theme, () => {
    showHome();
  });
}

showHome();
