var RPG = RPG || {};

RPG.showScreen = function (name) {
  document.querySelectorAll('.screen').forEach(function (el) {
    el.hidden = el.id !== 'screen-' + name;
  });
};
