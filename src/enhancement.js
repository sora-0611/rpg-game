// 強化画面で表示するパーティーデータをまとめた変数です。
// ここでは「キャラクターが持っている武器」を強化する動きを表現しています。
const partyData = [
    {
        id: 'A',
        name: 'キャラクターA',
        weapon: {
            name: 'ロングソード',// 武器名は仮称です。
            icon: '⚔️',
            level: 1,
            maxLevel: 3,
            cost: 20,
        },
    },
    {
        id: 'B',
        name: 'キャラクターB',
        weapon: {
            name: 'マジックスタッフ',// 武器名は仮称です。
            icon: '🔮',
            level: 1,
            maxLevel: 3,
            cost: 20,
        },
    },
    {
        id: 'C',
        name: 'キャラクターC',
        weapon: {
            name: 'ハンター弓',// 武器名は仮称です。
            icon: '🏹',
            level: 1,
            maxLevel: 3,
            cost: 20,
        },
    }
];

// ゲーム内で使えるコインの総数です。画面の上部に表示されます。
let coins = 400; // コインの初期値(マジックナンバー)です。後で修正が必要です。
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
    coinValue.textContent = String(coins);
}

// 1つのキャラクターの武器カードを作って返す関数です。
function renderCard(card) {
    const weapon = card.weapon;
    const isMax = weapon.level >= weapon.maxLevel; // 武器が最大強化かどうか
    const canAfford = coins >= weapon.cost && weapon.cost > 0; // コインが足りているか
    const buttonText = isMax ? 'これ以上強化できません' : '強化';
    const buttonClass = isMax ? 'enhance-button enhance-busy' : 'enhance-button enhance-normal';
    const buttonDisabled = isMax || !canAfford; // 押せない状態かどうか

    // カード下部に表示するメッセージを決めています。
    const statusText = isMax
        ? '武器は最大強化済み'
        : !canAfford
            ? 'コインが足りません。'
            : `武器強化で★${weapon.level} → ★${weapon.level + 1}`;
    const statusClass = isMax ? 'card-status success' : !canAfford ? 'card-status alert' : 'card-status';

    // 強化ボタンを作成します。
    const button = document.createElement('button');
    button.type = 'button';
    button.className = buttonClass;
    button.disabled = buttonDisabled;
    button.innerHTML = isMax
        ? buttonText
        : `${buttonText} <span class="enhance-cost"><span class="coin-icon">🪙</span>${weapon.cost}</span>`;

    // ボタンが押されたときの処理です。
    button.addEventListener('click', () => {
        if (isMax || !canAfford) return; // 押せない場合は何もしません。

        // コインを減らして武器の強化レベルを上げます。
        coins -= weapon.cost;
        weapon.level = Math.min(weapon.level + 1, weapon.maxLevel);

        // 最大強化になったら以降の強化コストを0にします。
        if (weapon.level === weapon.maxLevel) {
            weapon.cost = 0;
        } else {
            // まだ強化できる場合は次の強化コストを上げます。
            weapon.cost = Math.floor(weapon.cost * 10);
        }

        updateCoinDisplay(); // コイン表示を更新
        renderAllCards(); // カード全体を再描画
    });

    // カード全体の見た目を作っています。
    const cardElem = document.createElement('article');
    cardElem.className = 'enhance-card';
    cardElem.innerHTML = `
        <div class="card-header">
            <div class="card-title">
                <strong>${card.name}</strong>
                <span class="card-meta">武器: ${weapon.name}</span>
            </div>
            <div class="rank-badge">
                <span class="rank-stars">${formatStars(weapon.level)}</span>
                <span>${weapon.level}/${weapon.maxLevel}</span>
            </div>
        </div>
        <div class="card-frame">
            <span class="card-icon">${weapon.icon}</span>
        </div>
        <div class="card-footer">
            <span class="${statusClass}">${statusText}</span>
        </div>
    `;

    // もし最大強化の場合は、カードにオーバーレイで「これ以上強化できません」を表示します。
    if (isMax) {
        const overlay = document.createElement('div');
        overlay.className = 'status-overlay';
        overlay.textContent = 'これ以上強化できません。';
        cardElem.appendChild(overlay);
    }

    // 最大強化でなければ強化ボタンをカードに追加します。
    if (!isMax) {
        cardElem.appendChild(button);
    }

    return cardElem;
}

// 画面にあるすべてのカードを作り直して表示します。
function renderAllCards() {
    enhanceGrid.innerHTML = ''; // まず古いカードを消します。
    partyData.forEach(card => enhanceGrid.appendChild(renderCard(card)));
}

// 戻るボタンの設定です。
function setupBackButton() {
    const backButton = document.querySelector('.back-button');
    backButton.addEventListener('click', () => {
        window.location.href='tansaku.html'; // 探索画面のファイル名がtansaku.htmlである体で書いています。必要であれば修正してください。
    });
}

// 最初に画面を表示するための処理です。
updateCoinDisplay();
renderAllCards();
setupBackButton();