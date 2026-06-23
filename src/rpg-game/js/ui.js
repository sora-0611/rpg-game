/**
 * ui.js
 * ゲーム画面描画・UI制御
 */

// ===== CONSTANTS =====
const SCREEN_MAP = {
  LOADING: 'screen-loading',
  TITLE: 'screen-title',
  MAPS: 'screen-maps',
  EXPLORE: 'screen-explore',
  BATTLE: 'screen-battle',
  UPGRADE: 'screen-upgrade',
  ITEMS: 'screen-items',
  SETTINGS: 'screen-settings',
};

// ===== UTILITY FUNCTIONS =====

/**
 * 指定されたスクリーンを表示
 * @param {string} screenId
 */
function showScreen(screenId) {
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('screen--hidden');
  }
}

/**
 * 指定されたスクリーンを非表示
 * @param {string} screenId
 */
function hideScreen(screenId) {
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('screen--hidden');
  }
}

/**
 * すべてのスクリーンを非表示
 */
function hideAllScreens() {
  Object.values(SCREEN_MAP).forEach(screenId => hideScreen(screenId));
}

/**
 * 指定された要素のテキストを更新
 * @param {string} elementId
 * @param {string} text
 */
function setText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

/**
 * HPバーを更新
 * @param {string} hpbarId
 * @param {number} current
 * @param {number} max
 */
function updateHpBar(hpbarId, current, max) {
  const hpbar = document.getElementById(hpbarId);
  if (!hpbar) return;

  const fill = hpbar.querySelector('.hpbar-fill');
  if (!fill) return;

  const percentage = max > 0 ? (current / max) * 100 : 0;
  fill.style.width = percentage + '%';

  // 状態クラスを更新
  hpbar.classList.remove('hpbar--warning', 'hpbar--danger');
  if (current <= 0) {
    hpbar.classList.add('hpbar--danger');
  } else if (current <= max * 0.33) {
    hpbar.classList.add('hpbar--danger');
  } else if (current <= max * 0.66) {
    hpbar.classList.add('hpbar--warning');
  }
}

/**
 * メッセージウィンドウにテキストを表示
 * @param {string} elementId
 * @param {string} text
 */
function setMessage(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}

/**
 * トースト通知を表示
 * @param {string} text
 * @param {string} type 'success' | 'error' | 'info'
 * @param {number} duration
 */
