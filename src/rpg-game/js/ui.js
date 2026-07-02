/**
 * ui.js
 * ゲーム画面描画・UI制御
 */

// ===== CONSTANTS =====
const SCREEN_MAP = {
  SETTINGS: 'screen-settings',
  MAPS: 'screen-maps',
  EXPLORE: 'screen-explore',
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

  const tileSize = Math.floor(Math.min(canvas.width / map.width, canvas.height / map.height));
  const offsetX = Math.floor((canvas.width - tileSize * map.width) / 2);
  const offsetY = Math.floor((canvas.height - tileSize * map.height) / 2);

  const tileColors = {
    [MAP.TILE_TYPE.GRASS]: '#6DA34D',
    [MAP.TILE_TYPE.PATH]: '#D6B27C',
    [MAP.TILE_TYPE.RIVER]: '#4AA8E7',
    [MAP.TILE_TYPE.BRIDGE]: '#8B6642',
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  map.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      ctx.fillStyle = tileColors[tile] || '#666666';
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

  // 戦闘UI表示状態を更新
  renderBattleOverlay(gameState);

  // メッセージを初期化
  if (!gameState.battle.isActive) {
    setMessage('explore-message', 'マップを探索してください。');
  }
}

/**
 * シーンに対応する画面をレンダリング
 * @param {string} sceneName
 * @param {Object} gameState
 */
function renderScreen(sceneName, gameState) {
  switch (sceneName) {
    case 'SETTINGS':
      break;
    case 'MAP_SELECT':
      renderMapSelectScreen(gameState);
      break;
    case 'EXPLORE':
      renderExploreScreen(gameState);
      break;
  }
}


/**
 * UIを初期化してイベントリスナーを登録
 */
function initializeUI() {
  // 設定画面の戻るボタン
  const btnSettingsBack = document.getElementById('btn-settings-back');
  if (btnSettingsBack) {
    btnSettingsBack.addEventListener('click', () => {
      const lastScene = window.gameState?.lastScene || 'EXPLORE';
      window.switchScene(lastScene);
    });
  }

  // 設定JS初期化
  if (window.SETTINGS) {
    window.SETTINGS.initialize();
  }

  // 戦闘UIの初期化
  bindBattleControls();

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

  const btnMenuClose = document.getElementById('btn-menu-close');
  if (btnMenuClose && exploreMenu) {
    btnMenuClose.addEventListener('click', () => {
      exploreMenu.classList.add('window--hidden');
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
    btnMenuTitle.addEventListener('click', async () => {
      if (exploreMenu) exploreMenu.classList.add('window--hidden');
      const confirmed = await showConfirmDialog('タイトルに戻りますか？\n（保存されていない進捗は失われます）');
      if (confirmed) {
        window.location.href = '../index.html';
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
  drawExploreMap(gameState);

  if (gameState.battle.isActive) {
    renderBattleOverlay(gameState);
    setMessage('explore-message', gameState.battle.log[gameState.battle.log.length - 1] || '戦闘が開始しました。');
    return;
  }

  if (result.isEnemy || result.isBoss) {
    renderBattleOverlay(gameState);
    setMessage('explore-message', '戦闘が開始しました。');
  }
}

/**
 * 戦闘オーバーレイの表示状態を更新
 * @param {Object} gameState
 */
function renderBattleOverlay(gameState) {
  const overlay = document.getElementById('battle-overlay');
  const enemyName = document.getElementById('battle-enemy-name');
  const enemyHp = document.getElementById('battle-enemy-hp');
  const enemyHpBar = document.getElementById('hpbar-battle-enemy');
  const logBox = document.getElementById('battle-log');

  if (!overlay) return;

  if (!gameState?.battle?.isActive) {
    overlay.classList.add('battle-overlay--hidden');
    if (logBox) {
      logBox.textContent = '戦闘開始。コマンドを選択してください。';
    }
    return;
  }

  overlay.classList.remove('battle-overlay--hidden');

  const enemy = gameState.battle.enemies[0];
  const enemyData = enemy ? DATA.ENEMIES[enemy.enemyId] : null;
  if (enemyName) {
    enemyName.textContent = enemyData ? enemyData.name : '敵';
  }
  if (enemyHp && enemy) {
    enemyHp.textContent = `${enemy.hpCurrent}/${enemy.hpMax}`;
  }
  if (enemyHpBar) {
    updateHpBar('hpbar-battle-enemy', enemy ? enemy.hpCurrent : 0, enemy ? enemy.hpMax : 1);
  }

  updatePartyStatus(gameState, 'battle');
  if (logBox && gameState.battle.log.length > 0) {
    logBox.textContent = gameState.battle.log[gameState.battle.log.length - 1];
  }
}

/**
 * 戦闘コマンドイベントを登録
 */
function bindBattleControls() {
  const battleFightBtn = document.getElementById('btn-battle-fight');
  const battleDefendBtn = document.getElementById('btn-battle-defend');
  const battleItemBtn = document.getElementById('btn-battle-item');
  const battleFleeBtn = document.getElementById('btn-battle-flee');
  const itemWindow = document.getElementById('battle-item-window');
  const itemList = document.getElementById('battle-item-list');
  const itemCloseBtn = document.getElementById('btn-battle-item-close');

  const openItemWindow = () => {
    if (!window.gameState?.battle?.isActive) return;
    if (!itemWindow || !itemList) return;

    itemList.innerHTML = '';
    const inventory = ITEM.getInventoryItems(window.gameState);
    if (inventory.length === 0) {
      itemList.innerHTML = '<p class="item-effect">所持アイテムがありません。</p>';
      itemWindow.classList.remove('window--hidden');
      return;
    }

    inventory.forEach(entry => {
      const itemData = entry.data;
      const usableInBattle = itemData?.usableInBattle;
      const button = document.createElement('button');
      button.className = `btn btn--secondary btn--block ${usableInBattle ? '' : 'btn--disabled'}`;
      button.textContent = `${itemData?.name || entry.itemId} x${entry.quantity}`;
      button.disabled = !usableInBattle;
      button.addEventListener('click', () => {
        const result = ITEM.applyItemEffectInBattle(window.gameState, entry.itemId);
        if (result.success) {
          window.gameState.battle.log.push(result.message);
          if (result.enemyDefeated) {
            EXPLORE.endBattleVictory(window.gameState);
          }
          renderBattleOverlay(window.gameState);
          itemWindow.classList.add('window--hidden');
        } else {
          window.gameState.battle.log.push(result.message);
          renderBattleOverlay(window.gameState);
        }
      });
      itemList.appendChild(button);
    });
    itemWindow.classList.remove('window--hidden');
  };

  if (battleFightBtn) {
    battleFightBtn.addEventListener('click', () => {
      if (!window.gameState?.battle?.isActive) return;
      const enemy = window.gameState.battle.enemies[0];
      if (!enemy) return;
      const attacker = window.gameState.party[0];
      const damage = Math.max(1, attacker.attack - (enemy.defense || 0));
      enemy.hpCurrent = Math.max(0, enemy.hpCurrent - damage);
      window.gameState.battle.log.push(`${attacker.name}が${damage}ダメージを与えた。`);
      if (enemy.hpCurrent <= 0) {
        EXPLORE.endBattleVictory(window.gameState);
        setMessage('explore-message', '戦闘に勝利した！');
      } else {
        const enemyData = DATA.ENEMIES[enemy.enemyId];
        const enemyDamage = Math.max(1, enemyData.baseAttack - window.gameState.party[0].defense);
        window.gameState.party[0].hpCurrent = Math.max(0, window.gameState.party[0].hpCurrent - enemyDamage);
        window.gameState.battle.log.push(`${enemyData.name}から${enemyDamage}ダメージ。`);
      }
      renderBattleOverlay(window.gameState);
    });
  }

  if (battleDefendBtn) {
    battleDefendBtn.addEventListener('click', () => {
      if (!window.gameState?.battle?.isActive) return;
      window.gameState.battle.log.push('防御して次の被ダメージを軽減した。');
      renderBattleOverlay(window.gameState);
    });
  }

  if (battleItemBtn) {
    battleItemBtn.addEventListener('click', openItemWindow);
  }

  if (battleFleeBtn) {
    battleFleeBtn.addEventListener('click', () => {
      if (!window.gameState?.battle?.isActive) return;
      const result = EXPLORE.tryEscapeBattle(window.gameState);
      window.gameState.battle.log.push(result.message);
      if (!window.gameState.battle.isActive) {
        setMessage('explore-message', result.message);
      }
      renderBattleOverlay(window.gameState);
    });
  }

  if (itemCloseBtn && itemWindow) {
    itemCloseBtn.addEventListener('click', () => {
      itemWindow.classList.add('window--hidden');
    });
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
    initializeUI,
    handleExploreMove,
  };
}
