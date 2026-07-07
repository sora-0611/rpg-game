window.addEventListener('title:start', function () {
  window.location.href = '../explore/index.html';
});

window.addEventListener('title:continue', function () {
  window.location.href = '../explore/index.html';
});

window.addEventListener('title:settings', function () {
  window.location.href = '../settings/index.html';
});

RPG.initTitleScreen();
RPG.initLoadingScreen({ onFinished: function () { RPG.showScreen('title'); } });
