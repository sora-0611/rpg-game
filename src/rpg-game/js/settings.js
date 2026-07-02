/**
 * settings.js
 * 設定画面のUI操作ロジック
 */

function initializeSettings() {
  // スライダーのフィルバーを更新
  function updateSliderFill(slider) {
    const container = slider.closest('.slider-container');
    if (!container) return;
    const fill = container.querySelector('.slider-fill');
    if (!fill) return;

    const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    fill.style.width = value + '%';

    const wrapper = slider.closest('.slider-wrapper');
    if (wrapper) {
      const current = wrapper.querySelector('.slider-current');
      if (current) current.textContent = String(Math.round(slider.value));
    }
  }

  document.querySelectorAll('.settings-slider').forEach(slider => {
    updateSliderFill(slider);
    slider.addEventListener('input', function () {
      updateSliderFill(this);
    });
  });

  // ミュートボタン
  document.querySelectorAll('.mute-btn').forEach(button => {
    button.dataset.previousVolume = '100';
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const wrapper = this.closest('.slider-wrapper');
      const slider = wrapper ? wrapper.querySelector('.settings-slider') : null;
      if (!slider) return;

      const currentVolume = parseInt(slider.value);
      if (currentVolume > 0) {
        this.dataset.previousVolume = currentVolume;
        slider.value = 0;
      } else {
        slider.value = parseInt(this.dataset.previousVolume) || 100;
      }
      const container = slider.closest('.slider-container');
      if (container) {
        const fill = container.querySelector('.slider-fill');
        if (fill) {
          const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
          fill.style.width = value + '%';
        }
      }
      const w = slider.closest('.slider-wrapper');
      if (w) {
        const current = w.querySelector('.slider-current');
        if (current) current.textContent = String(Math.round(slider.value));
      }
    });
  });

  // フルスクリーントグル
  const fullscreenToggle = document.getElementById('fullscreen');
  if (fullscreenToggle) {
    const updateFullscreenState = () => {
      fullscreenToggle.checked = Boolean(document.fullscreenElement);
    };

    fullscreenToggle.addEventListener('change', function () {
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
  }

  // ラジオボタンのキーボード操作
  document.querySelectorAll('.radio-button').forEach(radio => {
    radio.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const radios = document.querySelectorAll(`input[name="${this.name}"]`);
        const index = Array.from(radios).indexOf(this);
        const next = radios[(index + 1) % radios.length];
        next.checked = true;
        next.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const radios = document.querySelectorAll(`input[name="${this.name}"]`);
        const index = Array.from(radios).indexOf(this);
        const prev = radios[(index - 1 + radios.length) % radios.length];
        prev.checked = true;
        prev.focus();
      }
    });
  });
}

if (typeof window !== 'undefined') {
  window.SETTINGS = {
    initialize: initializeSettings,
  };
}
