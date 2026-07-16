(function () {
  const ScreenManager = {
    hideAllScreens(selector = '.screen') {
      document.querySelectorAll(selector).forEach((element) => {
        if (element && typeof element.hidden !== 'undefined') {
          element.hidden = true;
        }
      });
    },

    showScreen(id) {
      const element = document.getElementById(id);
      if (element && typeof element.hidden !== 'undefined') {
        element.hidden = false;
      }
    },

    hideScreen(id) {
      const element = document.getElementById(id);
      if (element && typeof element.hidden !== 'undefined') {
        element.hidden = true;
      }
    },

    toggleScreen(id) {
      const element = document.getElementById(id);
      if (element && typeof element.hidden !== 'undefined') {
        element.hidden = !element.hidden;
      }
    },
  };

  if (typeof window !== 'undefined') {
    window.ScreenManager = ScreenManager;
  }
})();