function showToast(text, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = text;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 確認ダイアログを表示
 * @param {string} message
 * @return {Promise<boolean>}
 */
function showConfirmDialog(message) {
  return new Promise(resolve => {
    const container = document.getElementById('dialog-container');
    if (!container) {
      resolve(false);
      return;
    }

    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog">
        <p class="dialog-message">${message}</p>
        <div class="dialog-buttons">
          <button class="btn btn--primary dialog-btn-confirm">OK</button>
          <button class="btn btn--secondary dialog-btn-cancel">キャンセル</button>
        </div>
      </div>
    `;

    const confirmBtn = dialog.querySelector('.dialog-btn-confirm');
    const cancelBtn = dialog.querySelector('.dialog-btn-cancel');

    confirmBtn.addEventListener('click', () => {
      dialog.remove();
      resolve(true);
    });

    cancelBtn.addEventListener('click', () => {
      dialog.remove();
      resolve(false);
    });

    container.appendChild(dialog);
  });
}

// ===== PARTY STATUS RENDERING =====

/**
 * パーティー情報を更新（HP、攻撃、防御）
 * @param {Object} gameState
 * @param {string} context 'explore' | 'battle'
 */
function updatePartyStatus(gameState, context = 'explore') {
  gameState.party.forEach((char, idx) => {
    const charId = char.characterId;
    const prefix = context === 'battle' ? 'battle' : 'status';
    const charCardId = `${prefix}-char-${charId}`;
    const hpbarId = `hpbar-${context}-${charId}`;
    const hpTextSelector = `#${charCardId} .card-hp`;

    // HP表示
    updateHpBar(hpbarId, char.hpCurrent, char.hpMax);
    const hpText = document.querySelector(hpTextSelector);
    if (hpText) {
      hpText.textContent = `${char.hpCurrent}/${char.hpMax}`;
    }
  });
}

// ===== SCREEN RENDER FUNCTIONS =====

/**
 * タイトル画面をレンダリング
 * @param {Object} gameState
 */
function renderTitleScreen(gameState) {
  const continueBtn = document.getElementById('btn-title-continue');
  const hasSave = typeof SAVE !== 'undefined' && SAVE.hasSavedGame();
  if (continueBtn) {
    continueBtn.disabled = !hasSave;
    continueBtn.classList.toggle('btn--disabled', !hasSave);
  }
}

/**
 * マップ選択画面をレンダリング
 * @param {Object} gameState
 */
function renderMapSelectScreen(gameState) {
  const mapProgress = gameState.mapProgress;

  // 各マップのボタン状態を更新
  for (let mapId = 1; mapId <= 3; mapId++) {
    const button = document.getElementById(`btn-map-select-${mapId}`);
    const statusDiv = document.getElementById(`map-status-${mapId}`);

    if (!button) continue;

    // マップ1は常に選択可能
    if (mapId === 1) {
      button.classList.remove('btn--disabled');
      button.disabled = false;
    } else {
      // マップ2以降は前のマップがクリアされていれば選択可能
      const prevMapCleared = mapProgress[mapId - 1]?.bossDefeated;
      if (prevMapCleared) {
        button.classList.remove('btn--disabled');
        button.disabled = false;
        if (statusDiv) statusDiv.textContent = '';
      } else {
        button.classList.add('btn--disabled');
        button.disabled = true;
        if (statusDiv) statusDiv.textContent = `前のマップをクリアで開放`;
      }
    }

    // クリア表示
    if (mapProgress[mapId]?.bossDefeated && statusDiv) {
      statusDiv.textContent = '✓ クリア';
    }
  }
}

/**
 * 探索画面をレンダリング
 * @param {Object} gameState
 */
function renderExploreScreen(gameState) {
  // コイン表示更新
  setText('explore-coin', `コイン: ${gameState.player.coin}`);
  setText('menu-coin', `${gameState.player.coin}`);

  // パーティーステータス更新
  updatePartyStatus(gameState, 'explore');

  // メッセージを初期化
  setMessage('explore-message', 'マップを探索してください。');
}

/**
 * 戦闘画面をレンダリング
 * @param {Object} gameState
 */
function renderBattleScreen(gameState) {
  if (!gameState.battle.isActive) return;

  const battleState = gameState.battle;

  // 敵情報を表示
  if (battleState.currentEnemyId) {
    const enemyData = DATA.ENEMIES[battleState.currentEnemyId];
    if (enemyData) {
      setText('battle-enemy-name', enemyData.name);
    }
  }

  // 敵HP表示（最初の敵）
  if (battleState.enemies.length > 0) {
    const enemy = battleState.enemies[0];
    updateHpBar('hpbar-enemy', enemy.hpCurrent, enemy.hpMax);
    setText('battle-enemy-hp', `${enemy.hpCurrent}/${enemy.hpMax}`);
  }

  // パーティー情報更新
  updatePartyStatus(gameState, 'battle');

  // メッセージを表示
  const lastLog = battleState.log[battleState.log.length - 1];
  if (lastLog) {
    setMessage('battle-message', lastLog);
  }

  // 逃走ボタンのテキストを更新
  const escapeButton = document.getElementById('btn-battle-escape');
  if (escapeButton) {
    if (battleState.canEscape) {
      escapeButton.textContent = '逃げる';
      escapeButton.disabled = false;
    } else {
      escapeButton.textContent = '今は逃げられない';
      escapeButton.disabled = false;
    }
  }

  populateBattleItemsList(gameState);
}

/**
 * バトル用アイテムリストを描画
 * @param {Object} gameState
 */
function populateBattleItemsList(gameState) {
  const itemsList = document.getElementById('battle-items-list');
  if (!itemsList) return;

  itemsList.innerHTML = '';
  const inventory = gameState.inventory || [];
  if (inventory.length === 0) {
    itemsList.innerHTML = '<p>アイテムがありません。</p>';
    return;
  }

  inventory.forEach(itemEntry => {
    const itemData = DATA.ITEMS[itemEntry.itemId];
    if (!itemData) return;

    const button = document.createElement('button');
    button.className = 'btn btn--secondary btn--block';
    button.textContent = `${itemData.name} x${itemEntry.quantity}`;
    button.type = 'button';
    button.dataset.itemId = itemEntry.itemId;
    button.addEventListener('click', () => {
      handleBattleItemUse(itemEntry.itemId);
    });

    itemsList.appendChild(button);
  });
}

/**
 * バトルアイテム使用処理
 * @param {string} itemId
 */
function handleBattleItemUse(itemId) {
  const gameState = window.gameState;
  if (!gameState || !gameState.battle?.isActive) {
    return;
  }

  if (!window.BATTLE) {
    console.warn('BATTLE not loaded');
    return;
  }

  const result = BATTLE.useItemInBattle(gameState, itemId);
  if (!result.success) {
    setMessage('battle-message', result.message);
    return;
  }

  setMessage('battle-message', result.message);
  updatePartyStatus(gameState, 'battle');
  populateBattleItemsList(gameState);

  if (!gameState.battle.isActive) {
    if (gameState.flags.finalBossDefeated) {
      window.switchScene('TITLE');
      showToast('ゲームクリア！', 'success');
      return;
    }
    window.switchScene('EXPLORE');
  }
}

/**
 * バトルアイテムウィンドウを開く
 */
function openBattleItemsWindow() {
  const windowEl = document.getElementById('battle-items-window');
  if (windowEl) {
    windowEl.classList.remove('window--hidden');
  }
}

/**
 * バトルアイテムウィンドウを閉じる
 */
function closeBattleItemsWindow() {
  const windowEl = document.getElementById('battle-items-window');
  if (windowEl) {
    windowEl.classList.add('window--hidden');
  }
}

/**
 * 強化画面をレンダリング
 * @param {Object} gameState
 */
function renderUpgradeScreen(gameState) {
  // コイン表示
  setText('upgrade-cost-have', `${gameState.player.coin}`);

  // 各キャラのボタンをリセット
  gameState.party.forEach(char => {
    const charId = char.characterId;
    const button = document.getElementById(`upgrade-char-${charId}`);
    if (button) {
      button.classList.remove('upgrade-char--selected');
    }

    // 強化レベルを星表示
    const starsElement = document.getElementById(`enhance-stars-${charId}`);
    if (starsElement) {
      const stars = '★'.repeat(char.enhanceLevel);
      const empty = '☆'.repeat(DATA.CONSTANTS.MAX_ENHANCE_LEVEL - char.enhanceLevel);
      starsElement.textContent = stars + empty;
    }
  });

  // 強化詳細エリアをクリア
  const detailsElement = document.getElementById('upgrade-details');
  if (detailsElement) {
    detailsElement.innerHTML = '';
  }
}

/**
 * アイテム画面をレンダリング
 * @param {Object} gameState
 */
function renderItemsScreen(gameState) {
  const itemsList = document.getElementById('items-list');
  if (!itemsList) return;

  const inventory = gameState.inventory || [];
  itemsList.innerHTML = '';

  if (inventory.length === 0) {
    itemsList.innerHTML = '<p>アイテムがありません。</p>';
    return;
  }

  inventory.forEach(entry => {
    const itemData = DATA.ITEMS[entry.itemId];
    if (!itemData) return;

    const itemButton = document.createElement('button');
    itemButton.className = 'btn btn--secondary btn--block';
    itemButton.type = 'button';
    itemButton.textContent = `${itemData.name} x${entry.quantity}`;
    itemButton.addEventListener('click', () => {
      handleItemUse(entry.itemId);
    });

    const info = document.createElement('p');
    info.className = 'item-description';
    info.textContent = itemData.usableInExplore ? '探索中に使用可' : '戦闘専用アイテム';

    const wrapper = document.createElement('div');
    wrapper.className = 'item-entry';
    wrapper.appendChild(itemButton);
    wrapper.appendChild(info);

    itemsList.appendChild(wrapper);
  });
}

/**
 * アイテムを使用する
 * @param {string} itemId
 */
function handleItemUse(itemId) {
  const gameState = window.gameState;
  if (!gameState) return;
  if (typeof ITEM === 'undefined') {
    showToast('アイテム機能が利用できません。', 'error');
    return;
  }

  const result = ITEM.applyItemEffectInExplore(gameState, itemId);
  if (!result.success) {
    showToast(result.message, 'error');
    return;
  }

  showToast(result.message, 'success');
  renderItemsScreen(gameState);
  renderExploreScreen(gameState);
}

/**
 * 設定画面をレンダリング
 * @param {Object} gameState
 */
function renderSettingsScreen(gameState) {
  // 設定画面は現在プレースホルダー
  // 実装は後日
}

/**
 * シーンに対応する画面をレンダリング
 * @param {string} sceneName
 * @param {Object} gameState
 */
function renderScreen(sceneName, gameState) {
  switch (sceneName) {
    case 'TITLE':
      renderTitleScreen(gameState);
      break;
    case 'MAP_SELECT':
      renderMapSelectScreen(gameState);
      break;
    case 'EXPLORE':
      renderExploreScreen(gameState);
      break;
    case 'BATTLE':
      renderBattleScreen(gameState);
      break;
    case 'UPGRADE':
      renderUpgradeScreen(gameState);
      break;
    case 'ITEMS':
      renderItemsScreen(gameState);
      break;
    case 'SETTINGS':
      renderSettingsScreen(gameState);
      break;
  }
}

/**
 * UIを初期化してイベントリスナーを登録
 */
function initializeUI() {
  // タイトル画面ボタン
  const btnNewGame = document.getElementById('btn-title-newgame');
  if (btnNewGame) {
    btnNewGame.addEventListener('click', () => {
      window.switchScene('MAP_SELECT');
    });
  }

  const btnContinue = document.getElementById('btn-title-continue');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      if (typeof SAVE !== 'undefined' && SAVE.hasSavedGame()) {
        const savedState = SAVE.loadSavedGameState();
        if (savedState) {
          if (typeof window.setGameState === 'function') {
            window.setGameState(savedState);
          } else {
            window.gameState = savedState;
          }
          window.switchScene('MAP_SELECT');
          return;
        }
      }
      showToast('セーブデータが見つかりません。', 'error');
    });
  }

  const btnTitleSettings = document.getElementById('btn-title-settings');
  if (btnTitleSettings) {
    btnTitleSettings.addEventListener('click', () => {
      window.switchScene('SETTINGS');
    });
  }

  // マップ選択ボタン
  for (let mapId = 1; mapId <= 3; mapId++) {
    const button = document.getElementById(`btn-map-select-${mapId}`);
    if (button) {
      button.addEventListener('click', () => {
        // マップ選択（後続フェーズで実装）
        console.log(`Map ${mapId} selected`);
        window.gameState.player.currentMapId = mapId;
        window.switchScene('EXPLORE');
      });
    }
  }

  const btnMapBack = document.getElementById('btn-map-back');
  if (btnMapBack) {
    btnMapBack.addEventListener('click', () => {
      window.switchScene('TITLE');
    });
  }

  // 探索画面メニュー
  const btnExploreMenu = document.getElementById('btn-explore-menu');
  const exploreMenu = document.getElementById('explore-menu');
  if (btnExploreMenu && exploreMenu) {
    btnExploreMenu.addEventListener('click', () => {
      exploreMenu.classList.toggle('window--hidden');
    });
  }

  const btnMenuMaps = document.getElementById('btn-menu-maps');
  if (btnMenuMaps) {
    btnMenuMaps.addEventListener('click', () => {
      if (exploreMenu) exploreMenu.classList.add('window--hidden');
      window.switchScene('MAP_SELECT');
    });
  }

  const btnMenuUpgrade = document.getElementById('btn-menu-upgrade');
  if (btnMenuUpgrade) {
    btnMenuUpgrade.addEventListener('click', () => {
      if (exploreMenu) exploreMenu.classList.add('window--hidden');
      window.switchScene('UPGRADE');
    });
  }

  const btnMenuItems = document.getElementById('btn-menu-items');
  if (btnMenuItems) {
    btnMenuItems.addEventListener('click', () => {
      if (exploreMenu) exploreMenu.classList.add('window--hidden');
      window.switchScene('ITEMS');
    });
  }

  const btnMenuSettings = document.getElementById('btn-menu-settings');
  if (btnMenuSettings) {
    btnMenuSettings.addEventListener('click', () => {
      if (exploreMenu) exploreMenu.classList.add('window--hidden');
      window.switchScene('SETTINGS');
    });
  }

  const btnMenuTitle = document.getElementById('btn-menu-title');
  if (btnMenuTitle) {
    btnMenuTitle.addEventListener('click', () => {
      if (exploreMenu) exploreMenu.classList.add('window--hidden');
      window.switchScene('TITLE');
    });
  }

  // 強化画面キャラクター選択
  DATA.CONSTANTS.CHARACTER_IDS.forEach(charId => {
    const button = document.getElementById(`upgrade-char-${charId}`);
    if (button) {
      button.addEventListener('click', () => {
        showUpgradeDetails(charId, window.gameState);
      });
    }
  });

  const btnUpgradePerform = document.getElementById('btn-upgrade-perform');
  if (btnUpgradePerform) {
    btnUpgradePerform.addEventListener('click', () => {
      performUpgrade(window.gameState);
    });
  }

  const btnUpgradeBack = document.getElementById('btn-upgrade-back');
  if (btnUpgradeBack) {
    btnUpgradeBack.addEventListener('click', () => {
      window.switchScene('EXPLORE');
    });
  }

  // バトル画面のボタン
  const btnBattleAttack = document.getElementById('btn-battle-attack');
  if (btnBattleAttack) {
    btnBattleAttack.addEventListener('click', () => {
      if (!window.gameState?.battle?.isActive) return;
      const result = BATTLE.playerAttack(window.gameState);
      setMessage('battle-message', result.message);
      updatePartyStatus(window.gameState, 'battle');
      renderBattleScreen(window.gameState);
      if (!window.gameState.battle.isActive) {
        window.switchScene(window.gameState.flags.finalBossDefeated ? 'TITLE' : 'EXPLORE');
      }
    });
  }

  const btnBattleDefend = document.getElementById('btn-battle-defend');
  if (btnBattleDefend) {
    btnBattleDefend.addEventListener('click', () => {
      if (!window.gameState?.battle?.isActive) return;
      const result = BATTLE.playerDefend(window.gameState);
      setMessage('battle-message', result.message);
      updatePartyStatus(window.gameState, 'battle');
      renderBattleScreen(window.gameState);
      if (!window.gameState.battle.isActive) {
        window.switchScene(window.gameState.flags.finalBossDefeated ? 'TITLE' : 'EXPLORE');
      }
    });
  }

  const btnBattleItems = document.getElementById('btn-battle-items');
  if (btnBattleItems) {
    btnBattleItems.addEventListener('click', () => {
      if (!window.gameState?.battle?.isActive) return;
      openBattleItemsWindow();
    });
  }

  const btnBattleEscape = document.getElementById('btn-battle-escape');
  if (btnBattleEscape) {
    btnBattleEscape.addEventListener('click', () => {
      if (!window.gameState?.battle?.isActive) return;
      const result = BATTLE.tryEscapeBattle(window.gameState);
      setMessage('battle-message', result.message);
      renderBattleScreen(window.gameState);
      if (result.success && !window.gameState.battle.isActive) {
        window.switchScene('EXPLORE');
      }
    });
  }

  const btnBattleItemsClose = document.getElementById('btn-battle-items-close');
  if (btnBattleItemsClose) {
    btnBattleItemsClose.addEventListener('click', () => {
      closeBattleItemsWindow();
    });
  }

  const btnEscapeConfirm = document.getElementById('btn-escape-confirm');
  if (btnEscapeConfirm) {
    btnEscapeConfirm.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog('本当に逃げますか？');
      if (confirmed) {
        const result = BATTLE.tryEscapeBattle(window.gameState);
        setMessage('battle-message', result.message);
        renderBattleScreen(window.gameState);
        if (result.success && !window.gameState.battle.isActive) {
          window.switchScene('EXPLORE');
        }
      }
    });
  }

  const btnEscapeCancel = document.getElementById('btn-escape-cancel');
  if (btnEscapeCancel) {
    btnEscapeCancel.addEventListener('click', () => {
      const dialog = document.querySelector('.dialog-overlay');
      if (dialog) dialog.remove();
    });
  }

  // 設定画面戻るボタン
  const btnSettingsBack = document.getElementById('btn-settings-back');
  if (btnSettingsBack) {
    btnSettingsBack.addEventListener('click', () => {
      const prevScene = window.gameState.lastScene || 'TITLE';
      window.switchScene(prevScene);
    });
  }

  const btnItemsClose = document.getElementById('btn-items-close');
  if (btnItemsClose) {
    btnItemsClose.addEventListener('click', () => {
      window.switchScene('EXPLORE');
    });
  }

  // 探索画面の操作
  registerExploreControls();
}

