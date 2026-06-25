/**
 * data.js
 * マスタデータ定義（敵、アイテム、装備、キャラクター、マップ）
 * 不変（Immutable）なので Object.freeze() で保護
 */

// ===== CONSTANTS =====
const SAVE_VERSION = '1.0.0';
const MAX_ENHANCE_LEVEL = 3;
const INITIAL_COIN = 0;
const MAP_IDS = [1, 2, 3];
const CHARACTER_IDS = ['A', 'B', 'C'];

// ===== CHARACTERS =====
const CHARACTERS = Object.freeze({
  'A': Object.freeze({
    characterId: 'A',
    name: 'キャラA',
    baseHp: 20,
    baseAttack: 20,
    baseDefense: 20,
    baseEquipmentId: 'eq001',
  }),
  'B': Object.freeze({
    characterId: 'B',
    name: 'キャラB',
    baseHp: 20,
    baseAttack: 30,
    baseDefense: 10,
    baseEquipmentId: 'eq002',
  }),
  'C': Object.freeze({
    characterId: 'C',
    name: 'キャラC',
    baseHp: 30,
    baseAttack: 5,
    baseDefense: 25,
    baseEquipmentId: 'eq003',
  }),
});

// ===== EQUIPMENTS =====
const EQUIPMENTS = Object.freeze({
  'eq001': Object.freeze({
    equipmentId: 'eq001',
    name: 'ソード',
    type: 'sword',
    baseAttack: 5,
    baseDefense: 0,
    baseHp: 0,
    enhanceBonus: Object.freeze({
      1: Object.freeze({ attack: 5, defense: 5, hp: 5 }),
      2: Object.freeze({ attack: 10, defense: 10, hp: 10 }),
      3: Object.freeze({ attack: 20, defense: 20, hp: 20 }),
    }),
  }),
  'eq002': Object.freeze({
    equipmentId: 'eq002',
    name: 'スタッフ',
    type: 'staff',
    baseAttack: 15,
    baseDefense: 0,
    baseHp: 0,
    enhanceBonus: Object.freeze({
      1: Object.freeze({ attack: 0, defense: 5, hp: 5 }),
      2: Object.freeze({ attack: 5, defense: 10, hp: 5 }),
      3: Object.freeze({ attack: 10, defense: 20, hp: 10 }),
    }),
  }),
  'eq003': Object.freeze({
    equipmentId: 'eq003',
    name: 'ボウ',
    type: 'bow',
    baseAttack: 0,
    baseDefense: 5,
    baseHp: 10,
    enhanceBonus: Object.freeze({
      1: Object.freeze({ attack: 0, defense: 5, hp: 10 }),
      2: Object.freeze({ attack: 5, defense: 10, hp: 15 }),
      3: Object.freeze({ attack: 10, defense: 20, hp: 30 }),
    }),
  }),
});

