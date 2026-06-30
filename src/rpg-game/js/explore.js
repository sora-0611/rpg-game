/**
 * explore.js
 * 探索ロジック・移動・敵遭遇・アイテム取得
 */

// ===== MOVEMENT FUNCTIONS =====

/**
 * プレイヤーが指定座標に移動可能か判定
 * @param {Object} gameState
 * @param {number} newX
 * @param {number} newY
 * @return {boolean}
 */
function canMoveTo(gameState, newX, newY) {
  const map = MAP.getMap(gameState.player.currentMapId);
  if (!map) return false;

  // マップ内か判定
  if (!MAP.isWithinMap(map, newX, newY)) {
    return false;
  }

  // タイルが移動可能か判定
  const tile = MAP.getTileAt(map, newX, newY);
  if (tile === null) return false;

  return MAP.isTilePassable(tile);
}

/**
 * プレイヤーを移動（単方向）
 * @param {Object} gameState
 * @param {string} direction 'up' | 'down' | 'left' | 'right'
 * @return {Object} { success: boolean, message: string }
 */
function movePlayer(gameState, direction) {
  const currentPos = gameState.player.pos;
  let newX = currentPos.x;
  let newY = currentPos.y;

  // 移動先座標を計算
  switch (direction) {
    case 'up':
      newY--;
      break;
    case 'down':
      newY++;
      break;
    case 'left':
      newX--;
      break;
    case 'right':
      newX++;
      break;
    default:
      return { success: false, message: '不正な移動方向' };
  }

  // 移動可能か確認
  if (!canMoveTo(gameState, newX, newY)) {
    return { success: false, message: 'ここには移動できません。' };
  }

  // 座標を更新
  gameState.player.pos.x = newX;
  gameState.player.pos.y = newY;

  // 訪問済みを記録
  recordVisitedPosition(gameState, newX, newY);

  // 移動後の結果を処理
  return processLocationEvent(gameState, newX, newY);
}

/**
 * 訪問座標を記録
 * @param {Object} gameState
 * @param {number} x
 * @param {number} y
 */
function recordVisitedPosition(gameState, x, y) {
  const mapId = gameState.player.currentMapId;
  const progress = gameState.mapProgress[mapId];

  if (progress && !progress.visited) {
    progress.visited = true;
  }

  // 訪問済み座標に追加
  if (progress && Array.isArray(progress.visitedPositions)) {
    const posKey = `${x},${y}`;
    if (!progress.visitedPositions.includes(posKey)) {
      progress.visitedPositions.push(posKey);
    }
  }
}

/**
 * 移動先での位置イベントを処理
 * @param {Object} gameState
 * @param {number} x
 * @param {number} y
 * @return {Object} { success: true, message: string }
 */
function processLocationEvent(gameState, x, y) {
  const map = MAP.getMap(gameState.player.currentMapId);
  if (!map) {
    return { success: true, message: '移動しました。' };
  }

  const messages = [];

  // 1. ボス位置をチェック
  if (MAP.isBossPosition(map, x, y)) {
    const bossEnemyId = map.bossEnemyId;
    if (!gameState.mapProgress[gameState.player.currentMapId].bossDefeated) {
      // ボス戦開始
      startBossBattle(gameState, bossEnemyId);
      return { success: true, message: 'ボスが現れた！戦闘画面に遷移します。', isBoss: true };
    } else {
      messages.push('ボスはもう倒されている。');
    }
  }

  // 2. アイテムボックスをチェック
  const itemChest = MAP.checkItemChest(map, x, y);
  if (itemChest) {
    const progress = gameState.mapProgress[gameState.player.currentMapId];
    if (!progress.openedChestIds.includes(itemChest.chestId)) {
      // アイテム取得
      const itemData = DATA.ITEMS[itemChest.itemId];
      if (itemData) {
        STATE.addItemToInventory(gameState, itemChest.itemId, 1);
        progress.openedChestIds.push(itemChest.chestId);
        messages.push(`${itemData.name}を手に入れた！`);
      }
    }
  }

  // 3. スポーン位置での敵遭遇
  const spawnEncounter = MAP.checkEnemyEncounter(map, x, y);
  if (spawnEncounter) {
    startEnemyBattle(gameState, spawnEncounter.enemyId);
    return { success: true, message: `${DATA.ENEMIES[spawnEncounter.enemyId].name}が現れた！戦闘画面に遷移します。`, isEnemy: true };
  }

  // 4. ランダム敵遭遇（低確率）
  const difficultyFactor = MAP.getMapDifficultyFactor(map);
  const randomEncounter = MAP.checkRandomEncounter(map, difficultyFactor);
  if (randomEncounter) {
    startEnemyBattle(gameState, randomEncounter.enemyId);
    return { success: true, message: `${DATA.ENEMIES[randomEncounter.enemyId].name}が現れた！戦闘画面に遷移します。`, isEnemy: true };
  }

  // メッセージがあれば表示
  if (messages.length === 0) {
    messages.push('移動しました。');
  }

  return { success: true, message: messages.join('\n') };
}

