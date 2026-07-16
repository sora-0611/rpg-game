document.addEventListener('DOMContentLoaded', function () {
  const loadingScreen = document.getElementById('screen-loading');
  const titleScreen = document.getElementById('screen-title');
  let titleEventsBound = false;

  function bindTitleEvents() {
    if (titleEventsBound) {
      return;
    }

    titleEventsBound = true;

    if (!window.addEventListener) {
      window.addEventListener = function (eventName, handler) {
        if (!window.__eventHandlers) {
          window.__eventHandlers = {};
        }
        if (!window.__eventHandlers[eventName]) {
          window.__eventHandlers[eventName] = [];
        }
        window.__eventHandlers[eventName].push(handler);
      };
    }

    window.addEventListener('title:start', function () {
      window.location.href = 'pages/explore.html';
    });

    window.addEventListener('title:continue', function () {
      window.location.href = 'pages/explore.html';
    });

    window.addEventListener('title:settings', function () {
      window.location.href = 'pages/settings.html?from=index';
    });
  }

  function showTitleScreen() {
    if (loadingScreen) {
      loadingScreen.hidden = true;
    }
    if (titleScreen) {
      titleScreen.hidden = false;
    }

    if (!window.RPG || typeof RPG.initTitleScreen !== 'function') {
      console.error('タイトル画面の初期化に必要なスクリプトが読み込まれていません。');
      return;
    }

    bindTitleEvents();
    RPG.initTitleScreen();
  }

  if (window.RPG && typeof RPG.initLoadingScreen === 'function') {
    RPG.initLoadingScreen({
      onFinished: showTitleScreen,
    });
    return;
  }

  showTitleScreen();
});
