import { showScreen } from './screenManager.js';
import { initLoadingScreen } from './screens/loading.js';
import { initTitleScreen } from './screens/title.js';

window.addEventListener('title:start', () => {
  // 探索画面は別タスクで実装予定
  console.log('はじめから: 探索画面への遷移は未実装です');
});

window.addEventListener('title:continue', () => {
  // 探索画面は別タスクで実装予定
  console.log('つづきから: 探索画面への遷移は未実装です');
});

window.addEventListener('title:settings', () => {
  // 設定画面は別タスクで実装予定
  console.log('設定: 設定画面への遷移は未実装です');
});

document.addEventListener('DOMContentLoaded', () => {
  initTitleScreen();
  initLoadingScreen({ onFinished: () => showScreen('title') });
});
