// 実際の進行状況（コイン・パーティーの強化状態）を rpg-game 側のセーブデータから読み込んで表示します。
const gameState = (window.SAVE && SAVE.hasSavedGame())
    ? SAVE.loadSavedGameState()
    : STATE.sanitizeGameState(STATE.createNewGameState());

// キャラクターの装備タイプに応じたアイコン表示です。
const EQUIPMENT_ICONS = { sword: '⚔️', staff: '🔮', bow: '🏹' };

// HTML の要素を JavaScript から扱えるように取得しています。
const coinValue = document.getElementById('coinValue');
const enhanceGrid = document.getElementById('enhanceGrid');

// 星の数を文字列にして返す関数です。
// 例: level が 2 なら「★★」を返します。
function formatStars(level) {
    return Array.from({ length: level }, () => '★').join('');
}

// コインの表示部分を最新のコイン数に更新します。
function updateCoinDisplay() {
    coinValue.textContent = String(gameState.player.coin);
}

// 1人分のキャラクターカードを作って返す関数です。
// @param {Object} character gameState.party の1要素
// @param {number} index gameState.party 内でのインデックス
function renderCard(character, index) {
    const charData = DATA.CHARACTERS[character.characterId];
    const equipment = DATA.EQUIPMENTS[charData.baseEquipmentId];
    const icon = EQUIPMENT_ICONS[equipment && equipment.type] || '⭐';

    const isMax = character.enhanceLevel >= DATA.CONSTANTS.MAX_ENHANCE_LEVEL;
    const { canUpgrade, reason } = STATE.canUpgradeCharacter(gameState, index);
    const nextCost = !isMax ? DATA.ENHANCE_COSTS[character.characterId][character.enhanceLevel + 1] : null;

    const buttonText = isMax ? 'これ以上強化できません' : '強化';
    const buttonClass = isMax ? 'enhance-button enhance-busy' : 'enhance-button enhance-normal';

    // カード下部に表示するメッセージを決めています。
    const statusText = isMax
        ? 'キャラクターは最大強化済み'
        : canUpgrade
            ? `強化で Lv.${character.enhanceLevel} → Lv.${character.enhanceLevel + 1}`
            : reason;
    const statusClass = isMax ? 'card-status success' : canUpgrade ? 'card-status' : 'card-status alert';

    // 強化ボタンを作成します。
    const button = document.createElement('button');
    button.type = 'button';
    button.className = buttonClass;
    button.disabled = isMax || !canUpgrade;
    button.innerHTML = isMax
        ? buttonText
        : `${buttonText} <span class="enhance-cost"><span class="coin-icon">🪙</span>${nextCost.coin}</span>`;

    // ボタンが押されたときの処理です。
    button.addEventListener('click', () => {
        if (!STATE.canUpgradeCharacter(gameState, index).canUpgrade) return;

        STATE.upgradeCharacter(gameState, index);
        SAVE.saveGameState(gameState);

        updateCoinDisplay();
        renderAllCards();
    });

    // カード全体の見た目を作っています。
    const cardElem = document.createElement('article');
    cardElem.className = 'enhance-card';
    cardElem.innerHTML = `
        <div class="card-header">
            <div class="card-title">
                <strong>${charData.name}</strong>
                <span class="card-meta">HP:${character.hpMax} 攻撃:${character.attack} 防御:${character.defense}</span>
            </div>
            <div class="rank-badge">
                <span class="rank-stars">${formatStars(character.enhanceLevel)}</span>
                <span>${character.enhanceLevel}/${DATA.CONSTANTS.MAX_ENHANCE_LEVEL}</span>
            </div>
        </div>
        <div class="card-frame">
            <span class="card-icon">${icon}</span>
        </div>
        <div class="card-footer">
            <span class="${statusClass}">${statusText}</span>
        </div>
    `;

    // 最大強化の場合は、カードにオーバーレイで「これ以上強化できません」を表示します。
    if (isMax) {
        const overlay = document.createElement('div');
        overlay.className = 'status-overlay';
        overlay.textContent = 'これ以上強化できません。';
        cardElem.appendChild(overlay);
    } else {
        cardElem.appendChild(button);
    }

    return cardElem;
}

// 画面にあるすべてのカードを作り直して表示します。
function renderAllCards() {
    enhanceGrid.innerHTML = ''; // まず古いカードを消します。
    gameState.party.forEach((character, index) => enhanceGrid.appendChild(renderCard(character, index)));
}

// 戻るボタンの設定です。
function setupBackButton() {
    const backButton = document.querySelector('.back-button');
    backButton.addEventListener('click', () => {
        window.location.href = 'rpg-game/explore.html';
    });
}

// 最初に画面を表示するための処理です。
updateCoinDisplay();
renderAllCards();
setupBackButton();
