/**
 * 戦闘画面ロジック
 * 参照ドキュメント:
 *  - 2_基本設計/1_画面設計/4_画面レイアウト/戦闘画面/*.png（レイアウト）
 *  - 2_基本設計/5_文言仕様書.md（文言）
 *  - 3_詳細設計/1_状態定義書.md（状態・活性/非活性）
 *  - 3_詳細設計/3_エラー・例外仕様書.md（エラー文言）
 *  - 3_詳細設計/4_バランス仕様書.md（数値バランス）
 */

(function () {
  "use strict";

  // ---------- DOM参照 ----------
  const dom = {
    menuButton: document.getElementById("menu-button"),
    enemyBox: document.getElementById("enemy-box"),
    enemyAvatar: document.getElementById("enemy-avatar"),
    enemyName: document.getElementById("enemy-name"),
    enemyRankTag: document.getElementById("enemy-rank-tag"),
    enemyStatsLine: document.getElementById("enemy-stats-line"),
    enemyHpFill: document.getElementById("enemy-hp-fill"),
    enemyHpValue: document.getElementById("enemy-hp-value"),
    enemyHpBlock: document.getElementById("enemy-hp-block"),
    playerAvatar: document.getElementById("player-avatar"),
    playerName: document.getElementById("player-name"),
    playerStatsLine: document.getElementById("player-stats-line"),
    playerHpFill: document.getElementById("player-hp-fill"),
    playerHpValue: document.getElementById("player-hp-value"),
    playerHpBlock: document.getElementById("player-hp-block"),
    partyStatus: document.getElementById("party-status"),
    btnFight: document.getElementById("btn-fight"),
    btnItem: document.getElementById("btn-item"),
    btnDefend: document.getElementById("btn-defend"),
    btnFlee: document.getElementById("btn-flee"),
    btnEnd: document.getElementById("btn-end"),
    messageText: document.getElementById("message-text"),
    confirmButtons: document.getElementById("confirm-buttons"),
    confirmYes: document.getElementById("confirm-yes"),
    confirmNo: document.getElementById("confirm-no"),
    itemWindow: document.getElementById("item-window"),
    itemList: document.getElementById("item-list"),
    itemCloseButton: document.getElementById("item-close-button"),
    fleeWindow: document.getElementById("flee-window"),
    fleeYesButton: document.getElementById("flee-yes-button"),
    fleeNoButton: document.getElementById("flee-no-button"),
    fleeCloseButton: document.getElementById("flee-close-button"),
    menuWindow: document.getElementById("menu-window"),
    menuSettingsButton: document.getElementById("menu-settings-button"),
    menuCloseButton: document.getElementById("menu-close-button"),
    toast: document.getElementById("toast"),
  };

  // ---------- 戦闘状態 ----------
  // phase: PLAYER_TURN | ENEMY_TURN | VICTORY | DEFEAT | ESCAPED
  const state = {
    characters: [],
    enemy: null,
    inventory: [],
    coin: 0,
    hasIncomingSave: false,
    phase: "PLAYER_TURN",
    turnQueue: [],
    actingIndex: 0,
    pendingItemId: null,
    itemUsedThisOpen: false,
  };

  // ---------- 初期化 ----------

  // 探索画面(gameState)から引き継いだHP・所持品・コインをローカルstateに反映する
  // 引き継ぎ元が無い場合（単体で戦闘画面を開いた場合）はCHARACTERS_BASE/INITIAL_INVENTORYのまま
  function applyIncomingGameState() {
    const gameState = window.BRIDGE && BRIDGE.readRawGameState();
    if (!gameState) {
      state.hasIncomingSave = false;
      state.coin = 0;
      return;
    }

    state.hasIncomingSave = true;
    state.coin = gameState.player && typeof gameState.player.coin === "number" ? gameState.player.coin : 0;

    (gameState.party || []).forEach((member) => {
      const target = state.characters.find((c) => c.characterId === member.characterId);
      if (!target) return;
      target.hpMax = member.hpMax;
      target.hpCurrent = Math.max(0, Math.min(member.hpCurrent, member.hpMax));
      target.attack = member.attack;
      target.defense = member.defense;
      target.enhanceLevel = member.enhanceLevel;
    });

    state.inventory = (gameState.inventory || [])
      .map((entry) => ({ itemId: BRIDGE.ITEM_ID_TO_BATTLE[entry.itemId], quantity: entry.quantity }))
      .filter((entry) => entry.itemId !== undefined);
  }

  // 戦闘開始処理。enemyId未指定時は出現テーブルから抽選する（探索画面から渡される想定）
  function startBattle(enemyId) {
    try {
      const enemyTemplate = ENEMY_MASTER[enemyId] || ENEMY_MASTER[pickRandomEncounterId()];
      if (!enemyTemplate) {
        throw new Error("invalid enemy data");
      }
      state.characters = CHARACTERS_BASE.map((c) => Object.assign({}, c, { hpCurrent: c.hpMax, isDefending: false }));
      state.enemy = Object.assign({}, enemyTemplate, { hpCurrent: enemyTemplate.hpMax });
      state.inventory = INITIAL_INVENTORY.map((entry) => Object.assign({}, entry));
      applyIncomingGameState();
      state.phase = "PLAYER_TURN";
      state.pendingItemId = null;
      hideConfirm();
      closeAllWindows();
      // 戦闘データが正しく揃ったのでHPバーを表示する（前回失敗時に非表示にした分を戻す）
      dom.enemyHpBlock.hidden = false;
      dom.playerHpBlock.hidden = false;
      startPlayerRound();
      logMessage(`${state.enemy.name}が現れた！`);
    } catch (error) {
      console.error(error);
      // 戦闘データがない状態: HPバーは表示する情報が無いため非表示にする
      dom.enemyHpBlock.hidden = true;
      dom.playerHpBlock.hidden = true;
      logMessage("セーブデータが壊れています。セーブデータを消去し、最初から遊びますか？");
    }
  }

  function pickRandomEncounterId() {
    const totalWeight = RANDOM_ENCOUNTER_TABLE.reduce((sum, row) => sum + row.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const row of RANDOM_ENCOUNTER_TABLE) {
      if (roll < row.weight) return row.enemyId;
      roll -= row.weight;
    }
    return RANDOM_ENCOUNTER_TABLE[0].enemyId;
  }

  // ---------- ターン制御 ----------

  // プレイヤーターン開始時: 生存キャラクターで行動順キューを作る（状態定義書: コマンド選択可能）
  function startPlayerRound() {
    state.turnQueue = state.characters
      .map((c, index) => index)
      .filter((index) => state.characters[index].hpCurrent > 0);
    if (state.turnQueue.length === 0) {
      onDefeat();
      return;
    }
    state.actingIndex = state.turnQueue[0];
    state.phase = "PLAYER_TURN";
    renderAll();
  }

  function getActingCharacter() {
    return state.characters[state.actingIndex];
  }

  // 1キャラクターの行動が終わったら次のキャラクターへ。全員終わったら敵ターンへ
  function advanceTurn() {
    state.turnQueue.shift();
    if (state.turnQueue.length === 0) {
      state.phase = "ENEMY_TURN";
      renderAll();
      window.setTimeout(enemyTurn, 700);
      return;
    }
    state.actingIndex = state.turnQueue[0];
    renderAll();
  }

  // 敵ターン: singleAttack/groupAttackフラグに応じて単体または全体を攻撃する
  function enemyTurn() {
    if (state.phase !== "ENEMY_TURN") return;
    try {
      const enemy = state.enemy;
      const aliveCharacters = state.characters.filter((c) => c.hpCurrent > 0);
      if (aliveCharacters.length === 0) {
        onDefeat();
        return;
      }
      const useGroupAttack = enemy.groupAttack && (!enemy.singleAttack || Math.random() < 0.5);
      const newlyDowned = [];
      let message;
      if (useGroupAttack) {
        aliveCharacters.forEach((target) => {
          applyEnemyDamage(enemy, target);
          if (target.hpCurrent <= 0) newlyDowned.push(target.name);
        });
        message = `${enemy.name}の攻撃！パーティ全体が攻撃を受けた。`;
      } else {
        const target = aliveCharacters[Math.floor(Math.random() * aliveCharacters.length)];
        const damage = applyEnemyDamage(enemy, target);
        message = `${enemy.name}の攻撃！${target.name}は${damage}のダメージを受けた。`;
        if (target.hpCurrent <= 0) newlyDowned.push(target.name);
      }
      // 戦闘不能になったキャラクターがいれば、行動が回ってこない理由が分かるように明示する
      if (newlyDowned.length > 0) {
        message += ` ${newlyDowned.join("、")}は戦闘不能になった！`;
      }
      logMessage(message);
      state.characters.forEach((c) => {
        c.isDefending = false;
      });
      if (state.characters.every((c) => c.hpCurrent <= 0)) {
        onDefeat();
        return;
      }
      startPlayerRound();
    } catch (error) {
      console.error(error);
      logMessage("処理に失敗しました。もう一度お試しください。");
    }
  }

  // 被ダメージ計算（防御中は半減）。バランス仕様書に計算式の定義はないため、簡易な攻撃力-防御力方式を採用する
  function applyEnemyDamage(enemy, target) {
    let damage = Math.max(0, enemy.attack - target.defense);
    if (target.isDefending) {
      damage = Math.ceil(damage / 2);
    }
    target.hpCurrent = Math.max(0, target.hpCurrent - damage);
    return damage;
  }

  // ---------- コマンド: 戦う ----------
  function handleFight() {
    if (state.phase !== "PLAYER_TURN") return;
    try {
      const attacker = getActingCharacter();
      const damage = Math.max(0, attacker.attack - state.enemy.defense);
      state.enemy.hpCurrent = Math.max(0, state.enemy.hpCurrent - damage);
      logMessage(`${attacker.name}の攻撃！${state.enemy.name}に${damage}のダメージを与えた。`);
      renderAll();
      if (state.enemy.hpCurrent <= 0) {
        onVictory();
        return;
      }
      advanceTurn();
    } catch (error) {
      console.error(error);
      logMessage("処理に失敗しました。もう一度お試しください。");
    }
  }

  // ---------- コマンド: 防御 ----------
  function handleDefend() {
    if (state.phase !== "PLAYER_TURN") return;
    const attacker = getActingCharacter();
    attacker.isDefending = true;
    logMessage(`${attacker.name}は身を守っている。`);
    advanceTurn();
  }

  // ---------- コマンド: 逃げる ----------
  function handleFleeButton() {
    if (state.phase !== "PLAYER_TURN") return;
    if (state.enemy.isBoss) {
      // 状態定義書: 逃走不可（ボス戦）。ボタンは押せるが必ずエラー文言を表示する
      logMessage("今は逃げられない。");
      return;
    }
    dom.fleeWindow.hidden = false;
  }

  function closeFleeWindow() {
    dom.fleeWindow.hidden = true;
  }

  function handleFleeYes() {
    closeFleeWindow();
    const escaped = Math.random() < 0.7; // 用語集: 逃げるは確率で失敗することがある
    if (escaped) {
      state.phase = "ESCAPED";
      logMessage("逃げた。");
      renderAll();
    } else {
      logMessage("うまく逃げられなかった！");
      advanceTurn();
    }
  }

  function handleFleeNo() {
    closeFleeWindow();
  }

  // ---------- コマンド: アイテム ----------
  function handleItemButton() {
    if (state.phase !== "PLAYER_TURN") return;
    if (getTotalItemQuantity() === 0) return;
    state.itemUsedThisOpen = false;
    renderItemList();
    dom.itemWindow.hidden = false;
  }

  function closeItemWindow() {
    dom.itemWindow.hidden = true;
    state.pendingItemId = null;
    hideConfirm();
    if (state.itemUsedThisOpen) {
      state.itemUsedThisOpen = false;
      if (state.phase === "PLAYER_TURN") {
        advanceTurn();
      }
    }
  }

  function getTotalItemQuantity() {
    return state.inventory.reduce((sum, entry) => sum + entry.quantity, 0);
  }

  function isHpFullForItem(item) {
    if (item.effectType !== "HP回復") return false;
    if (item.target === "single") {
      const target = getActingCharacter();
      return target.hpCurrent >= target.hpMax;
    }
    if (item.target === "party") {
      return state.characters.every((c) => c.hpCurrent <= 0 || c.hpCurrent >= c.hpMax);
    }
    return false;
  }

  function selectItem(itemId) {
    const item = ITEM_MASTER[itemId];
    if (!item.usableInBattle) {
      // エラー・例外仕様書: 戦闘で使用できないアイテムを使う
      logMessage("このアイテムは戦闘では使用できません。");
      return;
    }
    if (isHpFullForItem(item)) {
      logMessage("HPが満タンのため使用できません。");
      return;
    }
    state.pendingItemId = itemId;
    showConfirm(`${item.name}を使用しますか？`, onItemConfirmYes, onItemConfirmNo);
  }

  function onItemConfirmYes() {
    const itemId = state.pendingItemId;
    const item = ITEM_MASTER[itemId];
    consumeInventoryItem(itemId);

    let resultText = "";
    if (item.effectType === "HP回復" && item.target === "single") {
      const target = getActingCharacter();
      const before = target.hpCurrent;
      target.hpCurrent = Math.min(target.hpMax, target.hpCurrent + item.effectValue);
      const healed = target.hpCurrent - before;
      resultText = target.hpCurrent >= target.hpMax
        ? `${item.name}を使用した。${target.name}が全回復した！`
        : `${item.name}を使用した。${target.name}のHPが${healed}回復した。`;
    } else if (item.effectType === "HP回復" && item.target === "party") {
      state.characters.forEach((c) => {
        if (c.hpCurrent > 0) {
          c.hpCurrent = Math.min(c.hpMax, c.hpCurrent + item.effectValue);
        }
      });
      resultText = `${item.name}を使用した。パーティ全体のHPが${item.effectValue}回復した。`;
    } else if (item.effectType === "ダメージ") {
      state.enemy.hpCurrent = Math.max(0, state.enemy.hpCurrent - item.effectValue);
      resultText = `${item.name}を使用した。${state.enemy.name}に${item.effectValue}のダメージを与えた。`;
    }

    state.itemUsedThisOpen = true;
    state.pendingItemId = null;
    hideConfirm();
    logMessage(resultText);
    renderItemList();
    renderAll();

    if (state.enemy.hpCurrent <= 0) {
      dom.itemWindow.hidden = true;
      onVictory();
    }
  }

  function onItemConfirmNo() {
    state.pendingItemId = null;
    hideConfirm();
  }

  function consumeInventoryItem(itemId) {
    const entry = state.inventory.find((e) => e.itemId === itemId);
    if (!entry) return;
    entry.quantity -= 1;
    if (entry.quantity <= 0) {
      state.inventory = state.inventory.filter((e) => e.itemId !== itemId);
    }
  }

  function addInventoryItem(itemId, quantity) {
    const entry = state.inventory.find((e) => e.itemId === itemId);
    if (entry) {
      entry.quantity += quantity;
    } else {
      state.inventory.push({ itemId, quantity });
    }
  }

  // 敵撃破時のアイテムドロップ抽選（3_詳細設計/4_バランス仕様書.md「アイテム」表に準拠）
  // スロット数（itemDropCount）分、抽選候補プールから1つ選び、そのアイテム自身のdropRateで成否判定する
  function rollBattleItemDrops(enemy, slotCount) {
    const poolIds = enemy.isBoss ? BOSS_BATTLE_DROP_ITEM_IDS : MOB_BATTLE_DROP_ITEM_IDS;
    const obtainedCounts = {};
    for (let i = 0; i < slotCount; i++) {
      const candidateId = poolIds[Math.floor(Math.random() * poolIds.length)];
      const candidate = ITEM_MASTER[candidateId];
      if (Math.random() * 100 < candidate.dropRate) {
        addInventoryItem(candidateId, 1);
        obtainedCounts[candidateId] = (obtainedCounts[candidateId] || 0) + 1;
      }
    }
    return obtainedCounts;
  }

  // ---------- 勝敗 ----------
  function onVictory() {
    state.phase = "VICTORY";
    const enemy = state.enemy;
    const coin = Math.random() < enemy.coinDropRate ? enemy.coinDrop : 0;
    const [minDrop, maxDrop] = enemy.itemDropCount;
    const slotCount = Math.random() < enemy.itemDropRate
      ? minDrop + Math.floor(Math.random() * (maxDrop - minDrop + 1))
      : 0;
    const obtainedCounts = rollBattleItemDrops(enemy, slotCount);
    state.coin += coin;

    let resultText = `${enemy.name}を倒した。`;
    if (coin > 0) resultText += ` コインを${coin}枚手に入れた。`;
    const obtainedNames = Object.keys(obtainedCounts).map(
      (id) => `${ITEM_MASTER[id].name}×${obtainedCounts[id]}`
    );
    if (obtainedNames.length > 0) resultText += ` ${obtainedNames.join("、")}を手に入れた。`;
    logMessage(resultText);
    renderAll();
  }

  function onDefeat() {
    state.phase = "DEFEAT";
    logMessage("全滅した。");
    renderAll();
  }

  // ---------- 探索画面への復帰 ----------

  // 戦闘結果をgameStateに反映してlocalStorageへ書き戻す。
  // 敗北時は探索画面のendBattleDefeat()と同じ仕様（全回復+開始位置(1,1)へリセット）に揃える。
  // 勝利・逃亡時は実際のHP・所持品・コインをそのまま引き継ぐ。
  function applyBattleResultToGameState() {
    const gameState = BRIDGE.readRawGameState();
    if (!gameState) return;

    if (state.phase === "DEFEAT") {
      gameState.party.forEach((member) => {
        member.hpCurrent = member.hpMax;
      });
      gameState.player.pos = { x: 1, y: 1 };
    } else {
      state.characters.forEach((c) => {
        const member = gameState.party.find((p) => p.characterId === c.characterId);
        if (member) member.hpCurrent = Math.max(0, Math.min(c.hpCurrent, member.hpMax));
      });
    }

    gameState.inventory = state.inventory
      .filter((entry) => BRIDGE.ITEM_ID_TO_RPG[entry.itemId])
      .map((entry) => ({ itemId: BRIDGE.ITEM_ID_TO_RPG[entry.itemId], quantity: entry.quantity }));

    gameState.player.coin = state.coin;

    if (state.phase === "VICTORY" && state.enemy.isBoss) {
      const mapId = gameState.player.currentMapId;
      if (gameState.mapProgress[mapId]) gameState.mapProgress[mapId].bossDefeated = true;
      gameState.scene = "MAP_SELECT";
    } else {
      gameState.scene = "EXPLORE";
    }

    gameState.battle.isActive = false;
    gameState.battle.enemies = [];
    gameState.battle.log = [];

    BRIDGE.writeRawGameState(gameState);
  }

  // 「戦闘終了」ボタン: 探索画面から来ていれば結果を反映して戻る。単体テスト起動時は戻り先が無い。
  function handleBattleEnd() {
    const battleOver = state.phase === "VICTORY" || state.phase === "DEFEAT" || state.phase === "ESCAPED";
    if (!battleOver) return;
    if (!state.hasIncomingSave) {
      showToast("この画面は単体テスト用です（戻り先がありません）。");
      return;
    }
    applyBattleResultToGameState();
    window.location.assign("../rpg-game/explore.html");
  }

  // ---------- メッセージ / 確認 ----------
  function logMessage(text) {
    dom.messageText.textContent = text;
  }

  function showConfirm(text, onYes, onNo) {
    dom.messageText.textContent = text;
    dom.confirmButtons.hidden = false;
    dom.confirmYes.onclick = onYes;
    dom.confirmNo.onclick = onNo;
  }

  function hideConfirm() {
    dom.confirmButtons.hidden = true;
  }

  // ---------- メニュー / トースト ----------
  function closeAllWindows() {
    dom.itemWindow.hidden = true;
    dom.fleeWindow.hidden = true;
    dom.menuWindow.hidden = true;
    dom.menuButton.hidden = false;
  }

  function openMenuWindow() {
    dom.menuWindow.hidden = false;
    dom.menuButton.hidden = true;
  }

  function closeMenuWindow() {
    dom.menuWindow.hidden = true;
    dom.menuButton.hidden = false;
  }

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    window.setTimeout(() => {
      dom.toast.hidden = true;
    }, 1600);
  }

  // ---------- 描画 ----------
  function renderAll() {
    renderEnemy();
    renderActiveCharacterBox();
    renderPartyStatus();
    renderCommands();
  }

  function hpBarClass(current, max) {
    if (current <= 0) return "hp-zero";
    const ratio = current / max;
    if (ratio <= 0.2) return "hp-low";
    if (ratio <= 0.5) return "hp-middle";
    return "";
  }

  function setHpBar(fillEl, valueEl, current, max) {
    const ratio = max > 0 ? Math.max(0, current) / max : 0;
    fillEl.style.width = `${Math.round(ratio * 100)}%`;
    fillEl.className = `hp-bar-fill ${hpBarClass(current, max)}`.trim();
    if (valueEl) valueEl.textContent = `${Math.max(0, current)} / ${max}`;
  }

  function renderEnemy() {
    const enemy = state.enemy;
    dom.enemyName.textContent = enemy.name;
    dom.enemyAvatar.textContent = enemy.name.charAt(0);
    dom.enemyRankTag.textContent = enemy.isBoss ? `【${enemy.rank}】` : "";
    dom.enemyStatsLine.textContent = `攻撃力 ${enemy.attack} / 防御力 ${enemy.defense}`;
    dom.enemyBox.classList.toggle("is-boss", !!enemy.isBoss);
    setHpBar(dom.enemyHpFill, dom.enemyHpValue, enemy.hpCurrent, enemy.hpMax);
  }

  // ワイヤーフレームの「プレイヤー」枠は、行動中（または先頭の生存中）キャラクターを表示する
  // VICTORY/ESCAPEDは直前まで行動していたキャラクターのHPをそのまま表示する（先頭生存者に切り替えるとHP表示が瞬間的に不一致に見えるため）
  function renderActiveCharacterBox() {
    const displayCharacter = state.phase === "PLAYER_TURN" || state.phase === "VICTORY" || state.phase === "ESCAPED"
      ? getActingCharacter()
      : state.characters.find((c) => c.hpCurrent > 0) || state.characters[0];
    dom.playerName.textContent = displayCharacter.name;
    dom.playerAvatar.textContent = displayCharacter.name.charAt(displayCharacter.name.length - 1);
    dom.playerStatsLine.textContent = `攻撃 ${displayCharacter.attack}　防御 ${displayCharacter.defense}`;
    setHpBar(dom.playerHpFill, dom.playerHpValue, displayCharacter.hpCurrent, displayCharacter.hpMax);
  }

  // パーティ全員のHP・戦闘不能状態を常時一覧表示する（行動中キャラだけだと誰が戦闘不能か分からず、
  // なぜそのキャラにばかりターンが回ってくるのか分かりにくいため）
  function renderPartyStatus() {
    dom.partyStatus.innerHTML = "";
    state.characters.forEach((character, index) => {
      const isDown = character.hpCurrent <= 0;
      const isActing = state.phase === "PLAYER_TURN" && index === state.actingIndex;

      const row = document.createElement("li");
      row.className = "party-status-row" + (isDown ? " is-down" : "") + (isActing ? " is-acting" : "");
      row.innerHTML = `
        <span class="party-status-name">${character.name}</span>
        <span class="party-status-hp-bar"><span class="party-status-hp-fill"></span></span>
        <span class="party-status-hp-value"></span>
      `;

      const fillEl = row.querySelector(".party-status-hp-fill");
      const valueEl = row.querySelector(".party-status-hp-value");
      const ratio = character.hpMax > 0 ? Math.max(0, character.hpCurrent) / character.hpMax : 0;
      fillEl.style.width = `${Math.round(ratio * 100)}%`;
      fillEl.className = `party-status-hp-fill ${hpBarClass(character.hpCurrent, character.hpMax)}`.trim();
      valueEl.textContent = isDown ? "戦闘不能" : `${Math.max(0, character.hpCurrent)} / ${character.hpMax}`;

      dom.partyStatus.appendChild(row);
    });
  }

  function renderCommands() {
    const battleOver = state.phase === "VICTORY" || state.phase === "DEFEAT" || state.phase === "ESCAPED";
    const isPlayerTurn = state.phase === "PLAYER_TURN";

    dom.btnEnd.hidden = !battleOver;
    dom.btnEnd.disabled = !battleOver;
    [dom.btnFight, dom.btnItem, dom.btnDefend, dom.btnFlee].forEach((btn) => {
      btn.hidden = battleOver;
    });

    dom.btnFight.disabled = !isPlayerTurn;
    dom.btnDefend.disabled = !isPlayerTurn;
    dom.btnItem.disabled = !isPlayerTurn || getTotalItemQuantity() === 0;

    dom.btnFlee.disabled = !isPlayerTurn;
    dom.btnFlee.classList.toggle("is-disabled-visual", isPlayerTurn && !!state.enemy.isBoss);
  }

  function renderItemList() {
    dom.itemList.innerHTML = "";
    if (state.inventory.length === 0) {
      const empty = document.createElement("li");
      empty.className = "item-row is-unavailable";
      empty.textContent = "アイテムがありません";
      dom.itemList.appendChild(empty);
      return;
    }
    state.inventory.forEach((entry) => {
      const item = ITEM_MASTER[entry.itemId];
      const row = document.createElement("li");
      const isUnavailable = !item.usableInBattle || isHpFullForItem(item);
      row.className = "item-row" + (isUnavailable ? " is-unavailable" : "");
      row.innerHTML = `<span>・${item.name}</span><span class="item-row-qty">×${entry.quantity}</span>`;
      row.addEventListener("click", () => selectItem(item.itemId));
      dom.itemList.appendChild(row);
    });
  }

  // ---------- イベント登録 ----------
  dom.btnFight.addEventListener("click", handleFight);
  dom.btnDefend.addEventListener("click", handleDefend);
  dom.btnItem.addEventListener("click", handleItemButton);
  dom.btnFlee.addEventListener("click", handleFleeButton);
  dom.btnEnd.addEventListener("click", handleBattleEnd);

  dom.itemCloseButton.addEventListener("click", closeItemWindow);
  dom.fleeYesButton.addEventListener("click", handleFleeYes);
  dom.fleeNoButton.addEventListener("click", handleFleeNo);
  dom.fleeCloseButton.addEventListener("click", closeFleeWindow);

  dom.menuButton.addEventListener("click", openMenuWindow);
  dom.menuCloseButton.addEventListener("click", closeMenuWindow);
  dom.menuSettingsButton.addEventListener("click", () => {
    showToast("設定画面は未実装です。");
  });

  // ---------- 起動 ----------
  // ?enemy=boss1 のようにクエリ指定で出現敵を固定できる（探索画面からの遷移を想定したフック）
  function getEnemyIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("enemy");
  }

  window.startBattle = startBattle;
  startBattle(getEnemyIdFromQuery() || undefined);
})();