// ===== ITEMS =====
const ITEMS = Object.freeze({
  // 回復アイテム
  'heal_1': Object.freeze({
    itemId: 'heal_1',
    name: '回復ポーション★',
    category: 'recovery',
    usableInExplore: true,
    usableInBattle: true,
    effectType: 'heal_single',
    effectValue: 10,
  }),
  'heal_2': Object.freeze({
    itemId: 'heal_2',
    name: '回復ポーション★★',
    category: 'recovery',
    usableInExplore: true,
    usableInBattle: true,
    effectType: 'heal_single',
    effectValue: 20,
  }),
  'heal_3': Object.freeze({
    itemId: 'heal_3',
    name: '回復ポーション★★★',
    category: 'recovery',
    usableInExplore: true,
    usableInBattle: true,
    effectType: 'heal_single',
    effectValue: 30,
  }),

  // 全体回復アイテム
  'heal_group_1': Object.freeze({
    itemId: 'heal_group_1',
    name: '全体回復ポーション★',
    category: 'recovery',
    usableInExplore: true,
    usableInBattle: true,
    effectType: 'heal_all',
    effectValue: 5,
  }),
  'heal_group_2': Object.freeze({
    itemId: 'heal_group_2',
    name: '全体回復ポーション★★',
    category: 'recovery',
    usableInExplore: true,
    usableInBattle: true,
    effectType: 'heal_all',
    effectValue: 10,
  }),
  'heal_group_3': Object.freeze({
    itemId: 'heal_group_3',
    name: '全体回復ポーション★★★',
    category: 'recovery',
    usableInExplore: true,
    usableInBattle: true,
    effectType: 'heal_all',
    effectValue: 15,
  }),

  // 攻撃アイテム
  'dmg_1': Object.freeze({
    itemId: 'dmg_1',
    name: '攻撃アイテム★',
    category: 'attack',
    usableInExplore: false,
    usableInBattle: true,
    effectType: 'damage_single',
    effectValue: 10,
  }),
  'dmg_2': Object.freeze({
    itemId: 'dmg_2',
    name: '攻撃アイテム★★',
    category: 'attack',
    usableInExplore: false,
    usableInBattle: true,
    effectType: 'damage_single',
    effectValue: 20,
  }),
  'dmg_3': Object.freeze({
    itemId: 'dmg_3',
    name: '攻撃アイテム★★★',
    category: 'attack',
    usableInExplore: false,
    usableInBattle: true,
    effectType: 'damage_single',
    effectValue: 30,
  }),
});

// ===== ENEMIES =====
const ENEMIES = Object.freeze({
  // 雑魚モンスター
  'slime_1': Object.freeze({
    enemyId: 'slime_1',
    name: '雑魚モンスター1',
    baseHp: 50,
    baseAttack: 10,
    baseDefense: 10,
    dropCoin: 5,
    dropCoinRate: 1.0,
    dropItems: Object.freeze([
      { itemId: 'heal_1', rate: 0.5, qty: 1 },
      { itemId: 'heal_group_1', rate: 0.3, qty: 1 },
    ]),
    attacks: ['single'],
    isBoss: false,
  }),
  'slime_2': Object.freeze({
    enemyId: 'slime_2',
    name: '雑魚モンスター2',
    baseHp: 50,
    baseAttack: 10,
    baseDefense: 10,
    dropCoin: 5,
    dropCoinRate: 1.0,
    dropItems: Object.freeze([
      { itemId: 'heal_1', rate: 0.5, qty: 1 },
    ]),
    attacks: ['aoe'],
    isBoss: false,
  }),
  'slime_3': Object.freeze({
    enemyId: 'slime_3',
    name: '雑魚モンスター3',
    baseHp: 50,
    baseAttack: 20,
    baseDefense: 0,
    dropCoin: 5,
    dropCoinRate: 1.0,
    dropItems: Object.freeze([
      { itemId: 'heal_1', rate: 0.5, qty: 1 },
      { itemId: 'dmg_1', rate: 0.3, qty: 1 },
    ]),
    attacks: ['single', 'aoe'],
    isBoss: false,
  }),

  // ボスモンスター
  'boss_1': Object.freeze({
    enemyId: 'boss_1',
    name: 'ボスモンスター1',
    baseHp: 150,
    baseAttack: 20,
    baseDefense: 70,
    dropCoin: 30,
    dropCoinRate: 1.0,
    dropItems: Object.freeze([
      { itemId: 'heal_2', rate: 0.8, qty: 3 },
      { itemId: 'dmg_1', rate: 0.5, qty: 2 },
    ]),
    attacks: ['single'],
    isBoss: true,
  }),
  'boss_2': Object.freeze({
    enemyId: 'boss_2',
    name: 'ボスモンスター2',
    baseHp: 150,
    baseAttack: 70,
    baseDefense: 20,
    dropCoin: 30,
    dropCoinRate: 1.0,
    dropItems: Object.freeze([
      { itemId: 'heal_2', rate: 0.8, qty: 3 },
    ]),
    attacks: ['aoe'],
    isBoss: true,
  }),

  // ラスボス
  'final_boss': Object.freeze({
    enemyId: 'final_boss',
    name: 'ラスボス',
    baseHp: 300,
    baseAttack: 100,
    baseDefense: 50,
    dropCoin: 300,
    dropCoinRate: 1.0,
    dropItems: Object.freeze([
      { itemId: 'heal_3', rate: 1.0, qty: 6 },
      { itemId: 'dmg_3', rate: 1.0, qty: 3 },
    ]),
    attacks: ['single', 'aoe'],
    isBoss: true,
  }),
});

