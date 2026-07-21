/**
 * 戦闘画面のマスタデータ
 * 出典: docs/rpg-game/3_詳細設計/4_バランス仕様書.md, 2_基本設計/3_データ仕様書.md
 * このファイルは静的なマスタデータのみを持ち、戦闘中に書き換えない。
 * 戦闘中に変化する値（HP残量など）は battle.js 側で clone して使用する。
 */

// 操作キャラクター（3人固定）
const CHARACTERS_BASE = [
  { characterId: "A", name: "レオン", hpMax: 20, attack: 20, defense: 20, enhanceLevel: 1 },
  { characterId: "B", name: "セリス", hpMax: 20, attack: 30, defense: 10, enhanceLevel: 1 },
  { characterId: "C", name: "ガルド", hpMax: 30, attack: 5, defense: 25, enhanceLevel: 1 },
];

// 敵マスタ（雑魚3種、ボス2種、ラスボス1種）
const ENEMY_MASTER = {
  mob1: {
    enemyId: "mob1", name: "こうもり", rank: "雑魚",
    hpMax: 50, attack: 10, defense: 10,
    coinDrop: 5, coinDropRate: 1, itemDropCount: [1, 2], itemDropRate: 0.5,
    singleAttack: true, groupAttack: false, isBoss: false,
  },
  mob2: {
    enemyId: "mob2", name: "ねずみ", rank: "雑魚",
    hpMax: 50, attack: 10, defense: 10,
    coinDrop: 5, coinDropRate: 1, itemDropCount: [1, 2], itemDropRate: 0.5,
    singleAttack: false, groupAttack: true, isBoss: false,
  },
  mob3: {
    enemyId: "mob3", name: "とかげ", rank: "雑魚",
    hpMax: 50, attack: 20, defense: 0,
    coinDrop: 5, coinDropRate: 1, itemDropCount: [1, 2], itemDropRate: 0.5,
    singleAttack: true, groupAttack: true, isBoss: false,
  },
  boss1: {
    enemyId: "boss1", name: "ライオン", rank: "ボス",
    hpMax: 150, attack: 20, defense: 70,
    coinDrop: 30, coinDropRate: 1, itemDropCount: [3, 3], itemDropRate: 0.8,
    singleAttack: true, groupAttack: false, isBoss: true,
  },
  boss2: {
    enemyId: "boss2", name: "かば", rank: "ボス",
    hpMax: 150, attack: 70, defense: 20,
    coinDrop: 30, coinDropRate: 1, itemDropCount: [3, 3], itemDropRate: 0.8,
    singleAttack: false, groupAttack: true, isBoss: true,
  },
  lastboss: {
    enemyId: "lastboss", name: "ドラゴン", rank: "ラスボス",
    hpMax: 300, attack: 100, defense: 50,
    coinDrop: 300, coinDropRate: 1, itemDropCount: [6, 6], itemDropRate: 1,
    singleAttack: true, groupAttack: true, isBoss: true,
  },
};

// 通常エンカウントの出現重み（雑魚多め、ときどきボス/ラスボス）
const RANDOM_ENCOUNTER_TABLE = [
  { enemyId: "mob1", weight: 30 },
  { enemyId: "mob2", weight: 30 },
  { enemyId: "mob3", weight: 25 },
  { enemyId: "boss1", weight: 7 },
  { enemyId: "boss2", weight: 6 },
  { enemyId: "lastboss", weight: 2 },
];

// アイテムマスタ（回復／全体回復／攻撃／戦闘不可アイテムの例）
// dropRate: バランス仕様書「アイテム」表のドロップ率（%）。戦闘勝利時のドロップ抽選に使用。
const ITEM_MASTER = {
  1: { itemId: 1, name: "回復アイテム★", category: "回復", usableInExplore: true, usableInBattle: true, effectType: "HP回復", target: "single", effectValue: 10, dropRate: 90 },
  2: { itemId: 2, name: "回復アイテム★★", category: "回復", usableInExplore: true, usableInBattle: true, effectType: "HP回復", target: "single", effectValue: 20, dropRate: 60 },
  3: { itemId: 3, name: "回復アイテム★★★", category: "回復", usableInExplore: true, usableInBattle: true, effectType: "HP回復", target: "single", effectValue: 30, dropRate: 20 },
  4: { itemId: 4, name: "全体回復アイテム★", category: "回復", usableInExplore: true, usableInBattle: true, effectType: "HP回復", target: "party", effectValue: 5, dropRate: 90 },
  5: { itemId: 5, name: "全体回復アイテム★★", category: "回復", usableInExplore: true, usableInBattle: true, effectType: "HP回復", target: "party", effectValue: 10, dropRate: 50 },
  6: { itemId: 6, name: "全体回復アイテム★★★", category: "回復", usableInExplore: true, usableInBattle: true, effectType: "HP回復", target: "party", effectValue: 15, dropRate: 20 },
  7: { itemId: 7, name: "攻撃アイテム★", category: "戦闘", usableInExplore: false, usableInBattle: true, effectType: "ダメージ", target: "enemy", effectValue: 10, dropRate: 90 },
  8: { itemId: 8, name: "攻撃アイテム★★", category: "戦闘", usableInExplore: false, usableInBattle: true, effectType: "ダメージ", target: "enemy", effectValue: 20, dropRate: 60 },
  9: { itemId: 9, name: "攻撃アイテム★★★", category: "戦闘", usableInExplore: false, usableInBattle: true, effectType: "ダメージ", target: "enemy", effectValue: 30, dropRate: 20 },
  10: { itemId: 10, name: "マップの鍵", category: "探索イベント用", usableInExplore: true, usableInBattle: false, effectType: "イベント", target: "none", effectValue: 0 },
  11: { itemId: 11, name: "橋修復キット", category: "探索イベント用", usableInExplore: true, usableInBattle: false, effectType: "イベント", target: "none", effectValue: 0, dropRate: 0 },
};

// 戦闘勝利時のドロップ候補プール（バランス仕様書「ドロップする場所」列に対応）
// 雑魚モンスター: ★/★★ティア、ボスモンスター（ラスボス含む）: ★★★ティアのみ
const MOB_BATTLE_DROP_ITEM_IDS = [1, 2, 4, 5, 7, 8];
const BOSS_BATTLE_DROP_ITEM_IDS = [3, 6, 9];

// 動作確認用の初期所持アイテム（探索画面側の所持品データが未実装のためのダミー）
const INITIAL_INVENTORY = [
  { itemId: 1, quantity: 2 },
  { itemId: 2, quantity: 1 },
  { itemId: 4, quantity: 1 },
  { itemId: 7, quantity: 2 },
  { itemId: 10, quantity: 1 },
];