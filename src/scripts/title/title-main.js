window.addEventListener('title:start', function () {
  const freshState = window.GAME_SAVE?.createDefaultSharedState?.() || null;
  if (freshState) {
    window.GAME_SAVE?.saveSharedGameState?.(freshState);
  }
  window.location.href = '../explore/explore-page.html';
});

window.addEventListener('title:continue', function () {
  window.location.href = '../explore/explore-page.html';
});

window.addEventListener('title:settings', function () {
  sessionStorage.setItem('settings-return-target', 'title');
  window.location.href = '../settings/settings-page.html';
});

RPG.initTitleScreen();
RPG.showScreen('title');
