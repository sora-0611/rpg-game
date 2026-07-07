var RPG = RPG || {};

RPG.Save = (function () {
  var SAVE_KEY = 'rpgGameSaveData';
  var SAVE_VERSION = '1.0.0';

  function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  function isSaveDataValid() {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      return (
        typeof data.version === 'string' &&
        typeof data.coin === 'number' && data.coin >= 0 &&
        Array.isArray(data.partyState) &&
        Array.isArray(data.inventory) &&
        typeof data.mapProgress === 'object' && data.mapProgress !== null
      );
    } catch (e) {
      return false;
    }
  }

  function clearSaveData() {
    localStorage.removeItem(SAVE_KEY);
  }

  function createNewSaveData() {
    var data = {
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
