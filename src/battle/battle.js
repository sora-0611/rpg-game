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
    playerAvatar: document.getElementById("player-avatar"),
    playerName: document.getElementById("player-name"),
    playerStatsLine: document.getElementById("player-stats-line"),
    playerHpFill: document.getElementById("player-hp-fill"),
    playerHpValue: document.getElementById("player-hp-value"),
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
    menuTitleButton: document.getElementById("menu-title-button"),
    menuSettingsButton: document.getElementById("menu-settings-button"),
    menuCloseButton: document.getElementById("menu-close-button"),
    titleConfirmScrim: document.getElementById("title-confirm-scrim"),
    titleConfirmYes: document.getElementById("title-confirm-yes"),
    titleConfirmNo: document.getElementById("title-confirm-no"),
    toast: document.getElementById("toast"),
  };

  // ---------- 戦闘状態 ----------
  // phase: PLAYER_TURN | ENEMY_TURN | VICTORY | DEFEAT | ESCAPED
  const state = {
    characters: [],
    enemy: null,
    inventory: [],
    phase: "PLAYER_TURN",
    turnQueue: [],
    actingIndex: 0,
    pendingItemId: null,
    itemUsedThisOpen: false,
  };

  // ---------- 初期化 ----------

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
      state.phase = "PLAYER_TURN";
      state.pendingItemId = null;
      hideConfirm();
      closeAllWindows();
      startPlayerRound();
      logMessage(`${state.enemy.name}が現れた！`);
    } catch (error) {
      console.error(error);
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
      if (useGroupAttack) {
        aliveCharacters.forEach((target) => applyEnemyDamage(enemy, target));
        logMessage(`${enemy.name}の攻撃！パーティ全体が攻撃を受けた。`);
      } else {
        const target = aliveCharacters[Math.floor(Math.random() * aliveCharacters.length)];
        const damage = applyEnemyDamage(enemy, target);
        logMessage(`${enemy.name}の攻撃！${target.name}は${damage}のダメージを受けた。`);
      }
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
    let damage = Math.max(1, enemy.attack - target.defense);
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
      const damage = Math.max(1, attacker.attack - state.enemy.defense);
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

  function selectItem(itemId) {
    const item = ITEM_MASTER[itemId];
    if (!item.usableInBattle) {
      // エラー・例外仕様書: 戦闘で使用できないアイテムを使う
      logMessage("このアイテムは戦闘では使用できません。");
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

  // ---------- 勝敗 ----------
  function onVictory() {
    state.phase = "VICTORY";
    const enemy = state.enemy;
    const coin = Math.random() < enemy.coinDropRate ? enemy.coinDrop : 0;
    const [minDrop, maxDrop] = enemy.itemDropCount;
    const itemCount = Math.random() < enemy.itemDropRate
      ? minDrop + Math.floor(Math.random() * (maxDrop - minDrop + 1))
      : 0;
    let resultText = `${enemy.name}を倒した。`;
    if (coin > 0) resultText += ` コインを${coin}枚手に入れた。`;
    if (itemCount > 0) resultText += ` アイテムを${itemCount}個手に入れた。`;
    logMessage(resultText);
    renderAll();
  }

  function onDefeat() {
    state.phase = "DEFEAT";
    logMessage("全滅した。");
    renderAll();
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
    dom.titleConfirmScrim.hidden = true;
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
  function renderActiveCharacterBox() {
    const displayCharacter = state.phase === "PLAYER_TURN"
      ? getActingCharacter()
      : state.characters.find((c) => c.hpCurrent > 0) || state.characters[0];
    dom.playerName.textContent = displayCharacter.name;
    dom.playerAvatar.textContent = displayCharacter.name.charAt(displayCharacter.name.length - 1);
    dom.playerStatsLine.textContent = `攻撃 ${displayCharacter.attack}　防御 ${displayCharacter.defense}`;
    setHpBar(dom.playerHpFill, dom.playerHpValue, displayCharacter.hpCurrent, displayCharacter.hpMax);
  }

  function renderCommands() {
    const battleOver = state.phase === "VICTORY" || state.phase === "DEFEAT" || state.phase === "ESCAPED";
    const isPlayerTurn = state.phase === "PLAYER_TURN";

    dom.btnEnd.hidden = !battleOver;
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
      row.className = "item-row" + (item.usableInBattle ? "" : " is-unavailable");
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

  dom.itemCloseButton.addEventListener("click", closeItemWindow);
  dom.fleeYesButton.addEventListener("click", handleFleeYes);
  dom.fleeNoButton.addEventListener("click", handleFleeNo);
  dom.fleeCloseButton.addEventListener("click", closeFleeWindow);

  dom.menuButton.addEventListener("click", () => {
    dom.menuWindow.hidden = false;
  });
  dom.menuCloseButton.addEventListener("click", () => {
    dom.menuWindow.hidden = true;
  });
  dom.menuTitleButton.addEventListener("click", () => {
    dom.titleConfirmScrim.hidden = false;
  });
  dom.menuSettingsButton.addEventListener("click", () => {
    showToast("設定画面は未実装です。");
  });
  dom.titleConfirmYes.addEventListener("click", () => {
    dom.titleConfirmScrim.hidden = true;
    dom.menuWindow.hidden = true;
    showToast("タイトル画面へ戻りました（デモ）。");
  });
  dom.titleConfirmNo.addEventListener("click", () => {
    dom.titleConfirmScrim.hidden = true;
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