// ===== MAPS =====
const MAPS = Object.freeze({
  1: Object.freeze({
    mapId: 1,
    name: '(仮)難易度1マップ',
    difficulty: 1,
    width: 12,
    height: 12,
    // タイル定義: 0=草, 1=道, 2=川, 3=橋
    tiles: Object.freeze([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]),
    enemySpawns: Object.freeze([
      { pos: [5, 5], enemyId: 'slime_1', spawnRate: 0.7 },
      { pos: [8, 8], enemyId: 'slime_2', spawnRate: 0.5 },
    ]),
    itemsOnMap: Object.freeze([
      { pos: [3, 3], itemId: 'heal_1', chestId: 'chest_1' },
      { pos: [9, 3], itemId: 'heal_group_1', chestId: 'chest_2' },
    ]),
    bossPos: [11, 11],
    bossEnemyId: 'boss_1',
  }),
  2: Object.freeze({
    mapId: 2,
    name: '(仮)難易度2マップ',
    difficulty: 2,
    width: 12,
    height: 12,
    tiles: Object.freeze([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]),
    enemySpawns: Object.freeze([
      { pos: [5, 5], enemyId: 'slime_2', spawnRate: 0.7 },
      { pos: [8, 8], enemyId: 'slime_3', spawnRate: 0.6 },
    ]),
    itemsOnMap: Object.freeze([
      { pos: [3, 3], itemId: 'heal_2', chestId: 'chest_3' },
    ]),
    bossPos: [11, 11],
    bossEnemyId: 'boss_2',
  }),
  3: Object.freeze({
    mapId: 3,
    name: '(仮)難易度3マップ',
    difficulty: 3,
    width: 12,
    height: 12,
    tiles: Object.freeze([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]),
    enemySpawns: Object.freeze([
      { pos: [5, 5], enemyId: 'slime_3', spawnRate: 0.8 },
      { pos: [8, 8], enemyId: 'slime_1', spawnRate: 0.7 },
    ]),
    itemsOnMap: Object.freeze([
      { pos: [3, 3], itemId: 'heal_3', chestId: 'chest_5' },
    ]),
    bossPos: [11, 11],
    bossEnemyId: 'final_boss',
  }),
});

// ===== ENHANCE COSTS =====
const ENHANCE_COSTS = Object.freeze({
  'A': Object.freeze({
    1: Object.freeze({ coin: 0, hpBonus: 5, attackBonus: 5, defenseBonus: 5 }),
    2: Object.freeze({ coin: 15, hpBonus: 10, attackBonus: 10, defenseBonus: 10 }),
    3: Object.freeze({ coin: 60, hpBonus: 20, attackBonus: 20, defenseBonus: 20 }),
  }),
  'B': Object.freeze({
    1: Object.freeze({ coin: 0, hpBonus: 0, attackBonus: 15, defenseBonus: 0 }),
    2: Object.freeze({ coin: 15, hpBonus: 5, attackBonus: 20, defenseBonus: 5 }),
    3: Object.freeze({ coin: 60, hpBonus: 10, attackBonus: 40, defenseBonus: 10 }),
  }),
  'C': Object.freeze({
    1: Object.freeze({ coin: 0, hpBonus: 10, attackBonus: 0, defenseBonus: 5 }),
    2: Object.freeze({ coin: 15, hpBonus: 15, attackBonus: 5, defenseBonus: 10 }),
    3: Object.freeze({ coin: 60, hpBonus: 30, attackBonus: 10, defenseBonus: 20 }),
  }),
});

