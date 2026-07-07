const DEFAULT_SETTINGS = {
    bgmVolume: 100,
    seVolume: 100,
    textSpeed: 'normal',
    performance: 'high'
};

const gameSettings = { ...DEFAULT_SETTINGS };
window.gameSettings = gameSettings;

function loadSettingsFromSave() {
    const sharedState = window.GAME_SAVE?.loadSharedGameState?.();
    if (sharedState?.settings) {
        Object.assign(gameSettings, sharedState.settings);
    }
}

function saveSettingsToSharedState() {
    const sharedState = window.GAME_SAVE?.loadSharedGameState?.();
    if (!sharedState) return;
    sharedState.settings = { ...gameSettings };
    window.GAME_SAVE?.saveSharedGameState?.(sharedState);
}

function applySettingsToControls() {
    document.querySelectorAll('.slider').forEach(slider => {
        const value = slider.id === 'bgm-volume' ? gameSettings.bgmVolume : gameSettings.seVolume;
        slider.value = value;
        updateSliderFill(slider);
    });

    document.querySelectorAll('input[name="text-speed"]').forEach(radio => {
        radio.checked = radio.value === gameSettings.textSpeed;
    });

    document.querySelectorAll('input[name="performance"]').forEach(radio => {
        radio.checked = radio.value === gameSettings.performance;
    });

    const fullscreenToggle = document.getElementById('fullscreen');
    if (fullscreenToggle) {
        fullscreenToggle.checked = Boolean(document.fullscreenElement);
    }
}

// スライダーの値をリアルタイムで更新
function updateSliderFill(slider) {
    const sliderContainer = slider.closest('.slider-container');
    const sliderFill = sliderContainer.querySelector('.slider-fill');
    
    // スライダーの値を0～100の範囲で正規化
    const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    
    // フィルバーの幅を更新
    sliderFill.style.width = value + '%';

    // 近くの現在値表示を更新（.slider-current があれば）
    const wrapper = slider.closest('.slider-wrapper');
    if (wrapper) {
        const current = wrapper.querySelector('.slider-current');
        if (current) current.textContent = String(Math.round(slider.value));
    }
}

// 初期化時にスライダーのフィルバーを設定
loadSettingsFromSave();
applySettingsToControls();

document.querySelectorAll('.slider').forEach(slider => {
    // 初期値を設定
    updateSliderFill(slider);
    // 初期の現在値表示（存在する場合）
    const wrapper = slider.closest('.slider-wrapper');
    if (wrapper) {
        const current = wrapper.querySelector('.slider-current');
        if (current) current.textContent = String(Math.round(slider.value));
    }
    
    // 入力時に更新
    slider.addEventListener('input', function() {
        updateSliderFill(this);
        const wrapper = this.closest('.slider-wrapper');
        if (wrapper) {
            const id = this.id;
            if (id === 'bgm-volume') gameSettings.bgmVolume = Number(this.value);
            if (id === 'se-volume') gameSettings.seVolume = Number(this.value);
        }
        saveSettingsToSharedState();
    });
});

// ラジオボタンのキーボード操作対応
document.querySelectorAll('.radio-button').forEach(radio => {
    radio.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const name = this.name;
            const radios = document.querySelectorAll(`input[name="${name}"]`);
            const index = Array.from(radios).indexOf(this);
            const nextRadio = radios[(index + 1) % radios.length];
            nextRadio.checked = true;
            nextRadio.focus();
            saveSettingsToSharedState();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const name = this.name;
            const radios = document.querySelectorAll(`input[name="${name}"]`);
            const index = Array.from(radios).indexOf(this);
            const prevRadio = radios[(index - 1 + radios.length) % radios.length];
            prevRadio.checked = true;
            prevRadio.focus();
            saveSettingsToSharedState();
        }
    });
});

// トグルスイッチのアクセシビリティ
document.querySelectorAll('.toggle-checkbox').forEach(toggle => {
    const updateFullscreenState = () => {
        toggle.checked = Boolean(document.fullscreenElement);
    };

    toggle.addEventListener('change', function() {
        if (this.checked) {
            if (document.fullscreenEnabled) {
                document.documentElement.requestFullscreen().catch(() => {
                    this.checked = false;
                });
            } else {
                this.checked = false;
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {
                    this.checked = true;
                });
            }
        }
    });

    document.addEventListener('fullscreenchange', updateFullscreenState);
    updateFullscreenState();
});

document.querySelectorAll('input[name="text-speed"]').forEach(radio => {
    radio.addEventListener('change', () => {
        gameSettings.textSpeed = document.querySelector('input[name="text-speed"]:checked')?.value || 'normal';
        saveSettingsToSharedState();
    });
});

document.querySelectorAll('input[name="performance"]').forEach(radio => {
    radio.addEventListener('change', () => {
        gameSettings.performance = document.querySelector('input[name="performance"]:checked')?.value || 'high';
        saveSettingsToSharedState();
    });
});

// ミュートボタンの機能
document.querySelectorAll('.mute-button').forEach(button => {
    // 前の音量を保存するデータ属性を初期化
    button.dataset.previousVolume = '100';
    
    button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // ボタンの直前のスライダーを探す
        const sliderWrapper = this.closest('.slider-wrapper');
        const slider = sliderWrapper.querySelector('.slider');
        
        const currentVolume = parseInt(slider.value);
        const previousVolume = parseInt(this.dataset.previousVolume);
        
        // 現在の音量が0以上50未満なら、前の音量に戻す。そうでなければ0にする
        if (currentVolume > 0) {
            // 音量をミュート（0%）
            this.dataset.previousVolume = currentVolume;
            slider.value = 0;
        } else {
            // 前の音量に戻す
            slider.value = previousVolume;
        }
        
        // スライダーのフィルバーを更新
        updateSliderFill(slider);
        saveSettingsToSharedState();
    });
});

// 戻るボタン
const backButton = document.querySelector('.back-button');
if (backButton) {
    backButton.addEventListener('click', function() {
        const storedReturnTarget = sessionStorage.getItem('settings-return-target');
        const referrer = document.referrer;
        const referrerUrl = referrer ? new URL(referrer, window.location.href) : null;
        const referrerPage = referrerUrl ? referrerUrl.pathname.split('/').pop() : '';

        let targetPage = '../title/index.html';

        if (storedReturnTarget === 'explore') {
            targetPage = '../explore/index.html';
        } else if (storedReturnTarget === 'title') {
            targetPage = '../title/index.html';
        } else if (referrerPage === 'index.html' && referrerUrl && referrerUrl.pathname.includes('/explore/')) {
            targetPage = '../explore/index.html';
        } else if (referrerUrl && referrerUrl.pathname.includes('/title/')) {
            targetPage = '../title/index.html';
        }

        window.location.href = targetPage;
    });
}