window.addEventListener('title:start', function () {
  const freshState = window.GAME_SAVE?.createDefaultSharedState?.() || null;
  if (freshState) {
    window.GAME_SAVE?.saveSharedGameState?.(freshState);
  }
  window.location.href = '../explore/index.html';
});

window.addEventListener('title:continue', function () {
  window.location.href = '../explore/index.html';
});

window.addEventListener('title:settings', function () {
  sessionStorage.setItem('settings-return-target', 'title');
  window.location.href = '../settings/index.html';
});

RPG.initTitleScreen();
RPG.initLoadingScreen({ onFinished: function () { RPG.showScreen('title'); } });
