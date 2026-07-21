var RPG = RPG || {};

RPG.initTitleScreen = function () {
  var CORRUPT_MSG = 'セーブデータが壊れています。セーブデータを消去し、最初から遊びますか？';

  var startBtn = document.getElementById('btn-start');
  var continueBtn = document.getElementById('btn-continue');
  var settingsBtn = document.getElementById('btn-settings');

  if (!RPG.Save || typeof RPG.Save.hasSaveData !== 'function') {
    console.warn('タイトル画面のセーブAPIが未初期化です。');
    return;
  }

  if (continueBtn) {
    continueBtn.hidden = !RPG.Save.hasSaveData();
  }

  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (RPG.Save && typeof RPG.Save.clearSaveData === 'function') {
        RPG.Save.clearSaveData();
      }
      window.dispatchEvent(new CustomEvent('title:start'));
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', function () {
      if (!RPG.Save.isSaveDataValid()) {
        if (window.confirm(CORRUPT_MSG)) {
          RPG.Save.clearSaveData();
          window.dispatchEvent(new CustomEvent('title:start'));
        }
        return;
      }
      window.dispatchEvent(new CustomEvent('title:continue'));
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', function () {
      window.dispatchEvent(new CustomEvent('title:settings'));
    });
  }
};
