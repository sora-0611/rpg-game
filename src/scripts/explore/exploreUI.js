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

// ===== EXPLORE EFFECT SETTINGS =====
/**
 * 探索中のイベント演出時間。数値を変更すれば演出速度を調整できる。
 */
const EXPLORE_EFFECT_CONFIG = Object.freeze({
  blockedMoveDurationMs: 300,
  enemyEncounterDurationMs: 600,
  bossEncounterDurationMs: 850,
});

// プレイヤーが最後に向いた方向。セーブ対象ではなく、表示だけに使用する。
let explorePlayerDirection = 'down';

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

  // HPバーが100%を超えたり、0%未満になったりしないよう範囲を制限する。
  const ratio = max > 0 ? Math.max(0, Math.min(current / max, 1)) : 0;
  fill.style.width = `${Math.round(ratio * 100)}%`;

  // 戦闘画面と同じ基準で色を切り替える。
  // 50%より多い: 緑 / 50%以下: 黄色 / 20%以下: 赤 / 0: 空のバー
  hpbar.classList.remove('hpbar--warning', 'hpbar--danger', 'hpbar--zero');
  if (current <= 0) {
    hpbar.classList.add('hpbar--zero');
  } else if (ratio <= 0.2) {
    hpbar.classList.add('hpbar--danger');
  } else if (ratio <= 0.5) {
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

  const map = MAP.getMap(gameState.player.currentMapId);
  if (!map) return;

  /**
   * マップごとにCanvasの内部解像度を調整する。
   * 横30マスあるマップ3では1マスが約13pxまで縮小され、キャラクターや地形が見えづらくなっていた。
   * マップ3だけ1マス24pxを確保し、横長の720×384として描画する。
   */
  const isLargeMap = map.width >= 24;
  const targetTileSize = isLargeMap ? 24 : 28;
  const requiredWidth = map.width * targetTileSize;
  const requiredHeight = map.height * targetTileSize;

  // サイズが変わる場合だけ更新する。width/heightの代入はCanvasを初期化するため、
  // 毎回無条件に代入すると不要な再初期化が発生する。
  if (canvas.width !== requiredWidth) canvas.width = requiredWidth;
  if (canvas.height !== requiredHeight) canvas.height = requiredHeight;

  // CSS側でもマップ3専用の表示ルールを適用できるようクラスを切り替える。
  canvas.classList.toggle('canvas-map--large', isLargeMap);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const mapId = gameState.player.currentMapId;
  const progress = gameState.mapProgress[mapId];
  const repairedTiles = progress ? progress.repairedTiles : [];
  const openedChestIds = progress ? progress.openedChestIds : [];

  const tileSize = Math.floor(Math.min(canvas.width / map.width, canvas.height / map.height));
  const offsetX = Math.floor((canvas.width - tileSize * map.width) / 2);
  const offsetY = Math.floor((canvas.height - tileSize * map.height) / 2);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // マップ外周を濃紺のグラデーションにし、盤面を浮かび上がらせる。
  const outerBackground = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  outerBackground.addColorStop(0, '#17233b');
  outerBackground.addColorStop(1, '#030712');
  ctx.fillStyle = outerBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /** 座標から毎回同じ0～1の値を作る。草や道の模様が描画ごとにちらつくのを防ぐ。 */
  const coordinateNoise = (x, y, salt = 0) => {
    const value = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453;
    return value - Math.floor(value);
  };

  /** 1マスを、地形ごとの陰影・模様付きで描画する。 */
  const drawDecoratedTile = (tile, x, y) => {
    const px = offsetX + x * tileSize;
    const py = offsetY + y * tileSize;
    const tileGradient = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);

    const colors = {
      [MAP.TILE_TYPE.GRASS]: ['#79b956', '#4f813c'],
      [MAP.TILE_TYPE.PATH]: ['#e3c38e', '#b98d59'],
      [MAP.TILE_TYPE.RIVER]: ['#57bdf1', '#256fae'],
      [MAP.TILE_TYPE.BRIDGE]: ['#a67a4d', '#694728'],
      [MAP.TILE_TYPE.BROKEN_BRIDGE]: ['#34201b', '#100807'],
    };
    const pair = colors[tile] || ['#777', '#444'];
    tileGradient.addColorStop(0, pair[0]);
    tileGradient.addColorStop(1, pair[1]);
    ctx.fillStyle = tileGradient;
    ctx.fillRect(px, py, tileSize, tileSize);

    // 左上に光、右下に影を入れてタイルに厚みを出す。
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(px + 0.5, py + tileSize - 0.5);
    ctx.lineTo(px + 0.5, py + 0.5);
    ctx.lineTo(px + tileSize - 0.5, py + 0.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.moveTo(px + tileSize - 0.5, py + 0.5);
    ctx.lineTo(px + tileSize - 0.5, py + tileSize - 0.5);
    ctx.lineTo(px + 0.5, py + tileSize - 0.5);
    ctx.stroke();

    if (tile === MAP.TILE_TYPE.GRASS && tileSize >= 8) {
      // 草むらには固定位置の小さな葉を描き、単色の盤面に見えないようにする。
      ctx.strokeStyle = 'rgba(226,255,190,0.35)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i += 1) {
        const gx = px + 2 + coordinateNoise(x, y, i) * Math.max(1, tileSize - 4);
        const gy = py + 3 + coordinateNoise(x, y, i + 4) * Math.max(1, tileSize - 5);
        ctx.beginPath();
        ctx.moveTo(gx, gy + 2);
        ctx.lineTo(gx - 1, gy);
        ctx.moveTo(gx, gy + 2);
        ctx.lineTo(gx + 1, gy - 1);
        ctx.stroke();
      }
    } else if (tile === MAP.TILE_TYPE.PATH && tileSize >= 8) {
      ctx.fillStyle = 'rgba(80,51,25,0.22)';
      const sx = px + 2 + coordinateNoise(x, y, 7) * Math.max(1, tileSize - 5);
      const sy = py + 2 + coordinateNoise(x, y, 8) * Math.max(1, tileSize - 5);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    } else if (tile === MAP.TILE_TYPE.RIVER && tileSize >= 8) {
      // 川には短い波線を入れる。
      ctx.strokeStyle = 'rgba(220,247,255,0.48)';
      ctx.beginPath();
      ctx.moveTo(px + tileSize * 0.15, py + tileSize * 0.38);
      ctx.quadraticCurveTo(px + tileSize * 0.5, py + tileSize * 0.22, px + tileSize * 0.85, py + tileSize * 0.38);
      ctx.moveTo(px + tileSize * 0.25, py + tileSize * 0.7);
      ctx.quadraticCurveTo(px + tileSize * 0.55, py + tileSize * 0.56, px + tileSize * 0.78, py + tileSize * 0.68);
      ctx.stroke();
    } else if (tile === MAP.TILE_TYPE.BRIDGE && tileSize >= 7) {
      // 橋は板を並べたような線を描く。
      ctx.strokeStyle = 'rgba(40,22,10,0.55)';
      for (let line = 0.25; line < 1; line += 0.25) {
        ctx.beginPath();
        ctx.moveTo(px, py + tileSize * line);
        ctx.lineTo(px + tileSize, py + tileSize * line);
        ctx.stroke();
      }
    } else if (tile === MAP.TILE_TYPE.BROKEN_BRIDGE) {
      ctx.strokeStyle = 'rgba(255,140,100,0.35)';
      ctx.beginPath();
      ctx.moveTo(px + tileSize * 0.15, py + tileSize * 0.2);
      ctx.lineTo(px + tileSize * 0.52, py + tileSize * 0.48);
      ctx.lineTo(px + tileSize * 0.34, py + tileSize * 0.82);
      ctx.stroke();
    }
  };

  map.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      let displayTile = tile;
      if (tile === MAP.TILE_TYPE.BROKEN_BRIDGE && repairedTiles.includes(`${x},${y}`)) {
        displayTile = MAP.TILE_TYPE.BRIDGE;
      }
      drawDecoratedTile(displayTile, x, y);
    });
  });

  // 盤面外周を二重線で囲み、フレーム感を出す。
  ctx.strokeStyle = 'rgba(157, 124, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX - 1, offsetY - 1, tileSize * map.width + 2, tileSize * map.height + 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX - 4, offsetY - 4, tileSize * map.width + 8, tileSize * map.height + 8);

  /** 宝箱やボスなど、イベント位置の光彩付きマーカーを描画する。 */
  const drawEventMarker = (x, y, color, kind) => {
    const cx = offsetX + x * tileSize + tileSize / 2;
    const cy = offsetY + y * tileSize + tileSize / 2;
    const radius = Math.max(3, tileSize * 0.3);

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.max(5, tileSize * 0.45);
    ctx.fillStyle = color;

    if (kind === 'chest') {
      const size = radius * 1.45;
      ctx.fillRect(cx - size / 2, cy - size * 0.32, size, size * 0.72);
      ctx.strokeStyle = '#fff2ad';
      ctx.lineWidth = Math.max(1, tileSize * 0.05);
      ctx.strokeRect(cx - size / 2, cy - size * 0.32, size, size * 0.72);
      ctx.fillStyle = '#6f4612';
      ctx.fillRect(cx - 1, cy - 1, 2, Math.max(2, size * 0.25));
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(1, tileSize * 0.06);
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.55, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    ctx.restore();
  };

  /**
   * プレイヤーを丸い記号ではなく、見下ろし型RPGの冒険者として描画する。
   * 頭・髪・マント・胴体・ブーツ・剣を小さな図形に分けることで、
   * 外部画像を追加しなくてもキャラクターらしく見せる。
   */
  const drawPlayerSprite = (x, y, direction) => {
    const cellX = offsetX + x * tileSize;
    const cellY = offsetY + y * tileSize;
    const scale = Math.max(0.55, tileSize / 24);
    const cx = cellX + tileSize / 2;
    const baseY = cellY + tileSize * 0.82;

    ctx.save();

    // 足元の影。キャラクターが地面に立っているように見せる。
    ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY, 7 * scale, 2.7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 向きに合わせて左右反転する。上下は顔・髪の描き分けで表現する。
    const facingLeft = direction === 'left';
    const facingRight = direction === 'right';
    ctx.translate(cx, baseY - 10 * scale);
    if (facingLeft) ctx.scale(-1, 1);

    // マント（背面）。
    ctx.fillStyle = '#b6324a';
    ctx.beginPath();
    ctx.moveTo(-5 * scale, -4 * scale);
    ctx.lineTo(5 * scale, -4 * scale);
    ctx.lineTo(7 * scale, 8 * scale);
    ctx.lineTo(0, 6 * scale);
    ctx.lineTo(-7 * scale, 8 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#641c2a';
    ctx.lineWidth = Math.max(1, scale);
    ctx.stroke();

    // ブーツ。
    ctx.fillStyle = '#3b271d';
    ctx.fillRect(-5 * scale, 6 * scale, 4 * scale, 4 * scale);
    ctx.fillRect(1 * scale, 6 * scale, 4 * scale, 4 * scale);

    // 服とベルト。
    ctx.fillStyle = '#2f72c9';
    ctx.fillRect(-5 * scale, -3 * scale, 10 * scale, 10 * scale);
    ctx.fillStyle = '#e5c15f';
    ctx.fillRect(-5 * scale, 2 * scale, 10 * scale, 2 * scale);
    ctx.fillStyle = '#fff1a6';
    ctx.fillRect(-1 * scale, 2 * scale, 2 * scale, 2 * scale);

    // 剣。横向きでは進行方向側へ、上下では右側へ装備する。
    const swordX = facingLeft ? -8 : 7;
    ctx.strokeStyle = '#dce8f6';
    ctx.lineWidth = Math.max(1.2, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(swordX * scale, -1 * scale);
    ctx.lineTo((swordX + 2) * scale, 7 * scale);
    ctx.stroke();
    ctx.strokeStyle = '#70502d';
    ctx.beginPath();
    ctx.moveTo((swordX - 2) * scale, 0);
    ctx.lineTo((swordX + 2) * scale, -1 * scale);
    ctx.stroke();

    // 頭と髪。
    ctx.fillStyle = '#f2c39f';
    ctx.fillRect(-4 * scale, -10 * scale, 8 * scale, 7 * scale);
    ctx.fillStyle = '#5b3426';
    ctx.fillRect(-5 * scale, -12 * scale, 10 * scale, 4 * scale);
    ctx.fillRect(-5 * scale, -9 * scale, 2 * scale, 4 * scale);

    // 下向き・横向きのときだけ目を描く。上向きは後頭部を見せる。
    if (direction !== 'up') {
      ctx.fillStyle = '#172033';
      if (facingRight || facingLeft) {
        ctx.fillRect(2 * scale, -7 * scale, Math.max(1, scale), Math.max(1, scale));
      } else {
        ctx.fillRect(-2.5 * scale, -7 * scale, Math.max(1, scale), Math.max(1, scale));
        ctx.fillRect(1.5 * scale, -7 * scale, Math.max(1, scale), Math.max(1, scale));
      }
    }

    // 輪郭を軽く発光させ、地形の上でも見失いにくくする。
    ctx.globalCompositeOperation = 'destination-over';
    ctx.shadowColor = 'rgba(89, 174, 255, 0.85)';
    ctx.shadowBlur = 7 * scale;
    ctx.fillStyle = 'rgba(67, 140, 255, 0.18)';
    ctx.fillRect(-7 * scale, -12 * scale, 14 * scale, 22 * scale);
    ctx.restore();
  };
  if (Array.isArray(map.itemsOnMap)) {
    map.itemsOnMap.forEach(chest => {
      // 開封済みの宝箱は消し、取得済みであることを盤面にも反映する。
      if (!openedChestIds.includes(chest.chestId)) {
        drawEventMarker(chest.pos[0], chest.pos[1], '#f6c945', 'chest');
      }
    });
  }

  if (Array.isArray(map.bossPos) && map.bossPos.length === 2 && !progress?.bossDefeated) {
    drawEventMarker(map.bossPos[0], map.bossPos[1], '#ff5a69', 'boss');
  }

  if (gameState.player && gameState.player.pos) {
    drawPlayerSprite(gameState.player.pos.x, gameState.player.pos.y, explorePlayerDirection);
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
        // マップ選択
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

// 探索演出の終了タイマーをクラス名ごとに保持する。
// 同じ操作を連続した場合、古いタイマーが新しい演出を消さないようにする。
const exploreEffectTimers = {};

/**
 * 探索画面へ一時的にCSSクラスを付け、演出を再生する共通関数。
 * 見た目だけを変更するため、座標・アイテム・戦闘状態には影響しない。
 * @param {string} effectClass 演出用CSSクラス
 * @param {number} durationMs 演出時間
 */
function playExploreEffect(effectClass, durationMs) {
  const container = document.querySelector('#screen-explore .explore-container');
  if (!container) return;

  if (exploreEffectTimers[effectClass]) {
    window.clearTimeout(exploreEffectTimers[effectClass]);
  }

  container.classList.remove(effectClass);
  void container.offsetWidth; // 連続実行時もアニメーションを最初から再生する
  container.classList.add(effectClass);

  exploreEffectTimers[effectClass] = window.setTimeout(() => {
    container.classList.remove(effectClass);
    delete exploreEffectTimers[effectClass];
  }, durationMs);
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

  // 入力された方向へキャラクターの向きを変える。移動できない場合も向きは変わる。
  explorePlayerDirection = direction;

  // 移動処理を実行
  const result = EXPLORE.movePlayer(gameState, direction);

  if (!result.success) {
    setMessage('explore-message', result.message);
    drawExploreMap(gameState);
    // 移動できない場所へ進もうとしたことを、マップの小さな揺れで知らせる。
    playExploreEffect('is-move-blocked', EXPLORE_EFFECT_CONFIG.blockedMoveDurationMs);
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

    // ボスは強い赤、通常敵は暗い赤の遭遇演出に分ける。
    // 演出が見えるよう、短い時間だけ待ってから戦闘画面へ移動する。
    const encounterClass = result.isBoss ? 'is-boss-encounter' : 'is-enemy-encounter';
    const transitionMs = result.isBoss
      ? EXPLORE_EFFECT_CONFIG.bossEncounterDurationMs
      : EXPLORE_EFFECT_CONFIG.enemyEncounterDurationMs;
    playExploreEffect(encounterClass, transitionMs);

    window.setTimeout(() => {
      window.location.assign(`battle.html?enemy=${encodeURIComponent(battleEnemyId)}`);
    }, transitionMs);
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