/**
 * 強化詳細を表示（キャラクター選択時）
 * @param {string} characterId
 * @param {Object} gameState
 */
function showUpgradeDetails(characterId, gameState) {
  const charIdx = gameState.party.findIndex(c => c.characterId === characterId);
  if (charIdx < 0) return;

  const character = gameState.party[charIdx];
  const canUpgrade = STATE.canUpgradeCharacter(gameState, charIdx);

  // キャラクターボタンをハイライト
  DATA.CONSTANTS.CHARACTER_IDS.forEach(id => {
    const btn = document.getElementById(`upgrade-char-${id}`);
    if (btn) {
      btn.classList.toggle('upgrade-char--selected', id === characterId);
    }
  });

  // 強化詳細を表示
  const detailsDiv = document.getElementById('upgrade-details');
  if (!detailsDiv) return;

  // 次レベルの計算
  const nextLevel = character.enhanceLevel + 1;
  const enhanceCost = DATA.ENHANCE_COSTS[characterId];
  const nextBonus = enhanceCost && enhanceCost[nextLevel]
    ? enhanceCost[nextLevel]
    : null;

  let html = `
    <div class="upgrade-info">
      <h3>${character.name}</h3>
      <p>現在レベル: ${character.enhanceLevel} / ${DATA.CONSTANTS.MAX_ENHANCE_LEVEL}</p>
  `;

  if (character.enhanceLevel >= DATA.CONSTANTS.MAX_ENHANCE_LEVEL) {
    html += `<p style="color: #FFD166;">これ以上強化できません</p>`;
  } else if (nextBonus) {
    html += `
      <div class="upgrade-bonus">
        <div>HP +${nextBonus.hpBonus}</div>
        <div>攻撃 +${nextBonus.attackBonus}</div>
        <div>防御 +${nextBonus.defenseBonus}</div>
      </div>
    `;
    setText('upgrade-cost-required', `${nextBonus.coin}`);
  }

  html += `</div>`;
  detailsDiv.innerHTML = html;

  // ボタン状態を更新
  const performBtn = document.getElementById('btn-upgrade-perform');
  if (performBtn) {
    if (canUpgrade.canUpgrade) {
      performBtn.classList.remove('btn--disabled');
      performBtn.disabled = false;
    } else {
      performBtn.classList.add('btn--disabled');
      performBtn.disabled = true;
    }
  }

  // 強化情報をメッセージに保存（次のperformUpgrade呼び出し用）
  gameState._upgradeSelectedCharId = characterId;
}

