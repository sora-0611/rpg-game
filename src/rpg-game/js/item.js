/**
 * item.js
 * アイテム使用ロジック
 */

/**
 * 在庫エントリを取得
 * @param {Object} gameState
 * @param {string} itemId
 * @return {Object|undefined}
 */
function getInventoryEntry(gameState, itemId) {
  return (gameState.inventory || []).find(entry => entry.itemId === itemId);
}

/**
 * 回復可能なパーティーメンバーがいるか
 * @param {Object} gameState
 * @return {boolean}
 */
function hasHealablePartyMember(gameState) {
  return gameState.party.some(char => char.hpCurrent > 0 && char.hpCurrent < char.hpMax);
}

/**
 * 最初の回復対象インデックスを取得
 * @param {Object} gameState
 * @return {number}
 */
function getFirstHealablePartyIndex(gameState) {
  return gameState.party.findIndex(char => char.hpCurrent > 0 && char.hpCurrent < char.hpMax);
}

/**
 * 最初の生存している敵インデックスを取得
 * @param {Object} gameState
 * @return {number}
 */
function getFirstAliveEnemyIndex(gameState) {
  if (!gameState.battle || !Array.isArray(gameState.battle.enemies)) {
    return -1;
  }
  return gameState.battle.enemies.findIndex(enemy => enemy.hpCurrent > 0);
}

/**
 * 戦闘中のアイテム効果を適用
 * @param {Object} gameState
 * @param {string} itemId
 * @return {Object}
 */
function applyItemEffectInBattle(gameState, itemId) {
  const item = DATA.ITEMS[itemId];
  if (!item || !item.usableInBattle) {
    return { success: false, message: 'このアイテムは戦闘で使えません。' };
  }

  const inventoryEntry = getInventoryEntry(gameState, itemId);
  if (!inventoryEntry) {
    return { success: false, message: 'アイテムがありません。' };
  }

  switch (item.effectType) {
    case 'heal_single': {
      const targetIndex = getFirstHealablePartyIndex(gameState);
      if (targetIndex < 0) {
        return { success: false, message: '回復できる味方がいません。' };
      }
      const target = gameState.party[targetIndex];
      STATE.healCharacter(gameState, targetIndex, item.effectValue);
      return {
        success: true,
        message: `${target.name}が${item.effectValue}回復した。`,
        enemyDefeated: false,
      };
    }
    case 'heal_all': {
      if (!hasHealablePartyMember(gameState)) {
        return { success: false, message: '全員のHPが満タンです。' };
      }
      gameState.party.forEach((_, index) => {
        STATE.healCharacter(gameState, index, item.effectValue);
      });
      return {
        success: true,
        message: `パーティー全員が${item.effectValue}回復した。`,
        enemyDefeated: false,
      };
    }
    case 'damage_single': {
      const enemyIndex = getFirstAliveEnemyIndex(gameState);
      if (enemyIndex < 0) {
        return { success: false, message: '攻撃対象がいません。' };
      }
      const enemy = gameState.battle.enemies[enemyIndex];
      enemy.hpCurrent = Math.max(0, enemy.hpCurrent - item.effectValue);
      return {
        success: true,
        message: `${item.name}！敵に${item.effectValue}ダメージ。`,
        enemyDefeated: enemy.hpCurrent <= 0,
      };
    }
    default:
      return { success: false, message: 'このアイテムは効果を発揮しませんでした。' };
  }
}

/**
 * 探索中のアイテム効果を適用
 * @param {Object} gameState
 * @param {string} itemId
 * @return {Object}
 */
function applyItemEffectInExplore(gameState, itemId) {
  const item = DATA.ITEMS[itemId];
  if (!item || !item.usableInExplore) {
    return { success: false, message: 'このアイテムは探索中に使えません。' };
  }

  const inventoryEntry = getInventoryEntry(gameState, itemId);
  if (!inventoryEntry) {
    return { success: false, message: 'アイテムがありません。' };
  }

  switch (item.effectType) {
    case 'heal_single': {
      const targetIndex = getFirstHealablePartyIndex(gameState);
      if (targetIndex < 0) {
        return { success: false, message: '回復できる味方がいません。' };
      }
      const target = gameState.party[targetIndex];
      STATE.healCharacter(gameState, targetIndex, item.effectValue);
      STATE.consumeItemFromInventory(gameState, itemId, 1);
      return { success: true, message: `${target.name}が${item.effectValue}回復した。` };
    }
    case 'heal_all': {
      if (!hasHealablePartyMember(gameState)) {
        return { success: false, message: '全員のHPが満タンです。' };
      }
      gameState.party.forEach((_, index) => {
        STATE.healCharacter(gameState, index, item.effectValue);
      });
      STATE.consumeItemFromInventory(gameState, itemId, 1);
      return { success: true, message: `パーティー全員が${item.effectValue}回復した。` };
    }
    default:
      return { success: false, message: 'このアイテムは探索中に使えません。' };
  }
}

/**
 * インベントリのアイテム一覧を取得
 * @param {Object} gameState
 * @return {Array}
 */
function getInventoryItems(gameState) {
  return (gameState.inventory || []).map(entry => ({
    itemId: entry.itemId,
    quantity: entry.quantity,
    data: DATA.ITEMS[entry.itemId] || null,
  }));
}

// Export
if (typeof window !== 'undefined') {
  window.ITEM = {
    applyItemEffectInBattle,
    applyItemEffectInExplore,
    getInventoryItems,
    getInventoryEntry,
  };
}
