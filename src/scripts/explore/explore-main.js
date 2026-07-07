/**
 * main.js
 * ゲームメイン処理・初期化・シーン管理
 */

// ===== GLOBAL STATE =====

// グローバルゲーム状態
let gameState = null;

// ===== CORE FUNCTIONS =====

/**
 * ゲームを初期化
 */
function setGameState(newState) {
  gameState = newState;
  window.gameState = newState;
}

function initializeGame() {
  const savedState = window.GAME_SAVE?.loadSharedGameState?.();
  const initialState = savedState || STATE.createNewGameState();
  const sanitizedState = STATE.sanitizeGameState(initialState);
  sanitizedState.isLoaded = true;
  setGameState(sanitizedState);

  UI.initializeUI();

  UI.hideAllScreens();
  switchScene(sanitizedState.scene || 'MAP_SELECT');
}

/**
 * シーン（画面）を切り替え
 * @param {string} newSceneName
 */
function switchScene(newSceneName) {
  if (!gameState) {
    console.error('Game state not initialized');
    return;
  }

  gameState.lastScene = gameState.scene;
  gameState.scene = newSceneName;
  gameState.updatedAt = new Date().toISOString();
  window.GAME_SAVE?.saveSharedGameState?.(gameState);

  // 画面表示を更新
  UI.hideAllScreens();

  const screenId = SCENE_TO_SCREEN[newSceneName];
  if (screenId) {
    UI.showScreen(screenId);
  } else {
    console.warn(`Unknown scene: ${newSceneName}`);
    return;
  }

  // シーン用のレンダリング関数を呼ぶ
  UI.renderScreen(newSceneName, gameState);
}

/**
 * SCENE_TO_SCREEN マッピング（グローバル）
 * ui.jsから参照されるので定義を統一
 */
const SCENE_TO_SCREEN = {
  MAP_SELECT: 'screen-maps',
  EXPLORE: 'screen-explore',
  UPGRADE: 'screen-upgrade',
};

// ===== INITIALIZATION =====

/**
 * 初期化処理を実行する
 */
function initGame() {
  console.log('Initializing game...');

  // 依存ファイルが読み込まれているか確認
  if (!window.DATA) {
    console.error('data.js not loaded');
    return;
  }
  if (!window.STATE) {
    console.error('state.js not loaded');
    return;
  }
  if (!window.UI) {
    console.error('ui.js not loaded');
    return;
  }

  // ゲーム初期化
  initializeGame();

  console.log('Game initialized successfully');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// ===== GLOBAL EXPORTS =====

// グローバルスコープで利用可能にする
if (typeof window !== 'undefined') {
  window.switchScene = switchScene;
  window.initializeGame = initializeGame;
  window.setGameState = setGameState;
  window.SCENE_TO_SCREEN = SCENE_TO_SCREEN;
}