/**
 * 強化実行
 * @param {Object} gameState
 */
function performUpgrade(gameState) {
  const characterId = gameState._upgradeSelectedCharId;
  if (!characterId) {
    showToast('キャラクターを選択してください', 'error');
    return;
  }

  const charIdx = gameState.party.findIndex(c => c.characterId === characterId);
  if (charIdx < 0) return;

  const success = STATE.upgradeCharacter(gameState, charIdx);
  if (success) {
    showToast(`${characterId}を強化しました！`, 'success');
    renderUpgradeScreen(gameState);
    showUpgradeDetails(characterId, gameState);
  } else {
    const canUpgrade = STATE.canUpgradeCharacter(gameState, charIdx);
    showToast(canUpgrade.reason, 'error');
  }
}

/**
 * 探索画面用のキーボード・ボタン操作を登録
 */
function registerExploreControls() {
  // キーボード操作リスナー
  const handleKeyPress = (event) => {
    // 探索画面でのみ有効
    if (window.gameState?.scene !== 'EXPLORE') {
      return;
    }

    // 戦闘中は移動不可
    if (window.gameState.battle.isActive) {
      return;
    }

    let direction = null;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'right';
        break;
      default:
        return;
    }

    if (direction) {
      event.preventDefault();
      handleExploreMove(direction);
    }
  };

  // グローバルキーボードリスナーを設定
  document.addEventListener('keydown', handleKeyPress);
}

