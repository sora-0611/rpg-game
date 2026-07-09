window.addEventListener('title:start', function () {
  // 「はじめから」は既存のセーブを消してから遷移する。
  // 消さないと explore.html 側が既存セーブを見つけて自動的に続きから再開してしまう。
  if (window.RPG && RPG.Save) {
    RPG.Save.clearSaveData();
  }
  window.location.href = './rpg-game/explore.html';
});

window.addEventListener('title:continue', function () {
  window.location.href = './rpg-game/explore.html';
});

window.addEventListener('title:settings', function () {
  window.location.href = './settings.html?from=title';
});

RPG.initTitleScreen();
RPG.initLoadingScreen({ onFinished: function () { RPG.showScreen('title'); } });
