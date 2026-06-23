/**
 * battle.js
 * 戦闘ロジックと勝利・敗北処理
 */

/**
 * 内部：戦闘ログを追加
 * @param {Object} gameState
 * @param {string} message
 */
function addBattleLog(gameState, message) {
  if (!gameState.battle || !Array.isArray(gameState.battle.log)) {
    gameState.battle.log = [];
  }
  gameState.battle.log.push(message);
  if (gameState.battle.log.length > 20) {
    gameState.battle.log.shift();
  }
  gameState.ui.message = message;
}

/**
 * 生存しているパーティーのインデックスを取得
 * @param {Object} gameState
 * @return {number}
 */
function getFirstAliveCharacterIndex(gameState) {
  return gameState.party.findIndex(char => char.hpCurrent > 0);
}

/**
 * 生存している敵のインデックスを取得
 * @param {Object} gameState
 * @return {number}
 */
function getFirstAliveEnemyIndex(gameState) {
  return gameState.battle.enemies.findIndex(enemy => enemy.hpCurrent > 0);
}

/**
 * パーティー全滅か判定
 * @param {Object} gameState
 * @return {boolean}
 */
function isBattleDefeat(gameState) {
  return gameState.party.every(char => char.hpCurrent <= 0);
}

/**
 * ダメージ計算
 * @param {number} attack
 * @param {number} defense
 * @return {number}
 */
function calculateDamage(attack, defense) {
  const damage = attack - Math.floor(defense * 0.5);
  return Math.max(1, damage);
}

/**
 * 戦闘を初期化する
 * @param {Object} gameState
 * @param {string} enemyId
 * @param {boolean} isBoss
 */
function initializeBattle(gameState, enemyId, isBoss = false) {
  const enemyData = DATA.ENEMIES[enemyId];
  if (!enemyData) return;

  gameState.battle.isActive = true;
  gameState.battle.isBoss = isBoss;
  gameState.battle.currentEnemyId = enemyId;
  gameState.battle.turn = 1;
  gameState.battle.isPlayerTurn = true;
  gameState.battle.log = [];
  gameState.battle.defending = false;
  gameState.battle.canEscape = !enemyData.isBoss && !isBoss;
  gameState.battle.enemies = [
    {
      enemyId: enemyId,
      hpCurrent: enemyData.baseHp,
      hpMax: enemyData.baseHp,
      attack: enemyData.baseAttack,
      defense: enemyData.baseDefense,
    },
  ];

  addBattleLog(gameState, `${enemyData.name}が現れた！`);
}

/**
 * プレイヤー通常攻撃
 * @param {Object} gameState
 * @return {Object}
 */
function playerAttack(gameState) {
  if (!gameState.battle?.isActive) {
    return { success: false, message: '戦闘中ではありません。' };
  }

  const attackerIndex = getFirstAliveCharacterIndex(gameState);
  if (attackerIndex < 0) {
    return resolveDefeat(gameState);
  }

  const attacker = gameState.party[attackerIndex];
  const enemyIndex = getFirstAliveEnemyIndex(gameState);
  if (enemyIndex < 0) {
    return resolveVictory(gameState);
  }

  const enemy = gameState.battle.enemies[enemyIndex];
  const damage = calculateDamage(attacker.attack, enemy.defense);
  enemy.hpCurrent = Math.max(0, enemy.hpCurrent - damage);

  addBattleLog(gameState, `${attacker.name}の攻撃！${damage}のダメージ。`);

  if (enemy.hpCurrent <= 0) {
    return resolveVictory(gameState);
  }

  return enemyTurn(gameState);
}

/**
 * プレイヤー防御
 * @param {Object} gameState
 * @return {Object}
 */
function playerDefend(gameState) {
  if (!gameState.battle?.isActive) {
    return { success: false, message: '戦闘中ではありません。' };
  }

  gameState.battle.defending = true;
  addBattleLog(gameState, '防御した。次の攻撃を軽減する。');
  return enemyTurn(gameState);
}

/**
 * 戦闘中にアイテムを使用する
 * @param {Object} gameState
 * @param {string} itemId
 * @return {Object}
 */
function useItemInBattle(gameState, itemId) {
  if (!gameState.battle?.isActive) {
    return { success: false, message: '戦闘中ではありません。' };
  }

  const item = DATA.ITEMS[itemId];
  if (!item || !item.usableInBattle) {
    return { success: false, message: 'このアイテムは戦闘で使えません。' };
  }

  if (typeof ITEM === 'undefined') {
    return { success: false, message: 'アイテム機能が利用できません。' };
  }

  const result = ITEM.applyItemEffectInBattle(gameState, itemId);
  if (!result.success) {
    return result;
  }

  const consumed = STATE.consumeItemFromInventory(gameState, itemId, 1);
  if (!consumed) {
    return { success: false, message: 'アイテムを使えませんでした。' };
  }

  addBattleLog(gameState, result.message);

  if (result.enemyDefeated) {
    return resolveVictory(gameState);
  }

  return enemyTurn(gameState);
}

