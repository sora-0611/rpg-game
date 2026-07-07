var RPG = RPG || {};

RPG.Save = (function () {
  var SAVE_KEY = 'rpg-game-save';
  var SAVE_VERSION = '1.0.0';

  function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  function isSaveDataValid() {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      return !!data && typeof data === 'object' && typeof data.version === 'string';
    } catch (e) {
      return false;
    }
  }

  function clearSaveData() {
    localStorage.removeItem(SAVE_KEY);
  }

  function createNewSaveData() {
    var data = window.GAME_SAVE?.createDefaultSharedState?.() || {
      saveId: 'fixed',
      version: SAVE_VERSION,
      playTime: 0,
      coin: 0,
      partyState: [],
      inventory: [],
      mapProgress: {},
      flags: {},
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return data;
  }

  return {
    hasSaveData: hasSaveData,
    isSaveDataValid: isSaveDataValid,
    clearSaveData: clearSaveData,
    createNewSaveData: createNewSaveData
  };
})();
