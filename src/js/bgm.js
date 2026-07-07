(function () {
    const BGM_SRC = './甘茶の音楽工房_フィヨルドの澄んだ風.mp3';
    const DEFAULT_VOLUME = 100;

    const state = {
        audio: null,
        volume: DEFAULT_VOLUME,
        isPlaying: false,
        isInitialized: false
    };

    function ensureAudioElement() {
        if (state.audio) {
            return state.audio;
        }

        const existingAudio = document.getElementById('bgm-audio');
        if (existingAudio) {
            state.audio = existingAudio;
        } else {
            const audio = document.createElement('audio');
            audio.id = 'bgm-audio';
            audio.loop = true;
            audio.preload = 'auto';
            audio.src = BGM_SRC;
            document.body.appendChild(audio);
            state.audio = audio;
        }

        state.audio.volume = state.volume / 100;
        state.audio.setAttribute('data-bgm-managed', 'true');
        return state.audio;
    }

    function applyVolume(nextVolume) {
        const safeVolume = Math.max(0, Math.min(100, Number(nextVolume) || 0));
        state.volume = safeVolume;

        const audio = ensureAudioElement();
        audio.volume = safeVolume / 100;
    }

    function play() {
        const audio = ensureAudioElement();

        if (!audio.src) {
            audio.src = BGM_SRC;
        }

        if (state.isPlaying && !audio.paused) {
            return Promise.resolve();
        }

        if (audio.paused) {
            return audio.play().then(() => {
                state.isPlaying = true;
            }).catch((error) => {
                console.error('BGMの再生に失敗しました:', error);
                state.isPlaying = false;
            });
        }

        state.isPlaying = true;
        return Promise.resolve();
    }

    function pause() {
        const audio = ensureAudioElement();
        if (!audio.paused) {
            audio.pause();
        }
        state.isPlaying = false;
    }

    function setVolume(nextVolume) {
        applyVolume(nextVolume);

        if (state.volume > 0) {
            return play();
        }

        pause();
        return Promise.resolve();
    }

    function initialize() {
        if (state.isInitialized) {
            return;
        }

        state.isInitialized = true;
        ensureAudioElement();
        applyVolume(state.volume);

        const tryPlayOnInteraction = () => {
            if (state.volume > 0) {
                play();
            }
            document.removeEventListener('pointerdown', tryPlayOnInteraction);
            document.removeEventListener('keydown', tryPlayOnInteraction);
        };

        document.addEventListener('pointerdown', tryPlayOnInteraction, { once: true });
        document.addEventListener('keydown', tryPlayOnInteraction, { once: true });

        play().catch(() => {
            // ユーザー操作前の自動再生はブラウザ制限により失敗する場合があるため、ここでは握りつぶす
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    window.bgmManager = {
        initialize,
        play,
        pause,
        setVolume,
        getVolume: () => state.volume,
        getAudio: () => state.audio
    };
})();
