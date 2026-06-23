/**
 * map.js
 * マップ管理・タイル操作ユーティリティ
 */

// ===== TILE CONSTANTS =====
const TILE_TYPE = {
  GRASS: 0,      // 草（移動可能）
  PATH: 1,       // 道（移動可能）
  RIVER: 2,      // 川（移動不可）
  BRIDGE: 3,     // 橋（移動可能）
};

// ===== MAP UTILITY FUNCTIONS =====

/**
 * マップデータを取得
 * @param {number} mapId
 * @return {Object|null}
 */
function getMap(mapId) {
  return DATA.MAPS[mapId] || null;
}

/**
 * タイルが移動可能か判定
 * @param {number} tileType
 * @return {boolean}
 */
function isTilePassable(tileType) {
  return tileType !== TILE_TYPE.RIVER;
}

/**
 * 指定座標のタイルを取得
 * @param {Object} map
 * @param {number} x
 * @param {number} y
 * @return {number|null}
 */
function getTileAt(map, x, y) {
  if (!map || x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return null;
  }
  return map.tiles[y][x];
}

/**
 * 座標がマップ内か判定
 * @param {Object} map
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
function isWithinMap(map, x, y) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

/**
 * 座標がボス位置か判定
 * @param {Object} map
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
function isBossPosition(map, x, y) {
  if (!map.bossPos || map.bossPos.length !== 2) {
    return false;
  }
  return map.bossPos[0] === x && map.bossPos[1] === y;
}

/**
 * 敵スポーン位置から敵遭遇判定
 * スポーン位置に到達したら確率でランダムに敵を遭遇
 * @param {Object} map
 * @param {number} x
 * @param {number} y
 * @return {Object|null} { enemyId, rate } or null
 */
function checkEnemyEncounter(map, x, y) {
  if (!map.enemySpawns || map.enemySpawns.length === 0) {
    return null;
  }

  // 現在位置で敵スポーンをチェック
  for (const spawn of map.enemySpawns) {
    if (spawn.pos[0] === x && spawn.pos[1] === y) {
      // スポーン位置で確率判定
      const rand = Math.random();
      if (rand < spawn.spawnRate) {
        return {
          enemyId: spawn.enemyId,
          rate: spawn.spawnRate,
        };
      }
    }
  }

  return null;
}

/**
 * アイテムボックスをチェック
 * @param {Object} map
 * @param {number} x
 * @param {number} y
 * @return {Object|null} { itemId, chestId } or null
 */
function checkItemChest(map, x, y) {
  if (!map.itemsOnMap || map.itemsOnMap.length === 0) {
    return null;
  }

  for (const itemBox of map.itemsOnMap) {
    if (itemBox.pos[0] === x && itemBox.pos[1] === y) {
      return {
        itemId: itemBox.itemId,
        chestId: itemBox.chestId,
      };
    }
  }

  return null;
}

/**
 * ランダム敵遭遇（スポーン位置以外でも低確率でランダム敵と遭遇）
 * @param {Object} map
 * @param {number} difficultyFactor 難易度係数（0.1-1.0）
 * @return {Object|null} { enemyId } or null
 */
function checkRandomEncounter(map, difficultyFactor = 0.1) {
  if (!map.enemySpawns || map.enemySpawns.length === 0) {
    return null;
  }

  const rand = Math.random();
  // 難易度係数で敵遭遇確率を調整
  if (rand < difficultyFactor * 0.1) {
    // ランダムに敵をピック
    const randomSpawn = map.enemySpawns[
      Math.floor(Math.random() * map.enemySpawns.length)
    ];
    return {
      enemyId: randomSpawn.enemyId,
    };
  }

  return null;
}

/**
 * マップの難易度係数を取得
 * @param {Object} map
 * @return {number} 0.1 - 1.0
 */
function getMapDifficultyFactor(map) {
  return Math.min(1.0, map.difficulty * 0.3);
}

/**
 * マップが未開放か判定
 * @param {Object} gameState
 * @param {number} mapId
 * @return {boolean}
 */
function isMapLocked(gameState, mapId) {
  if (mapId === 1) {
    return false; // マップ1は常に開放
  }

  // 前のマップがクリアされているか確認
  const prevMapCleared = gameState.mapProgress[mapId - 1]?.bossDefeated;
  return !prevMapCleared;
}

// Export
if (typeof window !== 'undefined') {
  window.MAP = {
    TILE_TYPE,
    getMap,
    isTilePassable,
    getTileAt,
    isWithinMap,
    isBossPosition,
    checkEnemyEncounter,
    checkItemChest,
    checkRandomEncounter,
    getMapDifficultyFactor,
    isMapLocked,
  };
}
