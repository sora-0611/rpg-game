var RPG = RPG || {};

RPG.Save = (function () {
  // src/rpg-game/js/save.js が実際に使っているセーブキーと同じものを見る。
  // 以前はここだけ別キー('rpgGameSaveData')・別スキーマを見ており、
  // 実際の探索/戦闘画面の進行状況と一切連動していなかったため、実データに合わせる。
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
      return (
        typeof data.version === 'string' &&
        !!data.player && typeof data.player.coin === 'number' && data.player.coin >= 0 &&
        Array.isArray(data.party) &&
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
      player: { coin: 0, currentMapId: 1, pos: { x: 1, y: 1 } },
      party: [],
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
