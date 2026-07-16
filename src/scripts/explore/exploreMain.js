/**
 * main.js
 * ゲーム全体の起動処理をまとめるファイルです。
 * ここでは、保存データの読み込み、画面切り替え、初期化処理を担当します。
 * まずは「ゲーム開始時に何が動くか」を理解すると、他のファイルの役割が追いやすくなります。
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
  // セーブデータがあれば読み込んで再開し、無ければ新規作成する
  // （戦闘画面からの復帰時は事前にSAVE.saveGameStateされている想定）
  let initialState = (window.SAVE && SAVE.hasSavedGame()) ? SAVE.loadSavedGameState() : null;
  if (!initialState) {
    initialState = STATE.sanitizeGameState(STATE.createNewGameState());
  }

  // 戦闘画面を閉じる等で中断され、battle.isActiveが立ったまま保存されている場合の救済。
  // 探索画面が起動する時点で本来戦闘中ということはあり得ない
  // （通常は戦闘画面側がisActiveをfalseに戻してから戻ってくる）ため、ここで強制的に解除する。
  // isActiveが残っていると registerExploreControls の移動処理がずっとブロックされ、
  // ボスの位置に固定されたまま動けなくなる不具合につながる。
  if (initialState.battle && initialState.battle.isActive) {
    initialState.battle.isActive = false;
    initialState.battle.enemies = [];
    initialState.battle.log = [];

    // 中断時の座標はボス等の遭遇マスの上のままになっていることが多く、
    // そのまま再開すると表示や再遭遇判定がおかしくなるため、隣接する移動可能マスへ1マスずらす
    if (window.EXPLORE && typeof EXPLORE.canMoveTo === 'function') {
      const { x, y } = initialState.player.pos;
      const candidates = [
        { x: x, y: y - 1 },
        { x: x, y: y + 1 },
        { x: x - 1, y: y },
        { x: x + 1, y: y },
      ];
      const nextPos = candidates.find((pos) => EXPLORE.canMoveTo(initialState, pos.x, pos.y));
      if (nextPos) {
        initialState.player.pos = nextPos;
      }
    }
  }

  setGameState(initialState);

  // UIを初期化
  UI.initializeUI();
  UI.hideAllScreens();

  // 保存されていたシーンから再開する（戦闘画面がEXPLORE/MAP_SELECTを設定して戻ってくる）
  const resumeScene = SCENE_TO_SCREEN[initialState.scene] ? initialState.scene : 'MAP_SELECT';
  switchScene(resumeScene);
}

/**
 * 現在の画面を切り替える。
 * 画面表示だけでなく、ゲーム状態の scene も更新するため、
 * どの画面にいるかを一元管理する役割を持つ。
 * @param {string} newSceneName
 */
function switchScene(newSceneName) {
  if (!gameState) {
    console.error('Game state not initialized');
    return;
  }

  // 前のシーンを保存（設定画面からの戻り先用）
  gameState.lastScene = gameState.scene;

  // シーンを更新
  gameState.scene = newSceneName;
  gameState.updatedAt = new Date().toISOString();

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
