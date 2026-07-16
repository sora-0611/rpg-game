/**
 * ui.js
 * 画面の表示・非表示・メッセージ表示・HPバー更新など、
 * ユーザーに見える部分の描画を担当するファイルです。
 * 画面の見た目はここでまとめて制御します。
 */

// ===== CONSTANTS =====
const SCREEN_MAP = {
  MAPS: 'screen-maps',
  EXPLORE: 'screen-explore',
  UPGRADE: 'screen-upgrade',
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
function showConfirmDialog(message, confirmLabel = 'OK', cancelLabel = 'キャンセル') {
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
          <button class="btn btn--primary dialog-btn-confirm">${confirmLabel}</button>
          <button class="btn btn--secondary dialog-btn-cancel">${cancelLabel}</button>
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
 * マップ選択画面のボタン状態を更新する。
 * 進行状況に応じて「選択可 / 未開放」を切り替えるため、
 * ここでプレイヤーの進捗に合わせた表示を作る。
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
 * 探索画面のマップを描画
 * @param {Object} gameState
 */
function drawExploreMap(gameState) {
  const canvas = document.getElementById('canvas-map');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const map = MAP.getMap(gameState.player.currentMapId);
  if (!map) return;

  const mapId = gameState.player.currentMapId;
  const progress = gameState.mapProgress[mapId];
  const repairedTiles = progress ? progress.repairedTiles : [];

  const tileSize = Math.floor(Math.min(canvas.width / map.width, canvas.height / map.height));
  const offsetX = Math.floor((canvas.width - tileSize * map.width) / 2);
  const offsetY = Math.floor((canvas.height - tileSize * map.height) / 2);

  const tileColors = {
    [MAP.TILE_TYPE.GRASS]: '#6DA34D',
    [MAP.TILE_TYPE.PATH]: '#D6B27C',
    [MAP.TILE_TYPE.RIVER]: '#4AA8E7',
    [MAP.TILE_TYPE.BRIDGE]: '#8B6642',
    [MAP.TILE_TYPE.BROKEN_BRIDGE]: '#140907',
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  map.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      // 修復済みの壊れた橋は橋として描画
      let displayTile = tile;
      if (tile === MAP.TILE_TYPE.BROKEN_BRIDGE) {
        const tileKey = `${x},${y}`;
        if (repairedTiles.includes(tileKey)) {
          displayTile = MAP.TILE_TYPE.BRIDGE;
        }
      }

      ctx.fillStyle = tileColors[displayTile] || '#666666';
      ctx.fillRect(offsetX + x * tileSize, offsetY + y * tileSize, tileSize, tileSize);
    });
  });

  // Grid lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= map.width; x += 1) {
    const px = offsetX + x * tileSize;
    ctx.beginPath();
    ctx.moveTo(px, offsetY);
    ctx.lineTo(px, offsetY + map.height * tileSize);
    ctx.stroke();
  }
  for (let y = 0; y <= map.height; y += 1) {
    const py = offsetY + y * tileSize;
    ctx.beginPath();
    ctx.moveTo(offsetX, py);
    ctx.lineTo(offsetX + map.width * tileSize, py);
    ctx.stroke();
  }

  const drawIcon = (x, y, color, shape = 'rect') => {
    const px = offsetX + x * tileSize;
    const py = offsetY + y * tileSize;
    const padding = Math.max(2, Math.round(tileSize * 0.14));
    ctx.fillStyle = color;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(px + tileSize / 2, py + tileSize / 2, (tileSize - padding * 2) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2);
    }
  };

  // アイテムチェスト・ボスポジションの表示
  if (Array.isArray(map.itemsOnMap)) {
    map.itemsOnMap.forEach(chest => {
      drawIcon(chest.pos[0], chest.pos[1], '#F2C94C', 'rect');
    });
  }

  if (Array.isArray(map.bossPos) && map.bossPos.length === 2) {
    drawIcon(map.bossPos[0], map.bossPos[1], '#E76F51', 'circle');
  }

  // プレイヤー位置を表示
  if (gameState.player && gameState.player.pos) {
    drawIcon(gameState.player.pos.x, gameState.player.pos.y, '#2F80ED', 'circle');
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
  updatePartyStatus(gameState, 'battle');

  // 探索マップを描画
  drawExploreMap(gameState);

  renderExploreItemWindow(gameState);

  // メッセージを初期化
  if (!gameState.battle.isActive) {
    setMessage('explore-message', 'マップを探索してください。');
  }
}

