/**
 * save.js
 * localStorage を使ってゲーム状態を保存・読み込みする共通モジュールです。
 */

const SAVE_KEY = 'rpg-game-save';

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

function sanitizeLoadedSave(parsed) {
  if (window.STATE && typeof window.STATE.sanitizeGameState === 'function') {
    try {
      return window.STATE.sanitizeGameState(parsed);
    } catch (error) {
      console.warn('SAVE: sanitizeGameState failed.', error);
      return parsed;
    }
  }
  return parsed;
}

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

    const sanitized = sanitizeLoadedSave(parsed);
    if (sanitized && typeof sanitized === 'object') {
      sanitized.isLoaded = true;
    }
    return sanitized;
  } catch (error) {
    console.warn('セーブデータの読み込みに失敗しました。', error);
    return null;
  }
}

function hasSavedGame() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function hasSaveData() {
  return hasSavedGame();
}

function deleteSavedGame() {
  localStorage.removeItem(SAVE_KEY);
}

function isSaveDataValid() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw);
    return isLikelyValidSave(parsed);
  } catch (error) {
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.SAVE = {
    saveGameState: saveGameStateToStorage,
    loadSavedGameState,
    hasSavedGame,
    deleteSavedGame,
    isSaveDataValid,
  };

  window.saveGameState = saveGameStateToStorage;

  window.RPG = window.RPG || {};
  window.RPG.Save = {
    hasSaveData,
    loadSavedGameState,
    saveGameState: saveGameStateToStorage,
    isSaveDataValid,
    clearSaveData: deleteSavedGame,
  };
}