/**
 * 探索画面での移動を処理
 * @param {string} direction
 */
function handleExploreMove(direction) {
  const gameState = window.gameState;
  if (!gameState || gameState.scene !== 'EXPLORE' || gameState.battle.isActive) {
    return;
  }

  // EXPLORE.js がロードされているか確認
  if (!window.EXPLORE) {
    console.warn('EXPLORE not loaded');
    return;
  }

  // 移動処理を実行
  const result = EXPLORE.movePlayer(gameState, direction);

  if (!result.success) {
    setMessage('explore-message', result.message);
    return;
  }

  // 移動成功時のメッセージ表示
  setMessage('explore-message', result.message);

  // UI更新
  updatePartyStatus(gameState, 'explore');

  // 敵遭遇時はシーン遷移
  if (result.isEnemy || result.isBoss) {
    setTimeout(() => {
      window.switchScene('BATTLE');
    }, 500);
  }
}

// Export
if (typeof window !== 'undefined') {
  window.UI = {
    showScreen,
    hideScreen,
    hideAllScreens,
    setText,
    updateHpBar,
    setMessage,
    showToast,
    showConfirmDialog,
    updatePartyStatus,
    renderScreen,
    renderTitleScreen,
    renderMapSelectScreen,
    renderExploreScreen,
    renderBattleScreen,
    renderUpgradeScreen,
    renderSettingsScreen,
    initializeUI,
    handleExploreMove,
  };
}
