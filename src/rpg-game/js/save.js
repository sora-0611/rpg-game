/**
 * save.js
 * セーブ・ロード機能
 */

const SAVE_KEY = 'rpg-game-save';

/**
 * 保存データが基本構造を満たすか確認
 * @param {any} parsed
 * @return {boolean}
 */
function isLikelyValidSave(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return false;
  }
  if (!parsed.player || typeof parsed.player !== 'object') {
    return false;
  }
  if (!Array.isArray(parsed.party)) {
    return false;
  }
  if (typeof parsed.player.coin !== 'number') {
    return false;
  }
  return true;
}

/**
 * ゲーム状態を localStorage に保存
 * @param {Object} gameState
 * @return {boolean}
 */
function saveGameStateToStorage(gameState) {
  if (!gameState || typeof gameState !== 'object') {
    return false;
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    return true;
  } catch (error) {
    console.error('セーブに失敗しました。', error);
    return false;
  }
}

/**
 * localStorage からセーブデータを読み込む
 * @return {Object|null}
 */
function loadSavedGameState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isLikelyValidSave(parsed)) {
      console.warn('セーブデータが破損しています。');
      return null;
    }
    const sanitized = STATE.sanitizeGameState(parsed);
    sanitized.isLoaded = true;
    return sanitized;
  } catch (error) {
    console.warn('セーブデータの読み込みに失敗しました。', error);
    return null;
  }
}

/**
 * セーブデータが存在するか
 * @return {boolean}
 */
function hasSavedGame() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

/**
 * セーブデータを削除する
 */
function deleteSavedGame() {
  localStorage.removeItem(SAVE_KEY);
}

if (typeof window !== 'undefined') {
  window.SAVE = {
    saveGameState: saveGameStateToStorage,
    loadSavedGameState,
    hasSavedGame,
    deleteSavedGame,
  };

  // battle.js may call window.saveGameState directly
  window.saveGameState = saveGameStateToStorage;
}
