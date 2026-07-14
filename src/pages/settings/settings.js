const DEFAULT_SETTINGS = {
    bgmVolume: 100,
    //seVolume: 100,SEの実装は時間がかかるので、一旦無しにします.
    textSpeed: 'normal',
    performance: 'high'
};

const gameSettings = { ...DEFAULT_SETTINGS };
window.gameSettings = gameSettings;

const bgmAudio = document.getElementById('bgm-audio');
//const seAudio = document.getElementById('se-audio');
let isBgmPlaybackStarted = false;
//let isSePlaybackStarted = false;

function updateBgmVolume(value) {
    const nextVolume = Number(value);
    gameSettings.bgmVolume = nextVolume;

    // bgm.js の内部状態に反映（セッション中は維持される）
    if (window.bgmManager && typeof window.bgmManager.setVolume === 'function') {
        window.bgmManager.setVolume(nextVolume);
        return; // bgmManager.setVolume() が再生を管理する
    }

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

/*function updateSeVolume(value) {
    const nextVolume = Number(value);
    gameSettings.seVolume = nextVolume;

    if (!seAudio) {
        return;
    }

    seAudio.volume = nextVolume / 100;

    if (isSePlaybackStarted) {
        return;
    }

    try {
        seAudio.currentTime = 0;
        seAudio.play().then(() => {
            isSePlaybackStarted = true;
        }).catch((error) => {
            console.error('SEの再生に失敗しました:', error);
        });
    } catch (error) {
        console.error('SEの再生に失敗しました:', error);
    }
}*/

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
    // BGM音量スライダーの場合、セッションストレージから復元
    if (slider.id === 'bgm-volume' && window.bgmManager && typeof window.bgmManager.getVolume === 'function') {
        const currentBgmVolume = window.bgmManager.getVolume();
        slider.value = currentBgmVolume;
        gameSettings.bgmVolume = currentBgmVolume;
    }

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
        } else if (this.id === 'se-volume') {
            updateSeVolume(this.value);
        }
    });

    if (slider.id === 'bgm-volume') {
        updateBgmVolume(slider.value);
    } else if (slider.id === 'se-volume') {
        updateSeVolume(slider.value);
    }
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
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const name = this.name;
            const radios = document.querySelectorAll(`input[name="${name}"]`);
            const index = Array.from(radios).indexOf(this);
            const prevRadio = radios[(index - 1 + radios.length) % radios.length];
            prevRadio.checked = true;
            prevRadio.focus();
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
        let targetPage = '../title/title.html';

        if (fromParam === 'explore') {
            targetPage = '../explore/explore.html';
        } else if (fromParam === 'title') {
            targetPage = '../title/title.html';
        } else if (referrerPage === 'tansaku.html') {// 探索画面から来た場合は探索画面に戻る.
            targetPage = '../explore/explore.html';
        } else if (referrerUrl && referrerUrl.pathname.includes('explore')) {
            targetPage = '../explore/explore.html';
        } else if (referrerPage === 'title.html') {// タイトル画面から来た場合はタイトル画面に戻る.
            targetPage = '../title/title.html';
        }

        window.location.href = targetPage;
    });
}