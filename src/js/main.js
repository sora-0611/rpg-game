window.addEventListener('title:start', function () {
  window.location.href = './rpg-game/explore.html';
});

window.addEventListener('title:continue', function () {
  window.location.href = './rpg-game/explore.html';
});

window.addEventListener('title:settings', function () {
  window.location.href = './settings.html';
});

RPG.initTitleScreen();
RPG.initLoadingScreen({ onFinished: function () { RPG.showScreen('title'); } });
