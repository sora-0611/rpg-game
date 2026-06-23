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
    });
});

// 戻るボタンで title.html に遷移
const backButton = document.querySelector('.back-button');
if (backButton) {
    backButton.addEventListener('click', function() {
        window.location.href = 'title.html';// タイトル画面のファイル名がtitle.htmlである体で書いています。必要であれば修正してください。
    });
}