function renderExploreItemWindow(gameState) {
  const itemWindow = document.getElementById('explore-item-window');
  const itemList = document.getElementById('explore-item-list');
  if (!itemWindow || !itemList) return;

  itemWindow.classList.toggle('window--hidden', !gameState.ui.itemWindowOpen);

  if (!gameState.ui.itemWindowOpen) {
    return;
  }

  const inventoryItems = window.ITEM?.getInventoryItems ? window.ITEM.getInventoryItems(gameState) : [];
  itemList.innerHTML = '';

  if (inventoryItems.length === 0) {
    itemList.innerHTML = '<div class="message-window">アイテムを所持していません。</div>';
    return;
  }

  // ID順にソート
  inventoryItems.sort((a, b) => a.itemId.localeCompare(b.itemId));

  inventoryItems.forEach(item => {
    const itemData = item.data;
    const isUsable = Boolean(itemData && itemData.usableInExplore);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `item-card${isUsable ? '' : ' item-card--disabled'}`;
    button.disabled = !isUsable;
    button.innerHTML = `
      <div class="item-info">
        <span class="item-name">${itemData?.name || '不明なアイテム'}</span>
        <span class="item-effect">${itemData?.description || ''}</span>
      </div>
      <span class="item-quantity">×${item.quantity}</span>
    `;

    button.addEventListener('click', () => {
      if (!itemData || !isUsable) {
        showToast('このアイテムは探索中に使えません。', 'error');
        return;
      }

      const result = window.ITEM.applyItemEffectInExplore(gameState, item.itemId);
      if (result.success) {
        showToast(result.message, 'success');
        renderExploreScreen(gameState);
      } else {
        showToast(result.message, 'error');
      }
    });

    itemList.appendChild(button);
  });
}

function openExploreItemWindow(gameState) {
  gameState.ui.menuOpen = false;
  gameState.ui.itemWindowOpen = true;
  renderExploreItemWindow(gameState);
  const exploreMenu = document.getElementById('explore-menu');
  if (exploreMenu) {
    exploreMenu.classList.add('window--hidden');
  }
}

function closeExploreItemWindow(gameState) {
  gameState.ui.itemWindowOpen = false;
  renderExploreItemWindow(gameState);
}

/**
 * 強化画面をレンダリング
 * @param {Object} gameState
 */
