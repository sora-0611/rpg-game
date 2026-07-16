/**
 * bridge.js
 * 戦闘画面(src/battle)と探索画面(src/rpg-game)の橋渡し。
 * 両者は敵ID・アイテムIDのスキーマが異なる（数値 vs 文字列）ため、ここで対応表を持つ。
 * localStorage の 'rpg-game-save' キーを直接読み書きし、rpg-game側の gameState を引き継ぐ。
 */
(function () {
  "use strict";

  const ENEMY_ID_TO_RPG = {
    mob1: "slime_1",
    mob2: "slime_2",
    mob3: "slime_3",
    boss1: "boss_1",
    boss2: "boss_2",
    lastboss: "final_boss",
  };
  const ENEMY_ID_TO_BATTLE = {
    slime_1: "mob1",
    slime_2: "mob2",
    slime_3: "mob3",
    boss_1: "boss1",
    boss_2: "boss2",
    final_boss: "lastboss",
  };

  // 10(マップの鍵)は対応なし・探索専用アイテムのため対象外
  const ITEM_ID_TO_RPG = {
    1: "heal_1",
    2: "heal_2",
    3: "heal_3",
    4: "heal_group_1",
    5: "heal_group_2",
    6: "heal_group_3",
    7: "dmg_1",
    8: "dmg_2",
    9: "dmg_3",
    11: "bridge_repair_kit",
  };
  const ITEM_ID_TO_BATTLE = {
    heal_1: 1,
    heal_2: 2,
    heal_3: 3,
    heal_group_1: 4,
    heal_group_2: 5,
    heal_group_3: 6,
    dmg_1: 7,
    dmg_2: 8,
    dmg_3: 9,
    bridge_repair_kit: 11,
  };

  const SAVE_KEY = "rpg-game-save"; // src/rpg-game/js/save.js と同じキー

  function readRawGameState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("gameStateの読み込みに失敗しました。", error);
      return null;
    }
  }

  function writeRawGameState(gameState) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }

  function clearRawGameState() {
    localStorage.removeItem(SAVE_KEY);
  }

  window.BRIDGE = {
    ENEMY_ID_TO_RPG,
    ENEMY_ID_TO_BATTLE,
    ITEM_ID_TO_RPG,
    ITEM_ID_TO_BATTLE,
    readRawGameState,
    writeRawGameState,
    clearRawGameState,
  };
})();
