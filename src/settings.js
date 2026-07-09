const DEFAULT_SETTINGS = {
    bgmVolume: 100,
    fullscreen: false
};

let gameSettings = { ...DEFAULT_SETTINGS };
window.gameSettings = gameSettings;

const bgmAudio = document.getElementById('bgm-audio');
let isBgmPlaybackStarted = false;
//let isSePlaybackStarted = false;

function syncSettingsToStore() {
    if (window.settingsStore?.applySettings) {
        window.settingsStore.applySettings(gameSettings);
    }
}

function updateBgmVolume(value) {
    const nextVolume = Number(value);
    gameSettings.bgmVolume = nextVolume;
    syncSettingsToStore();

    if (!bgmAudio) {
        return;
    }

    bgmAudio.volume = nextVolume / 100;

    if (isBgmPlaybackStarted) {
        return;
    }

    try {
        bgmAudio.play().then(() => {
            isBgmPlaybackStarted = true;
        }).catch((error) => {
            console.error('BGMの再生に失敗しました:', error);
        });
    } catch (error) {
        console.error('BGMの再生に失敗しました:', error);
    }
}

// スライダーの値をリアルタイムで更新
function updateSliderFill(slider) {
    const sliderContainer = slider.closest('.slider-container');
    if (!sliderContainer) {
        return;
    }

    const sliderFill = sliderContainer.querySelector('.slider-fill');
    if (!sliderFill) {
        return;
    }

    const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    sliderFill.style.width = value + '%';

    const wrapper = slider.closest('.slider-wrapper');
    if (wrapper) {
        const current = wrapper.querySelector('.slider-current');
        if (current) current.textContent = String(Math.round(slider.value));
    }
}

// 初期化時にスライダーのフィルバーを設定
document.querySelectorAll('.slider').forEach(slider => {
    updateSliderFill(slider);

    const wrapper = slider.closest('.slider-wrapper');
    if (wrapper) {
        const current = wrapper.querySelector('.slider-current');
        if (current) current.textContent = String(Math.round(slider.value));
    }

    slider.addEventListener('input', function() {
        updateSliderFill(this);

        if (this.id === 'bgm-volume') {
            updateBgmVolume(this.value);
        }
    });

    if (slider.id === 'bgm-volume') {
        updateBgmVolume(slider.value);
    }
});

function readPersistedSettings() {
    try {
        const raw = localStorage.getItem('rpg-game-settings');
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('設定の読み込みに失敗しました:', error);
        return null;
    }
}

function applyStoredSettings() {
    const persistedSettings = readPersistedSettings();
    const storedSettings = persistedSettings || (window.settingsStore?.getSettings ? window.settingsStore.getSettings() : null);
    if (!storedSettings) {
        return;
    }

    gameSettings = { ...gameSettings, ...storedSettings };
    window.gameSettings = gameSettings;

    if (window.settingsStore?.applySettings) {
        window.settingsStore.applySettings(gameSettings);
    }

    const bgmSlider = document.getElementById('bgm-volume');
    if (bgmSlider) {
        bgmSlider.value = String(gameSettings.bgmVolume);
        updateSliderFill(bgmSlider);
    }

    const fullscreenToggle = document.getElementById('fullscreen');
    if (fullscreenToggle) {
        fullscreenToggle.checked = Boolean(gameSettings.fullscreen);
    }
}

// トグルスイッチのアクセシビリティ
document.querySelectorAll('.toggle-checkbox').forEach(toggle => {
    const updateFullscreenState = () => {
        toggle.checked = Boolean(document.fullscreenElement);
    };

    toggle.addEventListener('change', function() {
        gameSettings.fullscreen = this.checked;
        syncSettingsToStore();

        if (this.checked) {
            if (document.fullscreenEnabled && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {
                    toggle.checked = Boolean(document.fullscreenElement);
                });
            }
        } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {
                toggle.checked = Boolean(document.fullscreenElement);
            });
        }
    });

    document.addEventListener('fullscreenchange', updateFullscreenState);
    updateFullscreenState();
});

// ミュートボタンの機能
document.querySelectorAll('.mute-button').forEach(button => {
    button.dataset.previousVolume = '100';

    button.addEventListener('click', function(e) {
        e.preventDefault();

        const sliderWrapper = this.closest('.slider-wrapper');
        const slider = sliderWrapper ? sliderWrapper.querySelector('.slider') : null;

        if (!slider) {
            return;
        }

        const currentVolume = parseInt(slider.value);
        const previousVolume = parseInt(this.dataset.previousVolume);

        if (currentVolume > 0) {
            this.dataset.previousVolume = currentVolume;
            slider.value = 0;
        } else {
            slider.value = previousVolume;
        }

        updateSliderFill(slider);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
});

applyStoredSettings();

// 戻るボタン
const backButton = document.querySelector('.back-button');
if (backButton) {
    backButton.addEventListener('click', function() {
        // file:// で開いた場合 document.referrer が空になることがあるため、
        // まず遷移元を明示する ?from= クエリを優先し、無ければ referrer で推測する
        const fromParam = new URLSearchParams(window.location.search).get('from');
        const referrer = document.referrer;
        const referrerUrl = referrer ? new URL(referrer, window.location.href) : null;
        const referrerPage = referrerUrl ? referrerUrl.pathname.split('/').pop() : '';
        let targetPage = 'index.html';

        if (fromParam === 'explore') {
            targetPage = './rpg-game/explore.html';
        } else if (fromParam === 'title') {
            targetPage = 'index.html';
        } else if (referrerPage === 'tansaku.html') {// 探索画面から来た場合は探索画面に戻る.
            targetPage = 'tansaku.html';
        } else if (referrerUrl && referrerUrl.pathname.includes('rpg-game')) {
            targetPage = './rpg-game/explore.html';
        } else if (referrerPage === 'index.html') {// タイトル画面から来た場合はタイトル画面に戻る.
            targetPage = 'index.html';
        }

        window.location.href = targetPage;
    });
}