/**
 * 敵ターン処理
 * @param {Object} gameState
 * @return {Object}
 */
function enemyTurn(gameState) {
  if (!gameState.battle?.isActive) {
    return { success: false, message: '戦闘中ではありません。' };
  }

  const enemyIndex = getFirstAliveEnemyIndex(gameState);
  if (enemyIndex < 0) {
    return resolveVictory(gameState);
  }

  const enemy = gameState.battle.enemies[enemyIndex];
  const targetIndex = getFirstAliveCharacterIndex(gameState);
  if (targetIndex < 0) {
    return resolveDefeat(gameState);
  }

  const target = gameState.party[targetIndex];
  let damage = calculateDamage(enemy.attack, target.defense);
  if (gameState.battle.defending) {
    damage = Math.ceil(damage / 2);
    gameState.battle.defending = false;
  }

  target.hpCurrent = Math.max(0, target.hpCurrent - damage);
  addBattleLog(gameState, `${DATA.ENEMIES[enemy.enemyId].name}の攻撃！${damage}のダメージ。`);

  if (isBattleDefeat(gameState)) {
    return resolveDefeat(gameState);
  }

  gameState.battle.turn += 1;
  return { success: true, message: `敵の攻撃を受けた。` };
}

/**
 * 逃走を試みる
 * @param {Object} gameState
 * @return {Object}
 */
function tryEscapeBattle(gameState) {
  if (!gameState.battle?.isActive) {
    return { success: false, message: '戦闘中ではありません。' };
  }

  if (!gameState.battle.canEscape) {
    addBattleLog(gameState, '今は逃げられない。');
    return { success: false, message: '今は逃げられない。' };
  }

  const success = Math.random() < 0.75;
  if (!success) {
    addBattleLog(gameState, '逃走に失敗した！');
    return enemyTurn(gameState);
  }

  gameState.battle.isActive = false;
  gameState.battle.enemies = [];
  gameState.battle.log = [];
  addBattleLog(gameState, '逃げ切った！');
  saveGameState(gameState);
  return { success: true, message: '逃げ切った！' };
}

/**
 * 勝利処理
 * @param {Object} gameState
 * @return {Object}
 */
function resolveVictory(gameState) {
  const enemy = gameState.battle.enemies[0];
  if (!enemy) {
    return { success: false, message: '敵がいません。' };
  }

  const enemyData = DATA.ENEMIES[enemy.enemyId];
  if (!enemyData) {
    return { success: false, message: '勝利しました。' };
  }

  addBattleLog(gameState, `${enemyData.name}を倒した！`);
  gameState.player.coin += enemyData.dropCoin;

  if (enemyData.dropItems && enemyData.dropItems.length > 0) {
    enemyData.dropItems.forEach(drop => {
      const rand = Math.random();
      if (rand < drop.rate) {
        STATE.addItemToInventory(gameState, drop.itemId, drop.qty);
        addBattleLog(gameState, `${DATA.ITEMS[drop.itemId].name}を手に入れた！`);
      }
    });
  }

  if (gameState.battle.isBoss) {
    STATE.markMapBossDefeated(gameState, gameState.player.currentMapId);
    if (enemy.enemyId === 'final_boss') {
      gameState.flags.finalBossDefeated = true;
      gameState.ui.message = 'ラスボスを撃破！ゲームクリア！';
    } else {
      gameState.ui.message = `${enemyData.name}を撃破！`;  
    }
  } else {
    gameState.ui.message = `${enemyData.name}を撃破した！`;  
  }

  gameState.battle.isActive = false;
  gameState.battle.enemies = [];
  gameState.battle.defending = false;
  gameState.battle.log = [];
  saveGameState(gameState);

  return {
    success: true,
    message: gameState.ui.message,
    isBoss: gameState.battle.isBoss,
    isFinalBoss: enemy.enemyId === 'final_boss',
  };
}

/**
 * 敗北処理
 * @param {Object} gameState
 * @return {Object}
 */
function resolveDefeat(gameState) {
  addBattleLog(gameState, '全滅した...');
  gameState.party.forEach((_, index) => {
    STATE.healCharacter(gameState, index, gameState.party[index].hpMax);
  });
  gameState.player.pos = { x: 1, y: 1 };
  gameState.battle.isActive = false;
  gameState.battle.enemies = [];
  gameState.battle.defending = false;
  gameState.battle.log = [];
  gameState.ui.message = '敗北しました。';
  saveGameState(gameState);
  return { success: false, message: gameState.ui.message };
}

/**
 * セーブコールバックが存在する場合に保存
 * @param {Object} gameState
 */
function saveGameState(gameState) {
  if (typeof window.saveGame === 'function') {
    window.saveGame(gameState);
  } else if (typeof window.saveGameState === 'function') {
    window.saveGameState(gameState);
  }
}

// Export
if (typeof window !== 'undefined') {
  window.BATTLE = {
    addBattleLog,
    initializeBattle,
    playerAttack,
    playerDefend,
    useItemInBattle,
    enemyTurn,
    tryEscapeBattle,
    resolveVictory,
    resolveDefeat,
  };
}