// ===== UTILITY FUNCTIONS =====

/**
 * キャラクターが所有する敵の全体攻撃能力を持つかチェック
 * @param {string} enemyId
 * @return {boolean}
 */
function enemyHasAOEAttack(enemyId) {
  const enemy = ENEMIES[enemyId];
  return enemy && enemy.attacks.includes('aoe');
}

/**
 * アイテムが戦闘中に使用可能か
 * @param {string} itemId
 * @return {boolean}
 */
function itemUsableInBattle(itemId) {
  const item = ITEMS[itemId];
  return item && item.usableInBattle;
}

/**
 * アイテムが探索中に使用可能か
 * @param {string} itemId
 * @return {boolean}
 */
function itemUsableInExplore(itemId) {
  const item = ITEMS[itemId];
  return item && item.usableInExplore;
}

/**
 * 指定されたレベルの装備強化ボーナスを取得
 * @param {string} equipmentId
 * @param {number} level
 * @return {Object|null}
 */
function getEnhancementBonus(equipmentId, level) {
  const equipment = EQUIPMENTS[equipmentId];
  if (!equipment || !equipment.enhanceBonus[level]) {
    return null;
  }
  return { ...equipment.enhanceBonus[level] };
}

/**
 * マップのボス敵IDを取得
 * @param {number} mapId
 * @return {string|null}
 */
function getMapBossEnemyId(mapId) {
  const map = MAPS[mapId];
  return map ? map.bossEnemyId : null;
}

/**
 * 敵の基本ステータスを取得（ボスかどうか確認）
 * @param {string} enemyId
 * @return {Object|null}
 */
function getEnemyStats(enemyId) {
  const enemy = ENEMIES[enemyId];
  if (!enemy) return null;
  return {
    hpMax: enemy.baseHp,
    attack: enemy.baseAttack,
    defense: enemy.baseDefense,
    isBoss: enemy.isBoss,
  };
}

/**
 * キャラクターの基本情報を取得
 * @param {string} characterId
 * @return {Object|null}
 */
function getCharacterBase(characterId) {
  const character = CHARACTERS[characterId];
  if (!character) return null;
  return {
    name: character.name,
    baseHp: character.baseHp,
    baseAttack: character.baseAttack,
    baseDefense: character.baseDefense,
    baseEquipmentId: character.baseEquipmentId,
  };
}

/**
 * 装備の基本ステータスを取得
 * @param {string} equipmentId
 * @return {Object|null}
 */
function getEquipmentBase(equipmentId) {
  const equipment = EQUIPMENTS[equipmentId];
  if (!equipment) return null;
  return {
    name: equipment.name,
    type: equipment.type,
    baseAttack: equipment.baseAttack,
    baseDefense: equipment.baseDefense,
    baseHp: equipment.baseHp,
  };
}

/**
 * アイテム定義を取得
 * @param {string} itemId
 * @return {Object|null}
 */
function getItemData(itemId) {
  const item = ITEMS[itemId];
  if (!item) return null;
  return { ...item };
}

// Export（グローバルスコープで定義）
if (typeof window !== 'undefined') {
  window.DATA = {
    CHARACTERS,
    EQUIPMENTS,
    ITEMS,
    ENEMIES,
    MAPS,
    ENHANCE_COSTS,
    CONSTANTS: {
      SAVE_VERSION,
      MAX_ENHANCE_LEVEL,
      INITIAL_COIN,
      MAP_IDS,
      CHARACTER_IDS,
    },
    enemyHasAOEAttack,
    itemUsableInBattle,
    itemUsableInExplore,
    getEnhancementBonus,
    getMapBossEnemyId,
    getEnemyStats,
    getCharacterBase,
    getEquipmentBase,
    getItemData,
  };
}