function renderUpgradeScreen(gameState) {
  setText('upgrade-coin', gameState.player.coin);

  const container = document.getElementById('upgrade-party');
  if (!container) return;

  container.innerHTML = '';

  gameState.party.forEach((char, idx) => {
    const charData = DATA.CHARACTERS[char.characterId];
    const isMaxLevel = char.enhanceLevel >= DATA.CONSTANTS.MAX_ENHANCE_LEVEL;
    const { canUpgrade } = STATE.canUpgradeCharacter(gameState, idx);

    let nextLevelHTML = '';
    let btnDisabled = canUpgrade ? '' : 'disabled';
    let btnText = '強化する';

    if (isMaxLevel) {
      btnText = '最大レベル';
      btnDisabled = 'disabled';
      nextLevelHTML = `<div class="upgrade-next-level upgrade-next-level--max">最大レベルに達しています</div>`;
    } else {
      const nextLevel = char.enhanceLevel + 1;
      const cost = DATA.ENHANCE_COSTS[char.characterId][nextLevel];
      nextLevelHTML = `
        <div class="upgrade-next-level">
          <span class="upgrade-cost">強化コスト: ${cost.coin} コイン</span>
          <span class="upgrade-bonus">HP +${cost.hpBonus} / ATK +${cost.attackBonus} / DEF +${cost.defenseBonus}</span>
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'card card--character upgrade-char-card';
    card.innerHTML = `
      <div class="upgrade-char-header">
        <span class="card-name">${charData.name}</span>
        <span class="upgrade-level">Lv.${char.enhanceLevel}</span>
      </div>
      <div class="upgrade-stats">
        <span>HP: ${char.hpMax}</span>
        <span>ATK: ${char.attack}</span>
        <span>DEF: ${char.defense}</span>
      </div>
      ${nextLevelHTML}
      <button class="btn btn--primary btn--small btn-upgrade-char"
              data-char-index="${idx}" ${btnDisabled}>
        ${btnText}
      </button>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-upgrade-char').forEach(btn => {
    btn.addEventListener('click', () => {
      handleUpgradeCharacter(parseInt(btn.dataset.charIndex, 10));
    });
  });
}

/**
 * キャラクター強化を実行
 * @param {number} charIndex
 */
function handleUpgradeCharacter(charIndex) {
  const gameState = window.gameState;
  if (!gameState) return;

  const { canUpgrade, reason } = STATE.canUpgradeCharacter(gameState, charIndex);
  if (!canUpgrade) {
    showToast(reason, 'error');
    return;
  }

  const success = STATE.upgradeCharacter(gameState, charIndex);
  if (success) {
    const charName = DATA.CHARACTERS[gameState.party[charIndex].characterId].name;
    showToast(`${charName}を強化しました！`, 'success');
    renderUpgradeScreen(gameState);
  }
}

/**
 * シーンに対応する画面をレンダリング
 * @param {string} sceneName
 * @param {Object} gameState
 */
function renderScreen(sceneName, gameState) {
  switch (sceneName) {
    case 'MAP_SELECT':
      renderMapSelectScreen(gameState);
      break;
    case 'EXPLORE':
      renderExploreScreen(gameState);
      break;
    case 'UPGRADE':
      renderUpgradeScreen(gameState);
      break;
  }
}


/**
 * UIを初期化してイベントリスナーを登録
 */
function initializeUI() {
  // マップ選択ボタン
  for (let mapId = 1; mapId <= 3; mapId++) {
    const button = document.getElementById(`btn-map-select-${mapId}`);
    if (button) {
      button.addEventListener('click', () => {
        // マップ選択（後続フェーズで実装）
        console.log(`Map ${mapId} selected`);
        // 別のマップに切り替える場合は初期位置からスタートする
        // （同じマップを選び直した場合は探索中の位置を維持する）
        if (window.gameState.player.currentMapId !== mapId) {
          window.gameState.player.pos = { x: 1, y: 1 };
        }
        window.gameState.player.currentMapId = mapId;
        window.switchScene('EXPLORE');
      });
    }
  }

  const btnMapBack = document.getElementById('btn-map-back');
  if (btnMapBack) {
    btnMapBack.addEventListener('click', () => {
      window.switchScene('EXPLORE');
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
      window.location.href = 'enhancement.html';
    });
  }

  const btnMenuItems = document.getElementById('btn-menu-items');
  if (btnMenuItems) {
    btnMenuItems.addEventListener('click', () => {
      const gameState = window.gameState;
      if (gameState) {
        openExploreItemWindow(gameState);
      }
    });
  }

  const btnMenuSettings = document.getElementById('btn-menu-settings');
  if (btnMenuSettings) {
    btnMenuSettings.addEventListener('click', () => {
      window.location.href = 'settings.html?from=explore';
    });
  }

  const btnUpgradeBack = document.getElementById('btn-upgrade-back');
  if (btnUpgradeBack) {
    btnUpgradeBack.addEventListener('click', () => {
      window.switchScene('EXPLORE');
    });
  }

  const btnMenuClose = document.getElementById('btn-menu-close');
  if (btnMenuClose && exploreMenu) {
    btnMenuClose.addEventListener('click', () => {
      exploreMenu.classList.add('window--hidden');
    });
  }

  const btnItemWindowClose = document.getElementById('btn-item-window-close');
  if (btnItemWindowClose) {
    btnItemWindowClose.addEventListener('click', () => {
      const gameState = window.gameState;
      if (gameState) {
        closeExploreItemWindow(gameState);
      }
    });
  }

  const btnMenuTitle = document.getElementById('btn-menu-title');
  if (btnMenuTitle) {
    btnMenuTitle.addEventListener('click', async () => {
      if (exploreMenu) exploreMenu.classList.add('window--hidden');

      const saveSucceeded = window.SAVE?.saveGameState ? window.SAVE.saveGameState(window.gameState) : false;
      if (saveSucceeded) {
        showToast('セーブしました。', 'success');
      } else {
        showToast('セーブに失敗しました。', 'error');
      }

      const confirmed = await showConfirmDialog('タイトルに戻りますか？', 'はい', 'いいえ');
      if (confirmed) {
        window.location.assign('../index.html');
      }
    });
  }

  // 探索画面の操作
  registerExploreControls();
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
  if (!gameState || gameState.scene !== 'EXPLORE') {
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
  drawExploreMap(gameState);

  if (gameState.battle.isActive) {
    // src/battle 側は数値/'mobN'形式の別スキーマの敵IDを使うため変換する。
    // src/battle/bridge.js の ENEMY_ID_TO_BATTLE と同期を保つこと。
    const ENEMY_ID_TO_BATTLE = {
      slime_1: 'mob1', slime_2: 'mob2', slime_3: 'mob3',
      boss_1: 'boss1', boss_2: 'boss2', final_boss: 'lastboss',
    };
    const rpgEnemyId = gameState.battle.currentEnemyId || 'slime_1';
    const battleEnemyId = ENEMY_ID_TO_BATTLE[rpgEnemyId] || 'mob1';
    window.SAVE.saveGameState(gameState);
    window.location.assign(`battle.html?enemy=${encodeURIComponent(battleEnemyId)}`);
    return;
  }

  if (result.isEnemy || result.isBoss) {
    setMessage('explore-message', '戦闘が開始しました。');
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
    renderMapSelectScreen,
    renderExploreScreen,
    renderUpgradeScreen,
    handleUpgradeCharacter,
    initializeUI,
    handleExploreMove,
  };
}