/**
 * 敵との戦闘開始
 * @param {Object} gameState
 * @param {string} enemyId
 */
function startEnemyBattle(gameState, enemyId) {
  const enemyData = DATA.ENEMIES[enemyId];
  if (!enemyData) return;

  // 戦闘状態を初期化
  gameState.battle.isActive = true;
  gameState.battle.isBoss = false;
  gameState.battle.currentEnemyId = enemyId;
  gameState.battle.turn = 0;
  gameState.battle.isPlayerTurn = true;
  gameState.battle.log = [];
  gameState.battle.canEscape = !enemyData.isBoss;

  // 敵情報を作成
  gameState.battle.enemies = [
    {
      enemyId: enemyId,
      hpCurrent: enemyData.baseHp,
      hpMax: enemyData.baseHp,
    },
  ];
}

/**
 * ボス戦闘開始
 * @param {Object} gameState
 * @param {string} bossEnemyId
 */
function startBossBattle(gameState, bossEnemyId) {
  const bossData = DATA.ENEMIES[bossEnemyId];
  if (!bossData) return;

  // 戦闘状態を初期化
  gameState.battle.isActive = true;
  gameState.battle.isBoss = true;
  gameState.battle.currentEnemyId = bossEnemyId;
  gameState.battle.turn = 0;
  gameState.battle.isPlayerTurn = true;
  gameState.battle.log = [];
  gameState.battle.canEscape = false;

  // ボス情報を作成
  gameState.battle.enemies = [
    {
      enemyId: bossEnemyId,
      hpCurrent: bossData.baseHp,
      hpMax: bossData.baseHp,
    },
  ];
}

/**
 * 敵戦闘をスキップ（逃げる）
 * @param {Object} gameState
 * @return {Object} { success: boolean, message: string }
 */
function tryEscapeBattle(gameState) {
  if (!gameState.battle.isActive || !gameState.battle.canEscape) {
    return { success: false, message: '逃げることができません！' };
  }

  // ランダム判定（常に成功するシンプル実装）
  gameState.battle.isActive = false;
  gameState.battle.enemies = [];
  gameState.battle.log = [];

  return { success: true, message: '戦闘から逃げました。' };
}

/**
 * 戦闘終了（勝利時）
 * @param {Object} gameState
 */
function endBattleVictory(gameState) {
  if (!gameState.battle.isActive || gameState.battle.enemies.length === 0) {
    return;
  }

  const enemy = gameState.battle.enemies[0];
  const enemyData = DATA.ENEMIES[enemy.enemyId];

  if (!enemyData) return;

  // コイン獲得
  gameState.player.coin += enemyData.dropCoin;

  // アイテム獲得（ドロップテーブル）
  if (enemyData.dropItems && enemyData.dropItems.length > 0) {
    enemyData.dropItems.forEach(drop => {
      const rand = Math.random();
      if (rand < drop.rate) {
        STATE.addItemToInventory(gameState, drop.itemId, drop.qty);
      }
    });
  }

  // ボス戦の場合、マップをクリア状態に
  if (gameState.battle.isBoss) {
    STATE.markMapBossDefeated(gameState, gameState.player.currentMapId);
  }

  // 戦闘を終了
  gameState.battle.isActive = false;
  gameState.battle.enemies = [];
  gameState.battle.log = [];
}

/**
 * 戦闘終了（敗北時）
 * @param {Object} gameState
 */
function endBattleDefeat(gameState) {
  // パーティーのHP回復（とりあえず全快）
  gameState.party.forEach((char, idx) => {
    STATE.healCharacter(gameState, idx, char.hpMax);
  });

  // マップ開始位置に戻す
  gameState.player.pos = { x: 1, y: 1 };

  // 戦闘を終了
  gameState.battle.isActive = false;
  gameState.battle.enemies = [];
  gameState.battle.log = [];
}

// Export
if (typeof window !== 'undefined') {
  window.EXPLORE = {
    canMoveTo,
    movePlayer,
    recordVisitedPosition,
    processLocationEvent,
    startEnemyBattle,
    startBossBattle,
    tryEscapeBattle,
    endBattleVictory,
    endBattleDefeat,
  };
}
