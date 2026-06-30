/**
 * state.js
 * ゲームのグローバル状態管理
 * 状態は gameState オブジェクトで一元管理
 */

/**
 * キャラクターの最大HPを計算
 * @param {string} characterId
 * @param {number} enhanceLevel
 * @return {number}
 */
function calculateMaxHp(characterId, enhanceLevel = 1) {
  // 入力検証
  if (!characterId || !DATA.CHARACTERS[characterId]) {
    return 1;
  }
  if (enhanceLevel < 1) enhanceLevel = 1;
  if (enhanceLevel > DATA.CONSTANTS.MAX_ENHANCE_LEVEL) enhanceLevel = DATA.CONSTANTS.MAX_ENHANCE_LEVEL;

  const character = DATA.CHARACTERS[characterId];
  const equipment = DATA.EQUIPMENTS[character.baseEquipmentId];
  let maxHp = character.baseHp + (equipment ? equipment.baseHp : 0);

  // 強化レベル毎のボーナス
  const enhanceCost = DATA.ENHANCE_COSTS[characterId];
  if (enhanceCost && enhanceCost[enhanceLevel]) {
    maxHp += enhanceCost[enhanceLevel].hpBonus;
  }

  return Math.max(1, maxHp);
}

/**
 * キャラクターの攻撃力を計算
 * @param {string} characterId
 * @param {number} enhanceLevel
 * @return {number}
 */
function calculateAttack(characterId, enhanceLevel = 1) {
  if (!characterId || !DATA.CHARACTERS[characterId]) {
    return 1;
  }
  if (enhanceLevel < 1) enhanceLevel = 1;
  if (enhanceLevel > DATA.CONSTANTS.MAX_ENHANCE_LEVEL) enhanceLevel = DATA.CONSTANTS.MAX_ENHANCE_LEVEL;

  const character = DATA.CHARACTERS[characterId];
  const equipment = DATA.EQUIPMENTS[character.baseEquipmentId];
  let attack = character.baseAttack + (equipment ? equipment.baseAttack : 0);

  const enhanceCost = DATA.ENHANCE_COSTS[characterId];
  if (enhanceCost && enhanceCost[enhanceLevel]) {
    attack += enhanceCost[enhanceLevel].attackBonus;
  }

  return Math.max(1, attack);
}

/**
 * キャラクターの防御力を計算
 * @param {string} characterId
 * @param {number} enhanceLevel
 * @return {number}
 */
function calculateDefense(characterId, enhanceLevel = 1) {
  if (!characterId || !DATA.CHARACTERS[characterId]) {
    return 1;
  }
  if (enhanceLevel < 1) enhanceLevel = 1;
  if (enhanceLevel > DATA.CONSTANTS.MAX_ENHANCE_LEVEL) enhanceLevel = DATA.CONSTANTS.MAX_ENHANCE_LEVEL;

  const character = DATA.CHARACTERS[characterId];
  const equipment = DATA.EQUIPMENTS[character.baseEquipmentId];
  let defense = character.baseDefense + (equipment ? equipment.baseDefense : 0);

  const enhanceCost = DATA.ENHANCE_COSTS[characterId];
  if (enhanceCost && enhanceCost[enhanceLevel]) {
    defense += enhanceCost[enhanceLevel].defenseBonus;
  }

  return Math.max(0, defense);
}

/**
 * キャラクターのすべてのステータスを計算・取得
 * @param {string} characterId
 * @param {number} enhanceLevel
 * @return {Object}
 */
function calculateCharacterStats(characterId, enhanceLevel = 1) {
  return {
    hpMax: calculateMaxHp(characterId, enhanceLevel),
    attack: calculateAttack(characterId, enhanceLevel),
    defense: calculateDefense(characterId, enhanceLevel),
  };
}

/**
 * 初期ゲーム状態を作成
 * @return {Object}
 */
