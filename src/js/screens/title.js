import { hasSaveData, isSaveDataValid, clearSaveData } from '../save.js';

const CORRUPT_SAVE_MESSAGE =
  'セーブデータが壊れています。セーブデータを消去し、最初から遊びますか？';

export function initTitleScreen() {
  const startBtn = document.getElementById('btn-start');
  const continueBtn = document.getElementById('btn-continue');
  const settingsBtn = document.getElementById('btn-settings');

  continueBtn.hidden = !hasSaveData();

  startBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('title:start'));
  });

  continueBtn.addEventListener('click', () => {
    if (!isSaveDataValid()) {
      if (window.confirm(CORRUPT_SAVE_MESSAGE)) {
        clearSaveData();
        window.dispatchEvent(new CustomEvent('title:start'));
      }
      return;
    }
    window.dispatchEvent(new CustomEvent('title:continue'));
  });

  settingsBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('title:settings'));
  });
}
