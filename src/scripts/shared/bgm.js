(function () {
  const bgmManager = {
    audioElement: null,
    volume: 100,

    setAudioElement(audioElement) {
      if (!(audioElement instanceof HTMLMediaElement)) {
        return;
      }
      this.audioElement = audioElement;
      this.audioElement.volume = this.volume / 100;
    },

    setVolume(value) {
      const nextVolume = Number(value);
      this.volume = Number.isFinite(nextVolume) ? Math.max(0, Math.min(100, nextVolume)) : 100;
      if (this.audioElement) {
        this.audioElement.volume = this.volume / 100;
      }
    },

    getVolume() {
      return this.volume;
    },

    play() {
      if (!this.audioElement) {
        return Promise.resolve();
      }
      return this.audioElement.play().catch((error) => {
        console.warn('bgm.js: BGMの再生に失敗しました。', error);
      });
    },

    pause() {
      if (!this.audioElement) {
        return;
      }
      this.audioElement.pause();
    },
  };

  function initBgmAudio() {
    const audio = document.getElementById('bgm-audio');
    if (audio) {
      bgmManager.setAudioElement(audio);
    }
  }

  if (typeof window !== 'undefined') {
    window.bgmManager = bgmManager;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBgmAudio);
  } else {
    initBgmAudio();
  }
})();