function createNewGameState() {
  const now = new Date().toISOString();

  // パーティーメンバーの初期化
  const party = DATA.CONSTANTS.CHARACTER_IDS.map(charId => {
    const stats = calculateCharacterStats(charId, 1);
    return {
      characterId: charId,
      name: DATA.CHARACTERS[charId].name,
      hpCurrent: stats.hpMax,
      hpMax: stats.hpMax,
      attack: stats.attack,
      defense: stats.defense,
      equipmentId: DATA.CHARACTERS[charId].baseEquipmentId,
      enhanceLevel: 1,
      status: [],
    };
  });

  return {
    // ゲーム全体
    scene: 'TITLE',
    version: DATA.CONSTANTS.SAVE_VERSION,
    playTime: 0,
    isLoaded: false,

    // プレイヤー
    player: {
      coin: DATA.CONSTANTS.INITIAL_COIN,
      currentMapId: 1,
      pos: { x: 1, y: 1 },
    },

    // パーティー（3キャラ固定）
    party: party,

    // インベントリ
    inventory: [],

    // マップ進捗
    mapProgress: {
      1: {
        visited: false,
        bossDefeated: false,
        openedChestIds: [],
        visitedPositions: [],
      },
      2: {
        visited: false,
        bossDefeated: false,
        openedChestIds: [],
        visitedPositions: [],
      },
      3: {
        visited: false,
        bossDefeated: false,
        openedChestIds: [],
        visitedPositions: [],
      },
    },

    // 戦闘状態（戦闘中のみ使用）
    battle: {
      isActive: false,
      isBoss: false,
      currentEnemyId: null,
      enemies: [],
      turn: 0,
      isPlayerTurn: true,
      log: [],
      canEscape: true,
    },

    // UI状態
    ui: {
      menuOpen: false,
      itemWindowOpen: false,
      dialogOpen: false,
      message: '',
    },

    // フラグ
    flags: {
      seenTutorial: false,
      finalBossDefeated: false,
    },

    // メタ
    updatedAt: now,
  };
}

/**
 * 不正データを検出して補正
 * @param {Object} state
 * @return {Object}
 */
