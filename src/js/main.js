import { showScreen } from './screenManager.js';
import { initLoadingScreen } from './screens/loading.js';
import { initTitleScreen } from './screens/title.js';

window.addEventListener('title:start', () => {
  window.location.href = './rpg-game/index.html';
});

window.addEventListener('title:continue', () => {
  window.location.href = './rpg-game/index.html';
});

window.addEventListener('title:settings', () => {
  window.location.href = './settings.html';
});

document.addEventListener('DOMContentLoaded', () => {
  initTitleScreen();
  initLoadingScreen({ onFinished: () => showScreen('title') });
});
