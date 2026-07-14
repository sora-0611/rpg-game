var RPG = RPG || {};

RPG.initTitleScreen = function () {
  var CORRUPT_MSG = 'セーブデータが壊れています。セーブデータを消去し、最初から遊びますか？';

  var startBtn = document.getElementById('btn-start');
  var continueBtn = document.getElementById('btn-continue');
  var settingsBtn = document.getElementById('btn-settings');

  continueBtn.hidden = !RPG.Save.hasSaveData();

  startBtn.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('title:start'));
  });

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

  settingsBtn.addEventListener('click', function () {
    window.dispatchEvent(new CustomEvent('title:settings'));
  });
};