function sanitizeGameState(state) {
  if (!state || typeof state !== 'object') {
    return createNewGameState();
  }

  // 基本フィールドの補正
  if (!state.version) state.version = DATA.CONSTANTS.SAVE_VERSION;
  if (typeof state.playTime !== 'number') state.playTime = 0;
  if (typeof state.isLoaded !== 'boolean') state.isLoaded = false;

  // プレイヤー情報の補正
  if (!state.player) state.player = {};
  if (typeof state.player.coin !== 'number') state.player.coin = DATA.CONSTANTS.INITIAL_COIN;
  if (state.player.coin < 0) state.player.coin = 0;
  if (!state.player.currentMapId || !DATA.MAPS[state.player.currentMapId]) {
    state.player.currentMapId = 1;
  }
  if (!state.player.pos || typeof state.player.pos.x !== 'number') {
    state.player.pos = { x: 1, y: 1 };
  }

  // パーティーの補正
  if (!Array.isArray(state.party)) {
    state.party = createNewGameState().party;
  }
  state.party = state.party.map((char, idx) => {
    const charId = DATA.CONSTANTS.CHARACTER_IDS[idx];
    if (!char || typeof char !== 'object') {
      char = {};
    }

    const baseStats = calculateCharacterStats(charId, 1);
    char.characterId = charId;
    char.name = DATA.CHARACTERS[charId].name;

    if (typeof char.enhanceLevel !== 'number') char.enhanceLevel = 1;
    if (char.enhanceLevel < 1) char.enhanceLevel = 1;
    if (char.enhanceLevel > DATA.CONSTANTS.MAX_ENHANCE_LEVEL) {
      char.enhanceLevel = DATA.CONSTANTS.MAX_ENHANCE_LEVEL;
    }

    const currentStats = calculateCharacterStats(charId, char.enhanceLevel);
    char.hpMax = currentStats.hpMax;
    char.attack = currentStats.attack;
    char.defense = currentStats.defense;

    if (typeof char.hpCurrent !== 'number') char.hpCurrent = char.hpMax;
    if (char.hpCurrent < 0) char.hpCurrent = 0;
    if (char.hpCurrent > char.hpMax) char.hpCurrent = char.hpMax;

    char.equipmentId = DATA.CHARACTERS[charId].baseEquipmentId;
    if (!Array.isArray(char.status)) char.status = [];

    return char;
  });

  // インベントリの補正
  if (!Array.isArray(state.inventory)) state.inventory = [];
  state.inventory = state.inventory.filter(item => {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.itemId === 'string' &&
      DATA.ITEMS[item.itemId] &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
    );
  });

  // マップ進捗の補正
  if (!state.mapProgress) state.mapProgress = {};
  DATA.CONSTANTS.MAP_IDS.forEach(mapId => {
    if (!state.mapProgress[mapId]) {
      state.mapProgress[mapId] = {
        visited: false,
        bossDefeated: false,
        openedChestIds: [],
        visitedPositions: [],
      };
    }
    const progress = state.mapProgress[mapId];
    if (typeof progress.visited !== 'boolean') progress.visited = false;
    if (typeof progress.bossDefeated !== 'boolean') progress.bossDefeated = false;
    if (!Array.isArray(progress.openedChestIds)) progress.openedChestIds = [];
    if (!Array.isArray(progress.visitedPositions)) progress.visitedPositions = [];
  });

  // 戦闘状態の補正
  if (!state.battle) state.battle = {};
  if (typeof state.battle.isActive !== 'boolean') state.battle.isActive = false;
  if (typeof state.battle.isBoss !== 'boolean') state.battle.isBoss = false;
  if (!Array.isArray(state.battle.enemies)) state.battle.enemies = [];
  if (typeof state.battle.turn !== 'number') state.battle.turn = 0;
  if (typeof state.battle.isPlayerTurn !== 'boolean') state.battle.isPlayerTurn = true;
  if (!Array.isArray(state.battle.log)) state.battle.log = [];

  // UI状態の補正
  if (!state.ui) state.ui = {};
  if (typeof state.ui.menuOpen !== 'boolean') state.ui.menuOpen = false;
  if (typeof state.ui.itemWindowOpen !== 'boolean') state.ui.itemWindowOpen = false;
  if (typeof state.ui.dialogOpen !== 'boolean') state.ui.dialogOpen = false;
  if (typeof state.ui.message !== 'string') state.ui.message = '';

  // フラグの補正
  if (!state.flags) state.flags = {};
  if (typeof state.flags.seenTutorial !== 'boolean') state.flags.seenTutorial = false;
  if (typeof state.flags.finalBossDefeated !== 'boolean') {
    state.flags.finalBossDefeated = false;
  }

  // メタ情報
  if (!state.updatedAt) state.updatedAt = new Date().toISOString();

  return state;
}

/**
 * ゲーム状態をリセット（新規ゲーム開始時）
 * @return {Object}
 */
function resetGameState() {
  return createNewGameState();
}

/**
 * インベントリにアイテムを追加
 * @param {Object} state
 * @param {string} itemId
 * @param {number} quantity
 * @return {Object} 更新後の state
 */
function addItemToInventory(state, itemId, quantity = 1) {
  if (!DATA.ITEMS[itemId] || quantity <= 0) {
    return state;
  }

  const inventoryIndex = state.inventory.findIndex(item => item.itemId === itemId);
  if (inventoryIndex >= 0) {
    state.inventory[inventoryIndex].quantity += quantity;
  } else {
    state.inventory.push({ itemId, quantity });
  }

  return state;
}

/**
 * インベントリからアイテムを消費
 * @param {Object} state
 * @param {string} itemId
 * @param {number} quantity
 * @return {boolean} 消費に成功したか
 */
function consumeItemFromInventory(state, itemId, quantity = 1) {
  const inventoryIndex = state.inventory.findIndex(item => item.itemId === itemId);
  if (inventoryIndex < 0 || state.inventory[inventoryIndex].quantity < quantity) {
    return false;
  }

  state.inventory[inventoryIndex].quantity -= quantity;
  if (state.inventory[inventoryIndex].quantity <= 0) {
    state.inventory.splice(inventoryIndex, 1);
  }

  return true;
}

/**
 * キャラクターのHP回復
 * @param {Object} state
 * @param {number} characterIndex
 * @param {number} amount
 * @return {Object}
 */
function healCharacter(state, characterIndex, amount) {
  if (characterIndex < 0 || characterIndex >= state.party.length) {
    return state;
  }

  const character = state.party[characterIndex];
  character.hpCurrent = Math.min(character.hpCurrent + amount, character.hpMax);

  return state;
}

/**
 * キャラクターにダメージを与える
 * @param {Object} state
 * @param {number} characterIndex
 * @param {number} damage
 * @return {Object}
 */
function damageCharacter(state, characterIndex, damage) {
  if (characterIndex < 0 || characterIndex >= state.party.length) {
    return state;
  }

  const character = state.party[characterIndex];
  character.hpCurrent = Math.max(0, character.hpCurrent - damage);

  return state;
}

/**
 * すべてのパーティーメンバーが生存しているか
 * @param {Object} state
 * @return {boolean}
 */
function isPartyAlive(state) {
  return state.party.every(char => char.hpCurrent > 0);
}

/**
 * パーティーが全滅しているか
 * @param {Object} state
 * @return {boolean}
 */
function isPartyDefeated(state) {
  return state.party.every(char => char.hpCurrent <= 0);
}

/**
 * 強化が可能かチェック
 * @param {Object} state
 * @param {number} characterIndex
 * @return {Object} { canUpgrade: boolean, reason: string }
 */
function canUpgradeCharacter(state, characterIndex) {
  if (characterIndex < 0 || characterIndex >= state.party.length) {
    return { canUpgrade: false, reason: 'キャラクターが見つかりません' };
  }

  const character = state.party[characterIndex];
  if (character.enhanceLevel >= DATA.CONSTANTS.MAX_ENHANCE_LEVEL) {
    return { canUpgrade: false, reason: 'これ以上強化できません' };
  }

  const nextLevel = character.enhanceLevel + 1;
  const enhanceCost = DATA.ENHANCE_COSTS[character.characterId];
  if (!enhanceCost || !enhanceCost[nextLevel]) {
    return { canUpgrade: false, reason: 'ダータエラー' };
  }

  const requiredCoin = enhanceCost[nextLevel].coin;
  if (state.player.coin < requiredCoin) {
    return { canUpgrade: false, reason: 'コインが不足しています' };
  }

  return { canUpgrade: true, reason: '' };
}

/**
 * キャラクターを強化
 * @param {Object} state
 * @param {number} characterIndex
 * @return {boolean} 強化に成功したか
 */
function upgradeCharacter(state, characterIndex) {
  const canUpgrade = canUpgradeCharacter(state, characterIndex);
  if (!canUpgrade.canUpgrade) {
    return false;
  }

  const character = state.party[characterIndex];
  const nextLevel = character.enhanceLevel + 1;
  const enhanceCost = DATA.ENHANCE_COSTS[character.characterId][nextLevel];

  state.player.coin -= enhanceCost.coin;
  character.enhanceLevel = nextLevel;

  const newStats = calculateCharacterStats(character.characterId, nextLevel);
  character.hpMax = newStats.hpMax;
  character.attack = newStats.attack;
  character.defense = newStats.defense;
  character.hpCurrent = Math.min(character.hpCurrent, character.hpMax);

  return true;
}

/**
 * マップをクリア状態にする
 * @param {Object} state
 * @param {number} mapId
 * @return {Object}
 */
function markMapBossDefeated(state, mapId) {
  if (state.mapProgress[mapId]) {
    state.mapProgress[mapId].bossDefeated = true;
  }
  return state;
}

// Export
if (typeof window !== 'undefined') {
  window.STATE = {
    // 作成・リセット
    createNewGameState,
    resetGameState,
    sanitizeGameState,

    // 計算関数
    calculateMaxHp,
    calculateAttack,
    calculateDefense,
    calculateCharacterStats,

    // インベントリ管理
    addItemToInventory,
    consumeItemFromInventory,

    // ダメージ・回復
    healCharacter,
    damageCharacter,

    // パーティー状態
    isPartyAlive,
    isPartyDefeated,

    // 強化
    canUpgradeCharacter,
    upgradeCharacter,

    // マップ
    markMapBossDefeated,
  };
}
